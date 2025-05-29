// src/pages/listings/ListingDetailPage.jsx
import React from 'react';
import { useParams } from 'react-router-dom';

const ListingDetailPage = () => {
  const { listingId } = useParams();
  return (
    <div>
      <h1 className="text-3xl font-semibold mb-6">Listing Detail</h1>
      <p>Details for listing ID: {listingId} will be shown here.</p>
      {/* Full listing information, photos, contact button, etc. */}
    </div>
  );
};

export default ListingDetailPage;