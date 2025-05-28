import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';

// load environment variables
dotenv.config({ path: './.env' });

// connect to the database
connectDB();

const app = express();

// middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// basic root route
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


// routers

// error handling middleware


const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});


// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(`Uncaught Exception: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});