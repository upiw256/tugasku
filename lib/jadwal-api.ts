// lib/jadwal-api.ts

import { GuruDetail, GuruMap, GuruScheduleSearchResult, JadwalItem, FormattedJadwalItem } from '@/types/jadwal';

export const JADWAL_API_BASE_URL = 
  process.env.JADWAL_API_URL || 
  process.env.NEXT_PUBLIC_JADWAL_API_URL || 
  'https://jadwal.sman1margaasih.sch.id';

export const HARI_LIST = ['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT'] as const;
export type HariType = typeof HARI_LIST[number];

/**
 * Pemetaan warna per mata pelajaran agar jadwal visual terlihat rapi dan elegan.
 */
export function getSubjectTheme(mapel?: string) {
  if (!mapel) {
    return {
      bg: 'bg-slate-500/10 dark:bg-slate-500/20',
      text: 'text-slate-700 dark:text-slate-300',
      border: 'border-slate-300/60 dark:border-slate-700',
      badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      accent: 'border-l-slate-500',
    };
  }

  const m = mapel.toLowerCase();

  // Matematika & IPA
  if (m.includes('matematika')) {
    return {
      bg: 'bg-blue-500/10 dark:bg-blue-500/20',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-300/60 dark:border-blue-700',
      badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-200',
      accent: 'border-l-blue-500',
    };
  }
  if (m.includes('fisika')) {
    return {
      bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
      text: 'text-indigo-700 dark:text-indigo-300',
      border: 'border-indigo-300/60 dark:border-indigo-700',
      badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-200',
      accent: 'border-l-indigo-500',
    };
  }
  if (m.includes('kimia')) {
    return {
      bg: 'bg-violet-500/10 dark:bg-violet-500/20',
      text: 'text-violet-700 dark:text-violet-300',
      border: 'border-violet-300/60 dark:border-violet-700',
      badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-200',
      accent: 'border-l-violet-500',
    };
  }
  if (m.includes('biologi')) {
    return {
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-300/60 dark:border-emerald-700',
      badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200',
      accent: 'border-l-emerald-500',
    };
  }

  // Bahasa
  if (m.includes('indonesia')) {
    return {
      bg: 'bg-rose-500/10 dark:bg-rose-500/20',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-300/60 dark:border-rose-700',
      badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-200',
      accent: 'border-l-rose-500',
    };
  }
  if (m.includes('inggris')) {
    return {
      bg: 'bg-sky-500/10 dark:bg-sky-500/20',
      text: 'text-sky-700 dark:text-sky-300',
      border: 'border-sky-300/60 dark:border-sky-700',
      badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-200',
      accent: 'border-l-sky-500',
    };
  }
  if (m.includes('sunda')) {
    return {
      bg: 'bg-teal-500/10 dark:bg-teal-500/20',
      text: 'text-teal-700 dark:text-teal-300',
      border: 'border-teal-300/60 dark:border-teal-700',
      badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-200',
      accent: 'border-l-teal-500',
    };
  }

  // Sosial & Humaniora
  if (m.includes('ekonomi') || m.includes('geografi') || m.includes('sosiologi') || m.includes('sejarah')) {
    return {
      bg: 'bg-amber-500/10 dark:bg-amber-500/20',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-300/60 dark:border-amber-700',
      badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-200',
      accent: 'border-l-amber-500',
    };
  }

  // Teknologi & Prakarya
  if (m.includes('informatika')) {
    return {
      bg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
      text: 'text-cyan-700 dark:text-cyan-300',
      border: 'border-cyan-300/60 dark:border-cyan-700',
      badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/60 dark:text-cyan-200',
      accent: 'border-l-cyan-500',
    };
  }
  if (m.includes('pkwu') || m.includes('seni')) {
    return {
      bg: 'bg-fuchsia-500/10 dark:bg-fuchsia-500/20',
      text: 'text-fuchsia-700 dark:text-fuchsia-300',
      border: 'border-fuchsia-300/60 dark:border-fuchsia-700',
      badge: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/60 dark:text-fuchsia-200',
      accent: 'border-l-fuchsia-500',
    };
  }

  // Pendidikan Jasmani & Agama
  if (m.includes('pjok') || m.includes('olahraga')) {
    return {
      bg: 'bg-lime-500/10 dark:bg-lime-500/20',
      text: 'text-lime-700 dark:text-lime-300',
      border: 'border-lime-300/60 dark:border-lime-700',
      badge: 'bg-lime-100 text-lime-700 dark:bg-lime-900/60 dark:text-lime-200',
      accent: 'border-l-lime-500',
    };
  }
  if (m.includes('pai') || m.includes('pak') || m.includes('agama')) {
    return {
      bg: 'bg-emerald-600/10 dark:bg-emerald-600/20',
      text: 'text-emerald-800 dark:text-emerald-200',
      border: 'border-emerald-300/60 dark:border-emerald-700',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
      accent: 'border-l-emerald-600',
    };
  }
  if (m.includes('pkn')) {
    return {
      bg: 'bg-red-500/10 dark:bg-red-500/20',
      text: 'text-red-700 dark:text-red-300',
      border: 'border-red-300/60 dark:border-red-700',
      badge: 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-200',
      accent: 'border-l-red-500',
    };
  }
  if (m.includes('bk')) {
    return {
      bg: 'bg-purple-500/10 dark:bg-purple-500/20',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-300/60 dark:border-purple-700',
      badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-200',
      accent: 'border-l-purple-500',
    };
  }

  return {
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300/60 dark:border-blue-700',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-200',
    accent: 'border-l-blue-500',
  };
}

