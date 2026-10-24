'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { JadwalItem, GuruMap } from '@/types/jadwal';
import { getCurrentSchoolDay, parseJadwalItem } from '@/lib/jadwal-api';

interface JadwalHariIniWidgetProps {
  schedule: JadwalItem[];
  guruMap: GuruMap;
  kelasDb: string;
}

export default function JadwalHariIniWidget({ schedule, guruMap, kelasDb }: JadwalHariIniWidgetProps) {
  const currentDay = useMemo(() => getCurrentSchoolDay(), []);

  // Ambil jadwal hari ini
  const todayItems = useMemo(() => {
    const formatted = schedule.map(item => parseJadwalItem(item, guruMap));
    return formatted
      .filter(item => item.hari === currentDay)
      .sort((a, b) => {
        const timeA = a.waktu.split('-')[0].trim();
        const timeB = b.waktu.split('-')[0].trim();
        return timeA.localeCompare(timeB);
      });
  }, [schedule, guruMap, currentDay]);

  const teachingCount = todayItems.filter(i => i.tipe === 'pelajaran').length;

  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-border-custom overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-3.5 sm:p-4 bg-foreground/[0.03] border-b border-border-custom flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </span>
          <div className="min-w-0">
            <h3 className="font-extrabold text-foreground text-xs sm:text-sm truncate">Jadwal Hari Ini</h3>
            <p className="text-[10px] sm:text-[11px] text-foreground/50 truncate">{currentDay} • Kelas {kelasDb}</p>
          </div>
        </div>

        <Link
          href="/siswa/jadwal"
          className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 shrink-0"
        >
          <span>Lengkap</span>
          <span>→</span>
        </Link>
      </div>

      {/* List Sesi Hari Ini */}
      <div className="p-2.5 sm:p-3 divide-y divide-border-custom/50 max-h-80 overflow-y-auto space-y-1.5 sm:space-y-2">
        {todayItems.length === 0 ? (
          <p className="text-xs text-foreground/40 text-center py-6">
            Tidak ada jadwal pelajaran pada hari {currentDay}.
          </p>
        ) : (
          todayItems.map((item, idx) => {
            const isUpacara = item.tipe === 'upacara';
            const isIstirahat = item.tipe === 'istirahat' || item.tipe === 'kokurikuler';

            if (isUpacara) {
              return (
                <div key={idx} className="p-2 rounded-xl bg-amber-500/10 border border-amber-300/40 text-[11px] flex items-center justify-between gap-2">
                  <span className="font-bold text-amber-800 dark:text-amber-200 truncate">🇮🇩 Upacara Bendera</span>
                  <span className="font-mono text-amber-700/70 text-[10px] shrink-0">{item.waktu}</span>
                </div>
              );
            }

            if (isIstirahat) {
              return (
                <div key={idx} className="py-1 px-2.5 rounded-lg bg-foreground/[0.02] border border-dashed border-border-custom text-[10px] text-foreground/60 flex items-center justify-between gap-2">
                  <span className="truncate">☕ {item.label}</span>
                  <span className="font-mono shrink-0">{item.waktu}</span>
                </div>
              );
            }

            return (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-foreground/[0.02] hover:bg-foreground/[0.04] transition-all flex items-center justify-between gap-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-foreground/60 shrink-0">{item.waktu}</span>
                    <span className="font-extrabold text-xs text-foreground truncate">{item.mapel}</span>
                  </div>
                  <p className="text-[11px] text-foreground/60 truncate mt-0.5" title={item.nama_guru}>
                    {item.nama_guru}
                  </p>
                </div>
                {item.kode_guru && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-foreground/10 text-foreground shrink-0">
                    {item.kode_guru}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 bg-foreground/[0.02] border-t border-border-custom text-center">
        <Link
          href="/siswa/jadwal"
          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition block truncate"
        >
          Lihat Jadwal Harian Lengkap ({teachingCount} Jam) →
        </Link>
      </div>
    </div>
  );
}
