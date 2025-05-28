// routes/listingRoutes.js
import express from 'express';
import {
  getAllListings,
  createListing,
  getListingById,
  updateListing,
  deleteListing,
} from '../controllers/listingController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadListingPhotos } from '../middleware/uploadMiddleware.js'; // For photo uploads

const router = express.Router();

// Public routes
router.get('/', getAllListings);
router.get('/:listingId', getListingById);

// Protected routes (user must be logged in)
router.use(protect);

router.post(
  '/',
  uploadListingPhotos, // Multer middleware for 'photos' field
  createListing
);

router.patch(
  '/:listingId',
  uploadListingPhotos, // Handles new photo uploads for update
  updateListing
);

router.delete('/:listingId', deleteListing);

export default router;