import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { redisConnection } from '@/lib/redis';
import { pusherServer } from '@/lib/pusher';

// TTL presence: 35 detik (sedikit lebih dari interval heartbeat 30 detik)
const PRESENCE_TTL = 35;

// GET /api/presence?room=materi-abc123
// → Ambil daftar user yang sedang online di room tertentu
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const room = searchParams.get('room');

  if (!room) {
    return NextResponse.json({ error: 'room diperlukan' }, { status: 400 });
  }

  const key = `presence:${room}`;
  const members = await redisConnection.hgetall(key);

  const users = Object.values(members || {}).map((v) => {
    try { return JSON.parse(v); } catch { return null; }
  }).filter(Boolean);

  return NextResponse.json({ users });
}

// POST /api/presence
// Body: { room, action: 'join' | 'leave' | 'heartbeat' }
export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { room, action } = body;

  if (!room || !action) {
    return NextResponse.json({ error: 'room dan action diperlukan' }, { status: 400 });
  }

  const userId = session.user.id || session.user.email!;
  const userName = session.user.name || session.user.email!;
  const userRole = session.user.role || 'siswa';

  const key = `presence:${room}`;
  const pusherChannel = `presence-${room}`;

  if (action === 'join' || action === 'heartbeat') {
    const userData = JSON.stringify({
      id: userId,
      nama: userName,
      role: userRole,
      joinedAt: Date.now(),
    });

    // Simpan member di Redis hash, dengan expire di seluruh key
    await redisConnection.hset(key, userId, userData);
    await redisConnection.expire(key, PRESENCE_TTL * 10); // Key bertahan lebih lama

    // Set expire per-user lewat sorted set agar bisa di-cleanup
    const expireKey = `presence-expire:${room}`;
    await redisConnection.zadd(expireKey, Date.now() + PRESENCE_TTL * 1000, userId);
    await redisConnection.expire(expireKey, PRESENCE_TTL * 10);

    if (action === 'join') {
      // Cleanup expired members dulu sebelum broadcast
      await cleanupExpiredMembers(key, expireKey);

      // Ambil daftar terbaru setelah cleanup
      const members = await redisConnection.hgetall(key);
      const users = Object.values(members || {}).map((v) => {
        try { return JSON.parse(v); } catch { return null; }
      }).filter(Boolean);

      // Broadcast event join ke channel Pusher
      await pusherServer.trigger(pusherChannel, 'presence-update', { users });
    }
  } else if (action === 'leave') {
    await redisConnection.hdel(key, userId);

    const expireKey = `presence-expire:${room}`;
    await redisConnection.zrem(expireKey, userId);

    // Ambil daftar terbaru
    const members = await redisConnection.hgetall(key);
    const users = Object.values(members || {}).map((v) => {
      try { return JSON.parse(v); } catch { return null; }
    }).filter(Boolean);

    // Broadcast event leave ke channel Pusher
    await pusherServer.trigger(pusherChannel, 'presence-update', { users });
  }

  return NextResponse.json({ success: true });
}

// Helper: hapus member yang sudah expired dari Redis hash
async function cleanupExpiredMembers(key: string, expireKey: string) {
  const now = Date.now();
  // Ambil member yang sudah expired (score <= now)
  const expired = await redisConnection.zrangebyscore(expireKey, '-inf', now);
  if (expired.length > 0) {
    await redisConnection.hdel(key, ...expired);
    await redisConnection.zremrangebyscore(expireKey, '-inf', now);
  }
}
