// src/components/common/ListingCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Tag, Clock } from 'lucide-react'; // Icons

const ListingCard = ({ listing }) => {
  if (!listing) return null;

  const getAvatarFallback = (name) => {
    if (!name) return "U";
    const parts = name.split(" ");
    return parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : name.substring(0, 2).toUpperCase();
  };

  // Determine badge variant based on listing type
  let typeVariant = "secondary";
  let typeText = listing.listingType || "Unknown Type";
  if (listing.listingType?.toLowerCase().includes("offer")) {
    typeVariant = "default"; // Or a specific color for offers
  } else if (listing.listingType?.toLowerCase().includes("request")) {
    typeVariant = "outline"; // Or a specific color for requests
  }
  
  // Truncate description
  const truncateDescription = (text, length = 100) => {
    if (!text) return "";
    return text.length > length ? text.substring(0, length) + "..." : text;
  };

  return (
    <Card className="w-full overflow-hidden flex flex-col h-full transition-shadow hover:shadow-lg">
      <Link to={`/listings/${listing._id}`} className="block">
        {listing.photos && listing.photos.length > 0 ? (
          <img
            src={listing.photos[0].url}
            alt={listing.title}
            className="w-full h-48 object-cover" // Fixed height for consistent card size
          />
        ) : (
          <div className="w-full h-48 bg-slate-200 flex items-center justify-center text-slate-500">
            No Image
          </div>
        )}
      </Link>
      
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between mb-1">
          <Badge variant={typeVariant} className="text-xs">
            {typeText.replace(/([A-Z])/g, ' $1').trim()} {/* Add space before caps */}
          </Badge>
          {/* Placeholder for distance or other info if needed */}
        </div>
        <Link to={`/listings/${listing._id}`}>
          <CardTitle className="text-lg font-semibold hover:text-primary transition-colors line-clamp-2">
            {listing.title}
          </CardTitle>
        </Link>
      </CardHeader>

      <CardContent className="flex-grow pb-3">
        <p className="text-sm text-slate-600 mb-2 line-clamp-3">
          {truncateDescription(listing.description, 90)}
        </p>
        {listing.category && (
          <div className="flex items-center text-xs text-slate-500 mb-1">
            <Tag className="h-3 w-3 mr-1.5" />
            {listing.category}
          </div>
        )}
        {listing.location && (
          <div className="flex items-center text-xs text-slate-500">
            <MapPin className="h-3 w-3 mr-1.5" />
            {listing.location}
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t pt-3 pb-3 flex items-center justify-between text-xs text-slate-500">
        <Link to={`/profile/${listing.user?._id}`} className="flex items-center hover:underline">
          <Avatar className="h-6 w-6 mr-2">
            <AvatarImage src={listing.user?.profilePictureUrl || undefined} alt={listing.user?.name} />
            <AvatarFallback>{getAvatarFallback(listing.user?.name)}</AvatarFallback>
          </Avatar>
          <span className="truncate">{listing.user?.name || 'Unknown User'}</span>
        </Link>
        {listing.estimatedEffort && (
            <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                <span>{listing.estimatedEffort}</span>
            </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default ListingCard;