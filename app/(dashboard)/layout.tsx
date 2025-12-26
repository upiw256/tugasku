import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/ui/Sidebar"; // Import Sidebar yang baru

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  if (!session) redirect('/login');

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      
      {/* Sidebar Component */}
      <Sidebar user={session.user} />

      {/* Area Konten Utama */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Main Content (Scrollable) */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-16 md:pt-8">
          {children}
        </main>
        
      </div>
    </div>
  );
}