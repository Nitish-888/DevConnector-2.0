import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { connect } from 'react-redux';
import { useNavigate } from 'react-router-dom'; // Use navigate instead of useHistory

const NotificationDropdown = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate(); // Use navigate instead of useHistory

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const res = await axios.get('/api/notifications', {
          headers: {
            'x-auth-token': localStorage.getItem('token') // Send token in request
          }
        });

        // Fetch group notifications
        const groupRes = await axios.get('/api/groupNotifications', {
          headers: {
            'x-auth-token': localStorage.getItem('token')
          }
        });

        // Combine notifications from both private and group sources
        const combinedNotifications = [...res.data, ...groupRes.data].sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );

        setNotifications(combinedNotifications);
        setUnreadCount(combinedNotifications.filter(notification => !notification.isRead).length);
      } catch (err) {
        console.error('Error fetching notifications:', err.message);
      }
    };

    fetchNotifications();
  }, [user]);

  // Mark a single notification as read
  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`/api/notifications/${notificationId}`, {}, {
        headers: {
          'x-auth-token': localStorage.getItem('token')
        }
      });
      setNotifications(notifications.map(n => n._id === notificationId ? { ...n, isRead: true } : n));
      setUnreadCount(unreadCount - 1);
    } catch (err) {
      console.error('Error marking notification as read:', err.message);
    }
  };

  // Mark a single group notification as read
  const markGroupNotificationAsRead = async (notificationId) => {
    try {
      await axios.put(`/api/groupNotifications/${notificationId}`, {}, {
        headers: {
          'x-auth-token': localStorage.getItem('token')
        }
      });
      setNotifications(notifications.map(n => n._id === notificationId ? { ...n, isRead: true } : n));
      setUnreadCount(unreadCount - 1);
    } catch (err) {
      console.error('Error marking group notification as read:', err.message);
    }
  };

  // Ensure the roomId is passed when marking room notifications as read
  const markRoomAsRead = async (roomId) => {
    try {
      await axios.put('/api/notifications/mark-as-read', { roomId }, {
        headers: {
          'x-auth-token': localStorage.getItem('token')
        }
      });

      // Mark all notifications for the given room as read in the UI
      setNotifications(notifications.map(n => (n.roomId === roomId ? { ...n, isRead: true } : n)));
      setUnreadCount(notifications.filter(n => !n.isRead).length);
    } catch (err) {
      console.error('Error marking room notifications as read:', err.message);
    }
  };

  const handleNotificationClick = (notification) => {
    console.log("Notification information ", notification)
  // Check if the notification is for a group or private chat
    if (notification.type === 'group_message') {
      markGroupNotificationAsRead(notification._id);  // Mark the group notification as read
      if (notification.groupId) {
        navigate(`/groupChat/${notification.groupId}`);
      }
    } else {
      markAsRead(notification._id);  // Mark the private chat notification as read
      if (notification.roomId) {
        navigate(`/chat/${notification.roomId}`);
      }
    }
  };

  const toggleDropdown = () => {
    const dropdown = document.querySelector('.dropdown-content');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
  };

  return (
    <div style={styles.dropdown}>
      <button style={styles.button} onClick={toggleDropdown}>
        Notifications {unreadCount > 0 && <span style={styles.badge}>{unreadCount}</span>}
      </button>
      <div className="dropdown-content" style={styles.content}>
        {notifications.length > 0 ? (
          notifications.slice(0, 5).map(notification => ( // Limit to 5 most recent
            <div key={notification._id} style={styles.notification}>
              <p style={{ color: 'black' }}>{notification.message?.text || 'New message'}</p>
              <small>{notification.date ? new Date(notification.date).toLocaleString() : ''}</small>
              <div>
                {!notification.isRead && (
                  <button onClick={() => handleNotificationClick(notification)} style={styles.markReadButton}>
                    View & Mark as Read
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <p>No notifications</p>
        )}
      </div>
    </div>
  );
};

const styles = {
  dropdown: {
    position: 'relative',
    display: 'inline-block',
  },
  button: {
    backgroundColor: 'transparent', // Match the navbar style
    color: '#fff',
    padding: '10px 15px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: 'red',
    borderRadius: '50%',
    color: 'white',
    padding: '5px',
    marginLeft: '5px',
  },
  content: {
    display: 'none',
    position: 'absolute',
    backgroundColor: '#f9f9f9',
    minWidth: '300px',
    boxShadow: '0px 8px 16px 0px rgba(0,0,0,0.2)',
    padding: '12px 16px',
    zIndex: 1,
  },
  notification: {
    borderBottom: '1px solid #ddd',
    padding: '10px 0',
    color: 'black',  // Ensure text is black
  },
  markReadButton: {
    backgroundColor: '#28a745',
    color: '#fff',
    border: 'none',
    padding: '5px 10px',
    borderRadius: '3px',
    cursor: 'pointer',
    marginTop: '5px',
  },
};

const mapStateToProps = (state) => ({
  user: state.auth.user,
});

export default connect(mapStateToProps)(NotificationDropdown);
