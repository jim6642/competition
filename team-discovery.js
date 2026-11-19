(() => {
  const pillsContainer = document.getElementById('contest-pills');
  const feedCompetition = document.getElementById('feed-competition');
  if (!pillsContainer) return;

  let contestCounts = {};
  const contestEntries = Object.entries(matchScenarios);

  function renderPills() {
    const active = competitionChoice.value || 'all';
    const totalCount = Object.values(contestCounts).reduce((sum, n) => sum + Number(n || 0), 0);
    const allPill = `<button type="button" class="contest-pill" data-contest="all" aria-pressed="${active === 'all'}">全部${totalCount ? ` <span class="pill-count">${totalCount}</span>` : ''}</button>`;
    const itemPills = contestEntries.map(([key, scenario]) => {
      const count = Number(contestCounts[key]) || 0;
      const label = scenario.short || scenario.label;
      return `<button type="button" class="contest-pill" data-contest="${key}" title="${escapeHtml(scenario.label)}" aria-pressed="${active === key}">${escapeHtml(label)}${count ? ` <span class="pill-count">${count}</span>` : ''}</button>`;
    }).join('');
    pillsContainer.innerHTML = allPill + itemPills;
  }

  function selectContest(key, notify = true) {
    const next = key && matchScenarios[key] ? key : 'all';
    competitionChoice.value = next;
    feedCompetition.textContent = next === 'all' ? '全部比赛' : matchScenarios[next].label;
    renderPills();
    if (notify) competitionChoice.dispatchEvent(new Event('change'));
  }

  pillsContainer.addEventListener('click', event => {
    const button = event.target.closest('[data-contest]');
    if (!button) return;
    selectContest(button.dataset.contest);
  });

  window.selectContest = selectContest;
  window.updateContestCounts = counts => {
    contestCounts = counts && typeof counts === 'object' ? counts : {};
    renderPills();
  };

  const requested = new URLSearchParams(window.location.search).get('contest');
  selectContest(requested && matchScenarios[requested] ? requested : 'all', false);
})();
