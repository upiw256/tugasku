export async function register() {
  // Hanya jalankan worker di sisi server (Node.js runtime)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { setupWorker } = await import('@/lib/worker');
    setupWorker();
    console.log('🚀 Background Worker Aktif');
  }
}