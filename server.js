const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

app.use(express.static('public'));

let waitingUsers = [];

io.on('connection', (socket) => {
    io.emit('online-count', io.engine.clientsCount);

    socket.on('join', (data) => {
        waitingUsers = waitingUsers.filter(u => u.socketId !== socket.id);
        const { peerId, gender, filter } = data;

        let matchIndex = -1;
        if (filter === 'girl') {
            matchIndex = waitingUsers.findIndex(u => u.gender === 'female');
        } else {
            matchIndex = waitingUsers.findIndex(u => u.socketId !== socket.id);
        }

        if (matchIndex !== -1) {
            const partner = waitingUsers[matchIndex];
            waitingUsers.splice(matchIndex, 1);

            // Role assign karo: Ek call karega, ek wait karega
            io.to(socket.id).emit('matched', { partnerPeerId: partner.peerId, role: 'initiator' });
            io.to(partner.socketId).emit('matched', { partnerPeerId: peerId, role: 'receiver' });
        } else {
            waitingUsers.push({ ...data, socketId: socket.id });
        }
    });

    socket.on('disconnect', () => {
        waitingUsers = waitingUsers.filter(u => u.socketId !== socket.id);
        io.emit('online-count', io.engine.clientsCount);
    });
});

server.listen(process.env.PORT || 3000);
