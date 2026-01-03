import { io } from 'socket.io-client';

let socket = null;

export const initSocket = () => {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL, {
      autoConnect: false
    });
  }
  return socket;
};

export const getSocket = () => socket;

export const connectSocket = () => {
  if (socket && !socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
};