(() => {
  const tracks = {
    arts: {
      title: '文科', icon: 'fa-feather-pointed', description: '写作表达、社会调研、创意策划',
      interests: [
        {title:'调研与写作', icon:'fa-book-open', description:'从访谈和资料中提出问题，写出有说服力的报告。', contests:['challenge','mcm']},
        {title:'产品与商业', icon:'fa-lightbulb', description:'把一个好点子变成产品方案，用路演讲清它的价值。', contests:['internet','challenge']}
      ]
    },
    science: {
      title: '理科', icon: 'fa-flask', description: '数理推导、数据分析、算法研究',
      interests: [
        {title:'数学建模', icon:'fa-chart-line', description:'用数据、公式和代码解决现实问题。', contests:['cumcm','mcm']},
        {title:'算法与推理', icon:'fa-diagram-project', description:'把复杂问题拆成可求解、可验证的步骤。', contests:['icpc','lanqiao','cumcm']}
      ]
    },
    engineering: {
      title: '工科', icon: 'fa-gears', description: '电子硬件、机器人、软件开发',
      interests: [
        {title:'电子与嵌入式', icon:'fa-microchip', description:'搭电路、写固件，把想法做成实物。', contests:['edc','robomaster']},
        {title:'机器人与机械', icon:'fa-robot', description:'从机械结构到控制，让设备真正动起来。', contests:['robomaster','mechanical','edc']},
        {title:'软件与云网', icon:'fa-code', description:'写程序、做系统，也可以探索网络和云服务。', contests:['lanqiao','ict','icpc']}
      ]
    }
  };

  const contests = {
    edc: {image:'edc', projects:['智能巡线小车','便携式测量仪']},
    robomaster: {image:'robomaster', projects:['步兵机器人视觉组','工程机器人结构组']},
    cumcm: {image:'cumcm', projects:['校园出行数据建模','共享单车需求预测']},
    mcm: {image:'mcm', projects:['城市交通建模与英文写作','能源调度与数据可视化']},
    internet: {image:'internet-plus', projects:['校园闲置交易项目','校园无障碍地图']},
    challenge: {image:'challenge-cup', projects:['社区公共服务调研','校园低碳行动研究']},
    lanqiao: {image:'lanqiao', projects:['算法互助训练小组','程序设计赛前集训']},
    icpc: {image:'acm', projects:['图论与数据结构训练队','区域赛模拟训练队']},
    mechanical: {image:'mechanical', projects:['智能分拣装置','可折叠搬运机构']},
    ict: {image:'huawei-ict', projects:['云服务实践小组','校园网络安全实践小组']}
  };

  const root = document.querySelector('.discovery');
  const heading = document.getElementById('discovery-title');
  const description = document.getElementById('discovery-description');
  const options = document.getElementById('discovery-options');
  const back = document.getElementById('discovery-back');
  const stepIndicators = root.querySelectorAll('.discovery-steps li');
  const feed = document.getElementById('recruit-feed');
  const feedHeading = document.getElementById('live-title');
  const demoPosts = document.getElementById('demo-posts');
  let trackKey = '';
  let interestIndex = null;

  function choiceCard({title, icon, description: detail}, action, value, tone) {
    return `<button type="button" class="discovery-option tone-${tone}" data-${action}="${value}">
      <span class="option-icon"><i class="fas ${icon}" aria-hidden="true"></i></span>
      <span class="option-text"><strong>${title}</strong><small>${detail}</small></span>
      <i class="fas fa-arrow-right option-arrow" aria-hidden="true"></i>
    </button>`;
  }

  function contestCard(key) {
    const contest = matchScenarios[key];
    const selected = key === competitionChoice.value;
    return `<button type="button" class="contest-option" data-contest="${key}" aria-pressed="${selected}">
      <img src="assets/images/${contests[key].image}.jpg" alt="">
      <span class="contest-copy"><strong>${contest.label}</strong><small>${contest.description}</small><span class="contest-action">${selected ? '正在查看' : '查看招募'} <i class="fas ${selected ? 'fa-check' : 'fa-arrow-right'}" aria-hidden="true"></i></span></span>
    </button>`;
  }

  function render(moveFocus = true) {
    const step = !trackKey ? 1 : interestIndex === null ? 2 : 3;
    stepIndicators.forEach((indicator, index) => {
      if (index + 1 === step) indicator.setAttribute('aria-current', 'step');
      else indicator.removeAttribute('aria-current');
      indicator.classList.toggle('step-done', index + 1 < step);
    });
    back.hidden = step === 1;
    const track = tracks[trackKey];
    if (step === 1) {
      heading.textContent = '你的专业偏向哪一类？';
      description.textContent = '从你熟悉的学科出发，看看有哪些比赛值得组队。';
      options.innerHTML = Object.entries(tracks).map(([key, value]) => choiceCard(value, 'track', key, key)).join('');
    } else if (step === 2) {
      heading.textContent = '你想做哪一类项目？';
      description.textContent = `${track.title} · 选一个你感兴趣的方向`;
      options.innerHTML = track.interests.map((item, index) => choiceCard(item, 'interest', index, trackKey)).join('');
    } else {
      const interest = track.interests[interestIndex];
      heading.textContent = '挑一场你想参加的比赛';
      description.textContent = `${track.title} / ${interest.title}`;
      options.innerHTML = interest.contests.map(contestCard).join('');
    }
    if (moveFocus) heading.focus();
  }

  function showDemos(key) {
    const scenario = matchScenarios[key];
    demoPosts.innerHTML = contests[key].projects.map((project, index) => {
      const gaps = index === 0 ? scenario.gaps.slice(0, 2) : scenario.gaps.slice(-2);
      const members = index === 0 ? scenario.members : scenario.members.slice(0, 1);
      return `<article class="demo-card">
        <div class="demo-card-top"><span class="demo-mark">演示</span><span class="recruit-badge">还缺 ${2 - index} 人</span></div>
        <h4>${project}</h4>
        <div class="chips"><span class="muted">想找</span>${gaps.map(gap => `<span class="demo-tag">${gap}</span>`).join('')}</div>
        <details class="post-details"><summary>查看详情</summary><p>已有 ${members.length} 人，负责${members.join('、')}。</p><p>${scenario.description}</p><p class="muted">虚拟队伍，仅供演示。</p></details>
      </article>`;
    }).join('');
  }

  function selectContest(key) {
    competitionChoice.value = key;
    options.querySelectorAll('[data-contest]').forEach(button => {
      const selected = button.dataset.contest === key;
      button.setAttribute('aria-pressed', String(selected));
      button.querySelector('.contest-action').innerHTML = selected
        ? '正在查看 <i class="fas fa-check" aria-hidden="true"></i>'
        : '查看招募 <i class="fas fa-arrow-right" aria-hidden="true"></i>';
    });
    document.getElementById('discovery-status').textContent = '';
    document.getElementById('feed-competition').textContent = matchScenarios[key].label;
    showDemos(key);
    feed.hidden = false;
    competitionChoice.dispatchEvent(new Event('change'));
    if (!publishDialog.open) feedHeading.focus();
  }

  options.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.track) trackKey = button.dataset.track;
    else if (button.dataset.interest !== undefined) interestIndex = Number(button.dataset.interest);
    else if (button.dataset.contest) {
      selectContest(button.dataset.contest);
      return;
    }
    render();
  });

  back.addEventListener('click', () => {
    if (interestIndex === null) trackKey = '';
    else interestIndex = null;
    if (competitionChoice.value) {
      competitionChoice.value = '';
      feed.hidden = true;
      competitionChoice.dispatchEvent(new Event('change'));
    }
    render();
  });

  options.addEventListener('error', event => {
    const image = event.target;
    if (image.tagName === 'IMG' && !image.src.endsWith('/default.jpg')) image.src = 'assets/images/default.jpg';
  }, true);

  render(false);
})();
