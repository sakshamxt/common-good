import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Listing must belong to a user.'],
    },
    listingType: {
      type: String,
      required: [true, 'Please specify the listing type.'],
      enum: {
        values: ['OfferSkill', 'RequestSkill', 'OfferItem', 'RequestItem'],
        message: 'Listing type must be one of: OfferSkill, RequestSkill, OfferItem, RequestItem.',
      },
    },
    title: {
      type: String,
      required: [true, 'Please provide a title for your listing.'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters.'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a description.'],
      trim: true,
      maxlength: [1000, 'Description cannot be more than 1000 characters.'],
    },
    category: {
      // Example categories, you might want a more structured system or allow user-defined.
      type: String,
      required: [true, 'Please specify a category.'],
      trim: true,
      // enum: ['Technology', 'Education', 'Home & Garden', 'Arts & Crafts', 'Services', 'Other'] // Consider pre-defined categories
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    photos: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true }, // Cloudinary public_id for deletion
      },
    ],
    estimatedEffort: { // e.g., "1 hour", "2 days", "Small task"
      type: String,
      trim: true,
    },
    exchangePreference: { // e.g., "Skill for Skill", "Item for Skill", "Open to offers"
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'pending_exchange', 'completed', 'cancelled', 'expired'],
      default: 'active',
    },
    location: { // User-friendly location string for the listing itself
      type: String,
      trim: true,
    },
    coordinates: { // For geospatial queries specific to the listing
      type: {
        type: String,
        enum: ['Point'],
        // required: true // Only if location is always mandatory & geocoded for listing
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        // required: true
      },
    },
    // You might add fields like `views`, `interestCount` later
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for geospatial queries on listing coordinates
listingSchema.index({ coordinates: '2dsphere' });

// Index for searching by title and description (text index)
listingSchema.index({ title: 'text', description: 'text', tags: 'text', category: 'text', location: 'text' }); // For text search later

// Populate user details when a listing is fetched
listingSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name profilePictureUrl location', // Select only necessary user fields
  });
  next();
});


const Listing = mongoose.model('Listing', listingSchema);

export default Listing;