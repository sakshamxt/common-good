// src/pages/listings/ListingDetailPage.jsx
import React from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getListingById } from '@/api/listingService';
import { getReviewsForListing } from '@/api/reviewService';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Button } from "@/components/ui/button";
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, MapPin, Tag, Edit3, MessageSquare, Info, Clock, Star, List } from "lucide-react";
import { format, isValid as isValidDate } from 'date-fns'; // Import isValidDate
import toast from 'react-hot-toast';
import { cn } from "@/lib/utils";

// Helper component for displaying stars
const DisplayStars = ({ rating, totalStars = 5, size = "h-4 w-4", className = "" }) => {
  const effectiveRating = Math.round(rating * 2) / 2;
  return (
    <div className={cn("flex items-center", className)}>
      {[...Array(totalStars)].map((_, i) => {
        const starValue = i + 1;
        let fillClass = "text-slate-300 dark:text-slate-600";
        if (starValue <= effectiveRating) fillClass = "text-yellow-400 fill-yellow-400";
        else if (starValue - 0.5 === effectiveRating) fillClass = "text-yellow-400 fill-yellow-200";
        return <Star key={`star-${i}`} className={cn(size, fillClass)} />;
      })}
    </div>
  );
};

const ListingDetailPage = () => {
  const { listingId } = useParams();
  const { user: currentUser, isAuthenticated, isLoading: authIsLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const { 
    data: listingQueryData, 
    isLoading: isLoadingListing, 
    error: listingError, 
    refetch: refetchListing 
  } = useQuery({
    queryKey: ['listing', listingId],
    queryFn: () => getListingById(listingId),
    enabled: !!listingId,
  });
  const listing = listingQueryData?.listing;

  const { 
    data: reviewsData, 
    isLoading: isLoadingReviews,
    error: reviewsError,
    refetch: refetchReviews,
  } = useQuery({
    queryKey: ['listingReviews', listingId],
    queryFn: () => getReviewsForListing(listingId, { limit: 10, sort: '-createdAt' }),
    enabled: !!listingId && !!listing,
  });
  const listingReviews = reviewsData?.reviews || [];

  const getAvatarFallback = (name) => {
    if (!name) return "U";
    const parts = name.split(" ");
    return parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
  };

  const handleContactAction = () => {
    if (!isAuthenticated) {
      toast.error("Please login to contact the user.");
      navigate('/login', { state: { from: location } });
      return;
    }
    if (listing && listing.user) {
      navigate(`/messages/new?receiverId=${listing.user._id}&listingId=${listing._id}`);
    }
  };
  
  const isOwner = currentUser && listing?.user && currentUser._id === listing.user._id;

  // Helper to safely format dates
  const formatDateSafely = (dateInput, formatString) => {
    if (!dateInput) return 'N/A';
    const dateObj = new Date(dateInput);
    return isValidDate(dateObj) ? format(dateObj, formatString) : 'Invalid Date';
  };

  if (authIsLoading || (isLoadingListing && !listingQueryData)) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><LoadingSpinner size={60} /></div>;
  }

  if (listingError || !listing) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive" className="my-8 max-w-2xl mx-auto">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error Fetching Listing</AlertTitle>
          <AlertDescription>
            {listingError?.response?.data?.message || listingError?.message || "Could not load listing details."}
            <div className="mt-4">
              <Button onClick={() => navigate('/listings')} variant="outline" className="mr-2">Go to Listings</Button>
              {listingError && <Button onClick={() => refetchListing()} variant="link">Try Again</Button>}
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Column: Photos & Listing Details Card */}
        <div className="md:col-span-2 space-y-6">
          {listing.photos && listing.photos.length > 0 ? (
            <Carousel className="w-full rounded-lg overflow-hidden shadow-lg border dark:border-slate-700">
              <CarouselContent>
                {listing.photos.map((photo, index) => (
                  <CarouselItem key={photo.public_id || index}>
                    <div className="aspect-[16/10] bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <img src={photo.url} alt={`${listing.title} - photo ${index + 1}`} className="w-full h-full object-contain"/>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {listing.photos.length > 1 && (
                <>
                  <CarouselPrevious className="absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white dark:bg-slate-700/80 dark:hover:bg-slate-700" />
                  <CarouselNext className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white dark:bg-slate-700/80 dark:hover:bg-slate-700" />
                </>
              )}
            </Carousel>
          ) : (
            <div className="aspect-[16/10] bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 shadow-lg border dark:border-slate-700">
              No images provided
            </div>
          )}

          <Card className="shadow-lg dark:bg-slate-800 dark:border-slate-700">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <CardTitle className="text-2xl lg:text-3xl font-bold text-slate-800 dark:text-slate-100">{listing.title}</CardTitle>
                <Badge variant={listing.status === 'active' ? 'default' : 'secondary'} className="capitalize whitespace-nowrap mt-1 sm:mt-0 h-fit">
                    {listing.status.replace('_', ' ')}
                </Badge>
              </div>
              <div className="flex items-center space-x-2 mt-2 text-sm">
                <Badge variant="outline" className="border-primary/50 text-primary dark:border-primary/70 dark:text-primary/90">
                  {listing.listingType.replace(/([A-Z])/g, ' $1').trim()}
                </Badge>
                <span className="text-slate-500 dark:text-slate-400">&bull;</span>
                <Badge variant="outline" className="dark:border-slate-600 dark:text-slate-300">{listing.category}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mt-2">Description</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{listing.description}</p>
              {listing.tags && listing.tags.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-md font-semibold text-slate-700 dark:text-slate-200 mb-2">Tags:</h4>
                  <div className="flex flex-wrap gap-2">
                    {listing.tags.map(tag => <Badge key={tag} variant="secondary" className="dark:bg-slate-700 dark:text-slate-200">{tag}</Badge>)}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm text-slate-600 dark:text-slate-300 pt-4 border-t dark:border-slate-700 mt-4">
                {listing.estimatedEffort && (<div className="flex items-center"><Clock className="h-4 w-4 mr-2 text-primary" /><strong>Effort:</strong>&nbsp;{listing.estimatedEffort}</div>)}
                {listing.exchangePreference && (<div className="flex items-center"><Info className="h-4 w-4 mr-2 text-primary" /><strong>Preference:</strong>&nbsp;{listing.exchangePreference}</div>)}
                {listing.location && (<div className="flex items-center col-span-full"><MapPin className="h-4 w-4 mr-2 text-primary" /><strong>Location:</strong>&nbsp;{listing.location}</div>)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: User Info, Actions, Reviews, Map */}
        <div className="md:col-span-1 space-y-6">
          <Card className="shadow-lg dark:bg-slate-800 dark:border-slate-700">
            <CardHeader className="text-center">
              <Link to={`/profile/${listing.user?._id}`} className="inline-block group">
                <Avatar className="w-24 h-24 mx-auto mb-3 border-4 border-transparent group-hover:border-primary/40 transition-all duration-300 dark:group-hover:border-primary/60">
                  <AvatarImage src={listing.user?.profilePictureUrl} alt={listing.user?.name} />
                  <AvatarFallback className="text-3xl">{getAvatarFallback(listing.user?.name)}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-xl group-hover:text-primary transition-colors dark:text-slate-100 dark:group-hover:text-primary/80">{listing.user?.name || "Barterer"}</CardTitle>
              </Link>
              <CardDescription className="text-xs dark:text-slate-400">{listing.user?.location || "Location not specified"}</CardDescription>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Member since {formatDateSafely(listing.user?.createdAt, "MMMM yyyy")} {/* SAFE FORMAT */}
              </div>
              {listing.user?.numReviews != null && listing.user.numReviews > 0 ? (
                  <div className="mt-2 flex items-center justify-center">
                      <DisplayStars rating={listing.user.averageRating || 0} />
                      <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">({listing.user.averageRating?.toFixed(1)} from {listing.user.numReviews} reviews)</span>
                  </div>
              ) : (<p className="mt-2 text-xs text-slate-500 dark:text-slate-400 italic">No user reviews yet.</p>)}
            </CardHeader>
            <CardContent className="space-y-3">
              {isOwner ? (
                <Button asChild className="w-full"><Link to={`/listings/${listing._id}/edit`}><Edit3 className="mr-2 h-4 w-4" /> Edit Your Listing</Link></Button>
              ) : (
                <Button onClick={handleContactAction} className="w-full" disabled={!isAuthenticated && authIsLoading}>
                  <MessageSquare className="mr-2 h-4 w-4" /> Contact {listing.listingType.toLowerCase().includes('offer') ? 'Provider' : 'Requester'}
                </Button>
              )}
              {!isAuthenticated && !authIsLoading && <p className="text-xs text-center text-amber-700 dark:text-amber-500 mt-1">Login to contact user.</p>}
            </CardContent>
          </Card>
          
          <Card className="shadow-lg dark:bg-slate-800 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg flex items-center text-slate-800 dark:text-slate-100"><List className="mr-2 h-5 w-5 text-primary" />Listing Reviews</CardTitle>
              <CardDescription className="dark:text-slate-400">({listingReviews.length > 0 ? listingReviews.length : 'No'} review{listingReviews.length !== 1 ? 's' : ''} for this listing)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
              {isLoadingReviews && <div className="flex justify-center py-4"><LoadingSpinner /></div>}
              {!isLoadingReviews && reviewsError && (
                <Alert variant="destructive"> {/* Corrected: no stray '>' */}
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Error Loading Reviews</AlertTitle>
                  <AlertDescription>{reviewsError.message} <Button variant="link" size="sm" onClick={() => refetchReviews()}>Try Again</Button></AlertDescription>
                </Alert>
              )}
              {!isLoadingReviews && !reviewsError && listingReviews.length === 0 && (<p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No reviews for this listing yet.</p>)}
              {listingReviews.map(review => (
                <div key={review._id} className="border-b border-slate-200 dark:border-slate-700 pb-3 last:border-b-0 mb-3 last:mb-0">
                  <div className="flex items-start space-x-3">
                    <Link to={`/profile/${review.reviewer?._id}`}>
                      <Avatar className="h-9 w-9 mt-0.5 cursor-pointer"><AvatarImage src={review.reviewer?.profilePictureUrl} alt={review.reviewer?.name} /><AvatarFallback>{getAvatarFallback(review.reviewer?.name)}</AvatarFallback></Avatar>
                    </Link>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <Link to={`/profile/${review.reviewer?._id}`} className="font-semibold text-sm hover:underline text-slate-800 dark:text-slate-100">{review.reviewer?.name || "Anonymous"}</Link>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{formatDateSafely(review.createdAt, "dd MMM, yyyy")}</span> {/* SAFE FORMAT */}
                      </div>
                      <DisplayStars rating={review.rating} size="h-4 w-4" className="my-1" />
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{review.comment}</p>
                      {review.listing && (<p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Context: <span className="font-medium">{listing.title}</span></p>)}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
            {isAuthenticated && currentUser && listing && listing.user._id !== currentUser._id && (
                <CardFooter className="border-t border-slate-200 dark:border-slate-700 pt-4">
                    <Button asChild variant="outline" className="w-full"><Link to={`/listings/${listingId}/review`}>Write a Review for this Exchange</Link></Button>
                </CardFooter>
            )}
          </Card>

          {listing.coordinates && listing.coordinates.coordinates?.length === 2 && (
            <Card className="shadow-lg dark:bg-slate-800 dark:border-slate-700">
              <CardHeader><CardTitle className="text-lg text-slate-800 dark:text-slate-100">Location Map</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 dark:text-slate-400">Map view placeholder. Coordinates: {listing.coordinates.coordinates.join(', ')}</p>
                <div className="mt-2 h-48 bg-slate-200 dark:bg-slate-700 rounded-md flex items-center justify-center text-slate-400 dark:text-slate-500">Map Placeholder</div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListingDetailPage;