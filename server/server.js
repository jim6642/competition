'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { promisify } = require('node:util');
const Database = require('better-sqlite3');

process.umask(0o077);

const scrypt = promisify(crypto.scrypt);
const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT || 3002);
const HOST = process.env.HOST || '127.0.0.1';
const DB_PATH = path.resolve(process.env.COMPETITION_DB_PATH || path.join(__dirname, 'data.sqlite'));
const SESSION_DAYS = 30;
const MAX_BODY_BYTES = 64 * 1024;
const COMPETITIONS = new Set(['edc', 'robomaster', 'cumcm', 'mcm', 'internet', 'challenge', 'lanqiao', 'icpc', 'mechanical', 'ict']);
const GRADES = new Set(['大一', '大二', '大三', '大四', '研一', '研二', '研三', '博士']);
const PROFILE_LIMITS = {name: 30, school: 60, major: 60, grade: 12, skills: 1200, experience: 1000, competition: 40, role: 80, wanted: 1200};
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webp': 'image/webp', '.txt': 'text/plain; charset=utf-8'
};

fs.mkdirSync(path.dirname(DB_PATH), {recursive: true, mode: 0o700});
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    username_key TEXT NOT NULL UNIQUE,
    password_salt TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    profile_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
  CREATE TABLE IF NOT EXISTS team_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    competition TEXT NOT NULL,
    recruit_count INTEGER NOT NULL,
    gaps_json TEXT NOT NULL,
    team_json TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  );
  CREATE INDEX IF NOT EXISTS team_posts_search ON team_posts(competition, active, created_at DESC);
  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_a INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_b INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    CHECK (user_a < user_b),
    UNIQUE(user_a, user_b)
  );
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  );
  CREATE INDEX IF NOT EXISTS messages_conversation ON messages(conversation_id, id);
`);

const statements = {
  userByName: db.prepare('SELECT * FROM users WHERE username_key = ?'),
  userById: db.prepare('SELECT id, username, profile_json, created_at FROM users WHERE id = ?'),
  insertUser: db.prepare('INSERT INTO users(username, username_key, password_salt, password_hash, profile_json) VALUES (?, ?, ?, ?, ?)'),
  updateProfile: db.prepare('UPDATE users SET profile_json = ? WHERE id = ?'),
  insertSession: db.prepare('INSERT INTO sessions(token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)'),
  sessionUser: db.prepare(`SELECT u.id, u.username, u.profile_json FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?`),
  deleteSession: db.prepare('DELETE FROM sessions WHERE token_hash = ?'),
  addPost: db.prepare('INSERT INTO team_posts(user_id, competition, recruit_count, gaps_json, team_json) VALUES (?, ?, ?, ?, ?)'),
  listPosts: db.prepare(`SELECT p.id, p.user_id, p.competition, p.recruit_count, p.gaps_json, p.team_json, p.created_at, p.updated_at,
      u.username, u.profile_json
    FROM team_posts p JOIN users u ON u.id = p.user_id
    WHERE p.active = 1 AND p.competition = ? ORDER BY p.created_at DESC LIMIT 100`),
  myPosts: db.prepare('SELECT id, competition, recruit_count, gaps_json, team_json, active, created_at FROM team_posts WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'),
  ownPost: db.prepare('SELECT id, user_id, competition FROM team_posts WHERE id = ? AND active = 1'),
  deactivatePost: db.prepare("UPDATE team_posts SET active = 0, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ? AND user_id = ?"),
  conversation: db.prepare('SELECT id FROM conversations WHERE user_a = ? AND user_b = ?'),
  insertConversation: db.prepare('INSERT INTO conversations(user_a, user_b) VALUES (?, ?)'),
  conversationForUser: db.prepare('SELECT id FROM conversations WHERE id = ? AND (user_a = ? OR user_b = ?)'),
  conversations: db.prepare(`SELECT c.id, c.created_at,
      CASE WHEN c.user_a = @uid THEN ub.id ELSE ua.id END AS other_id,
      CASE WHEN c.user_a = @uid THEN ub.username ELSE ua.username END AS other_name,
      (SELECT body FROM messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) AS last_message,
      (SELECT created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) AS last_at
    FROM conversations c JOIN users ua ON ua.id = c.user_a JOIN users ub ON ub.id = c.user_b
    WHERE c.user_a = @uid OR c.user_b = @uid ORDER BY COALESCE(last_at, c.created_at) DESC LIMIT 100`),
  messagesAfter: db.prepare(`SELECT m.id, m.sender_id, u.username AS sender_name, m.body, m.created_at
    FROM messages m JOIN users u ON u.id = m.sender_id
    WHERE m.conversation_id = ? AND m.id > ? ORDER BY m.id ASC LIMIT 200`),
  latestMessages: db.prepare(`SELECT m.id, m.sender_id, u.username AS sender_name, m.body, m.created_at
    FROM messages m JOIN users u ON u.id = m.sender_id
    WHERE m.conversation_id = ? ORDER BY m.id DESC LIMIT 100`),
  insertMessage: db.prepare('INSERT INTO messages(conversation_id, sender_id, body) VALUES (?, ?, ?)')
};

function json(res, status, payload, extraHeaders = {}) {
  res.writeHead(status, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extraHeaders});
  res.end(JSON.stringify(payload));
}

function fail(res, status, message) { json(res, status, {error: message}); }

function cookieValue(req, name) {
  const header = req.headers.cookie || '';
  for (const item of header.split(';')) {
    const [key, ...parts] = item.trim().split('=');
    if (key === name) return parts.join('=');
  }
  return '';
}

function sessionCookie(req, token, maxAge = SESSION_DAYS * 86400) {
  const secure = process.env.NODE_ENV === 'production' || req.headers['x-forwarded-proto'] === 'https';
  return `competition_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}

