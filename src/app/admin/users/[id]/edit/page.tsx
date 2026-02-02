'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save, User, Phone, MapPin, ShieldCheck, AtSign } from 'lucide-react';
import Link from 'next/link';

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState('security');
  const [unitId, setUnitId] = useState('');
  const [units, setUnits] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const userRes = await fetch(`/api/admin/users/${id}`);
        if (!userRes.ok) throw new Error('User not found');
        const userData = await userRes.json();

        const unitsRes = await fetch('/api/admin/units');
        const unitsData = await unitsRes.json();

        setFullName(userData.full_name || '');
        setUsername(userData.username || '');
        setPhoneNumber(userData.phone_number || '');
        setRole(userData.role || 'security');
        setUnitId(userData.assigned_unit_id || '');
        setUnits(unitsData || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, username, phoneNumber, role, unitId }),
      });
      if (!response.ok) throw new Error('Failed to update user');
      router.push('/admin/users');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Styling agar sama dengan halaman Add User
  const labelStyle = "block text-[10px] font-bold text-slate-500 uppercase tracking-tight mb-1.5";
  const inputContainerStyle = "relative flex items-center";
  const inputStyle = "w-full bg-white border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all shadow-sm";
  const iconStyle = "absolute left-3.5 w-4 h-4 text-slate-400";

  if (isLoading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <Link href="/admin/users" className="flex items-center gap-2 text-slate-400 hover:text-slate-600 mb-6 transition-colors text-sm">
          <ArrowLeft className="h-4 w-4" /> Back to Users
        </Link>

        <div className="bg-white border border-slate-100 rounded-xl p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-8 border-b border-slate-50 pb-4">
            <User className="w-5 h-5 text-amber-500" />
            <h1 className="text-lg font-bold text-slate-800">Edit User Profile</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className={labelStyle}>Full Name (Nama Lengkap)</label>
              <div className={inputContainerStyle}>
                <User className={iconStyle} />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputStyle}
                  placeholder="Enter full name"
                  required
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className={labelStyle}>Username (For Login)</label>
              <div className={inputContainerStyle}>
                <AtSign className={iconStyle} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={inputStyle}
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className={labelStyle}>Phone Number (Optional)</label>
              <div className={inputContainerStyle}>
                <Phone className={iconStyle} />
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className={inputStyle}
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label className={labelStyle}>Role Assignment</label>
              <div className={inputContainerStyle}>
                <ShieldCheck className={iconStyle} />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={inputStyle}
                >
                  <option value="security">Security</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            {/* Assigned Unit */}
            <div>
              <label className={labelStyle}>Select Unit</label>
              <div className={inputContainerStyle}>
                <MapPin className={iconStyle} />
                <select
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  className={inputStyle}
                >
                  <option value="">Select unit...</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>{unit.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 flex items-center gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                Save Changes
              </button>
              <Link 
                href="/admin/users" 
                className="px-6 py-3 border border-slate-200 text-slate-500 font-bold rounded-lg hover:bg-slate-50 transition-all text-sm"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}