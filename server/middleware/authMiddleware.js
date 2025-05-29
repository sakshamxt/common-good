// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import { promisify } from 'util'; // To use async/await with jwt.verify
import User from '../models/User.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';

export const protect = catchAsync(async (req, res, next) => {

  
  // 1) Getting token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  // else if (req.cookies.jwt) { // Optional: Check for token in cookies
  //   token = req.cookies.jwt;
  // }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401) // 401 Unauthorized
    );
  }

  // 2) Verification token
  let decoded;
  try {
    // jwt.verify is synchronous by default, but can take a callback.
    // Using promisify to make it work nicely with async/await.
    decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  } catch (err) {
    // Handle different JWT errors specifically if needed (e.g., TokenExpiredError, JsonWebTokenError)
    // The global error handler already has specific handlers for these common JWT errors.
    return next(new AppError('Invalid token. Please log in again.', 401));
  }


  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }

  // 4) Check if user changed password after the token was issued
  // This is an optional but recommended security feature.
  // You'd need a `passwordChangedAt` field in your User model.
  // if (currentUser.changedPasswordAfter(decoded.iat)) {
  //   return next(
  //     new AppError('User recently changed password! Please log in again.', 401)
  //   );
  // }
  // TODO: Implement passwordChangedAt logic later if desired. For now, this step is skipped.

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser; // Attach user to the request object
  res.locals.user = currentUser; // Also make it available in templates if using server-side rendering
  next();
});
