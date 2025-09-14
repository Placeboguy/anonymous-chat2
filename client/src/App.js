import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './styles.css';

const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000');

// Generate a random username
const randomUsername = `User${Math.floor(Math.random() * 10000)}`;

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [onlineCount, setOnlineCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [username] = useState(randomUsername);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    socket.on('chat history', (history) => {
      setMessages(history);
    });

    socket.on('chat message', (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on('online count', (count) => {
      setOnlineCount(count);
    });

    socket.on('user typing', (user) => {
      if (user !== username) {
        setIsTyping(true);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
      }
    });

    // Request chat history when connected
    socket.emit('get history');

    return () => {
      socket.off('chat history');
      socket.off('chat message');
      socket.off('online count');
      socket.off('user typing');
    };
  }, [username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    socket.emit('typing', username);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (input.trim()) {
      const messageData = {
        text: input.trim(),
        username: username,
        time: new Date().toLocaleTimeString(),
      };
      socket.emit('chat message', messageData);
      setInput('');
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="header-content">
          <h1>Chat Room</h1>
          <div className="user-info">
            <span>Chatting as {username}</span>
          </div>
        </div>
        <div className="online-count">
          {onlineCount} {onlineCount === 1 ? 'person' : 'people'} online
        </div>
      </div>
      
      <div className="messages-container">
        {messages.map((msg, i) => (
          <div
            key={msg._id || i}
            className={`message ${msg.username === username ? 'own' : 'other'}`}
          >
            {msg.text}
            <div className="message-time">
              {msg.username} • {new Date(msg.createdAt || msg.time).toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="typing-indicator">
        {isTyping && 'Someone is typing...'}
      </div>

      <form onSubmit={sendMessage} className="input-container">
        <input
          className="message-input"
          value={input}
          onChange={handleInputChange}
          placeholder="Type your message..."
          maxLength={500}
        />
        <button
          className="send-button"
          type="submit"
          disabled={!input.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default App;

