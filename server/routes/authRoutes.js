// routes/authRoutes.js
import express from 'express';
import { signup, login, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import {
  registrationRules,
  loginRules,
  handleValidationErrors,
} from '../middleware/validationMiddleware.js'; // Import validation

const router = express.Router();

router.post('/signup', registrationRules(), handleValidationErrors, signup);
router.post('/login', loginRules(), handleValidationErrors, login);
router.get('/me', protect, getMe);

export default router;