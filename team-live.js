(() => {
  const api = window.CompetitionAPI;
  const loginBox = document.getElementById('live-login');
  const privateBox = document.getElementById('live-authenticated');
  const status = document.getElementById('live-status');
  const postsBox = document.getElementById('live-posts');
  const myPostsBox = document.getElementById('my-posts');
  const myPostsWrap = document.getElementById('my-posts-wrap');
  const conversationsBox = document.getElementById('live-conversations');
  let account = null;
  let conversationReadStorageKey = null;
  let liveTimer = null;
  let conversationId = null;
  let lastMessageId = 0;

  function safe(value) { return escapeHtml(value == null ? '' : value); }
  function empty(text) { return `<div class="live-empty">${safe(text)}</div>`; }
  function readConversationState() {
    if (!conversationReadStorageKey) return {};
    try {
      const value = JSON.parse(localStorage.getItem(conversationReadStorageKey));
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch (_) { return {}; }
  }
  function markConversationRead(id, messageId) {
    if (!conversationReadStorageKey || !Number(messageId)) return;
    const read = readConversationState();
    read[id] = Math.max(Number(read[id]) || 0, Number(messageId) || 0);
    try { localStorage.setItem(conversationReadStorageKey, JSON.stringify(read)); } catch (_) { /* unread badge remains best-effort */ }
  }
  function matchScore(post) {
    const self = profile || {};
    const candidateProfile = post.profile || {};
    const targetCompetition = competitionSelect.value;
    const related = matchScenarios[targetCompetition]?.related || [];
    const direction = targetCompetition === post.competition ? 100 : related.includes(post.competition) ? 75 : 45;
    const experience = self.experience && candidateProfile.experience ? 90 : self.experience || candidateProfile.experience ? 65 : 40;
    const myMajor = String(self.major || '').trim();
    const theirMajor = String(candidateProfile.major || '').trim();
    const major = myMajor && theirMajor && myMajor === theirMajor ? 100 : 65;
    const score = Math.round(direction * .4 + experience * .35 + major * .25);
    const reasons = [];
    if (direction === 100) reasons.push('目标竞赛一致');
    else if (direction === 75) reasons.push('竞赛方向相近');
    if (experience === 90) reasons.push('双方都有竞赛经历');
    else if (experience === 65) reasons.push('有一方具备竞赛经历');
    if (major === 100) reasons.push('专业背景相同');
    return {score, reasons: reasons.join('；') || '可以进一步沟通了解分工'};
  }

  function renderPost(post, match = matchScore(post)) {
    const p = post.profile || {};
    const contest = matchScenarios[post.competition]?.label || post.competition;
    const skills = splitProfileList(p.skills);
    const gaps = post.gaps || [];
    const members = Array.isArray(post.team?.members) ? post.team.members : [];
    const contact = `<button class="chat-button live-contact" type="button" data-post-id="${Number(post.id)}" data-person="${safe(p.name || post.username)}">私聊队长</button>`;
    return `<article class="live-card"><div class="live-card-top"><div><h4>${safe(contest)}</h4><p>${safe(p.name || post.username)} · ${safe(p.school || '学校未填写')}</p></div><span class="live-match">${match.score}% 匹配</span></div><p>${safe(p.major || '专业未填写')} · ${safe(p.grade || '年级未填写')} · 招募 ${Number(post.recruitCount)} 人</p><div><span class="field-label">队伍现有成员</span><p>${members.length ? members.map(item => `${safe(item.name)}（${safe(item.role)}）`).join('、') : '仅公开发起者资料'}</p></div><div><span class="field-label">技能方向</span><div class="chips">${skills.length ? skills.map(tag => `<span class="chip">${safe(tag)}</span>`).join('') : '<span class="candidate-sub">尚未填写</span>'}</div></div><p><strong>竞赛经历：</strong>${safe(p.experience || '尚未填写')}</p><div><span class="field-label">队伍当前缺口</span><div class="chips">${gaps.map(tag => `<span class="gap">${safe(tag)}</span>`).join('')}</div></div><p><strong>推荐理由：</strong>${safe(match.reasons)}</p><div class="live-card-actions"><span class="candidate-sub">发布于 ${safe(new Date(post.createdAt).toLocaleDateString('zh-CN'))}</span>${contact}</div></article>`;
  }

  async function refreshFeed() {
    if (!api.enabled || !account) return;
    const competition = competitionSelect.value;
    try {
      const data = await api.request(`/api/team-posts?competition=${encodeURIComponent(competition)}`);
      const major = document.getElementById('search-major').value.trim().toLocaleLowerCase();
      const grade = document.getElementById('search-grade').value;
      const eligible = data.posts.map(post => ({post, match: matchScore(post)})).filter(({post}) => {
        const p = post.profile || {};
        if (major && !String(p.major || '').toLocaleLowerCase().includes(major)) return false;
        if (grade && p.grade !== grade) return false;
        return true;
      }).sort((a, b) => b.match.score - a.match.score);
      postsBox.innerHTML = eligible.length ? eligible.map(({post, match}) => renderPost(post, match)).join('') : empty('暂时没有符合当前比赛、专业和年级条件的有效招募。可清空专业或年级筛选，查看该比赛下的全部招募。');
      const activeOwn = data.own.filter(post => post.active);
      myPostsWrap.hidden = !activeOwn.length;
      myPostsBox.innerHTML = activeOwn.map(post => `<div class="live-my-post"><div><strong>${safe(matchScenarios[post.competition]?.label || post.competition)}</strong><br><span>招募 ${Number(post.recruitCount)} 人 · ${safe((post.gaps || []).join('、'))}</span></div><button class="live-delete" type="button" data-delete-post="${Number(post.id)}">结束招募</button></div>`).join('');
    } catch (error) { postsBox.innerHTML = empty(error.message); }
  }

  async function refreshConversations() {
    if (!api.enabled || !account) return;
    try {
      const {conversations} = await api.request('/api/conversations');
      const read = readConversationState();
      let unreadCount = 0;
      conversationsBox.innerHTML = conversations.length ? conversations.map(item => {
        const unread = Number(item.last_sender_id) !== Number(account.id) && Number(item.last_message_id) > (Number(read[item.id]) || 0);
        if (unread) unreadCount += 1;
        return `<button class="live-conversation" type="button" data-conversation-id="${Number(item.id)}" data-person="${safe(item.other_name)}"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><strong>${safe(item.other_name)}</strong>${unread ? '<span style="display:inline-flex;flex:none;padding:2px 7px;border-radius:999px;background:#fef2f2;color:#b91c1c;font-size:.65rem;font-weight:700">新消息</span>' : ''}</div><span>${safe(item.last_message || '会话已建立，发一条消息开始交流')}</span></button>`;
      }).join('') : empty('还没有私聊。发布招募后可联系其他队伍。');
      conversationsBox.parentElement.querySelector('.live-subhead').textContent = unreadCount ? `最近私聊 · ${unreadCount} 个会话有新消息` : '最近私聊';
    } catch (error) { conversationsBox.innerHTML = empty(error.message); }
  }

  function showMessage(message, mine) {
    addBubble(message.body, mine);
    lastMessageId = Math.max(lastMessageId, Number(message.id) || 0);
  }

  async function fetchMessages(initial = false) {
    if (!conversationId) return;
    const query = initial ? '' : `?after=${lastMessageId}`;
    const {messages} = await api.request(`/api/conversations/${conversationId}/messages${query}`);
    if (initial) document.getElementById('chat-log').replaceChildren();
    messages.forEach(message => showMessage(message, message.sender_id === account.id));
    if (initial && !messages.length) addBubble('会话已建立。可以先发送你的竞赛资料或当前组队状态。', false);
    if (initial || messages.length) {
      markConversationRead(conversationId, lastMessageId);
      await refreshConversations();
    }
  }

  async function openConversation(id, name) {
    window.clearLiveChat?.();
    conversationId = Number(id);
    lastMessageId = 0;
    previousFocus = document.activeElement;
    document.getElementById('chat-title').textContent = `与 ${name} 私聊`;
    document.getElementById('chat-mode-note').textContent = '真实私聊 · 消息会保存到竞赛站账号';
    document.getElementById('chat-send-note').textContent = '消息仅对会话参与者可见。';
    document.getElementById('chat-send').textContent = '发送消息';
    document.getElementById('chat-input').placeholder = '输入消息……';
    document.getElementById('chat-overlay').hidden = false;
    document.body.style.overflow = 'hidden';
    window.sendLiveChatMessage = sendLiveMessage;
    try {
      await fetchMessages(true);
      liveTimer = setInterval(() => fetchMessages(false).catch(() => {}), 2000);
      document.getElementById('chat-input').focus();
    } catch (error) { addBubble(error.message, false); }
  }

  async function sendLiveMessage(value) {
    const message = String(value || '').trim();
    if (!conversationId || !message) return;
    try {
      const result = await api.request(`/api/conversations/${conversationId}/messages`, {method: 'POST', body: JSON.stringify({message})});
      showMessage(result.message, true);
      document.getElementById('chat-input').value = '';
      document.getElementById('chat-send-note').textContent = '消息已发送';
      refreshConversations();
    } catch (error) { document.getElementById('chat-send-note').textContent = error.message; }
  }

  window.clearLiveChat = () => {
    if (liveTimer) clearInterval(liveTimer);
    liveTimer = null;
    conversationId = null;
    window.sendLiveChatMessage = null;
    document.getElementById('chat-mode-note').textContent = '私聊演示 · 消息只显示在本页，不会发送给真实用户';
    document.getElementById('chat-send-note').textContent = '仅供演示，不会联网发送。';
    document.getElementById('chat-send').textContent = '发送演示消息';
    document.getElementById('chat-input').placeholder = '输入想对这位同学说的话……';
  };

  window.refreshLiveFeed = refreshFeed;
  document.getElementById('publish-current').addEventListener('click', async event => {
    const button = event.currentTarget;
    const team = teamFor(competitionSelect.value);
    const gaps = [...team.gaps];
    if (!gaps.length) { alert('请先在当前队伍情况中选择至少一个能力缺口。'); return; }
    if (!confirm('请先检查个人资料、已有成员与能力缺口。示例队员也会被当作真实队员公开；确认发布后，个人画像、成员姓名/分工和招募需求都会展示给其他参赛同学。')) return;
    button.disabled = true;
    try {
      const members = team.members.map(item => ({name: item.name, role: item.role}));
      await api.request('/api/team-posts', {method: 'POST', body: JSON.stringify({competition: competitionSelect.value, recruitCount: team.recruitCount || 1, gaps, members})});
      status.textContent = '招募已发布，符合条件的同学现在可以看到并联系你。';
      status.classList.remove('error');
      await Promise.all([refreshFeed(), refreshConversations()]);
    } catch (error) { status.textContent = error.message; status.classList.add('error'); }
    finally { button.disabled = false; }
  });

  document.getElementById('live-posts').addEventListener('click', async event => {
    const button = event.target.closest('.live-contact');
    if (!button) return;
    button.disabled = true;
    try {
      const {conversationId: id} = await api.request('/api/conversations', {method: 'POST', body: JSON.stringify({postId: Number(button.dataset.postId)})});
      await refreshConversations();
      await openConversation(id, button.dataset.person);
    } catch (error) {
      if (error.message === '这条招募信息不可联系。') {
        await refreshFeed();
        status.textContent = '这条招募可能已结束，或属于当前登录账号；招募列表已刷新，请选择其他仍有效的队伍。';
      } else {
        status.textContent = error.message;
      }
      status.classList.add('error');
    }
    finally { button.disabled = false; }
  });

  document.getElementById('my-posts').addEventListener('click', async event => {
    const button = event.target.closest('[data-delete-post]');
    if (!button || !confirm('结束这条招募？其他同学将不再看到，也不能从招募列表新建私聊。')) return;
    button.disabled = true;
    try { await api.request(`/api/team-posts/${Number(button.dataset.deletePost)}`, {method: 'DELETE'}); status.textContent = '招募已结束。'; await refreshFeed(); }
    catch (error) { status.textContent = error.message; }
  });

  document.getElementById('live-conversations').addEventListener('click', event => {
    const button = event.target.closest('[data-conversation-id]');
    if (button) openConversation(button.dataset.conversationId, button.dataset.person);
  });

  document.getElementById('competition-select').addEventListener('change', () => { refreshFeed(); });
  ['search-major', 'search-grade'].forEach(id => document.getElementById(id).addEventListener('input', () => refreshFeed()));
  document.getElementById('chat-close').addEventListener('click', () => window.clearLiveChat());
  document.getElementById('chat-overlay').addEventListener('click', event => { if (event.target.id === 'chat-overlay') window.clearLiveChat(); });

  async function init() {
    if (!api.enabled) {
      status.textContent = '当前页面是静态演示版；真实账号和招募功能将在竞赛站域名启用。';
      loginBox.hidden = false;
      loginBox.innerHTML = '登录后发布真实招募、查看队伍信息并开始私聊。<span>（请从竞赛站域名访问）</span>';
      return;
    }
    try {
      const {user} = await api.me();
      if (!user) {
        status.textContent = '登录账号后可发布招募并查看真实队伍。';
        loginBox.hidden = false;
        return;
      }
      account = user;
      conversationReadStorageKey = `competition.chat.read.v1.account.${user.id}`;
      const {profile: savedProfile} = await api.profile();
      profile = {...savedProfile, name: savedProfile.name || user.username};
      switchTeamState(user.id);
      if (matchScenarios[profile.competition]) competitionSelect.value = profile.competition;
      domainPicker.setSelected(teamFor(competitionSelect.value).gaps);
      try { saveProfile(profile); } catch (_) { /* 登录态和服务器资料不依赖浏览器本地存储。 */ }
      renderProfile();
      render(competitionSelect.value);
      privateBox.hidden = false;
      loginBox.hidden = true;
      status.textContent = `已登录 ${user.username}。真实招募按比赛展示；专业和年级为可选筛选，技能标签仅作展示。`;
      await Promise.all([refreshFeed(), refreshConversations()]);
      setInterval(refreshConversations, 15000);
    } catch (error) {
      status.textContent = `账号服务暂不可用：${error.message}`;
      loginBox.hidden = false;
    }
  }
  init();
})();
