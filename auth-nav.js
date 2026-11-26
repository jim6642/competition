document.addEventListener('DOMContentLoaded', () => {
  const logout = document.querySelector('.nav-account .account-logout');
  if (!logout || logout.hidden || !window.CompetitionAPI?.enabled) return;

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
});
