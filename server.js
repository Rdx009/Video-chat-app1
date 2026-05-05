const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

app.use(express.static('public'));

let waitingUser = null; // Jo user intezar kar raha hai

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join', (peerId) => {
        // Agar koi pehle se wait kar raha hai aur wo khud nahi hai
        if (waitingUser && waitingUser.socketId !== socket.id) {
            // Match mil gaya!
            io.to(waitingUser.socketId).emit('matched', peerId);
            socket.emit('matched', waitingUser.peerId);
            
            console.log('Match Found!');
            waitingUser = null; // Queue khali kar do
        } else {
            // Koi nahi hai, toh ise waiting mein daal do
            waitingUser = { socketId: socket.id, peerId: peerId };
            console.log('User waiting for match...');
        }
    });

    socket.on('disconnect', () => {
        if (waitingUser && waitingUser.socketId === socket.id) {
            waitingUser = null;
        }
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
