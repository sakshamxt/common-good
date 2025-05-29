import mongoose from 'mongoose';
// Forward declaration to avoid circular dependency issues if User model needs to be updated by Review statics
// import User from './User.js'; // We'll import User directly in static method for now

const reviewSchema = new mongoose.Schema(
  {
    listing: {
      type: mongoose.Schema.ObjectId,
      ref: 'Listing',
      required: [true, 'Review must belong to a listing.'],
    },
    reviewer: {
      // The user who wrote the review
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must have a reviewer.'],
    },
    reviewee: {
      // The user who is being reviewed
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must have a reviewee (the user being reviewed).'],
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1.'],
      max: [5, 'Rating must be at most 5.'],
      required: [true, 'Please provide a rating.'],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Comment cannot be more than 1000 characters.'],
      required: [true, 'Please provide a comment for your review.'],
    },
    // exchangeCompleted: { // Optional: A flag to ensure review is for a completed exchange
    //   type: Boolean,
    //   default: false // This would need to be set based on some application logic
    // }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only createdAt for reviews
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Prevent duplicate reviews: a user should review another user for a specific listing only once.
reviewSchema.index({ listing: 1, reviewer: 1, reviewee: 1 }, { unique: true });

// Populate reviewer and reviewee details
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'reviewer',
    select: 'name profilePictureUrl',
  });
  // Optionally populate reviewee if not just an ID, but often reviewee is clear from context (e.g. "reviews for user X")
  // this.populate({
  //   path: 'reviewee',
  //   select: 'name profilePictureUrl'
  // });
  next();
});


// Static method to calculate average ratings for a user (reviewee)
reviewSchema.statics.calculateAverageRatings = async function(revieweeId) {
  // Dynamically import User model here to avoid circular dependencies at module load time
  // This is a common pattern when a model's static method needs to update another model.
  const User = mongoose.model('User'); // Or import User from './User.js'; if no circular issues with your setup

  const stats = await this.aggregate([
    {
      $match: { reviewee: revieweeId } // Match reviews for the specific reviewee
    },
    {
      $group: {
        _id: '$reviewee',
        numReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' }
      }
    }
  ]);

  // console.log('Rating Stats:', stats); // For debugging

  if (stats.length > 0) {
    await User.findByIdAndUpdate(revieweeId, {
      averageRating: stats[0].averageRating.toFixed(1), // Round to one decimal place
      numReviews: stats[0].numReviews
    });
  } else {
    // No reviews, set to default values
    await User.findByIdAndUpdate(revieweeId, {
      averageRating: 0, // Or a suitable default like null or undefined
      numReviews: 0
    });
  }
};

// Post-save hook to recalculate ratings when a new review is saved
reviewSchema.post('save', async function () {
  // 'this' points to the current review document
  // this.constructor points to the model
  await this.constructor.calculateAverageRatings(this.reviewee);
});

// Post-remove hook to recalculate ratings when a review is deleted
// findByIdAndUpdate and findByIdAndDelete do not trigger 'remove' middleware by default.
// So, if you implement review deletion and want ratings to update,
// you might need to call calculateAverageRatings manually after deletion
// or use a pre/post hook on findOneAndDelete.
reviewSchema.post(/^findOneAnd/, async function(doc, next) {
    // This hook runs after findOneAndUpdate or findOneAndDelete
    // 'doc' is the document that was processed (e.g., the deleted/updated review)
    // Important: For findOneAndDelete, 'doc' will be the document *before* it was deleted.
    // For findOneAndUpdate, 'doc' is the document *before* update by default (unless {new: true} AND passRawResult: true or similar).
    // A more reliable way if 'doc' is the review:
    if (doc) { // If a document was found and processed
        await doc.constructor.calculateAverageRatings(doc.reviewee);
    }
    if (next) next();
});


const Review = mongoose.model('Review', reviewSchema);

export default Review;