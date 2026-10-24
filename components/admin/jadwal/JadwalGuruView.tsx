'use client';

import { useState, useMemo } from 'react';
import { GuruMap, GuruScheduleSearchResult } from '@/types/jadwal';
import { HARI_LIST, parseJadwalItem, getSubjectTheme } from '@/lib/jadwal-api';

interface JadwalGuruViewProps {
  guruMap: GuruMap;
  onSearchGuru: (nama: string) => Promise<GuruScheduleSearchResult | null>;
  initialGuruName?: string;
}

export default function JadwalGuruView({
  guruMap,
  onSearchGuru,
  initialGuruName = '',
}: JadwalGuruViewProps) {
  const [query, setQuery] = useState(initialGuruName);
  const [selectedGuruName, setSelectedGuruName] = useState(initialGuruName);
  const [searchResult, setSearchResult] = useState<GuruScheduleSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Daftar nama unik guru untuk saran pencarian
  const allGuruEntries = useMemo(() => {
    const list: { kode: string; nama: string; mapel: string }[] = [];
    Object.entries(guruMap).forEach(([kode, detail]) => {
      list.push({ kode, nama: detail.nama, mapel: detail.mapel });
    });
    return list.sort((a, b) => a.nama.localeCompare(b.nama));
  }, [guruMap]);

  // Saran guru saat mengetik
  const suggestions = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase().trim();
    return allGuruEntries.filter(g =>
      g.nama.toLowerCase().includes(q) ||
      g.mapel.toLowerCase().includes(q) ||
      g.kode.toLowerCase() === q
    ).slice(0, 8);
  }, [allGuruEntries, query]);

  // Eksekusi pencarian guru
  const handleExecuteSearch = async (nama: string) => {
    if (!nama.trim()) return;
    setIsLoading(true);
    setErrorMessage('');
    setSelectedGuruName(nama);

    try {
      const res = await onSearchGuru(nama);
      if (res && res.jadwal && res.jadwal.length > 0) {
        setSearchResult(res);
      } else {
        setSearchResult(null);
        setErrorMessage(`Tidak ditemukan jadwal aktif untuk guru dengan nama "${nama}".`);
      }
    } catch (err: any) {
      setSearchResult(null);
      setErrorMessage(err?.message || 'Terjadi kesalahan saat mencari jadwal guru.');
    } finally {
      setIsLoading(false);
    }
  };

  // Format jadwal yang ditemukan
  const formattedJadwal = useMemo(() => {
    if (!searchResult?.jadwal) return [];
    return searchResult.jadwal.map(item => parseJadwalItem(item, guruMap));
  }, [searchResult, guruMap]);

  // Kelompokkan jadwal guru per hari
  const scheduleByDay = useMemo(() => {
    const map: Record<string, typeof formattedJadwal> = {};
    HARI_LIST.forEach(h => {
      map[h] = [];
    });

    formattedJadwal.forEach(item => {
      if (map[item.hari]) {
        map[item.hari].push(item);
      }
    });

    HARI_LIST.forEach(h => {
      map[h].sort((a, b) => {
        const timeA = a.waktu.split('-')[0].trim();
        const timeB = b.waktu.split('-')[0].trim();
        return timeA.localeCompare(timeB);
      });
    });

    return map;
  }, [formattedJadwal]);

  // Daftar rombel unik tempat guru mengajar
  const classesTaught = useMemo(() => {
    if (!formattedJadwal.length) return [];
    return [...new Set(formattedJadwal.map(j => j.kelas))].sort();
  }, [formattedJadwal]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. KOTAK PENCARIAN GURU (RESPONSIF) */}
      <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border-custom shadow-sm space-y-3 sm:space-y-4">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-foreground">Cari Jadwal Mengajar Guru</h2>
          <p className="text-[11px] sm:text-xs text-foreground/50">
            Ketik nama depan, panggilan, gelar, atau mata pelajaran guru
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          <div className="relative flex-1">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-foreground/40 absolute left-3.5 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleExecuteSearch(query);
              }}
              placeholder="Contoh: Lukman, Farida, Suhara, Biologi..."
              className="w-full pl-10 sm:pl-11 pr-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm bg-surface border border-border-custom text-foreground outline-none focus:ring-2 focus:ring-blue-500/30 font-medium"
            />
          </div>

          <button
            onClick={() => handleExecuteSearch(query)}
            disabled={isLoading || !query.trim()}
            className="w-full sm:w-auto px-5 py-2 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 shrink-0 flex items-center justify-center gap-2"
          >
            {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            <span>Cari Jadwal</span>
          </button>
        </div>

        {/* Saran Guru Cepat Saat Mengetik */}
        {suggestions.length > 0 && (
          <div className="pt-2 border-t border-border-custom">
            <p className="text-[10px] sm:text-[11px] font-bold text-foreground/50 uppercase tracking-wider mb-2">
              Saran Cepat:
            </p>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(s.nama);
                    handleExecuteSearch(s.nama);
                  }}
                  className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-foreground/[0.04] hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-500/30 border border-border-custom text-[11px] sm:text-xs font-medium text-foreground transition-all flex items-center gap-1.5"
                >
                  <span className="font-bold">{s.nama}</span>
                  <span className="text-[10px] opacity-60">({s.mapel})</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. PROFIL GURU & RINGKASAN (RESPONSIF) */}
      {searchResult && (
        <div className="bg-surface p-4 sm:p-6 rounded-2xl border border-border-custom shadow-sm relative overflow-hidden space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-extrabold text-xl sm:text-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 shrink-0">
                {searchResult.guru_terkait[0]?.charAt(0).toUpperCase() || 'G'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    Tenaga Pendidik
                  </span>
                  {classesTaught.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {classesTaught.length} Kelas
                    </span>
                  )}
                </div>
                <h3 className="text-base sm:text-xl md:text-2xl font-extrabold text-foreground mt-0.5 truncate">
                  {searchResult.guru_terkait[0] || selectedGuruName}
                </h3>
                <p className="text-xs text-foreground/60 truncate">
                  Mata Pelajaran:{' '}
                  <span className="font-bold text-foreground">
                    {formattedJadwal[0]?.mapel || 'Pengajar'}
                  </span>
                </p>
              </div>
            </div>

            {/* Statistik Sesi Guru */}
            <div className="flex items-center justify-between sm:justify-start gap-3 shrink-0 bg-foreground/[0.03] p-2.5 sm:p-3 rounded-xl border border-border-custom w-full md:w-auto">
              <div className="text-left sm:text-right">
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-foreground/40">Beban Mengajar</p>
                <p className="text-lg sm:text-xl font-extrabold text-foreground">
                  {formattedJadwal.length} <span className="text-xs font-normal text-foreground/60">Jam/Minggu</span>
                </p>
              </div>
              <button
                onClick={() => window.print()}
                className="p-2 sm:p-2.5 rounded-lg bg-foreground/5 hover:bg-foreground/10 text-foreground transition-colors border border-border-custom"
                title="Cetak Jadwal Guru"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Badge Kelas-Kelas yang Diampu */}
          {classesTaught.length > 0 && (
            <div className="pt-3 border-t border-border-custom flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-foreground/50">Rombel:</span>
              {classesTaught.map(cls => (
                <span
                  key={cls}
                  className="px-2 py-0.5 rounded-lg text-xs font-bold bg-foreground/5 border border-border-custom text-foreground"
                >
                  {cls}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. HASIL JADWAL MINGGUAN GURU */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium text-center">
          {errorMessage}
        </div>
      )}

      {searchResult && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {HARI_LIST.map(hari => {
            const sessions = scheduleByDay[hari] || [];

            return (
              <div
                key={hari}
                className="bg-surface rounded-2xl border border-border-custom shadow-sm overflow-hidden flex flex-col"
              >
                <div className="p-3 sm:p-3.5 bg-foreground/[0.03] border-b border-border-custom flex items-center justify-between">
                  <span className="font-extrabold text-foreground text-xs sm:text-sm tracking-wide">{hari}</span>
                  <span className="text-xs font-bold text-foreground/40">{sessions.length} Jam</span>
                </div>

                <div className="p-2.5 sm:p-3 space-y-2 flex-1 max-h-[420px] sm:max-h-[500px] overflow-y-auto">
                  {sessions.length === 0 ? (
                    <p className="text-xs text-foreground/30 text-center py-6">Tidak ada jam mengajar</p>
                  ) : (
                    sessions.map((sesi, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 sm:p-3 rounded-xl border transition-all ${
                          sesi.colorClass?.bg || 'bg-surface'
                        } ${sesi.colorClass?.border || 'border-border-custom'}`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-semibold text-foreground/60 mb-1">
                          <span className="px-1.5 py-0.5 rounded-md bg-foreground/10 font-bold text-foreground">
                            Jam ke-{sesi.jam_ke_clean}
                          </span>
                          <span className="font-mono text-foreground/70">{sesi.waktu}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs sm:text-sm font-extrabold text-foreground">
                            Kelas {sesi.kelas}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                            {sesi.mapel}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Jika Belum Melakukan Pencarian */}
      {!searchResult && !errorMessage && !isLoading && (
        <div className="bg-surface rounded-2xl border border-border-custom p-8 sm:p-12 text-center space-y-3">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-500/10 text-blue-600 mx-auto flex items-center justify-center">
            <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h4 className="font-bold text-foreground text-sm sm:text-base">Cari Jadwal Guru Pengajar</h4>
          <p className="text-xs text-foreground/50 max-w-md mx-auto">
            Masukkan nama guru pada kotak pencarian di atas untuk melihat seluruh jam tatap muka mingguan, rombel yang diajar, dan ringkasan beban mengajar.
          </p>
        </div>
      )}
    </div>
  );
}
