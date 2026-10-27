import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { redisConnection } from '@/lib/redis';
import { pusherServer } from '@/lib/pusher';

// TTL presence: 35 detik (sedikit lebih dari interval heartbeat 28 detik)
const PRESENCE_TTL_SEC = 350; // key Redis bertahan 350 detik

// GET /api/presence?room=materi-abc123
// → Ambil daftar user yang sedang online di room tertentu
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const room = searchParams.get('room');

  if (!room) {
    return NextResponse.json({ error: 'room diperlukan' }, { status: 400 });
  }

  try {
    // Cleanup expired dulu
    const key = `presence:${room}`;
    const expireKey = `presence-expire:${room}`;
    await cleanupExpiredMembers(key, expireKey);

    const members = await redisConnection.hgetall(key);
    const users = Object.values(members || {})
      .map((v) => { try { return JSON.parse(v); } catch { return null; } })
      .filter(Boolean);

    return NextResponse.json({ users });
  } catch (err: any) {
    console.error('[presence GET error]', err.message);
    return NextResponse.json({ users: [] });
  }
}

// POST /api/presence
// Body: { room, action: 'join' | 'leave' | 'heartbeat' }
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { room, action } = body;

    if (!room || !action) {
      return NextResponse.json({ error: 'room dan action diperlukan' }, { status: 400 });
    }

    // Gunakan email sebagai userId (selalu ada, unik)
    const userId = (session.user as any).id || session.user.email!;
    const userName = session.user.name || session.user.email || 'Unknown';
    const userRole = (session.user as any).role || 'siswa';

    console.log(`[presence] action=${action} user=${userName} role=${userRole} room=${room}`);

    const key = `presence:${room}`;
    const expireKey = `presence-expire:${room}`;
    const pusherChannel = `presence-${room}`;

    if (action === 'join' || action === 'heartbeat') {
      const userData = JSON.stringify({
        id: userId,
        nama: userName,
        role: userRole,
        joinedAt: Date.now(),
      });

      // Simpan di Redis hash
      await redisConnection.hset(key, userId, userData);
      await redisConnection.expire(key, PRESENCE_TTL_SEC);

      // Update sorted set untuk tracking TTL per-user
      const expireAt = Date.now() + 35_000; // 35 detik dari sekarang
      await redisConnection.zadd(expireKey, expireAt, userId);
      await redisConnection.expire(expireKey, PRESENCE_TTL_SEC);

      // Cleanup expired, ambil list terbaru, broadcast
      await cleanupExpiredMembers(key, expireKey);
      const members = await redisConnection.hgetall(key);
      const users = Object.values(members || {})
        .map((v) => { try { return JSON.parse(v); } catch { return null; } })
        .filter(Boolean);

      await pusherServer.trigger(pusherChannel, 'presence-update', { users });

    } else if (action === 'leave') {
      await redisConnection.hdel(key, userId);
      await redisConnection.zrem(expireKey, userId);

      const members = await redisConnection.hgetall(key);
      const users = Object.values(members || {})
        .map((v) => { try { return JSON.parse(v); } catch { return null; } })
        .filter(Boolean);

      await pusherServer.trigger(pusherChannel, 'presence-update', { users });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[presence POST error]', err.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// Helper: hapus member yang TTL-nya sudah lewat
async function cleanupExpiredMembers(key: string, expireKey: string) {
  try {
    const now = Date.now();
    const expired = await redisConnection.zrangebyscore(expireKey, '-inf', now);
    if (expired.length > 0) {
      await redisConnection.hdel(key, ...expired);
      await redisConnection.zremrangebyscore(expireKey, '-inf', now);
    }
  } catch {
    // Abaikan jika redis kosong
  }
}
