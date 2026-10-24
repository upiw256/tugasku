'use client';

import { useState, useCallback, useTransition } from 'react';
import { JadwalItem, GuruMap } from '@/types/jadwal';
import JadwalHeader from './JadwalHeader';
import JadwalStatsCards from './JadwalStatsCards';
import JadwalKelasView from './JadwalKelasView';
import JadwalHariView from './JadwalHariView';
import JadwalGuruView from './JadwalGuruView';
import DirektoriGuruView from './DirektoriGuruView';
import { 
  getJadwalKelasAction, 
  getJadwalHariAction, 
  searchJadwalGuruAction,
  getGuruListAction 
} from '@/actions/jadwal-actions';

interface AdminJadwalClientProps {
  initialClasses: string[];
  initialGuruMap: GuruMap;
  initialClassSchedule: JadwalItem[];
  defaultKelas?: string;
  totalSesi?: number;
}

export default function AdminJadwalClient({
  initialClasses,
  initialGuruMap,
  initialClassSchedule,
  defaultKelas = 'X-1',
  totalSesi = 1735,
}: AdminJadwalClientProps) {
  const [activeTab, setActiveTab] = useState<'kelas' | 'hari' | 'guru' | 'direktori'>('kelas');
  const [selectedKelas, setSelectedKelas] = useState<string>(defaultKelas);
  const [currentClassSchedule, setCurrentClassSchedule] = useState<JadwalItem[]>(initialClassSchedule);
  const [guruMap, setGuruMap] = useState<GuruMap>(initialGuruMap);
  const [targetGuruForSearch, setTargetGuruForSearch] = useState<string>('');
  
  const [isLoadingKelas, setIsLoadingKelas] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Handle pergantian kelas
  const handleSelectKelas = useCallback(async (kelas: string) => {
    setSelectedKelas(kelas);
    setIsLoadingKelas(true);
    try {
      const res = await getJadwalKelasAction(kelas);
      if (res.success) {
        setCurrentClassSchedule(res.data);
      }
    } catch (err) {
      console.error('Error loading class schedule:', err);
    } finally {
      setIsLoadingKelas(false);
    }
  }, []);

  // Fetch jadwal per hari (dipanggil dari JadwalHariView)
  const handleFetchDaySchedule = useCallback(async (hari: string) => {
    const res = await getJadwalHariAction(hari);
    if (res.success) {
      return res.data;
    }
    return [];
  }, []);

  // Search jadwal guru (dipanggil dari JadwalGuruView)
  const handleSearchGuru = useCallback(async (nama: string) => {
    const res = await searchJadwalGuruAction(nama);
    if (res.success && res.data) {
      return res.data;
    }
    return null;
  }, []);

  // Navigasi cepat dari Direktori Guru ke Tab Guru
  const handleSelectGuruFromDirektori = useCallback((namaGuru: string) => {
    setTargetGuruForSearch(namaGuru);
    setActiveTab('guru');
  }, []);

  // Refresh seluruh data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const [guruRes, kelasRes] = await Promise.all([
        getGuruListAction(),
        getJadwalKelasAction(selectedKelas),
      ]);

      if (guruRes.success) {
        setGuruMap(guruRes.data);
      }
      if (kelasRes.success) {
        setCurrentClassSchedule(kelasRes.data);
      }
    } catch (err) {
      console.error('Error refreshing jadwal data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const totalGuru = Object.keys(guruMap).length;
  const totalKelas = initialClasses.length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. HEADER */}
      <JadwalHeader
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        selectedKelas={selectedKelas}
      />

      {/* 2. STATS OVERVIEW CARDS */}
      <JadwalStatsCards
        totalGuru={totalGuru > 0 ? totalGuru : 78}
        totalKelas={totalKelas > 0 ? totalKelas : 36}
        totalSesi={totalSesi}
      />

      {/* 3. TABS NAVIGASI UTAMA (RESPONSIF TOUCH-SCROLL) */}
      <div className="flex items-center gap-1.5 sm:gap-2 border-b border-border-custom overflow-x-auto pb-1 -mx-2 px-2 sm:mx-0 sm:px-0 scrollbar-none">
        <button
          onClick={() => setActiveTab('kelas')}
          className={`flex items-center gap-1.5 sm:gap-2 px-3.5 py-2.5 sm:px-5 sm:py-3 rounded-xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all duration-200 border-b-2 -mb-1 shrink-0 ${
            activeTab === 'kelas'
              ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400 border-blue-600 shadow-sm'
              : 'text-foreground/60 hover:text-foreground hover:bg-foreground/5 border-transparent'
          }`}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span>Jadwal Per Kelas</span>
        </button>

        <button
          onClick={() => setActiveTab('hari')}
          className={`flex items-center gap-1.5 sm:gap-2 px-3.5 py-2.5 sm:px-5 sm:py-3 rounded-xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all duration-200 border-b-2 -mb-1 shrink-0 ${
            activeTab === 'hari'
              ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400 border-blue-600 shadow-sm'
              : 'text-foreground/60 hover:text-foreground hover:bg-foreground/5 border-transparent'
          }`}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Jadwal Per Hari</span>
        </button>

        <button
          onClick={() => setActiveTab('guru')}
          className={`flex items-center gap-1.5 sm:gap-2 px-3.5 py-2.5 sm:px-5 sm:py-3 rounded-xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all duration-200 border-b-2 -mb-1 shrink-0 ${
            activeTab === 'guru'
              ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400 border-blue-600 shadow-sm'
              : 'text-foreground/60 hover:text-foreground hover:bg-foreground/5 border-transparent'
          }`}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>Jadwal Guru</span>
        </button>

        <button
          onClick={() => setActiveTab('direktori')}
          className={`flex items-center gap-1.5 sm:gap-2 px-3.5 py-2.5 sm:px-5 sm:py-3 rounded-xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all duration-200 border-b-2 -mb-1 shrink-0 ${
            activeTab === 'direktori'
              ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400 border-blue-600 shadow-sm'
              : 'text-foreground/60 hover:text-foreground hover:bg-foreground/5 border-transparent'
          }`}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span>Direktori Kode Guru</span>
        </button>
      </div>

      {/* 4. KONTEN TAB AKTIF */}
      <div>
        {activeTab === 'kelas' && (
          <JadwalKelasView
            availableClasses={initialClasses}
            selectedKelas={selectedKelas}
            onSelectKelas={handleSelectKelas}
            jadwalList={currentClassSchedule}
            guruMap={guruMap}
            isLoading={isLoadingKelas}
          />
        )}

        {activeTab === 'hari' && (
          <JadwalHariView
            initialDay="SENIN"
            guruMap={guruMap}
            onFetchDaySchedule={handleFetchDaySchedule}
          />
        )}

        {activeTab === 'guru' && (
          <JadwalGuruView
            guruMap={guruMap}
            onSearchGuru={handleSearchGuru}
            initialGuruName={targetGuruForSearch}
          />
        )}

        {activeTab === 'direktori' && (
          <DirektoriGuruView
            guruMap={guruMap}
            onSelectGuru={handleSelectGuruFromDirektori}
          />
        )}
      </div>
    </div>
  );
}
