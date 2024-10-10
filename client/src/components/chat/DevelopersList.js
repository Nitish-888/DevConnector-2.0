import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const DevelopersList = () => {
  const [developers, setDevelopers] = useState([]);

  useEffect(() => {
    const fetchDevelopers = async () => {
      try {
        const res = await axios.get('/api/profile'); // Ensure that this endpoint returns profiles
        setDevelopers(res.data); // res.data should be the array of profiles
      } catch (err) {
        console.error(err.message);
      }
    };

    fetchDevelopers();
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      textAlign: 'center',
      paddingTop: '60px' // Adjust based on navbar height
    }}>
      <h2 style={{ marginBottom: '20px', fontSize: '24px' }}>Select a Developer to Chat</h2>
      <ul style={{ listStyleType: 'none', padding: '0', marginBottom: '20px' }}>
        {developers.length > 0 ? (
          developers.map((developer) => (
            <li key={developer.user._id} style={{ marginBottom: '10px', fontSize: '18px' }}>
              <Link 
                to={{
                    pathname: `/chat/${developer.user._id}`,
                    state: { recipientId: developer.user._id, recipientUsername: developer.user.name }
                }}
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
        style={{
          padding: '10px 20px', 
          backgroundColor: '#007bff', 
          color: '#fff', 
          textDecoration: 'none',
          borderRadius: '5px'
        }}
      >
        Join Public Chat
      </Link>
    </div>
  );
};

export default DevelopersList;
