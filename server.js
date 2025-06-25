const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(express.static(path.join(__dirname)))
const server = http.createServer(app);
const io = new Server(server);

let waitingMales = [];
let waitingFemales = [];

io.on('connection', (socket) => {
  console.log("Yeni bağlantı:", socket.id);

  socket.on('setGender', (gender) => {
    socket.gender = gender;

    if (gender === 'male') {
      if (waitingFemales.length > 0) {
        const partner = waitingFemales.shift();
        connectUsers(socket, partner);
      } else {
        waitingMales.push(socket);
        socket.emit('waiting');
      }
    }

    if (gender === 'female') {
      if (waitingMales.length > 0) {
        const partner = waitingMales.shift();
        connectUsers(socket, partner);
      } else {
        waitingFemales.push(socket);
        socket.emit('waiting');
      }
    }
  });

  socket.on('message', (msg) => {
    if (socket.partner) {
      socket.partner.emit('message', msg);
    }
  });

  socket.on('disconnect', () => {
    if (socket.partner) {
      socket.partner.emit('partner_disconnected');
      socket.partner.partner = null;
    }

    if (socket.gender === 'male') {
      waitingMales = waitingMales.filter(s => s.id !== socket.id);
    } else if (socket.gender === 'female') {
      waitingFemales = waitingFemales.filter(s => s.id !== socket.id);
    }
  });
});

function connectUsers(s1, s2) {
  s1.partner = s2;
  s2.partner = s1;
  s1.emit('match');
  s2.emit('match');
}

server.listen(3001, () => {
  console.log("🚀 Sunucu çalışıyor: http://localhost:3001");
});