/**
 * Format label khusus kegiatan non-pelajaran (Upacara, Istirahat, Kokurikuler).
 */
export function formatSpecialActivity(rawList: string[]): string {
  const joined = (rawList || []).join('').toUpperCase();
  if (joined === 'UPACARABENDERA' || joined.includes('UPACARA')) {
    return 'Upacara Bendera';
  }
  if (joined === 'ISTIRAHATPERTAMA') {
    return 'Istirahat Pertama';
  }
  if (joined === 'ISTIRAHATKEDUA') {
    return 'Istirahat Kedua';
  }
  if (joined.includes('SHOLAT') || joined.includes('JUMAT')) {
    return 'Sholat Jumat / Istirahat';
  }
  if (joined.includes('KOKULIKULER') || joined.includes('KOKURIKULER')) {
    return 'Kokurikuler (ASRI)';
  }
  if (joined.length > 0) {
    return rawList.join(' ');
  }
  return 'Istirahat / Kegiatan Khusus';
}

/**
 * Memformat objek jadwal mentah ke struktur yang siap dirender di UI.
 */
export function parseJadwalItem(item: JadwalItem, guruMap: GuruMap): FormattedJadwalItem {
  if (item.jam_ke_clean === 0) {
    return {
      jam_ke_clean: 0,
      hari: item.hari,
      waktu: item.waktu,
      kelas: item.kelas,
      tipe: 'upacara',
      label: formatSpecialActivity(item.list_kode_guru),
      colorClass: {
        bg: 'bg-amber-500/10 dark:bg-amber-500/15',
        text: 'text-amber-800 dark:text-amber-200',
        border: 'border-amber-300/80 dark:border-amber-700/60',
        badge: 'bg-amber-200/80 text-amber-900 dark:bg-amber-900/80 dark:text-amber-100',
      },
    };
  }

  if (item.jam_ke_clean === 99) {
    const label = formatSpecialActivity(item.list_kode_guru);
    const isKokurikuler = label.toLowerCase().includes('kokurikuler');
    return {
      jam_ke_clean: 99,
      hari: item.hari,
      waktu: item.waktu,
      kelas: item.kelas,
      tipe: isKokurikuler ? 'kokurikuler' : 'istirahat',
      label,
      colorClass: isKokurikuler
        ? {
            bg: 'bg-teal-500/10 dark:bg-teal-500/15',
            text: 'text-teal-800 dark:text-teal-200',
            border: 'border-teal-300/80 dark:border-teal-700/60',
            badge: 'bg-teal-200/80 text-teal-900 dark:bg-teal-900/80 dark:text-teal-100',
          }
        : {
            bg: 'bg-slate-500/10 dark:bg-slate-800/40',
            text: 'text-slate-600 dark:text-slate-300',
            border: 'border-slate-200 dark:border-slate-800',
            badge: 'bg-slate-200/70 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
          },
    };
  }

  // Jam Pelajaran Reguler
  const kode = (item.list_kode_guru && item.list_kode_guru[0]) ? item.list_kode_guru[0] : '';
  const guru = kode ? guruMap[kode] : undefined;

  const mapel = guru?.mapel || 'Pelajaran';
  const nama_guru = guru?.nama || (kode ? `Guru (${kode})` : 'Guru Pengajar');
  const theme = getSubjectTheme(mapel);

  return {
    jam_ke_clean: item.jam_ke_clean,
    hari: item.hari,
    waktu: item.waktu,
    kelas: item.kelas,
    tipe: 'pelajaran',
    label: mapel,
    kode_guru: kode,
    nama_guru,
    mapel,
    colorClass: theme,
  };
}

