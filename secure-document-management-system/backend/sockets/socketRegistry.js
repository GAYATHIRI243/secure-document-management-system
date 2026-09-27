// Holds a reference to the live Socket.IO instance so any service/controller
// can emit events without creating circular require() chains.
let ioInstance = null;

const setIO = (io) => {
  ioInstance = io;
};

const getIO = () => ioInstance;

module.exports = { setIO, getIO };
