const socketHandler = (io) => {
  const connectedUsers = new Map();

  io.on("connection", (socket) => {
    console.log(`A user connected: ${socket.id}`);

    // Save the user's socket ID
    socket.on('registerUser', (userId) => {
      console.log(`User registered: ${userId} with socket ID: ${socket.id}`);
      connectedUsers[userId] = socket.id; // Store the socket ID by user ID
  });

    // Handle incoming messages (detect if binary or string)
    socket.on("message", (message) => {
      try {
        let parsedMessage;

        // Check if the message is binary (Buffer)
        if (Buffer.isBuffer(message)) {
          // Decode Buffer to string
          const messageStr = message.toString('utf8');
          parsedMessage = JSON.parse(messageStr);
        } else {
          // If it's a string, directly parse it
          parsedMessage = JSON.parse(message);
        }

        console.log('Decoded message:', parsedMessage);
        // Handle the parsed message
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    // Send message to a specific user
    socket.on("sendMessage", ({ senderId, receiverId, content }) => {
      const receiverSocketId = connectedUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receiveMessage", { senderId, content });
        console.log(`Message sent from ${senderId} to ${receiverId}: ${content}`);
      } else {
        console.log(`User ${receiverId} is not connected.`);
      }
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      connectedUsers.forEach((value, key) => {
        if (value === socket.id) {
          connectedUsers.delete(key);
          console.log(`User disconnected: ${key}`);
        }
      });
    });
  });
};

module.exports = socketHandler;
