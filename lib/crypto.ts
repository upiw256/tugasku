import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
// Mengubah key dari .env menjadi 32 bytes (wajib untuk AES-256)
const SECRET_KEY = crypto
  .createHash('sha256')
  .update(process.env.BACKUP_SECRET_KEY || 'default_secret_key')
  .digest();

// FUNGSI ENKRIPSI (Untuk Backup)
export function encryptData(text: string): Buffer {
  const iv = crypto.randomBytes(16); // Initialization Vector (biar hasil enkripsi selalu beda walau isi sama)
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  // Gabungkan IV + Data Terenkripsi (IV ditaruh di depan)
  return Buffer.concat([iv, encrypted]);
}

// FUNGSI DEKRIPSI (Untuk Restore)
export function decryptData(encryptedBuffer: Buffer): string {
  // Ambil 16 byte pertama sebagai IV
  const iv = encryptedBuffer.subarray(0, 16);
  // Sisanya adalah data terenkripsi
  const encryptedText = encryptedBuffer.subarray(16);

  const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
  
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString('utf8');
}