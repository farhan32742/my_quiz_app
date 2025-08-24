import express from 'express';
// 1. Import getCurrentUser and the protect middleware
import { signup, signin, getCurrentUser } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/signin', signin);

// 2. Add the new protected route
// Any GET request to '/api/me' will first go through the 'protect' middleware.
// If the token is valid, it will then proceed to the 'getCurrentUser' function.
router.get('/me', protect, getCurrentUser);

export default router;