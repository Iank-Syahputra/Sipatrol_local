import Link from "next/link";
import { Shield, Activity, Map, AlertTriangle, CircleGauge } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-zinc-950 text-white">
      {/* Header */}
      <header className="py-6 px-8 border-b border-zinc-800">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">SiPatrol</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-zinc-400 hover:text-white transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
        <div className="mb-12">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
            <span className="text-white">SiPatrol</span> <span className="text-blue-500">System</span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Sistem Monitoring Keamanan & Pelaporan Digital.
            Real-time tracking, anti-fraud geolocation, dan mode offline.
          </p>
        </div>

        {/* Dual Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
          {/* Security Patrol Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col">
            <div className="mx-auto mb-6 p-4 bg-blue-600/10 rounded-full">
              <Shield className="h-12 w-12 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-white">Security Patrol</h2>
            <p className="text-zinc-400 mb-6 flex-grow">
              Access point for field officers to report incidents, check-in, and submit patrol findings.
            </p>
            <Link
              href="/login"
              className="mt-auto w-full bg-white text-black py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              Access Portal
            </Link>
          </div>

          {/* Command Center Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col">
            <div className="mx-auto mb-6 p-4 bg-orange-500/10 rounded-full">
              <Activity className="h-12 w-12 text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-white">Command Center</h2>
            <p className="text-zinc-400 mb-6 flex-grow">
              Monitoring dashboard for administrators to oversee operations and manage security data.
            </p>
            <Link
              href="/login"
              className="mt-auto w-full bg-zinc-900 border border-orange-500 text-orange-400 py-3 rounded-xl font-bold hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
            >
              Admin Access
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-zinc-800 bg-zinc-900/50 px-8 py-12">
        <div className="flex flex-col items-center text-center">
          <div className="p-3 bg-green-500/10 rounded-full mb-4">
            <Map className="h-8 w-8 text-green-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Geo-Tagging</h3>
          <p className="text-sm text-zinc-400">Lokasi terkunci otomatis via GPS.</p>
        </div>
        <div className="flex flex-col items-center text-center">
          <div className="p-3 bg-orange-500/10 rounded-full mb-4">
            <AlertTriangle className="h-8 w-8 text-orange-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Anti-Fraud</h3>
          <p className="text-sm text-zinc-400">Wajib foto langsung (No Gallery).</p>
        </div>
        <div className="flex flex-col items-center text-center">
          <div className="p-3 bg-purple-500/10 rounded-full mb-4">
            <CircleGauge className="h-8 w-8 text-purple-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Offline Mode</h3>
          <p className="text-sm text-zinc-400">Lapor dari area tanpa sinyal.</p>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 px-8 border-t border-zinc-800 text-center text-zinc-500 text-sm">
        <p>© {new Date().getFullYear()} SiPatrol Monitoring System. All rights reserved.</p>
      </footer>
    </main>
  );
}
