import { NextRequest } from 'next/server';
import { createApiHandler, ApiContext } from '@/lib/api/handler';
import { apiSuccess } from '@/lib/api/response';
import { connectDB } from '@/lib/db';
import { Member } from '@/models';

// GET /api/v1/leaderboard
// Mengambil data peringkat / leaderboard termasuk Poin Keaktifan, Rata-rata Tugas, dan Kuis
export const GET = createApiHandler(
  async (req: NextRequest, ctx: ApiContext) => {
    await connectDB();
    const searchParams = req.nextUrl.searchParams;

    const kelas = searchParams.get('kelas');
    const sortBy = searchParams.get('sort_by') || 'total_score'; // 'total_score' | 'poin_keaktifan'
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));

    const filter: any = {};
    if (ctx.user?.role === 'siswa') {
      // Siswa default melihat kelasnya sendiri jika tidak ditentukan
      if (kelas) {
        filter.kelas = kelas;
      } else if (ctx.user.kelas && ctx.user.kelas !== '-') {
        filter.kelas = ctx.user.kelas;
      }
    } else if (kelas) {
      filter.kelas = kelas;
    }

    const sortStage: any =
      sortBy === 'poin_keaktifan'
        ? { poin_keaktifan: -1, totalScore: -1 }
        : { totalScore: -1, poin_keaktifan: -1 };

    const studentStats = await Member.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'nilais',
          localField: '_id',
          foreignField: 'member_id',
          as: 'tugas_data',
        },
      },
      {
        $lookup: {
          from: 'pengerjaankuis',
          localField: '_id',
          foreignField: 'member_id',
          as: 'kuis_data',
        },
      },
      {
        $project: {
          nama_lengkap: 1,
          kelas: 1,
          nis: 1,
          poin_keaktifan: { $ifNull: ['$poin_keaktifan', 0] },
          totalTugas: { $ifNull: [{ $avg: '$tugas_data.nilai' }, 0] },
          totalKuis: {
            $ifNull: [
              {
                $avg: {
                  $map: {
                    input: {
                      $filter: {
                        input: '$kuis_data',
                        as: 'k',
                        cond: { $eq: ['$$k.status', 'SUBMITTED'] },
                      },
                    },
                    as: 'item',
                    in: '$$item.nilai',
                  },
                },
              },
              0,
            ],
          },
        },
      },
      {
        $project: {
          _id: 1,
          nis: 1,
          nama: '$nama_lengkap',
          kelas: 1,
          poin_keaktifan: 1,
          avg_tugas: { $round: ['$totalTugas', 2] },
          avg_kuis: { $round: ['$totalKuis', 2] },
          totalScore: {
            $round: [
              {
                $add: [
                  { $ifNull: ['$totalTugas', 0] },
                  { $ifNull: ['$totalKuis', 0] },
                  { $ifNull: ['$poin_keaktifan', 0] },
                ],
              },
              2,
            ],
          },
        },
      },
      { $sort: sortStage },
      { $limit: limit },
    ]);

    const formatted = studentStats.map((item, idx) => ({
      rank: idx + 1,
      id: item._id.toString(),
      nis: item.nis,
      nama: item.nama,
      kelas: item.kelas,
      poin_keaktifan: item.poin_keaktifan || 0,
      avg_tugas: item.avg_tugas || 0,
      avg_kuis: item.avg_kuis || 0,
      total_score: item.totalScore || 0,
      is_current_user: ctx.user?.member_id === item._id.toString(),
    }));

    return apiSuccess(
      {
        filter_kelas: filter.kelas || 'SEMUA',
        sort_by: sortBy,
        total_items: formatted.length,
        leaderboard: formatted,
      },
      'Data leaderboard & poin keaktifan berhasil diambil'
    );
  },
  {
    requireApiKey: true,
    authRequired: true,
  }
);
