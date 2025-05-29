// controllers/userController.js
import User from '../models/User.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import cloudinary from '../config/cloudinary.js'; // Import Cloudinary for potential direct operations (e.g., deletion)

// Helper function to filter allowed fields for updates
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

export const updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword.', // We'll create this later
        400
      )
    );
  }

  // 2) Filter out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'bio', 'location', 'skillsOffered', 'skillsSought', 'coordinates');

  // 3) Handle profile picture upload
  if (req.file) {
    // If a new file is uploaded, req.file will contain its details from Cloudinary
    filteredBody.profilePictureUrl = req.file.path; // URL from Cloudinary
    filteredBody.profilePicturePublicId = req.file.filename; // public_id from Cloudinary (filename from multer-storage-cloudinary)

    // Optional: Delete old profile picture if it exists and is not the default
    // This requires storing the old public_id or fetching the user before update.
    // For simplicity, we'll assume an overwrite strategy or manual cleanup for now.
    // If you have `req.user.profilePicturePublicId` and it's not a default one:
    // if (req.user.profilePicturePublicId) {
    //   await cloudinary.uploader.destroy(req.user.profilePicturePublicId);
    // }
  }
  
  // 4) Update user document
  // Using findByIdAndUpdate to leverage Mongoose validation and hooks (though 'save' hooks like password hashing won't run here unless explicitly called).
  // 'new: true' returns the modified document rather than the original.
  // 'runValidators: true' ensures that schema validations are run on update.
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  if (!updatedUser) {
      return next(new AppError('Error updating profile. User not found.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});


export const getUserProfile = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.userId)
    // Optionally select only public fields, or rely on schema defaults (e.g. password not selected)
    // .select('name profilePictureUrl bio location skillsOffered skillsSought createdAt');

  if (!user) {
    return next(new AppError('No user found with that ID.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});


// TODO: Implement updateMyPassword in a later section
// export const updateMyPassword = catchAsync(async (req, res, next) => {
//   res.status(501).json({ status: 'error', message: 'Route not yet defined!' });
// });

// TODO: Implement deleteMe (deactivating account)
// export const deleteMe = catchAsync(async (req, res, next) => {
//   await User.findByIdAndUpdate(req.user.id, { active: false }); // Requires 'active' field in User model
//   res.status(204).json({ status: 'success', data: null });
// });