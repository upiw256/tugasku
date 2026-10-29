'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Swal from 'sweetalert2';
import {
  ApiKeyItem,
  MasterKeyInfo,
  getApiKeysAction,
  createApiKeyAction,
  toggleApiKeyStatusAction,
  deleteApiKeyAction,
} from '@/actions/api-key-actions';

export default function ApiKeyManager() {
  const [loading, setLoading] = useState(true);
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [masterKey, setMasterKey] = useState<MasterKeyInfo | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal Create
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [owner, setOwner] = useState('');
  const [rateLimit, setRateLimit] = useState(100);
  const [expiresInDays, setExpiresInDays] = useState('365');
  const [allowedIps, setAllowedIps] = useState('*');
  const [permissions, setPermissions] = useState<string[]>(['read', 'write']);

  // Modal Newly Generated Key
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showMasterKey, setShowMasterKey] = useState(false);
  const [copiedMasterKey, setCopiedMasterKey] = useState(false);

  const fetchKeys = async () => {
    setLoading(true);
    const res = await getApiKeysAction();
    if (res.success && res.data) {
      setKeys(res.data);
      if (res.masterKey) setMasterKey(res.masterKey);
    } else {
      Swal.fire({
        title: 'Error',
        text: res.message || 'Gagal mengambil data API Key',
        icon: 'error',
        background: 'var(--surface)',
        color: 'var(--foreground)',
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !owner.trim()) {
      Swal.fire({
        title: 'Peringatan',
        text: 'Nama aplikasi dan pemilik wajib diisi',
        icon: 'warning',
        background: 'var(--surface)',
        color: 'var(--foreground)',
      });
      return;
    }

    setSubmitting(true);
    const ips = allowedIps
      .split(',')
      .map((ip) => ip.trim())
      .filter(Boolean);

    const res = await createApiKeyAction({
      name,
      owner,
      permissions,
      rate_limit: Number(rateLimit) || 100,
      allowed_ips: ips.length > 0 ? ips : ['*'],
      expires_in_days: Number(expiresInDays) || 0,
    });

    setSubmitting(false);

    if (res.success && res.generatedKey) {
      setIsCreateOpen(false);
      setName('');
      setOwner('');
      setRateLimit(100);
      setAllowedIps('*');
      setPermissions(['read', 'write']);

      setNewlyCreatedKey(res.generatedKey);
      fetchKeys();
    } else {
      Swal.fire({
        title: 'Gagal',
        text: res.message,
        icon: 'error',
        background: 'var(--surface)',
        color: 'var(--foreground)',
      });
    }
  };

  const handleToggle = async (keyItem: ApiKeyItem) => {
    const actionText = keyItem.is_active ? 'menonaktifkan' : 'mengaktifkan';
    const confirm = await Swal.fire({
      title: `${keyItem.is_active ? 'Nonaktifkan' : 'Aktifkan'} API Key?`,
      text: `Apakah Anda yakin ingin ${actionText} API Key "${keyItem.name}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Lanjutkan',
      cancelButtonText: 'Batal',
      background: 'var(--surface)',
      color: 'var(--foreground)',
    });

    if (!confirm.isConfirmed) return;

    const res = await toggleApiKeyStatusAction(keyItem.id, keyItem.is_active);
    if (res.success) {
      Swal.fire({
        title: 'Berhasil',
        text: res.message,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: 'var(--surface)',
        color: 'var(--foreground)',
      });
      fetchKeys();
    } else {
      Swal.fire({
        title: 'Gagal',
        text: res.message,
        icon: 'error',
        background: 'var(--surface)',
        color: 'var(--foreground)',
      });
    }
  };

  const handleDelete = async (keyItem: ApiKeyItem) => {
    const confirm = await Swal.fire({
      title: 'Hapus / Cabut API Key?',
      html: `API Key <b>"${keyItem.name}"</b> akan dicabut secara permanen. Klien yang menggunakan kunci ini akan langsung ditolak aksesnya (401 Unauthorized).`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Ya, Cabut Kunci Ini',
      cancelButtonText: 'Batal',
      background: 'var(--surface)',
      color: 'var(--foreground)',
    });

    if (!confirm.isConfirmed) return;

    const res = await deleteApiKeyAction(keyItem.id);
    if (res.success) {
      Swal.fire({
        title: 'Berhasil',
        text: res.message,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: 'var(--surface)',
        color: 'var(--foreground)',
      });
      fetchKeys();
    } else {
      Swal.fire({
        title: 'Gagal',
        text: res.message,
        icon: 'error',
        background: 'var(--surface)',
        color: 'var(--foreground)',
      });
    }
  };

  const copyToClipboard = (text: string, isMaster = false) => {
    navigator.clipboard.writeText(text);
    if (isMaster) {
      setCopiedMasterKey(true);
      setTimeout(() => setCopiedMasterKey(false), 2000);
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const filteredKeys = keys.filter((k) => {
    const matchSearch =
      k.name.toLowerCase().includes(search.toLowerCase()) ||
      k.owner.toLowerCase().includes(search.toLowerCase()) ||
      k.masked_key.toLowerCase().includes(search.toLowerCase());

    if (statusFilter === 'ACTIVE') return matchSearch && k.is_active;
    if (statusFilter === 'INACTIVE') return matchSearch && !k.is_active;
    return matchSearch;
  });

  const activeCount = keys.filter((k) => k.is_active).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-custom pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-500/10 text-blue-500 rounded-lg text-xl">🔑</span>
            <h1 className="text-2xl font-bold text-foreground">Manajemen API Key</h1>
          </div>
          <p className="text-sm text-foreground/60 mt-1">
            Kelola kunci otorisasi REST API (Layer 1 Security) untuk aplikasi mobile, bot, dan integrasi eksternal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/docs"
            target="_blank"
            className="px-4 py-2 text-sm font-semibold text-foreground/80 bg-foreground/5 hover:bg-foreground/10 border border-border-custom rounded-lg transition flex items-center gap-1.5"
          >
            <span>📖</span> Swagger UI Docs
          </Link>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>➕</span> Buat API Key Baru
          </button>
        </div>
      </div>

      {/* MASTER API KEY CARD */}
      {masterKey && (
        <div className="bg-gradient-to-r from-blue-900/20 via-indigo-900/10 to-transparent p-5 rounded-xl border border-blue-500/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Master Key (Internal / Dev)
                </span>
                {masterKey.is_custom_env ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Custom (.env.local)
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Default Fallback
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-foreground">Kunci Master Sistem</h3>
              <p className="text-xs text-foreground/70 max-w-2xl">
                Kunci ini memiliki hak akses bypass penuh (1000 req/min). Cocok untuk backend bot server, development lokal, atau pengujian otomatis di Swagger tanpa perlu query database.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-surface/80 p-2 rounded-lg border border-border-custom self-start md:self-auto">
              <code className="text-xs sm:text-sm font-mono text-blue-400 font-bold px-2">
                {showMasterKey ? masterKey.key : '••••••••••••••••••••••••••••••••'}
              </code>
              <button
                type="button"
                onClick={() => setShowMasterKey(!showMasterKey)}
                className="text-xs px-2 py-1 text-foreground/70 hover:text-foreground bg-foreground/5 hover:bg-foreground/10 rounded transition"
                title={showMasterKey ? 'Sembunyikan' : 'Tampilkan'}
              >
                {showMasterKey ? '🙈 Tutup' : '👁️ Lihat'}
              </button>
              <button
                type="button"
                onClick={() => copyToClipboard(masterKey.key, true)}
                className="text-xs px-2.5 py-1 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition flex items-center gap-1"
              >
                {copiedMasterKey ? '✓ Tersalin!' : '📋 Salin'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface p-4 rounded-xl border border-border-custom shadow-xs">
          <p className="text-xs text-foreground/60 font-medium">Total API Key</p>
          <p className="text-2xl font-bold text-foreground mt-1">{keys.length}</p>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-border-custom shadow-xs">
          <p className="text-xs text-emerald-500 font-medium">Kunci Aktif</p>
          <p className="text-2xl font-bold text-emerald-500 mt-1">{activeCount}</p>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-border-custom shadow-xs">
          <p className="text-xs text-amber-500 font-medium">Kunci Nonaktif</p>
          <p className="text-2xl font-bold text-amber-500 mt-1">{keys.length - activeCount}</p>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface p-3 rounded-xl border border-border-custom">
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-foreground/40 text-sm">
            🔍
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, pemilik, atau masked key..."
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-background border border-border-custom rounded-lg text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <span className="text-xs text-foreground/60 font-medium mr-1">Status:</span>
          {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setStatusFilter(mode)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                statusFilter === mode
                  ? 'bg-blue-600 text-white'
                  : 'bg-background text-foreground/70 hover:bg-foreground/5 border border-border-custom'
              }`}
            >
              {mode === 'ALL' ? 'Semua' : mode === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
            </button>
          ))}
        </div>
      </div>

      {/* TABLE / LIST OF API KEYS */}
      <div className="bg-surface rounded-xl border border-border-custom shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-foreground/60">
            <div className="inline-block animate-spin text-2xl mb-2">⏳</div>
            <p className="text-sm">Memuat data API Key...</p>
          </div>
        ) : filteredKeys.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="text-4xl text-foreground/20">🗝️</div>
            <h3 className="text-base font-bold text-foreground">Belum ada API Key kustom</h3>
            <p className="text-xs text-foreground/60 max-w-md mx-auto">
              Buat API Key baru agar aplikasi klien (misal: Aplikasi Mobile Siswa atau Bot) dapat berinteraksi secara aman dengan REST API TugasKu.
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="mt-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
            >
              + Buat API Key Pertama
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border-custom bg-foreground/5 text-foreground/70 text-xs font-semibold">
                  <th className="py-3 px-4">Aplikasi & Pemilik</th>
                  <th className="py-3 px-4">Masked Key</th>
                  <th className="py-3 px-4">Rate Limit & IP</th>
                  <th className="py-3 px-4">Hak Akses</th>
                  <th className="py-3 px-4">Masa Berlaku</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-custom">
                {filteredKeys.map((k) => {
                  const isExpired = k.expires_at && new Date(k.expires_at).getTime() < Date.now();
                  return (
                    <tr key={k.id} className="hover:bg-foreground/[0.02] transition">
                      {/* Aplikasi & Pemilik */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-foreground">{k.name}</div>
                        <div className="text-xs text-foreground/60">{k.owner}</div>
                      </td>

                      {/* Masked Key */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <code className="text-xs font-mono bg-background px-2 py-0.5 rounded border border-border-custom text-blue-500 font-bold">
                            {k.masked_key}
                          </code>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(k.masked_key)}
                            title="Salin masked key"
                            className="text-xs text-foreground/40 hover:text-foreground"
                          >
                            📋
                          </button>
                        </div>
                        <div className="text-[11px] text-foreground/40 mt-0.5">
                          Dibuat: {new Date(k.created_at).toLocaleDateString('id-ID')}
                        </div>
                      </td>

                      {/* Rate Limit & IP */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs font-medium text-foreground">
                          ⚡ {k.rate_limit} req/menit
                        </div>
                        <div className="text-[11px] text-foreground/60">
                          IP: {k.allowed_ips.join(', ')}
                        </div>
                      </td>

                      {/* Hak Akses */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {k.permissions.map((p) => (
                            <span
                              key={p}
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                p === 'admin'
                                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                  : p === 'write'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              }`}
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Masa Berlaku */}
                      <td className="py-3.5 px-4">
                        {k.expires_at ? (
                          <div>
                            <span
                              className={`text-xs font-medium ${
                                isExpired ? 'text-red-500 font-bold' : 'text-foreground/80'
                              }`}
                            >
                              {new Date(k.expires_at).toLocaleDateString('id-ID')}
                            </span>
                            {isExpired && (
                              <div className="text-[10px] text-red-500 font-semibold">
                                (Kedaluwarsa)
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-foreground/60">Selamanya</span>
                        )}
                        {k.last_used_at && (
                          <div className="text-[10px] text-foreground/40 mt-0.5">
                            Aktif: {new Date(k.last_used_at).toLocaleDateString('id-ID')}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggle(k)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                            k.is_active
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-500 border border-amber-500/30 hover:bg-amber-500/20'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              k.is_active ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                          />
                          {k.is_active ? 'Aktif' : 'Nonaktif'}
                        </button>
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(k)}
                          className="px-2.5 py-1 text-xs font-semibold text-red-500 hover:text-white hover:bg-red-600 border border-red-500/30 rounded-lg transition cursor-pointer"
                          title="Hapus / Cabut API Key"
                        >
                          Cabut
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PANDUAN PENGGUNAAN INTEGRASI */}
      <div className="bg-surface p-5 rounded-xl border border-border-custom space-y-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <span>💡</span> Cara Menggunakan API Key pada Aplikasi Klien
        </h3>
        <p className="text-xs text-foreground/70">
          Sertakan API Key pada header HTTP setiap request yang ditujukan ke endpoint REST API TugasKu (Base URL: <code>/api/v1</code>).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="bg-background p-3 rounded-lg border border-border-custom">
            <div className="text-foreground/50 font-sans font-bold mb-1">Contoh cURL / Terminal:</div>
            <pre className="text-blue-400 overflow-x-auto whitespace-pre-wrap">
{`curl -X GET "https://tugas.sman1margaasih.sch.id/api/v1/system/health" \\
  -H "X-API-Key: ${masterKey?.key || 'tk_live_xxxxxxxx'}"`}
            </pre>
          </div>

          <div className="bg-background p-3 rounded-lg border border-border-custom">
            <div className="text-foreground/50 font-sans font-bold mb-1">Contoh Javascript / React Native / Flutter:</div>
            <pre className="text-emerald-400 overflow-x-auto whitespace-pre-wrap">
{`const res = await fetch('/api/v1/tugas', {
  headers: {
    'X-API-Key': '${masterKey?.key || 'tk_live_xxxxxxxx'}',
    'Authorization': 'Bearer ' + accessToken
  }
});`}
            </pre>
          </div>
        </div>
      </div>

      {/* MODAL BUAT API KEY BARU */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface border border-border-custom rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-border-custom flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">➕</span>
                <h3 className="font-bold text-foreground">Buat API Key Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-foreground/40 hover:text-foreground text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Nama Aplikasi / Klien <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Mobile App Siswa Android / Bot Telegram"
                  className="w-full px-3 py-2 text-sm bg-background border border-border-custom rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Pemilik / Penanggung Jawab <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  placeholder="Contoh: admin@sman1margaasih.sch.id / Tim Pengembang"
                  className="w-full px-3 py-2 text-sm bg-background border border-border-custom rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Rate Limit (Req / Menit)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={rateLimit}
                    onChange={(e) => setRateLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-background border border-border-custom rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-foreground/50">Standar: 100 req/menit</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">
                    Masa Berlaku
                  </label>
                  <select
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-background border border-border-custom rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="30">30 Hari</option>
                    <option value="90">90 Hari</option>
                    <option value="180">180 Hari</option>
                    <option value="365">1 Tahun (365 Hari)</option>
                    <option value="0">Selamanya (Tidak Ada)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  IP Whitelist (Opsional)
                </label>
                <input
                  type="text"
                  value={allowedIps}
                  onChange={(e) => setAllowedIps(e.target.value)}
                  placeholder="* (semua IP) atau pisahkan koma: 192.168.1.1, 10.0.0.1"
                  className="w-full px-3 py-2 text-sm bg-background border border-border-custom rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[10px] text-foreground/50">Gunakan <code>*</code> untuk mengizinkan dari IP mana saja (cocok untuk aplikasi mobile).</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Hak Akses (Permissions)
                </label>
                <div className="flex gap-4">
                  {(['read', 'write', 'admin'] as const).map((perm) => (
                    <label key={perm} className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permissions.includes(perm)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPermissions([...permissions, perm]);
                          } else {
                            setPermissions(permissions.filter((p) => p !== perm));
                          }
                        }}
                        className="rounded border-border-custom text-blue-600 focus:ring-blue-500"
                      />
                      <span className="capitalize">{perm}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-border-custom flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-foreground/70 hover:bg-foreground/5 rounded-lg border border-border-custom transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/20 transition disabled:opacity-50"
                >
                  {submitting ? 'Memproses...' : '✓ Generate Kunci'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SUKSES MEMBUAT KEY DENGAN PERINGATAN SALIN */}
      {newlyCreatedKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-surface border border-emerald-500/30 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="text-center space-y-1">
              <div className="text-4xl">🎉</div>
              <h3 className="text-lg font-bold text-foreground">API Key Berhasil Dibuat!</h3>
              <p className="text-xs text-foreground/60">
                Segera salin dan simpan kunci rahasia ini sekarang.
              </p>
            </div>

            <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl text-xs text-red-400 space-y-1">
              <div className="font-bold flex items-center gap-1">
                <span>⚠️</span> PERINGATAN KEAMANAN PENTING:
              </div>
              <p>
                Kunci lengkap ini <b>hanya ditampilkan satu kali ini saja</b>. Demi keamanan sistem, sistem tidak menyimpannya dalam bentuk teks biasa lagi.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground/80">API Key Anda:</label>
              <div className="flex items-center gap-2 bg-background p-2.5 rounded-lg border border-border-custom">
                <code className="text-xs sm:text-sm font-mono text-emerald-400 font-bold break-all flex-1 select-all">
                  {newlyCreatedKey}
                </code>
                <button
                  type="button"
                  onClick={() => copyToClipboard(newlyCreatedKey)}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition shrink-0"
                >
                  {copiedKey ? '✓ Tersalin!' : '📋 Salin'}
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setNewlyCreatedKey(null)}
                className="w-full sm:w-auto px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
              >
                Saya Sudah Menyimpannya Dengan Aman
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
