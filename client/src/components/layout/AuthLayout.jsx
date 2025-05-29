// src/components/layout/AuthLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom'; // For logo/link to home

const AuthLayout = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-4">
      <div className="mb-8">
        <Link to="/" className="text-3xl font-bold text-primary">
          CommonGood
        </Link>
      </div>
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
        <Outlet /> {/* Login/Signup forms will be rendered here */}
      </div>
      <p className="mt-8 text-sm text-slate-600">
        &copy; {new Date().getFullYear()} CommonGood. All rights reserved.
      </p>
    </div>
  );
};

export default AuthLayout;