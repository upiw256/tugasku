'use client';

import { useState, useMemo } from 'react';
import { JadwalItem, GuruMap } from '@/types/jadwal';
import { HARI_LIST, HariType, parseJadwalItem, naturalSortKelas } from '@/lib/jadwal-api';

interface JadwalKelasViewProps {
  availableClasses: string[];
  selectedKelas: string;
  onSelectKelas: (kelas: string) => void;
  jadwalList: JadwalItem[];
  guruMap: GuruMap;
  isLoading: boolean;
}

export default function JadwalKelasView({
  availableClasses,
  selectedKelas,
  onSelectKelas,
  jadwalList,
  guruMap,
  isLoading,
}: JadwalKelasViewProps) {
  const [tingkatFilter, setTingkatFilter] = useState<'ALL' | 'X' | 'XI' | 'XII'>('ALL');
  const [selectedDay, setSelectedDay] = useState<HariType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Kelompokkan kelas sesuai tingkatan
  const sortedClasses = useMemo(() => naturalSortKelas(availableClasses), [availableClasses]);

  const filteredClasses = useMemo(() => {
    if (tingkatFilter === 'ALL') return sortedClasses;
    if (tingkatFilter === 'X') return sortedClasses.filter(c => c.startsWith('X-'));
    if (tingkatFilter === 'XI') return sortedClasses.filter(c => c.startsWith('XI-'));
    if (tingkatFilter === 'XII') return sortedClasses.filter(c => c.startsWith('XII-'));
    return sortedClasses;
  }, [sortedClasses, tingkatFilter]);

  // Parse dan format jadwal items
  const formattedItems = useMemo(() => {
    return jadwalList.map(item => parseJadwalItem(item, guruMap));
  }, [jadwalList, guruMap]);

  // Filter berdasarkan hari dan pencarian
  const displayedItems = useMemo(() => {
    let result = formattedItems;

    if (selectedDay !== 'ALL') {
      result = result.filter(item => item.hari === selectedDay);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(item => 
        item.label.toLowerCase().includes(q) ||
        (item.nama_guru && item.nama_guru.toLowerCase().includes(q)) ||
        (item.kode_guru && item.kode_guru.toLowerCase().includes(q))
      );
    }

    return result;
  }, [formattedItems, selectedDay, searchQuery]);

  // Kelompokkan jadwal per hari
  const itemsByDay = useMemo(() => {
    const map: Record<string, ReturnType<typeof parseJadwalItem>[]> = {};
    HARI_LIST.forEach(h => {
      map[h] = [];
    });

    displayedItems.forEach(item => {
      if (map[item.hari]) {
        map[item.hari].push(item);
      }
    });

    // Urutkan per jam pelajaran (0, 1, 2, ..., 10, lalu 99 sesuai waktu)
    HARI_LIST.forEach(h => {
      map[h].sort((a, b) => {
        // Parse start time "07.10 - 07.50"
        const timeA = a.waktu.split('-')[0].trim();
        const timeB = b.waktu.split('-')[0].trim();
        return timeA.localeCompare(timeB);
      });
    });

    return map;
  }, [displayedItems]);

  return (
    <div className="space-y-6">
      {/* 1. KONTROL PEMILIH KELAS */}
      <div className="bg-surface p-5 rounded-2xl border border-border-custom shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-custom pb-4">
          <div>
            <h2 className="text-base font-bold text-foreground">Pilih Rombongan Belajar (Kelas)</h2>
            <p className="text-xs text-foreground/50">Klik salah satu kelas untuk menampilkan jadwal pelajaran mingguan</p>
          </div>

          {/* Filter Tab Tingkat */}
          <div className="flex items-center gap-1 bg-foreground/5 p-1 rounded-xl shrink-0 self-start sm:self-auto border border-border-custom/40">
            {(['ALL', 'X', 'XI', 'XII'] as const).map(tingkat => (
              <button
                key={tingkat}
                onClick={() => setTingkatFilter(tingkat)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  tingkatFilter === tingkat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-foreground/70 hover:text-foreground hover:bg-foreground/5'
                }`}
              >
                {tingkat === 'ALL' ? 'Semua' : `Kelas ${tingkat}`}
              </button>
            ))}
          </div>
        </div>

        {/* Daftar Tombol Kelas */}
        <div className="flex flex-wrap gap-2 pt-1 max-h-36 overflow-y-auto pr-1">
          {filteredClasses.map(cls => {
            const isSelected = cls === selectedKelas;
            return (
              <button
                key={cls}
                onClick={() => onSelectKelas(cls)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 scale-105'
                    : 'bg-surface text-foreground hover:bg-foreground/5 border-border-custom hover:border-blue-400'
                }`}
              >
                {cls}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. SUB-HEADER & FILTER HARI */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface p-4 md:p-5 rounded-2xl border border-border-custom shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-blue-500/20 shrink-0">
            {selectedKelas}
          </div>
          <div>
            <h3 className="font-extrabold text-foreground text-lg">
              Jadwal Kelas {selectedKelas}
            </h3>
            <p className="text-xs text-foreground/50">
              Total {formattedItems.length} sesi per minggu (Senin - Jumat)
            </p>
          </div>
        </div>

        {/* Filter Hari & Search Input */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Box */}
          <div className="relative">
            <svg
              className="w-4 h-4 text-foreground/40 absolute left-3 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari mapel / guru..."
              className="pl-9 pr-3 py-1.5 rounded-xl text-xs bg-surface border border-border-custom text-foreground outline-none focus:ring-2 focus:ring-blue-500/30 w-full sm:w-44"
            />
          </div>

          {/* Hari Selector Tabs */}
          <div className="flex items-center gap-1 bg-foreground/5 p-1 rounded-xl overflow-x-auto border border-border-custom/40">
            <button
              onClick={() => setSelectedDay('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                selectedDay === 'ALL'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-foreground/70 hover:text-foreground hover:bg-foreground/5'
              }`}
            >
              Semua Hari
            </button>
            {HARI_LIST.map(hari => (
              <button
                key={hari}
                onClick={() => setSelectedDay(hari)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedDay === hari
                    ? 'bg-blue-600 text-white shadow-sm font-bold'
                    : 'text-foreground/70 hover:text-foreground hover:bg-foreground/5'
                }`}
              >
                {hari}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. TAMPILAN TIMETABLE JADWAL */}
      {isLoading ? (
        <div className="bg-surface rounded-2xl border border-border-custom p-16 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-foreground">Memuat jadwal kelas {selectedKelas}...</p>
        </div>
      ) : displayedItems.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border-custom p-12 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-foreground/5 text-foreground/40 mx-auto flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h4 className="font-bold text-foreground">Tidak Ada Jadwal Ditemukan</h4>
          <p className="text-xs text-foreground/50 max-w-sm mx-auto">
            Tidak ada mata pelajaran yang cocok dengan filter atau pencarian Anda pada kelas ini.
          </p>
        </div>
      ) : (
        /* GRID MINGGUAN (Senin - Jumat) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {HARI_LIST.filter(h => selectedDay === 'ALL' || selectedDay === h).map(hari => {
            const dayItems = itemsByDay[hari] || [];
            if (dayItems.length === 0 && selectedDay !== 'ALL') return null;

            return (
              <div
                key={hari}
                className="bg-surface rounded-2xl border border-border-custom shadow-sm overflow-hidden flex flex-col"
              >
                {/* Header Hari */}
                <div className="p-3.5 bg-foreground/[0.03] border-b border-border-custom flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <h4 className="font-extrabold text-foreground text-sm tracking-wide">{hari}</h4>
                  </div>
                  <span className="text-[11px] font-bold text-foreground/40">
                    {dayItems.length} Sesi
                  </span>
                </div>

                {/* List Sesi Jam Pelajaran */}
                <div className="p-3 space-y-2.5 flex-1 overflow-y-auto max-h-[650px]">
                  {dayItems.length === 0 ? (
                    <p className="text-xs text-foreground/40 text-center py-6">Tidak ada jadwal</p>
                  ) : (
                    dayItems.map((item, idx) => {
                      const isUpacara = item.tipe === 'upacara';
                      const isIstirahat = item.tipe === 'istirahat';
                      const isKokurikuler = item.tipe === 'kokurikuler';

                      if (isUpacara) {
                        return (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-amber-500/10 border border-amber-400/40 text-amber-900 dark:text-amber-200 transition-all text-center"
                          >
                            <span className="text-[10px] font-extrabold uppercase tracking-wider block opacity-75">
                              06.30 - 07.10
                            </span>
                            <p className="text-xs font-bold mt-0.5">🇮🇩 Upacara Bendera</p>
                          </div>
                        );
                      }

                      if (isIstirahat) {
                        return (
                          <div
                            key={idx}
                            className="py-1.5 px-3 rounded-lg bg-foreground/5 border border-dashed border-border-custom text-foreground/60 text-center"
                          >
                            <span className="text-[10px] font-mono block opacity-60">
                              {item.waktu}
                            </span>
                            <span className="text-xs font-semibold">☕ {item.label}</span>
                          </div>
                        );
                      }

                      if (isKokurikuler) {
                        return (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-400/40 text-teal-900 dark:text-teal-200 text-center"
                          >
                            <span className="text-[10px] font-mono block opacity-75">{item.waktu}</span>
                            <p className="text-xs font-bold mt-0.5">🌱 {item.label}</p>
                          </div>
                        );
                      }

                      // Pelajaran Standar
                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border transition-all duration-200 hover:shadow-md hover:scale-[1.01] ${
                            item.colorClass?.bg || 'bg-surface'
                          } ${item.colorClass?.border || 'border-border-custom'}`}
                        >
                          {/* Waktu & Jam Ke */}
                          <div className="flex items-center justify-between text-[10px] font-semibold text-foreground/60 mb-1">
                            <span className="px-1.5 py-0.5 rounded-md bg-foreground/10 font-bold text-foreground">
                              Jam ke-{item.jam_ke_clean}
                            </span>
                            <span className="font-mono text-foreground/70">{item.waktu}</span>
                          </div>

                          {/* Nama Mata Pelajaran */}
                          <h5 className="font-extrabold text-foreground text-xs leading-snug line-clamp-1">
                            {item.mapel}
                          </h5>

                          {/* Guru & Kode */}
                          <div className="mt-2 pt-2 border-t border-border-custom/40 flex items-center justify-between gap-1">
                            <p className="text-[11px] font-medium text-foreground/80 truncate" title={item.nama_guru}>
                              {item.nama_guru}
                            </p>
                            {item.kode_guru && (
                              <span
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-foreground/10 text-foreground shrink-0"
                                title={`Kode Guru: ${item.kode_guru}`}
                              >
                                {item.kode_guru}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
