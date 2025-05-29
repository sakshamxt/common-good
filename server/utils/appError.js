// utils/appError.js
class AppError extends Error {
  constructor(message, statusCode, details = undefined) { // Added details parameter
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    if (details) { // If details are provided, add them to the error object
        this.details = details;
    }

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;