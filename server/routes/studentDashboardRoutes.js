import express from 'express';
import { getDashboardMetrics, getUpcomingExams, getRecentResults } from '../controllers/studentDashboardController.js';
import { protect } from '../middleware/authMiddleware.js'; // You should have an authentication middleware

const router = express.Router();

router.get('/metrics', protect, getDashboardMetrics);
router.get('/upcoming-exams', protect, getUpcomingExams);
router.get('/recent-results', protect, getRecentResults);

export default router;