import { 
  formatSpecialActivity, 
  parseJadwalItem, 
  naturalSortKelas, 
  getSubjectTheme,
  normalizeKelasToApi,
  normalizeKelasToDb,
  getCurrentSchoolDay,
  getGuruList,
  getJadwalKelas,
  getJadwalHari,
  getJadwalGuru
} from '@/lib/jadwal-api';
import { GuruMap, JadwalItem } from '@/types/jadwal';

describe('Jadwal Utilities & API Tests', () => {
  const mockGuruMap: GuruMap = {
    '1': { nama: 'Cucu Iman, S.Pd., M.M.', mapel: 'Kep.Sekolah' },
    '32A': { nama: 'Lukman Firmansyah, S.Kom', mapel: 'Informatika' },
    '48B': { nama: 'Ida Farida, S.Pd.', mapel: 'PKWU' },
  };

  test('normalizeKelasToApi converts MongoDB format (space) to API format (hyphen)', () => {
    expect(normalizeKelasToApi('X 1')).toBe('X-1');
    expect(normalizeKelasToApi('XI 4')).toBe('XI-4');
    expect(normalizeKelasToApi('XII 12')).toBe('XII-12');
    expect(normalizeKelasToApi('X-1')).toBe('X-1'); // Already hyphenated
  });

  test('normalizeKelasToDb converts API format (hyphen) to MongoDB format (space)', () => {
    expect(normalizeKelasToDb('X-1')).toBe('X 1');
    expect(normalizeKelasToDb('XI-4')).toBe('XI 4');
    expect(normalizeKelasToDb('XII-12')).toBe('XII 12');
    expect(normalizeKelasToDb('X 1')).toBe('X 1'); // Already spaced
  });

  test('getCurrentSchoolDay returns a valid school day string', () => {
    const day = getCurrentSchoolDay();
    expect(['SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT']).toContain(day);
  });

  test('naturalSortKelas sorts classes properly', () => {
    const raw = ['X-10', 'X-2', 'X-1', 'XI-12', 'XI-1', 'XII-3', 'XII-10'];
    const sorted = naturalSortKelas(raw);
    expect(sorted).toEqual(['X-1', 'X-2', 'X-10', 'XI-1', 'XI-12', 'XII-3', 'XII-10']);
  });

  test('formatSpecialActivity handles special schedule labels', () => {
    expect(formatSpecialActivity(['U', 'P', 'A', 'C', 'A', 'R', 'A', 'B', 'E', 'N', 'D', 'E', 'R', 'A'])).toBe('Upacara Bendera');
    expect(formatSpecialActivity(['I', 'S', 'T', 'I', 'R', 'A', 'H', 'A', 'T', 'P', 'E', 'R', 'T', 'A', 'M', 'A'])).toBe('Istirahat Pertama');
    expect(formatSpecialActivity(['I', 'S', 'T', 'I', 'R', 'A', 'H', 'A', 'T', 'K', 'E', 'D', 'U', 'A'])).toBe('Istirahat Kedua');
    expect(formatSpecialActivity(['K', 'O', 'K', 'U', 'L', 'I', 'K', 'U', 'L', 'E', 'R', '(A', 'S', 'R', 'I)'])).toBe('Kokurikuler (ASRI)');
  });

  test('parseJadwalItem formats teaching periods correctly', () => {
    const teachingItem: JadwalItem = {
      jam_ke_clean: 1,
      hari: 'SENIN',
      waktu: '07.10 - 07.50',
      kelas: 'X-1',
      list_kode_guru: ['48B'],
    };

    const parsed = parseJadwalItem(teachingItem, mockGuruMap);
    expect(parsed.tipe).toBe('pelajaran');
    expect(parsed.mapel).toBe('PKWU');
    expect(parsed.nama_guru).toBe('Ida Farida, S.Pd.');
    expect(parsed.kode_guru).toBe('48B');
  });

  test('parseJadwalItem formats ceremony and breaks correctly', () => {
    const upacaraItem: JadwalItem = {
      jam_ke_clean: 0,
      hari: 'SENIN',
      waktu: '06.30 - 07.10',
      kelas: 'X-1',
      list_kode_guru: ['U', 'P', 'A', 'C', 'A', 'R', 'A'],
    };
    const parsedUpacara = parseJadwalItem(upacaraItem, mockGuruMap);
    expect(parsedUpacara.tipe).toBe('upacara');
    expect(parsedUpacara.label).toBe('Upacara Bendera');

    const breakItem: JadwalItem = {
      jam_ke_clean: 99,
      hari: 'SENIN',
      waktu: '09.10 - 09.30',
      kelas: 'X-1',
      list_kode_guru: ['I', 'S', 'T', 'I', 'R', 'A', 'H', 'A', 'T', 'P', 'E', 'R', 'T', 'A', 'M', 'A'],
    };
    const parsedBreak = parseJadwalItem(breakItem, mockGuruMap);
    expect(parsedBreak.tipe).toBe('istirahat');
    expect(parsedBreak.label).toBe('Istirahat Pertama');
  });

  test('getSubjectTheme returns distinct color classes based on subject', () => {
    const mathTheme = getSubjectTheme('Matematika Wajib');
    expect(mathTheme.text).toContain('blue');

    const biologyTheme = getSubjectTheme('Biologi');
    expect(biologyTheme.text).toContain('emerald');

    const indonesianTheme = getSubjectTheme('Bahasa Indonesia');
    expect(indonesianTheme.text).toContain('rose');
  });

  describe('API fetch functions with mock', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
    });

    test('getGuruList fetches and parses teachers map', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockGuruMap,
      } as any);

      const result = await getGuruList();
      expect(result['32A'].nama).toBe('Lukman Firmansyah, S.Kom');
    });

    test('getJadwalKelas fetches schedule for specific class', async () => {
      const mockSchedule = [
        { jam_ke_clean: 1, hari: 'SENIN', waktu: '07.10 - 07.50', kelas: 'X-1', list_kode_guru: ['48B'] }
      ];
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockSchedule,
      } as any);

      const result = await getJadwalKelas('X-1');
      expect(result.length).toBe(1);
      expect(result[0].kelas).toBe('X-1');
    });

    test('getJadwalKelas converts MongoDB format ("X 1") to API format ("X-1")', async () => {
      const mockSchedule = [
        { jam_ke_clean: 1, hari: 'SENIN', waktu: '07.10 - 07.50', kelas: 'X-1', list_kode_guru: ['48B'] }
      ];
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockSchedule,
      } as any);
      global.fetch = mockFetch;

      const result = await getJadwalKelas('X 1');
      expect(result.length).toBe(1);
      // Memastikan URL yang dipanggil fetch memuat X-1, bukan X%201
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/jadwal/kelas/X-1'),
        expect.anything()
      );
    });

    test('getJadwalHari fetches schedule for specific day', async () => {
      const mockSchedule = [
        { jam_ke_clean: 1, hari: 'SENIN', waktu: '07.10 - 07.50', kelas: 'X-1', list_kode_guru: ['48B'] }
      ];
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockSchedule,
      } as any);

      const result = await getJadwalHari('SENIN');
      expect(result.length).toBe(1);
      expect(result[0].hari).toBe('SENIN');
    });

    test('getJadwalGuru searches schedule by teacher name', async () => {
      const mockSearchResult = {
        guru_terkait: ['Lukman Firmansyah, S.Kom'],
        jadwal: [
          { jam_ke_clean: 3, hari: 'SENIN', waktu: '08.30 - 09.10', kelas: 'X-4', list_kode_guru: ['32A'] }
        ]
      };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockSearchResult,
      } as any);

      const result = await getJadwalGuru('Lukman');
      expect(result).not.toBeNull();
      expect(result?.guru_terkait[0]).toBe('Lukman Firmansyah, S.Kom');
      expect(result?.jadwal[0].kelas).toBe('X-4');
    });
  });
});