function tokenHash(token) { return crypto.createHash('sha256').update(token).digest('hex'); }

function currentUser(req) {
  const token = cookieValue(req, 'competition_session');
  if (!token || token.length > 100) return null;
  const row = statements.sessionUser.get(tokenHash(token), Math.floor(Date.now() / 1000));
  if (!row) return null;
  return {id: row.id, username: row.username, profile: safeJson(row.profile_json, {})};
}

function safeJson(value, fallback) {
  try { return JSON.parse(value); } catch (_) { return fallback; }
}

function checkOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return false;
  try {
    const parsed = new URL(origin);
    const expectedHost = req.headers.host;
    if (parsed.host !== expectedHost) return false;
    const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
    return !forwardedProto || parsed.protocol === `${forwardedProto}:`;
  } catch (_) { return false; }
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw Object.assign(new Error('请求内容过大。'), {status: 413});
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  const type = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  if (type !== 'application/json') throw Object.assign(new Error('请求格式无效。'), {status: 415});
  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('object required');
    return parsed;
  } catch (_) { throw Object.assign(new Error('请求内容不是有效 JSON。'), {status: 400}); }
}

function cleanText(value, max, label, required = false) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (required && !text) throw Object.assign(new Error(`${label}不能为空。`), {status: 400});
  if (text.length > max) throw Object.assign(new Error(`${label}不能超过 ${max} 个字符。`), {status: 400});
  return text;
}

function cleanTags(value, label, limit = 30) {
  if (!Array.isArray(value)) throw Object.assign(new Error(`${label}格式无效。`), {status: 400});
  const unique = [...new Set(value.map(item => cleanText(item, 30, label)).filter(Boolean))];
  if (unique.length > limit) throw Object.assign(new Error(`${label}最多选择 ${limit} 项。`), {status: 400});
  return unique;
}

function cleanProfile(input, username = '') {
  const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const profile = {};
  for (const [key, max] of Object.entries(PROFILE_LIMITS)) {
    profile[key] = cleanText(source[key], max, key === 'name' ? '姓名' : key, false);
  }
  if (!profile.name) profile.name = username;
  if (profile.grade && !GRADES.has(profile.grade)) throw Object.assign(new Error('年级选项无效。'), {status: 400});
  if (profile.competition && !COMPETITIONS.has(profile.competition)) throw Object.assign(new Error('目标比赛选项无效。'), {status: 400});
  profile.skills = cleanTags(Array.isArray(source.skills) ? source.skills : String(source.skills || '').split(/[、,，;；\n]+/), '技能方向', 40).join('、');
  profile.wanted = cleanTags(Array.isArray(source.wanted) ? source.wanted : String(source.wanted || '').split(/[、,，;；\n]+/), '希望寻找的队友类型', 40).join('、');
  return profile;
}

