import express from 'express';
import { getMetrics, getExamPerformanceSamples, getRecentActivity } from '../controllers/adminController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Optionally protect these routes if only admins should see
router.get('/metrics', protect, requireRole('Administrator'), getMetrics);
router.get('/exam-performance', protect, requireRole('Administrator'), getExamPerformanceSamples);
router.get('/recent-activity', protect, requireRole('Administrator'), getRecentActivity);

export default router;


