// src/pages/profile/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserProfile } from '@/api/userService';
import { getReviewsForUser } from '@/api/reviewService';
import { getListings } from '@/api/listingService';
import { useAuth } from '@/hooks/useAuth';

import LoadingSpinner from '@/components/common/LoadingSpinner';
import ListingCard from '@/components/common/ListingCard';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Edit3, Mail, Star, List, MapPin, Info, Briefcase, ShieldCheck, UserPlus } from 'lucide-react';
import { format } from 'date-fns';

// Helper component for displaying stars (Ideally, import from a shared component)
const DisplayStars = ({ rating, totalStars = 5, size = "h-4 w-4", className = "" }) => {
  const fullStars = Math.floor(rating);
  const effectiveRating = Math.round(rating * 2) / 2; // Rounds to nearest 0.5

  return (
    <div className={`flex items-center ${className}`}>
      {[...Array(totalStars)].map((_, i) => {
        const starValue = i + 1;
        let fillClass = "text-slate-300 dark:text-slate-600"; // Empty star
        if (starValue <= effectiveRating) {
          fillClass = "text-yellow-400 fill-yellow-400"; // Full star
        } else if (starValue - 0.5 === effectiveRating) {
          // For a visual half-star, you might need a half-star icon or clip-path.
          // This is a simple approximation using fill.
          fillClass = "text-yellow-400 fill-yellow-200"; 
        }
        return <Star key={`star-${i}`} className={`${size} ${fillClass}`} />;
      })}
    </div>
  );
};

