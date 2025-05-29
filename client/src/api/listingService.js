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

export const createListing = async (formData) => {
  const response = await axiosInstance.post('/listings', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
};

export const updateListing = async (listingId, formData) => {
  const response = await axiosInstance.patch(`/listings/${listingId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
};


export const deleteListingApi = async (listingId) => {
  if (!listingId) throw new Error("Listing ID is required for deletion.");
  const response = await axiosInstance.delete(`/listings/${listingId}`);
  return response.data; // Backend returns 204 No Content with { status: 'success', data: null }
};