import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';  
import axios from 'axios';  
import { connect } from 'react-redux';

const Chat = ({ user }) => {  
  const { roomId } = useParams();  
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [lastSentMessageStatus, setLastSentMessageStatus] = useState(null); // New state to store the last message's read status
  const ws = useRef(null);

  useEffect(() => {
    if (!user) return;

    // Fetch previous messages from the server when joining the room
    const fetchMessages = async () => {
      try {
        const res = await axios.get(`/api/messages/${roomId}`);
        setMessages(res.data);  // Load previous messages into the state

        console.log('User ID from Chat.js:', user._id);

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
    const [id1, id2] = roomId.split('-');
    const receiverId = id1 === senderId ? id2 : id1;

    if (message.trim() && ws.current && ws.current.readyState === WebSocket.OPEN) {

      console.log('Sending message with IDs:', {
        sender: user._id,
        receiver: receiverId,
        roomId: roomId
      });

      ws.current.send(JSON.stringify({
        type: 'message',
        room: roomId,
        text: message,
        senderId: senderId,
        receiverId: receiverId
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

  // Search for users by name
  const handleSearchChange = async (e) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (term.length > 2) { // Make an API call only if the search term length is greater than 2
      try {
        const res = await axios.get(`/api/users/search?query=${term}`);
        setSearchResults(res.data);
      } catch (err) {
        console.error('Error searching for users:', err.message);
      }
    } else {
      setSearchResults([]);
    }
  };

  // Redirect to the selected user's chat room
  const handleUserSelect = (userId) => {
    navigate(`/chat/${userId}`);
  };

  if (!user) {
    return <div>Loading user data...</div>;
  }

  return (
    <div style={styles.chatContainer}>
      <h2 style={styles.chatHeader}>Chat Room {user._id}</h2>
      {/* Search Bar */}
      <input
        type="text"
        value={searchTerm}
        onChange={handleSearchChange}
        placeholder="Search for a user..."
        style={styles.searchInput}
      />

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div style={styles.searchResults}>
          {searchResults.map((result) => (
            <div
              key={result._id}
              onClick={() => handleUserSelect(result._id)}
              onMouseEnter={() => setHoveredIndex(result._id)} // Set hover state on mouse enter
              onMouseLeave={() => setHoveredIndex(null)} // Reset hover state on mouse leave
              style={{
                padding: '10px',
                cursor: 'pointer',
                backgroundColor: hoveredIndex === result._id ? '#e0e0e0' : '#f9f9f9', // Apply hover effect conditionally
              }}
            >
              {result.name}
            </div>
          ))}
        </div>
      )}
      {/* Messages Display */}
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
// Replace the styles object in Chat.js with these enhanced styles
const styles = {
  chatContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '85vh',
    padding: '30px',
    backgroundColor: '#ffffff',
    borderRadius: '15px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    width: '70%',
    margin: '20px auto',
    position: 'relative',
  },
  chatHeader: {
    marginBottom: '20px',
    fontSize: '28px',
    fontWeight: '600',
    color: '#1a365d',
    textAlign: 'center',
    width: '100%',
    padding: '10px 0',
    borderBottom: '2px solid #e2e8f0',
  },
  searchInput: {
    padding: '12px 20px',
    borderRadius: '10px',
    border: '2px solid #e2e8f0',
    width: '80%',
    marginBottom: '20px',
    fontSize: '16px',
    transition: 'all 0.3s ease',
    outline: 'none',
    '&:focus': {
      borderColor: '#4299e1',
      boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.5)',
    }
  },
  searchResults: {
    width: '80%',
    maxHeight: '250px',
    overflowY: 'auto',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    backgroundColor: '#fff',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    position: 'absolute',
    top: '120px',
    zIndex: 10,
  },
  searchResultItem: {
    padding: '12px 20px',
    cursor: 'pointer',
    borderBottom: '1px solid #e2e8f0',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#f7fafc',
    }
  },
  messagesContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '500px',
    overflowY: 'auto',
    marginBottom: '20px',
    backgroundColor: '#f8fafc',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  },
  messageBubble: {
    maxWidth: '70%',
    padding: '12px 20px',
    borderRadius: '20px',
    marginBottom: '12px',
    wordWrap: 'break-word',
    fontSize: '16px',
    lineHeight: '1.5',
    position: 'relative',
  },
  sent: {
    alignSelf: 'flex-end',
    backgroundColor: '#4299e1',
    color: '#fff',
    borderBottomRightRadius: '5px',
    marginLeft: 'auto',
  },
  received: {
    alignSelf: 'flex-start',
    backgroundColor: '#edf2f7',
    color: '#2d3748',
    borderBottomLeftRadius: '5px',
    marginRight: 'auto',
  },
  readStatus: {
    fontSize: '14px',
    color: '#718096',
    marginTop: '5px',
    textAlign: 'right',
    width: '100%',
    padding: '0 10px',
  },
  inputContainer: {
    display: 'flex',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    backgroundColor: '#fff',
    borderTop: '2px solid #e2e8f0',
    borderRadius: '0 0 15px 15px',
  },
  input: {
    width: '85%',
    padding: '15px',
    borderRadius: '25px',
    border: '2px solid #e2e8f0',
    fontSize: '16px',
    outline: 'none',
    transition: 'all 0.3s ease',
    '&:focus': {
      borderColor: '#4299e1',
      boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.5)',
    }
  },
  sendButton: {
    padding: '12px 25px',
    backgroundColor: '#4299e1',
    color: '#fff',
    border: 'none',
    borderRadius: '25px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: '#3182ce',
      transform: 'translateY(-1px)',
    },
    '&:active': {
      transform: 'translateY(1px)',
    }
  }
};

// getting user information
const mapStateToProps = (state) => ({
  user: state.auth.user,
});

export default connect(mapStateToProps)(Chat);
