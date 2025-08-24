import { createQuiz, addQuestionsToDb } from '../models/examModel.js';

export const createExam = async (req, res) => {
  // REMOVED: const teacher_id = 1; 

  // The entire form data, including the teacher_id from the hidden field,
  // is now in req.body. We can pass it directly to the model.
  const quizData = req.body;

  // --- ADD THIS VALIDATION ---
  // It's crucial to check if the teacher_id exists before proceeding.
  if (!quizData.teacher_id) {
    console.error("Create exam error: teacher_id was not found in the request body.");
    // Redirect with an error message indicating a login issue.
    return res.redirect('/createExam?error=Could+not+verify+teacher+ID.+Please+try+logging+in+again.');
  }

  // The quizData object now automatically contains the correct teacher_id
  createQuiz(quizData, (err, quizId) => {
    if (err) {
      console.error("Failed to create exam:", err);
      return res.redirect('/createExam?error=Failed+to+create+exam');
    }
    
    // SUCCESS! Redirect to the page for adding questions.
    const num_mcqs = quizData.num_mcqs; // Use quizData for consistency
    res.redirect(`/addQuestions?quizId=${quizId}&num_mcqs=${num_mcqs}`); 
  });
};
// NEW FUNCTION to handle adding questions
export const addQuestions = async (req, res) => {
    const { quizId, questions } = req.body;

    if (!quizId || !questions || !Array.isArray(questions)) {
        return res.status(400).send("Invalid data submitted.");
    }

    addQuestionsToDb(quizId, questions, (err) => {
        if (err) {
            console.error("Failed to save questions:", err);
            // Redirect back with an error. Ideally, you would not lose the user's entered data.
            return res.redirect(`/addQuestions?quizId=${quizId}&num_mcqs=${questions.length}&error=Failed+to+save`);
        }
        
        // Success! Redirect to the main dashboard.
        res.redirect('/teacherDashboard?success=Exam+and+questions+created+successfully!');
    });
};