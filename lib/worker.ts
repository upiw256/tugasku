import { Worker } from 'bullmq';
import { redisConnection } from './redis';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

export const setupWorker = () => {
  new Worker('upload-tugas', async (job) => {
    const { buffer, filePath, uploadDir, isImage } = job.data;

    // Pastikan folder tersedia
    await fs.mkdir(uploadDir, { recursive: true });
    
    // Ubah data buffer kembali dari format JSON/Array
    const fileBuffer = Buffer.from(buffer);

    if (isImage) {
      await sharp(fileBuffer)
        .resize(1200, null, { withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(filePath);
      console.log(`✅ Background Worker: Gambar selesai diproses`);
    } else {
      await fs.writeFile(filePath, fileBuffer);
    }
  }, { connection: redisConnection });
};