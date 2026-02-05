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
  ArrowRight
} from "lucide-react";

export default function ManageUnitsPage() {
  const [allUnits, setAllUnits] = useState<any[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any>(null);
  
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
    const name = (document.getElementById('unit-name') as HTMLInputElement)?.value;
    const district = (document.getElementById('unit-district') as HTMLInputElement)?.value;
    if (!name || !district) return alert('Please fill in all fields');

    try {
      const response = await fetch('/api/admin/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, district }),
      });
      if (!response.ok) throw new Error(`HTTP error!`);
      
      setShowAddForm(false);
      setCurrentPage(1);
      fetchUnits();
    } catch (err) { alert('Failed to add unit'); }
  };

  const handleEditUnit = async () => {
    const name = (document.getElementById('edit-unit-name') as HTMLInputElement)?.value;
    const district = (document.getElementById('edit-unit-district') as HTMLInputElement)?.value;
    if (!name || !district || !editingUnit) return alert('Please fill in all fields');

    try {
      const response = await fetch('/api/admin/units', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingUnit.id, name, district }),
      });
      if (!response.ok) throw new Error(`HTTP error!`);

      setShowEditForm(false);
      setEditingUnit(null);
      fetchUnits();
    } catch (err) { alert('Failed to update unit'); }
  };

  const handleDeleteUnit = async (unit: any) => {
    if (!window.confirm(`Delete unit "${unit.name}"?`)) return;
    try {
      const response = await fetch('/api/admin/units', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: unit.id }),
      });
      if (!response.ok) throw new Error(`HTTP error!`);
      fetchUnits();
    } catch (err) { alert('Failed to delete unit'); }
  };

  const startEditUnit = (unit: any) => {
    setEditingUnit(unit);
    setShowEditForm(true);
    setShowAddForm(false);
    setTimeout(() => {
      const nameInput = document.getElementById('edit-unit-name') as HTMLInputElement;
      const districtInput = document.getElementById('edit-unit-district') as HTMLInputElement;
      if (nameInput) nameInput.value = unit.name;
      if (districtInput) districtInput.value = unit.district;
    }, 50);
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
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <button onClick={handleExport} className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs sm:text-sm font-bold hover:bg-emerald-100 transition-colors shadow-sm">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Ekspor ke Excel</span>
              <span className="sm:hidden">Ekspor</span>
            </button>
            <button
              onClick={() => { setShowAddForm(true); setShowEditForm(false); }}
              className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors shadow-md hover:shadow-lg"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Unit</span>
            </button>
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
                <input id={showEditForm ? "edit-unit-name" : "unit-name"} type="text" className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 px-4 text-sm text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all" placeholder="contoh: Unit Pembangkit" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Wilayah</label>
                <input id={showEditForm ? "edit-unit-district" : "unit-district"} type="text" className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2.5 px-4 text-sm text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all" placeholder="contoh: Kendari" value="PT PLN Nusantara Power UP Kendari"/>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
              <button onClick={() => { setShowAddForm(false); setShowEditForm(false); }} className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-sm transition-colors">Batal</button>
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
                  <th className="px-6 py-4">Nama Unit</th>
                  <th className="px-6 py-4">Distrik</th>
                  <th className="px-6 py-4">Dibuat Pada</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {currentData.map((unit: any) => (
                  <tr key={unit.id} className="hover:bg-amber-50/30 transition-colors group">
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
                        <button onClick={() => startEditUnit(unit)} className="p-2 bg-white border border-slate-200 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50 rounded-lg text-slate-400 transition-all shadow-sm" title="Edit">
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
                    <button onClick={() => startEditUnit(unit)} className="text-xs font-bold text-amber-600 flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors">
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
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-4 py-2 text-xs font-bold bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  Sebelumnya
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="px-4 py-2 text-xs font-bold bg-amber-500 border border-amber-600 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                >
                  Berikutnya
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}