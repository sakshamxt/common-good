// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '@/api/axiosInstance';
import { registerUser, loginUser, fetchCurrentUser } from '@/api/authService';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('commonGoodToken'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // For initial load check
  const navigate = useNavigate();

  const setAuthData = useCallback((userData, userToken) => {
    localStorage.setItem('commonGoodToken', userToken);
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
    setUser(userData);
    setToken(userToken);
    setIsAuthenticated(true);
    setIsLoading(false);
  }, []);

  const clearAuthData = useCallback(() => {
    localStorage.removeItem('commonGoodToken');
    delete axiosInstance.defaults.headers.common['Authorization'];
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    setIsLoading(false);
  }, []);

  const loadUser = useCallback(async () => {
    setIsLoading(true);
    const storedToken = localStorage.getItem('commonGoodToken');
    if (storedToken) {
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      try {
        const response = await fetchCurrentUser();
        setAuthData(response.data.user, storedToken);
      } catch (error) {
        console.error("Failed to load user", error);
        clearAuthData(); // Invalid token or other issue
      }
    } else {
      clearAuthData(); // Ensure state is clean if no token
    }
    setIsLoading(false);
  }, [setAuthData, clearAuthData]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);


  const signup = async (name, email, password) => {
    setIsLoading(true);
    try {
      const response = await registerUser({ name, email, password });
      setAuthData(response.data.user, response.token);
      toast.success('Signup successful! Welcome.');
      navigate('/'); // Redirect to homepage after signup
      return true;
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Signup failed. Please try again.';
      const errorDetails = error.response?.data?.details;
      if (errorDetails && Array.isArray(errorDetails)) {
        errorDetails.forEach(detail => toast.error(`${detail.field}: ${detail.message}`));
      } else {
        toast.error(errorMsg);
      }
      console.error("Signup error:", error.response?.data || error);
      clearAuthData();
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await loginUser({ email, password });
      setAuthData(response.data.user, response.token);
      toast.success('Login successful!');
      navigate('/'); // Redirect to homepage after login
      return true;
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Login failed. Please check your credentials.';
      const errorDetails = error.response?.data?.details;
       if (errorDetails && Array.isArray(errorDetails)) {
        errorDetails.forEach(detail => toast.error(`${detail.field}: ${detail.message}`));
      } else {
        toast.error(errorMsg);
      }
      console.error("Login error:", error.response?.data || error);
      clearAuthData();
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    clearAuthData();
    toast.success('Logged out successfully.');
    navigate('/login');
  }, [clearAuthData, navigate]);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, signup, login, logout, loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;