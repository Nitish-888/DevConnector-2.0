import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GroupChat = ({ match }) => {
  const { groupId } = match.params;
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');

  useEffect(() => {
    // Fetch group details
    const fetchGroup = async () => {
      const res = await axios.get(`/api/groups/${groupId}`);
      setGroup(res.data);
    };

    // Fetch group messages
    const fetchMessages = async () => {
      const res = await axios.get(`/api/groupMessages/${groupId}`);
      setMessages(res.data);
    };

    fetchGroup();
    fetchMessages();
  }, [groupId]);

  // Handle sending a message
  const sendMessage = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`/api/groupMessages/${groupId}`, { text });
      setText(''); // Clear the input after sending
      // Re-fetch the messages to display the new message
      const res = await axios.get(`/api/groupMessages/${groupId}`);
      setMessages(res.data);
    } catch (err) {
      console.error(err.message);
    }
  };

  return (
    <div>
      {group && (
        <div>
          <h2>{group.name}</h2>
          <p>{group.description}</p>
          <img src={group.profilePicture} alt={group.name} />
        </div>
      )}
      <div>
        {messages.map((msg) => (
          <div key={msg._id}>
            <p>{msg.sender.name}: {msg.text}</p>
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage}>
        <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..." />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default GroupChat;
