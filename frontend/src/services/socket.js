import { io } from 'socket.io-client';

// Socket URL 
const SOCKET_URL = 'http://localhost:3000';

// autoConnect: false — SocketContext will connect manually after
export const socket = io(SOCKET_URL, {
  autoConnect: false,
});