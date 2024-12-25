const ChatMessage = require('./chatModel');
const UserModel = require('../models/userModel');

class ChatService {
    async saveMessage({ sender, receiver, content }) {
        // Fetch sender and receiver details
        const senderUser = await UserModel.findById(sender).select('fullname email');
        const receiverUser = await UserModel.findById(receiver).select('fullname email');

        if (!senderUser || !receiverUser) {
            throw new Error('Sender or receiver not found');
        }

        // Create and save the new message
        const newMessage = new ChatMessage({ sender, receiver, content });
        await newMessage.save();

        console.log("Message saved from:", senderUser.email, "to:", receiverUser.email);

        return {
            message: newMessage,
            sender: { id: senderUser._id, fullname: senderUser.fullname, email: senderUser.email },
            receiver: { id: receiverUser._id, fullname: receiverUser.fullname, email: receiverUser.email },
        };
    }

    // Service Method: getChatHistory
async getChatHistory(senderId, receiverId, limit = 20, page = 1) {
    const skip = (page - 1) * limit;
  
    try {
      // Query for messages where either sender is senderId and receiver is receiverId, or vice versa
      const totalMessages = await ChatMessage.countDocuments({
        $or: [
          { sender: senderId, receiver: receiverId },
          { sender: receiverId, receiver: senderId },
        ],
      });
  
      const chatMessages = await ChatMessage.find({
        $or: [
          { sender: senderId, receiver: receiverId },
          { sender: receiverId, receiver: senderId },
        ],
      })
        .sort({ timestamp: -1 }) // Sort by timestamp descending to get latest messages first
        .skip(skip)
        .limit(limit)
        .populate('sender', 'fullname email') // Populate sender details
        .lean(); // Return plain JavaScript object (no Mongoose wrappers)
  
      const totalPages = Math.ceil(totalMessages / limit);
  
      return {
        messages: chatMessages,
        pagination: {
          currentPage: page,
          totalPages,
          totalMessages,
          limit,
        },
      };
    } catch (error) {
      throw error;
    }
  }
  

   async getAllChats(userId) {
    try {
        // Fetch all messages where the user is either the sender or the receiver
        const messages = await ChatMessage.find({
            $or: [
                { sender: userId },
                { receiver: userId }
            ]
        }).sort({ timestamp: -1 }); // Sort messages by timestamp descending to get the latest messages first

        // Group messages by chat partner
        const chatPartners = {};

        // Iterate through messages and group them by partner
        messages.forEach((message) => {
            const partnerId = message.sender.toString() === userId.toString() ? message.receiver : message.sender;

            if (!chatPartners[partnerId]) {
                chatPartners[partnerId] = {
                    partnerId,
                    messages: [], // Initialize an array to hold all messages for this partner
                };
            }

            // Add the current message to the list of messages for this partner
            chatPartners[partnerId].messages.push({
                content: message.content,
                timestamp: message.timestamp,
            });
        });

        // Fetch user details for each chat partner
        const partnerDetails = await Promise.all(
            Object.keys(chatPartners).map(async (partnerId) => {
                const user = await UserModel.findById(partnerId).select('fullname email');
                return {
                    partner: user,
                    messages: chatPartners[partnerId].messages,
                };
            })
        );

        return partnerDetails;
    } catch (error) {
        console.log('Error fetching all chats', error);
        throw error;
    }
}
}

module.exports = new ChatService();
