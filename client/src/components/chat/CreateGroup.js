import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { connect } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const CreateGroup = ({ user }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [members, setMembers] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDevelopers = async () => {
      try {
        const res = await axios.get('/api/profile');
        setDevelopers(res.data);
      } catch (err) {
        console.error(err.message);
      }
    };

    fetchDevelopers();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    const groupData = { name, description, members: [...members, user._id] };

    try {
      await axios.post('/api/groups', groupData, {
        headers: { 'x-auth-token': localStorage.getItem('token') },
      });
      navigate('/chat');
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleMemberToggle = (developerId) => {
    if (members.includes(developerId)) {
      setMembers(members.filter((id) => id !== developerId));
    } else {
      setMembers([...members, developerId]);
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.contentContainer}>
        <h2 style={styles.title}>Create Group</h2>
        <form onSubmit={onSubmit} style={styles.formContainer}>
          <div style={styles.formInputContainer}>
            <input
              type="text"
              placeholder="Group Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={styles.input}
            />
            <input
              type="text"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={styles.input}
            />
          </div>
          <div style={styles.membersContainer}>
            <h3 style={styles.subTitle}>Select Members</h3>
            <ul style={styles.memberList}>
              {developers.map((developer) =>
                developer.user._id !== user._id ? (
                  <li key={developer.user._id} style={styles.memberItem}>
                    <label style={styles.memberLabel}>
                      <input
                        type="checkbox"
                        checked={members.includes(developer.user._id)}
                        onChange={() => handleMemberToggle(developer.user._id)}
                        style={styles.checkbox}
                      />
                      {developer.user.name}
                    </label>
                  </li>
                ) : null
              )}
            </ul>
          </div>
          <button type="submit" style={styles.button}>Create Group</button>
        </form>
      </div>
    </div>
  );
};

// Styling objects for the CreateGroup component
const styles = {
  pageContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    minHeight: '100vh',
    paddingTop: '100px', // Space for navbar
    backgroundColor: '#f0f0f0',
  },
  contentContainer: {
    backgroundColor: '#ffffff',
    padding: '30px',
    borderRadius: '10px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    width: '500px',
  },
  title: {
    textAlign: 'center',
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '20px',
  },
  formContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formInputContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  input: {
    padding: '12px',
    fontSize: '16px',
    borderRadius: '5px',
    border: '1px solid #ccc',
  },
  membersContainer: {
    padding: '15px',
    backgroundColor: '#f9f9f9',
    borderRadius: '5px',
  },
  subTitle: {
    fontSize: '18px',
    color: '#555',
    marginBottom: '10px',
  },
  memberList: {
    listStyleType: 'none',
    padding: 0,
    margin: 0,
  },
  memberItem: {
    marginBottom: '10px',
  },
  memberLabel: {
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
  },
  checkbox: {
    marginRight: '10px',
  },
  button: {
    padding: '15px',
    fontSize: '16px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    textAlign: 'center',
  },
};

const mapStateToProps = (state) => ({
  user: state.auth.user,
});

export default connect(mapStateToProps)(CreateGroup);
