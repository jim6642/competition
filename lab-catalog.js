(function (root, factory) {
  const catalog = factory();
  if (typeof module === 'object' && module.exports) module.exports = catalog;
  else root.LabCatalog = catalog;
})(typeof window === 'undefined' ? globalThis : window, function () {
  const opt = (value, label, hint = '', mark = '') => ({value, label, hint, mark});
  const competitions = [
    opt('unsure', '还没决定', '先认识同方向的人'), opt('edc', '电子设计竞赛'),
    opt('robomaster', 'RoboMaster'), opt('cumcm', '全国大学生数学建模竞赛'),
    opt('mcm', '美国大学生数学建模竞赛'), opt('internet', '互联网＋创新创业'),
    opt('challenge', '挑战杯'), opt('lanqiao', '蓝桥杯'), opt('icpc', 'ACM / ICPC'),
    opt('mechanical', '机械创新设计'), opt('ict', '华为 ICT')
  ];
  const interests = [opt('software','编程与算法','把想法写成能运行的程序','01'),opt('hardware','电子与硬件','从电路到一块能工作的板子','02'),opt('robotics','机器人与自动化','让机器感知、决策和行动','03'),opt('data','数学建模与数据','用模型和数据回答问题','04'),opt('design','设计与产品','让作品更好用，也更好看','05'),opt('business','创新创业','验证一个有价值的新想法','06'),opt('research','科研与社会调研','提出问题，再找到证据','07'),opt('writing','写作与表达','把复杂的想法讲清楚','08')];
  const skillGroups = [
    {label:'编程与算法', domain:'software', skills:['Python','C语言','C++','Java','JavaScript','前端开发','后端开发','Git','数据库','算法与数据结构','Linux','云计算','网络安全']},
    {label:'电子与硬件', domain:'hardware', skills:['STM32','FPGA','Verilog','PCB 设计','模拟电路','单片机','传感器','硬件调试']},
    {label:'机器人与机械', domain:'robotics', skills:['OpenCV','计算机视觉','ROS','ROS2','路径规划','控制算法','SolidWorks','CAD','三维建模']},
    {label:'数学与数据', domain:'data', skills:['MATLAB','数学建模','统计分析','机器学习','数据清洗','数据可视化','Excel','SPSS']},
    {label:'设计与产品', domain:'design', skills:['Figma','UI / UX 设计','交互原型','用户研究','视觉设计','视频剪辑','产品策划']},
    {label:'商业与研究', domain:'business', skills:['商业分析','市场调研','财务分析','商业计划书','问卷设计','文献检索','实验设计']},
    {label:'写作与表达', domain:'writing', skills:['论文写作','英文写作','LaTeX','PPT','路演表达','项目管理']}
  ];
  const questions = [
    {key:'intent', tag:'从你的当下开始', title:'这次，你想怎样开始？', hint:'可以多选。不同比赛里，可以既想加入队伍，也想招募伙伴。', multi:true,max:3,options:[opt('join','我想加入一支队伍','带上自己的能力，找一个一起做事的团队','01'),opt('recruit','我的队伍还缺人','已有想法或伙伴，想补充新的能力','02'),opt('explore','先认识同方向的人','比赛还没定，想先找到一起成长的伙伴','03')]},
    {key:'grade', tag:'了解你的阶段', title:'你现在是几年级？', hint:'每个阶段都有自己的优势。年级不会成为匹配的门槛。', options:['大一','大二','大三','大四','研一','研二','研三','博士'].map((s,i)=>opt(s,s, ['刚刚开启大学生活','开始探索自己的方向','积累了一些实践经验','准备把经验带进下一站'][i] || '更深入地研究一个方向',String(i+1).padStart(2,'0'))).concat(opt('other','其他 / 暂不填写','也欢迎不同学习阶段的你'))},
    {key:'discipline',tag:'不同背景，都有位置',title:'你的专业涉及哪些方向？',hint:'可以多选，最多 3 个。双学位、跨学科背景也可以一起选。',multi:true,max:3,options:[opt('engineering','工科','计算机、电子、机械、自动化等','E'),opt('science','理科','数学、物理、化学、统计等','S'),opt('humanities','人文与社科','文学、外语、教育、社会学等','H'),opt('business','经济与管理','经济、金融、会计、管理等','B'),opt('arts','艺术与设计','视觉、工业设计、数字媒体等','A'),opt('interdisciplinary','其他方向','医学、农学，或以上未包含的方向','＋')]},
    {key:'interests',tag:'找到让你想动手的事',title:'哪些方向，会让你眼睛一亮？',hint:'可以多选，最多 4 个。选感兴趣的，不必已经擅长。',multi:true,max:4,options:interests},
    {key:'skills',tag:'把你会的，带进队伍',title:'你用过哪些工具，或有这些能力？',hint:'最多选 12 个。上过课、做过小作品也算；“我还在入门”单独选择。',multi:true,max:12,exclusive:'starting',options:skillGroups.flatMap(g=>g.skills.map(s=>opt(s,s))).concat(opt('starting','我还在入门','愿意从学习和基础任务开始'))},
    {key:'experience',tag:'找到合适的协作节奏',title:'目前，你最高的经历阶段是？',hint:'单选。若做过项目、参过赛并获奖，选择获奖或带队即可。经历多少，都能找到分工。',options:[opt('new','第一次尝试','还没做过，想迈出第一步','01'),opt('course','做过课程或小作品','能完成一些基础实践','02'),opt('project','参与过完整项目','和伙伴一起把想法落过地','03'),opt('contest','参加过竞赛','熟悉准备、协作和提交的过程','04'),opt('award','有获奖或带队经历','愿意分享经验，承担关键任务','05')]},
    {key:'competition',tag:'让相同目标的人相遇',title:'有没有想一起参加的比赛？',hint:'可以多选，最多 10 场。还没确定目标时，单独选择“还没决定”。',multi:true,max:10,exclusive:'unsure',options:competitions},
    {key:'availability',tag:'合拍，也要有时间',title:'每周，你大概能投入多少时间？',hint:'按平时能坚持的节奏选，不用把自己排得太满。',options:[opt('light','轻量参与','每周约 1–3 小时','01'),opt('steady','稳定推进','每周约 4–8 小时','02'),opt('intensive','集中投入','每周 9 小时及以上','03'),opt('flexible','可以商量','根据项目阶段灵活调整','04')]},
    {key:'preference',tag:'最后一题，想想未来的伙伴',title:'你更想遇见怎样的队友？',hint:'可以多选，能力互补和兴趣相近可以兼得。这些是推荐参考，不是组队门槛。',multi:true,max:4,options:[opt('complement','和我能力互补','你擅长的，刚好是我还缺的','01'),opt('similar','和我兴趣相近','同一个方向，一起深入下去','02'),opt('mentor','能带我积累经验','跟着有经验的伙伴做一次完整项目','03'),opt('peer','和我一起从零开始','一起学习、试错，做出第一个作品','04')]}
  ];
  const byKey = Object.fromEntries(questions.map(q=>[q.key,q]));
  const label = (key,value) => byKey[key]?.options.find(o=>o.value===value)?.label || value || '暂未选择';
  // Upgrade only fields that were single-choice in v1; never mutate stored input.
  function normalizeAnswers(input) {
    if (!input || typeof input!=='object' || Array.isArray(input)) return input;
    const result={...input};
    for(const key of ['intent','discipline','competition','preference']) {
      if(typeof result[key]==='string') result[key]=[result[key]];
    }
    return result;
  }
  return {version:2,questions,byKey,competitions,interests,skillGroups,label,normalizeAnswers};
});
