'use client';

import { useState, useEffect } from 'react';
import { pusherClient } from '@/lib/pusher';

export default function LogUnduhanMateri({ materiId, initialData }: { materiId: string, initialData: any[] }) {
  const [downloadedStudents, setDownloadedStudents] = useState<any[]>(initialData || []);

  useEffect(() => {
    const channelName = `materi-${materiId}`;
    const channel = pusherClient.subscribe(channelName);

    channel.bind('new-download', (student: any) => {
      setDownloadedStudents((prev) => {
        if (prev.some((s) => s.id === student.id)) return prev;
        return [...prev, student];
      });
    });

    return () => {
      pusherClient.unsubscribe(channelName);
    };
  }, [materiId]);

  return (
    <div className="bg-surface p-6 rounded-xl shadow-sm border border-border-custom">
      <div className="flex items-center justify-between border-b border-border-custom pb-3 mb-4">
        <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          Log Unduhan
        </h3>
        <span className="bg-green-500/10 text-green-600 font-bold px-2 py-0.5 rounded-full text-xs">
          {downloadedStudents.length} Total
        </span>
      </div>
      
      <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
        {downloadedStudents.length === 0 ? (
          <p className="text-center text-xs text-foreground/40 py-4">Belum ada siswa yang mengunduh.</p>
        ) : (
          downloadedStudents.map(student => (
            <div key={student.id} className="flex justify-between items-center bg-foreground/5 p-2 rounded-lg">
              <p className="text-xs font-bold text-foreground truncate max-w-[120px]">{student.nama}</p>
              <span className="text-[10px] font-bold bg-primary-500/10 text-primary-500 px-2 py-1 rounded-full uppercase">
                {student.kelas}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
