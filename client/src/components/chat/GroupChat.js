import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { connect } from 'react-redux';

const GroupChat = ({ user }) => {
  const { groupId } = useParams(); // Get groupId from URL
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [lastSentMessageStatus, setLastSentMessageStatus] = useState(null);

  // State variables for group information
  const [group, setGroup] = useState(null);
  const [groupDetailsVisible, setGroupDetailsVisible] = useState(false);

  const ws = useRef(null);

  // Mark all messages and notifications in the room as read
  const markMessagesAndNotificationsAsRead = useCallback(async () => {
    try {
      // Mark messages as read
      await axios.put('/api/notifications/mark-as-read', { roomId: groupId }, {
        headers: {
          'x-auth-token': localStorage.getItem('token')
        }
      });
      console.log('Messages and notifications marked as read');
    } catch (err) {
      console.error('Error marking messages or notifications as read:', err.message);
    }
  }, [groupId]);

  useEffect(() => {
    if (!user) return;

    // Fetch previous messages and group information when joining the room
    const fetchMessagesAndGroup = async () => {
      try {
        console.log('Fetching group information with groupId:', groupId);
        // Fetch group information
        const groupRes = await axios.get(`/api/groups/${groupId}`, {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        console.log('Fetched group information:', groupRes.data);
        
        // Setting group information
        setGroup(groupRes.data);

        // Fetch group messages
        console.log('Fetching group messages for groupId:', groupId);
        const res = await axios.get(`/api/groupMessages/${groupId}`, {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        });
        console.log('Fetched group messages:', res.data);
        setMessages(res.data);

        // Find the last message sent by the current user
        const lastSentMessage = res.data
          .filter((msg) => msg.sender === user._id)
          .pop();

        // Update the read/unread status for the last sent message
        if (lastSentMessage) {
          setLastSentMessageStatus(lastSentMessage.isRead ? '✓ Read' : 'Unread');
        }
      } catch (err) {
        console.error('Error fetching messages or group information:', err.message);
      }
    };

    fetchMessagesAndGroup();
    markMessagesAndNotificationsAsRead(); // Mark messages and notifications as read when the chatbox is opened

    // Initialize WebSocket and handle connections
    if (!ws.current) {
      ws.current = new WebSocket('ws://localhost:5000');
    }

    ws.current.onopen = () => {
      console.log('WebSocket connection established');
      ws.current.send(JSON.stringify({ type: 'join', room: groupId, userId: user._id }));
    };

    ws.current.onmessage = (event) => {
      const { senderId, message, isRead } = JSON.parse(event.data);
      setMessages((prevMessages) => [...prevMessages, { senderId, message, isRead }]);

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
        ws.current.send(JSON.stringify({ type: 'leave', room: groupId }));
        ws.current.close();
      }
    };

  }, [groupId, user]);

  const sendMessage = () => {
    if (!user) {
      console.error('User is not available');
      return;
    }

    const senderId = user._id;

    if (message.trim() && ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'message',
        room: groupId,
        text: message,
        senderId: senderId,
        isGroup: true
      }));
      setMessage('');
    } else {
      console.log('WebSocket connection is not open or message is empty');
    }
  };

  // Toggle visibility of group details
  const toggleGroupDetails = () => {
    setGroupDetailsVisible(!groupDetailsVisible);
  };

  if (!user) {
    return <div>Loading user data...</div>;
  }

  return (
    <div style={styles.chatContainer}>
      {group && (
        <>
          <h2 style={styles.chatHeader}>Group: {group.name}</h2>
          <button onClick={toggleGroupDetails} style={styles.groupDetailsButton}>
            {groupDetailsVisible ? 'Hide Group Details' : 'View Group Details'}
          </button>
          {groupDetailsVisible && (
            <div style={styles.groupDetailsContainer}>
              <h3>Group Details</h3>
              <p><strong>Name:</strong> {group.name}</p>
              <p><strong>Description:</strong> {group.description}</p>
              {group.profilePicture && (
                <img src={group.profilePicture} alt="Group Profile" style={styles.groupImage} />
              )}
            </div>
          )}
        </>
      )}
      <div style={styles.messagesContainer}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              ...styles.messageBubble,
              ...(String(msg.sender) === String(user._id) ? styles.sent : styles.received)
            }}
          >
            {msg.text || msg.message}
          </div>
        ))}
      </div>

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
    alignItems: 'center',
    minHeight: '80vh',
    padding: '20px',
    backgroundColor: '#f9f9f9',
    borderRadius: '10px',
    boxShadow: '0px 0px 10px rgba(0,0,0,0.1)',
    width: '60%',
    margin: '35px auto 0 auto',
  },
  chatHeader: {
    marginBottom: '10px',
    fontSize: '24px',
  },
  groupDetailsButton: {
    padding: '10px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginBottom: '20px',
  },
  groupDetailsContainer: {
    padding: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    marginBottom: '20px',
    width: '100%',
    textAlign: 'left',
  },
  groupImage: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    marginBottom: '10px',
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

export default connect(mapStateToProps)(GroupChat);
