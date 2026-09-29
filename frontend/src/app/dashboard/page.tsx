"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";

interface Room {
  id: string;
  name: string;
  language: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { user, token, logout, isLoading } = useAuth();
  const router = useRouter();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomsError, setRoomsError] = useState<string | null>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomLanguage, setNewRoomLanguage] = useState("javascript");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !token) {
      router.push("/");
    }
  }, [isLoading, token, router]);

  useEffect(() => {
    if (!token) return;

    const fetchRooms = async () => {
      try {
        const data = await apiFetch("/rooms", token);
        setRooms(data);
      } catch (err: any) {
        setRoomsError(err.message);
      } finally {
        setRoomsLoading(false);
      }
    };

    fetchRooms();
  }, [token]);

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;
    setCreating(true);
    setCreateError(null);

    try {
      const data = await apiFetch("/rooms/create", token, {
        method: "POST",
        body: JSON.stringify({ name: newRoomName, language: newRoomLanguage }),
      });
      setRooms((prev) => [data.room, ...prev]);
      setNewRoomName("");
      setShowCreateForm(false);
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleCopyLink = (roomId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`);
    setCopiedId(roomId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">CodeSync</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{user?.email}</span>
          <button
            onClick={logout}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">Your rooms</h2>
            <p className="text-gray-400 text-sm mt-1">
              Each room is a live collaborative coding session
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm((prev) => !prev)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {showCreateForm ? "Cancel" : "New room"}
          </button>
        </div>

        {showCreateForm && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">
              Create a new room
            </h3>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Room name"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={newRoomLanguage}
                onChange={(e) => setNewRoomLanguage(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
              </select>
              {createError && (
                <p className="text-red-400 text-sm">{createError}</p>
              )}
              <button
                onClick={handleCreateRoom}
                disabled={creating}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {creating ? "Creating..." : "Create room"}
              </button>
            </div>
          </div>
        )}

        {roomsLoading && (
          <p className="text-gray-500 text-sm">Fetching your rooms...</p>
        )}

        {roomsError && (
          <p className="text-red-400 text-sm">
            Failed to load rooms: {roomsError}
          </p>
        )}

        {!roomsLoading && !roomsError && rooms.length === 0 && (
          <div className="text-center py-20 text-gray-600">
            <p className="text-lg">No rooms yet</p>
            <p className="text-sm mt-1">
              Create one above to start coding with others
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-5 flex items-center justify-between hover:border-gray-700 transition-colors"
            >
              <div>
                <p className="font-medium">{room.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {room.language} · Created{" "}
                  {new Date(room.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleCopyLink(room.id)}
                  className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {copiedId === room.id ? "Copied!" : "Copy link"}
                </button>
                <button
                  onClick={() => router.push(`/room/${room.id}`)}
                  className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                >
                  Join
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
