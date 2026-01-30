'use client';

import { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Plus, 
  Edit3, 
  Trash2, 
  MapPin, 
  ChevronDown, 
  Check,
  Calendar,
  Building
} from "lucide-react";

// --- REUSABLE MULTI-SELECT COMPONENT (Responsive Width) ---
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
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2.5 px-3 text-left text-sm text-white flex justify-between items-center hover:bg-zinc-750 transition-colors"
      >
        <span className="truncate pr-2">{selected.length ? `${selected.length} Selected` : placeholder}</span>
        <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute z-20 mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
            {options.map((opt: any) => (
              <div
                key={opt.id}
                onClick={() => toggleOption(opt.id)}
                className="px-3 py-2.5 text-sm text-zinc-300 hover:bg-zinc-700 cursor-pointer flex items-center gap-3 border-b border-zinc-700/50 last:border-0"
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${selected.includes(opt.id) ? 'bg-blue-600 border-blue-600' : 'border-zinc-500'}`}>
                  {selected.includes(opt.id) && <Check className="h-3 w-3 text-white" />}
                </div>
                <span className="truncate">{opt.name}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default function ManageUnitLocationsPage() {
  const [allLocations, setAllLocations] = useState<any[]>([]); // Raw Data
  const [units, setUnits] = useState<any[]>([]);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', unitId: '' });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- FETCH DATA ---
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
      console.error(err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- CLIENT-SIDE FILTERING & PAGINATION LOGIC ---
  const filteredLocations = useMemo(() => {
    return allLocations.filter(loc => {
      // 1. Filter by Search Term
      const matchesSearch = loc.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 2. Filter by Selected Units
      const locUnitId = loc.unitId || loc.unit?.id; // Handle naming inconsistencies
      const matchesUnit = selectedUnits.length === 0 || selectedUnits.includes(locUnitId);

      return matchesSearch && matchesUnit;
    });
  }, [allLocations, searchTerm, selectedUnits]);

  // Calculate Pagination based on Filtered Data
  const totalPages = Math.ceil(filteredLocations.length / itemsPerPage);
  const currentData = filteredLocations.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  // --- HANDLERS ---
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

      if (!response.ok) throw new Error((await response.json()).error || 'Failed to save');

      await fetchData(); // Refresh Data
      setShowAddForm(false);
      setShowEditForm(false);
      setFormData({ name: '', unitId: '' });
      setEditingLocation(null);
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
      if (!response.ok) throw new Error('Failed to delete');
      await fetchData();
    } catch (err: any) { alert(err.message); }
  };

  const startEdit = (loc: any) => {
    setEditingLocation(loc);
    const unitId = loc.unitId || loc.unit_id || loc.unit?.id || "";
    setFormData({ name: loc.name, unitId });
    setShowEditForm(true);
    setShowAddForm(false);
  };

  const handleExport = () => {
    if (allLocations.length === 0) return alert("No data");
    const dataToExport = allLocations.map(loc => ({
      "Nama Lokasi": loc.name,
      "Unit": loc.unit?.name || 'N/A',
      "Tanggal Dibuat": new Date(loc.createdAt).toLocaleDateString()
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lokasi");
    XLSX.writeFile(wb, `Lokasi_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p>Loading locations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center p-6 bg-zinc-900 border border-zinc-800 rounded-xl max-w-md">
          <h2 className="text-xl font-bold mb-2">Error Loading Locations</h2>
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
    <div className="flex-1 flex flex-col w-full bg-zinc-950 text-white min-h-screen">
      
      {/* --- HEADER --- */}
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur-md px-4 py-3 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-lg sm:text-xl font-bold">Manage Unit Locations</h1>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button onClick={handleExport} className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs sm:text-sm transition-colors border border-zinc-700">
              <Download className="h-4 w-4" /> Export
            </button>
            <button 
              onClick={() => { setShowAddForm(true); setShowEditForm(false); setFormData({ name: '', unitId: '' }); }}
              className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs sm:text-sm transition-colors shadow-lg shadow-blue-900/20"
            >
              <Plus className="h-4 w-4" /> Add Location
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">

        {/* --- FILTERS --- */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            {/* Search */}
            <div className="md:col-span-5">
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Search Location</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
              </div>
            </div>

            {/* Unit Filter */}
            <div className="md:col-span-5">
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Filter Units</label>
              <MultiSelectDropdown options={units} selected={selectedUnits} onChange={(val: any) => { setSelectedUnits(val); setCurrentPage(1); }} placeholder="All Units" />
            </div>

            {/* Reset Button */}
            <div className="md:col-span-2">
              <button onClick={handleResetFilters} className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors">
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* --- FORM (ADD/EDIT) --- */}
        {(showAddForm || showEditForm) && (
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 sm:p-6 mb-6 animate-in fade-in slide-in-from-top-2">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              {showEditForm ? <Edit3 className="h-4 w-4 text-blue-400"/> : <Plus className="h-4 w-4 text-blue-400"/>}
              {showEditForm ? 'Edit Location' : 'Add New Location'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                 <label className="block text-xs text-zinc-400 mb-1.5">Location Name</label>
                 <input type="text" className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                   value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Lobby Utama"
                 />
              </div>
              <div>
                 <label className="block text-xs text-zinc-400 mb-1.5">Unit</label>
                 <select className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                   value={formData.unitId} onChange={(e) => setFormData({...formData, unitId: e.target.value})}
                 >
                   <option value="">Select Unit...</option>
                   {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                 </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-zinc-700/50">
              <button onClick={() => { setShowAddForm(false); setShowEditForm(false); }} className="px-4 py-2 bg-transparent hover:bg-zinc-700 rounded-lg text-sm text-zinc-300">Cancel</button>
              <button onClick={() => handleSaveLocation(showEditForm)} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white shadow-lg">Save</button>
            </div>
          </div>
        )}

        {/* --- DATA LIST --- */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
            <h2 className="font-semibold text-white">Locations List</h2>
            <span className="text-xs px-2 py-1 bg-zinc-800 rounded border border-zinc-700 text-zinc-400">Total: {filteredLocations.length}</span>
          </div>

          {/* VIEW 1: DESKTOP TABLE (Hidden on Mobile) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-900/50 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-6 py-4">Location Name</th>
                  <th className="px-6 py-4">Unit</th>
                  <th className="px-6 py-4">Created At</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 text-sm">
                {currentData.map((loc: any) => (
                  <tr key={loc.id} className="hover:bg-zinc-800/40 transition-colors group">
                    <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                       <div className="p-1.5 bg-blue-500/10 rounded text-blue-400"><MapPin size={16} /></div>
                       {loc.name}
                    </td>
                    <td className="px-6 py-4 text-zinc-400">{loc.unit?.name || '-'}</td>
                    <td className="px-6 py-4 text-zinc-500 tabular-nums">{new Date(loc.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => startEdit(loc)} className="p-2 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white"><Edit3 size={16} /></button>
                        <button onClick={() => handleDeleteLocation(loc.id)} className="p-2 hover:bg-zinc-700 rounded text-zinc-400 hover:text-red-400"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* VIEW 2: MOBILE CARDS (Visible only on Mobile) */}
          <div className="md:hidden divide-y divide-zinc-800">
            {currentData.map((loc: any) => (
              <div key={loc.id} className="p-4 bg-zinc-900 hover:bg-zinc-800/20 active:bg-zinc-800/40 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-800 rounded-lg text-blue-400 mt-0.5"><MapPin size={18} /></div>
                    <div>
                      <h3 className="font-medium text-white text-base">{loc.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
                        <Building size={12} /> {loc.unit?.name || '-'}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800/50">
                   <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                     <Calendar size={12} /> {new Date(loc.createdAt).toLocaleDateString()}
                   </div>
                   <div className="flex gap-3">
                     <button onClick={() => startEdit(loc)} className="text-xs font-medium text-blue-400 flex items-center gap-1"><Edit3 size={14} /> Edit</button>
                     <button onClick={() => handleDeleteLocation(loc.id)} className="text-xs font-medium text-red-400 flex items-center gap-1"><Trash2 size={14} /> Delete</button>
                   </div>
                </div>
              </div>
            ))}
          </div>

          {filteredLocations.length === 0 && (
             <div className="p-12 text-center text-zinc-500 text-sm">No locations found.</div>
          )}

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-zinc-800 bg-zinc-900 flex flex-col sm:flex-row justify-between items-center gap-4">
              <span className="text-xs text-zinc-500">Page {currentPage} of {totalPages}</span>
              <div className="flex gap-2">
                <button 
                  disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  className="px-3 py-1.5 text-xs bg-zinc-800 border border-zinc-700 rounded hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white"
                >Previous</button>
                <button 
                  disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >Next</button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}