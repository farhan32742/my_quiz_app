import express from 'express';
// Make sure to import both controller functions
import { createExam, addQuestions, getQuizForStudent, startAttempt, submitAttempt } from '../controllers/examController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Handles Step 1: Creating the exam settings
router.post('/create', createExam);

// Handles Step 2: Adding all the questions and options
router.post('/add-questions', addQuestions);

// Student-facing routes
router.get('/:quizId', protect, getQuizForStudent);
router.post('/:quizId/start', protect, startAttempt);
router.post('/attempts/:attemptId/submit', protect, submitAttempt);

export default router;