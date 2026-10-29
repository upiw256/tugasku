import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ApiKeyManager from '@/components/admin/ApiKeyManager';

export const metadata = {
  title: 'Manajemen API Key — TugasKu',
  description: 'Kelola kunci akses REST API untuk aplikasi mobile dan bot eksternal.',
};

export default async function AdminApiKeysPage() {
  const session = await auth();

  if (!session || session.user?.role !== 'admin') {
    redirect('/login');
  }

  return <ApiKeyManager />;
}
