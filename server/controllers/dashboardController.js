 // Your database connection
import { Parser } from 'json2csv';
import db from '../config/db.js';

// 1. Controller to fetch dashboard metrics (Active Exams, Total Students)
export const getDashboardMetrics = (req, res) => {
  // In a real app, you would get this from a logged-in user's session or token
  const teacherId = 1; 

  const metrics = {};

  const activeExamsSql = "SELECT COUNT(id) as activeExamCount FROM quizzes WHERE status = 'active' AND teacher_id = ?";
  db.query(activeExamsSql, [teacherId], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error fetching active exams" });
    metrics.activeExams = results[0].activeExamCount;

    const totalStudentsSql = "SELECT COUNT(id) as studentCount FROM users WHERE role = 'Student'";
    db.query(totalStudentsSql, (err, results) => {
      if (err) return res.status(500).json({ error: "Database error fetching students" });
      metrics.totalStudents = results[0].studentCount;
      res.json(metrics);
    });
  });
};

// 2. Controller to fetch all quizzes for the dashboard list
export const getQuizzes = (req, res) => {
  const teacherId = 1; // Replace with req.user.id from session/token
  const sql = "SELECT id, book, status FROM quizzes WHERE teacher_id = ? ORDER BY created_at DESC";

  db.query(sql, [teacherId], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error fetching quizzes" });
    res.json(results);
  });
};

// 3. Controller to handle exporting quiz results to CSV
export const exportQuizResults = (req, res) => {
    const { quizId } = req.params;

    const sql = `
        SELECT 
            u.firstName, u.lastName, u.email, qa.score, 
            DATE_FORMAT(qa.start_time, '%Y-%m-%d %H:%i:%s') as started_at,
            DATE_FORMAT(qa.end_time, '%Y-%m-%d %H:%i:%s') as completed_at
        FROM quiz_attempts qa
        JOIN users u ON qa.student_id = u.id
        WHERE qa.quiz_id = ?
    `;

    db.query(sql, [quizId], (err, results) => {
        if (err) return res.status(500).send("Failed to fetch quiz results.");
        if (results.length === 0) return res.status(404).send("No results found for this quiz to export.");

        const fields = ['firstName', 'lastName', 'email', 'score', 'started_at', 'completed_at'];
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(results);

        res.header('Content-Type', 'text/csv');
        res.attachment(`quiz-${quizId}-results.csv`);
        res.send(csv);
    });
};