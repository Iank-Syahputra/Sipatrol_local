'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Printer, 
  UserPlus, 
  Trash2, 
  Edit, 
  ChevronDown, 
  Check, 
  User,
  Phone,
  Mail,
  Building,
  Shield,
  Calendar,
  AlertTriangle
} from "lucide-react";
import Link from 'next/link';

// --- REUSABLE MULTI-SELECT COMPONENT (Light Mode) ---
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
    <div className="relative w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-slate-300 rounded-xl py-2.5 px-3 text-left text-sm text-slate-700 flex justify-between items-center hover:bg-slate-50 transition-colors focus:ring-2 focus:ring-amber-500 focus:outline-none"
      >
        <span className="truncate pr-2 font-medium">
          {selected.length ? `${selected.length} Selected` : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
            {options.map((opt: any) => (
              <div
                key={opt.id}
                onClick={() => toggleOption(opt.id)}
                className="px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center gap-3 border-b border-slate-100 last:border-0 transition-colors"
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${selected.includes(opt.id) ? 'bg-amber-500 border-amber-500' : 'border-slate-300'}`}>
                  {selected.includes(opt.id) && <Check className="h-3 w-3 text-white" />}
                </div>
                <span className="truncate font-medium">{opt.name}</span>
              </div>
            ))}
          </div>
        </>
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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{id: string, name: string} | null>(null);

  // PAGINATION STATES
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10; 

  // FETCH DATA WITH PAGINATION
  const fetchData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        search: searchTerm,
        units: selectedUnits.join(','),
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      })
      
      const response = await fetch(`/api/admin/users?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch users');

      const data = await response.json();
      setUsers(data.users);
      setAllUnits(data.units);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      console.error(err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [currentPage]);
  useEffect(() => { fetchData(); }, []);

  // HANDLERS
  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchData();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedUnits([]);
    setCurrentPage(1);
    fetchData();
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    setConfirmDelete({ id: userId, name: userName });
  };

  const confirmDeleteUser = async () => {
    if (!confirmDelete) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${confirmDelete.id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to delete user');
      await fetchData();
      setConfirmDelete(null);
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => setConfirmDelete(null);

  const handleExport = async () => {
    try {
      const XLSX = await import('xlsx');
      const response = await fetch('/api/admin/users?limit=10000&page=1');
      const data = await response.json();

      if (!data.users || data.users.length === 0) return alert("Tidak ada data pengguna untuk diexport.");

      const dataToExport = data.users.map((user: any) => ({
        "Nama Lengkap": user.full_name || 'N/A',
        "Username": user.username || 'N/A',
        "Nomor Telepon": user.phone_number || '-',
        "Unit": user.units?.name || '-',
        "Peran": user.role || 'N/A',
        "Tanggal Dibuat": new Date(user.created_at).toLocaleString('id-ID'),
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Daftar Pengguna");
      XLSX.writeFile(workbook, `Daftar_Pengguna_${new Date().toISOString().slice(0,10)}.xlsx`);
    } catch (error) {
      console.error('Error exporting users:', error);
      alert("Gagal melakukan export data pengguna.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-amber-500 border-r-transparent mb-4"></div>
          <p className="font-medium text-slate-500">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <div className="text-center p-8 bg-white border border-red-200 rounded-2xl shadow-lg max-w-md">
          <h2 className="text-xl font-bold mb-2 text-slate-900">Error Loading Users</h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 flex flex-col w-full bg-slate-50 text-slate-900 min-h-screen">
        
        {/* --- HEADER --- */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md px-6 py-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Manage Users</h1>
              <p className="text-xs font-medium text-slate-500 hidden sm:block mt-1">Control user access and information</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <button onClick={handleExport} className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition-colors shadow-sm">
                <Download className="h-4 w-4" /> 
                <span className="hidden sm:inline">Export Excel</span>
                <span className="sm:hidden">Export</span>
              </button>
              
              <Link href="/admin/users/create" className="flex-1 sm:flex-none">
                <button className="w-full justify-center flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors shadow-md hover:shadow-lg">
                  <UserPlus className="h-4 w-4" /> Add User
                </button>
              </Link>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-y-auto">

          {/* --- FILTERS --- */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Filter className="h-4 w-4 text-amber-600" /> Filter Users
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
              
              {/* Search */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Search Name</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name or username..."
                    className="w-full bg-white border border-slate-300 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                </div>
              </div>

              {/* Unit Filter */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Filter Units</label>
                <MultiSelectDropdown options={allUnits} selected={selectedUnits} onChange={setSelectedUnits} placeholder="Select Units" />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button onClick={handleApplyFilters} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold transition-colors shadow-md">
                  <Filter className="h-4 w-4" /> Apply
                </button>
                <button onClick={handleResetFilters} className="px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 font-bold rounded-xl text-sm transition-colors">
                  Reset
                </button>
              </div>

            </div>
          </div>

          {/* --- DATA DISPLAY --- */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
              <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-amber-600" /> Users List
              </h2>
              <span className="text-xs font-bold px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 shadow-sm">Total: {totalCount}</span>
            </div>

            {/* VIEW 1: DESKTOP TABLE */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500 tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Full Name</th>
                    <th className="px-6 py-4">Username</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4">Unit</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Created At</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {users.map((user: any) => (
                    <tr key={user.id} className="hover:bg-amber-50/30 transition-colors group">
                      <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-3">
                          <div className="p-1.5 bg-slate-100 rounded-full text-slate-500 border border-slate-200"><User size={16} /></div>
                          {user.full_name}
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">@{user.username}</td>
                      <td className="px-6 py-4 text-slate-600">{user.phone_number || '-'}</td>
                      <td className="px-6 py-4 text-slate-600">
                          <span className="bg-slate-50 px-2 py-1 rounded border border-slate-200 text-xs font-medium">
                              {user.units?.name || '-'}
                          </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide border ${
                          user.role === 'admin' 
                            ? 'bg-amber-50 text-amber-700 border-amber-200' 
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 tabular-nums font-medium">{new Date(user.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/users/${user.id}/edit`} className="p-2 bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-slate-400 transition-all shadow-sm">
                            <Edit size={16} />
                          </Link>
                          <button onClick={() => handleDeleteUser(user.id, user.full_name)} className="p-2 bg-white border border-slate-200 hover:border-red-300 hover:text-red-600 hover:bg-red-50 rounded-lg text-slate-400 transition-all shadow-sm">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* VIEW 2: MOBILE CARDS */}
            <div className="md:hidden divide-y divide-slate-100">
              {users.map((user: any) => (
                <div key={user.id} className="p-5 bg-white hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 shadow-sm">
                        <User size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{user.full_name}</h3>
                        <p className="text-xs font-medium text-slate-500">@{user.username}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                      user.role === 'admin' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {user.role}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {user.units?.name && (
                      <div className="flex items-center gap-2">
                        <Building size={14} className="text-slate-400" />
                        <span className="font-medium">{user.units.name}</span>
                      </div>
                    )}
                    {user.phone_number && (
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-slate-400" />
                        <span>{user.phone_number}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-slate-500 pt-1 border-t border-slate-200 mt-2">
                        <Calendar size={12} /> Registered: {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Link href={`/admin/users/${user.id}/edit`} className="flex-1">
                      <button className="w-full py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-colors shadow-sm">
                        <Edit size={14} /> Edit
                      </button>
                    </Link>
                    <button 
                      onClick={() => handleDeleteUser(user.id, user.full_name)}
                      className="flex-1 py-2 bg-white border border-slate-200 hover:bg-red-50 hover:border-red-200 rounded-lg text-xs font-bold text-red-600 flex items-center justify-center gap-2 transition-colors shadow-sm"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {users.length === 0 && (
               <div className="p-16 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4 text-slate-400 border border-slate-200">
                  <User size={32} />
                </div>
                <h3 className="text-slate-900 font-bold text-lg mb-1">No users found</h3>
                <p className="text-sm text-slate-500 font-medium">Try adjusting your filters or search terms.</p>
              </div>
            )}

            {/* Pagination Footer */}
            {totalPages > 1 && (
              <div className="p-5 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Page {currentPage} of {totalPages}</span>
                <div className="flex gap-2">
                  <button 
                    disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                    className="px-4 py-2 text-xs font-bold bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >Previous</button>
                  <button 
                    disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                    className="px-4 py-2 text-xs font-bold bg-amber-500 border border-amber-600 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                  >Next</button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Confirmation Dialog (Modal) */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl scale-100 transform transition-all">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-full text-red-600">
                    <AlertTriangle className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Confirm Delete</h3>
            </div>
            
            <p className="text-slate-600 mb-6 text-sm leading-relaxed font-medium">
              Are you sure you want to delete user <span className="font-bold text-slate-900">"{confirmDelete.name}"</span>?
              <br/><span className="text-red-600 text-xs mt-1 block">This action cannot be undone and will remove all associated data.</span>
            </p>
            
            <div className="flex gap-3 justify-end">
              <button onClick={cancelDelete} className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-sm transition-colors border border-slate-300">
                Cancel
              </button>
              <button onClick={confirmDeleteUser} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-colors shadow-md hover:shadow-lg">
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}