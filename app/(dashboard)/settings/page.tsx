import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ChangePasswordForm from '@/components/forms/ChangePasswordForm';
import AdminSystemSettings from '@/components/ui/AdminSystemSettings'; 

export default async function SettingsPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pengaturan Akun</h1>
        <p className="text-foreground/60">Kelola keamanan dan sistem</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* USER UMUM (Ganti Password) */}
        <div className="space-y-8">
            <ChangePasswordForm />
            
            {/* Info Akun */}
            <div className="bg-blue-500/10 p-6 rounded-xl border border-blue-500/20">
                <h3 className="font-bold text-blue-500 mb-2 flex items-center gap-2">
                  <span>ℹ️</span> Info Pengguna
                </h3>
                <ul className="space-y-2 text-sm text-foreground/80">
                    <li><strong className="text-foreground">Email:</strong> {session.user.email}</li>
                    <li><strong className="text-foreground">Role:</strong> <span className="uppercase font-bold text-blue-500">{session.user.role}</span></li>
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