const attempts = new Map();
const messageAttempts = new Map();
function allowAuth(req) {
  const key = req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const old = attempts.get(key);
  if (!old || now - old.since > 15 * 60_000) { attempts.set(key, {since: now, count: 1}); return true; }
  old.count += 1;
  return old.count <= 12;
}
setInterval(() => {
  const cutoff = Date.now() - 15 * 60_000;
  for (const [key, value] of attempts) if (value.since < cutoff) attempts.delete(key);
  for (const [key, value] of messageAttempts) if (value.since < cutoff) messageAttempts.delete(key);
  db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(Math.floor(Date.now() / 1000));
}, 60 * 60_000).unref();

function allowMessage(userId) {
  const now = Date.now();
  const entry = messageAttempts.get(userId);
  if (!entry || now - entry.since > 60_000) { messageAttempts.set(userId, {since: now, count: 1}); return true; }
  entry.count += 1;
  return entry.count <= 30;
}

async function createSession(userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  statements.insertSession.run(tokenHash(token), userId, now + SESSION_DAYS * 86400, now);
  return token;
}

function publicPost(row, viewerId = 0) {
  const profile = safeJson(row.profile_json, {});
  const team = safeJson(row.team_json, {});
  return {
    id: row.id, userId: row.user_id, username: row.username,
    profile: {...profile, name: profile.name || row.username},
    competition: row.competition, recruitCount: row.recruit_count,
    gaps: safeJson(row.gaps_json, []), team, createdAt: row.created_at,
    updatedAt: row.updated_at, isMine: row.user_id === viewerId
  };
}

