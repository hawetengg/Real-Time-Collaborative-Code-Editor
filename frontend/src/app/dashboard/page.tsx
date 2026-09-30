"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { createSocket } from "@/lib/socket";

interface Room {
  id: string;
  name: string;
  language: string;
  createdAt: string;
  creatorId: string;
  invitedBy: string | null;
}

interface Notification {
  id: string;
  type: string;
  status: string;
  room: { id: string; name: string; language: string };
  sender: { id: string; name: string; email: string };
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

  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    if (!isLoading && !token) {
      router.push("/");
    }
  }, [isLoading, token, router]);

  useEffect(() => {
    if (!token) return;
    setRoomsLoading(true);
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
  }, [token, isLoading]);

  useEffect(() => {
    if (!token) return;
    const fetchNotifications = async () => {
      try {
        const data = await apiFetch("/notifications", token);
        setNotifications(data);
      } catch (err: any) {
        console.error(err);
      }
    };
    fetchNotifications();
  }, [token]);

  useEffect(() => {
    if (!token || !user) return;

    socketRef.current = createSocket();
    const socket = socketRef.current;

    socket.on("connect", () => {
      socket.data = { userId: user.id };
    });

    socket.on("new-notification", (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    socket.connect();

    return () => {
      socket.off("new-notification");
      socket.disconnect();
    };
  }, [token, user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target as Node)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const handleRename = async (roomId: string) => {
    if (!editingName.trim()) return;
    setRenaming(true);
    try {
      const updated = await apiFetch(`/rooms/${roomId}`, token, {
        method: "PATCH",
        body: JSON.stringify({ name: editingName }),
      });
      setRooms((prev) =>
        prev.map((r) => (r.id === roomId ? { ...r, name: updated.name } : r)),
      );
      setEditingRoomId(null);
      setEditingName("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRenaming(false);
    }
  };

  const handleDelete = async (roomId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this room? This cannot be undone.",
      )
    )
      return;
    setDeletingId(roomId);
    try {
      await apiFetch(`/rooms/${roomId}`, token, { method: "DELETE" });
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleLeave = async (roomId: string) => {
    if (!confirm("Are you sure you want to leave this room?")) return;
    try {
      await apiFetch(`/rooms/${roomId}/leave`, token, { method: "DELETE" });
      setRooms((prev) => prev.filter((r) => r.id !== roomId));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAccept = async (notification: Notification) => {
    try {
      await apiFetch(`/notifications/${notification.id}/accept`, token, {
        method: "POST",
      });
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      const roomData = await apiFetch(`/rooms/${notification.room.id}`, token);
      setRooms((prev) => {
        const exists = prev.find((r) => r.id === roomData.id);
        if (exists) return prev;
        return [roomData, ...prev];
      });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDecline = async (notificationId: string) => {
    try {
      await apiFetch(`/notifications/${notificationId}/decline`, token, {
        method: "POST",
      });
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (err: any) {
      alert(err.message);
    }
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

          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications((prev) => !prev)}
              className="relative text-gray-400 hover:text-white transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full text-xs flex items-center justify-center text-white">
                  {notifications.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-8 w-80 bg-gray-900 border border-gray-800 rounded-xl shadow-xl z-50">
                <div className="px-4 py-3 border-b border-gray-800">
                  <p className="text-sm font-semibold">Notifications</p>
                </div>
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-gray-500 text-sm">
                    No pending invites
                  </div>
                ) : (
                  <div className="divide-y divide-gray-800 max-h-80 overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className="px-4 py-3">
                        <p className="text-sm text-white">
                          <span className="font-medium">{n.sender.name}</span>{" "}
                          invited you to{" "}
                          <span className="font-medium">{n.room.name}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {n.room.language}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleAccept(n)}
                            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-lg transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleDecline(n.id)}
                            className="text-xs text-gray-400 hover:text-white transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

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
              className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-5 hover:border-gray-700 transition-colors"
            >
              {editingRoomId === room.id ? (
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                  <button
                    onClick={() => handleRename(room.id)}
                    disabled={renaming}
                    className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                  >
                    {renaming ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => setEditingRoomId(null)}
                    className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{room.name}</p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          room.language === "javascript"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : room.language === "typescript"
                              ? "bg-blue-500/20 text-blue-400"
                              : room.language === "python"
                                ? "bg-green-500/20 text-green-400"
                                : room.language === "go"
                                  ? "bg-cyan-500/20 text-cyan-400"
                                  : room.language === "rust"
                                    ? "bg-orange-500/20 text-orange-400"
                                    : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {room.language}
                      </span>
                      Created {new Date(room.createdAt).toLocaleDateString()}
                      {room.invitedBy && (
                        <span className="text-gray-600">
                          · Invited by {room.invitedBy}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleCopyLink(room.id)}
                      className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {copiedId === room.id ? "Copied!" : "Copy link"}
                    </button>
                    {room.creatorId === user?.id ? (
                      <>
                        <button
                          onClick={() => {
                            setEditingRoomId(room.id);
                            setEditingName(room.name);
                          }}
                          className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                        >
                          Rename
                        </button>
                        <button
                          onClick={() => handleDelete(room.id)}
                          disabled={deletingId === room.id}
                          className="text-sm text-red-500 hover:text-red-400 transition-colors"
                        >
                          {deletingId === room.id ? "Deleting..." : "Delete"}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleLeave(room.id)}
                        className="text-sm text-red-500 hover:text-red-400 transition-colors"
                      >
                        Leave
                      </button>
                    )}
                    <button
                      onClick={() => router.push(`/room/${room.id}`)}
                      className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                    >
                      Join
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
