import { Server, Socket } from 'socket.io'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface JoinRoomData {
  roomId: string
  userId: string
  name: string
  token: string
}

interface CodeChangeData {
  roomId: string
  code: string
  version: number
}

export const setupSocketHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`)

    socket.on('join-room', async (data: JoinRoomData) => {
      try {
        const { roomId, userId, name } = data

        // Add user as participant if not already
        await prisma.roomParticipant.upsert({
          where: {
            userId_roomId: { userId, roomId }
          },
          update: {},
          create: { userId, roomId }
        })

        // Join the socket room
        socket.join(roomId)

        // Get or create document for this room
        let document = await prisma.document.findUnique({
          where: { roomId }
        })

        if (!document) {
          document = await prisma.document.create({
            data: {
              roomId,
              content: '',
              version: 0,
              userId
            }
          })
        }

        // Get all connected users in this room
        // Store user info on socket FIRST
        socket.data.userId = userId
        socket.data.name = name
        socket.data.roomId = roomId
        
        // NOW get all connected users including this one
        const sockets = await io.in(roomId).fetchSockets()
        const users = sockets
        .filter((s: any) => s.data.userId)
        .map((s: any) => ({
          userId: s.data.userId,
          name: s.data.name
        }))

// Send current state to this user
socket.emit('room-state', {
  code: document.content,
  users
})

        // Tell everyone else this user joined
        socket.to(roomId).emit('user-joined', {
          userId,
          name
        })

        console.log(`User ${userId} joined room ${roomId}`)
      } catch (error) {
        console.error(error)
        socket.emit('error', { message: 'Failed to join room' })
      }
    })

    socket.on('code-change', async (data: CodeChangeData) => {
      try {
        const { roomId, code } = data

        // Get or create document
        let document = await prisma.document.findUnique({
          where: { roomId }
        })

        if (!document) {
          socket.emit('error', { message: 'Document not found' })
          return
        }

        // Update document in database
        await prisma.document.update({
          where: { roomId },
          data: {
            content: code,
            version: document.version + 1,
            userId: socket.data.userId
          }
        })

        // Broadcast to everyone ELSE in the room (not sender)
        socket.to(roomId).emit('code-updated', { code })

        console.log(`Code updated in room ${roomId}`)
      } catch (error) {
        console.error(error)
        socket.emit('error', { message: 'Failed to update code' })
      }
    })

    socket.on('user-typing', (data: { roomId: string; name: string }) => {
      const { roomId, name } = data
      socket.to(roomId).emit('user-typing', { name })
    })

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`)
      const { userId, roomId } = socket.data
      if (roomId && userId) {
        socket.to(roomId).emit('user-left', { userId })
      }
    })
  })
}

export default setupSocketHandlers