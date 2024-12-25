const chatService = require('./chatService'); // Adjust path as needed
const UserModel = require("../models/userModel");
const { generateRoomId, determineRoomId } = require('../utils/utils');
const { validateTokenForSocket } = require("../../middlewares/authMiddleware");

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('joinRoom', async ({ token, otherUserId }) => {
     
      try {
        // Authenticate user
        let authResult = await validateTokenForSocket(token);
        if (!authResult.success) {
          socket.emit('authError', authResult.message);
          return;
        }
 
       
        const authUserId = authResult.user.userId; // User initiating the join
        const getOtherUserId = await someLogicToDetermineOtherUserId(otherUserId); // Implement how to fetch the other userId
        
      
        const getAuthUser = await UserModel.findById(authUserId);
        const getOtherUser = await UserModel.findById(getOtherUserId);
        console.log('getOtherUser:', getOtherUserId);
        if(!getAuthUser){
          console.log(`There is no user with Id ${authUserId} found`,);
          return;
        }else if(!getOtherUser){
          console.log(`There is no user with Id ${getOtherUser} found`,);
          return;
        }
        const AuthUserObj = {
          userId: authUserId,
          fullname: getAuthUser.fullname,
          email: getAuthUser.email,
        }
        const OtherUserObj = {
          userId: getOtherUserId,
          fullname: getOtherUser.fullname,
          email: getOtherUser.email,
        }

        // Determine the room ID
        const roomId = await determineRoomId(AuthUserObj, OtherUserObj);
        
       
    
        // Add the socket to the room
        socket.join(roomId);
        console.log(`User ${authUserId} joined room ${roomId}`);
    
        // Notify the other user in the room (if they're online)
        socket.to(roomId).emit('userJoined', {
          message: `User ${authUserId} has joined the chat.`,
        });
    
        // Notify the client
        socket.emit('roomJoined', { roomId });
      } catch (error) {
        console.error('Error handling joinRoom:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });
    
    

    socket.on('sendMessage', async ({ roomId, content, token }, callback) => {
      try {

        // Validate the token and retrieve the user
    const authResult = await validateTokenForSocket(token);
    if (!authResult.success) {
      if (callback) callback({ status: 'error', message: 'Invalid token.' });
      return;
    }
    const sender = authResult.user.userId;
        // Ensure roomId and content are valid
        if (!roomId || !content) {
          if (callback) {
            callback({ status: 'error', message: 'Invalid roomId or message content.' });
          }
          return;
        }

        const user = await UserModel.findById(sender);
        if (!user) {
          if (callback) callback({ status: 'error', message: 'Sender not found.' });
          return;
        }

        const username = user.fullname;


        // Emit message to the room
        io.to(roomId).emit('receiveMessage', {
          content,
          username,
          timestamp: new Date(),
        });


        // Save the message to the database
        await saveMessageToDB(roomId, content, sender);

        // Acknowledge the client
        if (callback) {
          callback({ status: 'ok', message: 'Message delivered.' });
        }
      } catch (error) {
        console.error('Error in sendMessage:', error);
        if (callback) {
          callback({ status: 'error', message: 'Failed to deliver message.' });
        }
      }
    });

    

    // socket.on('fetchHistory', async ({ roomId }, callback) => {
    //   try {
    //     const messages = await getMessagesForRoom(roomId); // Fetch from DB
    //     callback({ status: 'ok', messages });
    //   } catch (error) {
    //     console.error('Error fetching history:', error);
    //     callback({ status: 'error', message: 'Failed to fetch history' });
    //   }
    // });
    



    // Handle typing indicators
    let typingTimeout;
    socket.on('typing', async ({ roomId, userId }) => {
      try {
        const user = await UserModel.findOne({ _id: userId });

        if (!user) {
          if (callback) callback({ status: 'error', message: 'Sender not found' });
          return;
        }

        const username = user.fullname;
        socket.to(roomId).emit('userTyping', { username });

        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
          socket.to(roomId).emit('stopTyping', { username });
        }, 3000); // Stops typing after 3 seconds

      } catch (error) {
        console.error('Error fetching username for typing indicator:', error);
      }

    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
};

async function saveMessageToDB(roomId, message, senderId) {
  try {
    await chatService.saveMessage({ roomId, sender: senderId, content: message });
    console.log(`Message saved: ${message}`);
  } catch (error) {
    console.error('Error saving message to DB:', error);
  }
}

async function someLogicToDetermineOtherUserId(otherUserId) {
  try {
    // Check if the otherUserId is valid
    if (!otherUserId) {
      console.error('No otherUserId provided');
      return null;
    }

    // Query the database for the other user's details
    const otherUser = await UserModel.findById(otherUserId);

    if (!otherUser) {
      console.error(`User with ID ${otherUserId} does not exist`);
      return null;
    }
    // Return the other user's details
    return otherUser._id.toString();
  } catch (error) {
    console.error('Error determining other user:', error);
    return null;
  }
}