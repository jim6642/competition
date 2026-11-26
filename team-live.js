(() => {
  const api = window.CompetitionAPI;
  const loginBox = document.getElementById('live-login');
  const postsBox = document.getElementById('live-posts');
  const myPostsBox = document.getElementById('my-posts');
  const myPostsWrap = document.getElementById('my-posts-wrap');
  const conversationsBox = document.getElementById('live-conversations');
  const majorInput = document.getElementById('search-major');
  const gradeInput = document.getElementById('search-grade');
  const matchedInput = document.getElementById('filter-matched');
  const personaInput = document.getElementById('filter-persona');
  const myPersonaLink = document.getElementById('my-persona-link');
  const count = document.getElementById('live-count');
  const ownLink = document.getElementById('my-posts-link');
  const conversationsLink = document.getElementById('conversations-link');
  const conversationsWrap = document.getElementById('conversations-wrap');

  let account = null;
  let conversationReadStorageKey = null;
  let recentConversations = [];
  let ownPosts = [];
  let liveTimer = null;
  let conversationId = null;
  let lastMessageId = 0;
  let feedVersion = 0;
  let loadedFeed = null;
  let feedBusy = false;

  function safe(value) { return escapeHtml(value == null ? '' : value); }
  function empty(text) { return `<div class="live-empty">${safe(text)}</div>`; }

  function togglePanel(panel, trigger, forceOpen = null) {
    const willOpen = forceOpen === null ? panel.hidden : forceOpen;
    [myPostsWrap, conversationsWrap].forEach(item => {
      if (item !== panel) item.hidden = true;
    });
    [ownLink, conversationsLink].forEach(btn => {
      if (btn !== trigger) btn.setAttribute('aria-expanded', 'false');
    });
    panel.hidden = !willOpen;
    trigger.setAttribute('aria-expanded', String(willOpen));
  }

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
    try { localStorage.setItem(conversationReadStorageKey, JSON.stringify(read)); } catch (_) {}
  }

  const requestedPostId = Number(new URLSearchParams(window.location.search).get('post')) || 0;
  let highlightedPostDone = false;

  function myPersonalityId() {
    return profile.personality || (window.getLocalPersonality ? getLocalPersonality() : '');
  }

  function updateMyPersonaLink() {
    if (!myPersonaLink) return;
    const meta = window.COMPETITION_PERSONALITIES?.[myPersonalityId()];
    if (meta) {
      myPersonaLink.textContent = `我的人格：${meta.emoji} ${meta.title}`;
      myPersonaLink.title = '点击查看或重测竞赛人格';
    } else {
      myPersonaLink.textContent = '✨ 测测你的竞赛人格';
    }
  }

  function matchingSkills(post) {
    const skills = new Map(splitProfileList(profile.skills).map(skill => [skill.toLowerCase(), skill]));
    return [...new Set((post.gaps || []).map(tag => skills.get(tag.toLowerCase())).filter(Boolean))];
  }

  function renderPost(post, matches, fit) {
    const p = post.profile || {};
    const scenario = matchScenarios[post.competition];
    const contestShort = scenario?.short || scenario?.label || post.competition;
    const skills = splitProfileList(p.skills);
    const gaps = post.gaps || [];
    const matchSet = new Set(matches.map(item => item.toLowerCase()));
    const members = Array.isArray(post.team?.members) ? post.team.members : [];
    const note = typeof post.team?.note === 'string' ? post.team.note.trim() : '';
    const leader = p.name || post.username;
    const meta = [p.school, p.major, p.grade].filter(Boolean).join(' · ');
    const pMeta = window.COMPETITION_PERSONALITIES?.[p.personality];
    const personaBadge = pMeta
      ? `<span class="persona-badge" style="background:${pMeta.bg};color:${pMeta.color};border-color:${pMeta.border}" title="${safe(pMeta.role)}">${pMeta.emoji} ${safe(pMeta.title)}</span>`
      : '';
    const fitBanner = fit && fit.badge
      ? `<div class="fit-banner fit-${fit.level}"><strong>${safe(fit.badge)}</strong><span>${safe(fit.reason)}</span></div>`
      : '';
    const tags = gaps.map(tag => {
      const matched = matchSet.has(tag.toLowerCase());
      return `<span class="chip${matched ? ' chip-match' : ''}">${matched ? '✓ ' : ''}${safe(tag)}</span>`;
    }).join('');
    const highlighted = requestedPostId && Number(post.id) === requestedPostId;
    return `<article class="live-card${highlighted ? ' post-highlight' : ''}" data-card-post-id="${Number(post.id)}">
      <div class="live-card-top">
        <div class="card-identity">
          <span class="contest-tag">${safe(contestShort)}</span>
          <strong>${safe(leader)}</strong>
          ${personaBadge}
          ${meta ? `<span class="card-meta">${safe(meta)}</span>` : ''}
        </div>
        <strong class="recruit-badge">缺 ${Number(post.recruitCount)} 人</strong>
      </div>
      ${fitBanner}
      ${note ? `<p class="card-note">${safe(note)}</p>` : ''}
      <div class="chips"><span class="muted">想找</span>${tags || '<span class="muted">可私聊了解分工</span>'}</div>
      <div class="live-card-bottom">
        <details class="post-details"><summary>查看详情</summary><dl>
          <dt>目标比赛</dt><dd>${safe(scenario?.label || post.competition)}</dd>
          ${pMeta ? `<dt>队长人格</dt><dd>${pMeta.emoji} ${safe(pMeta.title)} · ${safe(pMeta.role)}</dd>` : ''}
          <dt>队长定位</dt><dd>${safe(p.role || '未填写')}</dd>
          <dt>现有成员</dt><dd>${members.length + 1} 人（含队长）${members.length ? ` · ${members.map(item => `${safe(item.name)}（${safe(item.role)}）`).join('、')}` : ''}</dd>
          <dt>队长技能</dt><dd>${safe(skills.join('、') || '未填写')}</dd>
          <dt>竞赛经历</dt><dd>${safe(p.experience || '未填写')}</dd>
          <dt>发布时间</dt><dd>${safe(new Date(post.createdAt).toLocaleDateString('zh-CN'))}</dd>
        </dl></details>
        <button class="chat-button live-contact" type="button" data-post-id="${Number(post.id)}" data-person="${safe(leader)}">私聊队长</button>
      </div>
    </article>`;
  }

  function renderFeed() {
    updateMyPersonaLink();
    const major = majorInput.value.trim().toLowerCase();
    const grade = gradeInput.value;
    const onlyMatched = matchedInput.checked;
    const onlyPersona = Boolean(personaInput && personaInput.checked);
    const filters = Number(Boolean(major)) + Number(Boolean(grade)) + Number(onlyMatched) + Number(onlyPersona);
    document.getElementById('filter-count').textContent = filters ? `· ${filters} 项` : '';
    const activeCompetition = competitionChoice.value || 'all';
    if (feedBusy || !loadedFeed || loadedFeed.competition !== activeCompetition) return;
    const myPersona = myPersonalityId();
    const posts = loadedFeed.posts;
    const eligible = posts
      .map(post => ({
        post,
        matches: matchingSkills(post),
        fit: myPersona && window.getPersonalityFit ? getPersonalityFit(myPersona, post.profile?.personality) : null
      }))
      .filter(({post: {profile: p = {}}, matches, fit}) =>
        (!major || String(p.major || '').toLowerCase().includes(major)) &&
        (!grade || p.grade === grade) &&
        (!onlyMatched || matches.length > 0) &&
        (!onlyPersona || (fit && (fit.level === 'best' || fit.level === 'good')))
      )
      .sort((a, b) => ((b.fit?.score || 0) * 10 + b.matches.length) - ((a.fit?.score || 0) * 10 + a.matches.length));
    count.textContent = `${eligible.length} 条`;
    if (eligible.length) {
      postsBox.innerHTML = eligible.map(({post, matches, fit}) => renderPost(post, matches, fit)).join('');
      if (requestedPostId && !highlightedPostDone) {
        const targetCard = postsBox.querySelector(`[data-card-post-id="${requestedPostId}"]`);
        if (targetCard) {
          highlightedPostDone = true;
          targetCard.scrollIntoView({behavior: 'smooth', block: 'center'});
        }
      }
      return;
    }
    if (posts.length) {
      const hint = onlyPersona && !myPersona
        ? '你还没有测过竞赛人格。<a href="personality.html">去测测竞赛人格 →</a>'
        : '没有符合当前筛选的招募';
      postsBox.innerHTML = `<div class="live-empty"><strong>${hint}</strong><button type="button" class="secondary-button" data-clear-filters>清除筛选</button></div>`;
      return;
    }
    postsBox.innerHTML = activeCompetition === 'all'
      ? '<div class="live-empty"><strong>暂时还没有其他同学发布招募</strong><div class="empty-actions"><button type="button" class="chat-button" data-open-publish>＋ 发布第一条招募</button></div></div>'
      : '<div class="live-empty"><strong>这场比赛暂时还没有招募</strong><div class="empty-actions"><button type="button" class="chat-button" data-open-publish>＋ 发布招募</button><button type="button" class="secondary-button" data-show-all>查看全部比赛</button></div></div>';
  }

  function renderOwn(own) {
    ownPosts = account ? (own || []).filter(post => post.active) : [];
    ownLink.hidden = !ownPosts.length;
    ownLink.textContent = ownPosts.length ? `我的招募 · ${ownPosts.length}` : '我的招募';
    if (!ownPosts.length) {
      myPostsWrap.hidden = true;
      ownLink.setAttribute('aria-expanded', 'false');
    }
    myPostsBox.innerHTML = ownPosts.map(post => {
      const scenario = matchScenarios[post.competition];
      const title = scenario?.short || scenario?.label || post.competition;
      const note = post.team?.note ? ` · ${post.team.note}` : '';
      return `<div class="live-my-post">
        <div class="my-post-info">
          <div class="my-post-title"><span class="contest-tag">${safe(title)}</span><strong>缺 ${Number(post.recruitCount)} 人</strong></div>
          <span class="my-post-meta">想找：${safe((post.gaps || []).join('、'))}${safe(note)}</span>
        </div>
        <div class="my-post-actions">
          <button class="secondary-button compact-btn" type="button" data-edit-post="${Number(post.id)}">编辑</button>
          <button class="live-delete" type="button" data-delete-post="${Number(post.id)}">结束招募</button>
        </div>
      </div>`;
    }).join('');
  }

  async function refreshFeed() {
    if (!api.enabled) return;
    const competition = competitionChoice.value || 'all';
    const version = ++feedVersion;
    feedBusy = true;
    count.textContent = '';
    postsBox.setAttribute('aria-busy', 'true');
    postsBox.innerHTML = empty('正在加载招募…');
    try {
      const data = await api.request(`/api/team-posts?competition=${encodeURIComponent(competition)}`);
      if (version !== feedVersion) return;
      renderOwn(data.own);
      window.updateContestCounts?.(data.counts || {});
      loadedFeed = {competition, posts: data.posts};
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
        return `<button class="live-conversation" type="button" data-conversation-id="${Number(item.id)}" data-person="${safe(item.other_name)}"><div class="conv-top"><strong>${safe(item.other_name)}</strong>${unread ? '<span class="unread-badge">新消息</span>' : ''}</div><span>${safe(item.last_message || '会话已建立，发一条消息开始交流')}</span></button>`;
      }).join('') : empty('还没有私聊。可从招募卡片联系队长。');
      conversationsLink.textContent = unreadCount ? `私聊消息 · ${unreadCount}` : '私聊消息';
      conversationsLink.classList.toggle('has-unread', unreadCount > 0);
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
    const competition = activeDraftKey();
    const team = teamFor(competition);
    const gaps = [...team.gaps];
    const note = (publishNoteInput.value || '').trim();
    feedback.classList.add('error');
    if (!gaps.length) { feedback.textContent = '请至少选择一个需要补充的领域。'; return; }
    if (!profile.school || !profile.major || !profile.grade) {
      feedback.textContent = '请先在个人中心完善学校、专业和年级。';
      return;
    }
    button.disabled = true;
    feedback.classList.remove('error');
    feedback.textContent = editingPostId ? '正在保存…' : '正在发布…';
    try {
      const members = team.members.map(item => ({name: item.name, role: item.role}));
      const payload = {competition, recruitCount: team.recruitCount || 1, gaps, members, note};
      if (editingPostId) {
        await api.request(`/api/team-posts/${editingPostId}`, {method: 'PUT', body: JSON.stringify(payload)});
        publishDialog.close();
        setStatus('招募已更新。');
      } else {
        await api.request('/api/team-posts', {method: 'POST', body: JSON.stringify(payload)});
        publishDialog.close();
        setStatus('招募已发布，可在「我的招募」查看或编辑。');
      }
      editingPostId = null;
      await refreshFeed();
    } catch (error) { feedback.textContent = error.message; feedback.classList.add('error'); }
    finally { button.disabled = false; }
  });

  document.getElementById('live-posts').addEventListener('click', async event => {
    if (event.target.closest('[data-open-publish]')) {
      if (!account) { window.location.href = 'account.html'; return; }
      return openPublish(null);
    }
    if (event.target.closest('[data-show-all]')) return window.selectContest?.('all');
    if (event.target.closest('[data-retry-feed]')) return refreshFeed();
    const button = event.target.closest('.live-contact');
    if (!button) return;
    if (!account) {
      window.location.href = 'account.html';
      return;
    }
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
    const editBtn = event.target.closest('[data-edit-post]');
    if (editBtn) {
      const target = ownPosts.find(item => Number(item.id) === Number(editBtn.dataset.editPost));
      if (target) openPublish(target);
      return;
    }
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
  matchedInput.addEventListener('change', renderFeed);
  if (personaInput) personaInput.addEventListener('change', renderFeed);
  document.querySelector('.team-page').addEventListener('click', event => {
    const closeBtn = event.target.closest('[data-close-panel]');
    if (closeBtn) {
      const panel = document.getElementById(closeBtn.dataset.closePanel);
      const trigger = closeBtn.dataset.closePanel === 'my-posts-wrap' ? ownLink : conversationsLink;
      if (panel && trigger) togglePanel(panel, trigger, false);
      return;
    }
    if (!event.target.closest('[data-clear-filters]')) return;
    majorInput.value = gradeInput.value = '';
    matchedInput.checked = false;
    if (personaInput) personaInput.checked = false;
    renderFeed();
  });
  ownLink.addEventListener('click', () => togglePanel(myPostsWrap, ownLink));
  conversationsLink.addEventListener('click', () => togglePanel(conversationsWrap, conversationsLink));

  async function init() {
    if (!api.enabled) {
      loginBox.innerHTML = '想联系真实队伍？<a href="https://competition.thirdplayer.cn/team.html">前往竞赛站 →</a>';
      loginBox.hidden = false;
      return;
    }
    document.getElementById('real-recruitments').hidden = false;
    try {
      const {user} = await api.me();
      if (!user) {
        loginBox.innerHTML = '当前为浏览模式；登录后可发布招募或与队长私聊。 <a href="account.html">登录 / 注册</a>';
        loginBox.hidden = false;
        await refreshFeed();
        return;
      }
      conversationReadStorageKey = `competition.chat.read.v1.account.${user.id}`;
      const {profile: savedProfile} = await api.profile();
      account = user;
      profile = {...savedProfile, name: savedProfile.name || user.username};
      switchTeamState(user.id);
      publishButton.hidden = false;
      conversationsLink.hidden = false;
      await Promise.all([refreshFeed(), refreshConversations()]);
      setInterval(refreshConversations, 15000);
      const requestedChat = Number(new URLSearchParams(window.location.search).get('chat'));
      const requestedConversation = recentConversations.find(item => Number(item.id) === requestedChat);
      if (requestedConversation) {
        await openConversation(requestedConversation.id, requestedConversation.other_name);
        history.replaceState(null, '', window.location.pathname);
      }
    } catch (error) {
      setStatus(`账号服务暂不可用：${error.message}`, true);
      loginBox.hidden = false;
    } finally {
      postsBox.setAttribute('aria-busy', 'false');
    }
  }
  init();
})();
