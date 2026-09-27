const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { setIO } = require('./socketRegistry');

// Tracks which admin sockets are connected so we could target them specifically
// if needed; currently events are broadcast to everyone, and the frontend
// filters by role.
const initSocket = (io) => {
  setIO(io);

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(); // allow anonymous viewers of public counts if ever needed
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      socket.user = user || null;
      next();
    } catch (error) {
      next(); // treat invalid token as anonymous rather than hard-failing the socket
    }
  });

  io.on('connection', (socket) => {
    const label = socket.user ? socket.user.name : 'anonymous';
    console.log(`[Socket.IO] Client connected: ${socket.id} (${label})`);

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });
};

module.exports = initSocket;
