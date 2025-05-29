// src/components/common/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="container mx-auto px-4 py-8 text-center text-sm text-slate-600">
        <div className="mb-4">
          <Link to="/about" className="hover:text-primary px-3">About Us</Link>
          <Link to="/terms" className="hover:text-primary px-3">Terms of Service</Link>
          <Link to="/privacy" className="hover:text-primary px-3">Privacy Policy</Link>
          <Link to="/contact" className="hover:text-primary px-3">Contact</Link>
        </div>
        <p>&copy; {new Date().getFullYear()} CommonGood. All rights reserved.</p>
        <p className="mt-1">Fostering community through sharing.</p>
      </div>
    </footer>
  );
};

export default Footer;