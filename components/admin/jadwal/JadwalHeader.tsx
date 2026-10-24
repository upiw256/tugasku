'use client';

import { useState } from 'react';

interface JadwalHeaderProps {
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  selectedKelas?: string;
}

export default function JadwalHeader({ onRefresh, isRefreshing, selectedKelas }: JadwalHeaderProps) {
  const [showApiInfo, setShowApiInfo] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface p-5 md:p-6 rounded-2xl border border-border-custom shadow-sm relative overflow-hidden">
        {/* Dekorasi Gradient Halus */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent rounded-full pointer-events-none blur-3xl" />

        {/* Informasi Judul */}
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              SMAN 1 Margaasih
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              REST API Terhubung
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
            Jadwal Pelajaran Sekolah
          </h1>
          <p className="text-sm text-foreground/60 mt-1 max-w-2xl">
            Sistem pemantauan jadwal pelajaran terintegrasi FastAPI & database jadwal SMAN 1 Margaasih. 
            Lihat jadwal lengkap per kelas, per hari, atau telusuri agenda mengajar guru.
          </p>
        </div>

        {/* Tombol Aksi */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={() => setShowApiInfo(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-foreground/5 hover:bg-foreground/10 text-foreground transition-colors border border-border-custom"
            title="Lihat status dan panduan endpoint API"
          >
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Info API</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-foreground/5 hover:bg-foreground/10 text-foreground transition-colors border border-border-custom"
            title="Cetak jadwal tampilan saat ini"
          >
            <svg className="w-4 h-4 text-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Cetak Jadwal</span>
          </button>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm shadow-blue-500/20 disabled:opacity-50"
          >
            <svg
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{isRefreshing ? 'Memuat...' : 'Segarkan Data'}</span>
          </button>
        </div>
      </div>

      {/* MODAL INFO INTEGRASI API */}
      {showApiInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface border border-border-custom w-full max-w-xl rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border-custom">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg">Integrasi REST API Jadwal</h3>
                  <p className="text-xs text-foreground/50">FastAPI backend SMAN 1 Margaasih</p>
                </div>
              </div>
              <button
                onClick={() => setShowApiInfo(false)}
                className="p-1.5 text-foreground/50 hover:text-foreground rounded-lg hover:bg-foreground/5 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="bg-foreground/5 p-3.5 rounded-xl border border-border-custom">
                <p className="font-semibold text-foreground mb-1">Base Endpoint:</p>
                <code className="text-blue-600 dark:text-blue-400 font-mono text-[11px] block bg-surface p-2 rounded-lg border border-border-custom">
                  https://jadwal.sman1margaasih.sch.id
                </code>
              </div>

              <div>
                <p className="font-bold text-foreground mb-2">Endpoint yang Digunakan:</p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 bg-foreground/[0.02] p-2.5 rounded-lg border border-border-custom/50">
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">GET</span>
                    <div>
                      <code className="font-mono text-foreground font-semibold">/api/guru</code>
                      <p className="text-foreground/60 text-[11px] mt-0.5">Mengambil kamus seluruh guru, gelar, dan mata pelajaran.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2 bg-foreground/[0.02] p-2.5 rounded-lg border border-border-custom/50">
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">GET</span>
                    <div>
                      <code className="font-mono text-foreground font-semibold">/api/jadwal/kelas/:kelas</code>
                      <p className="text-foreground/60 text-[11px] mt-0.5">Jadwal lengkap mingguan rombel (contoh: X-1, XI-4, XII-12).</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2 bg-foreground/[0.02] p-2.5 rounded-lg border border-border-custom/50">
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">GET</span>
                    <div>
                      <code className="font-mono text-foreground font-semibold">/api/jadwal/hari/:hari</code>
                      <p className="text-foreground/60 text-[11px] mt-0.5">Jadwal seluruh rombel pada hari tertentu (SENIN - JUMAT).</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2 bg-foreground/[0.02] p-2.5 rounded-lg border border-border-custom/50">
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">GET</span>
                    <div>
                      <code className="font-mono text-foreground font-semibold">/api/jadwal/guru/:nama_guru</code>
                      <p className="text-foreground/60 text-[11px] mt-0.5">Pencarian jadwal tatap muka guru secara substring case-insensitive.</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20 text-foreground/80">
                <p className="font-semibold text-blue-600 dark:text-blue-400 mb-0.5">Real-time Sinkronisasi:</p>
                Data diperbarui langsung saat file <code className="font-mono text-foreground font-semibold">database_jadwal.json</code> diperbarui tanpa perlu restart container.
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowApiInfo(false)}
                className="px-4 py-2 bg-foreground/10 hover:bg-foreground/15 text-foreground rounded-xl text-xs font-bold transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
