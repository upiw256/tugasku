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
 * Server action untuk mengambil data guru (dapat diakses Admin, Guru, dan Siswa)
 */
export async function getGuruListAction(): Promise<{
  success: boolean;
  data: GuruMap;
  message?: string;
}> {
  try {
    const session = await auth();
    if (!session) {
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
 * Server action khusus Siswa: mengambil jadwal sesuai dengan kelasnya dari MongoDB.
 * Otomatis mengonversi format MongoDB "X 1" ke format API "X-1".
 */
export async function getJadwalSiswaAction(): Promise<{
  success: boolean;
  data: JadwalItem[];
  kelasDb: string;
  kelasApi: string;
  message?: string;
}> {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'siswa') {
      return { success: false, data: [], kelasDb: '', kelasApi: '', message: 'Unauthorized' };
    }

    const { connectDB } = await import('@/lib/db');
    const { User, Member } = await import('@/models');
    await connectDB();

    const userDoc = await User.findOne({ user: session.user.email });
    if (!userDoc?.member_id) {
      return { success: false, data: [], kelasDb: '', kelasApi: '', message: 'Profil siswa tidak ditemukan' };
    }

    const memberDoc = await Member.findById(userDoc.member_id);
    if (!memberDoc?.kelas) {
      return { success: false, data: [], kelasDb: '', kelasApi: '', message: 'Data kelas siswa belum diatur di sistem' };
    }

    const kelasDb = memberDoc.kelas; // Misal: "X 1"
    const data = await getJadwalKelas(kelasDb); // Otomatis dikonversi ke "X-1" oleh normalizeKelasToApi

    return { 
      success: true, 
      data, 
      kelasDb, 
      kelasApi: memberDoc.kelas.trim().replace(/\s+/g, '-') 
    };
  } catch (error: any) {
    console.error('Error in getJadwalSiswaAction:', error);
    return { success: false, data: [], kelasDb: '', kelasApi: '', message: error?.message || 'Gagal mengambil jadwal siswa' };
  }
}

/**
 * Server action untuk mengambil jadwal kelas spesifik (Admin/Guru)
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
