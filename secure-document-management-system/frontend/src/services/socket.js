import { io } from 'socket.io-client';
import { API_BASE_URL } from './api';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    const token = localStorage.getItem('sdms_token');
    socket = io(API_BASE_URL, {
      auth: { token },
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
