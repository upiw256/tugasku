'use client';

import { useState, useMemo, useEffect } from 'react';
import { JadwalItem, GuruMap } from '@/types/jadwal';
import { HARI_LIST, HariType, parseJadwalItem, naturalSortKelas } from '@/lib/jadwal-api';

interface JadwalHariViewProps {
  initialDay?: HariType;
  guruMap: GuruMap;
  onFetchDaySchedule: (hari: string) => Promise<JadwalItem[]>;
}

export default function JadwalHariView({
  initialDay = 'SENIN',
  guruMap,
  onFetchDaySchedule,
}: JadwalHariViewProps) {
  const [activeDay, setActiveDay] = useState<HariType>(initialDay);
  const [dayItems, setDayItems] = useState<JadwalItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'per_jam' | 'per_kelas'>('per_jam');
  const [tingkatFilter, setTingkatFilter] = useState<'ALL' | 'X' | 'XI' | 'XII'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Deteksi hari ini jika weekday
  const todayDayName = useMemo(() => {
    const dayIndex = new Date().getDay(); // 0 = Minggu, 1 = Senin, ..., 5 = Jumat
    const map = ['', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', ''];
    return map[dayIndex] as HariType || null;
  }, []);

  // Fetch jadwal saat activeDay berubah
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    onFetchDaySchedule(activeDay)
      .then(items => {
        if (isMounted) {
          setDayItems(items);
        }
      })
      .catch(err => {
        console.error('Error fetching day schedule:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeDay, onFetchDaySchedule]);

  // Format items
  const formattedItems = useMemo(() => {
    return dayItems.map(item => parseJadwalItem(item, guruMap));
  }, [dayItems, guruMap]);

  // Filter items sesuai tingkat dan search query
  const filteredItems = useMemo(() => {
    let result = formattedItems;

    if (tingkatFilter !== 'ALL') {
      result = result.filter(item => {
        if (tingkatFilter === 'X') return item.kelas.startsWith('X-');
        if (tingkatFilter === 'XI') return item.kelas.startsWith('XI-');
        if (tingkatFilter === 'XII') return item.kelas.startsWith('XII-');
        return true;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(item =>
        item.kelas.toLowerCase().includes(q) ||
        item.label.toLowerCase().includes(q) ||
        (item.nama_guru && item.nama_guru.toLowerCase().includes(q)) ||
        (item.kode_guru && item.kode_guru.toLowerCase().includes(q))
      );
    }

    return result;
  }, [formattedItems, tingkatFilter, searchQuery]);

  // Kelompokkan per jam pelajaran untuk view 'per_jam'
  const itemsByPeriod = useMemo(() => {
    const map = new Map<string, { jam: number; waktu: string; items: typeof filteredItems }>();

    filteredItems.forEach(item => {
      const key = `${item.jam_ke_clean}_${item.waktu}`;
      if (!map.has(key)) {
        map.set(key, { jam: item.jam_ke_clean, waktu: item.waktu, items: [] });
      }
      map.get(key)!.items.push(item);
    });

    // Urutkan per waktu mulai
    return Array.from(map.values()).sort((a, b) => {
      const timeA = a.waktu.split('-')[0].trim();
      const timeB = b.waktu.split('-')[0].trim();
      return timeA.localeCompare(timeB);
    });
  }, [filteredItems]);

  // Kelompokkan per kelas untuk view 'per_kelas'
  const itemsByClass = useMemo(() => {
    const map: Record<string, typeof filteredItems> = {};

    filteredItems.forEach(item => {
      if (!map[item.kelas]) {
        map[item.kelas] = [];
      }
      map[item.kelas].push(item);
    });

    const sortedClassNames = naturalSortKelas(Object.keys(map));
    return sortedClassNames.map(cls => ({
      kelas: cls,
      items: map[cls].sort((a, b) => {
        const timeA = a.waktu.split('-')[0].trim();
        const timeB = b.waktu.split('-')[0].trim();
        return timeA.localeCompare(timeB);
      }),
    }));
  }, [filteredItems]);

  return (
    <div className="space-y-6">
      {/* 1. NAVIGASI PILIH HARI */}
      <div className="bg-surface p-5 rounded-2xl border border-border-custom shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-custom pb-4">
          <div>
            <h2 className="text-base font-bold text-foreground">Pilih Hari Pembelajaran</h2>
            <p className="text-xs text-foreground/50">Pantau persebaran jam pelajaran di seluruh kelas pada hari tertentu</p>
          </div>

          {/* Toggle View Mode */}
          <div className="flex items-center gap-1 bg-foreground/5 p-1 rounded-xl shrink-0 border border-border-custom/40">
            <button
              onClick={() => setViewMode('per_jam')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'per_jam'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-foreground/70 hover:text-foreground hover:bg-foreground/5'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Per Jam / Timeline</span>
            </button>
            <button
              onClick={() => setViewMode('per_kelas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'per_kelas'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-foreground/70 hover:text-foreground hover:bg-foreground/5'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span>Per Kelas</span>
            </button>
          </div>
        </div>

        {/* Tombol Hari */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {HARI_LIST.map(hari => {
            const isSelected = activeDay === hari;
            const isToday = todayDayName === hari;
            return (
              <button
                key={hari}
                onClick={() => setActiveDay(hari)}
                className={`py-3 px-4 rounded-xl text-xs font-extrabold transition-all border flex flex-col items-center justify-center gap-1 ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/25 scale-[1.02]'
                    : 'bg-surface text-foreground hover:bg-foreground/5 border-border-custom hover:border-blue-400'
                }`}
              >
                <span className="text-sm tracking-wide">{hari}</span>
                {isToday && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full uppercase tracking-wider font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    Hari Ini
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. FILTER & PENCARIAN */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface p-4 rounded-2xl border border-border-custom shadow-sm">
        {/* Filter Tingkat */}
        <div className="flex items-center gap-1 bg-foreground/5 p-1 rounded-xl self-start sm:self-auto border border-border-custom/40">
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
              {tingkat === 'ALL' ? 'Semua Tingkat' : `Kelas ${tingkat}`}
            </button>
          ))}
        </div>

        {/* Input Pencarian */}
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
            placeholder="Cari kelas, mapel, atau guru..."
            className="pl-9 pr-3 py-1.5 rounded-xl text-xs bg-surface border border-border-custom text-foreground outline-none focus:ring-2 focus:ring-blue-500/30 w-full sm:w-64"
          />
        </div>
      </div>

      {/* 3. HASIL JADWAL */}
      {isLoading ? (
        <div className="bg-surface rounded-2xl border border-border-custom p-16 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-foreground">Mengambil jadwal hari {activeDay}...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border-custom p-12 text-center space-y-2">
          <h4 className="font-bold text-foreground">Tidak Ada Jadwal</h4>
          <p className="text-xs text-foreground/50">
            Tidak ada mata pelajaran yang sesuai filter pada hari {activeDay}.
          </p>
        </div>
      ) : viewMode === 'per_jam' ? (
        /* TAMPILAN TIMELINE PER JAM PELAJARAN */
        <div className="space-y-6">
          {itemsByPeriod.map((period, pIdx) => {
            const isSpecial = period.jam === 0 || period.jam === 99;

            return (
              <div
                key={pIdx}
                className="bg-surface rounded-2xl border border-border-custom shadow-sm overflow-hidden"
              >
                {/* Header Sesi */}
                <div className="p-4 bg-foreground/[0.03] border-b border-border-custom flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-extrabold ${
                        period.jam === 0
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-400/40'
                          : period.jam === 99
                          ? 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-400/40'
                          : 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                      }`}
                    >
                      {period.jam === 0 ? 'Upacara' : period.jam === 99 ? 'Istirahat' : `Jam ke-${period.jam}`}
                    </span>
                    <span className="font-mono text-xs font-bold text-foreground/70">
                      ⏱ {period.waktu} WIB
                    </span>
                  </div>
                  <span className="text-xs font-bold text-foreground/50">
                    {period.items.length} Kelas Terjadwal
                  </span>
                </div>

                {/* Grid Kelas dalam Sesi Ini */}
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {period.items.map((item, idx) => {
                    const isUpacara = item.tipe === 'upacara';
                    const isIstirahat = item.tipe === 'istirahat';

                    if (isUpacara || isIstirahat) {
                      return (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-foreground/[0.03] border border-border-custom flex items-center justify-between"
                        >
                          <span className="font-extrabold text-xs text-foreground bg-foreground/10 px-2 py-0.5 rounded-lg">
                            {item.kelas}
                          </span>
                          <span className="text-xs font-medium text-foreground/70">
                            {item.label}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border transition-all ${
                          item.colorClass?.bg || 'bg-surface'
                        } ${item.colorClass?.border || 'border-border-custom'}`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-extrabold text-xs text-foreground bg-foreground/10 px-2 py-0.5 rounded-lg">
                            {item.kelas}
                          </span>
                          {item.kode_guru && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-foreground/10 text-foreground">
                              {item.kode_guru}
                            </span>
                          )}
                        </div>
                        <h5 className="font-extrabold text-xs text-foreground line-clamp-1">
                          {item.mapel}
                        </h5>
                        <p className="text-[11px] text-foreground/70 mt-1 truncate" title={item.nama_guru}>
                          {item.nama_guru}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TAMPILAN PER KELAS */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {itemsByClass.map((classGroup, cIdx) => (
            <div
              key={cIdx}
              className="bg-surface rounded-2xl border border-border-custom shadow-sm overflow-hidden flex flex-col"
            >
              <div className="p-3.5 bg-foreground/[0.03] border-b border-border-custom flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center">
                    {classGroup.kelas}
                  </span>
                  <h4 className="font-bold text-foreground text-sm">Kelas {classGroup.kelas}</h4>
                </div>
                <span className="text-xs text-foreground/50 font-medium">
                  {classGroup.items.length} sesi
                </span>
              </div>

              <div className="p-3 space-y-2 flex-1 max-h-96 overflow-y-auto">
                {classGroup.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-foreground/[0.02] border border-border-custom/60 flex items-center justify-between text-xs gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] text-foreground/60">{item.waktu}</span>
                        <span className="font-bold text-foreground line-clamp-1">{item.label}</span>
                      </div>
                      {item.nama_guru && (
                        <p className="text-[11px] text-foreground/60 truncate mt-0.5">{item.nama_guru}</p>
                      )}
                    </div>
                    {item.kode_guru && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-foreground/10 text-foreground shrink-0">
                        {item.kode_guru}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
