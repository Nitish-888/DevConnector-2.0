import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { connect } from 'react-redux'; // Import connect to access Redux state

const DevelopersList = ({ user }) => {  // Destructure user from Redux
  const [developers, setDevelopers] = useState([]);

  const generateRoomId = (user1Id, user2Id) => {
    // Sort the user IDs to create a consistent room ID
    return [user1Id, user2Id].sort().join('-');
  };

  const handleChatStart = (developer) => {
    const user1Id = user._id; // Logged-in user ID
    const user2Id = developer.user._id; // Selected developer's ID

    const roomId = generateRoomId(user1Id, user2Id);

    // Store IDs for future use
    localStorage.setItem('user1Id', user1Id);
    localStorage.setItem('user2Id', user2Id);
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

    fetchDevelopers();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', textAlign: 'center', paddingTop: '60px' }}>
      <h2 style={{ marginBottom: '20px', fontSize: '24px' }}>Select a Developer to Chat</h2>
      {user && <h4>Logged in as: {user.name}</h4>} {/* Display logged-in user's name */}
      
      <ul style={{ listStyleType: 'none', padding: '0', marginBottom: '20px' }}>
        {developers.length > 0 ? (
          developers.filter(developer => developer.user._id !== user._id).map((developer) => (
            <li key={developer.user._id} style={{ marginBottom: '10px', fontSize: '18px' }}>
              {/* Link to start chat and set recipient in localStorage */}
              <Link
                to={`/chat/${generateRoomId(user._id, developer.user._id)}?user1Id=${user._id}&user2Id=${developer.user._id}`}
                onClick={() => handleChatStart(developer)}
              >
                Chat with {developer.user.name}
              </Link>
            </li>
          ))
        ) : (
          <li>No developers found</li>
        )}
      </ul>
      <h3 style={{ marginBottom: '10px', fontSize: '20px' }}>Join Public Chat</h3>
      <Link
        to="/chat/public"
        style={{ padding: '10px 20px', backgroundColor: '#007bff', color: '#fff', textDecoration: 'none', borderRadius: '5px' }}
      >
        Join Public Chat
      </Link>
    </div>
  );
};

// Map the Redux state to props
const mapStateToProps = (state) => ({
  user: state.auth.user, // Get the user information from Redux
});

export default connect(mapStateToProps)(DevelopersList);
