const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const connectDB = require('./config/db');
const { errorMiddleware } = require('./middleware/errorMiddleware');

dotenv.config();
connectDB();

const app = express();


app.use(cookieParser());
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true, // Allow cookies to be sent with requests
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(helmet()); // Security middleware to set various HTTP headers
app.use(passport.initialize()); // Initialize Passport.js for authentication


// Import routes
const resumeRoutes = require("./routes/resumeRoutes");



// use the routes
app.use("/api/resumes", resumeRoutes);


// Error handling middleware
app.use(errorMiddleware);

// Export app
module.exports = app;