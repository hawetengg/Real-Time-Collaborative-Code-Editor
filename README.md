# Real-Time Collaborative Code Editor

A full-stack web application that lets multiple developers write and edit code together in real time — think Google Docs, but for code. Built with Next.js, Socket.io, Monaco Editor (the engine that powers VS Code), and PostgreSQL.

🌐 **Live Demo:** [real-time-collaborative-code-editor-neon.vercel.app](https://real-time-collaborative-code-editor-neon.vercel.app)

---

## Features

- **Real-time collaboration** — multiple users see each other's keystrokes instantly via WebSockets
- **Monaco Editor** — the same editor engine used by VS Code, with full syntax highlighting
- **Multi-language support** — JavaScript, TypeScript, Python, Go, Rust
- **Room system** — create rooms, share links, join by URL
- **Room management** — rename and delete rooms (creator only), leave rooms (participants)
- **Email invites** — invite collaborators by email directly from the editor
- **Real-time notifications** — instant notification bell powered by Socket.io; no refresh needed
- **Live typing indicators** — see who is currently typing
- **Connected users display** — avatar circles showing everyone in the room
- **JWT authentication** — secure login and registration with bcrypt password hashing
- **Persistent sessions** — stay logged in across page refreshes

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| Code Editor | Monaco Editor (`@monaco-editor/react`) |
| Real-time | Socket.io (WebSockets) |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL (Neon — serverless cloud) |
| ORM | Prisma |
| Auth | JWT + bcrypt |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
│                                                         │
│   Next.js App (Vercel)                                  │
│   ┌──────────────┐   ┌──────────────┐                  │
│   │  Dashboard   │   │  Room Editor  │                  │
│   │  (rooms,     │   │  Monaco +     │                  │
│   │   notifs)    │   │  Socket.io    │                  │
│   └──────┬───────┘   └──────┬────────┘                 │
│          │ REST API          │ WebSocket                │
└──────────┼───────────────────┼──────────────────────────┘
           │                   │
┌──────────▼───────────────────▼──────────────────────────┐
│              Express + Socket.io (Render)                │
│                                                         │
│   REST Routes:          Socket Events:                  │
│   /api/auth             join-room                       │
│   /api/rooms            code-change                     │
│   /api/notifications    user-typing                     │
│                         disconnect                      │
└──────────────────────────┬──────────────────────────────┘
                           │ Prisma ORM
                ┌──────────▼──────────┐
                │  PostgreSQL (Neon)  │
                │  User, Room,        │
                │  Document,          │
                │  RoomParticipant,   │
                │  Notification       │
                └─────────────────────┘
```

---

## How It Works

### Real-Time Code Sync
When a user types in the Monaco Editor, a `code-change` event is emitted via Socket.io to the backend. The backend saves the latest code to the `Document` table and broadcasts it to every other user in the same room. All collaborators see changes instantly without polling.

### Room State on Join
When a user joins a room, the backend sends a `room-state` event containing the current code and the list of connected users. Latecomers see the latest state immediately.

### Real-Time Notifications
When a room creator sends an email invite, the backend:
1. Creates a `Notification` record in the database
2. Uses `io.fetchSockets()` to find the receiver's active socket by their `userId`
3. Emits a `new-notification` event directly to that socket

The receiver's notification bell updates instantly — no polling, no refresh.

### Auth Flow
- Passwords are hashed with bcrypt before storing
- On login/register, the server returns a JWT
- The frontend stores both the JWT and the user object in `localStorage`
- Every API request includes the JWT in the `Authorization: Bearer <token>` header

---

## Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL running locally (or a Neon connection string)

### 1. Clone the repo

```bash
git clone https://github.com/hawetengg/Real-Time-Collaborative-Code-Editor.git
cd Real-Time-Collaborative-Code-Editor
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file in `/backend`:

```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/collab_editor"
JWT_SECRET="your-secret-key"
PORT=5000
```

Run Prisma migrations:

```bash
npx prisma migrate deploy
npx prisma generate
```

Start the backend:

```bash
npm run dev
```

### 3. Frontend setup

```bash
cd ../frontend
npm install
```

Create a `.env.local` file in `/frontend`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

### Backend

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for signing JWTs |
| `PORT` | Port to run the server on (default: 5000) |

### Frontend

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend REST API base URL |
| `NEXT_PUBLIC_SOCKET_URL` | Backend WebSocket URL |

---

## API Reference

### Auth — `/api/auth`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Create a new account |
| POST | `/login` | Log in, returns JWT |

### Rooms — `/api/rooms`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Get all rooms for logged-in user |
| POST | `/create` | Create a new room |
| GET | `/:id` | Get a room (auto-joins as participant) |
| PATCH | `/:id` | Rename a room (creator only) |
| DELETE | `/:id` | Delete a room (creator only) |
| DELETE | `/:id/leave` | Leave a room (participants only) |

### Notifications — `/api/notifications`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Get pending notifications |
| POST | `/invite` | Send an email invite |
| POST | `/:id/accept` | Accept an invite, joins the room |
| POST | `/:id/decline` | Decline an invite |

---

## Socket Events

| Event | Direction | Description |
|---|---|---|
| `join-room` | Client → Server | Join a room |
| `room-state` | Server → Client | Current code + users list |
| `code-change` | Client → Server | User typed; sends new code |
| `code-updated` | Server → Client | Broadcast new code to others |
| `user-typing` | Client → Server | User is typing |
| `user-typing` | Server → Client | Broadcast typing indicator |
| `user-left` | Server → Client | A user disconnected |
| `new-notification` | Server → Client | Real-time invite notification |

---

## Project Structure

```
Real-Time-Collaborative-Code-Editor/
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── page.tsx              # Login / Register
│       │   ├── dashboard/page.tsx    # Room list + notification bell
│       │   └── room/[id]/page.tsx    # Monaco editor + real-time collab
│       ├── context/
│       │   └── AuthContext.tsx       # JWT + user state
│       └── lib/
│           ├── api.ts                # Universal fetch utility
│           └── socket.ts             # Socket factory
└── backend/
    ├── src/
    │   ├── index.ts                  # Express + Socket.io server
    │   ├── middleware/auth.ts        # JWT verification
    │   ├── routes/
    │   │   ├── auth.ts
    │   │   ├── rooms.ts
    │   │   └── notifications.ts
    │   └── socket/handlers.ts        # WebSocket event handlers
    └── prisma/schema.prisma          # Database models
```

---

