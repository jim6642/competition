(() => {
  const api = window.CompetitionAPI;
  const loginBox = document.getElementById('live-login');
  const postsBox = document.getElementById('live-posts');
  const myPostsBox = document.getElementById('my-posts');
  const myPostsWrap = document.getElementById('my-posts-wrap');
  const conversationsBox = document.getElementById('live-conversations');
  let account = null;
  let conversationReadStorageKey = null;
  let recentConversations = [];
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
  const majorInput = document.getElementById('search-major');
  const gradeInput = document.getElementById('search-grade');
  const count = document.getElementById('live-count');
  const ownLink = document.getElementById('my-posts-link');
  const conversationsLink = document.getElementById('conversations-link');
  const conversationsWrap = document.getElementById('conversations-wrap');
  let feedVersion = 0;
  let loadedFeed = null;
  let feedBusy = false;

  function matchingSkills(post) {
    const skills = new Map(splitProfileList(profile.skills).map(skill => [skill.toLowerCase(), skill]));
    return [...new Set((post.gaps || []).map(tag => skills.get(tag.toLowerCase())).filter(Boolean))];
  }

  function renderPost(post, matches) {
    const p = post.profile || {};
    const contest = matchScenarios[post.competition]?.label || post.competition;
    const skills = splitProfileList(p.skills);
    const gaps = post.gaps || [];
    const members = Array.isArray(post.team?.members) ? post.team.members : [];
    const leader = p.name || post.username;
    const tags = gaps.map(tag => `<span class="chip">${safe(tag)}</span>`).join('');
    return `<article class="live-card">
      <div class="live-card-top"><div><h3>${safe(contest)}</h3><p>${safe([leader, p.school].filter(Boolean).join(' · '))}</p></div><strong class="recruit-badge">还缺 ${Number(post.recruitCount)} 人</strong></div>
      <div class="chips"><span class="muted">想找</span>${tags || '<span>可私聊了解分工</span>'}</div>
      ${matches.length ? `<p class="match-note">你的技能「${safe(matches.join('、'))}」符合这支队伍的招募需求。</p>` : ''}
      <details class="post-details"><summary>查看详情</summary><dl>
        <dt>队长背景</dt><dd>${safe([p.major, p.grade, p.role].filter(Boolean).join(' · ') || '未填写')}</dd>
        <dt>队伍现有成员</dt><dd>${members.length+1} 人（含队长）${members.length ? ` · ${members.map(item => `${safe(item.name)}（${safe(item.role)}）`).join('、')}` : ''}</dd>
        <dt>队长技能</dt><dd>${safe(skills.join('、') || '未填写')}</dd>
        <dt>竞赛经历</dt><dd>${safe(p.experience || '未填写')}</dd>
        <dt>发布时间</dt><dd>${safe(new Date(post.createdAt).toLocaleDateString('zh-CN'))}</dd>
      </dl></details>
      <button class="chat-button live-contact" type="button" data-post-id="${Number(post.id)}" data-person="${safe(leader)}">私聊队长</button>
    </article>`;
  }

  function renderFeed() {
    const major = majorInput.value.trim().toLowerCase();
    const grade = gradeInput.value;
    const filters = Number(Boolean(major)) + Number(Boolean(grade));
    document.getElementById('filter-count').textContent = filters ? `· ${filters} 项` : '';
    if (feedBusy || !loadedFeed || loadedFeed.competition !== competitionChoice.value) return;
    const posts = loadedFeed.posts;
    const eligible = posts.filter(({profile:p = {}}) =>
      (!major || String(p.major || '').toLowerCase().includes(major)) && (!grade || p.grade === grade)
    ).map(post => ({post, matches: matchingSkills(post)})).sort((a, b) => b.matches.length - a.matches.length);
    count.textContent = `${eligible.length} 条`;
    postsBox.innerHTML = eligible.length ? eligible.map(({post, matches}) => renderPost(post, matches)).join('') :
      posts.length ? '<div class="live-empty"><strong>没有符合当前筛选的招募</strong><button type="button" class="secondary-button" data-clear-filters>清除筛选</button></div>' :
      '<div class="live-empty"><strong>这场比赛暂无真实招募</strong><div class="empty-actions"><button type="button" class="chat-button" data-open-publish>发布招募</button><button type="button" class="secondary-button" data-choose-competition>看看其他比赛</button></div></div>';
  }

  function renderOwn(own) {
    const activeOwn = own.filter(post => post.active);
    myPostsWrap.hidden = ownLink.hidden = !activeOwn.length;
    myPostsBox.innerHTML = activeOwn.map(post => `<div class="live-my-post"><div><strong>${safe(matchScenarios[post.competition]?.label || post.competition)}</strong><br><span>招募 ${Number(post.recruitCount)} 人 · ${safe((post.gaps || []).join('、'))}</span></div><button class="live-delete" type="button" data-delete-post="${Number(post.id)}">结束招募</button></div>`).join('');
  }

  async function refreshFeed() {
    if (!account) return;
    const competition = competitionChoice.value;
    const version = ++feedVersion;
    feedBusy = true;
    count.textContent = '';
    postsBox.setAttribute('aria-busy', 'true');
    postsBox.innerHTML = empty(competition ? '正在加载招募…' : '选一场比赛，即可查看正在招募的队伍。');
    try {
      // The API also returns all of this account's own posts, even before choosing a contest.
      const data = await api.request(`/api/team-posts?competition=${encodeURIComponent(competition || Object.keys(matchScenarios)[0])}`);
      if (version !== feedVersion) return;
      renderOwn(data.own);
      loadedFeed = competition ? {competition, posts:data.posts} : null;
      feedBusy = false;
      renderFeed();
    } catch (error) {
      if (version !== feedVersion) return;
      loadedFeed = null;
      postsBox.innerHTML = `<div class="live-empty"><strong>${safe(error.message)}</strong><button type="button" class="secondary-button" data-retry-feed>重试</button></div>`;
    } finally {
      if (version === feedVersion) {
        feedBusy = false;
        postsBox.setAttribute('aria-busy', 'false');
      }
    }
  }

  async function refreshConversations() {
    if (!api.enabled || !account) return;
    try {
      const {conversations} = await api.request('/api/conversations');
      recentConversations = conversations;
      const read = readConversationState();
      let unreadCount = 0;
      conversationsBox.innerHTML = conversations.length ? conversations.map(item => {
        const unread = Number(item.last_sender_id) !== Number(account.id) && Number(item.last_message_id) > (Number(read[item.id]) || 0);
        if (unread) unreadCount += 1;
        return `<button class="live-conversation" type="button" data-conversation-id="${Number(item.id)}" data-person="${safe(item.other_name)}"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><strong>${safe(item.other_name)}</strong>${unread ? '<span style="display:inline-flex;flex:none;padding:2px 7px;border-radius:999px;background:#fef2f2;color:#b91c1c;font-size:.65rem;font-weight:700">新消息</span>' : ''}</div><span>${safe(item.last_message || '会话已建立，发一条消息开始交流')}</span></button>`;
      }).join('') : empty('还没有私聊。可从招募卡片联系队长。');
      conversationsLink.textContent = unreadCount ? '私聊消息 · ' + unreadCount : '私聊消息';
      conversationsWrap.querySelector('.live-subhead').textContent = unreadCount ? `最近私聊 · ${unreadCount} 个会话有新消息` : '最近私聊';
    } catch (error) { conversationsBox.innerHTML = empty(error.message); }
  }

  function showMessage(message, mine) {
    addBubble(message.body, mine);
    lastMessageId = Math.max(lastMessageId, Number(message.id) || 0);
  }

  async function fetchMessages(initial = false) {
    if (!conversationId) return;
    const id = conversationId;
    const query = initial ? '' : `?after=${lastMessageId}`;
    const {messages} = await api.request(`/api/conversations/${conversationId}/messages${query}`);
    if (id !== conversationId) return;
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
    document.getElementById('chat-log').replaceChildren();
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
      if (conversationId !== Number(id)) return;
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
    document.getElementById('chat-input').value = '';
  };

  document.getElementById('publish-current').addEventListener('click', async event => {
    const button = event.currentTarget;
    const feedback = document.getElementById('publish-status');
    const competition = competitionChoice.value;
    const team = teamFor(competition);
    const gaps = [...team.gaps];
    feedback.classList.add('error');
    if (!gaps.length) { feedback.textContent = '请至少选择一个需要补充的领域。'; return; }
    if (!profile.school || !profile.major || !profile.grade) {
      feedback.textContent = '请先在个人中心完善学校、专业和年级。';
      return;
    }
    button.disabled = true;
    feedback.classList.remove('error');
    feedback.textContent = '正在发布…';
    try {
      const members = team.members.map(item => ({name: item.name, role: item.role}));
      await api.request('/api/team-posts', {method: 'POST', body: JSON.stringify({competition, recruitCount: team.recruitCount || 1, gaps, members})});
      publishDialog.close();
      setStatus('招募已发布，可在「我的招募」查看。');
      await refreshFeed();
    } catch (error) { feedback.textContent = error.message; feedback.classList.add('error'); }
    finally { button.disabled = false; }
  });

  document.getElementById('live-posts').addEventListener('click', async event => {
    if (event.target.closest('[data-open-publish]')) return openPublish();
    if (event.target.closest('[data-choose-competition]')) {
      document.getElementById('discovery-title').focus();
      return;
    }
    if (event.target.closest('[data-retry-feed]')) return refreshFeed();
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
        setStatus('这条招募可能已结束，列表已刷新，请选择其他队伍。', true);
      } else setStatus(error.message, true);
    }
    finally { button.disabled = false; }
  });

  document.getElementById('my-posts').addEventListener('click', async event => {
    const button = event.target.closest('[data-delete-post]');
    if (!button || !confirm('结束这条招募？其他同学将不再看到，也不能从招募列表新建私聊。')) return;
    button.disabled = true;
    try { await api.request(`/api/team-posts/${Number(button.dataset.deletePost)}`, {method: 'DELETE'}); setStatus('招募已结束。'); await refreshFeed(); }
    catch (error) { setStatus(error.message, true); button.disabled = false; }
  });

  document.getElementById('live-conversations').addEventListener('click', event => {
    const button = event.target.closest('[data-conversation-id]');
    if (button) openConversation(button.dataset.conversationId, button.dataset.person);
  });

  competitionChoice.addEventListener('change', () => {
    setStatus('');
    refreshFeed();
  });
  [majorInput, gradeInput].forEach(field => field.addEventListener('input', renderFeed));
  document.querySelector('.team-page').addEventListener('click', event => {
    if (!event.target.closest('[data-clear-filters]')) return;
    majorInput.value = gradeInput.value = '';
    renderFeed();
  });
  ownLink.addEventListener('click', () => { myPostsWrap.open = true; });
  conversationsLink.addEventListener('click', () => { conversationsWrap.open = true; });

  async function init() {
    if (!api.enabled) {
      loginBox.innerHTML = '想联系真实队伍？<a href="https://competition.thirdplayer.cn/team.html">前往竞赛站 →</a>';
      loginBox.hidden = false;
      return;
    }
    try {
      const {user} = await api.me();
      if (!user) { loginBox.hidden = false; return; }
      conversationReadStorageKey = `competition.chat.read.v1.account.${user.id}`;
      const {profile: savedProfile} = await api.profile();
      account = user;
      profile = {...savedProfile, name: savedProfile.name || user.username};
      switchTeamState(user.id);
      document.getElementById('real-recruitments').hidden = false;
      publishButton.hidden = false;
      conversationsWrap.hidden = conversationsLink.hidden = false;
      await Promise.all([refreshFeed(), refreshConversations()]);
      setInterval(refreshConversations, 15000);
      const requestedChat = Number(new URLSearchParams(window.location.search).get('chat'));
      const requestedConversation = recentConversations.find(item=>Number(item.id)===requestedChat);
      if (requestedConversation) {
        await openConversation(requestedConversation.id, requestedConversation.other_name);
        history.replaceState(null,'',window.location.pathname);
      }
    } catch (error) {
      setStatus(`账号服务暂不可用：${error.message}`, true);
      loginBox.hidden = false;
    } finally {
      if (!account || publishButton.hidden) postsBox.replaceChildren();
      postsBox.setAttribute('aria-busy', 'false');
    }
  }
  init();
})();
