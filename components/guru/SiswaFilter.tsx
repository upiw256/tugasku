'use client'

import { useRouter, useSearchParams } from 'next/navigation';

export default function SiswaFilter({ myClasses, defaultKelas, defaultQuery }: { myClasses: string[], defaultKelas: string, defaultQuery: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleKelasChange = (kelas: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (kelas) {
      params.set('kelas', kelas);
    } else {
      params.delete('kelas');
    }
    params.set('page', '1');
    router.push(`/guru/siswa?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-3 w-full md:w-auto">
        {/* Search Form */}
        <form 
            onSubmit={(e: any) => {
                e.preventDefault();
                const q = e.target.q.value;
                const params = new URLSearchParams(searchParams.toString());
                if (q) params.set('q', q);
                else params.delete('q');
                params.set('page', '1');
                router.push(`/guru/siswa?${params.toString()}`);
            }}
            className="flex-1 md:flex-none flex gap-2"
        >
            <input
                type="text"
                name="q"
                defaultValue={defaultQuery}
                placeholder="Cari nama siswa..."
                className="w-full md:w-64 bg-surface border border-border-custom px-4 py-3 rounded-2xl text-sm text-foreground outline-none focus:ring-2 focus:ring-primary-500 shadow-sm transition-all"
            />
            <button
                type="submit"
                className="bg-foreground text-background px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-foreground/10"
            >
                Cari
            </button>
        </form>

        <select 
            onChange={(e) => handleKelasChange(e.target.value)}
            defaultValue={defaultKelas}
            className="bg-surface border border-border-custom px-4 py-3 rounded-2xl text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
        >
            <option value="">Semua Kelas</option>
            {myClasses.sort().map((k: string) => (
                <option key={k} value={k}>{k}</option>
            ))}
        </select>
    </div>
  );
}
