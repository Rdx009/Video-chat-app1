const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

app.use(express.static('public'));

let waitingUsers = [];

io.on('connection', (socket) => {
    // Har naye connection par sabko batao kitne log online hain
    io.emit('online-count', io.engine.clientsCount);

    socket.on('join', (data) => {
        waitingUsers = waitingUsers.filter(u => u.socketId !== socket.id);
        const { peerId, gender, filter } = data;
        let matchIndex = -1;

        if (filter === 'girl') {
            matchIndex = waitingUsers.findIndex(u => u.gender === 'female' && u.socketId !== socket.id);
        } else {
            matchIndex = waitingUsers.findIndex(u => u.socketId !== socket.id);
        }

        if (matchIndex !== -1) {
            const match = waitingUsers[matchIndex];
            io.to(match.socketId).emit('matched', peerId);
            socket.emit('matched', match.peerId);
            waitingUsers.splice(matchIndex, 1);
        } else {
            waitingUsers.push({ ...data, socketId: socket.id });
        }
    });

    socket.on('disconnect', () => {
        waitingUsers = waitingUsers.filter(u => u.socketId !== socket.id);
        io.emit('online-count', io.engine.clientsCount);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Live on ${PORT}`));
