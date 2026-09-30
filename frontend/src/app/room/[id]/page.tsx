"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { createSocket } from "@/lib/socket";
import Editor from "@monaco-editor/react";

interface ConnectedUser {
  userId: string;
  name: string;
}

interface RoomData {
  id: string;
  name: string;
  language: string;
}

export default function RoomPage() {
  const { id } = useParams() as { id: string };
  const { user, token, isLoading } = useAuth();
  const router = useRouter();

  const [room, setRoom] = useState<RoomData | null>(null);
  const [code, setCode] = useState("");
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);

  const codeRef = useRef(code);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    if (!isLoading && !token) {
      router.push("/");
    }
  }, [isLoading, token, router]);

  useEffect(() => {
    if (isLoading || !token || !user || !id) return;

    const fetchRoom = async () => {
      try {
        const data = await apiFetch(`/rooms/${id}`, token);
        setRoom(data);
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchRoom();
  }, [token, user, id]);

  useEffect(() => {
    if (isLoading || !token || !user || !id) return;

    socketRef.current = createSocket();
    const socket = socketRef.current;

    socket.on("connect", () => {
      socket.emit("join-room", {
        roomId: id,
        userId: user.id,
        name: user.name,
        token,
      });
    });

    socket.on(
      "room-state",
      (data: { code: string; users: ConnectedUser[] }) => {
        const initialCode = data.code || "// Start coding here...";
        setCode(initialCode);
        codeRef.current = initialCode;
        setConnectedUsers(data.users);
      },
    );

    socket.on("code-updated", (data: { code: string }) => {
      setCode(data.code);
      codeRef.current = data.code;
    });

    socket.on("user-joined", (data: ConnectedUser) => {
      setConnectedUsers((prev) => [...prev, data]);
    });

    socket.on("user-left", (data: { userId: string }) => {
      setConnectedUsers((prev) => prev.filter((u) => u.userId !== data.userId));
      setTypingUsers((prev) => prev.filter((name) => name !== data.userId));
    });

    socket.on("user-typing", (data: { name: string }) => {
      const typingTimers: Record<string, NodeJS.Timeout> = {};

      setTypingUsers((prev) =>
        prev.includes(data.name) ? prev : [...prev, data.name],
      );

      if (typingTimers[data.name]) {
        clearTimeout(typingTimers[data.name]);
      }

      typingTimers[data.name] = setTimeout(() => {
        setTypingUsers((prev) => prev.filter((n) => n !== data.name));
        delete typingTimers[data.name];
      }, 2000);
    });

    socket.connect();

    return () => {
      socket.off("connect");
      socket.off("room-state");
      socket.off("code-updated");
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("user-typing");
      socket.disconnect();
    };
  }, [token, user, id]);

  const handleCodeChange = (value: string | undefined) => {
    if (value === undefined) return;
    setCode(value);
    codeRef.current = value;

    const socket = socketRef.current;
    if (!socket) return;

    socket.emit("code-change", {
      roomId: id,
      code: value,
      version: Date.now(),
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    socket.emit("user-typing", {
      roomId: id,
      name: user?.name,
    });

    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = null;
    }, 1000);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteMessage(null);
    try {
      await apiFetch("/notifications/invite", token, {
        method: "POST",
        body: JSON.stringify({ roomId: id, email: inviteEmail }),
      });
      setInviteMessage("Invite sent!");
      setInviteEmail("");
      setTimeout(() => setInviteMessage(null), 3000);
    } catch (err: any) {
      setInviteMessage(err.message);
    } finally {
      setInviting(false);
    }
  };

  if (isLoading || !room) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Loading room...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-red-400">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-950 text-white flex flex-col overflow-hidden">
      <nav className="border-b border-gray-800 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            ← Rooms
          </button>
          <span className="text-gray-600">|</span>
          <span className="font-medium">{room.name}</span>
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
            {room.language}
          </span>
          <button
            onClick={() => setShowInvite((prev) => !prev)}
            className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded-lg transition-colors"
          >
            {showInvite ? "Cancel" : "Invite"}
          </button>
        </div>

        <div className="flex items-center gap-4">
          {typingUsers.length > 0 && (
            <span className="text-xs text-gray-400 italic">
              {typingUsers.join(", ")} typing...
            </span>
          )}
          <div className="flex items-center gap-2">
            {connectedUsers.map((u) => (
              <div
                key={u.userId}
                title={u.name}
                className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-medium"
              >
                {u.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      </nav>

      {showInvite && (
        <div className="border-b border-gray-800 px-6 py-3 flex items-center gap-3 shrink-0">
          <input
            type="email"
            placeholder="Enter email to invite"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
          />
          <button
            onClick={handleInvite}
            disabled={inviting}
            className="text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg transition-colors"
          >
            {inviting ? "Sending..." : "Send invite"}
          </button>
          {inviteMessage && (
            <span
              className={`text-sm ${inviteMessage === "Invite sent!" ? "text-green-400" : "text-red-400"}`}
            >
              {inviteMessage}
            </span>
          )}
        </div>
      )}

      <div className="flex-1">
        <Editor
          height="100%"
          language={room.language}
          value={code}
          onChange={handleCodeChange}
          theme="vs-dark"
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            tabSize: 2,
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
}
