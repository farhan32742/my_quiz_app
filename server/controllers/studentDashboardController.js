import db from '../config/db.js';

// Helper function to run database queries
const query = (sql, params) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) {
        return reject(err);
      }
      resolve(results);
    });
  });
};

// Get Dashboard Metrics
export const getDashboardMetrics = async (req, res) => {
  // Assuming student ID is stored in req.user.id after authentication
  const studentId = req.user.id; 

  try {
    const totalExamsResult = await query('SELECT COUNT(*) AS totalExams FROM quizzes');
    const completedExamsResult = await query('SELECT COUNT(*) AS completedExams FROM quiz_attempts WHERE student_id = ?', [studentId]);
    const averageScoreResult = await query('SELECT AVG(score) AS averageScore FROM quiz_attempts WHERE student_id = ?', [studentId]);
    
    // This is a simplified rank calculation. A more complex query might be needed for a more accurate rank.
    const classRankResult = await query(`
      SELECT student_id, averageScore, RANK() OVER (ORDER BY averageScore DESC) as classRank
      FROM (
          SELECT student_id, AVG(score) as averageScore
          FROM quiz_attempts
          GROUP BY student_id
      ) as student_scores
    `);

    const studentRank = classRankResult.find(rank => rank.student_id === studentId);

    res.json({
      totalExams: totalExamsResult[0].totalExams,
      completedExams: completedExamsResult[0].completedExams,
      averageScore: averageScoreResult[0].averageScore || 0,
      classRank: studentRank ? studentRank.classRank : 'N/A'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard metrics', error });
  }
};

// Get Upcoming Exams
export const getUpcomingExams = async (req, res) => {
    const studentId = req.user.id; // Get the logged-in student's ID

    try {
        // This query now finds quizzes that are 'draft' or 'active'
        // AND for which there is NO entry in quiz_attempts for the current student.
        const upcomingExamsQuery = `
            SELECT 
                q.id, 
                q.book, 
                u.firstName, 
                u.lastName, 
                q.exam_date, 
                q.exam_time, 
                q.time_allowed, 
                q.num_mcqs, 
                (q.num_mcqs * q.mcq_weightage) AS total_points,
                q.status
            FROM quizzes q
            JOIN users u ON q.teacher_id = u.id
            LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id AND qa.student_id = ?
            WHERE q.status IN ('draft', 'active') AND qa.id IS NULL
            ORDER BY q.exam_date, q.exam_time;
        `;

        db.query(upcomingExamsQuery, [studentId], (err, results) => {
            if (err) {
                console.error("Database error fetching upcoming exams:", err);
                return res.status(500).json({ message: 'Error fetching upcoming exams' });
            }
            res.json(results);
        });
    } catch (error) {
        console.error("Server error fetching upcoming exams:", error);
        res.status(500).json({ message: 'Error fetching upcoming exams', error });
    }
};

// Get Recent Results
export const getRecentResults = async (req, res) => {
  const studentId = req.user.id; 

  try {
    const recentResults = await query(`
      SELECT q.book, qa.score, q.mcq_weightage * q.num_mcqs AS total_marks, qa.end_time
      FROM quiz_attempts qa
      JOIN quizzes q ON qa.quiz_id = q.id
      WHERE qa.student_id = ?
      ORDER BY qa.end_time DESC
      LIMIT 5
    `, [studentId]);

    res.json(recentResults);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recent results', error });
  }
};