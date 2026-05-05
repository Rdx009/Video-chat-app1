const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

app.use(express.static('public'));

let waitingUsers = [];
let reports = {}; // PeerID -> Count

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        // Purana session saaf karo
        waitingUsers = waitingUsers.filter(u => u.socketId !== socket.id);

        const { peerId, gender, filter } = data;

        // Banned check (3 reports = temporary ban)
        if (reports[peerId] >= 3) {
            socket.emit('banned', 'You are banned for bad behavior.');
            return;
        }

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

    socket.on('report-user', (id) => {
        reports[id] = (reports[id] || 0) + 1;
        console.log(`User ${id} reported ${reports[id]} times`);
    });

    socket.on('disconnect', () => {
        waitingUsers = waitingUsers.filter(u => u.socketId !== socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server on port ${PORT}`));
