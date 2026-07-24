import { Server, Socket } from 'socket.io'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface JoinRoomData {
    roomId: string
    userId: string
}

interface CodeChangeData {
    roomId: string
    content: string
    version: number
    userId: string
}

export const setupSocketHandlers = (io: Server) => {
    io.on('connection', (socket: Socket) => {
        console.log(`User connected: ${socket.id}`)

        socket.on('join-room', async (data: JoinRoomData) => {
            try {
                const { roomId, userId } = data

                // Verify user is actually a participant
                const participant = await prisma.roomParticipant.findUnique({
                    where: {
                        userId_roomId: {
                            userId,
                            roomId
                        }
                    }
                })

                if (!participant) {
                    socket.emit('error', { message: 'Not a participant in this room' })
                    return
                }

                // Add socket to the room
                socket.join(roomId)

                // Get current document state
                const document = await prisma.document.findUnique({
                    where: { roomId }
                })

                // Send current state to this user
                socket.emit('document-state', {
                    content: document?.content || '',
                    version: document?.version || 0
                })

                // Broadcast that user joined
                socket.to(roomId).emit('user-joined', {
                    userId,
                    participantCount: (await io.in(roomId).fetchSockets()).length
                })

                console.log(`User ${userId} joined room ${roomId}`)
            } catch (error) {
                console.error(error)
                socket.emit('error', { message: 'Failed to join room' })
            }
        })

        socket.on('code-change', async (data: CodeChangeData) => {
            try {
                const { roomId, content, version, userId } = data

                // Get the current document
                const document = await prisma.document.findUnique({
                    where: { roomId }
                })

                if (!document) {
                    socket.emit('error', { message: 'Document not found' })
                    return
                }

                // Check version match (Operational Transform concept)
                if (version !== document.version) {
                    // Version conflict - send current state back to user
                    socket.emit('version-conflict', {
                        currentContent: document.content,
                        currentVersion: document.version
                    })
                    return
                }

                // Update document
                const updatedDocument = await prisma.document.update({
                    where: { roomId },
                    data: {
                        content,
                        version: document.version + 1,
                        userId
                    }
                })

                // Broadcast change to all users in room
                io.to(roomId).emit('code-updated', {
                    content: updatedDocument.content,
                    version: updatedDocument.version,
                    userId
                })

                console.log(`Document updated in room ${roomId}, version: ${updatedDocument.version}`)
            } catch (error) {
                console.error(error)
                socket.emit('error', { message: 'Failed to update code' })
            }
        })

        socket.on('user-typing', async (data: { roomId: string; userId: string; userName: string }) => {
            try {
                const { roomId, userId, userName } = data

                // Broadcast typing indicator to others in room (not to sender)
                socket.to(roomId).emit('user-typing', {
                    userId,
                    userName
                })
            } catch (error) {
                console.error(error)
            }
        })

        socket.on('disconnect', async () => {
            console.log(`User disconnected: ${socket.id}`)
            // In a real app, you'd track which room they were in and remove them
        })
    })
}

export default setupSocketHandlers