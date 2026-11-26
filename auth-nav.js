document.addEventListener('DOMContentLoaded', async () => {
  const account = document.querySelector('.nav-account');
  if (!account) return;

  const entry = account.querySelector('.account-entry');
  const logout = account.querySelector('.account-logout');
  const loading = account.querySelector('.account-loading');
  if (!window.CompetitionAPI?.enabled) {
    loading.hidden = true;
    entry.hidden = false;
    return;
  }
  try {
    const {user} = await CompetitionAPI.me();
    if (!user) return;
    entry.href = 'profile.html';
    entry.textContent = user.username;
    entry.title = user.username;
    entry.setAttribute('aria-label', '个人中心，当前账号 ' + user.username);
    logout.hidden = false;
    logout.addEventListener('click', async () => {
      logout.disabled = true;
      try {
        await CompetitionAPI.logout();
        window.location.href = 'account.html';
      } catch (error) {
        logout.disabled = false;
        alert(error.message);
      }
    });
  } catch (_) {
    entry.title = '登录状态暂时无法确认，点击进入账号页面';
  } finally {
    loading.hidden = true;
    entry.hidden = false;
  }
});
