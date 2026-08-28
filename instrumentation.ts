export async function register() {
  // Hanya jalankan worker di sisi server (Node.js runtime)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { setupWorker } = await import('@/lib/worker');
    setupWorker();
    console.log('🚀 Background Worker Aktif');

    // Seed akun admin default jika belum ada (dijalankan sekali saat startup)
    const { seedDefaultAdmin } = await import('@/lib/seed');
    await seedDefaultAdmin();

    // INTERCEPT DOCKER / TERMINAL LOGS
    const { logAktivitasSiswa } = await import('@/lib/log-aktivitas');
    
    // Prevent recursion
    let isInternalLogging = false;

    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    function safeLog(level: 'success' | 'error' | 'warning', args: any[]) {
      if (isInternalLogging) return;
      isInternalLogging = true;
      try {
        const message = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
        // Filter noise: skip common Next.js internal compiler logs
        if (message.includes('Fast Refresh') || message.includes('webpack') || message.includes('hot reload')) {
           return;
        }

        const lenLimit = 300;
        const msgTrim = message.length > lenLimit ? message.substring(0, lenLimit) + '...' : message;
        
        // Use fire-and-forget for DB log
        logAktivitasSiswa({
          kategori: 'Console',
          aksi: `[${level.toUpperCase()}] ${msgTrim}`,
          tipe: level
        }).catch(() => {});
      } catch (e) {
         // ignore
      } finally {
        isInternalLogging = false;
      }
    }

    console.log = function (...args) {
      originalLog.apply(console, args);
      safeLog('success', args); // assume standard logs are success/info
    };

    console.error = function (...args) {
      originalError.apply(console, args);
      safeLog('error', args);
    };

    console.warn = function (...args) {
      originalWarn.apply(console, args);
      safeLog('warning', args);
    };
  }
}