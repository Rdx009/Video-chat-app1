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
        let matchIndex = waitingUsers.findIndex(u => (filter === 'girl' ? u.gender === 'female' : true) && u.socketId !== socket.id);

        if (matchIndex !== -1) {
            const partner = waitingUsers[matchIndex];
            waitingUsers.splice(matchIndex, 1);
            io.to(socket.id).emit('matched', { partnerPeerId: partner.peerId, role: 'initiator', partnerSocketId: partner.socketId });
            io.to(partner.socketId).emit('matched', { partnerPeerId: peerId, role: 'receiver', partnerSocketId: socket.id });
        } else {
            waitingUsers.push({ ...data, socketId: socket.id });
        }
    });

    // Message forward karne ke liye
    socket.on('send-msg', ({ to, msg }) => {
        io.to(to).emit('receive-msg', msg);
    });

    socket.on('disconnect', () => {
        waitingUsers = waitingUsers.filter(u => u.socketId !== socket.id);
        io.emit('online-count', io.engine.clientsCount);
    });
});

server.listen(process.env.PORT || 3000);
