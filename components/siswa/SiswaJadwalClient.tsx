'use client';

import { useState, useMemo, useEffect } from 'react';
import { JadwalItem, GuruMap } from '@/types/jadwal';
import { HARI_LIST, HariType, parseJadwalItem, getCurrentSchoolDay } from '@/lib/jadwal-api';

// Nama pendek untuk tampilan mobile
const HARI_SHORT: Record<string, string> = {
  SENIN: 'SEN',
  SELASA: 'SEL',
  RABU: 'RAB',
  KAMIS: 'KAM',
  JUMAT: 'JUM',
};

interface SiswaJadwalClientProps {
  initialSchedule: JadwalItem[];
  guruMap: GuruMap;
  kelasDb: string; // Format MongoDB, misal: "X 1"
  namaSiswa: string;
  nis?: string;
}

export default function SiswaJadwalClient({
  initialSchedule,
  guruMap,
  kelasDb,
  namaSiswa,
  nis,
}: SiswaJadwalClientProps) {
  // Hari aktif default sesuai hari saat ini
  const defaultDay = useMemo(() => getCurrentSchoolDay(), []);
  const [selectedDay, setSelectedDay] = useState<HariType>(defaultDay);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Update jam saat ini untuk live lesson indicator
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hh}.${mm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000); // Update setiap 30 detik
    return () => clearInterval(interval);
  }, []);

  // Format semua item jadwal
  const allFormattedItems = useMemo(() => {
    return initialSchedule.map(item => parseJadwalItem(item, guruMap));
  }, [initialSchedule, guruMap]);

  // Filter HANYA untuk hari yang sedang dipilih (tampil per hari saja)
  const daySchedule = useMemo(() => {
    const filtered = allFormattedItems.filter(item => item.hari === selectedDay);
    // Urutkan berdasarkan waktu mulai (misal: "07.10 - 07.50")
    return filtered.sort((a, b) => {
      const timeA = a.waktu.split('-')[0].trim();
      const timeB = b.waktu.split('-')[0].trim();
      return timeA.localeCompare(timeB);
    });
  }, [allFormattedItems, selectedDay]);

  // Hitung ringkasan hari ini
  const dayStats = useMemo(() => {
    const teachingItems = daySchedule.filter(i => i.tipe === 'pelajaran');
    const uniqueSubjects = new Set(teachingItems.map(i => i.mapel));
    const startTime = daySchedule.length > 0 ? daySchedule[0].waktu.split('-')[0].trim() : '-';
    const endTime = daySchedule.length > 0 ? daySchedule[daySchedule.length - 1].waktu.split('-')[1]?.trim() : '-';

    return {
      totalJam: teachingItems.length,
      totalMapel: uniqueSubjects.size,
      startTime,
      endTime,
    };
  }, [daySchedule]);

  // Deteksi status sesi untuk hari ini (Sedang Berlangsung / Selesai / Akan Datang)
  const isSelectedDayToday = useMemo(() => {
    const dayIndex = new Date().getDay();
    const map = ['', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', ''];
    return map[dayIndex] === selectedDay;
  }, [selectedDay]);

  const getLessonStatus = (waktuRange: string) => {
    if (!isSelectedDayToday || !currentTime) return null;
    const parts = waktuRange.split('-').map(s => s.trim());
    if (parts.length !== 2) return null;

    const start = parts[0];
    const end = parts[1];

    if (currentTime >= start && currentTime <= end) {
      return 'active'; // Sedang berlangsung
    }
    if (currentTime > end) {
      return 'done'; // Selesai
    }
    return 'upcoming'; // Akan datang
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto pb-12 overflow-x-hidden">
      {/* 1. HERO HEADER SISWA (RESPONSIVE) */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl shadow-xl relative overflow-hidden">
        {/* Dekorasi Cahaya */}
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-black bg-white/20 backdrop-blur-md uppercase tracking-wider">
                Kelas: {kelasDb}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold bg-emerald-400/20 border border-emerald-300/30 text-emerald-200">
                SMAN 1 Margaasih
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
              Jadwal Pelajaran Kelas {kelasDb}
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 truncate">
              {namaSiswa} {nis ? `(NIS: ${nis})` : ''} • Tampilan Harian
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/15 hover:bg-white/25 text-white transition-all backdrop-blur-md border border-white/20 shadow-sm"
              title="Cetak jadwal hari ini"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Cetak Jadwal</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. PEMILIH HARI - RESPONSIF 5-KOLOM */}
      <div className="bg-surface p-3.5 sm:p-5 rounded-2xl border border-border-custom shadow-sm space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-xs sm:text-sm font-extrabold text-foreground uppercase tracking-wider">
              Pilih Hari Belajar
            </h2>
            <p className="text-[11px] sm:text-xs text-foreground/50">
              Jadwal harian khusus kelas {kelasDb}
            </p>
          </div>
          {currentTime && isSelectedDayToday && (
            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Hari Ini • {currentTime} WIB
            </span>
          )}
        </div>

        {/* 5 Tombol Hari Sejajar di Semua Layar */}
        <div className="grid grid-cols-5 gap-1 sm:gap-2 pt-1">
          {HARI_LIST.map(hari => {
            const isSelected = selectedDay === hari;

            return (
              <button
                key={hari}
                onClick={() => setSelectedDay(hari)}
                className={`py-2 sm:py-3 px-0.5 sm:px-3 rounded-xl font-extrabold transition-all border flex flex-col items-center justify-center gap-0.5 sm:gap-1 text-center min-w-0 ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25 scale-[1.02]'
                    : 'bg-surface text-foreground hover:bg-foreground/5 border-border-custom hover:border-blue-400'
                }`}
              >
                {/* Nama pendek di mobile, nama penuh di sm ke atas */}
                <span className="block sm:hidden text-[10px] font-bold tracking-tight">
                  {HARI_SHORT[hari]}
                </span>
                <span className="hidden sm:block text-xs font-bold tracking-wide">
                  {hari}
                </span>
                {isSelected && (
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-white" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. RINGKASAN HARI TERPILIH */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
        <div className="bg-surface p-2.5 sm:p-4 rounded-xl border border-border-custom text-center">
          <p className="text-[9px] sm:text-[10px] font-bold text-foreground/40 uppercase tracking-wider leading-tight">Mapel</p>
          <p className="text-base sm:text-xl font-extrabold text-foreground mt-0.5">{dayStats.totalMapel}</p>
        </div>
        <div className="bg-surface p-2.5 sm:p-4 rounded-xl border border-border-custom text-center">
          <p className="text-[9px] sm:text-[10px] font-bold text-foreground/40 uppercase tracking-wider leading-tight">Sesi</p>
          <p className="text-base sm:text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">{dayStats.totalJam}</p>
        </div>
        <div className="bg-surface p-2.5 sm:p-4 rounded-xl border border-border-custom text-center">
          <p className="text-[9px] sm:text-[10px] font-bold text-foreground/40 uppercase tracking-wider leading-tight">Mulai</p>
          <p className="text-[11px] sm:text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {dayStats.startTime}
          </p>
        </div>
        <div className="bg-surface p-2.5 sm:p-4 rounded-xl border border-border-custom text-center">
          <p className="text-[9px] sm:text-[10px] font-bold text-foreground/40 uppercase tracking-wider leading-tight">Selesai</p>
          <p className="text-[11px] sm:text-sm font-mono font-bold text-rose-600 dark:text-rose-400 mt-0.5">
            {dayStats.endTime}
          </p>
        </div>
      </div>

      {/* 4. DAFTAR SESI JADWAL HARIAN */}
      <div className="bg-surface rounded-2xl border border-border-custom shadow-sm overflow-hidden">
        {/* Header List */}
        <div className="p-3.5 sm:p-4 bg-foreground/[0.03] border-b border-border-custom flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <h3 className="font-extrabold text-foreground text-xs sm:text-sm">
              Agenda Hari {selectedDay} ({daySchedule.length} Sesi)
            </h3>
          </div>
          <span className="text-[11px] sm:text-xs font-bold text-foreground/50">
            Kelas {kelasDb}
          </span>
        </div>

        {/* Content List */}
        <div className="divide-y divide-border-custom p-2.5 sm:p-4 space-y-2.5 sm:space-y-3">
          {daySchedule.length === 0 ? (
            <div className="py-12 text-center text-foreground/40 space-y-2">
              <div className="text-3xl">🌴</div>
              <p className="text-sm font-semibold">Tidak ada jadwal pelajaran pada hari {selectedDay}</p>
            </div>
          ) : (
            daySchedule.map((item, idx) => {
              const status = getLessonStatus(item.waktu);
              const isActive = status === 'active';
              const isDone = status === 'done';

              // 1. Upacara Bendera
              if (item.tipe === 'upacara') {
                return (
                  <div
                    key={idx}
                    className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-500/10 border border-amber-300/60 dark:border-amber-700/60 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-200 flex items-center justify-center font-bold text-lg sm:text-xl shrink-0">
                        🇮🇩
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-extrabold bg-amber-500/20 text-amber-800 dark:text-amber-200 uppercase">
                            Khusus
                          </span>
                          <span className="text-[11px] sm:text-xs font-mono text-amber-800 dark:text-amber-300 font-semibold">
                            {item.waktu} WIB
                          </span>
                        </div>
                        <h4 className="text-sm sm:text-base font-extrabold text-amber-900 dark:text-amber-100 mt-0.5">
                          Upacara Bendera
                        </h4>
                        <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 hidden sm:block">
                          Seluruh siswa berkumpul di lapangan sekolah tepat waktu
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }

              // 2. Istirahat / Kokurikuler
              if (item.tipe === 'istirahat' || item.tipe === 'kokurikuler') {
                const isKokurikuler = item.tipe === 'kokurikuler';
                return (
                  <div
                    key={idx}
                    className={`py-2 px-3 sm:py-3 sm:px-4 rounded-xl border flex items-center justify-between gap-2 ${
                      isKokurikuler
                        ? 'bg-teal-500/10 border-teal-300/50 text-teal-800 dark:text-teal-200'
                        : 'bg-foreground/[0.03] border-dashed border-border-custom text-foreground/70'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm sm:text-base">{isKokurikuler ? '🌱' : '☕'}</span>
                      <span className="text-[11px] sm:text-xs font-bold">{item.label}</span>
                    </div>
                    <span className="font-mono text-[10px] sm:text-xs font-semibold opacity-70 shrink-0">
                      {item.waktu} WIB
                    </span>
                  </div>
                );
              }

              // 3. Pelajaran Reguler
              return (
                <div
                  key={idx}
                  className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all duration-200 flex flex-row items-center justify-between gap-2 sm:gap-3 w-full max-w-full min-w-0 ${
                    isActive
                      ? 'bg-blue-500/15 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                      : isDone
                      ? 'bg-foreground/[0.01] border-border-custom/50 opacity-60'
                      : item.colorClass?.bg || 'bg-surface'
                  } ${item.colorClass?.border || 'border-border-custom'}`}
                >
                  {/* Kolom Kiri: Jam + Info */}
                  <div className="flex items-start gap-2 sm:gap-3.5 min-w-0 flex-1">
                    {/* Badge Nomor Jam */}
                    <div
                      className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex flex-col items-center justify-center shrink-0 font-extrabold ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                          : 'bg-foreground/10 text-foreground'
                      }`}
                    >
                      <span className="text-[8px] sm:text-[9px] uppercase font-bold tracking-tighter opacity-70">Jam</span>
                      <span className="text-sm sm:text-base leading-none">{item.jam_ke_clean}</span>
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* Waktu + Status badge */}
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="font-mono text-[9px] sm:text-xs font-bold text-foreground/60">
                          {item.waktu}
                        </span>
                        {isActive && (
                          <span className="px-1.5 py-0 rounded-full text-[8px] sm:text-[9px] font-extrabold bg-blue-600 text-white animate-pulse">
                            Live
                          </span>
                        )}
                        {isDone && (
                          <span className="px-1.5 py-0 rounded-full text-[8px] sm:text-[9px] font-semibold bg-foreground/10 text-foreground/60">
                            ✓
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs sm:text-sm font-extrabold text-foreground mt-0.5 truncate leading-tight">
                        {item.mapel}
                      </h4>

                      <div className="flex items-center gap-1 mt-0.5 min-w-0">
                        <span className="text-[10px] sm:text-xs text-foreground/60 truncate" title={item.nama_guru}>
                          {item.nama_guru}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Kolom Kanan: Kode Guru */}
                  {item.kode_guru && (
                    <div className="shrink-0 self-start sm:self-center">
                      <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-foreground/10 text-foreground/70 whitespace-nowrap">
                        {item.kode_guru}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
