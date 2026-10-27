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
  room: string;
  currentUserName?: string;
}

const roleColors: Record<string, string> = {
  admin: 'bg-red-500',
  guru: 'bg-amber-500',
  siswa: 'bg-blue-500',
};

function getInitials(name: string) {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export default function OnlineUsers({ room, currentUserName }: OnlineUsersProps) {
  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const roomRef = useRef(room);

  const sendPresence = useCallback(async (action: 'join' | 'leave' | 'heartbeat') => {
    try {
      await fetch('/api/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: roomRef.current, action }),
        keepalive: action === 'leave',
      });
    } catch {
      // abaikan
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(`/api/presence?room=${roomRef.current}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch {
      // abaikan
    }
  }, []);

  useEffect(() => {
    roomRef.current = room;

    // URUTAN KRITIS:
    // 1. Subscribe Pusher DULU supaya event join tidak terlewat
    const channelName = `presence-${room}`;
    const channel = pusherClient.subscribe(channelName);
    channel.bind('presence-update', (data: { users: OnlineUser[] }) => {
      setUsers(data.users || []);
      setIsReady(true);
    });

    // 2. Baru join + fetch (await join dulu baru fetch sebagai fallback)
    const init = async () => {
      await sendPresence('join');
      await fetchUsers();
      setIsReady(true);
    };
    init();

    // 3. Heartbeat setiap 28 detik (TTL Redis = 35 detik)
    heartbeatRef.current = setInterval(() => {
      sendPresence('heartbeat');
    }, 28_000);

    // 4. Leave saat halaman ditutup
    const handleLeave = () => sendPresence('leave');
    window.addEventListener('beforeunload', handleLeave);

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') sendPresence('leave');
      else sendPresence('join');
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      sendPresence('leave');
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      channel.unbind_all();
      pusherClient.unsubscribe(channelName);
      window.removeEventListener('beforeunload', handleLeave);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [room, sendPresence, fetchUsers]);

  // Loading state - selalu tampilkan widget (jangan null)
  if (!isReady) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></span>
        <span className="text-[11px] text-foreground/40">menghubungkan...</span>
      </div>
    );
  }

  const MAX_VISIBLE = 5;
  const visible = users.slice(0, MAX_VISIBLE);
  const overflow = users.length - MAX_VISIBLE;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-foreground/50 font-medium hidden sm:block">Online:</span>

      {users.length > 0 && (
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
                <div
                  className={[
                    'w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold',
                    'border-2 border-surface cursor-pointer select-none transition-transform hover:scale-110',
                    color,
                    isMe ? 'ring-2 ring-offset-1 ring-white/60' : '',
                  ].join(' ')}
                  title={`${user.nama} (${user.role})`}
                >
                  {initials}
                </div>

                {/* Green dot */}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-surface block"></span>

                {/* Tooltip */}
                {showTooltip === user.id && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[100] pointer-events-none">
                    <div className="bg-foreground text-background text-[11px] font-semibold rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg">
                      {user.nama}
                      <span className="ml-1 opacity-60">
                        ({user.role}{isMe ? ' · kamu' : ''})
                      </span>
                      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-foreground" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

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
      )}

      <div className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
        <span className="text-[11px] text-foreground/50">
          {users.length === 0 ? 'hanya kamu' : `${users.length} online`}
        </span>
      </div>
    </div>
  );
}
