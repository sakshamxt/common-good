// middleware/uploadMiddleware.js
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';
import AppError from '../utils/appError.js';

// --- Profile Picture Storage (from Section 5) ---
const profilePictureStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    const userId = req.user ? req.user.id : 'misc_profile';
    return {
      folder: `commongood/user_profiles/${userId}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
      transformation: [{ width: 250, height: 250, crop: 'fill', gravity: 'face' }],
    };
  },
});

const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

export const uploadProfilePicture = multer({
  storage: profilePictureStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single('profilePicture');


// --- NEW: Listing Photos Storage ---
const listingPhotosStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => { // Made async to access req.user if needed for folder path
    const userId = req.user ? req.user.id : 'misc_listing';
    // You could also use a listing ID if it's generated before file upload,
    // but for create operations, user ID is more readily available.
    // For updates, listing ID could be used: req.params.listingId
    return {
      folder: `commongood/listing_photos/${userId}/${Date.now()}`, // Unique folder per upload batch or listing
      // public_id: `listing_${Date.now()}` // Let Cloudinary generate unique public_id by default for each file
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
      transformation: [{ width: 800, height: 600, crop: 'limit' }], // Example transformation
    };
  },
});

export const uploadListingPhotos = multer({
  storage: listingPhotosStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 }, // 10MB per file, max 5 files
}).array('photos', 5); // 'photos' is the field name, allowing up to 5 images