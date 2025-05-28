// controllers/listingController.js
import Listing from '../models/Listing.js';
import User from '../models/User.js'; // For fetching user coordinates if needed
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import cloudinary from '../config/cloudinary.js';
import APIFeatures from '../utils/apiFeatures.js';

// Get all listings (basic version)
export const getAllListings = catchAsync(async (req, res, next) => {
  // To allow for nested GET reviews on tour (hack)
  // let filter = {};
  // if (req.params.tourId) filter = { tour: req.params.tourId };
  // For now, only active listings by default unless status is specified in query
  const defaultFilters = { status: 'active' };

  // Execute the query building using APIFeatures
  const features = new APIFeatures(Listing.find(defaultFilters), req.query)
    .filter()       // Apply basic and advanced filtering (e.g., ?category=Technology&price[lt]=500)
    .search()       // Apply text search (e.g., ?search=keyword)
    .geospatial()   // Apply geospatial filtering (e.g., ?latlng=lat,lng&distance=km)
    .sort()         // Apply sorting (e.g., ?sort=-createdAt,title)
    .limitFields()  // Apply field limiting (e.g., ?fields=title,description,user)
    .paginate();    // Apply pagination (e.g., ?page=2&limit=10)

  // const doc = await features.query.explain(); // To see query plan for optimization
  const listings = await features.query;

  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: listings.length, // Number of results on the current page
    // totalResults: await Listing.countDocuments(features.query.getFilter()), // TODO: Get total count for pagination metadata
    data: {
      listings,
    },
  });
});

// Get a single listing by ID
export const getListingById = catchAsync(async (req, res, next) => {
  const listing = await Listing.findById(req.params.listingId);
  // User details are already populated by the pre-find hook in Listing.js

  if (!listing) {
    return next(new AppError('No listing found with that ID.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      listing,
    },
  });
});

// Create a new listing
export const createListing = catchAsync(async (req, res, next) => {
  const {
    listingType,
    title,
    description,
    category,
    tags,
    estimatedEffort,
    exchangePreference,
    location, // User provided string location
    // coordinates can be directly provided or geocoded from 'location'
  } = req.body;

  let { coordinates } = req.body;

  // Basic validation
  if (!listingType || !title || !description || !category) {
      return next(new AppError('Please provide listing type, title, description, and category.', 400));
  }

  const listingData = {
    user: req.user.id, // From 'protect' middleware
    listingType,
    title,
    description,
    category,
    tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim())) : [],
    estimatedEffort,
    exchangePreference,
    location,
  };

  // Handle coordinates:
  // Option 1: User provides coordinates directly (e.g., [longitude, latitude])
  if (coordinates && Array.isArray(coordinates) && coordinates.length === 2) {
    listingData.coordinates = { type: 'Point', coordinates: [parseFloat(coordinates[0]), parseFloat(coordinates[1])] };
  }
  // Option 2: User provides GeoJSON object for coordinates
  else if (coordinates && coordinates.type === 'Point' && Array.isArray(coordinates.coordinates)) {
    listingData.coordinates = { type: 'Point', coordinates: [parseFloat(coordinates.coordinates[0]), parseFloat(coordinates.coordinates[1])] };
  }
  // Option 3: Default to user's coordinates if listing location/coordinates not provided
  else if (!listingData.coordinates && req.user.coordinates && req.user.coordinates.coordinates) {
      listingData.coordinates = req.user.coordinates;
      if(!listingData.location && req.user.location) listingData.location = req.user.location; // Also default location string
  }
  // Option 4: TODO: Geocode 'location' string if coordinates are not provided (using geolocationService)


  // Handle photo uploads
  if (req.files && req.files.length > 0) {
    listingData.photos = req.files.map((file) => ({
      url: file.path, // URL from Cloudinary
      public_id: file.filename, // public_id from Cloudinary
    }));
  } else {
    listingData.photos = []; // Ensure photos array exists
  }

  const newListing = await Listing.create(listingData);

  res.status(201).json({
    status: 'success',
    data: {
      listing: newListing,
    },
  });
});

