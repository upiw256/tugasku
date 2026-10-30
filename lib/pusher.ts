import PusherServer from 'pusher';
import PusherClient from 'pusher-js';

// Instance SERVER (Backend)
export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID || '',
  key: process.env.PUSHER_KEY || process.env.NEXT_PUBLIC_PUSHER_KEY || '',
  secret: process.env.PUSHER_SECRET || '',
  cluster: process.env.PUSHER_CLUSTER || process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap1',
  useTLS: true,
});

// Instance CLIENT (Frontend/Browser)
// Diberikan fallback agar tidak melempar uncaught exception jika env belum terbaca saat build/deploy
const clientKey = process.env.NEXT_PUBLIC_PUSHER_KEY || process.env.PUSHER_KEY || 'dummy_key';
const clientCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || process.env.PUSHER_CLUSTER || 'ap1';

export const pusherClient = new PusherClient(clientKey, {
  cluster: clientCluster,
});