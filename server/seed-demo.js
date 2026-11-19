'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { promisify } = require('node:util');
const Database = require('better-sqlite3');
const labMatching = require('./lab-matching');

const scrypt = promisify(crypto.scrypt);
const DB_PATH = path.resolve(process.env.COMPETITION_DB_PATH || path.join(__dirname, 'data.sqlite'));

const DEMO_SEEDS = [
  {
    username: 'demo_lin',
    profile: {
      name: '林嘉宁', school: '电子科技大学', major: '自动化', grade: '大三',
      skills: 'ROS2、OpenCV、C++、控制算法',
      experience: '上赛季 RoboMaster 区域赛视觉组核心，负责目标识别与自瞄联调。',
      competition: 'robomaster', role: '视觉组负责人', wanted: '视觉、算法、软件开发'
    },
    post: {
      competition: 'robomaster', recruitCount: 2,
      gaps: ['视觉', '算法', '软件开发'],
      members: [{name: '陈浩', role: '机械结构'}, {name: '刘宇', role: '嵌入式'}],
      note: '视觉组已有基础自瞄框架，想找熟悉 OpenCV / ROS2 的同学一起优化弹道预测与识别。'
    },
    lab: {
      intent: 'recruit', grade: '大三', discipline: ['engineering'],
      interests: ['robotics', 'software'], skills: ['ROS2', 'OpenCV', 'C++', '控制算法'],
      experience: 'contest', competition: ['robomaster', 'edc'],
      availability: 'intensive', preference: ['complement', 'similar']
    }
  },
  {
    username: 'demo_zhou',
    profile: {
      name: '周昱辰', school: '哈尔滨工业大学', major: '数学与应用数学', grade: '大三',
      skills: '数学建模、MATLAB、Python、统计分析',
      experience: '校级数模一等奖，熟悉规划模型、机器学习预测与灵敏度分析。',
      competition: 'cumcm', role: '建模负责人', wanted: '论文写作、可视化'
    },
    post: {
      competition: 'cumcm', recruitCount: 1,
      gaps: ['论文写作', '可视化'],
      members: [{name: '李想', role: '编程与求解'}],
      note: '建模和 Python/MATLAB 求解已就位，冲国奖，缺一位擅长 LaTeX 排版与论文写作的同学。'
    },
    lab: {
      intent: 'recruit', grade: '大三', discipline: ['science'],
      interests: ['data', 'writing'], skills: ['数学建模', 'MATLAB', 'Python', '统计分析'],
      experience: 'award', competition: ['cumcm', 'mcm'],
      availability: 'steady', preference: ['complement']
    }
  },
  {
    username: 'demo_chen',
    profile: {
      name: '陈思远', school: '华南理工大学', major: '计算机科学与技术', grade: '大二',
      skills: 'Python、前端开发、后端开发、数据库',
      experience: '参与校级大创项目，独立完成全栈原型开发与线上部署。',
      competition: 'internet', role: '技术负责人', wanted: '产品设计、商业分析、路演表达'
    },
    post: {
      competition: 'internet', recruitCount: 2,
      gaps: ['产品设计', '商业分析', '路演表达'],
      members: [{name: '王凯', role: '前端开发'}],
      note: '校园 AI 学习助手方向，已有小程序原型与后端接口，缺产品设计与商业计划书撰写伙伴。'
    },
    lab: {
      intent: 'recruit', grade: '大二', discipline: ['engineering'],
      interests: ['business', 'design', 'software'], skills: ['Python', '前端开发', '后端开发', '数据库'],
      experience: 'project', competition: ['internet', 'fwwb'],
      availability: 'steady', preference: ['complement', 'peer']
    }
  },
  {
    username: 'demo_zhao',
    profile: {
      name: '赵若溪', school: '同济大学', major: '工业设计', grade: '大三',
      skills: 'Figma、交互原型、用户研究、视觉设计',
      experience: '曾获省赛设计类二等奖，擅长用户调研、原型设计与答辩视觉呈现。',
      competition: 'challenge', role: '产品与调研负责人', wanted: '数据分析、软件开发'
    },
    post: {
      competition: 'challenge', recruitCount: 1,
      gaps: ['数据分析', '软件开发'],
      members: [{name: '孙悦', role: '调研与文案'}],
      note: '城市无障碍出行调研与交互系统项目，已有完整调研数据和原型，需要技术同学一起落地演示端。'
    },
    lab: {
      intent: 'recruit', grade: '大三', discipline: ['arts', 'humanities'],
      interests: ['design', 'research'], skills: ['Figma', '交互原型', '用户研究', '视觉设计'],
      experience: 'award', competition: ['challenge', 'daguangsai'],
      availability: 'steady', preference: ['complement']
    }
  },
  {
    username: 'demo_wu',
    profile: {
      name: '吴景行', school: '西安电子科技大学', major: '微电子科学与工程', grade: '大三',
      skills: 'FPGA、Verilog、硬件调试、PCB 设计',
      experience: '电赛省一成员，做过基于 FPGA 的高速信号采集与图像预处理系统。',
      competition: 'ciciec', role: 'FPGA 架构负责人', wanted: '算法、嵌入式、测试优化'
    },
    post: {
      competition: 'ciciec', recruitCount: 2,
      gaps: ['算法', '嵌入式', '测试优化'],
      members: [{name: '张明', role: '数字前端'}],
      note: '准备做基于 FPGA 的轻量级图像加速模块，已有板卡和 RTL 经验，欢迎熟悉 Verilog 或验证的同学。'
    },
    lab: {
      intent: 'recruit', grade: '大三', discipline: ['engineering'],
      interests: ['hardware', 'software'], skills: ['FPGA', 'Verilog', '硬件调试', 'PCB 设计'],
      experience: 'award', competition: ['ciciec', 'edc'],
      availability: 'intensive', preference: ['complement', 'similar']
    }
  },
  {
    username: 'demo_zheng',
    profile: {
      name: '郑可欣', school: '浙江工业大学', major: '软件工程', grade: '大二',
      skills: 'JavaScript、前端开发、Git、数据可视化',
      experience: '做过校园二手交易与课表工具 Web 应用，熟悉前后端联调。',
      competition: 'jsjds', role: '前端与项目统筹', wanted: '产品设计、可视化'
    },
    post: {
      competition: 'jsjds', recruitCount: 1,
      gaps: ['产品设计', '可视化'],
      members: [{name: '黄涛', role: '后端开发'}, {name: '郭瑞', role: '前端开发'}],
      note: '报名软件应用与开发赛道，主题是校园碳足迹可视化平台，前后端已齐，缺 UI 与交互设计伙伴。'
    },
    lab: {
      intent: 'recruit', grade: '大二', discipline: ['engineering'],
      interests: ['software', 'design'], skills: ['JavaScript', '前端开发', 'Git', '数据可视化'],
      experience: 'project', competition: ['jsjds', 'fwwb'],
      availability: 'steady', preference: ['complement', 'peer']
    }
  },
  {
    username: 'demo_wang',
    profile: {
      name: '王子墨', school: '重庆大学', major: '统计学', grade: '大三',
      skills: 'Python、数据分析、数据可视化、机器学习',
      experience: '国赛数模省二，擅长数据清洗、特征工程与可视化图表制作。',
      competition: 'mcm', role: '数据分析与建模', wanted: '英文写作、算法'
    },
    post: {
      competition: 'mcm', recruitCount: 1,
      gaps: ['英文写作', '算法'],
      members: [{name: '徐航', role: 'Python 建模'}],
      note: '目标冲 M 奖以上，每周可固定做一次真题复盘，已有建模与数据分析成员，寻找英语读写流利的队友。'
    },
    lab: {
      intent: 'recruit', grade: '大三', discipline: ['science'],
      interests: ['data', 'writing'], skills: ['Python', '数据清洗', '数据可视化', '机器学习'],
      experience: 'contest', competition: ['mcm', 'cumcm'],
      availability: 'steady', preference: ['complement']
    }
  },
  {
    username: 'demo_sun',
    profile: {
      name: '孙语桐', school: '武汉理工大学', major: '经济统计学', grade: '大二',
      skills: '市场调研、问卷设计、SPSS、PPT',
      experience: '参与过两项社会实践调研并获校级优秀报告，擅长访谈与问卷设计。',
      competition: 'shidiao', role: '调研与选题负责人', wanted: '数据分析、论文写作、可视化'
    },
    post: {
      competition: 'shidiao', recruitCount: 2,
      gaps: ['数据分析', '论文写作', '可视化'],
      members: [{name: '宋洁', role: '问卷与访谈'}],
      note: '选题聚焦新能源二手车消费意愿调研，已有问卷初稿与导师指导，欢迎熟悉 SPSS/Python 或图表制作的同学。'
    },
    lab: {
      intent: 'recruit', grade: '大二', discipline: ['business', 'science'],
      interests: ['business', 'data', 'research'], skills: ['市场调研', '问卷设计', 'SPSS', 'PPT'],
      experience: 'course', competition: ['shidiao', 'challenge'],
      availability: 'flexible', preference: ['complement', 'peer']
    }
  },
  {
    username: 'demo_he',
    profile: {
      name: '何明哲', school: '北京理工大学', major: '计算机科学与技术', grade: '大二',
      skills: 'C++、算法与数据结构、Python、Git',
      experience: '校赛程序设计三等奖，每周坚持刷题，擅长图论与动态规划基础题。',
      competition: 'lanqiao', role: '算法训练发起人', wanted: '算法、代码实现、测试优化'
    },
    post: {
      competition: 'lanqiao', recruitCount: 2,
      gaps: ['算法', '代码实现', '测试优化'],
      members: [],
      note: '组一个 C++/Python 刷题互助小队，每周三晚和周日一起打模拟赛并互相讲题复盘，冲省一国奖。'
    },
    lab: {
      intent: 'recruit', grade: '大二', discipline: ['engineering'],
      interests: ['software'], skills: ['C++', '算法与数据结构', 'Python', 'Git'],
      experience: 'contest', competition: ['lanqiao', 'icpc'],
      availability: 'steady', preference: ['similar', 'peer']
    }
  },
  {
    username: 'demo_xu',
    profile: {
      name: '许安然', school: '南京航空航天大学', major: '机械工程', grade: '大三',
      skills: 'SolidWorks、三维建模、CAD、实验设计',
      experience: '机械创新校赛一等奖，负责整机结构设计、运动仿真与 3D 打印加工。',
      competition: 'mechanical', role: '机械结构负责人', wanted: '嵌入式、测试优化'
    },
    post: {
      competition: 'mechanical', recruitCount: 1,
      gaps: ['嵌入式', '测试优化'],
      members: [{name: '马越', role: '三维建模'}, {name: '杨帆', role: '结构加工'}],
      note: '设计一款智能分拣与搬运机构，SolidWorks 整机建模已完成 80%，急需懂 STM32 与电机控制的电控队友。'
    },
    lab: {
      intent: 'recruit', grade: '大三', discipline: ['engineering'],
      interests: ['robotics', 'hardware'], skills: ['SolidWorks', '三维建模', 'CAD', '实验设计'],
      experience: 'award', competition: ['mechanical', 'robomaster'],
      availability: 'intensive', preference: ['complement']
    }
  }
];

