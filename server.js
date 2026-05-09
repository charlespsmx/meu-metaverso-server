const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Serve os arquivos da pasta /public
app.use(express.static(path.join(__dirname, 'public')));

const players = {};

io.on('connection', (socket) => {
    console.log(`[+] Jogador conectado: ${socket.id}`);

    socket.on('join', (data) => {
        players[socket.id] = {
            id: socket.id,
            name: data.name,
            x: Math.random() * 6 - 3, // Spawn aleatório perto do centro
            z: Math.random() * 6 - 3,
            ry: 0
        };

        // Envia jogadores existentes para o novo cliente
        socket.emit('currentPlayers', players);
        // Avisa os outros que alguém entrou
        socket.broadcast.emit('playerJoined', players[socket.id]);
    });

    socket.on('move', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].z = data.z;
            players[socket.id].ry = data.ry;
            socket.broadcast.emit('playerMoved', {
                id: socket.id,
                x: data.x,
                z: data.z,
                ry: data.ry
            });
        }
    });

    socket.on('chat', (msg) => {
        if (players[socket.id]) {
            io.emit('chatMessage', { name: players[socket.id].name, msg: msg });
        }
    });

    socket.on('disconnect', () => {
        console.log(`[-] Jogador desconectado: ${socket.id}`);
        if (players[socket.id]) {
            socket.broadcast.emit('playerDisconnected', socket.id);
            delete players[socket.id];
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🌐 Servidor rodando em http://localhost:${PORT}`);
});