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
  console.log("Room ID:", id);
  const { user, token, isLoading } = useAuth();
  const router = useRouter();

  const [room, setRoom] = useState<RoomData | null>(null);
  const [code, setCode] = useState("// Start coding here...");
  const [connectedUsers, setConnectedUsers] = useState<ConnectedUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

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
      console.log(
        "fetchRoom fired, token:",
        token,
        "user:",
        user,
        "id:",
        id,
        "isLoading:",
        isLoading,
      );
      try {
        const data = await apiFetch(`/rooms/${id}`, token);
        console.log("room data:", data);
        setRoom(data);
      } catch (err: any) {
        console.log("fetchRoom error:", err.message);
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
        setCode(data.code);
        codeRef.current = data.code;
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
      setTypingUsers((prev) =>
        prev.includes(data.name) ? prev : [...prev, data.name],
      );
      setTimeout(() => {
        setTypingUsers((prev) => prev.filter((n) => n !== data.name));
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
