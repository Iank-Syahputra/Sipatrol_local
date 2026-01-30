'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link'; // Import Link
import Image from 'next/image'; // Import Image
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// Tambahkan Eye & EyeOff
import { AlertCircle, Loader2, ArrowLeft, Shield, Lock, Zap, Eye, EyeOff } from 'lucide-react'; 
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  // State baru untuk show/hide password
  const [showPassword, setShowPassword] = useState(false); 
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const paramsRole = searchParams.get('role');

  // --- CONFIGURASI TEMA (UI/UX) ---
  const isOfficer = paramsRole === 'officer';
  
  const theme = {
    color: isOfficer ? "text-cyan-700" : "text-amber-700",
    primaryBg: isOfficer ? "bg-[#00F7FF]" : "bg-[#F59E0B]", // Warna Utama
    primaryText: isOfficer ? "text-slate-900" : "text-white", // Kontras Text Tombol
    hoverBg: isOfficer ? "hover:bg-[#33f9ff]" : "hover:bg-[#D97706]",
    ringColor: isOfficer ? "focus-visible:ring-cyan-500" : "focus-visible:ring-amber-500",
    gradient: isOfficer ? "from-cyan-600 to-blue-600" : "from-amber-600 to-orange-700",
    overlay: isOfficer ? "bg-cyan-900/20" : "bg-amber-900/20", // Tint warna di background
    icon: isOfficer ? Shield : Zap, // Icon dinamis
    label: isOfficer ? "Patrol Officer" : "Administrator" // ENGLISH COPY
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        username,
        password,
      });

      if (result?.error) {
        setError('Invalid Username or Password.'); // ENGLISH COPY
        setLoading(false);
      } else if (result?.ok) {
        console.log('Login successful, redirecting...');
        if (callbackUrl) {
           router.push(callbackUrl);
        } else {
           if (username === 'admin') {
             router.push('/admin/dashboard');
           } else {
             router.push('/security');
           }
        }
        router.refresh();
      }
    } catch (err) {
      setError('System error occurred.'); // ENGLISH COPY
      setLoading(false);
    }
  };

  return (
    // Container Utama: Menggunakan Background Image + Overlay Warna Role
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-slate-50">
      
      {/* 1. Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
         <Image
            src="/image.jpeg" // Pastikan file ini ada di folder public
            alt="Background Facility"
            fill
            className="object-cover"
            priority
         />
         {/* Layer Putih Transparan (Agar Card Light Mode blend in) */}
         <div className="absolute inset-0 bg-white/80 backdrop-blur-[4px]" />
         {/* Layer Tint Warna Role (Konsistensi Visual) */}
         <div className={`absolute inset-0 ${theme.overlay} mix-blend-multiply`} />
      </div>

      {/* 2. Tombol Kembali (User Control) */}
      <div className="absolute top-6 left-6 z-20">
        <Link 
            href="/" 
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 hover:bg-white text-slate-700 text-sm font-bold shadow-sm backdrop-blur-md transition-all border border-slate-200"
        >
            <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </div>

      {/* 3. Card Login (Light Mode & Widescreen Fix) */}
      <Card className="relative z-10 w-full max-w-[90%] md:max-w-[480px] border-slate-200 bg-white/95 backdrop-blur-xl shadow-2xl shadow-slate-300/50">
        
        <CardHeader className="space-y-2 text-center pb-2 pt-8">
          {/* Icon Role */}
          <div className={`mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-2 ${isOfficer ? 'bg-cyan-50 text-cyan-600' : 'bg-amber-50 text-amber-600'}`}>
             <theme.icon className="h-6 w-6" />
          </div>

          <CardTitle className="text-2xl font-extrabold tracking-tight text-slate-900">
            {/* Typography diperbaiki */}
            <span className="block text-sm font-medium text-slate-500 uppercase tracking-widest mb-1">Access Portal</span>
            <span className={`text-3xl text-transparent bg-clip-text bg-gradient-to-r ${theme.gradient}`}>
              {theme.label}
            </span>
          </CardTitle>
          <CardDescription className="text-slate-500 font-medium">
            Enter your credentials to access the system.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5 px-8">
            {error && (
              <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-semibold">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-700 font-bold">Username</Label>
              <div className="relative">
                <Input
                  id="username"
                  placeholder={isOfficer ? "Example: SEC-001" : "Example: ADM-HQ"}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  // Styling Input Light Mode
                  className={`pl-10 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-transparent focus:ring-2 ${theme.ringColor} transition-all`}
                  disabled={loading}
                />
                <Shield className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" class="text-slate-700 font-bold">Password</Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  // Toggle Type based on State
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  // Tambahkan padding kanan (pr-10) agar text tidak tertimpa icon mata
                  className={`pl-10 pr-10 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-transparent focus:ring-2 ${theme.ringColor} transition-all`}
                  disabled={loading}
                />
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                
                {/* TOMBOL MATA (SHOW/HIDE) */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                  tabIndex={-1} // Agar tidak bisa di-tab (opsional)
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="px-8 pb-8 pt-2">
            <Button
              type="submit"
              className={`w-full py-6 text-base font-bold shadow-lg transition-all active:scale-[0.98] ${theme.primaryBg} ${theme.primaryText} ${theme.hoverBg}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                'Sign In Now'
              )}
            </Button>
          </CardFooter>
        </form>
        
        {/* Footer Brand Kecil */}
        <div className="absolute bottom-4 w-full text-center">
            <p className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase opacity-60">SiPatrol Secure System</p>
        </div>
      </Card>
    </div>
  );
}