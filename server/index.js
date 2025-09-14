require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { messageMethods } = require('./db');
const authRoutes = require('./routes/auth');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

const server = http.createServer(app);

// Enhanced CORS configuration for production
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.ALLOWED_ORIGINS 
      : ['http://localhost:3001', 'http://localhost:3000'],
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

// Get chat history
app.get('/api/messages', async (req, res) => {
  try {
    const messages = await Message.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('user', 'username');
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Enhanced Socket.IO handling
io.on('connection', async (socket) => {
  let userId = null;

  // Authenticate user
  socket.on('authenticate', async (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.userId;
      socket.userId = userId;
      
      // Update online users count
      onlineUsers++;
      io.emit('online count', onlineUsers);

      // Send chat history
      const messages = await messageMethods.getRecentMessages(50);
      socket.emit('chat history', messages);
    } catch (error) {
      socket.emit('auth error', 'Invalid token');
    }
  });

  // Handle chat messages
  socket.on('chat message', async (messageData) => {
    if (!socket.userId) {
      socket.emit('auth error', 'Not authenticated');
      return;
    }

    if (messageData && typeof messageData.text === 'string') {
      try {
        // Save message to database
        const message = await messageMethods.saveMessage(
          messageData.text.slice(0, 500).trim(),
          socket.userId,
          messageData.username
        );

        // Broadcast message
        io.emit('chat message', message);
      } catch (error) {
        socket.emit('error', 'Failed to save message');
      }
    }
  });

  // Handle typing indicator
  socket.on('typing', (user) => {
    if (socket.userId) {
      socket.broadcast.emit('user typing', user);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers--;
      io.emit('online count', onlineUsers);
    }
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