async function handleApi(req, res, url) {
  const method = req.method || 'GET';
  const pathname = url.pathname;
  if (method === 'OPTIONS') {
    if (!checkOrigin(req)) return fail(res, 403, '来源校验失败。');
    res.writeHead(204, {'Access-Control-Allow-Origin': req.headers.origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Vary': 'Origin'});
    return res.end();
  }

  if (pathname.startsWith('/api/') && !['GET', 'HEAD'].includes(method) && !checkOrigin(req)) return fail(res, 403, '来源校验失败，请从竞赛站页面操作。');

  if (pathname === '/api/health' && method === 'GET') return json(res, 200, {ok: true});
  if (pathname === '/api/auth/register' && method === 'POST') {
    if (!allowAuth(req)) return fail(res, 429, '尝试次数过多，请稍后再试。');
    const body = await readBody(req);
    const username = cleanText(body.username, 24, '用户名', true);
    if (!/^[\p{L}\p{N}_-]{2,24}$/u.test(username)) return fail(res, 400, '用户名需为 2–24 位中文、字母、数字、下划线或短横线。');
    if (typeof body.password !== 'string' || body.password.length < 8 || body.password.length > 128) return fail(res, 400, '密码长度需为 8–128 位。');
    const salt = crypto.randomBytes(16);
    const hash = await scrypt(body.password, salt, 64, {N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024});
    const profile = cleanProfile(body.profile, username);
    let userId;
    try { userId = statements.insertUser.run(username, username.toLocaleLowerCase(), salt.toString('hex'), Buffer.from(hash).toString('hex'), JSON.stringify(profile)).lastInsertRowid; }
    catch (error) { if (String(error.code).includes('CONSTRAINT')) return fail(res, 409, '这个用户名已经被使用。'); throw error; }
    const token = await createSession(userId);
    return json(res, 201, {user: {id: userId, username, profile}}, {'Set-Cookie': sessionCookie(req, token)});
  }
  if (pathname === '/api/auth/login' && method === 'POST') {
    if (!allowAuth(req)) return fail(res, 429, '尝试次数过多，请稍后再试。');
    const body = await readBody(req);
    const username = cleanText(body.username, 24, '用户名', true);
    const row = statements.userByName.get(username.toLocaleLowerCase());
    const salt = row ? Buffer.from(row.password_salt, 'hex') : Buffer.alloc(16);
    const expected = row ? Buffer.from(row.password_hash, 'hex') : Buffer.alloc(64);
    const actual = Buffer.from(await scrypt(typeof body.password === 'string' ? body.password.slice(0, 128) : '', salt, 64, {N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024}));
    if (!row || !crypto.timingSafeEqual(actual, expected)) return fail(res, 401, '用户名或密码不正确。');
    const token = await createSession(row.id);
    return json(res, 200, {user: {id: row.id, username: row.username, profile: safeJson(row.profile_json, {})}}, {'Set-Cookie': sessionCookie(req, token)});
  }
  if (pathname === '/api/auth/logout' && method === 'POST') {
    const token = cookieValue(req, 'competition_session');
    if (token) statements.deleteSession.run(tokenHash(token));
    return json(res, 200, {ok: true}, {'Set-Cookie': sessionCookie(req, '', 0)});
  }
  if (pathname === '/api/auth/me' && method === 'GET') {
    const user = currentUser(req);
    return json(res, 200, {user: user ? {id: user.id, username: user.username, profile: user.profile} : null});
  }

  const user = currentUser(req);
  if (pathname.startsWith('/api/') && !user && !['/api/team-posts', '/api/health'].includes(pathname)) return fail(res, 401, '请先登录后继续。');
  if (pathname === '/api/profile' && method === 'GET') return json(res, 200, {profile: user.profile});
  if (pathname === '/api/profile' && method === 'PUT') {
    const profile = cleanProfile(await readBody(req), user.username);
    statements.updateProfile.run(JSON.stringify(profile), user.id);
    return json(res, 200, {profile});
  }
  if (pathname === '/api/team-posts' && method === 'GET') {
    const competition = url.searchParams.get('competition') || '';
    if (!COMPETITIONS.has(competition)) return fail(res, 400, '比赛选项无效。');
    const viewerId = user ? user.id : 0;
    const posts = statements.listPosts.all(competition).filter(row => !user || row.user_id !== user.id).map(row => publicPost(row, viewerId));
    const own = user ? statements.myPosts.all(user.id).map(row => ({id: row.id, competition: row.competition, recruitCount: row.recruit_count, gaps: safeJson(row.gaps_json, []), team: safeJson(row.team_json, {}), active: Boolean(row.active), createdAt: row.created_at})) : [];
    return json(res, 200, {posts, own});
  }
  if (pathname === '/api/team-posts' && method === 'POST') {
    const body = await readBody(req);
    const competition = cleanText(body.competition, 40, '比赛', true);
    if (!COMPETITIONS.has(competition)) return fail(res, 400, '比赛选项无效。');
    const recruitCount = Number(body.recruitCount);
    if (!Number.isInteger(recruitCount) || recruitCount < 1 || recruitCount > 5) return fail(res, 400, '招募人数需为 1–5 人。');
    const gaps = cleanTags(body.gaps, '能力缺口', 20);
    if (!gaps.length) return fail(res, 400, '请至少选择一个需要补充的领域。');
    const profile = cleanProfile(user.profile, user.username);
    if (!profile.school || !profile.major || !profile.grade) return fail(res, 400, '请先在个人中心完善学校、专业和年级。');
    const members = Array.isArray(body.members) ? body.members.slice(0, 9).map(item => ({name: cleanText(item.name, 30, '成员姓名'), role: cleanText(item.role, 40, '成员分工')})) : [];
    const team = {profile, members};
    const result = statements.addPost.run(user.id, competition, recruitCount, JSON.stringify(gaps), JSON.stringify(team));
    const row = {...statements.listPosts.all(competition).find(item => item.id === Number(result.lastInsertRowid)), user_id: user.id, username: user.username, profile_json: JSON.stringify(profile)};
    return json(res, 201, {post: publicPost(row, user.id)});
  }
  const postMatch = pathname.match(/^\/api\/team-posts\/(\d+)$/);
  if (postMatch && method === 'DELETE') {
    const id = Number(postMatch[1]);
    const result = statements.deactivatePost.run(id, user.id);
    if (!result.changes) return fail(res, 404, '招募信息不存在或你没有权限删除。');
    return json(res, 200, {ok: true});
  }
  if (pathname === '/api/conversations' && method === 'GET') {
    return json(res, 200, {conversations: statements.conversations.all({uid: user.id})});
  }
  if (pathname === '/api/conversations' && method === 'POST') {
    const body = await readBody(req);
    const postId = Number(body.postId);
    if (!Number.isInteger(postId) || postId < 1) return fail(res, 400, '招募信息无效。');
    const post = statements.ownPost.get(postId);
    if (!post || post.user_id === user.id) return fail(res, 404, '这条招募信息不可联系。');
    const userA = Math.min(user.id, post.user_id), userB = Math.max(user.id, post.user_id);
    let conversation = statements.conversation.get(userA, userB);
    if (!conversation) {
      try { statements.insertConversation.run(userA, userB); }
      catch (error) { if (!String(error.code).includes('CONSTRAINT')) throw error; }
      conversation = statements.conversation.get(userA, userB);
    }
    return json(res, 200, {conversationId: conversation.id});
  }
  const messagesMatch = pathname.match(/^\/api\/conversations\/(\d+)\/messages$/);
  if (messagesMatch) {
    const conversationId = Number(messagesMatch[1]);
    if (!statements.conversationForUser.get(conversationId, user.id, user.id)) return fail(res, 404, '私聊不存在或你没有权限访问。');
    if (method === 'GET') {
      const after = Math.max(0, Number(url.searchParams.get('after')) || 0);
      const messages = after ? statements.messagesAfter.all(conversationId, after) : statements.latestMessages.all(conversationId).reverse();
      return json(res, 200, {messages});
    }
    if (method === 'POST') {
      if (!allowMessage(user.id)) return fail(res, 429, '消息发送太频繁，请稍后再试。');
      const body = await readBody(req);
      const message = cleanText(body.message, 1000, '消息', true);
      const result = statements.insertMessage.run(conversationId, user.id, message);
      return json(res, 201, {message: {id: result.lastInsertRowid, sender_id: user.id, sender_name: user.username, body: message, created_at: new Date().toISOString()}});
    }
  }
  if (pathname.startsWith('/api/')) return fail(res, 404, '没有找到这个 API。');
  return false;
}

function serveStatic(req, res, url) {
  if (!['GET', 'HEAD'].includes(req.method || 'GET')) return fail(res, 405, '请求方式不支持。');
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch (_) { return fail(res, 400, '页面地址无效。'); }
  if (pathname === '/') pathname = '/index.html';
  if (pathname.includes('\\') || pathname.split('/').some(part => part === '..' || part.startsWith('.')) || pathname.startsWith('/server/')) return fail(res, 404, '页面不存在。');
  const filename = path.resolve(ROOT, `.${pathname}`);
  if (!filename.startsWith(`${ROOT}${path.sep}`) || !fs.existsSync(filename) || !fs.statSync(filename).isFile()) return fail(res, 404, '页面不存在。');
  const type = MIME[path.extname(filename).toLowerCase()];
  if (!type) return fail(res, 404, '页面不存在。');
  const extension = path.extname(filename).toLowerCase();
  const cacheControl = extension === '.html' ? 'no-cache' : ['.js', '.css'].includes(extension) ? 'public, max-age=300' : 'public, max-age=86400';
  res.writeHead(200, {'Content-Type': type, 'Cache-Control': cacheControl, 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'Content-Security-Policy': "default-src 'self' https://cdn.bootcdn.net https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.bootcdn.net; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; base-uri 'self'; frame-ancestors 'none'"});
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(filename).pipe(res);
}

const server = http.createServer(async (req, res) => {
  res.setHeader('X-Frame-Options', 'DENY');
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  try {
    if (url.pathname.startsWith('/api/')) {
      const handled = await handleApi(req, res, url);
      if (handled === false) return fail(res, 404, '没有找到这个 API。');
      return;
    }
    return serveStatic(req, res, url);
  } catch (error) {
    if (res.headersSent) { res.destroy(); return; }
    fail(res, error.status || 500, error.status ? error.message : '服务器暂时无法处理请求。');
    if (!error.status) process.stderr.write(`${new Date().toISOString()} request-error ${error.stack || error.message}\n`);
  }
});

server.headersTimeout = 15_000;
server.requestTimeout = 30_000;
server.listen(PORT, HOST, () => process.stdout.write(`competition-api listening on http://${HOST}:${PORT}\n`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => { db.close(); process.exit(0); }));
