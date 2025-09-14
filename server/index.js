const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);

// Enhanced CORS configuration for production
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS ? 
      process.env.ALLOWED_ORIGINS.split(',') : 
      ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Basic server health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Anonymous Chat Server is running',
    timestamp: new Date().toISOString()
  });
});

// Track connected users
let onlineUsers = 0;

// Enhanced Socket.IO handling
io.on('connection', (socket) => {
  // Update online users count
  onlineUsers++;
  io.emit('online count', onlineUsers);

  // Handle chat messages
  socket.on('chat message', (messageData) => {
    // Validate message data
    if (messageData && typeof messageData.text === 'string') {
      // Sanitize message text (basic example)
      messageData.text = messageData.text.slice(0, 500).trim();
      io.emit('chat message', messageData);
    }
  });

  // Handle typing indicator
  socket.on('typing', (user) => {
    socket.broadcast.emit('user typing', user);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    onlineUsers--;
    io.emit('online count', onlineUsers);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!'
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
