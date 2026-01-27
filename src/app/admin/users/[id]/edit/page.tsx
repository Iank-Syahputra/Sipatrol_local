'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(''); // 1. Tambah State Phone
  const [role, setRole] = useState('security');
  const [unitId, setUnitId] = useState('');
  const [units, setUnits] = useState<any[]>([]);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const userRes = await fetch(`/api/admin/users/${id}`);
        if (!userRes.ok) throw new Error('User not found');
        const userData = await userRes.json();

        const unitsRes = await fetch('/api/admin/units');
        const unitsData = await unitsRes.json();

        // 2. Set State dari Data Database
        setFullName(userData.full_name || '');
        setUsername(userData.username || '');
        setPhoneNumber(userData.phone_number || ''); // Load Phone
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

  // Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      // 3. Kirim data username dan phoneNumber ke API
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

  if (isLoading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">Loading...</div>;
  if (error) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <Link href="/admin/users" className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Users
        </Link>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
          <h1 className="text-2xl font-bold mb-6">Edit User</h1>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Username - SEKARANG BISA DIEDIT */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-600 outline-none"
                required
              />
            </div>

            {/* Phone Number - FIELD BARU */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Phone Number</label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="08..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-600 outline-none"
                required
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-600 outline-none"
              >
                <option value="security">Security</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Assigned Unit */}
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Assigned Unit</label>
              <select
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-600 outline-none"
              >
                <option value="">Select Unit...</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>{unit.name}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              Save Changes
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}