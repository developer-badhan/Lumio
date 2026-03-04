import { io } from 'socket.io-client';

// Socket URL 
const SOCKET_URL = 'http://localhost:3000';

// Credentials
export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
});