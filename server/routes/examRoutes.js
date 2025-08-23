import express from 'express';
// Make sure to import both controller functions
import { createExam, addQuestions } from '../controllers/examController.js';

const router = express.Router();

// Handles Step 1: Creating the exam settings
router.post('/create', createExam);

// Handles Step 2: Adding all the questions and options
router.post('/add-questions', addQuestions);

export default router;