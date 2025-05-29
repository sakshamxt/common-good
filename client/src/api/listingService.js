// src/api/listingService.js
import axiosInstance from './axiosInstance';

export const getListings = async (params = {}) => {
  const response = await axiosInstance.get('/listings', { params });
  return response.data.data;
};

export const getListingById = async (listingId) => {
  if (!listingId) throw new Error("Listing ID is required.");
  const response = await axiosInstance.get(`/listings/${listingId}`);
  return response.data.data;
};

/**
 * Creates a new listing.
 * @param {FormData} formData - The listing data, including files.
 * @returns {Promise<object>} The API response data.
 */
export const createListing = async (formData) => {
  const response = await axiosInstance.post('/listings', formData, {
    headers: {
      'Content-Type': 'multipart/form-data', // Important for file uploads
    },
  });
  return response.data.data; // Expects { listing: { ... } }
};

/**
 * Updates an existing listing.
 * @param {string} listingId - The ID of the listing to update.
 * @param {FormData} formData - The updated listing data, including new files and deletion info.
 * @returns {Promise<object>} The API response data.
 */
export const updateListing = async (listingId, formData) => {
  const response = await axiosInstance.patch(`/listings/${listingId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data; // Expects { listing: { ... } }
};

// Optional: Delete listing function (though often done on a detail page or 'my listings' page)
// export const deleteListingApi = async (listingId) => {
//   const response = await axiosInstance.delete(`/listings/${listingId}`);
//   return response.data; // Or just status
// };