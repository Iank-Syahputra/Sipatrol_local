'use client';

import { useState, useEffect } from 'react';
// 1. IMPORT XLSX
import * as XLSX from 'xlsx';
import { Search, Filter, Download, Printer, UserPlus, Trash2, Edit, ChevronDown, Check, Eye } from "lucide-react";
import AdminSidebar from '@/components/admin-sidebar';
import Link from 'next/link';

// --- REUSABLE MULTI-SELECT COMPONENT ---
const MultiSelectDropdown = ({ options, selected, onChange, placeholder }: any) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((item: string) => item !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-left text-sm text-white flex justify-between items-center"
      >
        <span className="truncate">{selected.length ? `${selected.length} Selected` : placeholder}</span>
        <ChevronDown className="h-4 w-4 text-zinc-400" />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {options.map((opt: any) => (
            <div
              key={opt.id}
              onClick={() => toggleOption(opt.id)}
              className="px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 cursor-pointer flex items-center gap-2"
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center ${selected.includes(opt.id) ? 'bg-blue-600 border-blue-600' : 'border-zinc-500'}`}>
                {selected.includes(opt.id) && <Check className="h-3 w-3 text-white" />}
              </div>
              {opt.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function ManageUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [allUnits, setAllUnits] = useState<any[]>([]);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [filterTrigger, setFilterTrigger] = useState(0); // For Manual Trigger
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // FETCH DATA
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams({
          search: searchTerm,
          units: selectedUnits.join(','), // Array to String
        });

        const response = await fetch(`/api/admin/users?${queryParams}`);
        if (!response.ok) throw new Error('Failed to fetch users');

        const data = await response.json();
        setUsers(data.users);
        setAllUnits(data.units);
      } catch (err) {
        console.error(err);
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filterTrigger]); // Only run when trigger updates

  // HANDLERS
  const handleApplyFilters = () => setFilterTrigger(prev => prev + 1);
  
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedUnits([]);
    setFilterTrigger(prev => prev + 1);
  };

  // 2. EXPORT FUNCTION LOGIC
  const handleExport = () => {
    if (users.length === 0) {
      alert("Tidak ada data pengguna untuk diexport.");
      return;
    }

    // Mapping data agar sesuai dengan kolom Excel yang diinginkan
    const dataToExport = users.map(user => ({
      "Nama Lengkap": user.full_name || 'N/A',
      "Username": user.username || 'N/A',
      "Nomor Telepon": user.phone_number || '-',
      "Unit": user.units?.name || '-',
      "Peran": user.role || 'N/A',
      "Tanggal Dibuat": new Date(user.created_at).toLocaleString('id-ID'),
      "Email": user.email || '-',
      "ID": user.id
    }));

    // Membuat Worksheet dan Workbook
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Daftar Pengguna");

    // Auto-width columns (Sedikit styling biar rapi)
    worksheet["!cols"] = [ { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 20 }, { wch: 30 }, { wch: 30 } ];

    // Generate file name dengan timestamp
    const timestamp = new Date().toISOString().slice(0,10);
    XLSX.writeFile(workbook, `Daftar_Pengguna_${timestamp}.xlsx`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center p-6 bg-zinc-900 border border-zinc-800 rounded-xl max-w-md">
          <h2 className="text-xl font-bold mb-2">Error Loading Users</h2>
          <p className="text-zinc-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      <AdminSidebar />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Manage Users</h1>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                Export Excel
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700 transition-colors">
                <Printer className="h-4 w-4" />
                Print
              </button>
              <Link href="/admin/users/create">
                <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors">
                  <UserPlus className="h-4 w-4" /> Add User
                </button>
              </Link>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-y-auto">
          
          {/* FILTER SECTION (Consistent Design) */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              {/* Search */}
              <div className="md:col-span-2">
                <label className="block text-sm text-zinc-400 mb-2">Search Name</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name or username..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 pl-10 pr-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                </div>
              </div>

              {/* Multi-Select Unit */}
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Filter Units</label>
                <MultiSelectDropdown
                  options={allUnits}
                  selected={selectedUnits}
                  onChange={setSelectedUnits}
                  placeholder="Select Units"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-end gap-2">
                <button
                  onClick={handleApplyFilters}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                >
                  <Filter className="h-4 w-4" /> Apply
                </button>
                <button
                  onClick={handleResetFilters}
                  className="px-3 py-2 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg text-sm transition-colors"
                >
                  Reset
                </button>
              </div>

            </div>
          </div>

          {/* TABLE SECTION */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4">Users List</h2>
            {loading ? (
               <div className="text-center py-10 text-zinc-500">Loading users...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800 text-left text-sm text-zinc-400">
                      <th className="pb-3 pl-2">Full Name</th>
                      <th className="pb-3">Username</th>
                      <th className="pb-3">Phone</th>
                      <th className="pb-3">Unit</th>
                      <th className="pb-3">Role</th>
                      <th className="pb-3">Created At</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {users.map((user: any) => (
                      <tr key={user.id} className="text-sm hover:bg-zinc-800/50 transition-colors">
                        <td className="py-3 pl-2 font-medium text-white">{user.full_name}</td>
                        <td className="py-3 text-zinc-300">{user.username}</td>
                        <td className="py-3 text-zinc-300">{user.phone_number || '-'}</td>
                        <td className="py-3 text-zinc-300">{user.units?.name || '-'}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 text-zinc-300">{new Date(user.created_at).toLocaleDateString()}</td>
                        <td className="py-3 flex gap-2">
                          <Link href={`/admin/users/${user.id}/edit`} className="text-blue-400 hover:text-blue-300">
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button className="text-red-400 hover:text-red-300">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-zinc-500">No users found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}