// 演示版画像仅保存在当前浏览器，不会上传或分享给其他访客。
const PROFILE_KEY = 'competition.profile.v1';
const DEFAULT_PROFILE = Object.freeze({
  name: '张同学', school: '电子科技大学', major: '微电子科学与工程', grade: '大三',
  skills: 'FPGA、Verilog、PCB 设计、模拟电路',
  experience: '参与校级电子设计项目，负责电路搭建与 FPGA 模块调试。',
  competition: 'edc', role: '硬件设计负责人', wanted: '算法、视觉、软件开发'
});
function loadProfile() {
  try {
    const saved = JSON.parse(localStorage.getItem(PROFILE_KEY));
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {...DEFAULT_PROFILE};
    return Object.fromEntries(Object.keys(DEFAULT_PROFILE).map(key => [key,
      typeof saved[key] === 'string' ? saved[key].slice(0, 500) : DEFAULT_PROFILE[key]
    ]));
  } catch (_) { return {...DEFAULT_PROFILE}; }
}
function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}
function splitProfileList(value) {
  return String(value || '').split(/[、,，;；\n]+/).map(item => item.trim()).filter(Boolean);
}
