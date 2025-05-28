// middleware/errorMiddleware.js
import AppError from '../utils/appError.js'; // Added .js extension

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  // Updated regex to handle potential variations in MongoDB error messages
  const match = err.message.match(/index: (.+?) dup key: { (.+?): "(.+?)" }/);
  let value = "Unknown value";
  if (match && match[3]) {
    value = match[3];
  } else if (err.keyValue) { // Fallback for other duplicate key error formats
      const key = Object.keys(err.keyValue)[0];
      value = `${key}: ${err.keyValue[key]}`;
  }
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};


const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () => new AppError('Invalid token. Please log in again!', 401);
const handleJWTExpiredError = () => new AppError('Your token has expired! Please log in again.', 401);

const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  console.error('ERROR 💥 (Non-API DEV):', err);
  return res.status(err.statusCode).json({ // Keep JSON response for consistency
    status: err.status,
    message: 'Something went very wrong on the server (dev mode)!',
    detailedError: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    console.error('ERROR 💥 (API PROD):', err);
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }

  // For non-API requests in production
  if (err.isOperational) {
     return res.status(err.statusCode).json({ // Keep JSON response for consistency
        status: err.status,
        message: err.message,
      });
  }
  console.error('ERROR 💥 (Non-API PROD):', err);
  return res.status(500).json({
    status: 'error',
    message: 'Something went very wrong on the server!',
  });
};

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    // Create a copy of the error object. Note: spread operator on error objects might not copy all properties like 'name'.
    // It's safer to copy specific properties or use a library if deep cloning is needed.
    // For our common cases (CastError, etc.), direct property access is often fine.
    let error = { ...err, message: err.message, name: err.name, code: err.code, path: err.path, value: err.value, errmsg: err.errmsg, keyValue: err.keyValue };


    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error); // MongoDB duplicate key error
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};

export default globalErrorHandler;