const express = require('express');
const connectDB = require('./config/db');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const Message = require('./models/Message'); // Import Message model

const app = express();

// Connect Database
connectDB();

// Init Middleware
app.use(express.json());

app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/posts', require('./routes/api/posts'));
app.use('/api/messages', require('./routes/api/messages'));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Store rooms and connections
const rooms = {};

// Join a room function
const joinRoom = (ws, room) => {
  if (!rooms[room]) {
    rooms[room] = [];
  }
  rooms[room].push(ws);
  console.log(`User joined room: ${room}`);
};

// Leave a room function
const leaveRoom = (ws, room) => {
  if (rooms[room]) {
    rooms[room] = rooms[room].filter(client => client !== ws);
    if (rooms[room].length === 0) {
      delete rooms[room];
    }
  }
  console.log(`User left room: ${room}`);
};

// Listen for WebSocket connections
wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  
  let currentRoom = '';

  // Listen for messages from the client
  ws.on('message', async (message) => {
    const parsedMessage = JSON.parse(message);

    switch (parsedMessage.type) {
      case 'join':
        currentRoom = parsedMessage.room;
        joinRoom(ws, currentRoom);
        break;
      case 'leave':
        leaveRoom(ws, currentRoom);
        currentRoom = '';
        break;
      case 'message':
        const { senderId, text } = parsedMessage;
        if (!senderId || !text) {
          console.log('Missing senderId or text');
          return;
        }
        console.log(`Message from ${senderId} in ${currentRoom}:`, text);

        // Store the message in MongoDB
        const newMessage = new Message({
          roomId: currentRoom,
          sender: senderId,
          text: text,
        });

        try {
          await newMessage.save(); // Save the message to the database
          console.log('Message saved to the database');
        } catch (error) {
          console.error('Error saving message to the database:', error.message);
        }

        // Broadcast the message to all clients in the room
        if (rooms[currentRoom]) {
          rooms[currentRoom].forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ message: text, senderId }));
            }
          });
        }
        break;
      default:
        console.log('Unknown message type:', parsedMessage.type);
    }
  });

  ws.on('close', () => {
    leaveRoom(ws, currentRoom);
    console.log('Client disconnected');
  });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
