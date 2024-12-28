const chatService = require('./chatService');
const { generateRoomId } = require('../utils/utils');
const mongoose = require('mongoose')
const Message = require('./chatModel');



class ChatController {
    // Controller Method: fetchChatHistory
async fetchChatHistory(req, res) {
    try {
      const { senderId, receiverId } = req.params;
      const limit = parseInt(req.query.limit, 10) || 20;
      const page = parseInt(req.query.page, 10) || 1;
  
      // Call the service method to get chat history
      const chatHistory = await chatService.getChatHistory(senderId, receiverId, limit, page);
  
      if (!chatHistory.messages || chatHistory.messages.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No chat history found between the users.',
        });
      }
  
      res.status(200).json({ success: true, data: chatHistory });
    } catch (error) {
      console.log(error);  // Log for debugging
      res.status(500).json({
        success: false,
        message: 'Failed to fetch chat history.',
        error: error.message,
      });
    }
  }
  async getuserId(req, res) {
    try {
        const { identifier } = req.query; // Accept identifier via query params
        const user = await User.findOne({ fullName: identifier });
    
        if (!user) {
          return res.status(404).send('User not found');
        }
    
        // Find the chat messages for the user using their ObjectId
        const messages = await Message.find({ receiver: user._id });
    
        if (!messages) {
          return res.status(404).send('No messages found');
        }
    
        res.json({ success: true, messages });
      } catch (error) {
        console.error(error);
        res.status(500).send({ success: false, message: 'Error fetching chat history', error: error.message });
      }
    }

  // Save a message via REST API (optional, primarily for testing)
  async saveMessage({ sender, receiver, content }) {
    try {
        const newMessage = new Message({ sender, receiver, content });
        const savedMessage = await newMessage.save();
        return savedMessage;
    } catch (error) {
        console.error('Error saving message:', error);
        throw error;
    }
}

  async fetchAllChats(req, res) {
    try {
        const { userId } = req.params;
        const chatHistory = await chatService.getAllChats(userId);

        console.log("chatHistory: ")

        res.status(200).json({ success: true, data: chatHistory });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error fetching chat history", error: error.message });
    }
}

async fetchChatBetweenUsers(req, res) {
    try {
        const { senderId, receiverId } = req.params;

        // Validate customerId and sellerId as ObjectIds
        if (!mongoose.Types.ObjectId.isValid(senderId) || !mongoose.Types.ObjectId.isValid(receiverId)) {
            return res.status(400).json({ success: false, message: 'Invalid customer or seller ID.' });
        }

        const sender = mongoose.Types.ObjectId(senderId); // Ensure valid ObjectId
        const receiver = mongoose.Types.ObjectId(receiverId); // Ensure valid ObjectId

        // Fetch chat history directly between sender and receiver
        const chatHistory = await chatService.getChatHistoryBetweenUsers(sender, receiver);

        res.status(200).json({ success: true, data: chatHistory });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching chat history", error: error.message });
    }
}

    }



module.exports = ChatController;
// const chatService = require('./chatService');

// class ChatController {
//     async fetchChatHistory(req, res) {
//         try {
//             const { senderId, receiverId } = req.params;
//             const limit = parseInt(req.query.limit, 10) || 20;
//             const page = parseInt(req.query.page, 10) || 1;

//             const chatHistory = await chatService.getChatHistory(senderId, receiverId, limit, page);

//             if (!chatHistory.messages.length) {
//                 return res.status(404).json({ success: false, message: 'No chat history found.' });
//             }

//             res.status(200).json({ success: true, data: chatHistory });
//         } catch (error) {
//             console.error(error);
//             res.status(500).json({ success: false, message: 'Failed to fetch chat history.', error: error.message });
//         }
//     }

//     async saveMessage(req, res) {
//         try {
//             const { sender, receiver, content } = req.body;
//             const savedMessage = await chatService.saveMessage({ sender, receiver, content });
//             res.status(201).json({ success: true, data: savedMessage });
//         } catch (error) {
//             res.status(500).json({ success: false, message: 'Failed to save message.', error: error.message });
//         }
//     }
// }

// module.exports = ChatController
