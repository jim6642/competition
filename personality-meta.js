(() => {
  'use strict';

  const STORAGE_KEY = 'competition.personality.v1';

  const PERSONALITIES = {
    bulldozer: {
      id: 'bulldozer', code: 'G·H·P·L', title: '国奖推土机', emoji: '🚀',
      role: '节奏引擎 · 任务拆解 · 冲奖统筹',
      color: '#e11d48', bg: '#fff1f4', border: '#fecdd3',
      bestPartners: ['artisan', 'actuary'],
      goodPartners: ['anchor', 'pitcher'],
      cautionPartners: ['chill'],
      bestReasons: {
        artisan: '你控节奏定方向，TA 把硬核技术原型做到惊艳全场',
        actuary: '高效规划遇上严谨建模，冲奖稳得可怕'
      },
      cautionNote: '节奏一快一慢，组队前先对齐每周投入时间更稳妥'
    },
    nightcoder: {
      id: 'nightcoder', code: 'G·H·D·S', title: '凌晨三点写代码的神', emoji: '⚡',
      role: '硬核攻坚 · 赛前绝杀 · 技术主力',
      color: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe',
      bestPartners: ['anchor', 'bulldozer'],
      goodPartners: ['pitcher', 'artisan'],
      cautionPartners: ['nightcoder'],
      bestReasons: {
        anchor: 'TA 稳住排期与文档交付，让你安心攻克最硬的技术关卡',
        bulldozer: '有强统筹帮你卡节点，技术爆发力直接翻倍'
      },
      cautionNote: '两位 DDL 战神凑一队，记得提前备好红牛并留出提交缓冲'
    },
    artisan: {
      id: 'artisan', code: 'F·H·P·S', title: '硬核极客工匠', emoji: '🛠️',
      role: '工程落地 · 硬件/算法底座 · 质量担当',
      color: '#059669', bg: '#ecfdf5', border: '#a7f3d0',
      bestPartners: ['pitcher', 'bulldozer'],
      goodPartners: ['visionary', 'actuary'],
      cautionPartners: [],
      bestReasons: {
        pitcher: '你做出硬核作品，TA 帮你讲出让评委拍案叫绝的故事',
        bulldozer: 'TA 管进度和申报材料，你专心把作品打磨到极致'
      },
      cautionNote: ''
    },
    pitcher: {
      id: 'pitcher', code: 'G·H·D·L', title: '天选路演嘴替', emoji: '🎤',
      role: '答辩场控 · 商业叙事 · 视觉表达',
      color: '#db2777', bg: '#fdf2f8', border: '#fbcfe8',
      bestPartners: ['artisan', 'actuary'],
      goodPartners: ['visionary', 'nightcoder'],
      cautionPartners: ['pitcher'],
      bestReasons: {
        artisan: '扎实技术原型 + 顶级路演表达，答辩现场直接降维打击',
        actuary: '严谨数据模型配上你的故事力，评委很难不给高分'
      },
      cautionNote: '两位路演王者同队，记得再拉一位硬核技术或数据同学坐镇'
    },
    visionary: {
      id: 'visionary', code: 'F·H·D·S', title: '跨界脑洞整活家', emoji: '🎨',
      role: '差异化选题 · 交互设计 · 创意破局',
      color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4',
      bestPartners: ['bulldozer', 'actuary'],
      goodPartners: ['artisan', 'pitcher'],
      cautionPartners: ['nightcoder'],
      bestReasons: {
        bulldozer: 'TA 帮你把天马行空的灵感收敛成能落地、能拿奖的方案',
        actuary: '创意脑洞 + 严谨数据支撑，既有新意又经得起推敲'
      },
      cautionNote: '创意与爆发都拉满，但别在赛程过半时一起推翻重写'
    },
    actuary: {
      id: 'actuary', code: 'G·C·P·S', title: '稳健数据精算师', emoji: '📊',
      role: '建模求解 · 数据可视化 · 规范排版',
      color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe',
      bestPartners: ['pitcher', 'visionary'],
      goodPartners: ['bulldozer', 'anchor'],
      cautionPartners: [],
      bestReasons: {
        pitcher: '你的严谨模型有了极佳的表达包装，拿奖性价比拉满',
        visionary: '理性分析搭配独特切入点，作品脱颖而出'
      },
      cautionNote: ''
    },
    anchor: {
      id: 'anchor', code: 'F·C·P·L', title: '全队定海神针', emoji: '🧋',
      role: '团队粘合剂 · 调研文档 · 稳态兜底',
      color: '#ea580c', bg: '#fff7ed', border: '#fed7aa',
      bestPartners: ['nightcoder', 'artisan'],
      goodPartners: ['chill', 'actuary'],
      cautionPartners: [],
      bestReasons: {
        nightcoder: '你稳住交付与心态，TA 负责攻克最难的技术冲刺',
        artisan: '你包办调研沟通与收尾，让技术大佬零后顾之忧'
      },
      cautionNote: ''
    },
    chill: {
      id: 'chill', code: 'F·C·D·S', title: '人间清醒体验家', emoji: '🌈',
      role: '松弛感担当 · 创意协助 · 快乐参赛',
      color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc',
      bestPartners: ['anchor', 'actuary'],
      goodPartners: ['visionary', 'chill'],
      cautionPartners: ['bulldozer'],
      bestReasons: {
        anchor: '沟通舒服不内耗，轻轻松松把完整作品做出来',
        actuary: '不盲目熬夜卷时长，讲究节奏稳稳拿奖'
      },
      cautionNote: '对方偏高强度冲奖节奏，组队前先沟通好每周投入时间'
    }
  };

  function getLocalPersonality() {
    try {
      const id = localStorage.getItem(STORAGE_KEY) || '';
      return PERSONALITIES[id] ? id : '';
    } catch (_) {
      return '';
    }
  }

  function setLocalPersonality(id) {
    if (!PERSONALITIES[id]) return;
    try { localStorage.setItem(STORAGE_KEY, id); } catch (_) {}
  }

  function getPersonalityFit(myId, otherId) {
    const mine = PERSONALITIES[myId];
    const other = PERSONALITIES[otherId];
    if (!mine || !other) return null;
    if (mine.bestPartners.includes(otherId)) {
      return {
        level: 'best',
        score: 3,
        badge: '💘 与你天选绝配',
        reason: mine.bestReasons[otherId] || `你的「${mine.title}」与对方「${other.title}」高度互补`
      };
    }
    if (mine.goodPartners.includes(otherId)) {
      return {
        level: 'good',
        score: 2,
        badge: '✨ 人格默契',
        reason: `「${mine.title}」×「${other.title}」节奏合拍，协作顺畅`
      };
    }
    if (mine.cautionPartners.includes(otherId)) {
      return {
        level: 'caution',
        score: 0,
        badge: '⚡ 节奏提醒',
        reason: mine.cautionNote || '双方节奏差异较大，组队前建议先沟通投入时间'
      };
    }
    return {
      level: 'neutral',
      score: 1,
      badge: '',
      reason: ''
    };
  }

  window.COMPETITION_PERSONALITIES = PERSONALITIES;
  window.getLocalPersonality = getLocalPersonality;
  window.setLocalPersonality = setLocalPersonality;
  window.getPersonalityFit = getPersonalityFit;
})();
