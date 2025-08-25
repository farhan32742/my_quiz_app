import { createQuiz, addQuestionsToDb } from '../models/examModel.js';
import db from '../config/db.js';

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

// STUDENT FLOW: fetch quiz with questions/options (only if active and not completed)
export const getQuizForStudent = (req, res) => {
  const { quizId } = req.params;
  const studentId = req.user.id;

  const statusSql = `SELECT id, status, exam_date, exam_time, time_allowed, num_mcqs, mcq_weightage FROM quizzes WHERE id = ?`;
  db.query(statusSql, [quizId], (err, qRows) => {
    if (err || qRows.length === 0) return res.status(404).json({ message: 'Quiz not found' });

    const quiz = qRows[0];
    if (quiz.status !== 'active') return res.status(403).json({ message: 'Quiz not active' });

    const alreadySql = `SELECT id FROM quiz_attempts WHERE quiz_id = ? AND student_id = ? LIMIT 1`;
    db.query(alreadySql, [quizId, studentId], (err2, aRows) => {
      if (err2) return res.status(500).json({ message: 'Error checking attempts' });
      if (aRows.length) return res.status(400).json({ message: 'Attempt already exists' });

      const qSql = `SELECT id, question_text, correct_option FROM questions WHERE quiz_id = ? ORDER BY id ASC`;
      db.query(qSql, [quizId], (err3, questions) => {
        if (err3) return res.status(500).json({ message: 'Error fetching questions' });
        const qIds = questions.map(q => q.id);
        if (qIds.length === 0) return res.json({ quiz, questions: [] });
        const oSql = `SELECT id, question_id, option_text FROM options WHERE question_id IN (?) ORDER BY id ASC`;
        db.query(oSql, [qIds], (err4, options) => {
          if (err4) return res.status(500).json({ message: 'Error fetching options' });
          const questionIdToOptions = {};
          options.forEach(o => {
            if (!questionIdToOptions[o.question_id]) questionIdToOptions[o.question_id] = [];
            questionIdToOptions[o.question_id].push({ id: o.id, text: o.option_text });
          });
          const payload = questions.map(q => ({
            id: q.id,
            question_text: q.question_text,
            options: questionIdToOptions[q.id] || []
          }));
          res.json({ quiz, questions: payload });
        });
      });
    });
  });
};

// STUDENT FLOW: start attempt (creates quiz_attempts row)
export const startAttempt = (req, res) => {
  const { quizId } = req.params;
  const studentId = req.user.id;
  const sql = `INSERT INTO quiz_attempts (quiz_id, student_id, score, start_time) VALUES (?, ?, 0, NOW())`;
  db.query(sql, [quizId, studentId], (err, result) => {
    if (err) return res.status(500).json({ message: 'Failed to start attempt' });
    const attemptId = result.insertId;
    const metaSql = `SELECT NOW() AS serverNow, time_allowed FROM quizzes WHERE id = ?`;
    db.query(metaSql, [quizId], (err2, rows) => {
      if (err2 || rows.length === 0) return res.json({ attemptId });
      const { serverNow, time_allowed } = rows[0];
      res.json({ attemptId, serverNow, timeAllowed: Number(time_allowed) });
    });
  });
};

// STUDENT FLOW: submit attempt with answers, compute score, mark end time
export const submitAttempt = (req, res) => {
  const { attemptId } = req.params;
  const { answers } = req.body; // [{questionId, selectedOptionId}]

  const questionIds = answers.map(a => a.questionId);
  if (!Array.isArray(answers) || questionIds.length === 0) {
    return res.status(400).json({ message: 'No answers' });
  }

  // 1) Fetch attempt + quiz info
  const attemptSql = `
    SELECT qa.id, qa.quiz_id, qz.mcq_weightage, qz.num_mcqs
    FROM quiz_attempts qa
    JOIN quizzes qz ON qz.id = qa.quiz_id
    WHERE qa.id = ?
  `;
  db.query(attemptSql, [attemptId], (errA, aRows) => {
    if (errA || aRows.length === 0) return res.status(404).json({ message: 'Attempt not found' });
    const quizId = aRows[0].quiz_id;
    const mcqWeight = Number(aRows[0].mcq_weightage) || 1;
    const numMcqs = Number(aRows[0].num_mcqs) || questionIds.length;

    // 2) Fetch questions' correct_option
    const qSql = `SELECT id, correct_option FROM questions WHERE quiz_id = ? AND id IN (?)`;
    db.query(qSql, [quizId, questionIds], (errQ, qRows) => {
      if (errQ) return res.status(500).json({ message: 'Error fetching questions' });

      // 3) Fetch options for these questions
      const oSql = `SELECT id, question_id FROM options WHERE question_id IN (?) ORDER BY id ASC`;
      const qIds = qRows.map(r => r.id);
      if (qIds.length === 0) return res.status(400).json({ message: 'No questions found' });
      db.query(oSql, [qIds], (errO, oRows) => {
        if (errO) return res.status(500).json({ message: 'Error fetching options' });

        const qMeta = {};
        qRows.forEach(r => { qMeta[r.id] = { correctIndex: Number(r.correct_option) }; });
        const qOptions = {};
        oRows.forEach(o => {
          if (!qOptions[o.question_id]) qOptions[o.question_id] = [];
          qOptions[o.question_id].push(o.id);
        });

        let correctCount = 0;
        const respRows = [];
        answers.forEach(a => {
          if (a.selectedOptionId == null) {
            // Skip unanswered to avoid NOT NULL constraint issues
            return;
          }
          const meta = qMeta[a.questionId];
          const opts = qOptions[a.questionId] || [];
          const correctOptionId = opts[ (meta?.correctIndex || 1) - 1 ]; // index is 1-based
          const isCorrect = Number(a.selectedOptionId) === Number(correctOptionId);
          if (isCorrect) correctCount += 1;
          respRows.push([attemptId, a.questionId, a.selectedOptionId, isCorrect]);
        });

        const onScored = () => {
          const newScore = correctCount * mcqWeight;
          const percentage = numMcqs > 0 ? (correctCount / numMcqs) * 100 : 0;
          const grade = percentage >= 90 ? 'A' : percentage >= 80 ? 'B' : percentage >= 70 ? 'C' : percentage >= 60 ? 'D' : 'F';

          const updSql = `UPDATE quiz_attempts SET score = ?, end_time = NOW() WHERE id = ?`;
          db.query(updSql, [newScore, attemptId], (errU) => {
            if (errU) return res.status(500).json({ message: 'Error computing score' });
            res.json({ message: 'Submitted successfully', score: newScore, percentage, grade });
          });
        };

        if (respRows.length === 0) {
          // No answered questions; still finalize the attempt with score 0
          onScored();
        } else {
          const insertResp = `INSERT INTO student_responses (attempt_id, question_id, selected_option_id, is_correct) VALUES ?`;
          db.query(insertResp, [respRows], (errI) => {
            if (errI) return res.status(500).json({ message: 'Error saving responses' });
            onScored();
          });
        }
      });
    });
  });
};