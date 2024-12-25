const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
    roomId: { type: String, unique: true, required: true },
    participants: [
        {
          userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          fullname: { type: String },
          email: { type: String },
        },
      ],
    lastMessage: { type: String, default: null },
    lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('chatRoom', chatRoomSchema);