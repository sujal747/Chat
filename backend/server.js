const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

// Initialize the app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files (frontend assets)
app.use(express.static(path.join(__dirname, '../frontend')));

// Endpoint for the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html')); // Corrected path
});

// Socket connection for real-time messaging
let waitingUser = null;  // For pairing users

io.on('connection', (socket) => {
  console.log('A user connected');

  // Check if a user is waiting for a pair
  if (waitingUser) {
    // Pair the users
    const user1 = waitingUser;
    const user2 = socket;

    // Notify both users that they are connected in a pair
    user1.emit('pair', { message: 'You are now connected to another user!', pair: 'green' });
    user2.emit('pair', { message: 'You are now connected to another user!', pair: 'red' });

    // Set up messaging between these two users
    user1.on('message', (data) => {
      user2.emit('message', data);
    });
    user2.on('message', (data) => {
      user1.emit('message', data);
    });

    // Reset waitingUser as the pair is created
    waitingUser = null;
  } else {
    // No pair available, so this user is now waiting
    waitingUser = socket;
    socket.emit('waiting', { message: 'You are waiting for a partner!' });
  }

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected');
    if (waitingUser === socket) {
      waitingUser = null; // Clear waitingUser if this user disconnects
    }
  });
});

// Start the server
server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
