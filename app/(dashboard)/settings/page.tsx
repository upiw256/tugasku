import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ChangePasswordForm from '@/components/forms/ChangePasswordForm';
import AdminSystemSettings from '@/components/ui/AdminSystemSettings'; // Komponen baru

export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Pengaturan Akun</h1>
        <p className="text-gray-500">Kelola keamanan dan sistem</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* USER UMUM (Ganti Password) */}
        <div className="space-y-8">
            <ChangePasswordForm />
            
            {/* Info Akun */}
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                <h3 className="font-bold text-blue-800 mb-2">ℹ️ Info Pengguna</h3>
                <ul className="space-y-2 text-sm text-blue-900">
                    <li><strong>Email:</strong> {session.user.email}</li>
                    <li><strong>Role:</strong> <span className="uppercase font-bold">{session.user.role}</span></li>
                </ul>
            </div>
        </div>

        {/* KHUSUS ADMIN (Backup/Restore/Reset) */}
        {session.user.role === 'admin' && (
             <AdminSystemSettings />
        )}

      </div>
    </div>
  );
}