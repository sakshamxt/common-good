// src/pages/listings/MyListingsPage.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getListings, deleteListingApi } from '@/api/listingService';
import { useAuth } from '@/hooks/useAuth';
import ListingCard from '@/components/common/ListingCard'; // Re-use
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import toast from 'react-hot-toast';
import { Edit3, Trash2, PlusCircle, Terminal, ListFilter } from 'lucide-react';
import { Card } from "@/components/ui/card";

const ITEMS_PER_PAGE = 9;
const listingStatuses = ["active", "pending_exchange", "completed", "cancelled"];

const MyListingsPage = () => {
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("active"); // Default to active listings
  const [currentPage, setCurrentPage] = useState(1);

  const queryParams = {
    user: currentUser?._id,
    status: activeTab,
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    sort: '-createdAt', // Show newest first
  };

  const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: ['myListings', queryParams],
    queryFn: () => getListings(queryParams),
    enabled: !!currentUser?._id && !authLoading, // Only fetch if user is loaded
    keepPreviousData: true,
  });

  const listings = data?.listings || [];

  const deleteMutation = useMutation({
    mutationFn: deleteListingApi,
    onSuccess: () => {
      toast.success("Listing deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ['myListings'] }); // Refetch user's listings
      queryClient.invalidateQueries({ queryKey: ['listings'] }); // Also invalidate general listings
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to delete listing.");
    },
  });

  const handleDeleteListing = (listingId) => {
    deleteMutation.mutate(listingId);
  };

  if (authLoading || (isLoading && !data)) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><LoadingSpinner size={48} /></div>;
  }

  if (!currentUser) {
    // Should be caught by ProtectedRoute, but as a fallback
    return <p className="text-center py-10">Please log in to view your listings.</p>;
  }
  
  if (isError) {
    return (
      <Alert variant="destructive" className="my-8">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Error Fetching Your Listings</AlertTitle>
        <AlertDescription>
          {error?.response?.data?.message || error?.message || "An unexpected error occurred."}
          <Button onClick={() => refetch()} variant="link" className="ml-2">Try Again</Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-slate-800">My Listings</h1>
        <Button asChild>
          <Link to="/listings/new"><PlusCircle className="mr-2 h-4 w-4" /> Create New Listing</Link>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => {setActiveTab(value); setCurrentPage(1);}} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6">
          {listingStatuses.map(status => (
            <TabsTrigger key={status} value={status} className="capitalize">
              {status.replace('_', ' ')}
            </TabsTrigger>
          ))}
        </TabsList>

        {listingStatuses.map(status => (
          <TabsContent key={status} value={status}>
            {isFetching && <p className="text-sm text-slate-500 mb-4 text-center">Updating listings...</p>}
            {listings.length === 0 && !isFetching ? (
              <div className="text-center py-10 rounded-lg border border-dashed border-slate-300 bg-slate-50">
                {/* Replace with an appropriate SVG or image */}
                {/* <ListFilter className="mx-auto h-16 w-16 text-slate-400 mb-4" /> */}
                <p className="text-xl text-slate-600">No {status.replace('_', ' ')} listings found.</p>
                {status === "active" && <p className="text-sm text-slate-500 mt-2">Why not create one now?</p>}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <Card key={listing._id} className="flex flex-col">
                    <ListingCard listing={listing} />
                    <div className="p-4 border-t flex justify-end space-x-2 mt-auto">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/listings/${listing._id}/edit`}><Edit3 className="mr-1 h-3 w-3" /> Edit</Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" disabled={deleteMutation.isLoading}>
                            <Trash2 className="mr-1 h-3 w-3" /> Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your listing titled "{listing.title}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteListing(listing._id)}
                              className="bg-red-600 hover:bg-red-700"
                              disabled={deleteMutation.isLoading}
                            >
                              {deleteMutation.isLoading ? "Deleting..." : "Yes, delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </Card>
                ))}
              </div>
            )}
            {/* TODO: Add Pagination controls here if data.totalPages or data.totalItems is available */}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default MyListingsPage;