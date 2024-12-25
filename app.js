require("dotenv").config();
const express = require("express");
const logger = require("morgan");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const authRoute = require("./routes/userRoute");


const http = require('http');
const socketIo = require('socket.io');
const chatRoute = require('./chats/chatRoute');
const Message = require('./chats/chatModel');
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

app.get("/test", (req, res) => {
  res.status(200).json({ msg: "test" })
});

// Body parsing middleware - remove duplicate
const server = http.createServer(app);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:8081"],
    methods: ["GET", "POST"],
    credentials: true 
  }
});
// Routes
app.use("/api/user", authRoute);
app.use('/api/chats', chatRoute);

// Start server
app.listen(port, () => {
    console.log(`server running on ${port}`);
});