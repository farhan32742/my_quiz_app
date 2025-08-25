import db from '../config/db.js';

const runQuery = (sql, params = []) => new Promise((resolve, reject) => {
  db.query(sql, params, (err, results) => {
    if (err) return reject(err);
    resolve(results);
  });
});

export const getMetrics = async (req, res) => {
  try {
    const [userCounts, activeExams, uptime, avgPerformance] = await Promise.all([
      runQuery(`SELECT role, COUNT(*) AS count FROM users GROUP BY role`),
      runQuery(`SELECT COUNT(*) AS cnt FROM quizzes WHERE status = 'active'`),
      // Placeholder uptime from DB side; you could compute from server start or health table
      Promise.resolve([{ value: 99.9 }]),
      runQuery(`
        SELECT ROUND(AVG(score / NULLIF(q.num_mcqs*q.mcq_weightage,0) * 100),1) AS perf
        FROM quiz_attempts qa
        JOIN quizzes q ON q.id = qa.quiz_id
      `)
    ]);

    const roleToCount = userCounts.reduce((acc, r) => { acc[r.role] = r.count; return acc; }, {});
    const students = roleToCount['Student'] || 0;
    const teachers = roleToCount['Teacher'] || 0;
    const admins = roleToCount['Administrator'] || 0;

    res.json({
      activeUsers: students + teachers + admins,
      activeExams: activeExams[0]?.cnt || 0,
      systemUptimePct: uptime[0]?.value || 99.9,
      performancePct: avgPerformance[0]?.perf || 0,
      breakdown: { students, teachers, admins }
    });
  } catch (error) {
    console.error('Admin getMetrics error:', error);
    res.status(500).json({ message: 'Failed to fetch metrics' });
  }
};

export const getExamPerformanceSamples = async (req, res) => {
  try {
    const rows = await runQuery(`
      SELECT q.id, q.book AS name,
             ROUND(AVG(qa.score / NULLIF(q.num_mcqs*q.mcq_weightage,0) * 100),1) AS avgPct,
             COUNT(qa.id) AS completed
      FROM quizzes q
      LEFT JOIN quiz_attempts qa ON qa.quiz_id = q.id
      GROUP BY q.id
      ORDER BY q.created_at DESC
      LIMIT 4
    `);
    res.json(rows);
  } catch (error) {
    console.error('Admin getExamPerformanceSamples error:', error);
    res.status(500).json({ message: 'Failed to fetch performance' });
  }
};

export const getRecentActivity = async (req, res) => {
  try {
    const rows = await runQuery(`
      (
        SELECT 'user_registered' AS type,
               CONCAT(firstName, ' ', lastName) AS title,
               CONCAT('user registered') AS description,
               created_at AS created_at
        FROM users
      )
      UNION ALL
      (
        SELECT 'exam_created' AS type,
               'Exam Created' AS title,
               CONCAT('exam created - ', q.book) AS description,
               q.created_at AS created_at
        FROM quizzes q
      )
      UNION ALL
      (
        SELECT 'exam_completed' AS type,
               CONCAT(u.firstName, ' ', u.lastName) AS title,
               CONCAT('exam completed - ', q.book, ' - Score: ', qa.score) AS description,
               qa.end_time AS created_at
        FROM quiz_attempts qa
        JOIN users u ON u.id = qa.student_id
        JOIN quizzes q ON q.id = qa.quiz_id
      )
      ORDER BY created_at DESC
      LIMIT 10
    `);
    res.json(rows);
  } catch (error) {
    console.error('Admin getRecentActivity error:', error);
    res.status(500).json({ message: 'Failed to fetch activity' });
  }
};


