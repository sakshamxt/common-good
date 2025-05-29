// middleware/validationMiddleware.js
import { body, param, validationResult } from 'express-validator';
import AppError from '../utils/appError.js';
import mongoose from 'mongoose'; // To validate ObjectIds

// Helper to check for valid MongoDB ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// --- Validation Rules ---

export const registrationRules = () => [
  body('name').trim().notEmpty().withMessage('Name is required.')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters.'),
  body('email').trim().isEmail().withMessage('Please provide a valid email address.').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long.')
    // .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/) // Example: require lowercase, uppercase, number
    // .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number.'),
];

export const loginRules = () => [
  body('email').trim().isEmail().withMessage('Please provide a valid email address.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
];

export const createListingRules = () => [
  body('title').trim().notEmpty().withMessage('Title is required.')
    .isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters.'),
  body('description').trim().notEmpty().withMessage('Description is required.')
    .isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters.'),
  body('category').trim().notEmpty().withMessage('Category is required.'),
  body('listingType').isIn(['OfferSkill', 'RequestSkill', 'OfferItem', 'RequestItem'])
    .withMessage('Invalid listing type.'),
  body('location').optional({ checkFalsy: true }).trim(), // checkFalsy means empty string also considered optional
  body('tags').optional().isArray().withMessage('Tags must be an array of strings.')
    .custom((tags) => tags.every(tag => typeof tag === 'string' && tag.trim().length > 0))
    .withMessage('All tags must be non-empty strings.'),
  // For coordinates: [longitude, latitude]
  body('coordinates.coordinates').optional().isArray({ min: 2, max: 2 }).withMessage('Coordinates must be an array of two numbers [longitude, latitude].')
    .custom((coords) => coords.every(coord => typeof coord === 'number'))
    .withMessage('Longitude and latitude must be numbers.'),
  body('coordinates.type').optional().isIn(['Point']).withMessage('Coordinates type must be "Point".')
];

export const updateListingRules = () => [
  // Similar to create, but all fields are optional for PATCH
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty if provided.')
    .isLength({ min: 5, max: 100 }).withMessage('Title must be between 5 and 100 characters.'),
  body('description').optional().trim().notEmpty().withMessage('Description cannot be empty if provided.')
    .isLength({ min: 10, max: 1000 }).withMessage('Description must be between 10 and 1000 characters.'),
  body('category').optional().trim().notEmpty().withMessage('Category cannot be empty if provided.'),
  body('listingType').optional().isIn(['OfferSkill', 'RequestSkill', 'OfferItem', 'RequestItem'])
    .withMessage('Invalid listing type.'),
  // Add other fields as needed for update validation (status, location, tags, etc.)
  body('deletePhotos').optional().isArray().withMessage('deletePhotos must be an array of public_ids (strings).')
    .custom((ids) => ids.every(id => typeof id === 'string' && id.trim().length > 0))
    .withMessage('All public_ids in deletePhotos must be non-empty strings.'),
];


export const createReviewRules = () => [
  body('listingId').custom(value => {
    if (!isValidObjectId(value)) throw new Error('Invalid listing ID format.');
    return true;
  }),
  body('revieweeId').custom(value => {
    if (!isValidObjectId(value)) throw new Error('Invalid reviewee ID format.');
    return true;
  }),
  body('rating').isNumeric().withMessage('Rating must be a number.')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5.'),
  body('comment').trim().notEmpty().withMessage('Comment is required.')
    .isLength({ min: 5, max: 1000 }).withMessage('Comment must be between 5 and 1000 characters.'),
];

// General rule for validating MongoDB ObjectIds in params
export const mongoIdParamValidation = (paramName) => 
    param(paramName).custom(value => {
        if (!isValidObjectId(value)) {
            throw new Error(`Invalid ${paramName} format in URL parameter.`);
        }
        return true;
    });


// --- Validation Handler ---
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Format errors for a more user-friendly response
    const formattedErrors = errors.array().map(err => ({
        field: err.path, // err.param for older versions or path for newer
        message: err.msg,
        // value: err.value // Optionally include the invalid value
    }));
    return next(new AppError('Validation Error', 400, formattedErrors)); // Pass formatted errors as part of AppError
  }
  next();
};

// Custom AppError to include validation details
// We might need to adjust AppError or create a specialized ValidationError class
// For now, we modify AppError to potentially accept a `details` field.
// Or, the global error handler can check if err.message === 'Validation Error' and handle err.details.
// Let's modify AppError constructor to accept an optional details array.

// (This modification would be in utils/appError.js)
// class AppError extends Error {
//   constructor(message, statusCode, details = null) { // Added details
//     super(message);
//     this.statusCode = statusCode;
//     this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
//     this.isOperational = true;
//     if (details) this.details = details; // Store details
//     Error.captureStackTrace(this, this.constructor);
//   }
// }
// And globalErrorHandler in middleware/errorMiddleware.js would need to check for err.details
// if (err.details) { payload.details = err.details; }
// For simplicity now, we'll let the AppError message be "Validation Error" and rely on that.
// A more robust solution would be a dedicated ValidationError class or handling in globalErrorHandler.