async function main() {
  fs.mkdirSync(path.dirname(DB_PATH), {recursive: true, mode: 0o700});
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');

  const userByName = db.prepare('SELECT id FROM users WHERE username_key = ?');
  const insertUser = db.prepare('INSERT INTO users(username, username_key, password_salt, password_hash, profile_json) VALUES (?, ?, ?, ?, ?)');
  const activePostByUser = db.prepare('SELECT id FROM team_posts WHERE user_id = ? AND competition = ? AND active = 1');
  const insertPost = db.prepare('INSERT INTO team_posts(user_id, competition, recruit_count, gaps_json, team_json) VALUES (?, ?, ?, ?, ?)');
  const upsertLab = db.prepare(`INSERT INTO lab_profiles(user_id, answers_json, discoverable) VALUES (?, ?, 1)
    ON CONFLICT(user_id) DO UPDATE SET answers_json = excluded.answers_json, discoverable = 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')`);

  let createdUsers = 0;
  let createdPosts = 0;

  for (const item of DEMO_SEEDS) {
    const validatedLab = labMatching.validateAnswers(item.lab);
    let existing = userByName.get(item.username.toLocaleLowerCase());
    let userId;
    if (existing) {
      userId = existing.id;
    } else {
      const salt = crypto.randomBytes(16);
      const randomSecret = crypto.randomBytes(24).toString('hex');
      const hash = await scrypt(randomSecret, salt, 64, {N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024});
      userId = Number(insertUser.run(
        item.username,
        item.username.toLocaleLowerCase(),
        salt.toString('hex'),
        Buffer.from(hash).toString('hex'),
        JSON.stringify(item.profile)
      ).lastInsertRowid);
      createdUsers += 1;
    }

    if (!activePostByUser.get(userId, item.post.competition)) {
      const team = {profile: item.profile, members: item.post.members, note: item.post.note};
      insertPost.run(userId, item.post.competition, item.post.recruitCount, JSON.stringify(item.post.gaps), JSON.stringify(team));
      createdPosts += 1;
    }

    upsertLab.run(userId, JSON.stringify(validatedLab));
  }

  db.close();
  process.stdout.write(`seed-demo complete: createdUsers=${createdUsers}, createdPosts=${createdPosts}, totalSeeds=${DEMO_SEEDS.length}\n`);
}

main().catch(error => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exit(1);
});
