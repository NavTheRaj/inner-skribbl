import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'

export function createSocket() {
  return io(SOCKET_URL, {
    autoConnect: false,
  })
}
