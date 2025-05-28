// middleware/uploadMiddleware.js
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js'; // Your configured Cloudinary instance
import AppError from '../utils/appError.js';

// Configure Cloudinary storage for Multer
const profilePictureStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    // Determine folder and filename for Cloudinary
    // It's good practice to store user-specific files in user-specific folders
    // or at least name them in a way that avoids conflicts and is traceable.
    const userId = req.user ? req.user.id : 'misc'; // req.user should be available if 'protect' middleware ran first
    return {
      folder: `commongood/user_profiles/${userId}`,
      // public_id: `profile_${Date.now()}`, // Generates a unique public_id
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
      transformation: [ // Optional: Apply transformations on upload
        { width: 250, height: 250, crop: 'fill', gravity: 'face' }
      ],
      // To make sure we overwrite if a user uploads a new profile picture with the same logical name.
      // However, Cloudinary by default generates unique public_ids if not specified, which is often safer.
      // If you want to replace, you'd typically delete the old one using its public_id first.
      // For profile pictures, a common strategy is to use a predictable public_id related to the user ID
      // and set `overwrite: true`. But this requires careful handling of the initial upload.
      // For simplicity, we'll let Cloudinary generate unique IDs by default unless specified.
      // public_id: `profile_${userId}` // This would try to overwrite if exists
    };
  },
});

// Multer filter to allow only images
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

// Multer upload instance for a single profile picture
export const uploadProfilePicture = multer({
  storage: profilePictureStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
}).single('profilePicture'); // 'profilePicture' is the field name in the form-data

// We will add another uploader for listing photos later (e.g., uploadListingPhotos for multiple files)
// const listingPhotosStorage = new CloudinaryStorage({ ... });
// export const uploadListingPhotos = multer({ storage: listingPhotosStorage, fileFilter: imageFileFilter, limits: { fileSize: 10 * 1024 * 1024 } }).array('photos', 5); // Example: 'photos' field, max 5 files