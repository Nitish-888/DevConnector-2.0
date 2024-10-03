const express = require('express');
const connectDB = require('./config/db');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');

const app = express();

// Connect Database
connectDB();

// Init Middleware
app.use(express.json());

// Define Routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/posts', require('./routes/api/posts'));

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

// Listen for WebSocket connections
wss.on('connection', (ws) => {
  console.log('New WebSocket connection');

  // Listen for messages from the client
  ws.on('message', (message) => {
    const decodedMessage = message.toString();
    console.log('Received message:', decodedMessage);

    // Broadcast the message to all connected clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(decodedMessage);
      }
    });
  });

  // Handle client disconnection
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static('client/build'));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
