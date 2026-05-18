import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Guru } from '@/models';
import { redirect } from 'next/navigation';
import GuruTaskForm from '@/components/guru/GuruTaskForm';

export default async function TambahTugasGuruPage({
    searchParams
}: {
    searchParams: Promise<{ mapel?: string }>
}) {
    const session = await auth();
    if (session?.user?.role !== 'guru') redirect('/login');
    
    const guru_id = (session.user as any).guru_id;
    const params = await searchParams;
    const initialMapel = params.mapel || '';

    await connectDB();
    const guruInfo = await Guru.findById(guru_id).lean() as any;
    
    if (!guruInfo) redirect('/login');

    const pengajaran = guruInfo.pengajaran || [];

    return (
        <GuruTaskForm 
            pengajaran={JSON.parse(JSON.stringify(pengajaran))}
            initialMapel={initialMapel}
        />
    );
}
