import db from '../config/db.js';

// Your existing createQuiz function remains the same
export const createQuiz = (quizData, callback) => {
  const query = 'INSERT INTO quizzes SET ?';
  db.query(query, quizData, (err, results) => {
    if (err) return callback(err);
    callback(null, results.insertId);
  });
};

// NEW FUNCTION using a transaction
export const addQuestionsToDb = (quizId, questions, callback) => {
    db.beginTransaction(err => {
        if (err) { return callback(err); }

        // Use Promise.all to handle all asynchronous database calls
        const allPromises = questions.map(q => {
            return new Promise((resolve, reject) => {
                const questionQuery = 'INSERT INTO questions (quiz_id, question_text, correct_option) VALUES (?, ?, ?)';
                const questionData = [quizId, q.question_text, q.correct_option];

                db.query(questionQuery, questionData, (err, result) => {
                    if (err) { return reject(err); }

                    const questionId = result.insertId;
                    const options = q.options;

                    // Prepare to insert 4 options
                    const optionsQuery = 'INSERT INTO options (question_id, option_text) VALUES ?';
                    const optionsData = options.map(optText => [questionId, optText]);

                    db.query(optionsQuery, [optionsData], (err, result) => {
                        if (err) { return reject(err); }
                        resolve(result);
                    });
                });
            });
        });

        Promise.all(allPromises)
            .then(() => {
                db.commit(err => {
                    if (err) {
                        return db.rollback(() => callback(err));
                    }
                    callback(null); // Success
                });
            })
            .catch(err => {
                db.rollback(() => callback(err));
            });
    });
};