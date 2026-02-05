'use client';

import { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  Search, 
  Download, 
  Plus, 
  Edit3, 
  Trash2, 
  MapPin, 
  ChevronDown, 
  Check,
  Calendar,
  Building
} from "lucide-react";

// --- REUSABLE MULTI-SELECT COMPONENT (Updated: Light Border & Amber Check) ---
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
        className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-left text-sm text-slate-900 flex justify-between items-center hover:bg-slate-50 transition-colors shadow-sm"
      >
        <span className="truncate pr-2 font-medium">
          {selected.length ? `${selected.length} Selected` : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
            {options.map((opt: any) => (
              <div
                key={opt.id}
                onClick={() => toggleOption(opt.id)}
                className="px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center gap-3 border-b border-slate-100 last:border-0"
              >
                {/* Checkbox: Amber-500 Color */}
                <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${selected.includes(opt.id) ? 'bg-amber-500 border-amber-500' : 'border-slate-300'}`}>
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

export default function ManageUnitLocationsPage() {
  const [allLocations, setAllLocations] = useState<any[]>([]); 
  const [units, setUnits] = useState<any[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', unitId: '' });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/unit-locations`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      setAllLocations(data || []); 

      const unitsResponse = await fetch('/api/admin/units');
      if (unitsResponse.ok) {
        setUnits(await unitsResponse.json() || []);
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredLocations = useMemo(() => {
    return allLocations.filter(loc => {
      const matchesSearch = loc.name.toLowerCase().includes(searchTerm.toLowerCase());
      const locUnitId = loc.unitId || loc.unit?.id;
      const matchesUnit = selectedUnits.length === 0 || selectedUnits.includes(locUnitId);
      return matchesSearch && matchesUnit;
    });
  }, [allLocations, searchTerm, selectedUnits]);

  const totalPages = Math.ceil(filteredLocations.length / itemsPerPage);
  const currentData = filteredLocations.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedUnits([]);
    setCurrentPage(1);
  };

  const handleSaveLocation = async (isEdit: boolean) => {
    if (!formData.name || !formData.unitId) return alert('Please fill in all fields');
    try {
      const method = isEdit ? 'PUT' : 'POST';
      const body = isEdit ? { ...formData, id: editingLocation.id } : formData;
      const response = await fetch('/api/admin/unit-locations', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error('Failed to save');
      await fetchData(); 
      setShowAddForm(false);
      setShowEditForm(false);
      setFormData({ name: '', unitId: '' });
    } catch (err: any) { alert(err.message); }
  };

  const handleDeleteLocation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return;
    try {
      const response = await fetch('/api/admin/unit-locations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (response.ok) await fetchData();
    } catch (err: any) { alert(err.message); }
  };

  const startEdit = (loc: any) => {
    setEditingLocation(loc);
    setFormData({ name: loc.name, unitId: loc.unitId || loc.unit?.id || "" });
    setShowEditForm(true);
    setShowAddForm(false);
  };

  const handleExport = () => {
    const dataToExport = allLocations.map(loc => ({
      "Nama Lokasi": loc.name,
      "Unit": loc.unit?.name || 'N/A',
      "Tanggal Dibuat": new Date(loc.createdAt).toLocaleDateString()
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lokasi");
    XLSX.writeFile(wb, `Lokasi_SiPatrol.xlsx`);
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-amber-500 border-r-transparent mb-4"></div>
        <p className="font-medium text-slate-500">Loading locations...</p>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col w-full bg-slate-50 text-slate-900 min-h-screen">
      
      {/* --- HEADER (Light Mode) --- */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 py-3 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-slate-900">Kelola Lokasi Unit</h1>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button onClick={handleExport} className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs sm:text-sm font-bold hover:bg-emerald-100 transition-colors shadow-sm">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Ekspor ke Excel</span>
              <span className="sm:hidden">Ekspor</span>
            </button>
            <button
              onClick={() => { setShowAddForm(true); setShowEditForm(false); setFormData({ name: '', unitId: '' }); }}
              className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-700 rounded-lg text-sm font-bold text-white transition-all shadow-md active:scale-95"
            >
              <Plus className="h-4 w-4" /> Tambah Lokasi
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 p-4 sm:p-6 space-y-6">

        {/* --- FILTERS (Sync with Manage Users) --- */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">Cari Lokasi</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div className="md:col-span-5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">Filter Unit</label>
              <MultiSelectDropdown options={units} selected={selectedUnits} onChange={(val: any) => { setSelectedUnits(val); setCurrentPage(1); }} placeholder="Semua Unit" />
            </div>

            <div className="md:col-span-2">
              <button onClick={handleResetFilters} className="w-full py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold rounded-lg text-sm transition-all shadow-sm">
                Atur Ulang
              </button>
            </div>
          </div>
        </div>

        {/* ADD/EDIT FORM - Following the same pattern as units page */}
        {(showAddForm || showEditForm) && (
          <div className="bg-white border border-amber-200 rounded-xl p-5 mb-6 shadow-sm ring-1 ring-amber-100">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-base border-b border-slate-100 pb-3">
              <div className="p-1.5 bg-amber-50 rounded-md text-amber-600">
                 {showEditForm ? <Edit3 className="h-4 w-4"/> : <Plus className="h-4 w-4"/>}
              </div>
              {showEditForm ? 'Edit Detail Lokasi' : 'Tambah Lokasi Baru'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">Nama Lokasi</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-sm text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                  placeholder="Masukkan nama lokasi"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1">Unit</label>
                <select
                  value={formData.unitId}
                  onChange={(e) => setFormData({...formData, unitId: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3 text-sm text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="">Pilih Unit</option>
                  {units.map(unit => (
                    <option key={unit.id} value={unit.id}>{unit.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setShowEditForm(false);
                  setFormData({ name: '', unitId: '' });
                }}
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-lg text-sm transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => handleSaveLocation(showEditForm)}
                className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-sm transition-colors shadow-sm"
              >
                {showEditForm ? 'Perbarui Lokasi' : 'Simpan Lokasi'}
              </button>
            </div>
          </div>
        )}

        {/* --- DATA LIST (Updated: Total Badge & Light Border) --- */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 bg-white flex justify-between items-center">
            <h2 className="font-bold text-slate-800">Daftar Lokasi</h2>
            <span className="text-[10px] font-bold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md border border-slate-200 uppercase tracking-tighter">
              Total: {filteredLocations.length}
            </span>
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Nama Lokasi</th>
                  <th className="px-6 py-4">Unit</th>
                  <th className="px-6 py-4">Dibuat Pada</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-900">
                {currentData.map((loc: any) => (
                  <tr key={loc.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-bold flex items-center gap-3 text-slate-900">
                        <div className="p-2 bg-orange-50 rounded-lg text-orange-500"><MapPin size={16} /></div>
                        {loc.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[11px] font-bold border border-slate-200">{loc.unit?.name || '-'}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 tabular-nums">{new Date(loc.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => startEdit(loc)} className="p-2 bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-slate-400 transition-all shadow-sm"><Edit3 size={16} /></button>
                        <button onClick={() => handleDeleteLocation(loc.id)} className="p-2 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg text-slate-400 hover:text-red-600 transition-all"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE VIEW (Light Version) */}
          <div className="md:hidden divide-y divide-slate-100">
            {currentData.map((loc: any) => (
              <div key={loc.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-orange-50 rounded-xl text-orange-500"><MapPin size={20} /></div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900">{loc.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                       <Building size={12} className="text-slate-400" />
                       <span className="text-xs font-bold text-slate-600">{loc.unit?.name || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredLocations.length === 0 && <div className="p-16 text-center text-slate-400 font-medium">Tidak ada lokasi ditemukan.</div>}
        </div>
      </div>
    </div>
  );
}