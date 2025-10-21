const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const connectDB = require('./config/db');
const { errorMiddleware } = require('./middleware/errorMiddleware');
const { configurePassport } = require('./config/passport');
const { querySanitizeMiddleware } = require('./middleware/querySanitizeMiddleware');
const authRoutes = require('./routes/authRoute');
const jobsRoutes = require('./routes/jobRoute');
const waitListRoutes = require('./routes/waitListRoutes');
const pitchDeckRoutes = require('./routes/pitchDeckRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const tokenTransactionRoutes = require('./routes/tokenTransactionRoutes');

dotenv.config();
connectDB();

const app = express();

// Configure Passport.js for authentication
configurePassport();


app.use(cookieParser());
app.use(cors({
    origin: [process.env.FRONTEND_URL, 'https://gidi-pitch-glow-up.vercel.app', 'https://www.gidipitch.app'],
    credentials: true, // Allow cookies to be sent with requests
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.text({ type: 'text/html' })); // For HTML templates
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
})); // Security middleware to set various HTTP headers
app.use(querySanitizeMiddleware); // Middleware to sanitize query parameters
app.use(passport.initialize()); // Initialize Passport.js for authentication


// Import routes
const resumeRoutes = require("./routes/resumeRoutes");



// use the routes
app.use("/api/resumes", resumeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/waitlist', waitListRoutes);
app.use('/api/pitch/deck', pitchDeckRoutes);
app.use('/api/image', uploadRoutes);
app.use('/api/tokens', tokenTransactionRoutes);


// Error handling middleware
app.use(errorMiddleware);

// Export app
module.exports = app;