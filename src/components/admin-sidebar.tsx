'use client';

import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Activity, FileText, Building, User, LogOut } from 'lucide-react';
import { SignOutButton } from '@clerk/nextjs';
import Link from 'next/link';

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  const menuItems = [
    { href: '/admin/dashboard', label: 'Live Feed', icon: Activity },
    { href: '/admin/reports', label: 'Report Management', icon: FileText },
    { href: '/admin/units', label: 'Manage Units', icon: Building },
    { href: '/admin/users', label: 'Manage Users', icon: User },
  ];

  return (
    <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
      <div className="p-6 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold">Command Center</h1>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-800 rounded-lg">
              <User className="h-4 w-4 text-zinc-400" />
            </div>
            <span className="text-sm font-medium text-zinc-200">
              {user?.firstName || user?.username || "Admin"}
            </span>
          </div>
          <SignOutButton>
            <button className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white">
              <LogOut className="h-4 w-4" />
            </button>
          </SignOutButton>
        </div>
      </div>
    </div>
  );
}