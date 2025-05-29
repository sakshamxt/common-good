// routes/reviewRoutes.js
import express from 'express';
import {
  createReview,
  getReviewsForUser,
  getReviewsForListing,
} from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';
import {
  createReviewRules,
  mongoIdParamValidation,
  handleValidationErrors,
} from '../middleware/validationMiddleware.js';

const router = express.Router();

// Public routes to get reviews
// router.get('/user/:userId', mongoIdParamValidation('userId'), handleValidationErrors, getReviewsForUser);
router.get('/listing/:listingId', mongoIdParamValidation('listingId'), handleValidationErrors, getReviewsForListing);

// Protected route: User must be logged in to create a review
router.post('/', protect, createReviewRules(), handleValidationErrors, createReview);

export default router;