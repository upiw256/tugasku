// types/jadwal.ts

export interface GuruDetail {
  nama: string;
  mapel: string;
}

export type GuruMap = Record<string, GuruDetail>;

export interface JadwalItem {
  jam_ke_clean: number;
  hari: string;
  waktu: string;
  kelas: string;
  list_kode_guru: string[];
}

export interface GuruScheduleSearchResult {
  guru_terkait: string[];
  jadwal: JadwalItem[];
}

export type JadwalItemType = 'pelajaran' | 'upacara' | 'istirahat' | 'kokurikuler';

export interface FormattedJadwalItem {
  jam_ke_clean: number;
  hari: string;
  waktu: string;
  kelas: string;
  tipe: JadwalItemType;
  label: string;
  kode_guru?: string;
  nama_guru?: string;
  mapel?: string;
  colorClass?: {
    bg: string;
    text: string;
    border: string;
    badge: string;
  };
}
