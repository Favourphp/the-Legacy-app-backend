require("dotenv").config();
const express = require("express");
const logger = require("morgan");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");
const { PubSub } = require("@google-cloud/pubsub");
const http = require("http");
const WebSocket = require("ws");

const authRoute = require("./routes/userRoute");
const chatRoute = require("./chats/chatRoute");
const notificationRoute = require("./notifications/notificationRoute");
const businessRoute = require("./routes/businessRoute");
const Notification = require("./notifications/notificationModel");

// Initialize express
const app = express();
const port = process.env.PORT || 3000;

// Database connection
require("./config/db");

// Passport configuration
require("./services/passport");

// Middleware
app.use(logger("dev"));
app.use(
  cors({
    origin: "http://localhost:8081", // Update with actual frontend URL
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "Victoria", // Use environment variable for security
    resave: false,
    saveUninitialized: false,
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/user", authRoute);
app.use("/api/chats", chatRoute);
app.use("/api/businesses", businessRoute);
app.use("/api/notification", notificationRoute);

// Initialize Pub/Sub client
const pubSubClient = new PubSub({
  projectId: "the-legacy-app-445407", // Update with your project ID
  keyFilename: "./the-legacy-app-445407-fe4637a716cc.json", // Path to your service account key file
});

const connectedUsers = new Map(); // Map to store connected users by userId

// WebSocket Server setup
const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

wss.on("connection", (ws) => {
  console.log(`A user connected: ${ws._socket.remoteAddress}`);

  ws.on("message", async (message) => {
    try {
      const parsedMessage = JSON.parse(message);

      if (parsedMessage.type === "registerUser") {
        const { userId } = parsedMessage;
        connectedUsers.set(userId, ws);
        console.log(`User registered: ${userId}`);
      }

      if (parsedMessage.type === "sendMessage") {
        const { senderId, receiverId, content } = parsedMessage;

        // Save the message to the database
        const newNotification = new Notification({
          sender: senderId,
          receiver: receiverId,
          content,
          timestamp: new Date(),
          read: false,
        });
        await newNotification.save();

        const receiverSocket = connectedUsers.get(receiverId);
        if (receiverSocket) {
          receiverSocket.send(
            JSON.stringify({
              type: "receiveMessage",
              senderId,
              content,
            })
          );
        } else {
          console.log(`User ${receiverId} is offline. Publishing to Pub/Sub...`);
          await publishNotification("notifications-topic", {
            receiverId,
            content,
          });
        }
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  ws.on("close", () => {
    connectedUsers.forEach((value, key) => {
      if (value === ws) {
        connectedUsers.delete(key);
        console.log(`User disconnected: ${key}`);
      }
    });
  });
});

// Publishing a message to Pub/Sub
async function publishNotification(topicName, message) {
  const dataBuffer = Buffer.from(JSON.stringify(message));
  try {
    const messageId = await pubSubClient.topic(topicName).publishMessage({ data: dataBuffer });
    console.log(`Message ${messageId} published to topic ${topicName}.`);
  } catch (error) {
    console.error("Error publishing message:", error);
  }
}

// Pub/Sub listener
async function listenForNotifications(subscriptionName) {
  const subscription = pubSubClient.subscription(subscriptionName);

  subscription.on("message", async (message) => {
    try {
      const data = JSON.parse(message.data);
      const { receiverId, content } = data;

      console.log(`Processing notification for ${receiverId}: ${content}`);

      const newNotification = new Notification({
        receiver: receiverId,
        content,
        timestamp: new Date(),
        read: false,
      });
      await newNotification.save();

      const wsClient = connectedUsers.get(receiverId);
      if (wsClient) {
        wsClient.send(
          JSON.stringify({ type: "receiveMessage", content })
        );
      }

      message.ack();
    } catch (error) {
      console.error("Error processing notification:", error);
    }
  });

  subscription.on("error", (error) => {
    console.error("Error with Pub/Sub subscription:", error);
  });
}

// Start Pub/Sub listener
listenForNotifications("chat-notifications-sub");

// Upgrade HTTP server for WebSocket handling
server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
