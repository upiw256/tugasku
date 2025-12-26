'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

export default function Pagination({ totalPages }: { totalPages: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get('page')) || 1;

  const createPageURL = (pageNumber: number | string) => {
    // Pastikan menggunakan .toString() agar kompatibel penuh
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  return (
    <div className="flex justify-center items-center gap-2 mt-6 pb-6">
      <Link
        href={createPageURL(currentPage - 1)}
        className={`px-4 py-2 border rounded-lg text-sm font-medium transition ${
          currentPage <= 1 
            ? 'pointer-events-none opacity-50 bg-gray-100 text-gray-400' 
            : 'hover:bg-white hover:shadow-sm bg-gray-50 text-gray-700'
        }`}
        aria-disabled={currentPage <= 1}
      >
        ← Sebelumnya
      </Link>

      <span className="text-sm font-medium text-gray-600 bg-white px-3 py-2 rounded border">
        Halaman {currentPage} dari {totalPages}
      </span>

      <Link
        href={createPageURL(currentPage + 1)}
        className={`px-4 py-2 border rounded-lg text-sm font-medium transition ${
          currentPage >= totalPages 
            ? 'pointer-events-none opacity-50 bg-gray-100 text-gray-400' 
            : 'hover:bg-white hover:shadow-sm bg-gray-50 text-gray-700'
        }`}
        aria-disabled={currentPage >= totalPages}
      >
        Selanjutnya →
      </Link>
    </div>
  );
}