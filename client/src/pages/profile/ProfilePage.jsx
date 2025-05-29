// src/pages/profile/ProfilePage.jsx
import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getUserProfile } from '@/api/userService';
import { getReviewsForUser } from '@/api/reviewService';
import { getListings } from '@/api/listingService'; // To fetch user's listings
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import ListingCard from '@/components/common/ListingCard'; // Re-use ListingCard
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Edit3, Mail, Star, List, MapPin, Info, Briefcase } from 'lucide-react';
// import StarRating from '@/components/common/StarRating'; // We'll create this if needed for reviews

// Simple Star Display Component (can be moved to common components)
const DisplayStars = ({ rating, totalStars = 5 }) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5 ? 1 : 0; // Simple half star logic
  const emptyStars = totalStars - fullStars - halfStar;
  return (
    <div className="flex items-center">
      {[...Array(fullStars)].map((_, i) => <Star key={`full-${i}`} className="h-4 w-4 text-yellow-400 fill-yellow-400" />)}
      {halfStar === 1 && <Star key="half" className="h-4 w-4 text-yellow-400 fill-yellow-200" />} {/* A way to show half */}
      {[...Array(emptyStars)].map((_, i) => <Star key={`empty-${i}`} className="h-4 w-4 text-yellow-400" />)}
    </div>
  );
};


