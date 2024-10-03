import React, { useState, useEffect } from 'react';

const Chat = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    // Create a new WebSocket connection to the server
    const webSocket = new WebSocket('ws://localhost:5000'); // Make sure the URL matches your backend server
    setWs(webSocket);

    // Listen for messages from the server
    webSocket.onmessage = (event) => {
      const newMessage = event.data;
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    };

    // Clean up the WebSocket connection when the component unmounts
    return () => {
      webSocket.close();
    };
  }, []);

  // Function to send messages to the WebSocket server
  const sendMessage = () => {
    if (message.trim() && ws) {
      ws.send(message); // Send the message to the WebSocket server
      setMessage(''); // Clear the input field
    }
  };

  return (
    <div className="chat-container" style={{
      position: 'relative', 
      margin: '80px auto', // Center it horizontally with auto margins
      maxWidth: '600px', // Limit the width
      padding: '20px', 
      backgroundColor: '#f9f9f9', 
      borderRadius: '8px', 
      boxShadow: '0px 0px 10px rgba(0,0,0,0.2)'
    }}>
      <div className="messages" style={{
        height: '300px', // Set the height to make it larger
        overflowY: 'scroll', 
        border: '1px solid #ccc', 
        padding: '10px',
        marginBottom: '10px',
        backgroundColor: '#fff' // Light background for the message area
      }}>
        {messages.map((msg, index) => (
          <p key={index} style={{ margin: '5px 0', padding: '5px', borderRadius: '5px', backgroundColor: '#e0e0e0' }}>
            {msg}
          </p>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button onClick={sendMessage} style={{
          padding: '10px 15px', 
          backgroundColor: '#007bff', 
          color: '#fff', 
          border: 'none', 
          borderRadius: '4px',
          cursor: 'pointer'
        }}>Send</button>
      </div>
    </div>
  );
};

export default Chat;
