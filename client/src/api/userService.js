// src/api/userService.js
import axiosInstance from './axiosInstance';

/**
 * Fetches a user's public profile by their ID.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<object>} The API response data (expects { user: {} }).
 */
export const getUserProfile = async (userId) => {
  if (!userId) throw new Error("User ID is required.");
  const response = await axiosInstance.get(`/users/${userId}`);
  // Backend returns: { status: 'success', data: { user: { name, email (if own?), bio, location, skillsOffered, skillsSought, profilePictureUrl, averageRating, numReviews, createdAt } } }
  return response.data.data; 
};

/**
 * Updates the currently authenticated user's profile.
 * @param {FormData} formData - The profile data, including optional profilePicture file.
 * @returns {Promise<object>} The API response data (expects { user: {} }).
 */
export const updateUserProfile = async (formData) => {
  const response = await axiosInstance.patch('/users/updateMe', formData, {
    headers: {
      'Content-Type': 'multipart/form-data', // Important for file uploads
    },
  });
  // Backend returns: { status: 'success', data: { user: { ...updatedUser } } }
  return response.data.data; 
};