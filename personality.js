(() => {
  'use strict';

  const PERSONAS = [
    {
      id: 'bulldozer',
      code: 'G·H·P·L',
      title: '国奖推土机',
      emoji: '🚀',
      rarity: '全站约 11% · 硬核冲奖核心',
      quote: '“保研加分是我唯一的浪漫，周日晚八点腾讯会议准时点名。”',
      desc: '目标感拉满、行动力爆表。你报比赛绝不凑数，从选题到甘特图再到答辩排练全都安排得明明白白，是队伍里最靠谱的节奏引擎。',
      colors: { bg1: '#ff4e7a', bg2: '#ff8a3d', bg3: '#7c3aed', accent: '#ff3b6b', light: '#fff1f4' },
      stats: [
        { label: '冲奖驱动力', value: 95 },
        { label: '爆肝投入度', value: 86 },
        { label: '规划节奏感', value: 91 },
        { label: '统筹表达力', value: 88 }
      ],
      contests: ['internet', 'challenge', 'edc'],
      partner: '🛠️ 硬核极客工匠 —— 你定方向控节奏，TA 把技术原型做到惊艳全场。',
      pitfall: '尽量别和佛系拖延型队友强绑定，容易血压飙升，提前对齐投入时间最稳妥。'
    },
    {
      id: 'nightcoder',
      code: 'G·H·D·S',
      title: '凌晨三点写代码的神',
      emoji: '⚡',
      rarity: '全站约 14% · 赛前奇迹制造机',
      quote: '“只要红牛够冰、编译器不报错，赛前 12 小时就是我的绝对主场。”',
      desc: '平时看起来云淡风轻，一到 DDL 前 48 小时战斗力直接翻倍。你擅长在高压下啃下最硬的技术骨头，经常在天亮前交出全队膜拜的绝杀版本。',
      colors: { bg1: '#4338ca', bg2: '#7c3aed', bg3: '#06b6d4', accent: '#5b4bff', light: '#f0f2ff' },
      stats: [
        { label: '冲奖驱动力', value: 78 },
        { label: '爆肝投入度', value: 96 },
        { label: '规划节奏感', value: 31 },
        { label: '统筹表达力', value: 44 }
      ],
      contests: ['icpc', 'lanqiao', 'robomaster', 'ciciec'],
      partner: '🧋 全队定海神针 —— TA 负责提前催进度和整理提交材料，让你安心输出神级代码。',
      pitfall: '千万别凑齐三个 DDL 战神一队，不然交稿前一小时全队都在祈祷官网别崩。'
    },
    {
      id: 'artisan',
      code: 'F·H·P·S',
      title: '硬核极客工匠',
      emoji: '🛠️',
      rarity: '全站约 12% · 实验室常驻大佬',
      quote: '“商业计划书别找我，但让板子亮起来、算法跑通，包在我身上。”',
      desc: '你是真正享受“把想法做成实物”的技术派。比起花哨的包装，你更在乎底层原理、指标精度和工程落地，有你在的队伍技术底座稳如泰山。',
      colors: { bg1: '#059669', bg2: '#10b981', bg3: '#0284c7', accent: '#059669', light: '#ecfdf5' },
      stats: [
        { label: '冲奖驱动力', value: 58 },
        { label: '爆肝投入度', value: 89 },
        { label: '规划节奏感', value: 76 },
        { label: '统筹表达力', value: 39 }
      ],
      contests: ['edc', 'robomaster', 'mechanical', 'ciciec'],
      partner: '🎤 天选路演嘴替 —— 你做出硬核作品，TA 帮你讲出让评委拍案叫绝的故事。',
      pitfall: '别闷头调参数到最后一秒，记得提前留出时间录演示视频和写说明文档。'
    },
    {
      id: 'pitcher',
      code: 'G·H·D·L',
      title: '天选路演嘴替',
      emoji: '🎤',
      rarity: '全站约 13% · 答辩场控王者',
      quote: '“项目还没写完？给我一页大纲，我能在评委面前讲出三个亿的估值。”',
      desc: '思维敏锐、表达极强、审美在线。你天生懂得评委想听什么，能把复杂晦涩的技术亮点翻译成打动人心的商业价值与答辩金句。',
      colors: { bg1: '#f59e0b', bg2: '#ff4d79', bg3: '#ec4899', accent: '#e11d48', light: '#fff4f6' },
      stats: [
        { label: '冲奖驱动力', value: 84 },
        { label: '爆肝投入度', value: 63 },
        { label: '规划节奏感', value: 55 },
        { label: '统筹表达力', value: 97 }
      ],
      contests: ['internet', 'fwwb', 'daguangsai', 'shidiao'],
      partner: '🛠️ 硬核极客工匠 / 📊 稳健数据精算师 —— 有扎实的数据和原型撑腰，你的路演就是降维打击。',
      pitfall: '画大饼前记得先和技术队友对一遍口径，避免答辩现场评委追问实现细节时卡壳。'
    },
    {
      id: 'visionary',
      code: 'F·H·D·S',
      title: '跨界脑洞整活家',
      emoji: '🎨',
      rarity: '全站约 12% · 创意灵魂担当',
      quote: '“按套路出牌多没意思，我要做全赛场最酷、评委一眼记住的作品。”',
      desc: '你不喜欢千篇一律的模板选题，总能把冷门痛点、交互设计和新技术玩出花来。你给队伍带来独特的差异化竞争力，是破局的灵感泉眼。',
      colors: { bg1: '#84cc16', bg2: '#14b8a6', bg3: '#2563eb', accent: '#0d9488', light: '#f0fdfa' },
      stats: [
        { label: '冲奖驱动力', value: 52 },
        { label: '爆肝投入度', value: 74 },
        { label: '规划节奏感', value: 38 },
        { label: '统筹表达力', value: 81 }
      ],
      contests: ['jsjds', 'daguangsai', 'challenge', 'jieneng'],
      partner: '🚀 国奖推土机 —— TA 帮你把天马行空的灵感收敛成能落地、能拿奖的完整方案。',
      pitfall: '赛程过半就不要再推翻重来换大方向啦，把当前最亮的创意做精比什么都重要。'
    },
    {
      id: 'actuary',
      code: 'G·C·P·S',
      title: '稳健数据精算师',
      emoji: '📊',
      rarity: '全站约 14% · 高性价比拿奖派',
      quote: '“拒绝无效通宵，用清晰的模型、干净的数据和 LaTeX 稳稳拿下奖项。”',
      desc: '冷静、理性、讲究方法论。你不盲目拼熬夜时长，而是擅长拆解评分标准、用严谨的逻辑和可视化图表稳扎稳打拿到高性价比成果。',
      colors: { bg1: '#0284c7', bg2: '#4f46e5', bg3: '#0ea5e9', accent: '#2563eb', light: '#eff6ff' },
      stats: [
        { label: '冲奖驱动力', value: 82 },
        { label: '爆肝投入度', value: 54 },
        { label: '规划节奏感', value: 94 },
        { label: '统筹表达力', value: 61 }
      ],
      contests: ['cumcm', 'mcm', 'shidiao', 'jieneng'],
      partner: '🎤 天选路演嘴替 / 🎨 跨界脑洞整活家 —— 让你的严谨模型既有亮点又有绝佳呈现。',
      pitfall: '遇到突发赛题变更时别太纠结完美解，先跑通基线模型再迭代更稳。'
    },
    {
      id: 'anchor',
      code: 'F·C·P·L',
      title: '全队定海神针',
      emoji: '🧋',
      rarity: '全站约 13% · 团队润滑剂 & 大管家',
      quote: '“调研、文档、订奶茶、盯提交全包了，有我在队伍绝不会在 DDL 前散架。”',
      desc: '情绪稳定、沟通丝滑、极其靠谱。你能接住各种杂活与收尾工作，在队友焦虑时稳住军心，是每支夺奖队伍背后不可或缺的“粘合剂”。',
      colors: { bg1: '#ec4899', bg2: '#f97316', bg3: '#8b5cf6', accent: '#db2777', light: '#fdf2f8' },
      stats: [
        { label: '冲奖驱动力', value: 64 },
        { label: '爆肝投入度', value: 61 },
        { label: '规划节奏感', value: 85 },
        { label: '统筹表达力', value: 89 }
      ],
      contests: ['challenge', 'shidiao', 'internet', 'fwwb'],
      partner: '⚡ 凌晨三点写代码的神 —— 你稳住节奏与交付，TA 负责攻克最难的技术关卡。',
      pitfall: '别因为太好说话就把所有杂活都往自己身上揽，合理分工才能走得更远。'
    },
    {
      id: 'chill',
      code: 'F·C·D·S',
      title: '人间清醒体验家',
      emoji: '🌈',
      rarity: '全站约 11% · 反内卷快乐参赛派',
      quote: '“绝不为一张证书熬坏头发，主打一个快乐参赛、认识大佬、顺手拿奖。”',
      desc: '心态松弛、边界清晰。你把比赛当成拓展视野、认识有趣伙伴和练手的游乐场，不盲目焦虑，反而常常在轻松状态下发挥出意外惊喜。',
      colors: { bg1: '#06b6d4', bg2: '#38bdf8', bg3: '#a855f7', accent: '#0891b2', light: '#ecfeff' },
      stats: [
        { label: '冲奖驱动力', value: 29 },
        { label: '爆肝投入度', value: 34 },
        { label: '规划节奏感', value: 57 },
        { label: '统筹表达力', value: 66 }
      ],
      contests: ['lanqiao', 'jsjds', 'daguangsai', 'jieneng'],
      partner: '🧋 全队定海神针 / 📊 稳健数据精算师 —— 节奏舒服不互卷，还能稳稳把作品做完。',
      pitfall: '进队前一定要坦诚自己每周能投入的时间，避开冲国一的“魔鬼训练营”队伍。'
    }
  ];

  const AXES_META = [
    { key: 'goal', label: '冲奖驱动力' },
    { key: 'grind', label: '爆肝投入度' },
    { key: 'plan', label: '规划节奏感' },
    { key: 'lead', label: '统筹表达力' }
  ];

  const QUESTIONS = [
    {
      tag: 'Q1 · 参赛初心',
      title: '室友问你“这学期怎么突然报了比赛？”，你心里最真实的答案是？',
      basisPrefix: '参赛初心',
      options: [
        { label: '保研 / 综测 / 奖学金加分，冲就完了！', sub: '目标非常明确，拿奖才是硬道理', trait: '以保研/综测/奖学金加分为核心动力', weights: { bulldozer: 3, actuary: 2, pitcher: 1 }, axes: { goal: 3, grind: 2, plan: 2, lead: 1 } },
        { label: '想把学过的技术真正做出一个能跑的酷作品', sub: '比起证书，更享受做出来的成就感', trait: '更看重把技术做成可运行作品的成就感', weights: { artisan: 3, visionary: 2, nightcoder: 1 }, axes: { goal: 1, grind: 2, plan: 1, lead: 0 } },
        { label: '简历太白了，攒段拿得出手的项目经历', sub: '顺便练手提升表达与协作能力', trait: '希望积累优质项目经历与协作表达能力', weights: { pitcher: 2, anchor: 2, actuary: 2 }, axes: { goal: 2, grind: 1, plan: 2, lead: 2 } },
        { label: '朋友拉我一起玩，顺便体验下大学竞赛氛围', sub: '重在参与，快乐第一，绝不内耗', trait: '主打轻松体验竞赛氛围、拒绝内耗', weights: { chill: 3, anchor: 1, visionary: 1 }, axes: { goal: 0, grind: 0, plan: 1, lead: 1 } }
      ]
    },
    {
      tag: 'Q2 · 目标奖项',
      title: '点开比赛官网的奖项设置，你的视线第一时间锁死在？',
      basisPrefix: '目标奖项',
      options: [
        { label: '国一 / 金奖！既然打了就奔着最高领奖台去', sub: '哪怕掉头发也要拼一把上限', trait: '目标直指国一 / 金奖最高档位', weights: { bulldozer: 3, nightcoder: 2, artisan: 1 }, axes: { goal: 3, grind: 3, plan: 2, lead: 2 } },
        { label: '省一 / 国二，投入产出比最高的目标', sub: '理智评估实力，稳中求进最香', trait: '瞄准省一 / 国二的高性价比区间', weights: { actuary: 3, pitcher: 2, anchor: 1 }, axes: { goal: 2, grind: 2, plan: 3, lead: 2 } },
        { label: '最好拿个奖，但更想做出一个让我自己骄傲的作品', sub: '奖项是副产品，作品够酷才过瘾', trait: '更在意作品质量与创意独特性', weights: { visionary: 3, artisan: 2 }, axes: { goal: 1, grind: 2, plan: 1, lead: 1 } },
        { label: '完赛拿个保底奖或参赛证明就心满意足', sub: '拒绝焦虑，能完整走完流程就很棒', trait: '心态平和，看重完整走完备赛流程', weights: { chill: 3, anchor: 2 }, axes: { goal: 0, grind: 0, plan: 1, lead: 1 } }
      ]
    },
    {
      tag: 'Q3 · 时间投入',
      title: '算算课表和日常，你一周大概能匀出多少时间给比赛？',
      basisPrefix: '时间投入',
      options: [
        { label: '10 小时以上，图书馆和实验室就是我第二个家', sub: '高频推进，随时在线响应', trait: '每周可稳定投入 10 小时以上高频推进', weights: { bulldozer: 3, artisan: 3 }, axes: { goal: 2, grind: 3, plan: 3, lead: 1 } },
        { label: '5～8 小时，周末固定抽整块时间稳步推进', sub: '讲究节奏，不拖延也不透支', trait: '每周固定投入 5～8 小时稳步推进', weights: { actuary: 3, anchor: 2, pitcher: 1 }, axes: { goal: 2, grind: 2, plan: 3, lead: 2 } },
        { label: '平时随缘 2～3 小时，但赛前一周可以全天候爆肝', sub: '间歇性蓄力，DDL 前爆发惊人', trait: '平时轻量跟进，赛前冲刺爆发力极强', weights: { nightcoder: 3, visionary: 2, pitcher: 2 }, axes: { goal: 2, grind: 3, plan: 0, lead: 1 } },
        { label: '2～4 小时轻量参与，绝不压缩睡觉和娱乐时间', sub: '细水长流，保持生活平衡', trait: '每周 2～4 小时轻量参与，保持生活平衡', weights: { chill: 3, anchor: 1 }, axes: { goal: 0, grind: 0, plan: 2, lead: 1 } }
      ]
    },
    {
      tag: 'Q4 · DDL 危机',
      title: '距离提交只剩 24 小时，核心模块突然冒出 Bug，你的第一反应是？',
      options: [
        { label: '不存在的，我早预留了 3 天缓冲期来做联调', sub: '提前排期才是安全感的唯一来源', weights: { bulldozer: 2, actuary: 3, anchor: 2 }, axes: { goal: 2, grind: 1, plan: 3, lead: 2 } },
        { label: '立刻买两罐红牛，通宵改代码，天亮前必解决！', sub: '肾上腺素飙升，越到绝境越清醒', weights: { nightcoder: 3, artisan: 2 }, axes: { goal: 2, grind: 3, plan: 0, lead: 0 } },
        { label: '先保底可运行版本，同时准备演示视频和答辩话术', sub: '绝不能翻车，Plan B 永远在线', weights: { pitcher: 3, bulldozer: 2 }, axes: { goal: 3, grind: 2, plan: 2, lead: 3 } },
        { label: '先给大家点杯奶茶稳稳心态，再一起慢慢排查', sub: '慌也没用，团队不崩就能搞定', weights: { anchor: 3, chill: 2, visionary: 1 }, axes: { goal: 1, grind: 1, plan: 2, lead: 2 } }
      ]
    },
    {
      tag: 'Q5 · 队内天选位',
      title: '如果可以自由挑选，你在队伍里最舒服的分工是？',
      basisPrefix: '队内角色',
      options: [
        { label: '队长 / 项目统筹：定方向、拆任务、盯节点', sub: '掌控全局让我最有安全感', trait: '倾向担任队长与项目节奏统筹', weights: { bulldozer: 3, anchor: 2 }, axes: { goal: 3, grind: 2, plan: 3, lead: 3 } },
        { label: '硬核技术担当：写代码、搭硬件、跑算法、做实验', sub: '少开会，给我需求我来落地', trait: '偏好代码、硬件、算法等硬核技术落地', weights: { artisan: 3, nightcoder: 3 }, axes: { goal: 1, grind: 3, plan: 1, lead: 0 } },
        { label: '灵魂表达担当：商业计划书、PPT 设计、上台路演', sub: '把作品讲出彩是我的拿手好戏', trait: '擅长方案包装、PPT 设计与答辩路演', weights: { pitcher: 3, visionary: 2 }, axes: { goal: 2, grind: 1, plan: 1, lead: 3 } },
        { label: '模型 / 调研 / 补位：数据分析、论文排版或兜底收尾', sub: '哪里缺人补哪里，稳稳托底', trait: '擅长建模调研、文档排版或全能兜底', weights: { actuary: 3, anchor: 2, chill: 1 }, axes: { goal: 1, grind: 1, plan: 3, lead: 2 } }
      ]
    },
    {
      tag: 'Q6 · 选题偏好',
      title: '全队开第一次头脑风暴定选题，你更倾向于选哪一种？',
      options: [
        { label: '往届国奖高频赛道，评审偏好清晰、有成熟范式', sub: '踩在巨人肩膀上，拿奖概率最高', weights: { bulldozer: 2, actuary: 3, pitcher: 1 }, axes: { goal: 3, grind: 2, plan: 3, lead: 2 } },
        { label: '脑洞大开的新奇切入点，让评委眼前一亮', sub: '不怕没参考，就怕太普通', weights: { visionary: 3, pitcher: 2 }, axes: { goal: 1, grind: 2, plan: 0, lead: 3 } },
        { label: '技术含量拉满的硬核命题，做出实打实的 Demo', sub: '硬实力说话，经得起任何追问', weights: { artisan: 3, nightcoder: 2 }, axes: { goal: 2, grind: 3, plan: 2, lead: 0 } },
        { label: '工作量适中、大家都有兴趣且能轻松驾驭的题目', sub: '量力而行，做得开心最重要', weights: { chill: 3, anchor: 2 }, axes: { goal: 0, grind: 0, plan: 2, lead: 1 } }
      ]
    },
    {
      tag: 'Q7 · 队友协作',
      title: '如果群里发了分工消息半天没人回，你通常会怎么做？',
      options: [
        { label: '直接私聊每个人确认进度，定死明晚 10 点交初稿', sub: '温和但坚定，绝不让项目烂尾', weights: { bulldozer: 3, pitcher: 1 }, axes: { goal: 3, grind: 2, plan: 3, lead: 3 } },
        { label: '算了，等他们不如我自己顺手把核心部分先写了', sub: '效率第一，自己动手最踏实', weights: { nightcoder: 3, artisan: 2 }, axes: { goal: 2, grind: 3, plan: 1, lead: 0 } },
        { label: '在群里发个搞笑表情包暖场，顺便把大家拉回正轨', sub: '高情商催进度，不伤和气', weights: { anchor: 3, visionary: 1 }, axes: { goal: 1, grind: 1, plan: 2, lead: 3 } },
        { label: '可能大家最近忙着期中考试吧，过两天再看看', sub: '互相体谅，佛系不催命', weights: { chill: 3, actuary: 1 }, axes: { goal: 0, grind: 0, plan: 0, lead: 1 } }
      ]
    },
    {
      tag: 'Q8 · 获奖瞬间',
      title: '终于拿到获奖证书那一刻，你最想发的朋友圈文案是？',
      options: [
        { label: '“两个月全员死磕终于拿下！下一站继续冲！”', sub: '热血澎湃，战绩喜人', weights: { bulldozer: 3, pitcher: 2 }, axes: { goal: 3, grind: 3, plan: 2, lead: 3 } },
        { label: '“晒一张凌晨 4 点的调试桌面：终于跑通了！”', sub: '只有自己懂的硬核浪漫', weights: { nightcoder: 3, artisan: 3 }, axes: { goal: 1, grind: 3, plan: 1, lead: 0 } },
        { label: '“附上一张超好看的作品海报：灵感落地太爽了！”', sub: '审美和创意必须被看见', weights: { visionary: 3, pitcher: 2 }, axes: { goal: 1, grind: 2, plan: 1, lead: 3 } },
        { label: '“感谢神仙队友带飞/配合，证书到手，快乐下班！”', sub: '轻松洒脱，主打一个感谢遇见', weights: { anchor: 3, chill: 3, actuary: 2 }, axes: { goal: 1, grind: 0, plan: 2, lead: 2 } }
      ]
    }
  ];

  const $ = id => document.getElementById(id);
  const views = ['view-intro', 'view-quiz', 'view-loading', 'view-result'];
  let currentStep = 0;
  let answers = [];
  let activePersona = null;

  function showView(targetId) {
    views.forEach(id => { $(id).hidden = id !== targetId; });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function getNickname() {
    const raw = ($('poster-nickname').value || '').trim();
    return raw || '竞赛选手';
  }

  function renderQuestion() {
    const q = QUESTIONS[currentStep];
    const total = QUESTIONS.length;
    $('quiz-counter').textContent = `${String(currentStep + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
    $('quiz-progressbar').setAttribute('aria-valuenow', String(currentStep + 1));
    $('quiz-progress-fill').style.width = `${((currentStep + 1) / total) * 100}%`;
    $('question-tag').textContent = q.tag;
    $('question-title').textContent = q.title;
    $('btn-prev').textContent = currentStep === 0 ? '← 返回首页' : '← 上一题';

    const letters = ['A', 'B', 'C', 'D'];
    const selectedIdx = answers[currentStep];
    $('option-list').innerHTML = q.options.map((opt, idx) => `
      <button type="button" class="option-btn${selectedIdx === idx ? ' selected' : ''}" data-idx="${idx}">
        <span class="opt-letter">${letters[idx]}</span>
        <span class="opt-text"><strong>${opt.label}</strong><small>${opt.sub}</small></span>
      </button>
    `).join('');
  }

  function computeResult() {
    const scores = Object.fromEntries(PERSONAS.map(p => [p.id, 0]));
    const rawAxes = Object.fromEntries(AXES_META.map(a => [a.key, 0]));
    const minAxes = Object.fromEntries(AXES_META.map(a => [a.key, 0]));
    const maxAxes = Object.fromEntries(AXES_META.map(a => [a.key, 0]));
    const basis = [];

    QUESTIONS.forEach((q, qIdx) => {
      AXES_META.forEach(({ key }) => {
        const vals = q.options.map(o => o.axes[key]);
        minAxes[key] += Math.min(...vals);
        maxAxes[key] += Math.max(...vals);
      });
      const opt = q.options[answers[qIdx]];
      if (!opt) return;
      Object.entries(opt.weights).forEach(([id, val]) => {
        if (scores[id] !== undefined) scores[id] += val;
      });
      AXES_META.forEach(({ key }) => {
        rawAxes[key] += opt.axes[key];
      });
      if (q.basisPrefix && opt.trait) {
        basis.push(`${q.basisPrefix}：${opt.trait}`);
      }
    });

    const ranked = [...PERSONAS].sort((a, b) => scores[b.id] - scores[a.id]);
    const dynamicStats = AXES_META.map(({ key, label }) => {
      const span = Math.max(1, maxAxes[key] - minAxes[key]);
      const ratio = (rawAxes[key] - minAxes[key]) / span;
      return { label, value: Math.round(24 + ratio * 74) };
    });

    return { persona: ranked[0], stats: dynamicStats, basis };
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function wrapLines(ctx, text, maxWidth, maxLines = 3) {
    const chars = Array.from(text);
    const lines = [];
    let current = '';
    for (const ch of chars) {
      if (ctx.measureText(current + ch).width > maxWidth && current) {
        lines.push(current);
        current = ch;
        if (lines.length === maxLines) break;
      } else {
        current += ch;
      }
    }
    if (current && lines.length < maxLines) lines.push(current);
    return lines;
  }

  const imageCache = new Map();
  function loadPersonaImage(id) {
    if (imageCache.has(id)) return imageCache.get(id);
    const promise = new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = `assets/images/persona-${id}.jpg?v=2`;
    });
    imageCache.set(id, promise);
    return promise;
  }

  async function drawPoster(persona, nickname, statsToDraw) {
    const canvas = $('poster-canvas');
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const c = persona.colors;
    const stats = statsToDraw || persona.stats;
    const fontBase = '"PingFang SC", "Microsoft YaHei", "Segoe UI", system-ui, sans-serif';
    const artImg = await loadPersonaImage(persona.id);

    // 1. Vibrant dopamine gradient background
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, c.bg1);
    bg.addColorStop(0.52, c.bg2);
    bg.addColorStop(1, c.bg3);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Decorative translucent orbs
    const drawOrb = (x, y, r, alpha) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(255,255,255,${alpha})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };
    drawOrb(110, 120, 260, 0.28);
    drawOrb(670, 260, 240, 0.22);
    drawOrb(620, 1180, 280, 0.22);

    // 2. Top Brand Strip
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.font = `700 22px ${fontBase}`;
    ctx.fillText('COMPETITION PERSONALITY · 2026', 44, 62);

    // Code pill on top right
    roundRect(ctx, W - 196, 32, 152, 42, 21);
    ctx.fillStyle = 'rgba(255,255,255,0.24)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = `800 21px ${fontBase}`;
    ctx.textAlign = 'center';
    ctx.fillText(persona.code, W - 120, 60);

    // Nickname centered subtitle
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.font = `700 25px ${fontBase}`;
    ctx.fillText(`${nickname} 的专属竞赛人格`, W / 2, 110);
    ctx.textAlign = 'left';

    // 3. Collectible Character Illustration Frame (centered 384x384)
    const artSize = 384;
    const artX = (W - artSize) / 2;
    const artY = 132;

    ctx.save();
    ctx.shadowColor = 'rgba(20, 27, 45, 0.26)';
    ctx.shadowBlur = 32;
    ctx.shadowOffsetY = 14;
    roundRect(ctx, artX, artY, artSize, artSize, 38);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();

    ctx.save();
    roundRect(ctx, artX + 7, artY + 7, artSize - 14, artSize - 14, 32);
    ctx.clip();
    if (artImg) {
      ctx.drawImage(artImg, artX + 7, artY + 7, artSize - 14, artSize - 14);
    } else {
      ctx.fillStyle = c.light;
      ctx.fillRect(artX + 7, artY + 7, artSize - 14, artSize - 14);
      ctx.font = `120px ${fontBase}`;
      ctx.textAlign = 'center';
      ctx.fillText(persona.emoji, W / 2, artY + 235);
      ctx.textAlign = 'left';
    }
    ctx.restore();

    // 4. Centered Big Bold Title + Rarity Pill
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    const titleSize = persona.title.length > 7 ? 46 : 54;
    ctx.font = `900 ${titleSize}px ${fontBase}`;
    ctx.fillText(`${persona.emoji} ${persona.title}`, W / 2, 578);

    ctx.font = `700 20px ${fontBase}`;
    const rarityW = Math.min(W - 100, ctx.measureText(persona.rarity).width + 44);
    roundRect(ctx, (W - rarityW) / 2, 596, rarityW, 38, 19);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(persona.rarity, W / 2, 622);
    ctx.textAlign = 'left';

    // 5. Main White Floating Card
    roundRect(ctx, 40, 654, W - 80, 608, 32);
    ctx.fillStyle = 'rgba(255,255,255,0.96)';
    ctx.fill();

    // Quote box inside white card
    roundRect(ctx, 70, 680, W - 140, 96, 20);
    ctx.fillStyle = c.light;
    ctx.fill();
    ctx.fillStyle = c.accent;
    roundRect(ctx, 70, 680, 9, 96, 5);
    ctx.fill();

    ctx.fillStyle = '#1e2438';
    ctx.font = `700 23px ${fontBase}`;
    const quoteLines = wrapLines(ctx, persona.quote, W - 196, 2);
    quoteLines.forEach((line, i) => {
      ctx.fillText(line, 98, 720 + i * 34);
    });

    // 6. Four Dynamic Stat Bars
    ctx.fillStyle = '#141b2d';
    ctx.font = `800 22px ${fontBase}`;
    ctx.fillText('四维竞赛能量条', 72, 814);

    stats.forEach((st, idx) => {
      const y = 850 + idx * 54;
      ctx.fillStyle = '#3b465c';
      ctx.font = `700 19px ${fontBase}`;
      ctx.fillText(st.label, 72, y);

      ctx.fillStyle = c.accent;
      ctx.font = `800 20px ${fontBase}`;
      ctx.textAlign = 'right';
      ctx.fillText(`${st.value}%`, W - 72, y);
      ctx.textAlign = 'left';

      const barW = W - 144;
      roundRect(ctx, 72, y + 10, barW, 15, 8);
      ctx.fillStyle = '#edf1f9';
      ctx.fill();

      const fillG = ctx.createLinearGradient(72, 0, 72 + barW, 0);
      fillG.addColorStop(0, c.bg1);
      fillG.addColorStop(1, c.bg3);
      roundRect(ctx, 72, y + 10, Math.max(20, barW * (st.value / 100)), 15, 8);
      ctx.fillStyle = fillG;
      ctx.fill();
    });

    // Divider
    ctx.strokeStyle = '#e7edf7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(72, 1068);
    ctx.lineTo(W - 72, 1068);
    ctx.stroke();

    // 7. Recommended Contests Pills
    ctx.fillStyle = '#5a657d';
    ctx.font = `700 19px ${fontBase}`;
    ctx.fillText('🎯 本命推荐赛事', 72, 1102);

    let px = 72;
    const py = 1118;
    ctx.font = `700 19px ${fontBase}`;
    persona.contests.slice(0, 4).forEach(key => {
      const label = (window.matchScenarios && matchScenarios[key]?.short) || key;
      const tw = ctx.measureText(label).width + 30;
      if (px + tw > W - 68) return;
      roundRect(ctx, px, py, tw, 38, 19);
      ctx.fillStyle = c.light;
      ctx.fill();
      ctx.strokeStyle = c.accent;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = c.accent;
      ctx.fillText(label, px + 15, py + 26);
      px += tw + 10;
    });

    // 8. Best Partner
    ctx.fillStyle = '#5a657d';
    ctx.font = `700 19px ${fontBase}`;
    ctx.fillText('💘 天选绝配队友', 72, 1192);
    ctx.fillStyle = '#1e293b';
    ctx.font = `600 19px ${fontBase}`;
    const partnerLines = wrapLines(ctx, persona.partner, W - 144, 2);
    partnerLines.forEach((line, i) => {
      ctx.fillText(line, 72, 1222 + i * 26);
    });

    // 9. Footer Brand
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.font = `800 21px ${fontBase}`;
    ctx.fillText('🏆 竞赛信息门户 · competition.thirdplayer.cn', 44, 1308);
    ctx.textAlign = 'right';
    ctx.font = `600 19px ${fontBase}`;
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.fillText('测测你的竞赛人格 →', W - 44, 1308);
    ctx.textAlign = 'left';

    $('poster-image').src = canvas.toDataURL('image/png');
  }

  function showResult(persona, customStats = null, basis = null) {
    activePersona = persona;
    const nickname = getNickname();
    const stats = customStats || persona.stats;
    drawPoster(persona, nickname, stats);

    $('res-code').textContent = persona.code;
    $('res-code').style.background = `linear-gradient(125deg, ${persona.colors.bg1}, ${persona.colors.bg3})`;
    $('res-rarity').textContent = persona.rarity;
    $('res-title').textContent = `${persona.emoji} ${persona.title}`;
    $('res-quote').textContent = persona.quote;
    $('res-quote').style.borderLeftColor = persona.colors.accent;
    $('res-desc').textContent = persona.desc;
    $('res-stats-mode').textContent = customStats ? '根据你的 8 道选择实时计算' : '人格图鉴参考数值';

    $('res-stats').innerHTML = stats.map(st => `
      <div class="stat-row">
        <div class="stat-head"><span>${st.label}</span><span>${st.value}%</span></div>
        <div class="stat-track"><div class="stat-fill" style="width:${st.value}%;background:linear-gradient(90deg,${persona.colors.bg1},${persona.colors.bg3})"></div></div>
      </div>
    `).join('');

    const basisWrap = $('res-basis-wrap');
    if (basis && basis.length) {
      $('res-basis').innerHTML = basis.map(item => `<li>${item}</li>`).join('');
      basisWrap.hidden = false;
    } else {
      basisWrap.hidden = true;
    }

    $('res-contests').innerHTML = persona.contests.map(key => {
      const label = (window.matchScenarios && (matchScenarios[key]?.short || matchScenarios[key]?.label)) || key;
      return `<a class="contest-jump" href="team.html?contest=${encodeURIComponent(key)}">${label} <span>→</span></a>`;
    }).join('');

    $('res-partner').textContent = persona.partner;
    $('res-pitfall').textContent = persona.pitfall;
    $('btn-find-team').href = `team.html?contest=${encodeURIComponent(persona.contests[0] || 'all')}`;

    showView('view-result');
    $('res-title').focus();
  }

  function openGallery() {
    $('gallery-grid').innerHTML = PERSONAS.map(p => `
      <button type="button" class="gallery-item" data-persona-id="${p.id}">
        <img class="gallery-thumb" src="assets/images/persona-${p.id}.jpg?v=2" alt="${p.title}" loading="lazy">
        <div class="gallery-body">
          <div class="gallery-item-top">
            <strong>${p.emoji} ${p.title}</strong>
            <span class="gallery-code" style="background:linear-gradient(125deg,${p.colors.bg1},${p.colors.bg3})">${p.code}</span>
          </div>
          <small>${p.quote}</small>
        </div>
      </button>
    `).join('');
    $('gallery-dialog').showModal();
  }

  // Event bindings
  $('btn-start').addEventListener('click', () => {
    currentStep = 0;
    answers = [];
    renderQuestion();
    showView('view-quiz');
    $('question-title').focus();
  });

  $('btn-prev').addEventListener('click', () => {
    if (currentStep === 0) {
      showView('view-intro');
      return;
    }
    currentStep -= 1;
    renderQuestion();
  });

  $('option-list').addEventListener('click', event => {
    const btn = event.target.closest('[data-idx]');
    if (!btn) return;
    const idx = Number(btn.dataset.idx);
    answers[currentStep] = idx;
    $('option-list').querySelectorAll('.option-btn').forEach(el => el.classList.remove('selected'));
    btn.classList.add('selected');

    setTimeout(() => {
      if (currentStep < QUESTIONS.length - 1) {
        currentStep += 1;
        renderQuestion();
        $('question-title').focus();
      } else {
        showView('view-loading');
        setTimeout(() => {
          const result = computeResult();
          showResult(result.persona, result.stats, result.basis);
        }, 650);
      }
    }, 180);
  });

  $('btn-download').addEventListener('click', () => {
    if (!activePersona) return;
    const link = document.createElement('a');
    link.download = `我的竞赛人格-${activePersona.title}.png`;
    link.href = $('poster-canvas').toDataURL('image/png');
    link.click();
  });

  $('btn-restart').addEventListener('click', () => {
    currentStep = 0;
    answers = [];
    showView('view-intro');
  });

  $('btn-gallery-intro').addEventListener('click', openGallery);
  $('btn-gallery-result').addEventListener('click', openGallery);
  $('gallery-grid').addEventListener('click', event => {
    const item = event.target.closest('[data-persona-id]');
    if (!item) return;
    const found = PERSONAS.find(p => p.id === item.dataset.personaId);
    if (!found) return;
    $('gallery-dialog').close();
    showResult(found);
  });

  // Pre-fill nickname if user is signed in
  if (window.CompetitionAPI?.enabled) {
    CompetitionAPI.me().then(({ user }) => {
      if (user && !$('poster-nickname').value) {
        $('poster-nickname').value = user.profile?.name || user.username || '';
      }
    }).catch(() => {});
  }
})();
