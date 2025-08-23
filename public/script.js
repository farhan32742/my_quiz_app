document.addEventListener('DOMContentLoaded', function() {
    const startExamButtons = document.querySelectorAll('.btn-primary');

    startExamButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault(); // Prevents the default link behavior
            alert('This would start the exam!');
        });
    });
});
