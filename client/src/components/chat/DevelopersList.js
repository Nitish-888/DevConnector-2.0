import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { connect } from 'react-redux';

const DevelopersList = ({ user }) => {
  const [developers, setDevelopers] = useState([]);
  const [groups, setGroups] = useState([]);
  const navigate = useNavigate();

  const generateRoomId = (user1Id, user2Id) => {
    // Sort the user IDs to create a consistent room ID
    return [user1Id, user2Id].sort().join('-');
  };

  const handleChatStart = (developer) => {
    const user1Id = user._id; // Logged-in user ID
    const user2Id = developer.user._id; // Selected developer's ID

    const roomId = generateRoomId(user1Id, user2Id);

    // Navigate to the chat room
    navigate(`/chat/${roomId}`);
  };

  const handleGroupChatStart = (group) => {
    navigate(`/groupChat/${group._id}`);
  };

  useEffect(() => {
    const fetchDevelopers = async () => {
      try {
        const res = await axios.get('/api/profile'); // Fetch developer profiles
        setDevelopers(res.data);
      } catch (err) {
        console.error(err.message);
      }
    };

    const fetchGroups = async () => {
      try {
        console.log('Fetching groups for user...');
        const res = await axios.get('/api/groups', {
          headers: { 'x-auth-token': localStorage.getItem('token') },
        });
        console.log('Groups fetched:', res.data);
        setGroups(res.data);
      } catch (err) {
        console.error('Error fetching groups:', err.message);
      }
    };

    fetchDevelopers();
    fetchGroups();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', textAlign: 'center', paddingTop: '60px' }}>
      <h2 style={{ marginBottom: '20px', fontSize: '24px' }}>Select a Developer to Chat</h2>
      {user && <h4>Logged in as: {user.name}</h4>} {/* Display logged-in user's name */}
      
      <ul style={{ listStyleType: 'none', padding: '0', marginBottom: '20px' }}>
        {developers.length > 0 ? (
          developers.filter(developer => developer.user._id !== user._id).map((developer) => (
            <li key={developer.user._id} style={{ marginBottom: '10px', fontSize: '18px' }}>
              {/* Link to start chat */}
              <button
                onClick={() => handleChatStart(developer)}
                style={{ textDecoration: 'none', backgroundColor: '#007bff', color: '#fff', padding: '10px 20px', borderRadius: '5px', border: 'none', cursor: 'pointer' }}
              >
                Chat with {developer.user.name}
              </button>
            </li>
          ))
        ) : (
          <li>No developers found</li>
        )}
      </ul>

      <h2 style={{ marginBottom: '20px', fontSize: '24px' }}>Your Groups</h2>
      <ul style={{ listStyleType: 'none', padding: '0', marginBottom: '20px' }}>
        {groups.length > 0 ? (
          groups.map((group) => (
            <li key={group._id} style={{ marginBottom: '10px', fontSize: '18px' }}>
              {/* Button to start group chat */}
              <button
                onClick={() => handleGroupChatStart(group)}
                style={{ textDecoration: 'none', backgroundColor: '#28a745', color: '#fff', padding: '10px 20px', borderRadius: '5px', border: 'none', cursor: 'pointer' }}
              >
                {group.name}
              </button>
            </li>
          ))
        ) : (
          <li>No groups found</li>
        )}
      </ul>

      <h3 style={{ marginBottom: '10px', fontSize: '20px' }}>Join Public Chat</h3>
      <Link
        to="/chat/public"
        style={{ padding: '10px 20px', backgroundColor: '#007bff', color: '#fff', textDecoration: 'none', borderRadius: '5px' }}
      >
        Join Public Chat
      </Link>

      <h3 style={{ marginTop: '20px', fontSize: '20px' }}>Create Group</h3>
      <Link
        to="/create-group"
        style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: '#fff', textDecoration: 'none', borderRadius: '5px', marginTop: '10px' }}
      >
        Create Group
      </Link>
    </div>
  );
};

// Map the Redux state to props
const mapStateToProps = (state) => ({
  user: state.auth.user, // Get the user information from Redux
});

export default connect(mapStateToProps)(DevelopersList);
