'use client';

import { useState, useEffect, useRef } from 'react';
import { pusherClient } from '@/lib/pusher';

interface OnlineUser {
  id: string;
  nama: string;
  role: string;
}

interface PresenceMember {
  id?: string | number;
  info?: { nama?: string; nama_lengkap?: string; name?: string; role?: string };
}

interface PresenceMembers {
  each?: (callback: (member: PresenceMember) => void) => void;
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

const roleBadgeStyles: Record<string, string> = {
  admin: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
  guru: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  siswa: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
};

function getInitials(name: string) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export default function OnlineUsers({ room, currentUserName }: OnlineUsersProps) {
  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const channelName = `presence-${room}`;
    const channel = pusherClient.subscribe(channelName);
    const toOnlineUser = (member: PresenceMember): OnlineUser => ({
      id: String(member?.id ?? ''),
      nama: String(member?.info?.nama ?? member?.info?.nama_lengkap ?? member?.info?.name ?? 'Pengguna'),
      role: String(member?.info?.role ?? 'siswa'),
    });
    const syncMembers = (members: PresenceMembers) => {
      const nextUsers: OnlineUser[] = [];
      members?.each?.((member) => nextUsers.push(toOnlineUser(member)));
      setUsers(nextUsers);
      setIsReady(true);
    };
    channel.bind('pusher:subscription_succeeded', syncMembers);
    channel.bind('pusher:member_added', (member: PresenceMember) => {
      const user = toOnlineUser(member);
      if (!user.id) return;
      setUsers((current) => current.some((item) => item.id === user.id) ? current : [...current, user]);
    });
    channel.bind('pusher:member_removed', (member: PresenceMember) => {
      setUsers((current) => current.filter((user) => user.id !== String(member?.id ?? '')));
    });
    channel.bind('pusher:subscription_error', () => {
      setUsers([]);
      setIsReady(true);
    });

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(channelName);
    };
  }, [room]);

  // Tutup dropdown jika klik di luar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMore(false);
      }
    }
    if (showMore) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMore]);

  // Loading state
  if (!isReady) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-foreground/5 text-foreground/40 text-xs">
        <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
        <span className="text-[11px]">Menghubungkan...</span>
      </div>
    );
  }

  const MAX_VISIBLE = 4;
  const visible = users.slice(0, MAX_VISIBLE);
  const overflow = users.length - MAX_VISIBLE;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Badge Total Online */}
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-[11px] whitespace-nowrap">
          {`${users.length} Online`}
        </span>
      </div>

      {/* Daftar Nama Pengguna Online */}
      <div className="flex flex-wrap items-center gap-1.5">
        {visible.map((user) => {
          const isMe = user.nama === currentUserName;
          const color = roleColors[user.role] || 'bg-gray-500';
          const roleBadge = roleBadgeStyles[user.role] || 'bg-gray-500/15 text-gray-500 border-gray-500/30';
          const initials = getInitials(user.nama);

          return (
            <div
              key={user.id}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-all ${
                isMe
                  ? 'bg-primary-500/10 border-primary-500/40 text-foreground font-semibold shadow-xs ring-1 ring-primary-500/20'
                  : 'bg-foreground/5 border-border-custom text-foreground font-medium hover:bg-foreground/10'
              }`}
              title={`${user.nama} (${user.role})${isMe ? ' - Anda' : ''}`}
            >
              {/* Avatar inisial dengan warna role */}
              <span
                className={`w-4 h-4 rounded-full ${color} text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0 select-none`}
              >
                {initials}
              </span>

              {/* Nama yang login tertulis langsung */}
              <span className="truncate max-w-[110px] sm:max-w-[150px] text-foreground">
                {user.nama}
              </span>

              {/* Role badge */}
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider border ${roleBadge}`}
              >
                {user.role}
              </span>

              {isMe && (
                <span className="text-[10px] text-primary-500 font-bold flex-shrink-0">(Anda)</span>
              )}
            </div>
          );
        })}

        {/* Jika lebih dari MAX_VISIBLE, tampilkan tombol overflow */}
        {overflow > 0 && (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowMore(!showMore)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-foreground/10 hover:bg-foreground/15 text-foreground border border-border-custom cursor-pointer transition"
            >
              +{overflow} lainnya
            </button>

            {showMore && (
              <div className="absolute right-0 top-full mt-2 z-50 bg-surface border border-border-custom shadow-xl rounded-xl p-3 min-w-[220px] max-w-[280px] flex flex-col gap-2">
                <div className="text-[11px] font-bold text-foreground/50 pb-1.5 border-b border-border-custom flex items-center justify-between">
                  <span>Pengguna Lainnya</span>
                  <span className="text-[10px] bg-foreground/10 px-1.5 py-0.5 rounded-full">{overflow}</span>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                  {users.slice(MAX_VISIBLE).map((u) => {
                    const isMe = u.nama === currentUserName;
                    const uColor = roleColors[u.role] || 'bg-gray-500';
                    const uBadge = roleBadgeStyles[u.role] || 'bg-gray-500/15 text-gray-500 border-gray-500/30';
                    return (
                      <div
                        key={u.id}
                        className="flex items-center justify-between gap-2 text-xs py-1 px-1.5 rounded-lg hover:bg-foreground/5"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={`w-4 h-4 rounded-full ${uColor} text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0`}
                          >
                            {getInitials(u.nama)}
                          </span>
                          <span className="font-medium text-foreground truncate">
                            {u.nama}
                          </span>
                          {isMe && <span className="text-[10px] text-primary-500 font-bold">(Anda)</span>}
                        </div>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider border flex-shrink-0 ${uBadge}`}
                        >
                          {u.role}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
