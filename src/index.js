const path = require('path');
const express = require('express');
const http = require('http');
const port = process.env.port || 3000;
const socket = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages.js');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users.js');

const app = express();
const server = http.createServer(app);
const io = socket(server);

const publicDirPath = path.join(__dirname, '../public');

app.use(express.static(publicDirPath));

io.on('connection', (socket) => {
  console.log('New WebSocket connection: ' + socket.id);

  socket.on('join', ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });
    
    if (error) {
      return callback(error);
    }

    socket.join(user.room);

    io.to(socket.id).emit('message', generateMessage('Admin', `Welcome to ${user.room}!`));
    socket.broadcast
      .to(user.room)
      .emit('message', generateMessage('Admin', `${user.username} has joined the room!`));
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    })
    callback();
  });

  socket.on('sendMessage', (userMessage, callback) => {
    const filter = new Filter();
    const user = getUser(socket.id);

    if (filter.isProfane(userMessage)) {
      return callback('Profanity not allowed.');
    }

    io.to(user.room).emit('message', generateMessage(user.username, userMessage));
    callback();
  });

  socket.on('sendLocation', (location, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit(
      'locationMessage',
      generateLocationMessage(
        user.username,
        `https://google.com/maps?q=${location.latitude},${location.longitude}`
      )
    );
    callback('Location shared!');
  });

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit(
        'message',
        generateMessage('Admin',`${user.username} has left the room!`)
      );
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      })
    }
  });
});

server.listen(port, () => {
  console.log(`listening on port ${port}`);
});