const ProfilePage = () => {
  const { userId: paramUserId } = useParams(); // ID from URL param for viewing others' profiles
  const { user: currentUser, isAuthenticated, isLoading: authIsLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Determine whose profile to fetch
  const isOwnProfileView = !paramUserId && isAuthenticated; // True if on /profile/me
  const userIdToFetch = isOwnProfileView ? currentUser?._id : paramUserId;

  const [activeListingsTab, setActiveListingsTab] = useState("active");

  // Fetch User Profile Data
  const { 
    data: profileQueryData, 
    isLoading: isLoadingProfile, 
    error: profileError, 
    refetch: refetchProfile 
  } = useQuery({
    queryKey: ['userProfile', userIdToFetch],
    queryFn: () => getUserProfile(userIdToFetch),
    enabled: !!userIdToFetch && !authIsLoading, // Only run if we have an ID and auth state is resolved
  });
  const userProfile = profileQueryData?.user;

  // Fetch User's Listings (Active by default, can be extended for other statuses)
  const { 
    data: listingsData, 
    isLoading: isLoadingListings 
  } = useQuery({
    queryKey: ['userListings', userIdToFetch, activeListingsTab],
    queryFn: () => getListings({ user: userIdToFetch, status: activeListingsTab, limit: 6, sort: '-createdAt' }),
    enabled: !!userIdToFetch && !!userProfile, // Fetch only after profile is loaded
  });
  const userListings = listingsData?.listings || [];

  // Fetch Reviews Received by this User
  const { 
    data: reviewsData, 
    isLoading: isLoadingReviews 
  } = useQuery({
    queryKey: ['userReviews', userIdToFetch],
    queryFn: () => getReviewsForUser(userIdToFetch, { limit: 10, sort: '-createdAt' }),
    enabled: !!userIdToFetch && !!userProfile, // Fetch only after profile is loaded
  });
  const userReceivedReviews = reviewsData?.reviews || [];
  // reviewee info (avgRating, numReviews) is now directly on userProfile from backend

  useEffect(() => {
    // If this is supposed to be /profile/me but currentUser is not available yet after auth loading,
    // or if no userIdToFetch, redirect or show error.
    if (!authIsLoading && isOwnProfileView && !currentUser) {
      navigate('/login'); // Should be caught by ProtectedRoute but good fallback
    }
    if (!authIsLoading && !userIdToFetch && !isOwnProfileView) {
        // This case means /profile/:userId was hit with no userId, which shouldn't happen with routing
        // Or /profile/me was hit, user is not auth, and paramUserId is also missing
        navigate('/'); // Or to a 404 page
    }
  }, [authIsLoading, currentUser, isOwnProfileView, userIdToFetch, navigate]);


  const getAvatarFallback = (name) => {
    if (!name) return "U";
    const parts = name.split(" ");
    return parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
  };

  if (authIsLoading || (isLoadingProfile && !userProfile)) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><LoadingSpinner size={60} /></div>;
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
  
  const canSendMessage = isAuthenticated && currentUser && currentUser._id !== userProfile._id;

  return (
    <div className="container mx-auto py-8 px-2 sm:px-4">
      {/* Profile Header Card */}
      <Card className="mb-8 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 via-slate-50 to-secondary/10 p-1"> {/* Decorative gradient border idea */}
            <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 bg-background rounded-lg">
            <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-white dark:border-slate-700 shadow-lg flex-shrink-0">
                <AvatarImage src={userProfile.profilePictureUrl} alt={userProfile.name} />
                <AvatarFallback className="text-5xl">{getAvatarFallback(userProfile.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100">{userProfile.name}</h1>
                {userProfile.location && (
                <p className="text-md text-slate-600 dark:text-slate-400 mt-1 flex items-center justify-center md:justify-start">
                    <MapPin className="h-4 w-4 mr-2 flex-shrink-0" /> {userProfile.location}
                </p>
                )}
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Member since {format(new Date(userProfile.createdAt), "MMMM yyyy")}
                </p>
                {userProfile.numReviews > 0 ? (
                <div className="mt-3 flex items-center justify-center md:justify-start space-x-2">
                    <DisplayStars rating={userProfile.averageRating} />
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                    ({userProfile.averageRating?.toFixed(1)} average from {userProfile.numReviews} reviews)
                    </span>
                </div>
                ) : (
                 <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 italic">No reviews yet.</p>
                )}
                {userProfile.bio && <p className="mt-4 text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed max-w-xl">{userProfile.bio}</p>}

                <div className="mt-6 space-x-3">
                {isOwnProfileView ? (
                    <Button asChild size="lg">
                    <Link to="/profile/me/edit"><Edit3 className="mr-2 h-4 w-4" /> Edit Profile</Link>
                    </Button>
                ) : canSendMessage && (
                    <Button size="lg" onClick={() => navigate(`/messages/new?receiverId=${userProfile._id}`)}>
                    <Mail className="mr-2 h-4 w-4" /> Message {userProfile.name.split(' ')[0]}
                    </Button>
                )}
                {/* Add other actions like "Follow" if applicable */}
                </div>
            </div>
            </CardContent>
        </div>
      </Card>

      {/* Skills Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="shadow-lg">
          <CardHeader><CardTitle className="text-xl flex items-center"><Briefcase className="mr-2 h-5 w-5 text-primary"/>Skills Offered</CardTitle></CardHeader>
          <CardContent>
            {userProfile.skillsOffered && userProfile.skillsOffered.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {userProfile.skillsOffered.map(skill => <Badge key={skill} variant="secondary" className="text-sm px-3 py-1">{skill}</Badge>)}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 italic">No skills offered yet.</p>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader><CardTitle className="text-xl flex items-center"><UserPlus className="mr-2 h-5 w-5 text-primary"/>Skills Sought</CardTitle></CardHeader>
          <CardContent>
            {userProfile.skillsSought && userProfile.skillsSought.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {userProfile.skillsSought.map(skill => <Badge key={skill} variant="outline" className="text-sm px-3 py-1">{skill}</Badge>)}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 italic">No specific skills sought at the moment.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Listings and Reviews */}
      <Tabs defaultValue="listings" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:max-w-md mb-6 border-b-0 rounded-lg p-1 bg-slate-100 dark:bg-slate-800">
          <TabsTrigger value="listings" className="data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-primary"><List className="mr-2 h-4 w-4"/>Listings ({userListings.length})</TabsTrigger>
          <TabsTrigger value="reviews" className="data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-primary"><Star className="mr-2 h-4 w-4"/>Reviews Received ({userReceivedReviews.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="listings">
          <Card className="shadow-lg">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Listings by {userProfile.name.split(' ')[0]}</CardTitle>
                    {/* Optional: Filters for user's listings status within this tab if needed */}
                </div>
            </CardHeader>
            <CardContent>
              {isLoadingListings && <div className="flex justify-center py-6"><LoadingSpinner /></div>}
              {!isLoadingListings && userListings.length === 0 && <p className="text-slate-500 dark:text-slate-400 py-6 text-center italic">This user has no {activeListingsTab} listings.</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {userListings.map(listing => <ListingCard key={listing._id} listing={listing} />)}
              </div>
              {/* TODO: Add "View All Listings by this user" link/button if results are paginated */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
          <Card className="shadow-lg">
            <CardHeader><CardTitle>Reviews Received</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {isLoadingReviews && <div className="flex justify-center py-6"><LoadingSpinner /></div>}
              {!isLoadingReviews && userReceivedReviews.length === 0 && <p className="text-slate-500 dark:text-slate-400 py-6 text-center italic">This user has not received any reviews yet.</p>}
              {userReceivedReviews.map(review => (
                <Card key={review._id} className="p-4 border bg-slate-50 dark:bg-slate-800/50 shadow-sm">
                  <div className="flex items-start space-x-3">
                     <Link to={`/profile/${review.reviewer?._id}`}>
                        <Avatar className="h-10 w-10 cursor-pointer flex-shrink-0">
                          <AvatarImage src={review.reviewer?.profilePictureUrl} alt={review.reviewer?.name} />
                          <AvatarFallback>{getAvatarFallback(review.reviewer?.name)}</AvatarFallback>
                        </Avatar>
                     </Link>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <Link to={`/profile/${review.reviewer?._id}`} className="font-semibold text-sm hover:underline text-slate-800 dark:text-slate-100">{review.reviewer?.name || "Anonymous"}</Link>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{format(new Date(review.createdAt), "dd MMM, yyyy")}</span>
                      </div>
                      <DisplayStars rating={review.rating} size="h-4 w-4" className="mb-1.5" />
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{review.comment}</p>
                       {review.listing && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                          Regarding: <Link to={`/listings/${review.listing._id}`} className="text-primary hover:underline font-medium">{review.listing.title || "View Listing"}</Link>
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
              {/* TODO: Add pagination for reviews if many */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfilePage;