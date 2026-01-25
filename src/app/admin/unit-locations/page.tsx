'use client';

import { useState, useEffect } from 'react';
// 1. IMPORT XLSX
import * as XLSX from 'xlsx';
import { Search, Filter, Download, Printer, Plus, Edit3, Trash2, MapPin, ChevronDown, Check } from "lucide-react";
import AdminSidebar from '@/components/admin-sidebar';

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

export default function ManageUnitLocationsPage() {
  const [locations, setLocations] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [filterTrigger, setFilterTrigger] = useState(0);

  // Form States (Controlled Inputs)
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<any>(null);
  
  // Add/Edit Form Data
  const [formData, setFormData] = useState({ name: '', unit_id: '' });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // FETCH DATA
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams({
          search: searchTerm,
          units: selectedUnits.join(','),
        });

        const response = await fetch(`/api/admin/unit-locations?${queryParams}`);
        if (!response.ok) throw new Error('Failed to fetch data');

        const data = await response.json();
        setLocations(data.locations || []);
        setUnits(data.units || []);
      } catch (err) {
        console.error(err);
        setError('Failed to load locations and units');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filterTrigger]);

  // HANDLERS
  const handleApplyFilters = () => setFilterTrigger(prev => prev + 1);
  
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedUnits([]);
    setFilterTrigger(prev => prev + 1);
  };

  const handleSaveLocation = async (isEdit: boolean) => {
    if (!formData.name || !formData.unit_id) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const method = isEdit ? 'PUT' : 'POST';
      const body = isEdit ? { ...formData, id: editingLocation.id } : formData;

      const response = await fetch('/api/admin/unit-locations', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save location');
      }

      // Refresh data
      setFilterTrigger(prev => prev + 1);
      
      // Reset & Close
      setShowAddForm(false);
      setShowEditForm(false);
      setFormData({ name: '', unit_id: '' });
      setEditingLocation(null);
    } catch (err: any) {
      alert(err.message || 'Error saving location');
    }
  };

  const handleDeleteLocation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return;
    try {
      const response = await fetch('/api/admin/unit-locations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete location');
      }
      
      setFilterTrigger(prev => prev + 1);
    } catch (err: any) {
      alert(err.message || 'Failed to delete location');
    }
  };

  const startEdit = (loc: any) => {
    setEditingLocation(loc);
    setFormData({ name: loc.name, unit_id: loc.unit_id });
    setShowEditForm(true);
    setShowAddForm(false);
  };

  // 2. EXPORT FUNCTION LOGIC
  const handleExport = () => {
    if (locations.length === 0) {
      alert("Tidak ada data lokasi unit untuk diexport.");
      return;
    }

    // Mapping data agar sesuai dengan kolom Excel yang diinginkan
    const dataToExport = locations.map(location => ({
      "Nama Lokasi": location.name || 'N/A',
      "Unit": location.units?.name || 'N/A',
      "Tanggal Dibuat": new Date(location.created_at).toLocaleString('id-ID'),
      "ID Lokasi": location.id,
      "ID Unit": location.unit_id
    }));

    // Membuat Worksheet dan Workbook
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Daftar Lokasi Unit");

    // Auto-width columns (Sedikit styling biar rapi)
    worksheet["!cols"] = [ { wch: 25 }, { wch: 25 }, { wch: 20 }, { wch: 30 }, { wch: 30 } ];

    // Generate file name dengan timestamp
    const timestamp = new Date().toISOString().slice(0,10);
    XLSX.writeFile(workbook, `Daftar_Lokasi_Unit_${timestamp}.xlsx`);
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
    <div className="min-h-screen bg-zinc-950 text-white flex">
      <AdminSidebar />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Manage Unit Locations</h1>
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
              <button
                onClick={() => {
                  setShowAddForm(true);
                  setShowEditForm(false);
                  setFormData({ name: '', unit_id: '' });
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors"
              >
                <Plus className="h-4 w-4" /> Add Location
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-y-auto">
          
          {/* FILTER SECTION */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              {/* Search */}
              <div className="md:col-span-2">
                <label className="block text-sm text-zinc-400 mb-2">Search Location</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name..."
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
                  options={units}
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

          {/* ADD/EDIT FORM SECTION */}
          {(showAddForm || showEditForm) && (
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6 mb-6">
              <h3 className="font-bold text-white mb-4">{showEditForm ? 'Edit Location' : 'Add New Location'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm text-zinc-400 mb-1">Location Name</label>
                   <input 
                     type="text" 
                     className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white"
                     value={formData.name}
                     onChange={(e) => setFormData({...formData, name: e.target.value})}
                   />
                </div>
                <div>
                   <label className="block text-sm text-zinc-400 mb-1">Unit</label>
                   <select 
                     className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-white"
                     value={formData.unit_id}
                     onChange={(e) => setFormData({...formData, unit_id: e.target.value})}
                   >
                     <option value="">Select Unit...</option>
                     {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                   </select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => handleSaveLocation(showEditForm)} className="px-4 py-2 bg-blue-600 rounded-lg text-sm">Save</button>
                <button onClick={() => { setShowAddForm(false); setShowEditForm(false); }} className="px-4 py-2 bg-zinc-700 rounded-lg text-sm">Cancel</button>
              </div>
            </div>
          )}

          {/* TABLE SECTION */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4">Locations List</h2>
            {loading ? (
               <div className="text-center py-10 text-zinc-500">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800 text-left text-sm text-zinc-400">
                      <th className="pb-3 pl-2">Location Name</th>
                      <th className="pb-3">Unit</th>
                      <th className="pb-3">Created At</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {locations.map((loc: any) => (
                      <tr key={loc.id} className="text-sm hover:bg-zinc-800/50 transition-colors">
                        <td className="py-3 pl-2 font-medium text-white flex items-center gap-2">
                           <MapPin className="h-4 w-4 text-blue-400" />
                           {loc.name}
                        </td>
                        <td className="py-3 text-zinc-300">{loc.units?.name || '-'}</td>
                        <td className="py-3 text-zinc-300">{new Date(loc.created_at).toLocaleDateString()}</td>
                        <td className="py-3 flex gap-2">
                          <button onClick={() => startEdit(loc)} className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                            <Edit3 className="h-4 w-4" /> Edit
                          </button>
                          <button onClick={() => handleDeleteLocation(loc.id)} className="text-red-400 hover:text-red-300 flex items-center gap-1">
                            <Trash2 className="h-4 w-4" /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {locations.length === 0 && (
                      <tr><td colSpan={4} className="py-8 text-center text-zinc-500">No locations found.</td></tr>
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