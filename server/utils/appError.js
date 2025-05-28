class AppError extends Error {
  constructor(message, statusCode) {
    super(message); // Call the parent constructor (Error)

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'; // 'fail' for 4xx, 'error' for 5xx
    this.isOperational = true; // Mark as an operational error (trusted error)

    Error.captureStackTrace(this, this.constructor); // Capture the stack trace
  }
}

export default AppError;