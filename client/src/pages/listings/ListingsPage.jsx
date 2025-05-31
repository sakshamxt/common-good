// src/pages/listings/ListingsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { getListings } from '@/api/listingService';
import ListingCard from '@/components/common/ListingCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ListingFilters from '@/components/listings/ListingFilters';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Terminal, SlidersHorizontal, Search as SearchIcon } from "lucide-react"; // Renamed Search to SearchIcon to avoid conflict
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from '@/lib/utils';

const ITEMS_PER_PAGE = 12;

const parseQueryParams = (searchString) => {
  const params = new URLSearchParams(searchString);
  return {
    search: params.get('search') || "",
    category: params.get('category') || "",
    listingType: params.get('listingType') || "",
    location: params.get('location') || "", // For text search on location field
    tags: params.get('tags') || "", // Comma-separated string
    sort: params.get('sort') || "-createdAt", // Default sort
    page: parseInt(params.get('page') || "1", 10),
    // Example for geo:
    // lat: params.get('lat') || "",
    // lng: params.get('lng') || "",
    // distance: params.get('distance') || "10", // Default distance
  };
};

const ListingsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const initialFiltersFromUrl = parseQueryParams(location.search);
  const [filters, setFilters] = useState(initialFiltersFromUrl);
  const [currentPage, setCurrentPage] = useState(initialFiltersFromUrl.page);
  const [isFiltersSheetOpen, setIsFiltersSheetOpen] = useState(false);

  // Update URL when filters or page change (debounced or throttled if performance is an issue)
  useEffect(() => {
    const queryParams = new URLSearchParams();
    if (filters.search) queryParams.set('search', filters.search);
    if (filters.category) queryParams.set('category', filters.category);
    if (filters.listingType) queryParams.set('listingType', filters.listingType);
    if (filters.location) queryParams.set('location', filters.location);
    if (filters.tags) queryParams.set('tags', filters.tags); // Assumes tags is a string
    if (filters.sort && filters.sort !== "-createdAt") queryParams.set('sort', filters.sort);
    if (currentPage > 1) queryParams.set('page', currentPage.toString());
    
    // If using lat/lng/distance for geo search
    // if (filters.lat && filters.lng) {
    //   queryParams.set('lat', filters.lat);
    //   queryParams.set('lng', filters.lng);
    //   if (filters.distance) queryParams.set('distance', filters.distance);
    // }
    
    navigate(`${location.pathname}?${queryParams.toString()}`, { replace: true });
  }, [filters, currentPage, navigate, location.pathname]);
  
  // Effect to sync search term from URL to filters state (e.g., from Navbar search)
  useEffect(() => {
    const params = parseQueryParams(location.search);
    // Update filters if URL params change externally (e.g. browser back/forward, direct link)
    // This avoids an infinite loop with the effect above by checking for actual change.
    if (JSON.stringify(params) !== JSON.stringify({ ...filters, page: currentPage, search: filters.search })) {
        setFilters(prev => ({
            ...prev, // keep existing sort from filters state if not in URL
            search: params.search,
            category: params.category,
            listingType: params.listingType,
            location: params.location,
            tags: params.tags,
            sort: params.sort || prev.sort, // Prioritize URL sort, fallback to current filter state's sort
        }));
        setCurrentPage(params.page);
    }
  }, [location.search]); // Only re-run if the search part of the URL changes


  const queryParamsForAPI = {
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    search: filters.search || undefined,
    category: filters.category || undefined,
    listingType: filters.listingType || undefined,
    location: filters.location || undefined,
    tags: filters.tags || undefined, // Backend expects comma-separated string or handles array if API service changes
    sort: filters.sort,
    // For geo search:
    // latlng: (filters.lat && filters.lng) ? `${filters.lat},${filters.lng}` : undefined,
    // distance: (filters.lat && filters.lng && filters.distance) ? filters.distance : undefined,
  };
  
  // Clean undefined params before sending to API
  Object.keys(queryParamsForAPI).forEach(key => {
    if (queryParamsForAPI[key] === undefined || queryParamsForAPI[key] === "") {
        delete queryParamsForAPI[key];
    }
  });


  const { data, isLoading, error, isError, isFetching, refetch } = useQuery({
    queryKey: ['listings', queryParamsForAPI],
    queryFn: () => getListings(queryParamsForAPI),
    keepPreviousData: true,
  });

  const listings = data?.listings || [];
  // Backend should ideally return total number of items matching filters for accurate pagination
  const totalResults = data?.totalResults || 0; // Assuming backend might send this
  const totalPages = totalResults ? Math.ceil(totalResults / ITEMS_PER_PAGE) : (listings.length === 0 && currentPage === 1 ? 1 : (listings.length < ITEMS_PER_PAGE ? currentPage : currentPage + 1));


  const handleApplyFilters = useCallback((newFiltersFromComponent) => {
    // newFiltersFromComponent contains all filter fields including sort
    setFilters(prev => ({ ...prev, ...newFiltersFromComponent, search: prev.search })); // Preserve search term from navbar
    setCurrentPage(1);
    setIsFiltersSheetOpen(false);
  }, []);

  const handleClearFilters = useCallback(() => {
    const defaultSort = "-createdAt";
    setFilters(prev => ({ 
        search: prev.search, // Keep existing search term
        category: "", 
        listingType: "", 
        location: "", 
        tags: "", 
        sort: defaultSort 
        // lat: "", lng: "", distance: "10" // Reset geo filters if used
    }));
    setCurrentPage(1);
    setIsFiltersSheetOpen(false);
  }, []);
  
  const handlePageChange = (newPage) => {
    if (newPage < 1 || (totalPages > 0 && newPage > totalPages)) return;
    setCurrentPage(newPage);
    window.scrollTo(0, 0); // Scroll to top on page change
  };

  // Render logic
  if (isLoading && currentPage === 1 && !Object.keys(initialFiltersFromUrl).some(k => initialFiltersFromUrl[k] && k !== 'page' && k !== 'sort')) {
    // Show full page loader only on initial load without filters from URL
    return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><LoadingSpinner size={60} /></div>;
  }

  if (isError && !isFetching) { // Show error only if not also fetching (to avoid showing error during filter changes before new data arrives)
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive" className="my-8">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error Fetching Listings</AlertTitle>
          <AlertDescription>
            {error?.response?.data?.message || error?.message || "An unexpected error occurred."}
            <Button onClick={() => refetch()} variant="link" className="ml-2">Try Again</Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters Sidebar (Desktop) */}
        <aside className="md:w-1/4 lg:w-1/5 xl:w-1/6 hidden md:block space-y-6 sticky top-20 h-[calc(100vh-10rem)] self-start">
          <h2 className="text-xl font-semibold border-b pb-3 mb-4">Filters & Sort</h2>
          <ListingFilters 
              initialFilters={filters} 
              onApplyFilters={handleApplyFilters}
              onClearFilters={handleClearFilters}
          />
        </aside>

        {/* Main Content: Listings Grid */}
        <main className="flex-1">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Browse Listings</h1>
              {filters.search && <p className="text-sm text-muted-foreground dark:text-slate-400">Showing results for: <span className="font-semibold">"{filters.search}"</span></p>}
              {isFetching && <p className="text-sm text-primary animate-pulse">Loading new listings...</p>}
            </div>
            <div className="md:hidden"> {/* Filter button for mobile */}
              <Sheet open={isFiltersSheetOpen} onOpenChange={setIsFiltersSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline"><SlidersHorizontal className="mr-2 h-4 w-4" /> Filters & Sort</Button>
                </SheetTrigger>
                <SheetContent className="w-[300px] sm:w-[400px] p-0 flex flex-col">
                  <SheetHeader className="p-4 border-b">
                    <SheetTitle>Filters & Sort</SheetTitle>
                  </SheetHeader>
                  <div className="flex-1 overflow-y-auto p-4">
                      <ListingFilters 
                          initialFilters={filters} 
                          onApplyFilters={handleApplyFilters}
                          onClearFilters={handleClearFilters}
                      />
                  </div>
                  <SheetClose className="p-4 border-t">
                    <Button className="w-full" onClick={() => setIsFiltersSheetOpen(false)}>View Results</Button>
                  </SheetClose>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {isLoading && listings.length === 0 ? ( // Show spinner if loading and no listings yet (e.g. first load with filters)
             <div className="flex justify-center items-center min-h-[300px]"><LoadingSpinner size={48} /></div>
          ) : listings.length === 0 && !isFetching ? (
            <div className="text-center py-16 border border-dashed rounded-lg min-h-[300px] flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-800/30">
              <SearchIcon className="h-16 w-16 text-slate-400 dark:text-slate-500 mb-4" />
              <p className="text-xl text-slate-600 dark:text-slate-300">No listings found.</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Try adjusting your filters or search terms, or clear them to see all listings.</p>
              <Button variant="outline" onClick={handleClearFilters} className="mt-6">
                  Clear All Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <ListingCard key={listing._id} listing={listing} />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && listings.length > 0 && (
             <div className="mt-12 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className={cn(currentPage === 1 && "pointer-events-none opacity-60")}/>
                    </PaginationItem>
                    {/* Implement more robust pagination number generation if needed */}
                    <PaginationItem><PaginationLink isActive>{currentPage}</PaginationLink></PaginationItem>
                    {currentPage < totalPages && listings.length === ITEMS_PER_PAGE && ( // Heuristic to show next page number if plausible
                        <PaginationItem><PaginationLink onClick={() => handlePageChange(currentPage + 1)}>{currentPage + 1}</PaginationLink></PaginationItem>
                    )}
                    {currentPage + 1 < totalPages && listings.length === ITEMS_PER_PAGE && <PaginationItem><PaginationEllipsis /></PaginationItem>}

                    <PaginationItem>
                      <PaginationNext onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || listings.length < ITEMS_PER_PAGE} className={cn((currentPage === totalPages || listings.length < ITEMS_PER_PAGE) && "pointer-events-none opacity-60")}/>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ListingsPage;