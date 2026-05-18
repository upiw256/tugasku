import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Guru } from '@/models';
import { redirect } from 'next/navigation';
import MapelHeader from '@/components/guru/MapelHeader';

export default async function GuruLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session?.user?.role !== 'guru') redirect('/login');
  
  const guru_id = (session.user as any).guru_id;
  await connectDB();
  
  const guruInfo = await Guru.findById(guru_id).lean();
  if (!guruInfo) redirect('/login');

  const listMapel = (guruInfo as any).pengajaran?.map((p: any) => p.mapel) || [];

  return (
    <div className="flex flex-col space-y-4 md:space-y-6">
      {/* Subject Selector Bar - Desktop: Top, Mobile: Bottom Fixed */}
      <div className="hidden md:block">
        <MapelHeader listMapel={listMapel} />
      </div>
      
      <div className="pb-20 md:pb-0">
        {children}
      </div>

      {/* Mobile Sticky Bottom Selector */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 z-40 bg-surface/80 backdrop-blur-xl rounded-2xl border border-border-custom shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-500">
        <MapelHeader listMapel={listMapel} isMobileVariant />
      </div>
    </div>
  );
}
