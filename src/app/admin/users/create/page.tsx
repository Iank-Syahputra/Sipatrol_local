'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserPlus, Building, Phone, Mail, Lock, Shield, ShieldCheck } from 'lucide-react';
import { Combobox } from '@/components/ui/combobox';
import { useSession } from 'next-auth/react';

interface UnitOption {
  value: string;
  label: string;
}

export default function CreateUserPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [role, setRole] = useState<'admin' | 'security'>('security');

  // Check if user is admin
  useEffect(() => {
    if (status === 'loading') {
      setCheckingAuth(true);
    } else if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      if (session.user.role !== 'admin') {
        router.push('/');
      } else {
        setIsAdmin(true);
        setCheckingAuth(false);
      }
    }
  }, [status, session, router]);

  // Fetch units on component mount
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const response = await fetch('/api/admin/units');
        if (response.ok) {
          const data = await response.json();
          const unitOptions = data.map((unit: any) => ({
            value: unit.id,
            label: unit.name
          }));
          setUnits(unitOptions);
        }
      } catch (err) {
        console.error('Error fetching units:', err);
        setError('Failed to load units');
      }
    };

    fetchUnits();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (role === 'security' && !selectedUnit) {
      setError('Please select an Assigned Unit.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName,
          username,
          password,
          phoneNumber: phoneNumber || null,
          unitId: role === 'security' ? selectedUnit : null,
          role,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess('User created successfully!');
        // Reset form
        setFullName('');
        setUsername('');
        setPassword('');
        setPhoneNumber('');
        setSelectedUnit('');
        setRole('security');
      } else {
        setError(result.error || 'Failed to create user');
      }
    } catch (err) {
      console.error('Error creating user:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-amber-500 border-r-transparent mb-4"></div>
          <p className="font-medium text-slate-500">Checking authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Router will handle the redirect
  }

  return (
    <div className="flex-1 flex flex-col w-full bg-slate-50 text-slate-900 min-h-screen">

      {/* Header - Sticky & Responsive */}
      <header className="relative sm:sticky sm:top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md px-6 py-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Create {role === 'admin' ? 'Admin' : 'Security Officer'} Account</h1>
            <p className="text-xs font-medium text-slate-500 hidden sm:block mt-1">Admin-only provisioning system - {role === 'admin' ? 'Create a new admin user' : 'Invite new security officers'}</p>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm max-w-2xl mx-auto">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                {role === 'admin' ? <ShieldCheck className="h-5 w-5 text-amber-600" /> : <UserPlus className="h-5 w-5 text-amber-600" />} New {role === 'admin' ? 'Admin' : 'Officer'} Registration
            </h2>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-600 text-sm">
                  {success}
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Role
                </Label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setRole('security'); setSelectedUnit(''); }}
                    className={`flex-1 flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                      role === 'security'
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <Shield className="h-4 w-4" />
                    Security Officer
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`flex-1 flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                      role === 'admin'
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Admin
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Full Name (Nama Lengkap)
                </Label>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full bg-white border border-slate-300 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Username (for Login)
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="w-full bg-white border border-slate-300 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Initial Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter initial password"
                    className="w-full bg-white border border-slate-300 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Phone Number (optional)
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter phone number (optional)"
                    className="w-full bg-white border border-slate-300 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

  
              {role === 'security' && (
                <div className="relative [&_button]:pl-10">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10 pointer-events-none" />
                  
                  <Combobox
                    options={units}
                    value={selectedUnit}
                    onValueChange={setSelectedUnit}
                    placeholder="Select unit..."
                    emptyMessage="No units available"
                  />
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl transition-colors shadow-md hover:shadow-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      {role === 'admin' ? <ShieldCheck className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                      Create {role === 'admin' ? 'Admin' : 'Security Officer'} Account
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                  className="py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:border-slate-300 rounded-xl transition-colors"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}