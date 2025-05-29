// src/api/authService.js
import axiosInstance from './axiosInstance';

export const registerUser = async (userData) => {
  // userData: { name, email, password }
  const response = await axiosInstance.post('/auth/signup', userData);
  return response.data; // Expects { status: 'success', token, data: { user } }
};

export const loginUser = async (credentials) => {
  // credentials: { email, password }
  const response = await axiosInstance.post('/auth/login', credentials);
  return response.data; // Expects { status: 'success', token, data: { user } }
};

export const fetchCurrentUser = async () => {
  // Token will be sent automatically by axiosInstance interceptor
  const response = await axiosInstance.get('/auth/me');
  return response.data; // Expects { status: 'success', data: { user } }
};