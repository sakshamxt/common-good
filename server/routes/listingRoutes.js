// routes/listingRoutes.js
import express from 'express';
import {
  getAllListings, createListing, getListingById, updateListing, deleteListing,
} from '../controllers/listingController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadListingPhotos } from '../middleware/uploadMiddleware.js';
import {
  createListingRules,
  updateListingRules,
  mongoIdParamValidation,
  handleValidationErrors,
} from '../middleware/validationMiddleware.js'; // Import validation

const router = express.Router();

router.get('/', getAllListings);
router.get('/:listingId', mongoIdParamValidation('listingId'), handleValidationErrors, getListingById);

router.use(protect);

router.post('/', uploadListingPhotos, createListingRules(), handleValidationErrors, createListing);
router.patch('/:listingId', mongoIdParamValidation('listingId'), uploadListingPhotos, updateListingRules(), handleValidationErrors, updateListing);
router.delete('/:listingId', mongoIdParamValidation('listingId'), handleValidationErrors, deleteListing);

export default router;