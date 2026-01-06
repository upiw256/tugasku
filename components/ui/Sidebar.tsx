'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { JSX, useState } from "react";

// Definisikan tipe untuk menu agar lebih rapi saat dikelompokkan
type MenuItem = {
  role: string;
  label: string;
  href: string;
  icon: JSX.Element;
};

export default function Sidebar({ user }: { user: any }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false); // Untuk mobile toggle
  const [isCollapsed, setIsCollapsed] = useState(false); // State baru untuk desktop collapse

  // --- DATA MENU ASLI ANDA (Tidak Diubah) ---
  const allMenus: MenuItem[] = [
    {
      role: 'admin',
      label: 'Dashboard',
      href: '/admin',
      icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>)
    },
    {
      role: 'admin',
      label: 'Data Siswa',
      href: '/admin/siswa',
      icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>)
    },
    {
      role: 'admin',
      label: 'Kelola Tugas',
      href: '/admin/tugas',
      icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>)
    },
    {
        role: 'admin',
        label: 'Absensi',
        href: '/admin/absensi',
        icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>)
    },
    {
      role: 'siswa',
      label: 'Dashboard',
      href: '/siswa',
      icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>)
    },
    {
      role: 'siswa',
      label: 'Tugas Saya',
      href: '/siswa/tugas',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
    },
    {
      role: 'admin',
      label: 'Pengaturan',
      href: '/settings',
      icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>)
    },
    {
      role: 'siswa',
      label: 'Pengaturan',
      href: '/settings',
      icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>)
    },
  ];

  // Filter menu berdasarkan role user
  const filteredMenus = allMenus.filter(m => m.role === user.role);

  // --- PENGELOMPOKAN MENU (Agar mirip desain referensi) ---
  // Kita pisahkan menu "Pengaturan" ke grup "Tools", sisanya "General"
  const menuGroups = [
    {
      title: "General",
      items: filteredMenus.filter(m => m.href !== '/settings')
    },
    {
      title: "Tools",
      items: filteredMenus.filter(m => m.href === '/settings')
    }
  ];

  // Fungsi helper untuk merender item menu agar tidak duplikasi kode
  const renderMenuItem = (menu: MenuItem) => {
    const isActive = pathname === menu.href || pathname.startsWith(`${menu.href}/`);
    return (
      <Link
        key={menu.href}
        href={menu.href}
        onClick={() => setIsOpen(false)} // Tutup sidebar di mobile saat klik
        className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 mb-1
          ${isActive
            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' // Style Aktif (Biru Terang)
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'   // Style Tidak Aktif (Gelap)
          }
          ${isCollapsed ? 'justify-center px-2' : ''} // Pusatkan icon saat collapsed
        `}
        title={isCollapsed ? menu.label : ''} // Tooltip saat collapsed
      >
        <span className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
            {menu.icon}
        </span>
        
        {/* Label Menu - Disembunyikan saat collapsed */}
        {!isCollapsed && (
            <span className="truncate transition-opacity duration-300 opacity-100">
                {menu.label}
            </span>
        )}
        
        {/* Contoh Badge (Opsional - Bisa diaktifkan jika ada datanya) */}
        {/* {!isCollapsed && menu.label === 'Dashboard' && (
             <span className="ml-auto bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">2</span>
        )} */}
      </Link>
    )
  };


  return (
    <>
      {/* --- MOBILE HEADER (Tetap Putih agar kontras dengan konten) --- */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-white border-b border-slate-200 z-30 px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-1 rounded-md font-bold text-sm leading-none">TK</div>
            <span className="font-bold text-slate-800 text-lg">TugasKu</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-md">
            {isOpen ? <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg> : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>}
        </button>
      </div>

      {/* --- SIDEBAR CONTAINER (Tema Gelap) --- */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-20 
        bg-slate-900 border-r border-slate-800
        transform transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
        flex flex-col h-screen shadow-xl
        ${isCollapsed ? 'w-20' : 'w-72'} // Lebar dinamis berdasarkan state collapsed
      `}>
        
        {/* 1. LOGO & COLLAPSE HEADER */}
        <div className={`h-16 flex items-center justify-between px-4 border-b border-slate-800 shrink-0 ${isCollapsed ? 'justify-center' : ''}`}>
          {!isCollapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
                <div className="bg-blue-600 text-white p-1.5 rounded-lg font-bold text-lg shadow-sm shadow-blue-500/20">TK</div>
                <span className="text-xl font-bold text-white tracking-tight truncate">TugasKu</span>
            </div>
          )}
          
          {/* Tombol Collapse/Expand (Hanya di Desktop) */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            {isCollapsed ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg> // Panah Kanan
            ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"></path></svg> // Panah Kiri
            )}
          </button>
        </div>

        {/* 2. USER PROFILE MINI (Gelap) */}
        <div className={`px-4 py-6 border-b border-slate-800 flex items-center gap-3 overflow-hidden ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-500 font-bold text-lg shrink-0">
                {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            {!isCollapsed && (
                <div className="truncate transition-opacity duration-300">
                    <p className="text-sm font-bold text-white truncate">{user.name}</p>
                    <p className="text-xs text-slate-400 uppercase font-semibold mt-0.5">{user.role}</p>
                </div>
            )}
        </div>

        {/* 3. NAVIGATION LINKS (Scrollable) */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3 space-y-6 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {menuGroups.map((group, index) => (
            group.items.length > 0 && (
                <div key={index}>
                    {/* Judul Kategori (General/Tools) - Sembunyi saat collapsed */}
                    {!isCollapsed && (
                        <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                            {group.title}
                        </h3>
                    )}
                    <div className="space-y-1">
                        {group.items.map(renderMenuItem)}
                    </div>
                </div>
            )
          ))}
        </nav>

        {/* 4. LOGOUT BUTTON (Gelap & Merah) */}
        <div className="p-4 border-t border-slate-800 shrink-0">
          <button 
            onClick={() => signOut({ callbackUrl: '/login' })}
            className={`group flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium transition-all duration-200
                text-red-400 hover:bg-red-500/10 hover:text-red-300
                ${isCollapsed ? 'justify-center' : ''}
            `}
            title={isCollapsed ? "Keluar Aplikasi" : ""}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            {!isCollapsed && <span className="truncate">Keluar</span>}
          </button>
        </div>
      </aside>
      
      {/* Overlay Gelap untuk Mobile */}
      {isOpen && (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-10 md:hidden transition-opacity"
            onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
}