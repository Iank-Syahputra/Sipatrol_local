'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Download, Printer, UserPlus, Trash2, Edit, ChevronDown, Check, Eye } from "lucide-react";
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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{id: string, name: string} | null>(null);

  // PAGINATION STATES
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10; // Maximum 10 rows per page

  // FETCH DATA WITH PAGINATION
  const fetchData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        search: searchTerm,
        units: selectedUnits.join(','), // Array to String
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

  // Effect to fetch data when currentPage changes only
  useEffect(() => {
    fetchData();
  }, [currentPage]);

  // Effect to fetch data once when component mounts
  useEffect(() => {
    fetchData();
  }, []);

  // HANDLERS
  const handleApplyFilters = () => {
    setCurrentPage(1); // Reset to first page when applying filters
    fetchData(); // Explicitly fetch data when Apply is clicked
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedUnits([]);
    setCurrentPage(1); // Reset to first page when resetting filters
    fetchData(); // Explicitly fetch data when Reset is clicked
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    setConfirmDelete({ id: userId, name: userName });
  };

  const confirmDeleteUser = async () => {
    if (!confirmDelete) return;

    try {
      setLoading(true);

      const response = await fetch(`/api/admin/users/${confirmDelete.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete user');
      }

      // Refresh the user list
      await fetchData();
      setConfirmDelete(null);
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.message);
      setTimeout(() => setError(null), 5000); // Clear error after 5 seconds
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setConfirmDelete(null);
  };

  // 2. EXPORT FUNCTION LOGIC - Fetch all users for export
  const handleExport = async () => {
    try {
      // Dynamically import XLSX here to avoid build errors
      const XLSX = await import('xlsx');

      // Fetch all users (with a large limit to get everything)
      const response = await fetch('/api/admin/users?limit=10000&page=1');
      const data = await response.json();

      if (!data.users || data.users.length === 0) {
        alert("Tidak ada data pengguna untuk diexport.");
        return;
      }

      // Mapping data agar sesuai dengan kolom Excel yang diinginkan
      const dataToExport = data.users.map(user => ({
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
    } catch (error) {
      console.error('Error exporting users:', error);
      alert("Gagal melakukan export data pengguna.");
    }
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
    <>
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Users List</h2>
              <div className="text-sm text-zinc-400">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)} - {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} users
              </div>
            </div>

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
                          <button
                            onClick={() => handleDeleteUser(user.id, user.full_name)}
                            className="text-red-400 hover:text-red-300"
                          >
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

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-zinc-400">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={`px-3 py-1.5 rounded-lg ${currentPage === 1 ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}
                      >
                        Previous
                      </button>

                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          // Show all pages if total is 5 or less
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          // Show first 5 pages if current page is 1-3
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          // Show last 5 pages if current page is near the end
                          pageNum = totalPages - 4 + i;
                        } else {
                          // Show current page in the middle
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-1.5 rounded-lg min-w-[36px] ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'bg-zinc-800 text-white hover:bg-zinc-700'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1.5 rounded-lg ${currentPage === totalPages ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-2 text-white">Confirm Delete</h3>
            <p className="text-zinc-300 mb-6">
              Are you sure you want to delete user <span className="font-semibold text-white">"{confirmDelete.name}"</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteUser}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}