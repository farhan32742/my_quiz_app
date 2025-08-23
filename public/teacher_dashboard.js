document.addEventListener('DOMContentLoaded', () => {
    const activeExamsElement = document.querySelector('.metric-card:nth-child(2) .metric-value span');
    const totalStudentsElement = document.querySelector('.metric-card:nth-child(3) .metric-value span');
    const examsContainer = document.querySelector('.column-left');

    // Fetches and updates the metric cards (Active Exams, Total Students)
    const fetchMetrics = async () => {
        try {
            const response = await fetch('/api/dashboard/metrics');
            if (!response.ok) throw new Error('Failed to fetch metrics');
            const data = await response.json();
            activeExamsElement.textContent = data.activeExams || '0';
            totalStudentsElement.textContent = data.totalStudents || '0';
        } catch (error) {
            console.error('Error fetching metrics:', error);
            activeExamsElement.textContent = 'N/A';
            totalStudentsElement.textContent = 'N/A';
        }
    };

    // Fetches all quizzes and dynamically builds the exam list
    const fetchQuizzes = async () => {
        try {
            const response = await fetch('/api/dashboard/quizzes');
            if (!response.ok) throw new Error('Failed to fetch quizzes');
            const quizzes = await response.json();

            // Clear the static placeholder content but keep the heading
            const existingCards = examsContainer.querySelectorAll('.exam-card');
            existingCards.forEach(card => card.remove());

            if (quizzes.length === 0) {
                examsContainer.insertAdjacentHTML('beforeend', '<p>No exams have been created yet.</p>');
                return;
            }

            quizzes.forEach(quiz => {
                const isComplete = quiz.status === 'complete';
                const examCardHTML = `
                    <div class="card exam-card">
                        <div class="exam-header">
                            <h4>${quiz.book}</h4>
                            <span class="status ${quiz.status}">${quiz.status}</span>
                        </div>
                        <div class="card-actions">
                            <button class="btn btn-view"><i class="fas fa-eye"></i> View</button>
                            <button 
                                class="btn btn-export" 
                                data-quiz-id="${quiz.id}" 
                                ${!isComplete ? 'disabled title="Export is available after the exam is complete."' : ''}
                            >
                                <i class="fas fa-download"></i> Export
                            </button>
                        </div>
                    </div>
                `;
                examsContainer.insertAdjacentHTML('beforeend', examCardHTML);
            });
        } catch (error) {
            console.error('Error fetching quizzes:', error);
            examsContainer.innerHTML += '<p style="color: red;">Could not load exams.</p>';
        }
    };

    // Use event delegation to handle clicks on future "Export" buttons
    examsContainer.addEventListener('click', (event) => {
        const exportButton = event.target.closest('.btn-export');
        if (exportButton && !exportButton.disabled) {
            const quizId = exportButton.dataset.quizId;
            // Trigger the download by navigating to the API endpoint
            window.location.href = `/api/dashboard/quizzes/${quizId}/export`;
        }
    });

    // Initial data load when the page is ready
    fetchMetrics();
    fetchQuizzes();
});