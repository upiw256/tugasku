// actions/jadwal-actions.ts
'use server'

import { auth } from '@/lib/auth';
import { 
  getGuruList, 
  getGuruByKode, 
  getJadwalKelas, 
  getJadwalHari, 
  getJadwalGuru,
  naturalSortKelas,
  getAllJadwal
} from '@/lib/jadwal-api';
import { GuruMap, GuruScheduleSearchResult, JadwalItem } from '@/types/jadwal';

/**
 * Server action untuk mengambil data guru
 */
export async function getGuruListAction(): Promise<{
  success: boolean;
  data: GuruMap;
  message?: string;
}> {
  try {
    const session = await auth();
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'guru')) {
      return { success: false, data: {}, message: 'Unauthorized' };
    }

    const data = await getGuruList();
    return { success: true, data };
  } catch (error: any) {
    console.error('Error in getGuruListAction:', error);
    return { success: false, data: {}, message: error?.message || 'Gagal mengambil data guru' };
  }
}

/**
 * Server action untuk mengambil jadwal kelas spesifik
 */
export async function getJadwalKelasAction(kelas: string): Promise<{
  success: boolean;
  data: JadwalItem[];
  message?: string;
}> {
  try {
    const session = await auth();
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'guru')) {
      return { success: false, data: [], message: 'Unauthorized' };
    }

    const data = await getJadwalKelas(kelas);
    return { success: true, data };
  } catch (error: any) {
    console.error('Error in getJadwalKelasAction:', error);
    return { success: false, data: [], message: error?.message || 'Gagal mengambil jadwal kelas' };
  }
}

/**
 * Server action untuk mengambil jadwal per hari
 */
export async function getJadwalHariAction(hari: string): Promise<{
  success: boolean;
  data: JadwalItem[];
  message?: string;
}> {
  try {
    const session = await auth();
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'guru')) {
      return { success: false, data: [], message: 'Unauthorized' };
    }

    const data = await getJadwalHari(hari);
    return { success: true, data };
  } catch (error: any) {
    console.error('Error in getJadwalHariAction:', error);
    return { success: false, data: [], message: error?.message || 'Gagal mengambil jadwal hari' };
  }
}

/**
 * Server action untuk mencari jadwal mengajar guru berdasarkan nama
 */
export async function searchJadwalGuruAction(namaGuru: string): Promise<{
  success: boolean;
  data: GuruScheduleSearchResult | null;
  message?: string;
}> {
  try {
    const session = await auth();
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'guru')) {
      return { success: false, data: null, message: 'Unauthorized' };
    }

    if (!namaGuru || namaGuru.trim().length === 0) {
      return { success: false, data: null, message: 'Nama guru wajib diisi' };
    }

    const data = await getJadwalGuru(namaGuru.trim());
    if (!data) {
      return { success: false, data: null, message: `Tidak ditemukan jadwal untuk guru: "${namaGuru}"` };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error in searchJadwalGuruAction:', error);
    return { success: false, data: null, message: error?.message || 'Gagal mencari jadwal guru' };
  }
}