/**
 * Natural sort untuk nama kelas: misal X-1, X-2, ... X-10, X-11, XI-1, XII-1
 */
export function naturalSortKelas(classes: string[]): string[] {
  return [...classes].sort((a, b) => {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  });
}

// ==========================================
// API FETCH CLIENT FUNCTIONS
// ==========================================

const FETCH_CONFIG: RequestInit = {
  headers: {
    'Accept': 'application/json',
  },
  // Cache per 5 menit untuk menjaga performa cepat tapi tetap sinkron dengan update
  next: { revalidate: 300 },
};

/**
 * Ambil daftar semua guru dari REST API: GET /api/guru
 */
export async function getGuruList(): Promise<GuruMap> {
  try {
    const res = await fetch(`${JADWAL_API_BASE_URL}/api/guru`, FETCH_CONFIG);
    if (!res.ok) {
      throw new Error(`Gagal mengambil data guru: HTTP ${res.status}`);
    }
    const data: GuruMap = await res.json();
    return data;
  } catch (error) {
    console.error('Error getGuruList:', error);
    return {};
  }
}

/**
 * Ambil detail guru berdasarkan kode guru: GET /api/guru/{kode_guru}
 */
export async function getGuruByKode(kodeGuru: string): Promise<GuruDetail | null> {
  try {
    const res = await fetch(`${JADWAL_API_BASE_URL}/api/guru/${encodeURIComponent(kodeGuru)}`, FETCH_CONFIG);
    if (!res.ok) {
      return null;
    }
    const data: GuruDetail = await res.json();
    return data;
  } catch (error) {
    console.error(`Error getGuruByKode (${kodeGuru}):`, error);
    return null;
  }
}

/**
 * Ambil semua data jadwal atau filter per kelas: GET /api/jadwal
 */
export async function getAllJadwal(kelasFilter?: string): Promise<JadwalItem[]> {
  try {
    const url = kelasFilter 
      ? `${JADWAL_API_BASE_URL}/api/jadwal?kelas=${encodeURIComponent(kelasFilter)}`
      : `${JADWAL_API_BASE_URL}/api/jadwal`;
    const res = await fetch(url, FETCH_CONFIG);
    if (!res.ok) {
      throw new Error(`Gagal mengambil jadwal: HTTP ${res.status}`);
    }
    const data: JadwalItem[] = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error getAllJadwal:', error);
    return [];
  }
}

/**
 * Ambil jadwal khusus untuk satu kelas: GET /api/jadwal/kelas/{kelas}
 */
export async function getJadwalKelas(kelas: string): Promise<JadwalItem[]> {
  try {
    const res = await fetch(`${JADWAL_API_BASE_URL}/api/jadwal/kelas/${encodeURIComponent(kelas)}`, FETCH_CONFIG);
    if (!res.ok) {
      if (res.status === 404) return [];
      throw new Error(`HTTP ${res.status}`);
    }
    const data: JadwalItem[] = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`Error getJadwalKelas (${kelas}):`, error);
    return [];
  }
}

/**
 * Ambil jadwal untuk semua kelas pada hari tertentu: GET /api/jadwal/hari/{hari}
 */
export async function getJadwalHari(hari: string): Promise<JadwalItem[]> {
  try {
    const res = await fetch(`${JADWAL_API_BASE_URL}/api/jadwal/hari/${encodeURIComponent(hari)}`, FETCH_CONFIG);
    if (!res.ok) {
      if (res.status === 404) return [];
      throw new Error(`HTTP ${res.status}`);
    }
    const data: JadwalItem[] = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`Error getJadwalHari (${hari}):`, error);
    return [];
  }
}

/**
 * Cari jadwal mengajar guru berdasarkan nama: GET /api/jadwal/guru/{nama_guru}
 */
export async function getJadwalGuru(namaGuru: string): Promise<GuruScheduleSearchResult | null> {
  try {
    const res = await fetch(`${JADWAL_API_BASE_URL}/api/jadwal/guru/${encodeURIComponent(namaGuru)}`, {
      ...FETCH_CONFIG,
      next: { revalidate: 120 },
    });
    if (!res.ok) {
      return null;
    }
    const data: GuruScheduleSearchResult = await res.json();
    return data;
  } catch (error) {
    console.error(`Error getJadwalGuru (${namaGuru}):`, error);
    return null;
  }
}
