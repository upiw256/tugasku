import { Worker } from 'bullmq';
import { redisConnection } from './redis';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

export const setupWorker = () => {
  const worker = new Worker('upload-tugas', async (job) => {
    try {
      const { buffer, filePath, uploadDir, isImage } = job.data;

      // Pastikan folder tersedia
      await fs.mkdir(uploadDir, { recursive: true });
      
      // Ubah data buffer kembali dari format JSON/Array
      // Handle jika formatnya object bawaan JSON stringify BullMQ { type: "Buffer", data: [...] }
      const fileBuffer = buffer.data ? Buffer.from(buffer.data) : Buffer.from(buffer);

      if (isImage) {
        await sharp(fileBuffer)
          .resize(1200, null, { withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(filePath);
        console.log(`✅ Background Worker: Gambar selesai diproses`);
      } else {
        await fs.writeFile(filePath, fileBuffer);
        console.log(`✅ Background Worker: Dokumen (PDF) selesai diproses`);
      }
    } catch (err: any) {
      console.error(`❌ Background Worker ERROR Job ${job.id}:`, err.message);
      throw err;
    }
  }, { connection: redisConnection });

  worker.on('failed', (job, err) => {
    if (job) {
      console.error(`⚠️ Job ${job.id} failed with error: ${err.message}`);
    } else {
      console.error(`⚠️ Job failed with error: ${err.message}`);
    }
  });
};