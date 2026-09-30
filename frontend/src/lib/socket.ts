import { io, Socket } from 'socket.io-client'

export function createSocket(): Socket {
  return io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
    transports: ['websocket'],
    autoConnect: false,
  })
}