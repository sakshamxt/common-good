// src/pages/auth/LoginPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const LoginPage = () => {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-center mb-6 text-slate-700">Login to CommonGood</h2>
      {/* Login form will go here in the next section */}
      <p className="text-center text-sm text-slate-600 mt-4">Login form placeholder.</p>
      <p className="mt-6 text-center text-sm">
        Don't have an account?{' '}
        <Link to="/signup" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
};

export default LoginPage;