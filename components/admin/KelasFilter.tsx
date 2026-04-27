'use client'

import { useRouter, useSearchParams } from 'next/navigation';

export default function KelasFilter({ sortedClasses, defaultValue }: { sortedClasses: string[], defaultValue: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleKelasChange = (kelas: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (kelas) {
      params.set('kelas', kelas);
    } else {
      params.delete('kelas');
    }
    params.set('page', '1'); // Reset ke halaman 1
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-col">
      <label className="text-xs font-bold text-gray-600 mb-1">Filter Tabel</label>
      <select 
        name="kelas" 
        value={defaultValue}
        onChange={(e) => handleKelasChange(e.target.value)}
        className="border p-2 rounded text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px]"
      >
        <option value="">-- Semua --</option>
        {sortedClasses.map((cls: string) => (
          <option key={cls} value={cls}>{cls}</option>
        ))}
      </select>
    </div>
  );
}
