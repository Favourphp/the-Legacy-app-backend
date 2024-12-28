require("dotenv").config();
const express = require("express");
const logger = require("morgan");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const http = require("http");
const WebSocket = require("ws");
const authRoute = require("./routes/userRoute");
const chatRoute = require("./chats/chatRoute");
const ChatController = require("./chats/chatController"); // Import ChatController
const chatService = require("./chats/chatService"); // Import chatService

// Initialize express
const app = express();
const port = process.env.PORT || 3000;

// Database connection
require("./config/db");

// Passport configuration
require("./services/passport");

// Middleware
app.use(logger("dev"));
app.use(cors({
    origin: "http://localhost:8081", // Update with actual frontend URL
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
}));

app.use(session({
    secret: process.env.SESSION_SECRET || "Victoria", // Use environment variable for security
    resave: false,
    saveUninitialized: false,
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/user", authRoute);
app.use("/api/chats", chatRoute);

// WebSocket logic
const wss = new WebSocket.Server({ noServer: true });

// Map to store connected users by userId
const connectedUsers = new Map();

wss.on('connection', (ws) => {
    console.log(`A user connected: ${ws._socket.remoteAddress}`);

    ws.on('message', async (message) => {
        try {
            const parsedMessage = JSON.parse(message);
            console.log('Received:', parsedMessage);

            if (parsedMessage.type === "registerUser") {
                const { userId } = parsedMessage;
                connectedUsers.set(userId, ws);
                console.log(`User registered: ${userId}`);
            }

            if (parsedMessage.type === "sendMessage") {
                const { senderId, receiverId, content } = parsedMessage;

                // Save the message to the database via ChatController
                const chatController = new ChatController();
                await chatController.saveMessage({ sender: senderId, receiver: receiverId, content });

                const receiverSocket = connectedUsers.get(receiverId);
                if (receiverSocket) {
                    receiverSocket.send(JSON.stringify({
                        type: "receiveMessage",
                        senderId,
                        content,
                    }));
                    console.log(`Message sent from ${senderId} to ${receiverId}: ${content}`);
                } else {
                    console.log(`User ${receiverId} is not connected.`);
                }
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('close', () => {
        connectedUsers.forEach((value, key) => {
            if (value === ws) {
                connectedUsers.delete(key);
                console.log(`User disconnected: ${key}`);
            }
        });
    });
});

// Server-side WebSocket handling
const server = http.createServer(app);

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

// Start the server
server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
