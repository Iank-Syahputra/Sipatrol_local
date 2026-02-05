'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { 
  Activity, 
  FileText, 
  Building, 
  User, 
  LogOut, 
  MapPin, 
  Menu, 
  X,
  LayoutDashboard
} from 'lucide-react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

export default function AdminSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { href: '/admin/dashboard', label: 'Umpan Langsung', icon: Activity },
    { href: '/admin/reports', label: 'Manajemen Laporan', icon: FileText },
    { href: '/admin/units', label: 'Kelola Unit', icon: Building },
    { href: '/admin/unit-locations', label: 'Kelola Lokasi', icon: MapPin },
    { href: '/admin/users', label: 'Kelola Pengguna', icon: User },
  ];

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 overflow-hidden">
      
      {/* --- MOBILE TOGGLE BUTTON --- */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-white border border-slate-200 rounded-md text-slate-700 md:hidden hover:bg-slate-100 transition-colors shadow-sm"
        aria-label="Toggle Menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* --- MOBILE OVERLAY BACKDROP --- */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* --- SIDEBAR --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:relative md:inset-auto
      `}>
        
        {/* Header Sidebar */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 rounded-lg shadow-md shadow-amber-200">
              <LayoutDashboard className="h-6 w-6 text-white" />
            </div>
            <div>
                <h1 className="text-lg font-extrabold text-slate-900 leading-tight">Pusat</h1>
                <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">Perintah</p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)} 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                  isActive
                    ? 'bg-amber-50 text-amber-700 shadow-sm border border-amber-100'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        {/* Footer User Profile & Logout */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white border border-slate-200 rounded-full shadow-sm">
                <User className="h-4 w-4 text-slate-600" />
              </div>
              <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900">Administrator</span>
                  <span className="text-[10px] text-slate-500">Pengguna Super</span>
              </div>
            </div>

            {/* Tombol Logout (Desktop & Mobile) */}
            <button
              onClick={handleSignOut}
              type="button"
              className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-200"
              title="Keluar"
              aria-label="Keluar"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header Mobile Placeholder */}
        <header className="md:hidden h-16 border-b border-slate-200 bg-white flex items-center justify-center sticky top-0 z-20">
            <span className="font-bold text-slate-900">Dasbor Admin</span>
        </header>

        <main className="flex-1 overflow-y-auto scroll-smooth bg-slate-50">
          <div className="w-full h-full">
             {children}
          </div>
        </main>
      </div>

    </div>
  );
}