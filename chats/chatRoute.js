const express = require('express');
const router = express.Router();
const ChatController = require('./chatController');
const chatController = new ChatController();

// Fetch chat history between two users (sender and receiver)
router.get('/:senderId/:receiverId', chatController.fetchChatHistory.bind(chatController));

// Save a message (sender to receiver)
router.post('/messages', chatController.saveMessage.bind(chatController));

// Fetch all chats for a specific user (all conversations the user is part of)
router.get('/:userId', chatController.fetchAllChats.bind(chatController));

module.exports = router;
