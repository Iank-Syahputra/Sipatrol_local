"use client";

import { signOut } from 'next-auth/react';
import { ShieldAlert, LogOut } from "lucide-react";

export default function AdminForbidden() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-zinc-900 border border-red-900/50 p-8 rounded-2xl max-w-md w-full shadow-2xl shadow-red-900/10">
        
        {/* Icon Warning */}
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
          <ShieldAlert className="w-8 h-8 text-red-500" />
        </div>
        
        {/* The Exact Message Requested */}
        <h2 className="text-xl font-bold text-white mb-2">Akses Ditolak</h2>
        <p className="text-red-400 font-medium mb-6">
          Maaf akun anda tidak terdaftar sebagai admin.
        </p>
        
        {/* Logout Button to try again */}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Keluar & Coba Akun Lain
        </button>
        
      </div>
    </div>
  );
}