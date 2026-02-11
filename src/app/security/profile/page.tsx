'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
// Tambahkan Eye & EyeOff
import { User, Phone, Lock, ShieldCheck, Save, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';

export default function SecurityProfilePage() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [originalPhone, setOriginalPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [unitName, setUnitName] = useState('');
  const [showPhoneSuccess, setShowPhoneSuccess] = useState(false);
  const [showPasswordSuccess, setShowPasswordSuccess] = useState(false);
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  
  // State untuk Show/Hide Password
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  // Load user profile
  useEffect(() => {
    if (status === 'authenticated') {
      const loadProfile = async () => {
        try {
          const response = await fetch('/api/user/profile');
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Failed to load profile: ${errorData.error || 'Unknown error'}`);
          }
          const profile = await response.json();
          setFullName(profile.full_name && profile.full_name.trim() !== '' ? profile.full_name : 'Not set');
          setUsername(profile.username || 'Not set');
          setPhoneNumber(profile.phone_number || '');
          setOriginalPhone(profile.phone_number || '');
          setUnitName(profile.assignedUnit?.name || 'Unit not assigned');
        } catch (error) {
          console.error('Error loading profile:', error);
          toast.error('Failed to load profile');
        } finally {
          setLoading(false);
        }
      };
      loadProfile();
    } else if (status === 'unauthenticated') {
      router.push('/login');
      setLoading(false);
    }
  }, [status]);

  // Validate phone number format
  const validatePhoneNumber = (phone: string) => {
    if (!phone) return null;
    if (/[a-zA-Z]/.test(phone)) return 'Phone number should not contain letters';
    const allowedCharsRegex = /^[\d\s\-\+\(\)]+$/;
    if (!allowedCharsRegex.test(phone)) return 'Invalid characters in phone number';
    const digitsOnly = phone.replace(/\D/g, '');
    if (!/^\d+$/.test(digitsOnly)) return 'Phone number should only contain digits';
    if (digitsOnly.length < 10 || digitsOnly.length > 15) return 'Phone number should be between 10 and 15 digits';
    return null;
  };

  // Validate password strength
  const validatePassword = (password: string) => {
    if (!password || password.length === 0) return 'Password cannot be empty';
    if (password.length < 4) return 'Password must be at least 4 characters';
    return null;
  };

  // Handle phone number update
  const handlePhoneUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const phoneError = validatePhoneNumber(phoneNumber);
    if (phoneError) {
      toast.error(phoneError);
      setSaving(false);
      return;
    }
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phoneNumber }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to update phone number');
      toast.success('Phone number updated successfully');
      setOriginalPhone(phoneNumber);
      setShowPhoneSuccess(true);
      setTimeout(() => setShowPhoneSuccess(false), 2000);
    } catch (error) {
      console.error('Error updating phone number:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update phone number');
    } finally {
      setSaving(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      toast.error(passwordError);
      setSaving(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      setSaving(false);
      return;
    }
    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to change password');
      toast.success('Password changed successfully');
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
      setShowPasswordSuccess(true);
      setTimeout(() => setShowPasswordSuccess(false), 2000);
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-600" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="w-full px-6 py-8 space-y-8 bg-slate-50 min-h-screen animate-in fade-in duration-500">

      {/* Header Section */}
      <div className="bg-white border-l-4 border-l-[#00F7FF] border border-slate-200 p-6 rounded-2xl shadow-sm flex items-center justify-between animate-in slide-in-from-top-4 duration-700">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Pengaturan Profil</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">
            Kelola informasi data diri dan keamanan akun Anda
          </p>
        </div>
        <div className="bg-cyan-50 p-3 rounded-full hidden md:block">
            <ShieldCheck className="w-8 h-8 text-cyan-600" />
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start animate-in slide-in-from-bottom-4 duration-700">

        {/* Left Column: Personal Info */}
        <div className="space-y-8">

            {/* Personal Information Card */}
            <Card className="bg-white border border-slate-200 shadow-md hover:shadow-lg transition-shadow duration-300 animate-in slide-in-from-left-4 duration-500">
                <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                    <CardTitle className="flex items-center gap-2 text-slate-900 text-lg font-bold">
                        <User className="w-5 h-5 text-cyan-600" /> Informasi Personal
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Nama Lengkap</Label>
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900">
                                {fullName}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Username</Label>
                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono font-medium text-slate-900">
                                {username}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Unit Penugasan</Label>
                        <div className="p-3 bg-cyan-50 border border-cyan-100 text-cyan-800 rounded-lg font-bold flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" /> {unitName}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Phone Number Card */}
            <Card className="bg-white border border-slate-200 shadow-md hover:shadow-lg transition-shadow duration-300 animate-in slide-in-from-left-8 duration-500">
                <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                    <CardTitle className="flex items-center gap-2 text-slate-900 text-lg font-bold">
                        <Phone className="w-5 h-5 text-cyan-600" /> Informasi Kontak
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <form onSubmit={handlePhoneUpdate} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="phoneNumber" className="text-slate-700 font-bold">Nomor Telepon / WhatsApp</Label>
                            <Input
                                id="phoneNumber"
                                type="tel"
                                value={phoneNumber}
                                onChange={(e) => {
                                    setPhoneNumber(e.target.value);
                                    const error = validatePhoneNumber(e.target.value);
                                    setPhoneError(error || '');
                                }}
                                placeholder="08..."
                                className={`bg-white text-slate-900 border-slate-300 placeholder:text-slate-400 focus:border-cyan-500 focus:ring-cyan-500/20 ${phoneError ? 'border-red-500' : ''}`}
                            />
                            {phoneError && <p className="text-red-600 text-xs font-bold mt-1">{phoneError}</p>}
                        </div>

                        <div className="flex flex-col gap-3">
                            {phoneNumber !== originalPhone && (
                                <Button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full bg-[#00F7FF] text-slate-900 hover:bg-cyan-400 font-bold shadow-md"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Save className="w-4 h-4 mr-2" />}
                                </Button>
                            )}

                            {showPhoneSuccess && (
                                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg flex items-center font-medium text-sm animate-in fade-in slide-in-from-top-2">
                                    <CheckCircle className="w-5 h-5 mr-2 text-emerald-600" />
                                    Nomor Telepon Berhasil Diperbaharui!
                                </div>
                            )}
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>

        {/* Right Column: Password Change */}
        <div className="space-y-8">
            <Card className="bg-white border border-slate-200 shadow-md hover:shadow-lg transition-shadow duration-300 h-full animate-in slide-in-from-right-4 duration-500">
                <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                    <CardTitle className="flex items-center gap-2 text-slate-900 text-lg font-bold">
                        <Lock className="w-5 h-5 text-cyan-600" /> Buat Password Baru
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <form onSubmit={handlePasswordChange} className="space-y-5">

                        {/* PASSWORD SAAT INI */}
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword" className="text-slate-700 font-bold">Masukkan Password Sebelumnya</Label>
                            <div className="relative">
                                <Input
                                    id="currentPassword"
                                    type={showCurrentPassword ? "text" : "password"}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    // Tambah padding-right (pr-10)
                                    className="bg-white text-slate-900 border-slate-300 placeholder:text-slate-400 focus:border-cyan-500 pr-10"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                                >
                                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                            {/* PASSWORD BARU */}
                            <div className="space-y-2">
                                <Label htmlFor="newPassword" className="text-slate-700 font-bold">Password Baru</Label>
                                <div className="relative">
                                    <Input
                                        id="newPassword"
                                        type={showNewPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="bg-white text-slate-900 border-slate-300 placeholder:text-slate-400 focus:border-cyan-500 pr-10"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                                    >
                                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* KONFIRMASI PASSWORD */}
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-slate-700 font-bold">Konfirmasi Password Baru</Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="bg-white text-slate-900 border-slate-300 placeholder:text-slate-400 focus:border-cyan-500 pr-10"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Kata sandi harus terdiri dari minimal 4 karakter demi keamanan akun Anda.
                            </p>
                        </div>

                        <div className="pt-2">
                            <Button
                                type="submit"
                                disabled={saving || !currentPassword || !newPassword || !confirmPassword}
                                className={`w-full font-bold shadow-md transition-all py-6 rounded-xl ${
                                    !currentPassword || !newPassword || !confirmPassword
                                    ? 'bg-slate-200 text-slate-400'
                                    : 'bg-slate-900 text-white hover:bg-slate-800 border-b-4 border-slate-950 active:border-b-0 active:translate-y-1'
                                }`}
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2"/> : <Lock className="w-4 h-4 mr-2" />}
                                Simpan Password
                            </Button>
                        </div>

                        {showPasswordSuccess && (
                            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg flex items-center font-medium text-sm animate-in fade-in slide-in-from-top-2">
                                <CheckCircle className="w-5 h-5 mr-2 text-emerald-600" />
                                Password Berhasil Diubah
                            </div>
                        )}
                    </form>
                </CardContent>
            </Card>
        </div>

      </div>
    </div>
  );
}