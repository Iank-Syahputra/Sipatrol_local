'use client';

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  Download,
  Printer,
  Edit3,
  Trash2,
  Search,
  Plus,
  MapPin,
  Calendar,
  Building,
  ArrowRight,
  AlertTriangle
} from "lucide-react";

export default function ManageUnitsPage() {
  const [allUnits, setAllUnits] = useState<any[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', district: '' });

  // Selection states
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  const [deletingUnitId, setDeletingUnitId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // PAGINATION STATES
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- LOGIC HELPER ---
  const totalPages = Math.ceil(filteredUnits.length / itemsPerPage);
  const currentData = filteredUnits.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 1. FETCH DATA
  const fetchUnits = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/units`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      setAllUnits(data || []);
      setFilteredUnits(data || []);
    } catch (err) {
      console.error('Error fetching units:', err);
      setError('Failed to load units');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  // --- HANDLERS ---
  const handleAddUnit = async () => {
    if (!formData.name) return alert('Please fill in all fields');

    try {
      const response = await fetch('/api/admin/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, district: "PT PLN Nusantara Power UP Kendari" }),
      });
      if (!response.ok) throw new Error(`HTTP error!`);

      setShowAddForm(false);
      setFormData({ name: '', district: '' });
      setCurrentPage(1);
      fetchUnits();
    } catch (err) { alert('Failed to add unit'); }
  };

  const handleEditUnit = async () => {
    if (!formData.name || !editingUnit) return alert('Please fill in all fields');

    try {
      const response = await fetch('/api/admin/units', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingUnit.id, name: formData.name, district: "PT PLN Nusantara Power UP Kendari" }),
      });
      if (!response.ok) throw new Error(`HTTP error!`);

      setShowEditForm(false);
      setEditingUnit(null);
      setFormData({ name: '', district: '' });
      fetchUnits();
    } catch (err) { alert('Failed to update unit'); }
  };

  const handleDeleteUnit = async (unit: any) => {
    if (!isSelectionMode) {
      // If not in selection mode, delete single item
      setDeletingUnitId(unit.id);
      setIsDeleteConfirmationOpen(true);
    } else {
      // If in selection mode, add to selection
      toggleUnitSelection(unit.id);
    }
  };

  const startEditUnit = (unit: any) => {
    setEditingUnit(unit);
    setFormData({ name: unit.name, district: "PT PLN Nusantara Power UP Kendari" });
    setShowEditForm(true);
    setShowAddForm(false);
    
    // Scroll to the top where the edit form is located
    setTimeout(() => {
      const formElement = document.querySelector('.bg-white.border.border-amber-200');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
  };

  // Selection handlers
  const toggleUnitSelection = (unitId: string) => {
    setSelectedUnits(prev =>
      prev.includes(unitId)
        ? prev.filter(id => id !== unitId)
        : [...prev, unitId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUnits.length === currentData.length) {
      setSelectedUnits([]);
    } else {
      setSelectedUnits(currentData.map(unit => unit.id));
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (!isSelectionMode) {
      setSelectedUnits([]); // Clear selections when entering selection mode
    }
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedUnits([]);
  };

  const handleDeleteSingleUnit = (unitId: string, unitName: string) => {
    setDeletingUnitId(unitId);
    setIsDeleteConfirmationOpen(true);
  };

  const handleDeleteMultipleUnits = () => {
    if (selectedUnits.length > 0) {
      setIsDeleteConfirmationOpen(true);
    }
  };

  const handleDeleteAllUnits = () => {
    if (allUnits.length > 0) {
      setSelectedUnits(allUnits.map(unit => unit.id));
      setIsDeleteConfirmationOpen(true);
    }
  };

  const [deleteError, setDeleteError] = useState<string | null>(null);

  const confirmDelete = async () => {
    try {
      if (deletingUnitId) {
        // Delete single unit
        const response = await fetch(`/api/admin/units`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: deletingUnitId }),
        });

        if (!response.ok) {
          let errorMessage = '';

          // Check if the response is JSON or plain text
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
          } else {
            // If not JSON, try to read as text
            const errorText = await response.text();
            errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
          }

          throw new Error(errorMessage);
        }

        // Update local state to remove the deleted unit
        setAllUnits(prev => prev.filter(unit => unit.id !== deletingUnitId));
        setFilteredUnits(prev => prev.filter(unit => unit.id !== deletingUnitId));

        setDeletingUnitId(null);
      } else if (selectedUnits.length > 0) {
        // Delete multiple units
        const response = await fetch('/api/admin/units', {  // Updated to use same endpoint
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ unitIds: selectedUnits }),
        });

        if (!response.ok) {
          let errorMessage = '';

          // Check if the response is JSON or plain text
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
          } else {
            // If not JSON, try to read as text
            const errorText = await response.text();
            errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
          }

          throw new Error(errorMessage);
        }

        // Update local state to remove the deleted units
        setAllUnits(prev => prev.filter(unit => !selectedUnits.includes(unit.id)));
        setFilteredUnits(prev => prev.filter(unit => !selectedUnits.includes(unit.id)));
        setSelectedUnits([]);
      }

      setIsDeleteConfirmationOpen(false);
      await fetchUnits(); // Refresh data after deletion
    } catch (error: any) {
      console.error('Error deleting unit(s):', error);
      setDeleteError(error.message);
      setIsDeleteConfirmationOpen(false);
    }
  };

  const handleExport = async () => {
    if (allUnits.length === 0) return alert("No data to export");
    const dataToExport = allUnits.map(unit => ({
      "Nama Unit": unit.name || 'N/A',
      "Wilayah": unit.district || 'N/A',
      "Dibuat": new Date(unit.created_at).toLocaleDateString('id-ID'),
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Units");
    XLSX.writeFile(workbook, `Units_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
    if (term.trim() === '') {
      setFilteredUnits(allUnits);
    } else {
      const filtered = allUnits.filter(unit =>
        unit.name.toLowerCase().includes(term.toLowerCase()) ||
        unit.district.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredUnits(filtered);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-amber-500 border-r-transparent mb-4"></div>
          <p className="font-medium text-slate-500">Loading units...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <div className="text-center p-8 bg-white border border-red-200 rounded-2xl shadow-lg max-w-md">
          <h2 className="text-xl font-bold mb-2 text-slate-900">Error Loading Units</h2>
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
    <div className="flex-1 flex flex-col w-full bg-slate-50 text-slate-900 min-h-screen">
      
      {/* --- HEADER --- */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md px-6 py-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Kelola Unit</h1>
            <p className="text-xs font-medium text-slate-500 hidden sm:block mt-1">Konfigurasi unit organisasi dan wilayah</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 self-end sm:self-auto">
            <div className="flex items-center gap-2">
              {isSelectionMode ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-700">
                    {selectedUnits.length} dipilih
                  </span>
                  <button
                    onClick={handleDeleteMultipleUnits}
                    className="flex items-center gap-1 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors shadow-sm"
                    disabled={selectedUnits.length === 0}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Hapus</span>
                  </button>
                  <button
                    onClick={exitSelectionMode}
                    className="flex items-center gap-1 px-3 py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors shadow-sm"
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <button
                  onClick={toggleSelectionMode}
                  className="flex items-center gap-1 px-3 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold hover:bg-amber-100 transition-colors shadow-sm"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Pilih</span>
                </button>
              )}
              <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs sm:text-sm font-bold hover:bg-emerald-100 transition-colors shadow-sm">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Ekspor ke Excel</span>
                <span className="sm:hidden">Ekspor</span>
              </button>
              {!isSelectionMode && (
                <button
                  onClick={handleDeleteAllUnits}
                  className="flex items-center gap-1 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors shadow-sm"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Hapus Semua</span>
                </button>
              )}
              <button
                onClick={() => {
                  setShowAddForm(true);
                  setShowEditForm(false);
                  setFormData({ name: '', district: 'PT PLN Nusantara Power UP Kendari' });
                  
                  // Scroll to the top where the add form is located
                  setTimeout(() => {
                    const formElement = document.querySelector('.bg-white.border.border-amber-200');
                    if (formElement) {
                      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    } else {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }, 100);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors shadow-md hover:shadow-lg"
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Unit</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6 overflow-y-auto">
        
        {/* --- CONTROLS SECTION --- */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 shadow-sm">
          <div className="grid grid-cols-1 gap-4">
            {/* Search */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Cari Unit</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama atau wilayah..."
                  className="w-full bg-white border border-slate-300 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all shadow-sm"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        {/* --- ADD/EDIT FORM --- */}
        {(showAddForm || showEditForm) && (
          <div className="bg-white border border-amber-200 rounded-2xl p-6 mb-8 shadow-lg ring-1 ring-amber-100 animate-in fade-in slide-in-from-top-4">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2 text-lg border-b border-slate-100 pb-4">
              <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                 {showEditForm ? <Edit3 className="h-5 w-5"/> : <Plus className="h-5 w-5"/>}
              </div>
              {showEditForm ? 'Edit Detail Unit' : 'Tambah Unit Baru'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Nama Unit</label>
                <input
                  id={showEditForm ? "edit-unit-name" : "unit-name"}
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value, district: "PT PLN Nusantara Power UP Kendari"})}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 px-4 text-sm text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                  placeholder="contoh: Unit Pembangkit"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Wilayah</label>
                <input
                  id={showEditForm ? "edit-unit-district" : "unit-district"}
                  type="text"
                  value="PT PLN Nusantara Power UP Kendari"
                  readOnly
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 px-4 text-sm text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                  placeholder="contoh: Kendari"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
              <button onClick={() => {
                setShowAddForm(false);
                setShowEditForm(false);
                setFormData({ name: '', district: 'PT PLN Nusantara Power UP Kendari' });
                
                // Scroll to the top when closing the form
                setTimeout(() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 100);
              }} className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-sm transition-colors">Batal</button>
              <button onClick={showEditForm ? handleEditUnit : handleAddUnit} className="px-8 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all transform active:scale-95">Simpan Perubahan</button>
            </div>
          </div>
        )}

        {/* --- DATA LIST --- */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
            <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Building className="h-5 w-5 text-amber-600" /> Daftar Unit
            </h2>
            <span className="text-xs font-bold px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 shadow-sm">
              Total: {filteredUnits.length}
            </span>
          </div>

          {/* VIEW 1: DESKTOP TABLE */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500 tracking-wider border-b border-slate-200">
                <tr>
                  {isSelectionMode && (
                    <th className="px-6 py-4 w-12">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={currentData.length > 0 && selectedUnits.length === currentData.length}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500"
                        />
                      </div>
                    </th>
                  )}
                  <th className="px-6 py-4">Nama Unit</th>
                  <th className="px-6 py-4">Distrik</th>
                  <th className="px-6 py-4">Dibuat Pada</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {currentData.map((unit: any) => (
                  <tr key={unit.id} className="hover:bg-amber-50/30 transition-colors group">
                    {isSelectionMode && (
                      <td className="px-6 py-4 w-12">
                        <input
                          type="checkbox"
                          checked={selectedUnits.includes(unit.id)}
                          onChange={() => toggleUnitSelection(unit.id)}
                          className="h-4 w-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-3">
                       <div className="p-2 bg-slate-100 rounded-lg text-slate-500 border border-slate-200 group-hover:border-amber-200 group-hover:bg-white group-hover:text-amber-600 transition-colors">
                          <Building size={18} />
                       </div>
                       {unit.name}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className='flex items-center gap-2 bg-slate-50 px-2 py-1 rounded w-fit border border-slate-100 text-xs font-medium'>
                          <MapPin className="h-3 w-3 text-slate-400" /> {unit.district}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 tabular-nums font-medium">
                      {new Date(unit.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => startEditUnit(unit)} className="p-2 bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-slate-400 transition-all shadow-sm" title="Edit">
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDeleteUnit(unit)} className="p-2 bg-white border border-slate-200 hover:border-red-300 hover:text-red-600 hover:bg-red-50 rounded-lg text-slate-400 transition-all shadow-sm" title="Delete">
                          <Trash2 className="h-4 w-4" />
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
            {currentData.map((unit: any) => (
              <div key={unit.id} className="p-5 bg-white hover:bg-slate-50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-start gap-4">
                    {/* Checkbox - only show in selection mode */}
                    {isSelectionMode && (
                      <div className="flex items-start pt-1">
                        <input
                          type="checkbox"
                          checked={selectedUnits.includes(unit.id)}
                          onChange={() => toggleUnitSelection(unit.id)}
                          className="h-4 w-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500 mt-0.5"
                        />
                      </div>
                    )}

                    <div className="p-3 bg-amber-50 rounded-xl text-amber-600 border border-amber-100 mt-0.5 shadow-sm">
                      <Building size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{unit.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mt-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-100 w-fit">
                        <MapPin className="h-3 w-3" /> {unit.district}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                    <Calendar className="h-3 w-3" />
                    {new Date(unit.created_at).toLocaleDateString('id-ID')}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => startEditUnit(unit)} className="text-xs font-bold text-blue-600 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                      <Edit3 size={14} /> Edit
                    </button>
                    <button onClick={() => handleDeleteUnit(unit)} className="text-xs font-bold text-red-600 flex items-center gap-1 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">
                      <Trash2 size={14} /> Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredUnits.length === 0 && (
            <div className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4 text-slate-400 border border-slate-200">
                  <Search size={32} />
              </div>
              <h3 className="text-slate-900 font-bold text-lg mb-1">Tidak ada unit ditemukan</h3>
              <p className="text-sm text-slate-500 font-medium">Coba sesuaikan pencarian Anda.</p>
            </div>
          )}

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="p-5 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Halaman {currentPage} dari {totalPages}
              </span>
              <div className="flex flex-wrap justify-center gap-1">
                {/* Previous button */}
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  &lt;
                </button>

                {/* Page numbers */}
                {(() => {
                  const pages = [];
                  const maxVisiblePages = 5; // Maximum number of page buttons to show

                  // Calculate the range of pages to show
                  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                  // Adjust startPage if we're near the end
                  if (endPage - startPage + 1 < maxVisiblePages) {
                    startPage = Math.max(1, endPage - maxVisiblePages + 1);
                  }

                  // Add first page and ellipsis if needed
                  if (startPage > 1) {
                    pages.push(
                      <button
                        key={1}
                        onClick={() => setCurrentPage(1)}
                        className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors shadow-sm ${
                          currentPage === 1
                            ? 'bg-amber-500 border border-amber-600 text-white'
                            : 'bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 text-slate-600'
                        }`}
                      >
                        1
                      </button>
                    );
                    if (startPage > 2) {
                      pages.push(
                        <span key="ellipsis-start" className="px-3 py-2 text-xs font-bold text-slate-400">
                          ...
                        </span>
                      );
                    }
                  }

                  // Add visible pages
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors shadow-sm ${
                          currentPage === i
                            ? 'bg-amber-500 border border-amber-600 text-white'
                            : 'bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 text-slate-600'
                        }`}
                      >
                        {i}
                      </button>
                    );
                  }

                  // Add last page and ellipsis if needed
                  if (endPage < totalPages) {
                    if (endPage < totalPages - 1) {
                      pages.push(
                        <span key="ellipsis-end" className="px-3 py-2 text-xs font-bold text-slate-400">
                          ...
                        </span>
                      );
                    }
                    pages.push(
                      <button
                        key={totalPages}
                        onClick={() => setCurrentPage(totalPages)}
                        className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors shadow-sm ${
                          currentPage === totalPages
                            ? 'bg-amber-500 border border-amber-600 text-white'
                            : 'bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 text-slate-600'
                        }`}
                      >
                        {totalPages}
                      </button>
                    );
                  }

                  return pages;
                })()}

                {/* Next button */}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="px-3 py-2 text-xs font-bold bg-amber-500 border border-amber-600 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                >
                  &gt;
                </button>
              </div>
            </div>
          )}

          {/* Confirmation Dialog (Modal) */}
          {isDeleteConfirmationOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl scale-100 transform transition-all">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-red-100 rounded-full text-red-600">
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Konfirmasi Hapus</h3>
                </div>

                <p className="text-slate-600 mb-6 text-sm leading-relaxed font-medium">
                  {deletingUnitId
                    ? `Apakah Anda yakin ingin menghapus unit ini?`
                    : `Apakah Anda yakin ingin menghapus ${selectedUnits.length} unit yang dipilih?`}
                  <br/><span className="text-red-600 text-xs mt-1 block">Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait.</span>
                </p>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setIsDeleteConfirmationOpen(false)}
                    className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-sm transition-colors border border-slate-300"
                  >
                    Batal
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-colors shadow-md hover:shadow-lg"
                  >
                    Hapus Unit
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Dialog (Modal) */}
      {deleteError && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl scale-100 transform transition-all">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-full text-red-600">
                    <AlertTriangle className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Gagal Menghapus Unit</h3>
            </div>

            <p className="text-slate-600 mb-6 text-sm leading-relaxed font-medium">
              {deleteError.includes('locations associated')
                ? 'Tidak dapat menghapus unit karena terdapat lokasi yang terkait dengan unit ini.'
                : deleteError}
              <br/><span className="text-red-600 text-xs mt-1 block">Harap hapus lokasi terkait terlebih dahulu sebelum menghapus unit ini.</span>
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteError(null)}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition-colors shadow-md hover:shadow-lg"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}