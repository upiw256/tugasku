export async function register() {
  // Hanya jalankan worker di sisi server (Node.js runtime)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { setupWorker } = await import('@/lib/worker');
    setupWorker();
    console.log('🚀 Background Worker Aktif');

    // Seed akun admin default jika belum ada (dijalankan sekali saat startup)
    const { seedDefaultAdmin } = await import('@/lib/seed');
    await seedDefaultAdmin();
  }
}