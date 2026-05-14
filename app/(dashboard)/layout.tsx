// app/(dashboard)/layout.tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminRealtimeNotifier from '@/components/admin/AdminRealtimeNotifier';
import Sidebar from '@/components/ui/Sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Siapkan data user sederhana untuk Sidebar
  const userForSidebar = {
    name: session.user.name || 'Pengguna',
    role: session.user.role || 'siswa',
  };

  const isStaff = session.user.role === 'admin' || session.user.role === 'guru';

  return (
    <div className="flex min-h-screen bg-background font-sans">
      {/* Notifikasi Real-time untuk Admin/Guru */}
      {isStaff && <AdminRealtimeNotifier />}
      
      {/* 1. SIDEBAR (Client Component) */}
      <Sidebar user={userForSidebar} />

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-h-screen">
        
        {/* Konten Utama */}
        {/* pt-16 ditambahkan agar konten tidak tertutup header di tampilan mobile */}
        <main className="p-4 md:p-6 pt-20 md:pt-6 bg-background">
          {children}
        </main>
      </div>

    </div>
  );
}