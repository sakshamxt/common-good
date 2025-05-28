// server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import connectDB from './config/db.js';
import AppError from './utils/appError.js';
import globalErrorHandler from './middleware/errorMiddleware.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';

// Load env vars
dotenv.config();


// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


const API_PREFIX = '/api/v1';
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
// TODO: app.use(`${API_PREFIX}/listings`, listingRoutes);
// etc.


// Basic Root Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the CommonGood API!',
    data: {
      version: '1.0.0',
      docs: '/api-docs' // Placeholder for future API documentation link
    }
  });
});



// Handle 404 Not Found for API routes
// This should be placed after all your specific API routes are defined
// and before the global error handler.
app.all('/api/*', (req, res, next) => {
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