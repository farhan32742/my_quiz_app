document.addEventListener('DOMContentLoaded', () => {
  const authHeaders = {};

  const getJson = async (url) => {
    const res = await fetch(url, { headers: authHeaders });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return res.json();
  };

  const el = (selector) => document.querySelector(selector);

  const renderTopStats = (metrics) => {
    const activeUsersEl = document.querySelectorAll('.stat-card .stat-title');
    // Find cards by title text
    document.querySelectorAll('.stat-card').forEach(card => {
      const title = card.querySelector('.stat-title')?.textContent?.trim();
      const valueEl = card.querySelector('.stat-value');
      if (!valueEl) return;
      if (title === 'Active Users') valueEl.textContent = metrics.activeUsers;
      if (title === 'Active Exams') valueEl.textContent = metrics.activeExams;
      if (title === 'System Uptime') valueEl.textContent = `${metrics.systemUptimePct}%`;
      if (title === 'Performance') valueEl.textContent = `${metrics.performancePct}%`;
    });

    // User breakdown
    const cards = Array.from(document.querySelectorAll('.row.mt-4 .stat-card'));
    // Expect order: Students, Teachers, Admins
    const [studentsCard, teachersCard, adminsCard] = cards;
    if (studentsCard) {
      studentsCard.querySelector('h2').textContent = metrics.breakdown.students;
      const pct = metrics.activeUsers ? Math.round(metrics.breakdown.students / metrics.activeUsers * 100) : 0;
      studentsCard.querySelector('.progress-bar').style.width = `${pct}%`;
    }
    if (teachersCard) {
      teachersCard.querySelector('h2').textContent = metrics.breakdown.teachers;
      const pct = metrics.activeUsers ? Math.round(metrics.breakdown.teachers / metrics.activeUsers * 100) : 0;
      teachersCard.querySelector('.progress-bar').style.width = `${pct}%`;
    }
    if (adminsCard) {
      adminsCard.querySelector('h2').textContent = metrics.breakdown.admins;
      const pct = metrics.activeUsers ? Math.round(metrics.breakdown.admins / metrics.activeUsers * 100) : 0;
      adminsCard.querySelector('.progress-bar').style.width = `${pct}%`;
    }
  };

  const renderExamPerformance = (items) => {
    const container = document.querySelector('.card.full-height .card-body');
    if (!container) return;
    // Clear existing performance sections
    container.querySelectorAll('.exam-performance').forEach(n => n.remove());
    items.forEach(item => {
      const wrapper = document.createElement('div');
      wrapper.className = 'exam-performance';
      const pct = item.avgPct || 0;
      wrapper.innerHTML = `
        <p>${item.name} <span class="badge bg-light text-dark float-end">${pct}% avg</span></p>
        <div class="progress mb-3">
          <div class="progress-bar" role="progressbar" style="width: ${pct}%;" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">Completed: ${item.completed}</div>
        </div>
      `;
      container.appendChild(wrapper);
    });
  };

  const renderActivity = (items) => {
    const list = document.querySelector('.card.full-height ul.list-unstyled');
    if (!list) return;
    list.innerHTML = '';
    items.forEach(i => {
      const li = document.createElement('li');
      li.className = 'activity-item';
      li.innerHTML = `
        <h6>${i.title}</h6>
        <p>${i.description}<br><small class="text-muted">${new Date(i.created_at).toLocaleString()}</small></p>
      `;
      list.appendChild(li);
    });
  };

  const load = async () => {
    try {
      const [metrics, perf, activity] = await Promise.all([
        getJson('/api/admin/metrics'),
        getJson('/api/admin/exam-performance'),
        getJson('/api/admin/recent-activity')
      ]);
      renderTopStats(metrics);
      renderExamPerformance(perf);
      renderActivity(activity);
    } catch (e) {
      console.error('Failed to load admin dashboard:', e);
    }
  };

  load();
});


