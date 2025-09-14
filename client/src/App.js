import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Auth from './components/Auth';
import './styles.css';

const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
  autoConnect: false
});

function App() {
  const [auth, setAuth] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [onlineCount, setOnlineCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // Check for existing auth
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      setAuth({ token, user: JSON.parse(user) });
    }
  }, []);

  useEffect(() => {
    if (auth) {
      // Connect and authenticate socket
      socket.connect();
      socket.emit('authenticate', auth.token);

      socket.on('auth error', (error) => {
        console.error('Auth error:', error);
        setAuth(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      });

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
        if (user !== auth.user.username) {
          setIsTyping(true);
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
        }
      });

      return () => {
        socket.off('auth error');
        socket.off('chat history');
        socket.off('chat message');
        socket.off('online count');
        socket.off('user typing');
        socket.disconnect();
      };
    }
  }, [auth]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    socket.emit('typing', auth.user.username);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (input.trim() && auth) {
      const messageData = {
        text: input.trim(),
        username: auth.user.username,
        time: new Date().toLocaleTimeString(),
      };
      socket.emit('chat message', messageData);
      setInput('');
    }
  };

  const handleLogout = () => {
    setAuth(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    socket.disconnect();
  };

  if (!auth) {
    return <Auth onAuth={setAuth} />;
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="header-content">
          <h1>Chat Room</h1>
          <div className="user-info">
            <span>Logged in as {auth.user.username}</span>
            <button onClick={handleLogout} className="logout-button">Logout</button>
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
            className={`message ${msg.username === auth.user.username ? 'own' : 'other'}`}
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

