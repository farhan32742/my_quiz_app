import { createQuiz } from '../models/examModel.js';
// We will create the addQuestionsToDb function in the examModel later
import { addQuestionsToDb } from '../models/examModel.js';

export const createExam = async (req, res) => {
  const teacher_id = 1; // Replace with actual logged-in user ID from session/token
  
  const quizData = {
    teacher_id,
    ...req.body 
  };

  createQuiz(quizData, (err, quizId) => {
    if (err) {
      console.error("Failed to create exam:", err);
      return res.redirect('/createExam?error=Failed+to+create+exam');
    }
    
    // SUCCESS! Redirect to the page for adding questions.
    // Pass the new quiz ID and the number of MCQs as URL query parameters.
    const num_mcqs = req.body.num_mcqs;
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