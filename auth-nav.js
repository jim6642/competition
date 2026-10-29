document.addEventListener('DOMContentLoaded', async () => {
  const nav = document.querySelector('.nav-links');
  if (nav && !nav.querySelector('a[href="lab.html"]')) {
    const lab = document.createElement('a');
    lab.href = 'lab.html';
    lab.textContent = '组队实验室';
    nav.insertBefore(lab, nav.querySelector('a[href="profile.html"]'));
  }
  if (!nav || !window.CompetitionAPI?.enabled) return;
  const entry = document.createElement('a');
  entry.href = 'account.html';
  entry.textContent = '登录 / 注册';
  entry.className = 'account-entry';
  nav.append(entry);
  try {
    const {user} = await CompetitionAPI.me();
    if (!user) return;
    entry.href = 'profile.html';
    entry.textContent = user.username;
    entry.setAttribute('aria-label', `个人中心，当前账号 ${user.username}`);
    const logout = document.createElement('button');
    logout.type = 'button';
    logout.className = 'account-logout';
    logout.textContent = '退出';
    logout.addEventListener('click', async () => {
      logout.disabled = true;
      try { await CompetitionAPI.logout(); window.location.href = 'account.html'; }
      catch (error) { logout.disabled = false; alert(error.message); }
    });
    nav.append(logout);
  } catch (_) { /* API unavailable: the static experience remains usable. */ }
});
