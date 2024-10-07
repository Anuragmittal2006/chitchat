const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Create Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

// Handle room connections and messaging
io.on('connection', (socket) => {
    console.log('A user connected');

    // Join room logic
    socket.on('joinRoom', ({ roomId, username }) => {
        socket.join(roomId);
        socket.username = username;
        console.log(`${username} joined room: ${roomId}`);

        // Notify the room that a user joined
        socket.to(roomId).emit('message', {
            username: 'System',
            message: `${username} has joined the chat`
        });

        // Send updated user list
        const usersInRoom = Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(id => io.sockets.sockets.get(id).username);
        io.to(roomId).emit('updateUserList', usersInRoom);
    });

    // Message sending
    socket.on('sendMessage', ({ roomId, message, timer }) => { // Include timer here
        io.to(roomId).emit('message', { username: socket.username, message, timer }); // Send timer with message
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// Serve room.html for dynamic room URLs
app.get('/room/:roomId', (req, res) => {
    res.sendFile(path.join(__dirname, 'room.html'));
});

// Serve index.html for any other route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
