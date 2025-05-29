// src/pages/listings/ListingsPage.jsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getListings } from '@/api/listingService';
import ListingCard from '@/components/common/ListingCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Add if not present: npx shadcn-ui@latest add alert
import { Terminal } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"


const ITEMS_PER_PAGE = 12; // Or make this configurable

const ListingsPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  // TODO: Add state for filters (category, type, location, etc.) and search query

  // TanStack Query to fetch listings
  const { data, isLoading, error, isError, isFetching, refetch } = useQuery({
    queryKey: ['listings', { page: currentPage, limit: ITEMS_PER_PAGE /*, other filters */ }], // Query key includes page and other filters
    queryFn: () => getListings({ page: currentPage, limit: ITEMS_PER_PAGE /*, ...otherFilters */ }),
    keepPreviousData: true, // Good for pagination to keep showing old data while new data loads
  });

  const listings = data?.listings || [];
  // Assuming backend might not send total pages directly with listings array.
  // For robust pagination, backend should ideally send totalItems or totalPages.
  // Here, we'll make a rough guess or disable next if fewer than ITEMS_PER_PAGE are returned.
  const hasMorePages = listings.length === ITEMS_PER_PAGE;


  const handlePageChange = (newPage) => {
    if (newPage < 1) return;
    setCurrentPage(newPage);
    // TanStack Query will refetch automatically due to queryKey change
  };

  if (isLoading && !data) { // Show main loader only on initial load without previous data
    return (
      <div className="flex justify-center items-center py-20">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive" className="my-8">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Error Fetching Listings</AlertTitle>
        <AlertDescription>
          {error?.response?.data?.message || error?.message || "An unexpected error occurred."}
          <Button onClick={() => refetch()} variant="link" className="ml-2">Try Again</Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Browse Listings</h1>
        {/* TODO: Add Filter Button/Sidebar Trigger here */}
        {/* TODO: Add Sort Dropdown here */}
      </div>

      {isFetching && <p className="text-sm text-slate-500 mb-4">Updating listings...</p>}

      {listings.length === 0 && !isFetching ? (
        <div className="text-center py-10">
          <img src="/placeholder-empty-state.svg" alt="No listings found" className="mx-auto h-40 mb-6 opacity-70" /> {/* Replace with actual SVG/image */}
          <p className="text-xl text-slate-600">No listings found matching your criteria.</p>
          <p className="text-sm text-slate-500 mt-2">Try adjusting your filters or check back later!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {listings.map((listing) => (
            <ListingCard key={listing._id} listing={listing} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {listings.length > 0 && (
         <div className="mt-12 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                    disabled={currentPage === 1}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                {/* Simple page number display - can be enhanced */}
                {/* For a more complex pagination UI, you might generate page numbers based on totalPages if available */}
                <PaginationItem>
                  <PaginationLink href="#" isActive>
                    {currentPage}
                  </PaginationLink>
                </PaginationItem>
                {/* {hasMorePages && ( // Only show if we think there might be more
                  <PaginationItem>
                    <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}>
                      {currentPage + 1}
                    </PaginationLink>
                  </PaginationItem>
                )}
                {hasMorePages && listings.length >= ITEMS_PER_PAGE -1 && currentPage < 3 && ( // Show one more page if plausible
                   <PaginationItem>
                      <PaginationEllipsis />
                   </PaginationItem>
                )} */}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                    disabled={!hasMorePages} // Disable if current page has less than ITEMS_PER_PAGE
                    className={!hasMorePages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
        </div>
      )}
    </div>
  );
};

export default ListingsPage;