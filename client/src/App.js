import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './styles.css';

const socket = io('http://localhost:5000');
const randomUsername = `User${Math.floor(Math.random() * 10000)}`;

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [username] = useState(randomUsername);
  const [onlineCount, setOnlineCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    socket.on('chat message', (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on('online count', (count) => {
      setOnlineCount(count);
    });

    socket.on('typing', (user) => {
      if (user !== username) {
        setIsTyping(true);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
      }
    });

    return () => {
      socket.off('chat message');
      socket.off('online count');
      socket.off('typing');
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
        username,
        timestamp: new Date().toISOString(),
      };
      socket.emit('chat message', messageData);
      setInput('');
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="app-container">
      <div className="chat-container">
        <div className="chat-header">
          <div className="header-content">
            <h1>Chat Room</h1>
            <div className="user-info">
              <span>You are <strong>{username}</strong></span>
            </div>
          </div>
          <div className="online-count">
            {onlineCount} {onlineCount === 1 ? 'person' : 'people'} online
          </div>
        </div>
        
        <div className="messages-container">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`message ${msg.username === username ? 'own' : 'other'}`}
            >
              <div className="message-content">
                <div className="message-header">
                  <span className="username">{msg.username === username ? 'You' : msg.username}</span>
                  <span className="timestamp">{formatTime(msg.timestamp)}</span>
                </div>
                <div className="message-text">{msg.text}</div>
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
    </div>
  );
}

export default App;
