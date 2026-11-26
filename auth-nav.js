document.addEventListener('DOMContentLoaded', async () => {
  const account = document.querySelector('.nav-account');
  if (!account || !window.CompetitionAPI?.enabled) return;

  const entry = account.querySelector('.account-entry');
  const logout = account.querySelector('.account-logout');
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
    // The fixed account slot remains usable when the service is unavailable.
  }
});
