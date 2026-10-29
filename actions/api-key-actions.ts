'use server';

import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { ApiKey } from '@/models';
import crypto from 'crypto';
import { revalidatePath } from 'next/cache';

export interface ApiKeyItem {
  id: string;
  name: string;
  owner: string;
  masked_key: string;
  permissions: string[];
  rate_limit: number;
  is_active: boolean;
  allowed_ips: string[];
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
}

export interface MasterKeyInfo {
  key: string;
  is_custom_env: boolean;
  rate_limit: number;
}

async function verifyAdmin() {
  const session = await auth();
  if (!session || session.user.role !== 'admin') {
    throw new Error('Akses ditolak: Hanya admin yang diizinkan mengelola API Key.');
  }
  return session;
}

export async function getApiKeysAction(): Promise<{
  success: boolean;
  data?: ApiKeyItem[];
  masterKey?: MasterKeyInfo;
  message?: string;
}> {
  try {
    await verifyAdmin();
    await connectDB();

    const keys = await ApiKey.find().sort({ created_at: -1 }).lean();

    const formatted: ApiKeyItem[] = keys.map((k: any) => ({
      id: k._id.toString(),
      name: k.name,
      owner: k.owner,
      masked_key:
        k.key && k.key.length > 10
          ? `${k.key.substring(0, 8)}...${k.key.substring(k.key.length - 4)}`
          : '***',
      permissions: k.permissions || ['read', 'write'],
      rate_limit: k.rate_limit || 100,
      is_active: k.is_active ?? true,
      allowed_ips: k.allowed_ips || ['*'],
      created_at: k.created_at ? new Date(k.created_at).toISOString() : new Date().toISOString(),
      last_used_at: k.last_used_at ? new Date(k.last_used_at).toISOString() : null,
      expires_at: k.expires_at ? new Date(k.expires_at).toISOString() : null,
    }));

    const masterKeyString = process.env.MASTER_API_KEY || 'tk_master_margaasih_2026';
    const isCustom = Boolean(process.env.MASTER_API_KEY);

    return {
      success: true,
      data: formatted,
      masterKey: {
        key: masterKeyString,
        is_custom_env: isCustom,
        rate_limit: 1000,
      },
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal memuat daftar API Key' };
  }
}

export async function createApiKeyAction(payload: {
  name: string;
  owner: string;
  permissions?: string[];
  rate_limit?: number;
  allowed_ips?: string[];
  expires_in_days?: number;
}): Promise<{
  success: boolean;
  message: string;
  generatedKey?: string;
  keyData?: ApiKeyItem;
}> {
  try {
    await verifyAdmin();
    await connectDB();

    if (!payload.name || !payload.owner) {
      return { success: false, message: 'Nama aplikasi dan pemilik wajib diisi' };
    }

    const env = process.env.NODE_ENV === 'production' ? 'live' : 'test';
    const randomHex = crypto.randomBytes(16).toString('hex');
    const generatedKey = `tk_${env}_${randomHex}`;

    let expiresAt: Date | null = null;
    if (payload.expires_in_days && payload.expires_in_days > 0) {
      expiresAt = new Date(Date.now() + payload.expires_in_days * 24 * 3600 * 1000);
    }

    const newKey = await ApiKey.create({
      key: generatedKey,
      name: payload.name.trim(),
      owner: payload.owner.trim(),
      permissions: payload.permissions && payload.permissions.length > 0 ? payload.permissions : ['read', 'write'],
      rate_limit: payload.rate_limit && payload.rate_limit > 0 ? payload.rate_limit : 100,
      allowed_ips: payload.allowed_ips && payload.allowed_ips.length > 0 ? payload.allowed_ips : ['*'],
      is_active: true,
      created_at: new Date(),
      expires_at: expiresAt,
    });

    revalidatePath('/admin/api-keys');

    return {
      success: true,
      message: 'API Key berhasil dibuat! Simpan kunci ini sekarang karena tidak akan ditampilkan penuh lagi.',
      generatedKey,
      keyData: {
        id: newKey._id.toString(),
        name: newKey.name,
        owner: newKey.owner,
        masked_key: `${generatedKey.substring(0, 8)}...${generatedKey.substring(generatedKey.length - 4)}`,
        permissions: newKey.permissions,
        rate_limit: newKey.rate_limit,
        is_active: newKey.is_active,
        allowed_ips: newKey.allowed_ips,
        created_at: newKey.created_at.toISOString(),
        last_used_at: null,
        expires_at: newKey.expires_at ? newKey.expires_at.toISOString() : null,
      },
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal membuat API Key' };
  }
}

export async function toggleApiKeyStatusAction(
  id: string,
  currentStatus: boolean
): Promise<{ success: boolean; message: string }> {
  try {
    await verifyAdmin();
    await connectDB();

    const updated = await ApiKey.findByIdAndUpdate(
      id,
      { is_active: !currentStatus },
      { new: true }
    );

    if (!updated) {
      return { success: false, message: 'API Key tidak ditemukan' };
    }

    revalidatePath('/admin/api-keys');
    return {
      success: true,
      message: `API Key berhasil ${updated.is_active ? 'diaktifkan' : 'dinonaktifkan'}`,
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal mengubah status API Key' };
  }
}

export async function deleteApiKeyAction(id: string): Promise<{ success: boolean; message: string }> {
  try {
    await verifyAdmin();
    await connectDB();

    const deleted = await ApiKey.findByIdAndDelete(id);
    if (!deleted) {
      return { success: false, message: 'API Key tidak ditemukan' };
    }

    revalidatePath('/admin/api-keys');
    return { success: true, message: 'API Key berhasil dicabut dan dihapus permanen' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Gagal menghapus API Key' };
  }
}
