document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const quizId = params.get('quizId');
  if (!quizId) return alert('Missing quizId');

  const authHeaders = {};

  const res = await fetch(`/api/exams/${quizId}`, { headers: authHeaders, credentials: 'include' });
  if (!res.ok) {
    const txt = await res.text();
    return alert(`Cannot load quiz: ${txt}`);
  }
  const data = await res.json();
  const { quiz, questions } = data;
  document.getElementById('exam-title').textContent = quiz.book || 'Exam';

  // Start attempt
  const startRes = await fetch(`/api/exams/${quizId}/start`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders }, credentials: 'include' });
  if (!startRes.ok) return alert('Failed to start attempt');
  const { attemptId, serverNow, timeAllowed } = await startRes.json();

  // Render questions
  const form = document.getElementById('exam-form');
  questions.forEach((q, idx) => {
    const block = document.createElement('div');
    block.className = 'card mb-3';
    const optionsHtml = q.options.map((o, i) => {
      const name = `q_${q.id}`;
      return `
        <div class="form-check">
          <input class="form-check-input" type="radio" name="${name}" id="${name}_${o.id}" value="${o.id}" />
          <label class="form-check-label" for="${name}_${o.id}">${o.text}</label>
        </div>`;
    }).join('');
    block.innerHTML = `
      <div class="card-body">
        <h5 class="card-title">Q${idx+1}. ${q.question_text}</h5>
        ${optionsHtml}
      </div>`;
    form.appendChild(block);
  });

  document.getElementById('submit-exam').addEventListener('click', async () => {
    const answers = questions.map(q => {
      const selected = form.querySelector(`input[name="q_${q.id}"]:checked`);
      return { questionId: q.id, selectedOptionId: selected ? Number(selected.value) : null };
    });
    if (answers.some(a => a.selectedOptionId === null)) {
      if (!confirm('Some questions are unanswered. Submit anyway?')) return;
    }

    const resp = await fetch(`/api/exams/attempts/${attemptId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      credentials: 'include',
      body: JSON.stringify({ answers })
    });
    if (!resp.ok) {
      const txt = await resp.text();
      return alert(`Submit failed: ${txt}`);
    }
    const result = await resp.json();
    alert(`Submitted!\nScore: ${result.score}\nPercentage: ${result.percentage.toFixed(1)}%\nGrade: ${result.grade}`);
    window.location.href = '/studentDashboard';
  });

  // Timer at top: countdown from timeAllowed minutes based on server start time
  if (serverNow && timeAllowed) {
    const startTime = new Date(serverNow);
    const endTime = new Date(startTime.getTime() + timeAllowed * 60 * 1000);
    const timerEl = document.getElementById('timer');
    const tick = async () => {
      const now = new Date();
      const diff = Math.max(0, endTime - now);
      const totalSec = Math.floor(diff / 1000);
      const m = Math.floor(totalSec / 60);
      const s = totalSec % 60;
      timerEl.textContent = `Time remaining: ${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
      if (diff <= 0) {
        // Auto-submit when time is up
        document.getElementById('submit-exam').click();
      } else {
        setTimeout(tick, 1000);
      }
    };
    tick();
  }
});


