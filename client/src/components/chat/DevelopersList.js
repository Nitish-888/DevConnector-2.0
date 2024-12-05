import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { connect } from 'react-redux';

const DevelopersList = ({ user }) => {
  const [developers, setDevelopers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
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

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    console.log('Search Term:', e.target.value);
  };  

  const filteredDevelopers = developers.filter(developer =>
    developer.user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  console.log('Filtered Developers:', filteredDevelopers);
  
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
    <div style={styles.container}>
      <div style={styles.content}>
        <h2 style={styles.mainTitle}>Developer Chat Hub</h2>
        
        <div style={styles.searchSection}>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search for a developer..."
            style={styles.searchInput}
          />
          {user && <h4 style={styles.userInfo}>Logged in as: {user.name}</h4>}
        </div>
  
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Available Developers</h3>
          <div style={styles.grid}>
            {filteredDevelopers.length > 0 ? (
              filteredDevelopers
                .filter((developer) => developer.user._id !== user._id)
                .map((developer) => (
                  <button
                    key={developer.user._id}
                    onClick={() => handleChatStart(developer)}
                    style={styles.developerCard}
                  >
                    <span style={styles.cardIcon}>👤</span>
                    <span style={styles.cardText}>{developer.user.name}</span>
                  </button>
                ))
            ) : (
              <p style={styles.noResults}>No developers found</p>
            )}
          </div>
        </div>
  
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Your Groups</h3>
          <div style={styles.grid}>
            {groups.length > 0 ? (
              groups.map((group) => (
                <button
                  key={group._id}
                  onClick={() => handleGroupChatStart(group)}
                  style={styles.groupCard}
                >
                  <span style={styles.cardIcon}>👥</span>
                  <span style={styles.cardText}>{group.name}</span>
                </button>
              ))
            ) : (
              <p style={styles.noResults}>No groups found</p>
            )}
          </div>
        </div>
  
        <div style={styles.actionButtons}>
          <Link to="/chat/public" style={styles.publicChatButton}>
            <span style={styles.buttonIcon}>🌐</span>
            Join Public Chat
          </Link>
          <Link to="/create-group" style={styles.createGroupButton}>
            <span style={styles.buttonIcon}>➕</span>
            Create New Group
          </Link>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f7fafc',
    paddingTop: '80px',
    paddingBottom: '40px',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
  },
  mainTitle: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#2d3748',
    textAlign: 'center',
    marginBottom: '40px',
  },
  searchSection: {
    marginBottom: '40px',
    textAlign: 'center',
  },
  searchInput: {
    width: '100%',
    maxWidth: '500px',
    padding: '15px 25px',
    fontSize: '16px',
    borderRadius: '12px',
    border: '2px solid #e2e8f0',
    outline: 'none',
    transition: 'all 0.3s ease',
    marginBottom: '15px',
  },
  userInfo: {
    color: '#4a5568',
    fontSize: '16px',
    marginTop: '10px',
  },
  section: {
    marginBottom: '40px',
    backgroundColor: '#ffffff',
    borderRadius: '15px',
    padding: '25px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '20px',
    paddingBottom: '10px',
    borderBottom: '2px solid #e2e8f0',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '20px',
    padding: '10px',
  },
  developerCard: {
    display: 'flex',
    alignItems: 'center',
    padding: '15px 20px',
    backgroundColor: '#ebf8ff',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    },
  },
  groupCard: {
    display: 'flex',
    alignItems: 'center',
    padding: '15px 20px',
    backgroundColor: '#f0fff4',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    },
  },
  cardIcon: {
    fontSize: '24px',
    marginRight: '12px',
  },
  cardText: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#2d3748',
  },
  actionButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    flexWrap: 'wrap',
  },
  publicChatButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '15px 30px',
    backgroundColor: '#4299e1',
    color: '#ffffff',
    borderRadius: '12px',
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: '#3182ce',
      transform: 'translateY(-2px)',
    },
  },
  createGroupButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '15px 30px',
    backgroundColor: '#48bb78',
    color: '#ffffff',
    borderRadius: '12px',
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: '#38a169',
      transform: 'translateY(-2px)',
    },
  },
  buttonIcon: {
    fontSize: '20px',
    marginRight: '10px',
  },
  noResults: {
    textAlign: 'center',
    color: '#718096',
    fontSize: '16px',
    gridColumn: '1 / -1',
    padding: '20px',
  }
};

// Map the Redux state to props
const mapStateToProps = (state) => ({
  user: state.auth.user, // Get the user information from Redux
});

export default connect(mapStateToProps)(DevelopersList);
