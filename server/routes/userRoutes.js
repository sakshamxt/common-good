import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { uploadProfilePicture } from '../middleware/uploadMiddleware.js'; // Import Multer middleware
import {
  updateMe,
  getUserProfile,
  // updateMyPassword, // Will import when implemented
  // deleteMe,         // Will import when implemented
} from '../controllers/userController.js';

const router = express.Router();

// Public route to get any user's profile
router.get('/:userId', getUserProfile);

// Protected routes - User must be logged in
router.use(protect); // All routes defined after this will be protected

router.patch(
  '/updateMe',
  uploadProfilePicture, // Multer middleware for handling 'profilePicture' field
  updateMe
);


// router.patch('/updateMyPassword', updateMyPassword);
// router.patch('/deleteMe', deleteMe); // Or use HTTP DELETE for deactivation

// TODO: Add routes for other user interactions if necessary e.g. /users to list users (admin)

export default router;