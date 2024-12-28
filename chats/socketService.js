
const Message = require('../chats/chatModel');

class SocketService {
    // Save a new message to the database
    static async saveMessage({ chatRoomId, senderId, content }) {
      const newMessage = new Message({
        chat: chatRoomId,
        sender: senderId,
        content,
      });
  
      const savedMessage = await newMessage.save();
  
      // Update the chat's last message and timestamp
      await Message.findByIdAndUpdate(chatRoomId, {
        lastMessage: content,
        lastUpdated: Date.now(),
      });
  
      return savedMessage;
    }
  }
  
  module.exports = SocketService;
