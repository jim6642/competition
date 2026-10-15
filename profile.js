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
      typeof saved[key] === 'string' ? saved[key].slice(0, key === 'skills' || key === 'wanted' ? 4000 : 500) : DEFAULT_PROFILE[key]
    ]));
  } catch (_) { return {...DEFAULT_PROFILE}; }
}
function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}
function splitProfileList(value) {
  return String(value || '').split(/[、,，;；\n]+/).map(item => item.trim()).filter(Boolean);
}
function createTagPicker(container, groups, onChange) {
  const buttons = new Map();
  const options = Object.values(groups).flat();
  let selected = new Set();
  const customChoices = document.createElement('div');
  customChoices.className = 'tag-choices';
  function makeButton(tag, choices, custom = false) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tag-choice';
    button.textContent = tag;
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => {
      if (selected.has(tag)) {
        selected.delete(tag);
        if (custom) { buttons.delete(tag); button.remove(); }
        else button.setAttribute('aria-pressed', 'false');
      } else {
        selected.add(tag);
        button.setAttribute('aria-pressed', 'true');
      }
      if (onChange) onChange();
    });
    buttons.set(tag, button);
    choices.append(button);
    return button;
  }
  Object.entries(groups).forEach(([title, tags]) => {
    const collapsible = container.id === 'skills-tags';
    const group = document.createElement(collapsible ? 'details' : 'div');
    group.className = 'tag-group';
    const heading = document.createElement(collapsible ? 'summary' : 'span');
    heading.className = 'tag-group-title';
    heading.textContent = collapsible ? `${title}（${tags.length}）` : title;
    group.append(heading);
    const choices = document.createElement('div');
    choices.className = 'tag-choices';
    tags.forEach(tag => makeButton(tag, choices));
    group.append(choices);
    container.append(group);
  });
  const customGroup = document.createElement('div');
  customGroup.className = 'tag-group';
  const customTitle = document.createElement('span');
  customTitle.className = 'tag-group-title';
  customTitle.textContent = '没有合适的？添加自定义标签';
  const customInput = document.createElement('input');
  customInput.type = 'text';
  customInput.maxLength = 30;
  customInput.className = 'tag-custom-input';
  customInput.setAttribute('aria-label', '自定义标签名称');
  customInput.placeholder = '输入一个新标签';
  const customButton = document.createElement('button');
  customButton.type = 'button';
  customButton.className = 'tag-custom-add';
  customButton.textContent = '添加标签';
  function addCustom() {
    const tag = customInput.value.trim().replace(/\s+/g, ' ');
    if (!tag) return;
    const existing = [...buttons.keys()].find(value => value.toLocaleLowerCase() === tag.toLocaleLowerCase());
    const value = existing || tag;
    if (!buttons.has(value)) makeButton(value, customChoices, true);
    selected.add(value);
    buttons.get(value).setAttribute('aria-pressed', 'true');
    buttons.get(value).closest('details')?.setAttribute('open', '');
    customInput.value = '';
    if (onChange) onChange();
  }
  customButton.addEventListener('click', addCustom);
  customInput.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); addCustom(); } });
  const customRow = document.createElement('div');
  customRow.className = 'tag-custom-row';
  customRow.append(customInput, customButton);
  customGroup.append(customTitle, customChoices, customRow);
  container.append(customGroup);
  return {
    getSelected: () => [...options.filter(tag => selected.has(tag)), ...[...selected].filter(tag => !options.includes(tag))],
    setSelected: values => {
      customChoices.replaceChildren();
      [...buttons.keys()].filter(tag => !options.includes(tag)).forEach(tag => buttons.delete(tag));
      selected = new Set(values.filter(Boolean));
      [...selected].filter(tag => !buttons.has(tag)).forEach(tag => makeButton(tag, customChoices, true));
      buttons.forEach((button, tag) => {
        button.setAttribute('aria-pressed', String(selected.has(tag)));
        if (selected.has(tag)) button.closest('details')?.setAttribute('open', '');
      });
    }
  };
}
