// src/pages/HomePage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const HomePage = () => {
  return (
    <div className="text-center py-10">
      <h1 className="text-4xl font-bold text-slate-800 mb-6">
        Welcome to CommonGood
      </h1>
      <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
        Your local platform for bartering skills and resources. Connect with your community, share your talents, and find what you need without exchanging money.
      </p>
      <div className="space-x-4">
        <Button asChild size="lg">
          <Link to="/listings">Browse Listings</Link>
        </Button>
        <Button variant="outline" size="lg" asChild>
          <Link to="/listings/new">Offer a Skill/Item</Link>
        </Button>
      </div>
      {/* We can add sections for featured categories or recent listings here later */}
    </div>
  );
};

export default HomePage;