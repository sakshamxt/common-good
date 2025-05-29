// middleware/errorMiddleware.js
import AppError from '../utils/appError.js'; // Ensure AppError is imported

// Define or import these helper functions if they are separate and used
const handleCastErrorDB = (err) => new AppError(`Invalid ${err.path}: ${err.value}.`, 400);
const handleDuplicateFieldsDB = (err) => { /* ... (implementation from previous sections) ... */ 
    const value = err.errmsg?.match(/(["'])(\\?.)*?\1/)?.[0] || JSON.stringify(err.keyValue) || "provided value";
    return new AppError(`Duplicate field value: ${value}. Please use another value!`, 400);
};
const handleValidationErrorDB = (err) => {
    const errors = Object.values(err.errors).map(el => el.message);
    return new AppError(`Invalid input data. ${errors.join('. ')}`, 400);
};
const handleJWTError = () => new AppError('Invalid token. Please log in again!', 401);
const handleJWTExpiredError = () => new AppError('Your token has expired! Please log in again.', 401);


const globalErrorHandler = (errParam, req, res, next) => {
  console.log('--- GLOBAL ERROR HANDLER REACHED ---');
  // Log the raw incoming error parameter. Be cautious in production with sensitive data.
  if (typeof errParam === 'string' || typeof errParam === 'number' || typeof errParam === 'boolean') {
    console.error('RAW ERROR (Primitive) in global handler:', errParam);
  } else {
    console.error('RAW ERROR (Object) in global handler:', JSON.stringify(errParam, Object.getOwnPropertyNames(errParam)));
  }


  let errorObject;

  if (errParam instanceof AppError) {
    errorObject = errParam;
  } else if (errParam instanceof Error) {
    // For generic Error objects, wrap them in AppError or handle them
    errorObject = new AppError(errParam.message || 'An unexpected error occurred', 500);
    errorObject.stack = errParam.stack; // Preserve stack
    errorObject.name = errParam.name;   // Preserve name
    // Copy common error properties if they exist
    if (errParam.code) errorObject.code = errParam.code;
    if (errParam.path) errorObject.path = errParam.path;
    if (errParam.value) errorObject.value = errParam.value;
    if (errParam.keyValue) errorObject.keyValue = errParam.keyValue; // For MongoDB duplicate errors not caught earlier
    if (errParam.details) errorObject.details = errParam.details; // For validation errors passed as generic Error
  } else {
    // If errParam is a string or some other primitive (like 'Must supply api_key')
    const message = typeof errParam === 'string' ? errParam : 'An unknown error occurred because a non-Error was thrown.';
    errorObject = new AppError(message, 500);
    if (process.env.NODE_ENV === 'development') {
      // Store the original primitive error for debugging in dev mode
      errorObject.originalErrorValue = errParam;
    }
  }

  // Now errorObject is guaranteed to be an instance of AppError or similar structure
  // Ensure default properties are set if not already (AppError constructor should handle this)
  errorObject.statusCode = errorObject.statusCode || 500;
  errorObject.status = errorObject.status || (String(errorObject.statusCode).startsWith('4') ? 'fail' : 'error');

  // Handle specific known error types by potentially re-assigning errorObject
  if (errorObject.name === 'CastError') errorObject = handleCastErrorDB(errorObject);
  if (errorObject.code === 11000) errorObject = handleDuplicateFieldsDB(errorObject); // Mongoose duplicate key
  if (errorObject.name === 'ValidationError') errorObject = handleValidationErrorDB(errorObject);
  if (errorObject.name === 'JsonWebTokenError') errorObject = handleJWTError();
  if (errorObject.name === 'TokenExpiredError') errorObject = handleJWTExpiredError();
  
  // Specifically identify Cloudinary configuration string errors if they weren't already an AppError
  if (typeof errParam === 'string' && (errParam.toLowerCase().includes('api_key') || errParam.toLowerCase().includes('cloud_name') || errParam.toLowerCase().includes('api_secret'))) {
      // This might overwrite a more generic errorObject if errParam was a string.
      // Ensure this new AppError gets all necessary properties or that subsequent logic handles it.
      errorObject = new AppError(`Cloudinary configuration error: "${errParam}". Please check server environment variables.`, 500);
  }


  // --- Send response based on environment ---
  if (process.env.NODE_ENV === 'development') {
    const devResponse = {
      status: errorObject.status,
      message: errorObject.message,
      error: errParam, // Send original errParam for debugging context
      stack: errorObject.stack,
    };
    if (errorObject.details) devResponse.details = errorObject.details;
    if (errorObject.originalErrorValue) devResponse.originalErrorValue = errorObject.originalErrorValue;

    console.error('DEV Error Response Sent:', devResponse);
    return res.status(errorObject.statusCode).json(devResponse);
  }
  
  // Production error handling
  if (errorObject.isOperational) { // AppError instances are operational
    return res.status(errorObject.statusCode).json({
      status: errorObject.status,
      message: errorObject.message,
      details: errorObject.details, // Only if details exist and are safe for prod
    });
  }
  
  // Non-operational errors (programming or unknown errors) in production:
  // 1) Log error to console (already done with RAW ERROR log)
  console.error('PRODUCTION: Non-operational error occurred:', errParam); // Log original error
  // 2) Send generic message
  return res.status(500).json({
    status: 'error',
    message: 'Something went very wrong on our end!',
  });
};

// Ensure this is the default export if you are using ES Modules
export default globalErrorHandler;