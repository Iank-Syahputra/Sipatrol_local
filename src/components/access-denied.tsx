'use client';

import { signOut } from 'next-auth/react';
import { UserRound } from 'lucide-react';
import Link from 'next/link';

interface AccessDeniedProps {
  userRole: string | null;
  fullName: string | null;
}

export default function AccessDenied({ userRole, fullName }: AccessDeniedProps) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
        <div className="mx-auto flex justify-center mb-6">
          <div className="p-3 bg-orange-500/10 rounded-full">
            <UserRound className="h-10 w-10 text-orange-500" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold mb-3">Account Switch Required</h1>
        <p className="text-zinc-400 mb-8">
          You are currently signed in as a <span className="text-blue-400">{userRole || 'non-admin'}</span> user.
          Please sign out and log in with admin credentials to access the Admin Dashboard.
        </p>
        
        <div className="space-y-4">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-bold transition-colors"
          >
            Switch Account
          </button>

          <Link href="/">
            <button className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-bold transition-colors border border-zinc-700">
              Back to Home
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}