// src/api/reviewService.js
import axiosInstance from './axiosInstance';

/**
 * Fetches all reviews received by a specific user.
 * @param {string} userId - The ID of the user (reviewee).
 * @param {object} params - Query parameters for pagination, sorting.
 * @returns {Promise<object>} The API response data (expects { reviewee: {}, reviews: [] }).
 */
export const getReviewsForUser = async (userId, params = {}) => {
  if (!userId) throw new Error("User ID is required to fetch reviews.");
  const response = await axiosInstance.get(`/reviews/user/${userId}`, { params });
  // Backend returns: { status: 'success', results: number, data: { reviewee: {name, averageRating, numReviews}, reviews: [] } }
  return response.data.data;
};