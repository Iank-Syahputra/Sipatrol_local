'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Camera, MapPin, Wifi, WifiOff, Loader2, CheckCircle, RotateCcw, ImageUp, X, UserRound } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

// Create Supabase client with public keys (safe for client-side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function UserManagementTable({ 
  initialUsers, 
  initialUnits 
}: { 
  initialUsers: any[]; 
  initialUnits: any[]; 
}) {
  const [users, setUsers] = useState(initialUsers);
  const [units] = useState(initialUnits);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const { user: clerkUser } = useUser();

  // Delete user function using direct Supabase call
  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    setLoadingStates(prev => ({ ...prev, [userId]: true }));

    try {
      // Delete user from profiles table
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        throw new Error(error.message);
      }

      // Remove user from local state
      setUsers(users.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(`Failed to delete user: ${(error as Error).message}`);
    } finally {
      setLoadingStates(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Open edit modal with user data
  const openEditModal = (user: any) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  // Close edit modal
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingUser(null);
  };

  // Update user function using direct Supabase call
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editingUser.full_name,
          role: editingUser.role,
          assigned_unit_id: editingUser.assigned_unit_id || null
        })
        .eq('id', editingUser.id);

      if (error) {
        throw new Error(error.message);
      }

      // Update user in local state
      setUsers(users.map(u => 
        u.id === editingUser.id ? editingUser : u
      ));

      closeEditModal();
    } catch (error) {
      console.error('Error updating user:', error);
      alert(`Failed to update user: ${(error as Error).message}`);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <h2 className="text-lg font-bold mb-4">Users List</h2>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800 text-left text-sm text-zinc-400">
              <th className="pb-3">Name</th>
              <th className="pb-3">Role</th>
              <th className="pb-3">Assigned Unit</th>
              <th className="pb-3">Created At</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {users.map((user: any) => (
              <tr key={user.id} className="text-sm">
                <td className="py-3 font-medium text-white">
                  {user.full_name}
                </td>
                <td className="py-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    user.role === 'admin'
                      ? 'bg-purple-500/10 text-purple-400'
                      : 'bg-blue-500/10 text-blue-400'
                  }`}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </td>
                <td className="py-3 text-zinc-300">
                  {user.units?.name || 'Unassigned'}
                </td>
                <td className="py-3 text-zinc-300">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(user)}
                      className="text-blue-400 hover:text-blue-300 border-zinc-700 hover:bg-zinc-800"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(user.id)}
                      disabled={loadingStates[user.id]}
                      className="text-red-400 hover:text-red-300 border-zinc-700 hover:bg-zinc-800 disabled:opacity-50"
                    >
                      {loadingStates[user.id] ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        'Delete'
                      )}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}

            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-zinc-500">
                  No users found matching your criteria
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Edit User</h3>
              <button 
                onClick={closeEditModal}
                className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <Label htmlFor="full-name">Full Name</Label>
                <input
                  id="full-name"
                  type="text"
                  value={editingUser.full_name}
                  onChange={(e) => setEditingUser({...editingUser, full_name: e.target.value})}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="security">Security</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <Label htmlFor="assigned-unit">Assigned Unit</Label>
                <select
                  id="assigned-unit"
                  value={editingUser.assigned_unit_id || ''}
                  onChange={(e) => setEditingUser({...editingUser, assigned_unit_id: e.target.value || null})}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Unassigned</option>
                  {units.map((unit: any) => (
                    <option key={unit.id} value={unit.id}>{unit.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  Save Changes
                </Button>
                <Button type="button" variant="outline" onClick={closeEditModal} className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}