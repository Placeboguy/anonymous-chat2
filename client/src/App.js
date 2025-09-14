import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000');

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket.on('chat message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    return () => {
      socket.off('chat message');
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (input.trim()) {
      socket.emit('chat message', input);
      setInput('');
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h2>Anonymous Chat</h2>
      <div style={{ border: '1px solid #ccc', height: 300, overflowY: 'auto', padding: 10, marginBottom: 10 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ margin: '5px 0' }}>{msg}</div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} style={{ display: 'flex' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          style={{ flex: 1, padding: 8 }}
          placeholder="Type your message..."
        />
        <button type="submit" style={{ padding: '8px 16px' }}>Send</button>
      </form>
    </div>
  );
}

export default App;
