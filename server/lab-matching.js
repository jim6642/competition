'use strict';
const catalog = require('../lab-catalog');
const experienceLevels = {new:0,course:1,project:2,contest:3,award:4};
const parse = (text, fallback) => {try {return JSON.parse(text);} catch (_) {return fallback;}};
const list = value => String(value || '').split(/[、,，;；\n]+/).map(s=>s.trim()).filter(Boolean);
function validateAnswers(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw Object.assign(new Error('请完成选择后再查看推荐。'),{status:400});
  const answers = {};
  for (const question of catalog.questions) {
    const allowed = new Set(question.options.map(o=>o.value));
    const value = input[question.key];
    if (question.multi) {
      if (!Array.isArray(value) || !value.length || value.length > question.max || value.some(v=>typeof v!=='string'||!allowed.has(v))) throw Object.assign(new Error(`请重新选择「${question.title}」。`),{status:400});
      answers[question.key] = [...new Set(value)];
      if (question.key==='skills' && value.includes('starting') && value.length>1) throw Object.assign(new Error('入门选项与已有能力请分别选择。'),{status:400});
    } else {
      if (typeof value!=='string' || !allowed.has(value)) throw Object.assign(new Error(`请完成「${question.title}」。`),{status:400});
      answers[question.key] = value;
    }
  }
  return answers;
}
function domainsFor(skills) {
  const text = skills.join(' ').toLowerCase();
  const domains = catalog.skillGroups.filter(group=>group.skills.some(skill=>skills.includes(skill))).map(g=>g.domain);
  const patterns = {software:/编程|算法|开发|python|c\+\+|java|代码|qt|云|网络|数据库/,hardware:/硬件|电路|电子|pcb|fpga|verilog|stm32|嵌入式|单片机/,robotics:/机械|视觉|opencv|ros|机器人|solidworks|控制|三维|cad/,data:/数据|数学|统计|matlab|建模|可视化/,design:/设计|figma|产品|原型|视频/,business:/商业|市场|财务|管理|调研/,research:/科研|文献|实验|研究|问卷/,writing:/论文|写作|英文|latex|路演|ppt|表达/};
  return [...new Set([...domains,...Object.entries(patterns).filter(([,re])=>re.test(text)).map(([key])=>key)])];
}
function candidatePool(db, viewerId) {
  const candidates = new Map();
  // Only explicit lab opt-ins and people who have published an active recruitment are discoverable.
  const optedIn = db.prepare(`SELECT u.id,u.username,u.profile_json,l.answers_json FROM lab_profiles l JOIN users u ON u.id=l.user_id WHERE l.discoverable=1 AND u.id!=? ORDER BY l.updated_at DESC LIMIT 500`).all(viewerId);
  const posts = db.prepare(`SELECT u.id,u.username,u.profile_json,p.id AS post_id,p.competition,p.gaps_json FROM team_posts p JOIN users u ON u.id=p.user_id WHERE p.active=1 AND u.id!=? ORDER BY p.created_at DESC LIMIT 500`).all(viewerId);
  for (const row of optedIn) {
    try {candidates.set(row.id,{id:row.id,username:row.username,profile:parse(row.profile_json,{}),answers:validateAnswers(parse(row.answers_json,{})),posts:[]});} catch (_) { /* old questionnaire versions do not become malformed cards */ }
  }
  for (const row of posts) {
    const candidate = candidates.get(row.id) || {id:row.id,username:row.username,profile:parse(row.profile_json,{}),answers:null,posts:[]};
    candidate.posts.push({id:row.post_id,competition:row.competition,gaps:parse(row.gaps_json,[])});
    candidates.set(row.id,candidate);
  }
  return [...candidates.values()];
}
function rankCandidate(answers, candidate) {
  const other = candidate.answers;
  const p = candidate.profile;
  const skills = other ? other.skills.filter(s=>s!=='starting') : list(p.skills);
  const domains = domainsFor(skills);
  const interests = other?.interests || domains;
  const goals = [...new Set([...(other && other.competition!=='unsure'?[other.competition]:[]),...candidate.posts.map(p=>p.competition)])];
  const sameContest = answers.competition!=='unsure' && goals.includes(answers.competition);
  const shared = answers.interests.filter(v=>interests.includes(v));
  const myDomains = domainsFor(answers.skills);
  const fills = answers.interests.filter(d=>domains.includes(d)&&!myDomains.includes(d));
  const otherExperience = other ? experienceLevels[other.experience] : /获奖|一等奖|二等奖|三等奖|带队/.test(p.experience||'')?4:/竞赛|比赛|省赛|国赛/.test(p.experience||'')?3:/项目/.test(p.experience||'')?2:0;
  const myExperience = experienceLevels[answers.experience];
  const reasons = [];
  let score = sameContest?35:answers.competition==='unsure'?14:0;
  if (sameContest) reasons.push(`都关注${catalog.label('competition',answers.competition)}`);
  if (shared.length) {score+=Math.min(25,shared.length*10);reasons.push(`共同兴趣：${shared.map(d=>catalog.label('interests',d)).slice(0,2).join('、')}`);}
  if (answers.preference==='complement'&&fills.length) {score+=20;reasons.push(`可补充${fills.map(d=>catalog.label('interests',d)).slice(0,2).join('、')}能力`);}
  if (answers.preference==='similar') score+=Math.min(20,shared.length*8);
  if (answers.preference==='mentor'&&otherExperience>myExperience) {score+=20;reasons.push('对方拥有更多项目或竞赛经验');}
  if (answers.preference==='peer'&&Math.abs(otherExperience-myExperience)<=1) {score+=20;reasons.push('经历阶段接近，可以一起积累经验');}
  if (other && (other.availability===answers.availability||other.availability==='flexible'||answers.availability==='flexible')) {score+=10;reasons.push('可投入时间比较合拍');}
  if (answers.intent==='join'&&(other?.intent==='recruit'||candidate.posts.length)) {score+=10;reasons.push('对方正在寻找队友');}
  if (answers.intent==='recruit'&&other?.intent==='join') {score+=10;reasons.push('对方希望加入一支队伍');}
  if (!reasons.length) reasons.push('正在组队的真实同学，可以先交流具体方向');
  return {score,userId:candidate.id,name:p.name||candidate.username,school:p.school||'',major:p.major||(other?catalog.label('discipline',other.discipline):''),grade:other&&other.grade!=='other'?other.grade:p.grade||'',skills:skills.slice(0,8),experience:p.experience||(other?catalog.label('experience',other.experience):''),intent:other?.intent||(candidate.posts.length?'recruit':'explore'),competitions:goals,reasons:reasons.slice(0,3),postId:candidate.posts[0]?.id||null};
}
function match(db, userId, answers) {
  const ranked = candidatePool(db,userId).map(c=>rankCandidate(answers,c)).sort((a,b)=>b.score-a.score||a.userId-b.userId);
  return {matches:ranked.slice(0,24).map(({score,...publicFields})=>publicFields),total:ranked.length};
}
module.exports = {validateAnswers,domainsFor,candidatePool,rankCandidate,match};
