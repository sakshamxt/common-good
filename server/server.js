// server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import connectDB from './config/db.js';
import AppError from './utils/appError.js';
import globalErrorHandler from './middleware/errorMiddleware.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import listingRoutes from './routes/listingRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';

// Load env vars
dotenv.config();


// Connect to database
connectDB();

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'https://common-good-sable.vercel.app',
];

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) { // If origin is in the list OR it's a server-to-server/no-origin request
      callback(null, true); // Allow
    } else {
      console.error(`CORS ERROR: Origin ${origin} not allowed.`); // Log denied origins
      callback(new Error(`The CORS policy for this site does not allow access from the specified Origin.`)); // <<< THIS IS THE ERROR BEING THROWN (around line 38)
    }
  }
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


app.use('/api/v1/auth', authRoutes);
app.use(`/api/v1/users`, userRoutes);
app.use('/api/v1/listings', listingRoutes);
app.use('/api/v1/conversations', messageRoutes);
app.use('/api/v1/reviews', reviewRoutes);


// Basic Root Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the CommonGood API!',
  });
});



// Handle 404 Not Found for API routes
// This should be placed after all your specific API routes are defined
// and before the global error handler.
app.all('/api/*path', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});


// Global Error Handling Middleware
// This MUST be the last piece of middleware added.
app.use(globalErrorHandler);


const PORT = process.env.PORT || 5000;


const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


process.on('unhandledRejection', (err) => { // Removed 'promise' argument as it's often not used directly here
  console.error(`UNHANDLED REJECTION! 💥 Shutting down...`);
  console.error(`${err.name}: ${err.message}`);
  // console.error(err); // For full stack trace
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (err) => {
  console.error(`UNCAUGHT EXCEPTION! 💥 Shutting down...`);
  console.error(`${err.name}: ${err.message}`);
  // console.error(err); // For full stack trace
  server.close(() => {
    process.exit(1);
  });
});