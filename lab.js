(() => {
  'use strict';
  const catalog = window.LabCatalog;
  const api = window.CompetitionAPI;
  const $ = id => document.getElementById(id);
  const safe = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const arrow = '<svg class="icon" aria-hidden="true"><use href="#arrow"/></svg>';
  let answers = {}, step = 0, account = null, serverReachable = false;
  let discoverable = false, editing = false, advancing = false, autoAdvanceTimer = null;
  let storageKey = 'competition.lab.v1.guest';
  let submittedAnswers = null, toastTimer = null;
  const summaryLabels = ['组队状态','当前年级','专业方向','感兴趣的方向','已有能力','项目与竞赛经历','目标比赛','每周投入时间','期待的伙伴'];
  function validValue(question,value) {
    const allowed = question.options.map(o=>o.value);
    return question.multi ? Array.isArray(value)&&value.length>0&&value.length<=question.max&&value.every(v=>allowed.includes(v))&&!(question.exclusive&&value.includes(question.exclusive)&&value.length>1) : allowed.includes(value);
  }
  function sanitizeAnswers(source) {
    if (!source || typeof source!=='object') return {};
    const normalized=catalog.normalizeAnswers(source);
    return Object.fromEntries(catalog.questions.filter(q=>validValue(q,normalized[q.key])).map(q=>[q.key,normalized[q.key]]));
  }
  function loadDraft(key) {try {return JSON.parse(localStorage.getItem(key)) || null;} catch (_) {return null;}}
  function persist() {
    try {localStorage.setItem(storageKey,JSON.stringify({answers,step,discoverable}));} catch (_) { /* choices still work for this visit */ }
  }
  function toast(message,error=false) {
    clearTimeout(toastTimer); $('notice').hidden=false; $('notice').textContent=message;
    $('notice').classList.toggle('error',error);
    toastTimer=setTimeout(()=>$('notice').hidden=true,6000);
  }
  function showView(id,focus=true) {
    clearTimeout(autoAdvanceTimer); advancing=false;
    ['intro','quiz','review','results'].forEach(view=>$(view).hidden=view!==id);
    window.scrollTo({top:0,behavior:'instant'});
    if (focus) $(id).querySelector('h1')?.focus({preventScroll:true});
  }
  function answerLabels(question) {
    const value=answers[question.key];
    return (question.multi ? value||[] : value?[value]:[]).map(v=>catalog.label(question.key,v));
  }
  function refreshStart() {
    const count=catalog.questions.filter(q=>validValue(q,answers[q.key])).length;
    $('start-label').textContent=count===9?'看看我的组队选择':count?'继续上次的选择':'开始寻找同频';
  }
  function renderQuestion() {
    const q=catalog.questions[step];
    $('question-tag').textContent=q.tag;
    $('question-title').textContent=q.title;
    $('question-hint').textContent=q.hint;
    $('progress-text').textContent=q.tag;
    $('question-count').textContent=`${String(step+1).padStart(2,'0')} / 09`;
    $('aside-number').innerHTML=`${String(step+1).padStart(2,'0')}<span>/ 09</span>`;
    const completed=catalog.questions.filter(q=>validValue(q,answers[q.key])).length;
    $('progress-track').setAttribute('aria-valuenow',String(completed));
    $('progress-track').innerHTML=catalog.questions.map((question,i)=>`<span class="${i===step?'active':validValue(question,answers[question.key])?'done':''}"></span>`).join('');
    $('live-tags').innerHTML=catalog.questions.flatMap(question=>answerLabels(question)).slice(0,8).map(label=>`<span>${safe(label)}</span>`).join('')||'<span>从第一个选择开始</span>';
    $('choice-mode').textContent=q.multi?'多选 · 选好后继续':'单选 · 选择后继续';
    $('previous').querySelector('span').textContent=editing?'返回确认':step===0?'回到开始':'上一题';
    $('next').innerHTML=(editing?'确认修改':step===8?'完成选择':'继续')+arrow;
    renderOptions();
    showView('quiz');
  }
  function renderOptions() {
    const q=catalog.questions[step];
    const selected=q.multi?answers[q.key]||[]:[answers[q.key]];
    $('options').className=`options ${q.key==='intent'?'intent-options':''} ${q.key==='skills'?'skills-options':''}`;
    if(q.key==='skills') {
      const skillsButton=value=>`<button type="button" class="skill-option" data-value="${safe(value)}" aria-pressed="${selected.includes(value)}">${safe(value)}</button>`;
      const relevant=answers.interests||[];
      $('options').innerHTML=catalog.skillGroups.map((group,i)=>`<details class="skill-group" ${relevant.includes(group.domain)||(!relevant.length&&i===0)?'open':''}><summary>${safe(group.label)}<span>${group.skills.length} 项能力</span></summary><div class="skill-choices">${group.skills.map(skillsButton).join('')}</div></details>`).join('')+`<button type="button" class="skill-option beginner-option" data-value="starting" aria-pressed="${selected.includes('starting')}">我还在入门<small>愿意从学习和基础任务开始</small></button>`;
    } else {
      $('options').innerHTML=q.options.map((option,index)=>`<button type="button" class="option" data-value="${safe(option.value)}" aria-pressed="${selected.includes(option.value)}"><div class="option-top"><span class="option-mark">${safe(option.mark||String(index+1).padStart(2,'0'))}</span><span class="option-check"><svg class="icon" aria-hidden="true"><use href="#check"/></svg></span></div><div><strong>${safe(option.label)}</strong>${option.hint?`<small>${safe(option.hint)}</small>`:''}</div></button>`).join('');
    }
    updateSelectionNote();
  }
  function updateSelectionNote() {
    const q=catalog.questions[step];
    $('selection-note').classList.remove('error');
    $('selection-note').textContent=q.multi?`已选 ${(answers[q.key]||[]).length} / ${q.max} 项`:'可以返回修改，每一步都会保留。';
    $('next').disabled=!validValue(q,answers[q.key]);
  }
  function choose(value) {
    if(advancing)return;
    const q=catalog.questions[step];
    if(!q.options.some(o=>o.value===value))return;
    if(q.multi) {
      let selected=[...(answers[q.key]||[])];
      if(selected.includes(value))selected=selected.filter(v=>v!==value);
      else if(value===q.exclusive)selected=[value];
      else {
        selected=selected.filter(v=>v!==q.exclusive);
        if(selected.length>=q.max){$('selection-note').textContent=`最多选择 ${q.max} 项；可先取消一项。`;$('selection-note').classList.add('error');return;}
        selected.push(value);
      }
      answers[q.key]=selected;
      // Retain the expanded groups and focus while toggling a skill or interest.
      $('options').querySelectorAll('[data-value]').forEach(button=>button.setAttribute('aria-pressed',String(selected.includes(button.dataset.value))));
      updateSelectionNote();persist();
    } else {
      answers[q.key]=value;persist();
      $('options').querySelectorAll('[data-value]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.value===value)));
      $('next').disabled=false;advancing=true;
      autoAdvanceTimer=setTimeout(()=>{advancing=false;next();},220);
    }
  }
  function next() {
    if(!validValue(catalog.questions[step],answers[catalog.questions[step].key]))return;
    if(editing||step===catalog.questions.length-1){editing=false;renderReview();return;}
    step++;persist();renderQuestion();
  }
  function renderReview() {
    const missing=catalog.questions.findIndex(q=>!validValue(q,answers[q.key]));
    if(missing>=0){step=missing;renderQuestion();return;}
    $('answer-summary').innerHTML=catalog.questions.map((q,i)=>`<div class="answer-row"><span class="answer-row-label">${summaryLabels[i]}</span><div class="answer-values">${answerLabels(q).map(label=>`<span>${safe(label)}</span>`).join('<span aria-hidden="true"> / </span>')}</div><button type="button" data-edit="${i}" aria-label="修改${summaryLabels[i]}">修改</button></div>`).join('');
    $('discoverable').checked=discoverable;
    $('review-identity').textContent=account?`名片昵称：${account.profile?.name||account.username}${account.profile?.school?` · ${account.profile.school}`:''}`:'登录后，才会保存到你的账号并展示给其他同学。';
    $('find-matches').innerHTML=(account?'查看推荐队友':'选择完成，看看下一步')+arrow;
    $('review-status').textContent='';$('review-status').classList.remove('error');
    persist();showView('review');
  }
  function resultTags() {
    return ['discipline','interests','skills'].flatMap(key=>answerLabels(catalog.byKey[key])).slice(0,7).map(s=>`<span>${safe(s)}</span>`).join('');
  }
  function loginLink() {
    return serverReachable?'account.html?next=lab.html':'https://competition.thirdplayer.cn/lab.html';
  }
  function login() {
    persist();
    try {sessionStorage.setItem('competition.lab.pendingLogin','1');}catch(_){}
    window.location.href=loginLink();
  }
  function renderResults(data,guest=false) {
    $('result-tags').innerHTML=resultTags();
    $('result-description').textContent=guest?'你的组队选择已经整理好了。登录竞赛站，才能查看和联系真实的参赛同学。':data.total?`找到 ${data.total} 位正在寻找伙伴的同学${data.total>24?'，先推荐其中 24 位':''}。共同目标、兴趣和协作节奏，是我们推荐的参考。`:'选择已保存。暂时还没有其他开启名片或公开招募的同学，晚一点再来看看。';
    $('toggle-discovery').hidden=guest;
    updateDiscoveryButton();
    if(guest) {
      $('match-list').innerHTML=`<div class="empty-state"><svg class="icon" aria-hidden="true"><use href="#people"/></svg><h2>你的同频，值得真实遇见。</h2><p>${serverReachable?'登录后即可查看真实队友。你的选择会在本浏览器中保留，登录回来不用重新回答。':'这里可以完整体验选择过程。真实匹配和私聊在竞赛站提供。'}</p><button class="primary-button" id="result-login">${serverReachable?'登录并查看队友':'前往竞赛站'}${arrow}</button></div>`;
      $('result-login').addEventListener('click',login);
    } else if(!data.matches.length) {
      $('match-list').innerHTML=`<div class="empty-state"><svg class="icon" aria-hidden="true"><use href="#spark"/></svg><h2>好队友，值得再等一下。</h2><p>${discoverable?'你的组队名片已开启。新的伙伴加入后，可以在这里发现彼此。':'你可以开启组队名片，让后来的同学找到你；也可以先去看看组队招募。'}</p><a href="team.html" class="secondary-button">去看看组队招募 <span aria-hidden="true">↗</span></a></div>`;
    } else {
      $('match-list').innerHTML=data.matches.map(person=>`<article class="match-card"><div class="match-card-heading"><div class="person-avatar" aria-hidden="true">${safe(Array.from(person.name)[0]||'同')}</div><div><h2>${safe(person.name)}</h2><p>${safe([person.school,person.grade].filter(Boolean).join(' · ')||'学校 / 年级暂未填写')}</p></div></div><span class="match-status">${safe(catalog.label('intent',person.intent))}</span><div><p>${safe(person.major||'专业暂未填写')}</p><p>${safe(person.competitions.map(c=>catalog.label('competition',c)).join(' / ')||'目标比赛可以一起商量')}</p></div><div class="candidate-tags">${person.skills.length?person.skills.map(s=>`<span>${safe(s)}</span>`).join(''):'<span>愿意从学习和实践开始</span>'}</div><p>${safe(person.experience||'竞赛经历待交流')}</p><ul class="reason-list">${person.reasons.map(reason=>`<li>${safe(reason)}</li>`).join('')}</ul><button type="button" class="primary-button" data-contact="${Number(person.userId)}">打个招呼${arrow}</button></article>`).join('');
    }
    showView('results');
  }
  function updateDiscoveryButton() {
    $('toggle-discovery').textContent=discoverable?'名片已开启 · 点击暂停':'名片未开启 · 点击开启';
  }
  $('start').addEventListener('click',()=>{
    if(catalog.questions.every(q=>validValue(q,answers[q.key]))){renderReview();return;}
    step=catalog.questions.findIndex(q=>!validValue(q,answers[q.key]));
    editing=false;renderQuestion();
  });
  $('options').addEventListener('click',event=>{const button=event.target.closest('[data-value]');if(button)choose(button.dataset.value);});
  $('next').addEventListener('click',()=>{clearTimeout(autoAdvanceTimer);advancing=false;next();});
  $('previous').addEventListener('click',()=>{
    clearTimeout(autoAdvanceTimer);advancing=false;
    if(editing){editing=false;renderReview();return;}
    if(step===0){refreshStart();showView('intro',false);return;}
    step--;persist();renderQuestion();
  });
  $('answer-summary').addEventListener('click',event=>{const button=event.target.closest('[data-edit]');if(button){step=Number(button.dataset.edit);editing=true;renderQuestion();}});
  $('review-back').addEventListener('click',()=>{step=8;editing=false;renderQuestion();});
  $('discoverable').addEventListener('change',()=>{discoverable=$('discoverable').checked;persist();});
  $('find-matches').addEventListener('click',async()=>{
    if(!account){renderResults({matches:[],total:0},true);return;}
    const button=$('find-matches');button.disabled=true;button.textContent='正在寻找合拍的人…';
    $('review-status').textContent='正在保存选择并整理推荐…';$('review-status').classList.remove('error');
    try {
      await api.request('/api/lab/profile',{method:'PUT',body:JSON.stringify({answers,discoverable})});
      submittedAnswers=JSON.parse(JSON.stringify(answers));
      const data=await api.request('/api/lab/matches',{method:'POST',body:JSON.stringify({answers})});
      renderResults(data);
    } catch(error){$('review-status').textContent=error.message;$('review-status').classList.add('error');}
    finally{button.disabled=false;button.innerHTML='查看推荐队友'+arrow;}
  });
  $('edit-answers').addEventListener('click',renderReview);
  $('toggle-discovery').addEventListener('click',async()=>{
    if(!account||!submittedAnswers)return;
    const button=$('toggle-discovery');button.disabled=true;
    try {const result=await api.request('/api/lab/profile',{method:'PUT',body:JSON.stringify({answers:submittedAnswers,discoverable:!discoverable})});discoverable=result.discoverable;persist();updateDiscoveryButton();toast(discoverable?'组队名片已开启，其他同学可以找到你。':'实验室名片已暂停。已发布的招募和已有私聊仍会保留。');}
    catch(error){toast(error.message,true);}finally{button.disabled=false;}
  });
  $('match-list').addEventListener('click',async event=>{
    const button=event.target.closest('[data-contact]');if(!button)return;
    button.disabled=true;button.textContent='正在打开私聊…';
    try{const result=await api.request('/api/conversations',{method:'POST',body:JSON.stringify({labUserId:Number(button.dataset.contact)})});window.location.href=`team.html?chat=${encodeURIComponent(result.conversationId)}`;}
    catch(error){toast(error.message,true);button.disabled=false;button.innerHTML='打个招呼'+arrow;}
  });
  async function init() {
    $('start').disabled=true;
    try {
      if(api.enabled) {
        const result=await api.me();serverReachable=true;account=result.user;
        if(account) {
          storageKey=`competition.lab.v1.account.${account.id}`;
          const remote=await api.request('/api/lab/profile');
          answers=sanitizeAnswers(remote.answers);discoverable=remote.discoverable;
          $('lab-account').textContent=account.username+' ↗';$('lab-account').href='profile.html';
          $('intro-account-note').textContent='你好，'+(account.profile?.name||account.username)+'。问答会单独保存到你的账号。';
        }
      }
    } catch(_){toast('问答可以继续体验，账号服务暂时未连接。');}
    let pending=false;try{pending=sessionStorage.getItem('competition.lab.pendingLogin')==='1';if(account)sessionStorage.removeItem('competition.lab.pendingLogin');}catch(_){}
    const draft=loadDraft(account&&pending?'competition.lab.v1.guest':storageKey);
    if(draft&&Object.keys(sanitizeAnswers(draft.answers)).length){answers=sanitizeAnswers(draft.answers);step=Math.max(0,Math.min(8,Number(draft.step)||0));if(typeof draft.discoverable==='boolean')discoverable=draft.discoverable;}
    if(!account){$('lab-account').href=loginLink();$('lab-account').textContent=serverReachable?'登录 / 注册 ↗':'在竞赛站登录 ↗';}
    $('start').disabled=false;refreshStart();
  }
  init();
})();
