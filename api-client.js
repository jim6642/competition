// GitHub Pages 保留本地演示；competition 子域名由同源 API 提供真实账号功能。
window.CompetitionAPI = (() => {
  const hostname = window.location.hostname;
  const enabled = ['http:', 'https:'].includes(window.location.protocol) && !hostname.endsWith('github.io');
  async function request(path, options = {}) {
    if (!enabled) throw new Error('当前是静态演示站。登录、发布招募和真实私聊请访问竞赛站。');
    const headers = new Headers(options.headers || {});
    if (options.body !== undefined) headers.set('Content-Type', 'application/json');
    const response = await fetch(path, {...options, headers, credentials: 'same-origin', cache: 'no-store'});
    let result = {};
    try { result = await response.json(); } catch (_) { /* 保留下面的统一错误提示 */ }
    if (!response.ok) throw new Error(result.error || `请求失败（${response.status}）`);
    return result;
  }
  return {
    enabled,
    request,
    me: () => request('/api/auth/me'),
    profile: () => request('/api/profile'),
    saveProfile: profile => request('/api/profile', {method: 'PUT', body: JSON.stringify(profile)}),
    login: (username, password) => request('/api/auth/login', {method: 'POST', body: JSON.stringify({username, password})}),
    register: (username, password, profile) => request('/api/auth/register', {method: 'POST', body: JSON.stringify({username, password, profile})}),
    logout: () => request('/api/auth/logout', {method: 'POST', body: '{}'})
  };
})();
