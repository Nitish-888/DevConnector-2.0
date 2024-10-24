import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';  
import axios from 'axios';  
import { connect } from 'react-redux';

const Chat = ({ user }) => {  
  const { roomId } = useParams();  
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [lastSentMessageStatus, setLastSentMessageStatus] = useState(null); // New state to store the last message's read status
  const ws = useRef(null);

  useEffect(() => {
    if (!user) return;

    // Fetch previous messages from the server when joining the room
    const fetchMessages = async () => {
      try {
        const res = await axios.get(`/api/messages/${roomId}`);
        setMessages(res.data);  // Load previous messages into the state

        // Find the last message sent by the current user (user1)
        const lastSentMessage = res.data
          .filter((msg) => msg.sender === user._id)  // Only check messages sent by the current user
          .pop();  // Get the last sent message

        // Update the read/unread status for the last sent message
        if (lastSentMessage) {
          setLastSentMessageStatus(lastSentMessage.isRead ? '✓ Read' : 'Unread');
        }
      } catch (err) {
        console.error('Error fetching previous messages:', err.message);
      }
    };

    fetchMessages();
    markMessagesAndNotificationsAsRead(); // Mark messages and notifications as read when the chatbox is opened

    // Initialize WebSocket and handle connections
    if (!ws.current) {
      ws.current = new WebSocket('ws://localhost:5000');
    }

    ws.current.onopen = () => {
      console.log('WebSocket connection established');
      ws.current.send(JSON.stringify({ type: 'join', room: roomId, userId: user._id }));
    };

    ws.current.onmessage = (event) => {
      const { senderId, message, isRead } = JSON.parse(event.data);
      setMessages((prevMessages) => [...prevMessages, { senderId, message, isRead }]);

      // Update the read status of the last sent message if it's marked as read in the WebSocket response
      if (senderId !== user._id) {
        const lastSentMessage = messages.filter(msg => msg.sender === user._id).pop();
        if (lastSentMessage) {
          setLastSentMessageStatus(lastSentMessage.isRead ? '✓ Read' : 'Unread');
        }
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      if (ws.current) {
        ws.current.send(JSON.stringify({ type: 'leave', room: roomId }));
        ws.current.close();
      }
    };

  }, [roomId, user]);

  const sendMessage = () => {
    if (!user) {
      console.error('User is not available');
      return;
    }

    const senderId = user._id;

    if (message.trim() && ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'message',
        room: roomId,
        text: message,
        senderId: senderId
      }));
      setMessage('');
    } else {
      console.log('WebSocket connection is not open or message is empty');
    }
  };

  // Mark all messages and notifications in the room as read
  const markMessagesAndNotificationsAsRead = async () => {
    try {
      // Mark messages as read
      await axios.put('/api/notifications/mark-as-read', { roomId }, {
        headers: {
          'x-auth-token': localStorage.getItem('token')
        }
      });

      console.log('Messages and notifications marked as read');
    } catch (err) {
      console.error('Error marking messages or notifications as read:', err.message);
    }
  };

  if (!user) {
    return <div>Loading user data...</div>;
  }

  return (
    <div style={styles.chatContainer}>
      <h2 style={styles.chatHeader}>Chat Room {user._id}</h2>
      <div style={styles.messagesContainer}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              ...styles.messageBubble,
              ...(msg.sender === user._id ? styles.sent : styles.received)
            }}
          >
            {msg.text || msg.message}
          </div>
        ))}
      </div>

      {/* Show Read/Unread status below the last message sent by the user */}
      {lastSentMessageStatus && (
        <div style={styles.readStatus}>
          Last message: {lastSentMessageStatus}
        </div>
      )}

      <div style={styles.inputContainer}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          style={styles.input}
        />
        <button onClick={sendMessage} style={styles.sendButton}>Send</button>
      </div>
    </div>
  );
};

// Inline styles for the chat UI
const styles = {
  chatContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '80vh',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '10px',
    boxShadow: '0px 0px 10px rgba(0,0,0,0.1)',
    width: '60%',
    margin: '0 auto',
  },
  chatHeader: {
    marginBottom: '10px',
    fontSize: '24px',
  },
  messagesContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '400px',
    overflowY: 'scroll',
    marginBottom: '20px',
    backgroundColor: '#fff',
    padding: '10px',
    borderRadius: '5px',
    boxShadow: 'inset 0 0 5px rgba(0, 0, 0, 0.1)',
  },
  messageBubble: {
    maxWidth: '60%',
    padding: '10px',
    borderRadius: '20px',
    marginBottom: '10px',
    wordWrap: 'break-word',
  },
  sent: {
    alignSelf: 'flex-end',
    backgroundColor: '#007bff',
    color: '#fff',
  },
  received: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0e0e0',
    color: '#000',
  },
  readStatus: {
    fontSize: '14px',
    color: '#777',
    marginTop: '10px',
    textAlign: 'right',
    width: '100%',
  },
  inputContainer: {
    display: 'flex',
    width: '100%',
    justifyContent: 'space-between',
  },
  input: {
    width: '80%',
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #ccc',
  },
  sendButton: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginLeft: '10px',
  },
};

// getting user information
const mapStateToProps = (state) => ({
  user: state.auth.user,
});

export default connect(mapStateToProps)(Chat);
