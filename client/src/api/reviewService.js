// src/api/reviewService.js
import axiosInstance from './axiosInstance';

/**
 * Fetches all reviews received by a specific user.
 * @param {string} userId - The ID of the user (reviewee).
 * @param {object} params - Query parameters for pagination, sorting.
 * @returns {Promise<object>} The API response data.
 */
export const getReviewsForUser = async (userId, params = {}) => {
  if (!userId) throw new Error("User ID is required to fetch reviews.");
  const response = await axiosInstance.get(`/reviews/user/${userId}`, { params });
  return response.data.data; // Expects { reviewee: {}, reviews: [] }
};

/**
 * Fetches all reviews for a specific listing.
 * @param {string} listingId - The ID of the listing.
 * @param {object} params - Query parameters for pagination, sorting.
 * @returns {Promise<object>} The API response data.
 */
export const getReviewsForListing = async (listingId, params = {}) => {
  if (!listingId) throw new Error("Listing ID is required to fetch reviews.");
  const response = await axiosInstance.get(`/reviews/listing/${listingId}`, { params });
  // Backend (Section 10) returns: { status: 'success', results: number, data: { listing: {}, reviews: [] } }
  return response.data.data;
};

/**
 * Creates a new review.
 * @param {object} reviewData - { listingId, revieweeId, rating, comment }
 * @returns {Promise<object>} The API response data.
 */
export const createReview = async (reviewData) => {
  const response = await axiosInstance.post('/reviews', reviewData);
  // Backend (Section 10) returns: { status: 'success', data: { review: newReview } }
  return response.data.data;
};