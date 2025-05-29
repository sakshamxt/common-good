// src/pages/auth/SignupPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const SignupPage = () => {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-center mb-6 text-slate-700">Join CommonGood</h2>
      {/* Signup form will go here in the next section */}
      <p className="text-center text-sm text-slate-600 mt-4">Signup form placeholder.</p>
      <p className="mt-6 text-center text-sm">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
};

export default SignupPage;