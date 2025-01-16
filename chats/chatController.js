const chatService = require('./chatService');
const mongoose = require('mongoose')
const Message = require('./chatModel');
const { sendChatNotification } = require('./chatService');



class ChatController {
    // Controller Method: fetchChatHistory
    async fetchChatHistory(senderId, receiverId, limit, page) {
      const skip = (page - 1) * limit;
    
      // Fetch messages from the Chat Model
      const messages = await Message.find({
        $or: [
          { sender: senderId, receiver: receiverId },
          { sender: receiverId, receiver: senderId },
        ],
      })
        .sort({ timestamp: -1 }) // Sort by most recent
        .skip(skip)
        .limit(limit);
    
      const totalMessages = await Message.countDocuments({
        $or: [
          { sender: senderId, receiver: receiverId },
          { sender: receiverId, receiver: senderId },
        ],
      });
    
      return {
        messages,
        pagination: {
          total: totalMessages,
          limit,
          page,
          totalPages: Math.ceil(totalMessages / limit),
        },
      };
    }
  async upload(req, res) {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }
    res.status(200).json({
        message: "File uploaded successfully",
        filePath: `/uploads/${req.file.filename}`,
    });
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

    }



module.exports = ChatController;
