import { NextRequest } from 'next/server';
import { createApiHandler, ApiContext } from '@/lib/api/handler';
import { apiSuccess, apiError } from '@/lib/api/response';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// Route config: timeout 60 seconds for uploads
export const maxDuration = 60;

// POST /api/v1/upload
export const POST = createApiHandler(
  async (req: NextRequest, ctx: ApiContext) => {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file || file.size === 0) {
      return apiError('File wajib diunggah', 'VALIDATION_ERROR', 400);
    }

    // Max 10MB
    const MAX_SIZE_BYTES = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      return apiError('Ukuran file melebihi batas maksimal 10MB', 'VALIDATION_ERROR', 400);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true }).catch(() => {});

    // Safe sanitized filename
    const safeBaseName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .toLowerCase();
    const uniqueFileName = `${Date.now()}-${safeBaseName}`;
    const destinationPath = path.join(uploadDir, uniqueFileName);

    await writeFile(destinationPath, buffer);

    const fileUrl = `/uploads/${uniqueFileName}`;

    return apiSuccess({
      url: fileUrl,
      file_name: file.name,
      stored_name: uniqueFileName,
      size_bytes: file.size,
      mime_type: file.type || 'application/octet-stream',
    }, 'File berhasil diunggah', 201);
  },
  {
    requireApiKey: true,
    authRequired: true,
  }
);
