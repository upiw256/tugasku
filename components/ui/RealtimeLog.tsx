'use client';

import { useEffect, useState } from 'react';
import { pusherClient } from '@/lib/pusher';

export interface LogItem {
  _id: string;
  nama_siswa: string;
  kelas: string;
  kategori?: 'Siswa' | 'Sistem' | 'Console' | 'Client' | 'Database';
  aksi: string;
  tipe: 'success' | 'warning' | 'error';
  waktu: string;
}

export default function RealtimeLog({ 
  initialLogs, 
  studentNameFilter,
  role = 'admin' 
}: { 
  initialLogs: LogItem[], 
  studentNameFilter?: string,
  role?: 'admin' | 'siswa' 
}) {
  const [logs, setLogs] = useState<LogItem[]>(initialLogs);
  const [filter, setFilter] = useState<'Semua' | 'Siswa' | 'Sistem' | 'Console' | 'Client' | 'Database'>('Semua');
  const [typeFilter, setTypeFilter] = useState<'Semua' | 'success' | 'warning' | 'error'>('Semua');
  const [isClearing, setIsClearing] = useState(false);


  const handleClearLogs = async () => {
    if (!confirm('Yakin ingin menghapus semua log?')) return;
    setIsClearing(true);
    try {
      await fetch('/api/system/logs/clear', { method: 'POST' });
    } catch (e) {
      console.error(e);
    } finally {
      setIsClearing(false);
    }
  };

  useEffect(() => {
    // Subscribe to pusher channel
    const channel = pusherClient.subscribe('admin-logs');

    channel.bind('new-log', (newLog: LogItem) => {
      // If filtering by student, only keep their logs
      if (studentNameFilter && newLog.nama_siswa !== studentNameFilter) return;

      setLogs((prevLogs) => {
        const updatedLogs = [newLog, ...prevLogs];
        // Enforce maximum 500 items in UI state as well
        if (updatedLogs.length > 500) {
          return updatedLogs.slice(0, 500);
        }
        return updatedLogs;
      });
    });

    channel.bind('clear-logs', () => {
      setLogs([]);
    });

    return () => {
      channel.unbind('new-log');
      channel.unbind('clear-logs');
      pusherClient.unsubscribe('admin-logs');
    };
  }, []);

  const getLogStyle = (tipe: string) => {
    switch (tipe) {
      case 'success':
        return 'bg-green-500/10 border-green-500/20 text-green-500';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500';
      case 'error':
        return 'bg-red-500/10 border-red-500/20 text-red-500';
      default:
        return 'bg-foreground/5 border-border-custom text-foreground';
    }
  };

  const getIcon = (tipe: string) => {
    switch (tipe) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };
  
  const getKategoriBadgeColor = (kategori?: string) => {
    switch (kategori) {
      case 'Console': return 'bg-gray-800 text-gray-200 border-gray-600';
      case 'Client': return 'bg-purple-500/20 text-purple-600 border-purple-500/30';
      case 'Sistem': return 'bg-rose-500/20 text-rose-600 border-rose-500/30';
      case 'Database': return 'bg-teal-500/20 text-teal-600 border-teal-500/30';
      default: return 'bg-blue-500/20 text-blue-600 border-blue-500/30';
    }
  };

  const filteredLogs = logs.filter(log => {
    const logKat = log.kategori || 'Siswa';
    const matchKategori = filter === 'Semua' || logKat === filter;
    const matchTipe = typeFilter === 'Semua' || log.tipe === typeFilter;
    return matchKategori && matchTipe;
  });

  return (
    <div className="bg-surface rounded-xl shadow-sm border border-border-custom overflow-hidden flex flex-col h-[400px]">
      <div className="p-4 border-b border-border-custom bg-foreground/5 flex flex-col sm:flex-row flex-wrap justify-between items-start sm:items-center gap-3 z-10">
        <h3 className="font-bold text-foreground flex items-center gap-2 whitespace-nowrap">
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          Log Aktivitas Live
        </h3>
        <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value as any)}
            className="text-xs bg-background border border-border-custom rounded px-2 py-1 outline-none font-medium flex-1 sm:flex-none min-w-[120px]"
          >
            <option value="Semua">Semua Kategori</option>
            <option value="Siswa">Siswa</option>
            <option value="Sistem">Sistem</option>
            <option value="Console">Console (Docker)</option>
            <option value="Client">Client (Browser)</option>
            <option value="Database">Database</option>
          </select>
          <select 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="text-xs bg-background border border-border-custom rounded px-2 py-1 outline-none font-medium flex-1 sm:flex-none min-w-[100px]"
          >
            <option value="Semua">Semua Tipe</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
          <span className="text-xs font-bold bg-foreground/10 text-foreground/60 px-2 py-1 rounded border border-border-custom">
            {filteredLogs.length} Log
          </span>
          {role === 'admin' && (
            <button 
              onClick={handleClearLogs}
              disabled={isClearing}
              className="text-xs bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 rounded px-2 py-1 font-bold outline-none transition-colors disabled:opacity-50"
            >
              {isClearing ? 'Membersihkan...' : 'Bersihkan'}
            </button>
          )}
        </div>
      </div>
      
      <div className="overflow-y-auto p-4 flex-1 space-y-3 custom-scrollbar">
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-foreground/40 text-sm font-medium">
            Belum ada log aktivitas...
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div 
              key={log._id} 
              className={`p-3 rounded-lg border text-sm flex items-start gap-3 transition-all animate-in slide-in-from-top-2 duration-300 ${getLogStyle(log.tipe)}`}
            >
              <div className="text-base mt-0.5">{getIcon(log.tipe)}</div>
              <div className="flex-1">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <p className="font-bold flex items-center gap-2">
                    {log.nama_siswa} <span className="text-xs opacity-70 font-normal">({log.kelas})</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getKategoriBadgeColor(log.kategori)} font-semibold`}>
                      {log.kategori || 'Siswa'}
                    </span>
                  </p>
                  <span suppressHydrationWarning className="text-[10px] opacity-70 whitespace-nowrap">
                    {new Date(log.waktu).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <p className="font-medium opacity-90 leading-snug">{log.aksi}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
