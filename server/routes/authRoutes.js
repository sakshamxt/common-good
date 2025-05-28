// routes/authRoutes.js
import express from 'express';
import { signup, login, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Define routes for authentication

// POST /api/v1/auth/signup - User registration
router.post('/signup', signup);

// POST /api/v1/auth/login - User login
router.post('/login', login);

// GET /api/v1/auth/me - Protected route
router.get('/me', protect, getMe); // Apply protect middleware before getMe handler

export default router;