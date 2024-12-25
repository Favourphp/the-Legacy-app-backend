module.exports = (io) => {
    io.on('connection', (socket) => {
      const userId = socket.handshake.query.userId;
  
      if (userId) {
        // Join the user's room
        socket.join(userId);
        console.log(`User ${userId} connected`);
  
        // Listen for messages
        socket.on('sendMessage', ({ sender, receiver, content }, callback) => {
          if (!sender || !receiver || !content) {
            return callback({ success: false, message: 'Invalid message data' });
          }
  
          // Emit the message to the receiver
          socket.to(receiver).emit('receiveMessage', { sender, content, timestamp: new Date() });
          console.log(`Message sent from ${sender} to ${receiver}: ${content}`);
  
          // Acknowledge the message was sent
          callback({ success: true, message: 'Message sent successfully' });
        });
  
        // Typing indicator
        socket.on('typing', ({ sender, receiver }) => {
          socket.to(receiver).emit('typing', { sender });
        });
  
        socket.on('disconnect', () => {
          console.log(`User ${userId} disconnected`);
        });
      } else {
        console.log('User ID not provided. Connection rejected.');
        socket.disconnect();
      }
    });
  };
  