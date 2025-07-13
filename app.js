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
const authRoutes = require('./routes/authRoute');

dotenv.config();
connectDB();

const app = express();

// Configure Passport.js for authentication
configurePassport();


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
app.use(session({
    secret: process.env.SESSION_SECRET || 'defaultsecret',
    resave: false,
    saveUninitialized: true,
}));
app.use(passport.initialize()); // Initialize Passport.js for authentication


// Import routes
app.use('/api/auth', authRoutes);


// Error handling middleware
app.use(errorMiddleware);

// Export app
module.exports = app;