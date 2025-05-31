// src/pages/reviews/SubmitReviewPage.jsx
import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { reviewFormSchema } from '@/utils/schemas';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getListingById } from '@/api/listingService'; // To get listing details and owner (reviewee)
import { createReview } from '@/api/reviewService';
import toast from 'react-hot-toast';

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { StarRatingInput } from '@/components/common/StarRating';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";


const SubmitReviewPage = () => {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Fetch listing details to get the reviewee (listing owner) and listing title
  const { data: listingData, isLoading: isLoadingListing, error: listingError } = useQuery({
    queryKey: ['listingForReview', listingId],
    queryFn: () => getListingById(listingId),
    enabled: !!listingId && isAuthenticated, // Only if logged in and listingId is present
  });

  const listing = listingData?.listing;
  const revieweeId = listing?.user?._id;

  const form = useForm({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      rating: 0, // Initial rating
      comment: "",
    },
  });

  const { mutate: submitNewReview, isLoading: isSubmittingReview } = useMutation({
    mutationFn: createReview,
    onSuccess: () => {
      toast.success('Review submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['listingReviews', listingId] });
      queryClient.invalidateQueries({ queryKey: ['userReviews', revieweeId] });
      queryClient.invalidateQueries({ queryKey: ['userProfile', revieweeId] }); // To update average rating on profile
      navigate(`/listings/${listingId}`); // Go back to listing detail
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.message || "Failed to submit review.";
       const errorDetails = error.response?.data?.details;
      if (errorDetails && Array.isArray(errorDetails)) {
        errorDetails.forEach(detail => toast.error(`${detail.field ? detail.field + ': ' : ''}${detail.message}`));
      } else {
        toast.error(errorMsg);
      }
    },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("You must be logged in to submit a review.");
      navigate('/login', { state: { from: location.pathname } });
    }
    if (listingData && listing && currentUser?._id === revieweeId) {
      toast.error("You cannot review your own listing.");
      navigate(`/listings/${listingId}`);
    }
  }, [isAuthenticated, navigate, listingData, listing, currentUser, revieweeId, listingId]);

  const onSubmit = (data) => {
    if (!listingId || !revieweeId) {
      toast.error("Listing or reviewee information is missing.");
      return;
    }
    submitNewReview({ ...data, listingId, revieweeId });
  };
  
  if (isLoadingListing) return <div className="flex justify-center items-center min-h-screen"><LoadingSpinner size={48} /></div>;
  
  if (listingError || !listing) {
     return (
      <Alert variant="destructive" className="my-8 max-w-xl mx-auto">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Error Loading Listing</AlertTitle>
        <AlertDescription>
          {listingError?.response?.data?.message || listingError?.message || "Could not load listing details for review."}
          <Button onClick={() => navigate('/')} variant="link" className="mt-2">Go Home</Button>
        </AlertDescription>
      </Alert>
    );
  }


  return (
    <div className="max-w-xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Submit Review</CardTitle>
          <CardDescription>Share your experience for listing: <strong className="text-primary">{listing.title}</strong> by <strong className="text-primary">{listing.user.name}</strong></CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Rating*</FormLabel>
                    <FormControl>
                      <StarRatingInput rating={field.value} setRating={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Comment*</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe your experience..." {...field} rows={5} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmittingReview}>
                {isSubmittingReview ? <LoadingSpinner size={20} /> : 'Submit Review'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubmitReviewPage;