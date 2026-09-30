import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import roomRoutes from './routes/rooms.js'
import setupSocketHandlers from './socket/handlers.js'

dotenv.config()

const app = express()
const httpServer = createServer(app)

const allowedOrigins = [
  'http://localhost:3000',
  'https://real-time-collaborative-code-editor-neon.vercel.app'
]

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
})

app.use(cors({ origin: allowedOrigins }))
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/rooms', roomRoutes)

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', message: 'Server is running' })
})

setupSocketHandlers(io)

const PORT = process.env['PORT'] || 5000
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

export { io }