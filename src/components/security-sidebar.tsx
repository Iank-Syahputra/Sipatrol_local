"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Camera, FileText, MapPin, Menu, X, LogOut, User } from "lucide-react";
import { signOut } from 'next-auth/react';

type UserProfile = {
  full_name: string | null;
  role: string | null;
} | null;

export default function SecuritySidebar({
  user,
  children
}: {
  user: UserProfile;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { href: '/security', label: 'Dashboard', icon: Shield },
    { href: '/security/report', label: 'New Report', icon: Camera },
    { href: '/security/reports', label: 'My Reports', icon: FileText },
    { href: '/security/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 overflow-hidden">
      
      {/* --- MOBILE TOGGLE BUTTON --- */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-3 left-3 z-50 p-2 bg-white border border-slate-200 rounded-md text-slate-700 md:hidden hover:bg-slate-100 transition-colors shadow-sm"
        aria-label="Toggle Menu"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* --- MOBILE OVERLAY BACKDROP --- */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* --- SIDEBAR UTAMA --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:relative md:inset-auto
      `}>
        {/* Header Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-200">
          <div className="p-1.5 bg-[#00F7FF] rounded-lg shadow-sm">
            <Shield className="w-5 h-5 text-slate-900" />
          </div>
          <span className="text-lg font-bold text-slate-900 tracking-tight">SiPatrol</span>
        </div>

        {/* User Profile Card */}
        <div className="p-4">
          <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/50">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">
              Officer On Duty
            </p>
            <p className="font-semibold text-slate-900 truncate text-sm">
              {user?.full_name || "Unknown Officer"}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-xs text-slate-500 capitalize">
                {user?.role || 'Security'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                  isActive
                    ? 'bg-[#00F7FF] text-slate-900 shadow-md shadow-cyan-200/50 font-bold'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="md:hidden h-14 border-b border-slate-200 bg-white flex items-center justify-center sticky top-0 z-20">
            <span className="font-semibold text-slate-900">Security Dashboard</span>
        </header>

        <main className="flex-1 overflow-y-auto p-0 md:p-0 scroll-smooth bg-slate-50">
          {/* PERBAIKAN UTAMA ADA DI SINI:
            - Dihapus: mx-auto max-w-5xl (Ini yang bikin sempit)
            - Diganti: w-full h-full (Agar konten dari page.tsx bisa melebar bebas)
          */}
          <div className="w-full h-full">
             {children}
          </div>
        </main>
      </div>
    </div>
  );
}