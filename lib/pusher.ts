import PusherServer from 'pusher';
import PusherClient from 'pusher-js';

// Instance SERVER (Backend)
// Menggunakan variabel tanpa NEXT_PUBLIC (Server-only)
export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

// Instance CLIENT (Frontend/Browser)
// WAJIB menggunakan NEXT_PUBLIC_ agar browser bisa membacanya
export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_KEY!, 
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  }
);