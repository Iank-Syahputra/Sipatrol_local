'use client';

import { useState, useEffect } from 'react';
// 1. IMPORT XLSX
import * as XLSX from 'xlsx';
import { Activity, Map, Users, AlertTriangle, CircleGauge, Clock, Shield, Eye, Search, Filter, FileText, Building, User, Plus, Download, Printer, Edit, Trash } from "lucide-react";
import AdminSidebar from '@/components/admin-sidebar';

export default function ManageUnitsPage() {
  const [units, setUnits] = useState<any[]>([]); // Stores paginated data
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUnit, setEditingUnit] = useState<any>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  // PAGINATION STATES
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10; // Maximum 10 rows per page

  // 2. FETCH DATA WITH PAGINATION
  const fetchUnits = async () => {
    try {
      setLoading(true);
      // Calculate offset for pagination
      const offset = (currentPage - 1) * itemsPerPage;

      // Call API with pagination and search params
      const queryParams = new URLSearchParams({
        search: searchTerm,
        limit: itemsPerPage.toString(),
        offset: offset.toString()
      });

      const response = await fetch(`/api/admin/units?${queryParams}`);

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      setUnits(data.units || []);       // Set paginated units
      setTotalCount(data.pagination?.total || 0);  // Set total count
      setTotalPages(Math.ceil((data.pagination?.total || 0) / itemsPerPage)); // Calculate total pages
    } catch (err) {
      console.error('Error fetching units:', err);
      setError('Failed to load units');
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch units when currentPage or searchTerm changes
  useEffect(() => {
    fetchUnits();
  }, [currentPage, searchTerm]);

  const handleAddUnit = async () => {
    // Get form values
    const name = (document.getElementById('unit-name') as HTMLInputElement)?.value;
    const district = (document.getElementById('unit-district') as HTMLInputElement)?.value;

    if (!name || !district) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch('/api/admin/units', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, district }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Refresh the data
      setShowAddForm(false);
      // Reset to first page after adding new unit
      setCurrentPage(1);
      fetchUnits();

      // Clear form
      (document.getElementById('unit-name') as HTMLInputElement).value = '';
      (document.getElementById('unit-district') as HTMLInputElement).value = '';
    } catch (err) {
      console.error('Error adding unit:', err);
      alert('Failed to add unit');
    }
  };

  const handleEditUnit = async () => {
    const name = (document.getElementById('edit-unit-name') as HTMLInputElement)?.value;
    const district = (document.getElementById('edit-unit-district') as HTMLInputElement)?.value;

    if (!name || !district || !editingUnit) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch('/api/admin/units', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: editingUnit.id, name, district }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Refresh the data
      setShowEditForm(false);
      setEditingUnit(null);
      fetchUnits();

      // Clear form
      (document.getElementById('edit-unit-name') as HTMLInputElement).value = '';
      (document.getElementById('edit-unit-district') as HTMLInputElement).value = '';
    } catch (err) {
      console.error('Error updating unit:', err);
      alert(err instanceof Error ? err.message : 'Failed to update unit');
    }
  };

  const handleDeleteUnit = async (unit: any) => {
    if (!window.confirm(`Are you sure you want to delete unit "${unit.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/units', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: unit.id }),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          // If response is not JSON, use status text
          errorData = { error: response.statusText || `HTTP error! status: ${response.status}` };
        }

        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // Refresh the data
      fetchUnits();
    } catch (err) {
      console.error('Error deleting unit:', err);
      if (err instanceof TypeError && err.message.includes('fetch failed')) {
        alert('Network error: Could not connect to the server. Please check your connection and try again.');
      } else if (err instanceof Error && err.message.includes('Cannot delete unit: there are reports associated with this unit')) {
        alert('Cannot delete this unit because there are reports associated with it. Please reassign or delete these reports first before deleting the unit.');
      } else if (err instanceof Error && err.message.includes('Cannot delete unit: there are users assigned to this unit')) {
        alert('Cannot delete this unit because there are users assigned to it. Please reassign these users to another unit first.');
      } else {
        alert(err instanceof Error ? err.message : 'Failed to delete unit');
      }
    }
  };

  const startEditUnit = (unit: any) => {
    setEditingUnit(unit);
    setShowEditForm(true);

    // Populate form fields after a short delay to ensure DOM is ready
    setTimeout(() => {
      const nameInput = document.getElementById('edit-unit-name') as HTMLInputElement;
      const districtInput = document.getElementById('edit-unit-district') as HTMLInputElement;

      if (nameInput) nameInput.value = unit.name;
      if (districtInput) districtInput.value = unit.district;
    }, 0);
  };

  // 2. EXPORT FUNCTION LOGIC - Fetch all units for export
  const handleExport = async () => {
    try {
      // Fetch all units (with a large limit to get everything)
      const response = await fetch('/api/admin/units?limit=10000&offset=0');
      const data = await response.json();

      if (!data.units || data.units.length === 0) {
        alert("Tidak ada data unit untuk diexport.");
        return;
      }

      // Mapping data agar sesuai dengan kolom Excel yang diinginkan
      const dataToExport = data.units.map(unit => ({
        "Nama Unit": unit.name || 'N/A',
        "Wilayah/Daerah": unit.district || 'N/A',
        "Tanggal Dibuat": new Date(unit.created_at).toLocaleString('id-ID'),
        "ID": unit.id
      }));

      // Membuat Worksheet dan Workbook
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Daftar Unit");

      // Auto-width columns (Sedikit styling biar rapi)
      worksheet["!cols"] = [ { wch: 25 }, { wch: 30 }, { wch: 20 }, { wch: 30 } ];

      // Generate file name dengan timestamp
      const timestamp = new Date().toISOString().slice(0,10);
      XLSX.writeFile(workbook, `Daftar_Unit_${timestamp}.xlsx`);
    } catch (error) {
      console.error('Error exporting units:', error);
      alert("Gagal melakukan export data unit.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p>Loading units...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center p-6 bg-zinc-900 border border-zinc-800 rounded-xl max-w-md">
          <h2 className="text-xl font-bold mb-2">Error Loading Units</h2>
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
      {/* Sidebar Navigation */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Manage Units</h1>
            <div className="flex items-center gap-4">
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
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-y-auto">
          {/* Controls */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative w-full md:w-64">
                <input
                  type="text"
                  placeholder="Search units..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Reset to first page when searching
                  }}
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              </div>

              <button
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
                onClick={() => setShowAddForm(!showAddForm)}
              >
                <Plus className="h-4 w-4" />
                Add New Unit
              </button>
            </div>

            {/* Add Unit Form */}
            {showAddForm && (
              <div className="mt-6 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <h3 className="font-medium text-white mb-3">Add New Unit</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Unit Name</label>
                    <input
                      id="unit-name"
                      type="text"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter unit name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">District</label>
                    <input
                      id="unit-district"
                      type="text"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter district"
                      defaultValue="PT PLN Nusantara Power UP Kendari"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
                    onClick={handleAddUnit}
                  >
                    Save Unit
                  </button>
                  <button
                    className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Edit Unit Form */}
            {showEditForm && editingUnit && (
              <div className="mt-6 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <h3 className="font-medium text-white mb-3">Edit Unit</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Unit Name</label>
                    <input
                      id="edit-unit-name"
                      type="text"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter unit name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">District</label>
                    <input
                      id="edit-unit-district"
                      type="text"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter district"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
                    onClick={handleEditUnit}
                  >
                    Update Unit
                  </button>
                  <button
                    className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-sm"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingUnit(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Units Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Units List</h2>
              <div className="text-sm text-zinc-400">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)} - {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} units
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800 text-left text-sm text-zinc-400">
                    <th className="pb-3">Unit Name</th>
                    <th className="pb-3">District</th>
                    <th className="pb-3">Created At</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {units.map((unit: any) => (
                    <tr key={unit.id} className="text-sm">
                      <td className="py-3 font-medium text-white">{unit.name}</td>
                      <td className="py-3 text-zinc-300">{unit.district}</td>
                      <td className="py-3 text-zinc-300">{new Date(unit.created_at).toLocaleDateString()}</td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button
                            className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                            onClick={() => startEditUnit(unit)}
                          >
                            <Edit className="h-4 w-4" /> Edit
                          </button>
                          <button
                            className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1"
                            onClick={() => handleDeleteUnit(unit)}
                          >
                            <Trash className="h-4 w-4" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {units.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-zinc-500">
                        No units found matching your criteria
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

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
        </div>
      </div>
    </div>
  );
}