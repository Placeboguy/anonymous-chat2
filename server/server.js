const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const db = require('./db');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

app.use(cors());

// Track connected users
let onlineUsers = 0;

io.on('connection', (socket) => {
  onlineUsers++;
  io.emit('online count', onlineUsers);

  // Send existing messages to newly connected client
  socket.emit('chat history', db.getMessages());

  socket.on('chat message', (messageData) => {
    const savedMessage = db.addMessage(messageData);
    io.emit('chat message', savedMessage);
  });

  socket.on('typing', (username) => {
    socket.broadcast.emit('typing', username);
  });

  socket.on('disconnect', () => {
    onlineUsers--;
    io.emit('online count', onlineUsers);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});