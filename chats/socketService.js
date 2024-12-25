
const Message = require('../chats/chatModel');

class SocketService {
    constructor(io) {
        this.io = io;
    }

    sendMessageToUser(userId, event, data) {
        this.io.to(userId).emit(event, data);
    }

    broadcastToRoom(room, event, data) {
        this.io.to(room).emit(event, data);
    }
}

module.exports = SocketService;
