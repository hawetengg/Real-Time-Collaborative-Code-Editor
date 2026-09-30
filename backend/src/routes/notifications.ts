import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '../middleware/auth.js'
import { io } from '../index.js'
import type { Request } from 'express'

const router = Router()
const prisma = new PrismaClient()

interface AuthRequest extends Request {
  userId?: string
}

// Get all notifications for logged-in user
router.get('/', verifyToken as any, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!

    const notifications = await prisma.notification.findMany({
      where: { receiverId: userId, status: 'pending' },
      include: {
        room: { select: { id: true, name: true, language: true } },
        sender: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(notifications)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to get notifications' })
  }
})

// Send invite
router.post('/invite', verifyToken as any, async (req: AuthRequest, res) => {
  try {
    const { roomId, email } = req.body
    const senderId = req.userId!

    // Find the user to invite
    const receiver = await prisma.user.findUnique({ where: { email } })

    if (!receiver) {
      return res.status(404).json({ error: 'No user found with that email' })
    }

    if (receiver.id === senderId) {
      return res.status(400).json({ error: 'You cannot invite yourself' })
    }

    // Check if already a participant
    const alreadyParticipant = await prisma.roomParticipant.findUnique({
      where: { userId_roomId: { userId: receiver.id, roomId } }
    })

    if (alreadyParticipant) {
      return res.status(400).json({ error: 'User is already in this room' })
    }

    // Check if invite already sent
    const existingInvite = await prisma.notification.findFirst({
      where: { roomId, receiverId: receiver.id, status: 'pending' }
    })

    if (existingInvite) {
      return res.status(400).json({ error: 'Invite already sent to this user' })
    }

    const notification = await prisma.notification.create({
      data: {
        type: 'room_invite',
        roomId,
        senderId,
        receiverId: receiver.id
      },
      include: {
        room: { select: { id: true, name: true, language: true } },
        sender: { select: { id: true, name: true, email: true } }
      }
    })

    // Emit real-time notification to receiver if they're online
    const sockets = await io.fetchSockets()
    const receiverSocket = sockets.find((s: any) => s.data.userId === receiver.id)
    if (receiverSocket) {
      receiverSocket.emit('new-notification', notification)
    }

    res.json(notification)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to send invite' })
  }
})

// Accept invite
router.post('/:id/accept', verifyToken as any, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const userId = req.userId!

    const notification = await prisma.notification.findUnique({ where: { id } })

    if (!notification || notification.receiverId !== userId) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    // Add as participant
    await prisma.roomParticipant.upsert({
      where: { userId_roomId: { userId, roomId: notification.roomId } },
      update: {},
      create: { userId, roomId: notification.roomId }
    })

    // Update notification status
    await prisma.notification.update({
      where: { id },
      data: { status: 'accepted' }
    })

    res.json({ message: 'Invite accepted' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to accept invite' })
  }
})

// Decline invite
router.post('/:id/decline', verifyToken as any, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const userId = req.userId!

    const notification = await prisma.notification.findUnique({ where: { id } })

    if (!notification || notification.receiverId !== userId) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    await prisma.notification.update({
      where: { id },
      data: { status: 'declined' }
    })

    res.json({ message: 'Invite declined' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to decline invite' })
  }
})

export default router