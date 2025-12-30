// lib/notificationHelper.ts

export const sendBrowserNotification = (title: string, body: string) => {
  // 1. Cek apakah browser mendukung notifikasi
  if (!("Notification" in window)) {
    console.log("Browser ini tidak mendukung notifikasi desktop");
    return;
  }

  // 2. Cek izin
  if (Notification.permission === "granted") {
    // Jika sudah diizinkan, langsung kirim
    new Notification(title, {
      body: body,
      icon: '/icon-sekolah.png' // Ganti dengan path icon sekolah Anda jika ada
    });
  } else if (Notification.permission !== "denied") {
    // Jika belum ada izin, minta izin dulu
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification(title, {
          body: body,
          icon: '/icon-sekolah.png'
        });
      }
    });
  }
};