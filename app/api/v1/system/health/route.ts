import { NextRequest } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { apiSuccess } from '@/lib/api/response';
import { connectDB } from '@/lib/db';
import { redisConnection } from '@/lib/redis';
import mongoose from 'mongoose';

// GET /api/v1/system/health
export const GET = createApiHandler(
  async (_req: NextRequest) => {
    let dbStatus = 'disconnected';
    try {
      await connectDB();
      dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'connecting';
    } catch {
      dbStatus = 'error';
    }

    let redisStatus = 'disconnected';
    try {
      if (redisConnection && redisConnection.status === 'ready') {
        redisStatus = 'connected';
      }
    } catch {
      redisStatus = 'error';
    }

    const memoryUsage = process.memoryUsage();

    return apiSuccess({
      status: dbStatus === 'connected' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime_seconds: Math.floor(process.uptime()),
      database: {
        type: 'MongoDB',
        status: dbStatus,
      },
      cache: {
        type: 'Redis',
        status: redisStatus,
      },
      system: {
        node_version: process.version,
        memory_used_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        memory_total_mb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      },
    }, 'System health check passed');
  },
  {
    requireApiKey: false,
    authRequired: false,
  }
);
