'use client';

interface JadwalStatsProps {
  totalGuru: number;
  totalKelas: number;
  totalSesi: number;
}

export default function JadwalStatsCards({ totalGuru, totalKelas, totalSesi }: JadwalStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
      {/* 1. Total Guru */}
      <div className="bg-surface p-3.5 sm:p-5 rounded-2xl border border-border-custom shadow-sm relative overflow-hidden group hover:border-blue-500/40 transition-all duration-300">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-foreground/50 truncate">Tenaga Pendidik</p>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-foreground mt-0.5 sm:mt-1 truncate">
              {totalGuru} <span className="text-[10px] sm:text-xs font-normal text-foreground/50">Guru</span>
            </h3>
            <p className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5 truncate">Database Aktif</p>
          </div>
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* 2. Total Rombel / Kelas */}
      <div className="bg-surface p-3.5 sm:p-5 rounded-2xl border border-border-custom shadow-sm relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-foreground/50 truncate">Rombel / Kelas</p>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-foreground mt-0.5 sm:mt-1 truncate">
              {totalKelas} <span className="text-[10px] sm:text-xs font-normal text-foreground/50">Kelas</span>
            </h3>
            <p className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 truncate">Tingkat X, XI, XII</p>
          </div>
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        </div>
      </div>

      {/* 3. Total Sesi */}
      <div className="bg-surface p-3.5 sm:p-5 rounded-2xl border border-border-custom shadow-sm relative overflow-hidden group hover:border-violet-500/40 transition-all duration-300">
        <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl group-hover:bg-violet-500/10 transition-colors" />
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-foreground/50 truncate">Sesi Mengajar</p>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-foreground mt-0.5 sm:mt-1 truncate">
              {totalSesi > 0 ? totalSesi.toLocaleString('id-ID') : '1.735'} <span className="text-[10px] sm:text-xs font-normal text-foreground/50">Sesi</span>
            </h3>
            <p className="text-[10px] sm:text-xs text-violet-600 dark:text-violet-400 font-medium mt-0.5 truncate">Tatap Muka/Minggu</p>
          </div>
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* 4. Hari Aktif */}
      <div className="bg-surface p-3.5 sm:p-5 rounded-2xl border border-border-custom shadow-sm relative overflow-hidden group hover:border-amber-500/40 transition-all duration-300">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-foreground/50 truncate">Hari Belajar</p>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-foreground mt-0.5 sm:mt-1 truncate">
              5 <span className="text-[10px] sm:text-xs font-normal text-foreground/50">Hari</span>
            </h3>
            <p className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400 font-medium mt-0.5 truncate">Senin s/d Jumat</p>
          </div>
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
