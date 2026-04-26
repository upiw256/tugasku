'use client'

import { useEffect } from 'react';
import { pusherClient } from '@/lib/pusher';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function AdminRealtimeNotifier() {
  const router = useRouter();

  useEffect(() => {
    const channel = pusherClient.subscribe('admin-updates');

    channel.bind('new-materi', (data: any) => {
      toast.success(`📚 Materi Baru: ${data.judul} (oleh ${data.pengunggah})`, {
        duration: 5000,
        position: 'top-right',
      });
      router.refresh();
    });

    channel.bind('new-soal-pg', (data: any) => {
      toast.success(`📝 Kuis Baru: ${data.judul} (oleh ${data.pembuat})`, {
        duration: 5000,
        position: 'top-right',
      });
      router.refresh();
    });

    return () => {
      pusherClient.unsubscribe('admin-updates');
    };
  }, [router]);

  return null; // Komponen ini hanya untuk side-effect listener
}
