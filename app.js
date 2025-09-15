const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const session = require('express-session');
const connectDB = require('./config/db');
const { errorMiddleware } = require('./middleware/errorMiddleware');
const { configurePassport } = require('./config/passport');
const { querySanitizeMiddleware } = require('./middleware/querySanitizeMiddleware');
const authRoutes = require('./routes/authRoute');
const jobsRoutes = require('./routes/jobRoute');
const waitListRoutes = require('./routes/waitListRoutes');

dotenv.config();
connectDB();

const app = express();

// Configure Passport.js for authentication
configurePassport();


app.use(cookieParser());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:8080',
    credentials: true, // Allow cookies to be sent with requests
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.text({ type: 'text/html' })); // For HTML templates
app.use(helmet()); // Security middleware to set various HTTP headers
app.use(querySanitizeMiddleware); // Middleware to sanitize query parameters
app.use(session({
    secret: process.env.SESSION_SECRET || 'defaultsecret',
    resave: false,
    saveUninitialized: true,
}));
app.use(passport.initialize()); // Initialize Passport.js for authentication


// Import routes
const resumeRoutes = require("./routes/resumeRoutes");



// use the routes
app.use("/api/resumes", resumeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/waitlist', waitListRoutes);


// Error handling middleware
app.use(errorMiddleware);

// Export app
module.exports = app;