// src/pages/listings/ListingDetailPage.jsx
import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getListingById } from '@/api/listingService';
import { useAuth } from '@/hooks/useAuth'; // To check if current user is the owner
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, MapPin, Tag, UserCircle, Edit3, MessageSquare, Info, Clock } from "lucide-react";

const ListingDetailPage = () => {
  const { listingId } = useParams();
  const { user: currentUser, isAuthenticated } = useAuth(); // Get current logged-in user
  const navigate = useNavigate();

  const { data, isLoading, error, isError, refetch } = useQuery({
    queryKey: ['listing', listingId],
    queryFn: () => getListingById(listingId),
    enabled: !!listingId, // Only run query if listingId is available
  });

  const listing = data?.listing;

  const getAvatarFallback = (name) => {
    if (!name) return "U";
    const parts = name.split(" ");
    return parts.length > 1 ? parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase() : name.substring(0, 2).toUpperCase();
  };

  const handleContactSeller = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    // Navigate to a new conversation page or open a modal
    // Pass receiverId (listing.user._id) and listingId
    // Example:
    navigate(`/messages/new?receiverId=${listing.user._id}&listingId=${listing._id}`);
    // We will build out the full /messages/new flow later.
    console.log(`Contacting user ${listing.user._id} about listing ${listing._id}`);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <LoadingSpinner size={60} />
      </div>
    );
  }

  if (isError || !listing) {
    return (
      <Alert variant="destructive" className="my-8 max-w-2xl mx-auto">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Error Fetching Listing</AlertTitle>
        <AlertDescription>
          {error?.response?.data?.message || error?.message || "Could not load listing details. It might have been removed or the link is incorrect."}
          <div className="mt-4">
            <Button onClick={() => navigate('/listings')} variant="outline" className="mr-2">Go to Listings</Button>
            {isError && <Button onClick={() => refetch()} variant="link">Try Again</Button>}
          </div>
        </AlertDescription>
      </Alert>
    );
  }
  
  const isOwner = currentUser && listing.user && currentUser._id === listing.user._id;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Column: Photos & User Info Card */}
        <div className="md:col-span-2 space-y-6">
          {/* Photo Carousel */}
          {listing.photos && listing.photos.length > 0 ? (
            <Carousel className="w-full rounded-lg overflow-hidden shadow-lg">
              <CarouselContent>
                {listing.photos.map((photo, index) => (
                  <CarouselItem key={photo.public_id || index}>
                    <div className="aspect-video">
                      <img src={photo.url} alt={`${listing.title} - photo ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {listing.photos.length > 1 && (
                <>
                  <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2" />
                  <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2" />
                </>
              )}
            </Carousel>
          ) : (
            <div className="aspect-video bg-slate-200 rounded-lg flex items-center justify-center text-slate-500 shadow-lg">
              No images provided
            </div>
          )}

          {/* Listing Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-slate-800">{listing.title}</CardTitle>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="secondary">{listing.listingType.replace(/([A-Z])/g, ' $1').trim()}</Badge>
                <Badge variant="outline">{listing.category}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{listing.description}</p>
              
              {listing.tags && listing.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm font-medium text-slate-600">Tags:</span>
                  {listing.tags.map(tag => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-600 pt-2">
                {listing.estimatedEffort && (
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-primary" />
                    <strong>Effort:</strong>&nbsp;{listing.estimatedEffort}
                  </div>
                )}
                {listing.exchangePreference && (
                  <div className="flex items-center">
                    <Info className="h-4 w-4 mr-2 text-primary" />
                    <strong>Preference:</strong>&nbsp;{listing.exchangePreference}
                  </div>
                )}
                {listing.location && (
                  <div className="flex items-center col-span-full sm:col-span-1"> {/* Adjust span if needed */}
                    <MapPin className="h-4 w-4 mr-2 text-primary" />
                    <strong>Location:</strong>&nbsp;{listing.location}
                  </div>
                )}
                 <div className="flex items-center">
                    <Badge variant={listing.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                        Status: {listing.status}
                    </Badge>
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: User Info & Actions */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader className="text-center">
              <Link to={`/profile/${listing.user?._id}`} className="inline-block">
                <Avatar className="w-24 h-24 mx-auto mb-3 border-2 border-primary">
                  <AvatarImage src={listing.user?.profilePictureUrl} alt={listing.user?.name} />
                  <AvatarFallback className="text-3xl">{getAvatarFallback(listing.user?.name)}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-xl hover:text-primary transition-colors">{listing.user?.name || "Barterer"}</CardTitle>
              </Link>
              <CardDescription>{listing.user?.location || "Location not specified"}</CardDescription>
              {/* Placeholder for user rating */}
              <div className="mt-2 text-xs text-slate-500">Member since {new Date(listing.user?.createdAt).toLocaleDateString()}</div>
            </CardHeader>
            <CardContent className="space-y-3">
              {isOwner ? (
                <Button asChild className="w-full">
                  <Link to={`/listings/${listing._id}/edit`}><Edit3 className="mr-2 h-4 w-4" /> Edit Your Listing</Link>
                </Button>
              ) : (
                <Button onClick={handleContactSeller} className="w-full" disabled={!isAuthenticated && !currentUser}>
                  <MessageSquare className="mr-2 h-4 w-4" /> Contact {listing.listingType.toLowerCase().includes('offer') ? 'Seller' : 'Requester'}
                </Button>
              )}
              {!isAuthenticated && !currentUser && <p className="text-xs text-center text-amber-600 mt-2">Login to contact.</p>}
              {/* Add to favorites/watchlist button - future feature */}
            </CardContent>
          </Card>

          {/* Placeholder for Reviews Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reviews for this Listing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">Reviews will be displayed here soon.</p>
              {/* TODO: Fetch and display reviews related to listing.listing.user._id and/or listing._id */}
            </CardContent>
          </Card>
          
          {/* Placeholder for Map - future enhancement */}
          {listing.coordinates && listing.coordinates.coordinates?.length === 2 && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Location Map</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500">Map view will be here. Coords: {listing.coordinates.coordinates.join(', ')}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListingDetailPage;