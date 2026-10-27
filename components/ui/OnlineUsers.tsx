'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { pusherClient } from '@/lib/pusher';

interface OnlineUser {
  id: string;
  nama: string;
  role: string;
  joinedAt: number;
}

interface OnlineUsersProps {
  /** Nama unik room, contoh: "materi-abc123" */
  room: string;
  /** Nama user yang sedang login (kamu sendiri) — untuk highlight */
  currentUserName?: string;
}

// Warna avatar berdasarkan role
const roleColors: Record<string, string> = {
  admin: 'bg-red-500',
  guru: 'bg-amber-500',
  siswa: 'bg-primary-500',
};

// Inisial dari nama
function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export default function OnlineUsers({ room, currentUserName }: OnlineUsersProps) {
  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  const sendPresence = useCallback(async (action: 'join' | 'leave' | 'heartbeat') => {
    try {
      await fetch('/api/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room, action }),
      });
    } catch {
      // Abaikan error network
    }
  }, [room]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`/api/presence?room=${room}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch {
      // Abaikan error network
    }
  }, [room]);

  useEffect(() => {
    // 1. Join saat halaman dibuka
    sendPresence('join');
    fetchUsers();

    // 2. Subscribe Pusher untuk update real-time
    const channelName = `presence-${room}`;
    const channel = pusherClient.subscribe(channelName);
    channel.bind('presence-update', (data: { users: OnlineUser[] }) => {
      setUsers(data.users || []);
    });

    // 3. Heartbeat setiap 30 detik agar tidak di-expire Redis
    heartbeatRef.current = setInterval(() => {
      sendPresence('heartbeat');
    }, 30_000);

    // 4. Leave saat halaman ditutup / navigasi pergi
    const handleLeave = () => sendPresence('leave');
    window.addEventListener('beforeunload', handleLeave);

    return () => {
      sendPresence('leave');
      clearInterval(heartbeatRef.current!);
      pusherClient.unsubscribe(channelName);
      window.removeEventListener('beforeunload', handleLeave);
    };
  }, [room, sendPresence, fetchUsers]);

  if (users.length === 0) return null;

  // Tampilkan maks 5 avatar, sisanya "+N"
  const MAX_VISIBLE = 5;
  const visible = users.slice(0, MAX_VISIBLE);
  const overflow = users.length - MAX_VISIBLE;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-foreground/50 font-medium hidden sm:block">Online:</span>

      {/* Avatar stack */}
      <div className="flex items-center">
        {visible.map((user, i) => {
          const isMe = user.nama === currentUserName;
          const color = roleColors[user.role] || 'bg-gray-500';
          const initials = getInitials(user.nama);

          return (
            <div
              key={user.id}
              className="relative"
              style={{ marginLeft: i > 0 ? '-8px' : 0, zIndex: visible.length - i }}
              onMouseEnter={() => setShowTooltip(user.id)}
              onMouseLeave={() => setShowTooltip(null)}
            >
              {/* Avatar */}
              <div
                className={`
                  w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold
                  border-2 border-surface cursor-pointer select-none
                  transition-transform hover:scale-110 hover:z-50
                  ${color}
                  ${isMe ? 'ring-2 ring-offset-1 ring-primary-400' : ''}
                `}
                title={`${user.nama} (${user.role})`}
              >
                {initials}
              </div>

              {/* Online dot */}
              <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-400 rounded-full border border-surface"></span>

              {/* Tooltip */}
              {showTooltip === user.id && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
                  <div className="bg-foreground text-background text-[11px] font-semibold rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg">
                    {user.nama}
                    <span className="ml-1 opacity-60">
                      ({user.role}{isMe ? ' · kamu' : ''})
                    </span>
                    {/* Arrow */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-foreground" />
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Overflow badge */}
        {overflow > 0 && (
          <div
            className="w-7 h-7 rounded-full bg-foreground/15 text-foreground text-[10px] font-bold flex items-center justify-center border-2 border-surface cursor-default select-none"
            style={{ marginLeft: '-8px' }}
            title={`${overflow} orang lainnya`}
          >
            +{overflow}
          </div>
        )}
      </div>

      {/* Jumlah online */}
      <div className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
        <span className="text-[11px] text-foreground/50">
          {users.length} online
        </span>
      </div>
    </div>
  );
}
