"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Camera, FileText, MapPin, Menu } from "lucide-react";
import { Button } from './ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ThemeToggle } from '@/components/theme-toggle';
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

  const menuItems = [
    { href: '/security', label: 'Dashboard', icon: Shield },
    { href: '/security/report', label: 'New Report', icon: Camera },
    { href: '/security/map', label: 'My Map', icon: MapPin },
    { href: '/security/reports', label: 'My Reports', icon: FileText },
    { href: '/security/profile', label: 'Profile', icon: Shield },
  ];

  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-zinc-950 text-zinc-100">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 lg:w-72 flex-col border-r border-zinc-800 bg-black/40 p-4">
        <div className="flex h-14 items-center gap-2 px-2">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">SiPatrol</span>
        </div>

        <div className="mt-4 p-3 border rounded-lg bg-zinc-900/30">
          <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Officer</p>
          <p className="font-semibold text-zinc-100 truncate">
            {user?.full_name || "Unknown"}
          </p>
          <p className="text-xs text-blue-400 capitalize mt-0.5">
            {user?.role || 'security'}
          </p>
        </div>

        <nav className="mt-6 flex flex-col gap-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-2">
          <div className="p-2 border rounded-lg bg-zinc-900/30 border-zinc-800">
            <div className="flex items-center justify-between">
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
              >
                Logout
              </button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="md:hidden fixed top-4 left-4 z-50">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 bg-zinc-950 text-zinc-100 border-r border-zinc-800">
          <SheetTitle className="sr-only">Menu Navigasi Security</SheetTitle>
          <SheetDescription className="sr-only">Sidebar navigasi utama</SheetDescription>
          <div className="flex h-14 items-center gap-2 px-4 border-b border-zinc-800">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">SiPatrol</span>
          </div>

          <nav className="flex flex-col gap-1 py-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="absolute bottom-4 left-4 right-4">
            <div className="p-2 border rounded-lg bg-zinc-900/30 border-zinc-800">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
                >
                  Logout
                </button>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="sticky top-0 z-10 border-b bg-zinc-950/80 backdrop-blur border-zinc-800">
          <div className="flex h-14 items-center justify-between px-4">
            <div className="hidden md:block">
              <h1 className="text-lg font-semibold text-white">Security Dashboard</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors px-3 py-1 rounded-md hover:bg-red-900/30"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-zinc-950">
          {children}
        </main>
      </div>
    </div>
  );
}