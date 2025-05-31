// src/components/common/StarRating.jsx
import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

// For Display
export const DisplayStars = ({ rating, totalStars = 5, size = "h-5 w-5", className }) => {
  const fullStars = Math.floor(rating);
  // Simple half star: if decimal is .5 or more, show full, else empty for that star.
  // More complex half-star rendering would require a half-star icon.
  // For simplicity, we'll round to nearest half and show full or empty.
  const effectiveRating = Math.round(rating * 2) / 2; 

  return (
    <div className={cn("flex items-center", className)}>
      {[...Array(totalStars)].map((_, i) => {
        const starValue = i + 1;
        let fillClass = "text-slate-300 dark:text-slate-600"; // Empty star
        if (starValue <= effectiveRating) {
          fillClass = "text-yellow-400 fill-yellow-400"; // Full star
        } else if (starValue - 0.5 === effectiveRating) {
          fillClass = "text-yellow-400 fill-yellow-200"; // Half star (visual approximation)
        }
        return <Star key={i} className={cn(size, fillClass)} />;
      })}
    </div>
  );
};


// For Input
export const StarRatingInput = ({ rating, setRating, totalStars = 5, size = "h-6 w-6", className, disabled = false }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (value) => {
    if (disabled) return;
    setRating(value);
  };

  const handleMouseEnter = (value) => {
    if (disabled) return;
    setHoverRating(value);
  };

  const handleMouseLeave = () => {
    if (disabled) return;
    setHoverRating(0);
  };

  return (
    <div className={cn("flex items-center space-x-1", className, disabled && "cursor-not-allowed opacity-70")}>
      {[...Array(totalStars)].map((_, i) => {
        const starValue = i + 1;
        const currentRatingToConsider = hoverRating || rating;
        return (
          <Star
            key={i}
            className={cn(
              size,
              starValue <= currentRatingToConsider ? "text-yellow-400 fill-yellow-400" : "text-slate-300 dark:text-slate-600",
              !disabled && "cursor-pointer transition-transform hover:scale-110"
            )}
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            onMouseLeave={handleMouseLeave}
          />
        );
      })}
    </div>
  );
};