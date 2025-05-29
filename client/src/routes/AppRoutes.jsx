// src/routes/AppRoutes.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

import MainLayout from '@/components/layout/MainLayout';
import AuthLayout from '@/components/layout/AuthLayout';

// Pages
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/auth/LoginPage';
import SignupPage from '@/pages/auth/SignupPage';
import ListingsPage from '@/pages/listings/ListingsPage';
import ListingDetailPage from '@/pages/listings/ListingDetailPage';
// Import ProtectedRoute once created
// import ProtectedRoute from './ProtectedRoute';
// Import other pages as they are created
// e.g., CreateListingPage, ProfilePage, etc.

const AppRoutes = () => {
  return (
    <Routes>
      {/* Routes with MainLayout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/listings" element={<ListingsPage />} />
        <Route path="/listings/:listingId" element={<ListingDetailPage />} />
        {/* Add more public routes using MainLayout here */}
        
        {/* Example of how protected routes will look (to be implemented fully later) */}
        {/* <Route path="/listings/new" element={<ProtectedRoute><CreateListingPage /></ProtectedRoute>} /> */}
        {/* <Route path="/profile/me" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} /> */}
        {/* <Route path="/messages" element={<ProtectedRoute><ConversationsPage /></ProtectedRoute>} /> */}
      </Route>

      {/* Routes with AuthLayout */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      {/* Fallback for unmatched routes (404 Not Found) */}
      {/* <Route path="*" element={<NotFoundPage />} /> */}
      <Route path="*" element={
        <MainLayout> {/* Or a dedicated 404 layout */}
          <div className="text-center py-10">
            <h1 className="text-4xl font-bold">404 - Page Not Found</h1>
            <p className="mt-4">Sorry, the page you are looking for does not exist.</p>
            <Button asChild className="mt-6">
              <Link to="/">Go to Homepage</Link>
            </Button>
          </div>
        </MainLayout>
      } />
    </Routes>
  );
};

export default AppRoutes;