// Update an existing listing
export const updateListing = catchAsync(async (req, res, next) => {
  const listing = await Listing.findById(req.params.listingId);

  if (!listing) {
    return next(new AppError('No listing found with that ID.', 404));
  }

  // Check if the logged-in user is the owner of the listing
  if (listing.user._id.toString() !== req.user.id) { // user is populated, so access its _id
    return next(new AppError('You do not have permission to perform this action.', 403));
  }

  // Whitelist allowed fields to update
  const allowedUpdates = [
    'title', 'description', 'category', 'tags', 'estimatedEffort',
    'exchangePreference', 'status', 'location'
  ];
  const updates = {};
  allowedUpdates.forEach(key => {
    if (req.body[key] !== undefined) {
      if (key === 'tags' && req.body.tags) {
        updates.tags = Array.isArray(req.body.tags) ? req.body.tags : req.body.tags.split(',').map(tag => tag.trim());
      } else {
        updates[key] = req.body[key];
      }
    }
  });

  // Handle coordinates update (similar to create)
  if (req.body.coordinates && Array.isArray(req.body.coordinates) && req.body.coordinates.length === 2) {
    updates.coordinates = { type: 'Point', coordinates: [parseFloat(req.body.coordinates[0]), parseFloat(req.body.coordinates[1])] };
  } else if (req.body.coordinates && req.body.coordinates.type === 'Point' && Array.isArray(req.body.coordinates.coordinates)) {
    updates.coordinates = { type: 'Point', coordinates: [parseFloat(req.body.coordinates.coordinates[0]), parseFloat(req.body.coordinates.coordinates[1])] };
  }


  // Handle photo updates
  // 1. Add new photos if any are uploaded
  if (req.files && req.files.length > 0) {
    const newPhotos = req.files.map(file => ({ url: file.path, public_id: file.filename }));
    updates.$push = { photos: { $each: newPhotos } }; // Add to existing photos array
  }

  // 2. Remove photos marked for deletion
  if (req.body.deletePhotos && Array.isArray(req.body.deletePhotos) && req.body.deletePhotos.length > 0) {
    const publicIdsToDelete = req.body.deletePhotos;
    // Remove from Cloudinary
    if (publicIdsToDelete.length > 0) {
      // Use cloudinary.api.delete_resources for batch deletion
      await cloudinary.api.delete_resources(publicIdsToDelete, (error, result) => {
          if (error) console.error('Cloudinary deletion error:', error);
          // console.log('Cloudinary deletion result:', result);
      });
    }
    // Remove from listing's photos array in DB
    // This will be handled by findByIdAndUpdate if 'photos' field is directly set,
    // or needs $pull if modifying array. For simplicity, one might resubmit the entire photos array.
    // Let's reconstruct the photos array for update.
    if (!updates.photos) updates.photos = listing.photos; // start with existing
    updates.photos = updates.photos.filter(photo => !publicIdsToDelete.includes(photo.public_id));
    // If you used $push above, this logic needs to be coordinated.
    // A simpler way for photo update: client sends the *full desired array* of existing photo public_ids (to keep)
    // and uploads new ones. Then server calculates deletions and additions.
    // For now: new photos are added, and specific photos are pulled.
    // $pull might be better here if combined with $push
    // For current structure: let's assume client sends the full new array of photos to keep,
    // or specific IDs to delete.
    // We'll use $pull for deletions.
    if (!updates.$pull) updates.$pull = {};
    updates.$pull.photos = { public_id: { $in: publicIdsToDelete } };
  }


  const updatedListing = await Listing.findByIdAndUpdate(req.params.listingId, updates, {
    new: true,
    runValidators: true,
  });
  
  if(!updatedListing){
      return next(new AppError('Failed to update the listing.', 500));
  }

  res.status(200).json({
    status: 'success',
    data: {
      listing: updatedListing,
    },
  });
});

// Delete a listing
export const deleteListing = catchAsync(async (req, res, next) => {
  const listing = await Listing.findById(req.params.listingId);

  if (!listing) {
    return next(new AppError('No listing found with that ID.', 404));
  }

  if (listing.user._id.toString() !== req.user.id) {
    return next(new AppError('You do not have permission to perform this action.', 403));
  }

  // Delete photos from Cloudinary
  if (listing.photos && listing.photos.length > 0) {
    const publicIdsToDelete = listing.photos.map(photo => photo.public_id);
    if (publicIdsToDelete.length > 0) {
        try {
            // Batch deletion
            await cloudinary.api.delete_resources(publicIdsToDelete);
        } catch (err) {
            console.error("Error deleting photos from Cloudinary:", err);
            // Decide if you want to proceed with DB deletion or halt
        }
    }
  }

  // Delete the listing from DB
  await Listing.findByIdAndDelete(req.params.listingId);

  res.status(204).json({ // 204 No Content
    status: 'success',
    data: null,
  });
});