const ProfilePage = () => {
  const { userId: paramUserId } = useParams(); // ID from URL param
  const { user: currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Determine whose profile to fetch: param user or current authenticated user (for /profile/me)
  const userIdToFetch = paramUserId || currentUser?._id;
  const isOwnProfile = currentUser && userIdToFetch === currentUser._id;

  const { data: profileData, isLoading: isLoadingProfile, error: profileError, refetch: refetchProfile } = useQuery({
    queryKey: ['userProfile', userIdToFetch],
    queryFn: () => getUserProfile(userIdToFetch),
    enabled: !!userIdToFetch, // Only run if we have an ID
  });

  const { data: reviewsData, isLoading: isLoadingReviews } = useQuery({
    queryKey: ['userReviews', userIdToFetch],
    queryFn: () => getReviewsForUser(userIdToFetch, { limit: 5, sort: '-createdAt' }), // Fetch latest 5 reviews
    enabled: !!userIdToFetch && !!profileData, // Only run if profile loaded
  });
  
  const { data: listingsData, isLoading: isLoadingListings } = useQuery({
    queryKey: ['userListings', userIdToFetch],
    // Backend doesn't have /users/:userId/listings, so fetch all and filter (not ideal for many listings)
    // OR, if backend supports filtering by user ID on the main /listings endpoint:
    queryFn: () => getListings({ user: userIdToFetch, limit: 6, status: 'active' }), // Assuming backend supports ?user=userId
    enabled: !!userIdToFetch && !!profileData,
  });


  const userProfile = profileData?.user;
  const userReviews = reviewsData?.reviews || [];
  const userRevieweeInfo = reviewsData?.reviewee; // Contains averageRating, numReviews
  const userListings = listingsData?.listings || [];

  const getAvatarFallback = (name) => {
    if (!name) return "U";
    const parts = name.split(" ");
    return parts.length > 1 ? parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase() : name.substring(0, 2).toUpperCase();
  };

  if (isLoadingProfile || (isOwnProfile && !currentUser)) { // Ensure current user is loaded for own profile
    return <div className="flex justify-center items-center min-h-screen"><LoadingSpinner size={48} /></div>;
  }

  if (profileError || !userProfile) {
    return (
       <Alert variant="destructive" className="my-8 max-w-2xl mx-auto">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Error Loading Profile</AlertTitle>
        <AlertDescription>
          {profileError?.response?.data?.message || profileError?.message || "Could not load user profile. The user may not exist or there was an error."}
           <div className="mt-4">
            <Button onClick={() => navigate('/')} variant="outline" className="mr-2">Go Home</Button>
            {profileError && <Button onClick={() => refetchProfile()} variant="link">Try Again</Button>}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto py-8 px-2 sm:px-4">
      <Card className="mb-8 shadow-lg">
        <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
          <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-primary/50 shadow-md">
            <AvatarImage src={userProfile.profilePictureUrl} alt={userProfile.name} />
            <AvatarFallback className="text-5xl">{getAvatarFallback(userProfile.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800">{userProfile.name}</h1>
            {userProfile.location && (
              <p className="text-md text-slate-600 mt-1 flex items-center justify-center md:justify-start">
                <MapPin className="h-4 w-4 mr-2" /> {userProfile.location}
              </p>
            )}
            <p className="text-sm text-slate-500 mt-1">
              Member since {new Date(userProfile.createdAt).toLocaleDateString()}
            </p>
            {userRevieweeInfo && userRevieweeInfo.numReviews > 0 && (
              <div className="mt-2 flex items-center justify-center md:justify-start">
                <DisplayStars rating={userRevieweeInfo.averageRating} />
                <span className="ml-2 text-sm text-slate-600">
                  ({userRevieweeInfo.averageRating?.toFixed(1)} average rating from {userRevieweeInfo.numReviews} reviews)
                </span>
              </div>
            )}
             {userProfile.bio && <p className="mt-3 text-slate-700 text-sm md:text-base leading-relaxed">{userProfile.bio}</p>}

             {isOwnProfile ? (
              <Button asChild className="mt-4">
                <Link to="/profile/me/edit"><Edit3 className="mr-2 h-4 w-4" /> Edit Profile</Link>
              </Button>
            ) : isAuthenticated && (
              <Button className="mt-4" onClick={() => navigate(`/messages/new?receiverId=${userProfile._id}`)}>
                <Mail className="mr-2 h-4 w-4" /> Message {userProfile.name.split(' ')[0]}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {userProfile.skillsOffered && userProfile.skillsOffered.length > 0 && (
            <Card>
                <CardHeader><CardTitle className="text-lg flex items-center"><Briefcase className="mr-2 h-5 w-5 text-primary"/>Skills Offered</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                    {userProfile.skillsOffered.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
                </CardContent>
            </Card>
        )}
         {userProfile.skillsSought && userProfile.skillsSought.length > 0 && (
            <Card>
                <CardHeader><CardTitle className="text-lg flex items-center"><Info className="mr-2 h-5 w-5 text-primary"/>Skills Sought</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                    {userProfile.skillsSought.map(skill => <Badge key={skill} variant="outline">{skill}</Badge>)}
                </CardContent>
            </Card>
        )}
      </div>


      <Tabs defaultValue="listings" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex mb-6">
          <TabsTrigger value="listings"><List className="mr-2 h-4 w-4"/>Listings ({userListings.length})</TabsTrigger>
          <TabsTrigger value="reviews"><Star className="mr-2 h-4 w-4"/>Reviews Received ({userReviews.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="listings">
          <Card>
            <CardHeader><CardTitle>Active Listings by {userProfile.name.split(' ')[0]}</CardTitle></CardHeader>
            <CardContent>
              {isLoadingListings && <LoadingSpinner />}
              {!isLoadingListings && userListings.length === 0 && <p className="text-slate-500">This user has no active listings.</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {userListings.map(listing => <ListingCard key={listing._id} listing={listing} />)}
              </div>
              {/* TODO: Add link to see all user's listings if more than a few */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
          <Card>
            <CardHeader><CardTitle>Reviews for {userProfile.name.split(' ')[0]}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {isLoadingReviews && <LoadingSpinner />}
              {!isLoadingReviews && userReviews.length === 0 && <p className="text-slate-500">This user has not received any reviews yet.</p>}
              {userReviews.map(review => (
                <Card key={review._id} className="p-4">
                  <div className="flex items-center mb-2">
                    <Avatar className="h-8 w-8 mr-3">
                      <AvatarImage src={review.reviewer?.profilePictureUrl} alt={review.reviewer?.name} />
                      <AvatarFallback>{getAvatarFallback(review.reviewer?.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{review.reviewer?.name || "Anonymous"}</p>
                      <DisplayStars rating={review.rating} />
                    </div>
                    <span className="ml-auto text-xs text-slate-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-slate-700">{review.comment}</p>
                  {review.listing && (
                    <p className="text-xs text-slate-500 mt-2">
                      Regarding listing: <Link to={`/listings/${review.listing._id}`} className="text-primary hover:underline">{review.listing.title || "View Listing"}</Link>
                    </p>
                  )}
                </Card>
              ))}
              {/* TODO: Add link to see all reviews if more than a few */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfilePage;