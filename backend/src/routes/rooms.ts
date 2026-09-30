import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { verifyToken } from '../middleware/auth.js'
import type { Request, Response } from 'express'

const router = Router()
const prisma = new PrismaClient()

interface AuthRequest extends Request {
  userId?: string
}

router.post('/create', verifyToken as any, async (req: AuthRequest, res) => {
  try {
    const { name, language } = req.body
    const userId = req.userId!

    const code = Math.random().toString(36).substring(2, 8).toUpperCase()

    const room = await prisma.room.create({
      data: {
        name,
        language: language || 'javascript',
        code,
        creatorId: userId
      }
    })

    await prisma.roomParticipant.create({
      data: {
        userId,
        roomId: room.id
      }
    })

    res.json({ room, code })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to create room' })
  }
})

router.post('/join', verifyToken as any, async (req: AuthRequest, res) => {
  try {
    const { code } = req.body
    const userId = req.userId!

    const room = await prisma.room.findUnique({
      where: { code }
    })

    if (!room) {
      return res.status(404).json({ error: 'Room not found' })
    }

    const existingParticipant = await prisma.roomParticipant.findUnique({
      where: {
        userId_roomId: {
          userId,
          roomId: room.id
        }
      }
    })

    if (existingParticipant) {
      return res.status(400).json({ error: 'Already in this room' })
    }

    await prisma.roomParticipant.create({
      data: {
        userId,
        roomId: room.id
      }
    })

    const document = await prisma.document.findUnique({
      where: { roomId: room.id }
    })

    res.json({ room, document })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to join room' })
  }
})

router.patch('/:id', verifyToken as any, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const { name } = req.body
    const userId = req.userId!

    const room = await prisma.room.findUnique({ where: { id } })

    if (!room) {
      return res.status(404).json({ error: 'Room not found' })
    }
    
    if (room.creatorId !== userId && room.creatorId !== '') {
      return res.status(403).json({ error: 'Only the creator can delete this room' })
    }

    const updated = await prisma.room.update({
      where: { id },
      data: { name }
    })

    res.json(updated)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to rename room' })
  }
})

router.delete('/:id', verifyToken as any, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const userId = req.userId!

    const room = await prisma.room.findUnique({ where: { id } })

    if (!room) {
      return res.status(404).json({ error: 'Room not found' })
    }
    
    if (room.creatorId !== userId && room.creatorId !== '') {
      return res.status(403).json({ error: 'Only the creator can rename this room' })
    }

    // Delete in order: document first, then participants, then room
    await prisma.document.deleteMany({ where: { roomId: id } })
    await prisma.roomParticipant.deleteMany({ where: { roomId: id } })
    await prisma.room.delete({ where: { id } })

    res.json({ message: 'Room deleted' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to delete room' })
  }
})

router.get('/:id', verifyToken as any, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const userId = req.userId!

    const room = await prisma.room.findUnique({
      where: { id },
      include: { participants: true, document: true }
    })

    if (!room) {
      return res.status(404).json({ error: 'Room not found' })
    }

    const isParticipant = room.participants.some((p: any) => p.userId === userId)

    if (!isParticipant) {
      await prisma.roomParticipant.create({
        data: { userId, roomId: room.id }
      })
    }

    res.json(room)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to get room' })
  }
})

router.get('/', verifyToken as any, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!

    const participations = await prisma.roomParticipant.findMany({
      where: { userId },
      include: { room: true }
    })

    const rooms = participations.map((p: any) => p.room)

    res.json(rooms)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to get rooms' })
  }
})

export default router