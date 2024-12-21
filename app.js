require("dotenv").config();
const express = require("express");
const logger = require("morgan");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const authRoute = require("./routes/userRoute");

// Initialize express
const app = express();
const port = process.env.PORT || 3000;

// Database connection
require("./config/db");

// Passport config
require("./services/passport");

// Middleware
app.use(logger("dev"));

// CORS configuration - modify this for security
app.use(cors({
    origin: "http://localhost:8081", // Replace with your frontend URL
    methods: "GET,POST,PUT,DELETE",
    credentials: true // This is important for cookies/sessions
}));

// Session configuration
app.use(session({
    secret: "Victoria", // Better to use environment variable
    resave: false,
    saveUninitialized: false,
  
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Body parsing middleware - remove duplicate
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/user", authRoute);

// Start server
app.listen(port, () => {
    console.log(`server running on ${port}`);
});