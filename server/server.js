const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Initialize SQLite database
const db = new sqlite3.Database('./chat.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the chat database.');
});

// Create messages table
db.run(`CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL,
  username TEXT NOT NULL,
  time TEXT NOT NULL
)`);

// Store online users count
let onlineUsers = 0;

io.on('connection', (socket) => {
  onlineUsers++;
  io.emit('online count', onlineUsers);

  // Send chat history when requested
  socket.on('get history', () => {
    db.all(`SELECT * FROM messages ORDER BY id DESC LIMIT 50`, [], (err, rows) => {
      if (err) {
        console.error(err);
        return;
      }
      socket.emit('chat history', rows.reverse());
    });
  });

  // Handle new chat messages
  socket.on('chat message', (messageData) => {
    console.log('Received message:', messageData);
    db.run(`INSERT INTO messages (text, username, time) VALUES (?, ?, ?)`,
      [messageData.text, messageData.username, messageData.time],
      (err) => {
        if (err) {
          console.error('Database error:', err);
          return;
        }
        console.log('Message saved, broadcasting to all clients');
        io.emit('chat message', messageData);
      }
    );
  });

  // Handle typing events
  socket.on('typing', (username) => {
    socket.broadcast.emit('user typing', username);
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