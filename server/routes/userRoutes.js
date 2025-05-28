import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
// import {
//   getUserProfile,
//   updateMe,
//   updateMyPassword,
// } from '../controllers/userController.js'; // Will import these later

const router = express.Router();

// All routes below this will use the 'protect' middleware by default if placed here:
// router.use(protect); // Example: if all user routes need protection

// Placeholder routes - We will define these in Section 5
// router.get('/:userId', getUserProfile); // Public profile
// router.patch('/updateMe', protect, updateMe); // Protected
// router.patch('/updateMyPassword', protect, updateMyPassword); // Protected

export default router;