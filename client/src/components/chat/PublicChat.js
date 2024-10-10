import React, { useState, useEffect, useRef } from 'react';

const PublicChat = ({ user }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const ws = useRef(null);

  // Establish WebSocket connection when the component mounts
  useEffect(() => {
    if (!ws.current) {
      ws.current = new WebSocket('ws://localhost:5000');
    }

    ws.current.onopen = () => {
      console.log('WebSocket connection established for Public Chat');
      ws.current.send(JSON.stringify({ type: 'join', room: 'public' }));
    };

    ws.current.onmessage = (event) => {
      const { username, message } = JSON.parse(event.data);
      setMessages((prevMessages) => [...prevMessages, { username, message }]);
    };

    ws.current.onclose = () => {
      console.log('WebSocket connection closed for Public Chat');
    };

    return () => {
      ws.current.send(JSON.stringify({ type: 'leave', room: 'public' }));
      ws.current.close();
    };
  }, []);

  const sendMessage = () => {
    if (message.trim()) {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({
          type: 'message',
          room: 'public',
          text: message,
          username: user.name
        }));
        setMessage('');
      } else {
        console.error('WebSocket is not open. ReadyState:', ws.current.readyState);
      }
    }
  };

  return (
    <div>
      <h2>Public Chat</h2>
      <div className="messages">
        {messages.map((msg, index) => (
          <p key={index}><strong>{msg.username}:</strong> {msg.message}</p>
        ))}
      </div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default PublicChat;
