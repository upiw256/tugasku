'use client';

import { useState, useMemo } from 'react';
import { GuruMap } from '@/types/jadwal';
import { getSubjectTheme } from '@/lib/jadwal-api';

interface DirektoriGuruViewProps {
  guruMap: GuruMap;
  onSelectGuru: (nama: string) => void;
}

export default function DirektoriGuruView({ guruMap, onSelectGuru }: DirektoriGuruViewProps) {
  const [search, setSearch] = useState('');
  const [selectedMapel, setSelectedMapel] = useState<string>('ALL');

  // Format array guru
  const guruList = useMemo(() => {
    return Object.entries(guruMap).map(([kode, detail]) => ({
      kode,
      nama: detail.nama,
      mapel: detail.mapel,
    })).sort((a, b) => a.nama.localeCompare(b.nama));
  }, [guruMap]);

  // Daftar mapel unik
  const mapelList = useMemo(() => {
    const set = new Set<string>();
    guruList.forEach(g => {
      if (g.mapel) set.add(g.mapel);
    });
    return Array.from(set).sort();
  }, [guruList]);

  // Filter guru
  const filteredGuru = useMemo(() => {
    return guruList.filter(g => {
      const matchMapel = selectedMapel === 'ALL' || g.mapel === selectedMapel;
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        g.nama.toLowerCase().includes(q) ||
        g.mapel.toLowerCase().includes(q) ||
        g.kode.toLowerCase().includes(q);
      return matchMapel && matchSearch;
    });
  }, [guruList, selectedMapel, search]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. KONTROL PENCARIAN & FILTER MAPEL (RESPONSIF) */}
      <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border-custom shadow-sm space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-foreground">Direktori Guru & Kode Pengajar</h2>
            <p className="text-[11px] sm:text-xs text-foreground/50">
              Total {guruList.length} guru terdata dalam database jadwal SMAN 1 Margaasih
            </p>
          </div>

          {/* Kotak Pencarian */}
          <div className="relative w-full sm:w-64">
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
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari kode, nama, mapel..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-surface border border-border-custom text-foreground outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
        </div>

        {/* Chips Filter Mapel */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-border-custom/50 scrollbar-none">
          <button
            onClick={() => setSelectedMapel('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              selectedMapel === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-foreground/5 text-foreground/70 hover:text-foreground'
            }`}
          >
            Semua ({guruList.length})
          </button>
          {mapelList.map(mapel => (
            <button
              key={mapel}
              onClick={() => setSelectedMapel(mapel)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedMapel === mapel
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'bg-foreground/5 text-foreground/70 hover:text-foreground'
              }`}
            >
              {mapel}
            </button>
          ))}
        </div>
      </div>

      {/* 2. DIREKTORI GURU */}
      <div className="bg-surface rounded-2xl border border-border-custom shadow-sm overflow-hidden">
        {/* TAMPILAN MOBILE: KARTU LIST */}
        <div className="block sm:hidden divide-y divide-border-custom">
          {filteredGuru.length === 0 ? (
            <div className="p-8 text-center text-foreground/40 text-xs">
              Tidak ada guru yang cocok dengan kata kunci &quot;{search}&quot;
            </div>
          ) : (
            filteredGuru.map((guru, idx) => {
              const theme = getSubjectTheme(guru.mapel);
              return (
                <div key={idx} className="p-3.5 space-y-2 hover:bg-foreground/[0.02]">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded-md bg-foreground/10 text-foreground">
                        {guru.kode}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${theme.badge} ${theme.border}`}
                      >
                        {guru.mapel}
                      </span>
                    </div>
                    <button
                      onClick={() => onSelectGuru(guru.nama)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition flex items-center gap-1 shrink-0"
                    >
                      <span>Jadwal</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                  <h4 className="text-sm font-bold text-foreground">
                    {guru.nama}
                  </h4>
                </div>
              );
            })
          )}
        </div>

        {/* TAMPILAN DESKTOP/TABLET: TABEL RESMI */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-foreground/[0.03] border-b border-border-custom text-foreground/60 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Kode</th>
                <th className="px-5 py-3.5">Nama Lengkap Guru</th>
                <th className="px-5 py-3.5">Mata Pelajaran</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-custom">
              {filteredGuru.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-foreground/40 font-medium">
                    Tidak ada guru yang cocok dengan kata kunci &quot;{search}&quot;
                  </td>
                </tr>
              ) : (
                filteredGuru.map((guru, idx) => {
                  const theme = getSubjectTheme(guru.mapel);
                  return (
                    <tr
                      key={idx}
                      className="hover:bg-foreground/[0.02] transition-colors"
                    >
                      {/* Kode Guru */}
                      <td className="px-5 py-3.5 font-mono font-extrabold text-foreground">
                        <span className="px-2 py-0.5 rounded-md bg-foreground/10 text-foreground">
                          {guru.kode}
                        </span>
                      </td>

                      {/* Nama Guru */}
                      <td className="px-5 py-3.5 font-bold text-foreground">
                        {guru.nama}
                      </td>

                      {/* Mapel */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            theme.badge
                          } ${theme.border}`}
                        >
                          {guru.mapel}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => onSelectGuru(guru.nama)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-500/10 hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-400 transition-all inline-flex items-center gap-1.5"
                        >
                          <span>Jadwal</span>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Info */}
        <div className="p-3.5 sm:p-4 bg-foreground/[0.02] border-t border-border-custom flex items-center justify-between text-[11px] sm:text-xs text-foreground/50">
          <span>Menampilkan {filteredGuru.length} dari {guruList.length} guru</span>
          <span className="hidden sm:inline italic">Sinkronisasi otomatis REST API SMAN 1 Margaasih</span>
        </div>
      </div>
    </div>
  );
}
