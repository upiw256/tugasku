// app/(dashboard)/layout.tsx
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
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

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      
      {/* 1. SIDEBAR (Client Component) */}
      <Sidebar user={userForSidebar} />

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Konten Utama */}
        {/* pt-16 ditambahkan agar konten tidak tertutup header di tampilan mobile */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pt-16 md:pt-6 bg-gray-50">
          {children}
        </main>
      </div>

    </div>
  );
}