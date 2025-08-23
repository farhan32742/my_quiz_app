import express from 'express';
// This line was likely duplicated in your file. This is the single, correct version.
import { getDashboardMetrics, getQuizzes, exportQuizResults } from '../controllers/dashboardController.js';

const router = express.Router();

// GET /api/dashboard/metrics
router.get('/metrics', getDashboardMetrics);

// GET /api/dashboard/quizzes
router.get('/quizzes', getQuizzes);

// GET /api/dashboard/quizzes/:quizId/export
router.get('/quizzes/:quizId/export', exportQuizResults);

export default router;