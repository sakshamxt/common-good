// controllers/reviewController.js
import Review from '../models/Review.js';
import Listing from '../models/Listing.js'; // To verify listing and get its owner
import User from '../models/User.js'; // To verify reviewee exists
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import APIFeatures from '../utils/apiFeatures.js';

// Create a new review
export const createReview = catchAsync(async (req, res, next) => {
  const { listingId, revieweeId, rating, comment } = req.body;
  const reviewerId = req.user.id; // Logged-in user is the reviewer

  if (!listingId || !revieweeId || rating === undefined || !comment) {
    return next(new AppError('Missing required fields: listingId, revieweeId, rating, comment.', 400));
  }

  // 1. Check if the listing exists
  const listing = await Listing.findById(listingId).populate('user'); // Populate listing owner
  if (!listing) {
    return next(new AppError('Listing not found.', 404));
  }

  // 2. Check if the reviewee exists
  const reviewee = await User.findById(revieweeId);
  if (!reviewee) {
      return next(new AppError('User being reviewed (reviewee) not found.', 404));
  }

  // 3. Business logic:
  //    - Reviewer cannot review themselves.
  if (reviewerId === revieweeId) {
    return next(new AppError('You cannot review yourself.', 400));
  }
  //    - The review should ideally be about an interaction related to the listing.
  //      A common check: Is the reviewee the owner of the listing and reviewer is someone else,
  //      OR is the reviewer the owner and reviewee is someone who interacted (e.g. made an offer - harder to track without offer model)
  //      For simplicity now, we assume the frontend provides valid reviewer/reviewee/listing context.
  //      A key check is if the listing involves one of them as owner and the other potentially as interactor.
  //      The unique index on (listing, reviewer, reviewee) prevents exact duplicates.

  //    - Simple check: Ensure reviewee is the listing owner if reviewer is not. Or vice-versa.
  //      This logic depends heavily on your platform's transaction flow.
  //      Let's assume for now the client ensures the review context is valid.
  //      A basic sanity check could be if the reviewee is the listing owner.
  // if (listing.user._id.toString() !== revieweeId) {
  //     return next(new AppError('The reviewee is not the owner of this listing.', 400));
  // }


  // Check for existing review (already handled by unique index, but an explicit check can give a clearer error)
  const existingReview = await Review.findOne({ listing: listingId, reviewer: reviewerId, reviewee: revieweeId });
  if (existingReview) {
      return next(new AppError('You have already reviewed this user for this listing.', 400));
  }

  const newReview = await Review.create({
    listing: listingId,
    reviewer: reviewerId,
    reviewee: revieweeId,
    rating,
    comment,
  });

  // The post-save hook on Review model will automatically update averageRating on User model.

  res.status(201).json({
    status: 'success',
    data: {
      review: newReview,
    },
  });
});

// Get all reviews for a specific user (reviews they received)
export const getReviewsForUser = catchAsync(async (req, res, next) => {
  const { userId } = req.params; // This is the reviewee's ID

  const features = new APIFeatures(Review.find({ reviewee: userId }), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const reviews = await features.query;
  // Reviewer is populated by pre-find hook in Review model

  const revieweeUser = await User.findById(userId).select('name averageRating numReviews'); // Get reviewee's basic info

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviewee: revieweeUser,
      reviews,
    },
  });
});

// Get all reviews for a specific listing
export const getReviewsForListing = catchAsync(async (req, res, next) => {
  const { listingId } = req.params;

  const features = new APIFeatures(Review.find({ listing: listingId }), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  
  const reviews = await features.query;
  // Reviewer is populated by pre-find hook

  const listing = await Listing.findById(listingId).select('title user'); // Get listing's basic info

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      listing,
      reviews,
    },
  });
});