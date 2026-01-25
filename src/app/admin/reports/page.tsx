'use client';

import { useState, useEffect } from 'react';
// 1. IMPORT XLSX
import * as XLSX from 'xlsx';
import { Activity, Map, Users, AlertTriangle, CircleGauge, Clock, Shield, Eye, Search, Filter, FileText, Building, User, Download, Printer, ChevronDown, Check, ImageIcon } from "lucide-react";
import ReportDetailsModal from '@/components/report-details-modal';
import AdminSidebar from '@/components/admin-sidebar';

// Custom Multi-Select Component
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

export default function ReportManagementPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [allUnits, setAllUnits] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [allLocations, setAllLocations] = useState<any[]>([]); // New State for Options
  const [filteredReports, setFilteredReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  // 1. CHANGE STATE TO ARRAYS
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]); // New State for Filter
  // PERUBAHAN 1: Menggunakan Start Date dan End Date
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. ADD TRIGGER STATE
  const [filterTrigger, setFilterTrigger] = useState(0);

  // 2. UPDATE FETCH LOGIC
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // PERUBAHAN 2: Kirim range tanggal ke API
        const queryParams = new URLSearchParams({
          search: searchTerm,
          startDate: startDate, // Kirim start date
          endDate: endDate,     // Kirim end date
          units: selectedUnits.join(','),
          categories: selectedCategories.join(','),
          locations: selectedLocations.join(',')
        });

        const response = await fetch(`/api/admin/reports?${queryParams}`);
        // ... handle response ...
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setReports(data.reports);
        setAllUnits(data.units);
        setAllCategories(data.categories); // Save categories from API
        setAllLocations(data.locations || []); // Set options
        setFilteredReports(data.reports);
      } catch (err) {
        console.error('Error fetching reports:', err);
        setError('Failed to load reports');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // ONLY RUN ON MOUNT OR WHEN TRIGGER CHANGES
  }, [filterTrigger]); // 3. UPDATE DEPENDENCY

  // 3. HANDLER FUNCTIONS
  const handleApplyFilters = () => {
    setFilterTrigger(prev => prev + 1);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedUnits([]);
    setSelectedCategories([]);
    setSelectedLocations([]);
    // Reset kedua tanggal
    setStartDate('');
    setEndDate('');
    // Trigger fetch after state update (React batches these, so effect sees new state)
    setFilterTrigger(prev => prev + 1);
  };

  const handleViewReport = (report: any) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  // 2. EXPORT FUNCTION LOGIC
  const handleExport = () => {
    if (reports.length === 0) {
      alert("Tidak ada data laporan untuk diexport.");
      return;
    }

    // Mapping data agar sesuai dengan kolom Excel yang diinginkan
    const dataToExport = reports.map(report => ({
      "Tanggal & Waktu": new Date(report.captured_at).toLocaleString('id-ID'),
      "Nama Petugas": report.profiles?.full_name || 'N/A',
      "Unit": report.units?.name || 'N/A',
      "Kategori": report.report_categories?.name || 'N/A',
      "Lokasi Spesifik": report.unit_locations?.name || '-',
      "Catatan Petugas": report.notes || '-', // Mengambil Notes
      "Latitude": report.latitude,
      "Longitude": report.longitude,
      "Link Foto": report.image_path || 'Tidak ada foto',
      "Status": "Completed"
    }));

    // Membuat Worksheet dan Workbook
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Security");

    // Auto-width columns (Sedikit styling biar rapi)
    const max_width = dataToExport.reduce((w, r) => Math.max(w, r["Catatan Petugas"].length), 10);
    worksheet["!cols"] = [ { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: max_width }, { wch: 15 }, { wch: 15 }, { wch: 50 } ];

    // Generate file name dengan timestamp
    const timestamp = new Date().toISOString().slice(0,10);
    XLSX.writeFile(workbook, `Laporan_Security_${timestamp}.xlsx`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p>Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center p-6 bg-zinc-900 border border-zinc-800 rounded-xl max-w-md">
          <h2 className="text-xl font-bold mb-2">Error Loading Reports</h2>
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

  // Prepare units for the dropdown
  const units = [
    { id: 'all', name: 'All Units' },
    ...allUnits
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      {/* Sidebar Navigation */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Report Management</h1>
            <div className="flex items-center gap-4">
              {/* 3. ATTACH EXPORT FUNCTION */}
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
          {/* Filters Area */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">

            {/* PERUBAHAN 3: Grid Layout 6 Kolom agar presisi memenuhi layar */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">

              {/* 1. Search Name */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Search Name</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                </div>
              </div>

              {/* 2. Filter Units */}
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Units</label>
                <MultiSelectDropdown
                  options={allUnits}
                  selected={selectedUnits}
                  onChange={setSelectedUnits}
                  placeholder="Select Units"
                />
              </div>

              {/* 3. Filter Categories */}
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Categories</label>
                <MultiSelectDropdown
                  options={allCategories}
                  selected={selectedCategories}
                  onChange={setSelectedCategories}
                  placeholder="Select Categories"
                />
              </div>

              {/* 4. Start Date */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Start Date</label>
                <input
                  type="date"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              {/* 5. End Date */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">End Date</label>
                <input
                  type="date"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              {/* 6. Buttons (Apply & Reset) */}
              <div className="flex items-center gap-2 h-10"> {/* h-10 agar tinggi sama dengan input */}
                <button
                  onClick={handleApplyFilters}
                  className="flex-1 h-full flex items-center justify-center gap-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                >
                  <Filter className="h-4 w-4" />
                  Apply
                </button>
                <button
                  onClick={handleResetFilters}
                  className="h-full px-4 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg text-sm transition-colors"
                  title="Reset Filters"
                >
                  Reset
                </button>
              </div>

            </div>
          </div>

          {/* Reports Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4">Reports List</h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-800 text-left text-sm text-zinc-400">
                    <th className="pb-3 pl-2">Evidence</th> {/* 1. Ganti Location jadi Evidence */}
                    <th className="pb-3">Officer</th>
                    <th className="pb-3">Unit</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Specific Loc</th>
                    <th className="pb-3">Date/Time</th>
                    {/* HAPUS COLUMN Location */}
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {reports.map((report: any) => (
                    <tr key={report.id} className="text-sm hover:bg-zinc-800/30 transition-colors">
                      {/* 2. Tampilkan Preview Foto */}
                      <td className="py-3 pl-2">
                        <div className="h-10 w-16 bg-zinc-800 rounded-md overflow-hidden border border-zinc-700 flex items-center justify-center">
                          {report.image_path ? (
                            <img
                              src={report.image_path}
                              alt="Evd"
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-zinc-600" />
                          )}
                        </div>
                      </td>
                      <td className="py-3 font-medium text-white">{report.profiles?.full_name || 'N/A'}</td>
                      <td className="py-3 text-zinc-300">{report.units?.name || 'N/A'}</td>
                      <td className="py-3">
                        {report.report_categories && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${(report.report_categories.color === 'red' || report.report_categories.name.toLowerCase().includes('unsafe') || report.report_categories.name.toLowerCase().includes('tidak aman')) ? 'bg-red-500/20 text-red-400' : report.report_categories.color === 'yellow' || report.report_categories.name.toLowerCase().includes('maintenance') ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
                            {report.report_categories.name}
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-zinc-300">{report.unit_locations?.name || '-'}</td>
                      <td className="py-3 text-zinc-300">{new Date(report.captured_at).toLocaleString()}</td>
                      {/* HAPUS CELL Kordinat */}
                      <td className="py-3"><span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-full">Completed</span></td>
                      <td className="py-3"><button onClick={() => handleViewReport(report)} className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm"><Eye className="h-4 w-4" />View</button></td>
                    </tr>
                  ))}

                  {reports.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-zinc-500">No reports found matching your criteria</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Report Details Modal */}
      {isModalOpen && selectedReport && (
        <ReportDetailsModal
          report={selectedReport}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}