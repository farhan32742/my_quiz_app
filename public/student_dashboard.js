document.addEventListener('DOMContentLoaded', () => {
    // Use httpOnly cookie set on login; no need for localStorage token
    const authHeader = {}; // cookies are sent automatically

    // Fetch and populate metrics
    fetch('/api/student-dashboard/metrics', { headers: authHeader, credentials: 'include' })
        .then(res => res.json())
        .then(data => {
            document.getElementById('total-exams-value').innerHTML = `${data.totalExams || 0} <i class="fas fa-book"></i>`;
            document.getElementById('completed-exams-value').innerHTML = `${data.completedExams || 0} <i class="fas fa-check-circle text-success"></i>`;
            document.getElementById('average-score-value').innerHTML = `${parseFloat(data.averageScore || 0).toFixed(1)}% <i class="fas fa-chart-line text-success"></i>`;
            document.getElementById('class-rank-value').textContent = `#${data.classRank || 'N/A'}`;
        });

    // Helper to format countdown from a future Date
    const formatCountdown = (futureDate) => {
        const now = new Date();
        const diffMs = futureDate - now;
        if (diffMs <= 0) return 'Starting now';
        const totalSec = Math.floor(diffMs / 1000);
        const days = Math.floor(totalSec / 86400);
        const hours = Math.floor((totalSec % 86400) / 3600);
        const minutes = Math.floor((totalSec % 3600) / 60);
        const seconds = totalSec % 60;
        if (days > 0) return `${days}d ${hours}h ${minutes}m`;
        return `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
    };

    // Fetch and populate upcoming exams
    fetch('/api/student-dashboard/upcoming-exams', { headers: authHeader, credentials: 'include' })
        .then(res => res.json())
        .then(exams => {
            const container = document.getElementById('upcoming-exams-list');
            container.innerHTML = '';
            if (!exams.length) {
                container.innerHTML = '<p class="text-muted">No upcoming exams.</p>';
                return;
            }
            exams.forEach(exam => {
                const examCard = document.createElement('div');
                examCard.className = 'card mb-3'; // Use your CSS class
                const startIso = `${exam.exam_date}T${exam.exam_time}`;
                const startDate = new Date(startIso);
                const countdownText = formatCountdown(startDate);
                examCard.innerHTML = `
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <h5 class="card-title">${exam.book}</h5>
                            <span class="badge bg-primary">Upcoming</span>
                        </div>
                        <h6 class="card-subtitle mb-2 text-muted">by Prof. ${exam.lastName}</h6>
                        <p class="card-text">
                            <i class="fas fa-calendar-alt"></i> ${new Date(exam.exam_date).toLocaleDateString()} ${exam.exam_time}
                            <i class="fas fa-clock ms-3"></i> ${exam.time_allowed} mins
                            <i class="fas fa-question-circle ms-3"></i> ${exam.num_mcqs} Questions
                            <i class="fas fa-star ms-3"></i> ${exam.total_points} Points
                            <span class="badge bg-info text-dark ms-3" data-countdown="${startIso}">Starts in: ${countdownText}</span>
                        </p>
                        ${exam.status === 'active' 
                            ? `<a href="/takeExam.html?quizId=${exam.id}" class="btn btn-primary">Start Exam</a>` 
                            : `<button class="btn btn-secondary" disabled>Not Active</button>`
                        }
                    </div>`;
                container.appendChild(examCard);
            });

            // Update countdown labels every second (lightweight)
            setInterval(() => {
                document.querySelectorAll('[data-countdown]').forEach(el => {
                    const ts = el.getAttribute('data-countdown');
                    const dt = new Date(ts);
                    el.textContent = `Starts in: ${formatCountdown(dt)}`;
                });
            }, 1000);
        });

    // Fetch and populate recent results
    fetch('/api/student-dashboard/recent-results', { headers: authHeader, credentials: 'include' })
        .then(res => res.json())
        .then(results => {
            const container = document.getElementById('recent-results-list');
            container.innerHTML = '';
            if (!results.length) {
                container.innerHTML = '<p class="text-muted">No results found.</p>';
                return;
            }
            results.forEach(result => {
                const percentage = (result.score / result.total_marks) * 100;
                const resultCard = document.createElement('div');
                resultCard.className = 'card mb-3'; // Use your CSS class
                resultCard.innerHTML = `
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <h5 class="card-title">${result.book}</h5>
                            <span class="badge bg-success">Grade A</span>
                        </div>
                        <h6 class="card-subtitle mb-2 text-muted">Submitted ${new Date(result.end_time).toLocaleDateString()}</h6>
                        <p class="card-text">Score: ${result.score}/${result.total_marks}</p>
                        <div class="progress">
                            <div class="progress-bar bg-primary" role="progressbar" style="width: ${percentage}%;" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100">${percentage.toFixed(0)}%</div>
                        </div>
                    </div>`;
                container.appendChild(resultCard);
            });
        });

    // Auto-refresh the page every 15 seconds to reflect status changes
    setInterval(() => {
        window.location.reload();
    }, 15000);
        
    // Logout functionality
    const logoutBtn = document.getElementById('logout-button');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            // Server clears cookie when you add such an endpoint; for now just navigate
            window.location.href = '/login';
        });
    }
});