'use client';

import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Download,
  Printer,
  ChevronDown,
  Check,
  ImageIcon,
  Eye,
  Filter,
  Search,
  RotateCcw,
  Calendar,
  MoreHorizontal,
  FileText,
  Trash2,
  Square,
  CheckSquare
} from "lucide-react";
import ReportDetailsModal from '@/components/report-details-modal';
import ConfirmationDialog from '@/components/confirmation-dialog';

// Custom Multi-Select Component (Light Mode)
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
            {options.length === 0 && (
              <div className="px-3 py-4 text-sm text-slate-500 text-center">No options available</div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default function ReportManagementPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [allUnits, setAllUnits] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [allLocations, setAllLocations] = useState<any[]>([]);
  const [filteredReports, setFilteredReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs to hold current filter values
  const searchTermRef = useRef(searchTerm);
  const selectedUnitsRef = useRef(selectedUnits);
  const selectedCategoriesRef = useRef(selectedCategories);
  const selectedLocationsRef = useRef(selectedLocations);
  const startDateRef = useRef(startDate);
  const endDateRef = useRef(endDate);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReports, setTotalReports] = useState(0);
  const itemsPerPage = 10;

  const [filterTrigger, setFilterTrigger] = useState(0);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // Selection state
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Storage usage state
  const [storageUsage, setStorageUsage] = useState<{
    currentUsage: string;
    maxUsage: string;
    percentageUsed: number;
    currentFilesCount: number;
  } | null>(null);

  // Update refs when state changes
  useEffect(() => {
    searchTermRef.current = searchTerm;
  }, [searchTerm]);

  useEffect(() => {
    selectedUnitsRef.current = selectedUnits;
  }, [selectedUnits]);

  useEffect(() => {
    selectedCategoriesRef.current = selectedCategories;
  }, [selectedCategories]);

  useEffect(() => {
    selectedLocationsRef.current = selectedLocations;
  }, [selectedLocations]);

  useEffect(() => {
    startDateRef.current = startDate;
  }, [startDate]);

  useEffect(() => {
    endDateRef.current = endDate;
  }, [endDate]);

  // Initial data load on component mount
  useEffect(() => {
    setFilterTrigger(prev => prev + 1); // Trigger initial load
  }, []);

  // --- FETCHING LOGIC ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: itemsPerPage.toString()
        });

        // Use ref values instead of state values
        if (startDateRef.current) params.append('startDate', startDateRef.current);
        if (endDateRef.current) params.append('endDate', endDateRef.current);
        if (searchTermRef.current) params.append('search', searchTermRef.current);
        if (selectedUnitsRef.current.length > 0) params.append('units', selectedUnitsRef.current.join(','));
        if (selectedCategoriesRef.current.length > 0) params.append('categories', selectedCategoriesRef.current.join(','));
        if (selectedLocationsRef.current.length > 0) params.append('locations', selectedLocationsRef.current.join(','));

        const response = await fetch(`/api/admin/reports?${params.toString()}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();

        setReports(result.reports || []);
        setFilteredReports(result.reports || []);
        setTotalReports(result.pagination?.totalReports || 0);
        setTotalPages(result.pagination?.totalPages || 1);

        // Fetch additional data (units, categories, locations) in parallel
        const [unitsResponse, categoriesResponse, locationsResponse] = await Promise.allSettled([
          fetch('/api/admin/units'),
          fetch('/api/admin/categories'),
          fetch('/api/admin/locations')
        ]);

        if (unitsResponse.status === 'fulfilled' && unitsResponse.value.ok) {
          setAllUnits(await unitsResponse.value.json());
        }

        if (categoriesResponse.status === 'fulfilled' && categoriesResponse.value.ok) {
          setAllCategories(await categoriesResponse.value.json());
        }

        if (locationsResponse.status === 'fulfilled' && locationsResponse.value.ok) {
          setAllLocations(await locationsResponse.value.json());
        }

      } catch (err) {
        console.error(err);
        setError('Failed to load reports');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentPage, filterTrigger]); // Only re-run when currentPage or filterTrigger changes (filters applied)

  // --- HANDLERS ---
  const handleApplyFilters = () => {
    setCurrentPage(1);
    setFilterTrigger(prev => prev + 1);
    setIsFilterExpanded(false);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedUnits([]);
    setSelectedCategories([]);
    setSelectedLocations([]);
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
    setFilterTrigger(prev => prev + 1);
  };

  const handleViewReport = (report: any) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const handleExport = () => {
    if (reports.length === 0) return alert("Tidak ada data laporan untuk diexport.");

    const dataToExport = reports.map(report => ({
      "Tanggal": new Date(report.capturedAt).toLocaleDateString('id-ID'),
      "Waktu": new Date(report.capturedAt).toLocaleTimeString('id-ID'),
      "Nama Petugas": report.user?.fullName || 'N/A',
      "Unit": report.unit?.name || 'N/A',
      "Kategori": report.category?.name || 'N/A',
      "Lokasi": report.location?.name || '-',
      "Catatan": report.notes || '-',
      "Link Foto": report.imagePath || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reports");
    XLSX.writeFile(workbook, `Reports_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  // Selection handlers
  const toggleReportSelection = (reportId: string) => {
    setSelectedReports(prev =>
      prev.includes(reportId)
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedReports.length === reports.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(reports.map(report => report.id));
    }
  };

  const handleDeleteSingleReport = (reportId: string) => {
    setDeletingReportId(reportId);
    setIsDeleteConfirmationOpen(true);
  };

  const handleDeleteMultipleReports = () => {
    if (selectedReports.length > 0) {
      setIsDeleteConfirmationOpen(true);
    }
  };

  const handleDeleteAllReports = () => {
    if (reports.length > 0) {
      setSelectedReports(reports.map(report => report.id));
      setIsDeleteConfirmationOpen(true);
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (!isSelectionMode) {
      setSelectedReports([]); // Clear selections when entering selection mode
    }
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedReports([]);
  };

  const confirmDelete = async () => {
    try {
      if (deletingReportId) {
        // Delete single report
        const response = await fetch(`/api/admin/reports/${deletingReportId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete report');
        }

        // Update local state to remove the deleted report
        setReports(prev => prev.filter(report => report.id !== deletingReportId));
        setFilteredReports(prev => prev.filter(report => report.id !== deletingReportId));
        setTotalReports(prev => prev - 1);
        setDeletingReportId(null);
      } else if (selectedReports.length > 0) {
        // Delete multiple reports
        const response = await fetch('/api/admin/reports/bulk', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reportIds: selectedReports }),
        });

        if (!response.ok) {
          throw new Error('Failed to delete reports');
        }

        // Update local state to remove the deleted reports
        setReports(prev => prev.filter(report => !selectedReports.includes(report.id)));
        setFilteredReports(prev => prev.filter(report => !selectedReports.includes(report.id)));
        setTotalReports(prev => prev - selectedReports.length);
        setSelectedReports([]);
      }

      setIsDeleteConfirmationOpen(false);
    } catch (error) {
      console.error('Error deleting report(s):', error);
      alert('Failed to delete report(s)');
      setIsDeleteConfirmationOpen(false);
    }
  };

  // --- RENDER HELPERS ---
  const CategoryBadge = ({ category }: { category: any }) => {
    if (!category) return null;
    let style = 'bg-slate-100 text-slate-600 border-slate-200';
    
    if (category.color === 'red' || category.name.toLowerCase().includes('action')) 
        style = 'bg-red-50 text-red-600 border-red-200';
    else if (category.color === 'yellow' || category.name.toLowerCase().includes('condition')) 
        style = 'bg-amber-50 text-amber-600 border-amber-200';
    else if (category.color === 'green') 
        style = 'bg-emerald-50 text-emerald-600 border-emerald-200';

    return <span className={`px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold uppercase tracking-wider border ${style}`}>{category.name}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-amber-500 border-r-transparent mb-4"></div>
          <p className="font-medium text-slate-500">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <div className="text-center p-8 bg-white border border-red-200 rounded-2xl shadow-lg max-w-md">
          <h2 className="text-xl font-bold mb-2 text-slate-900">Error Loading Reports</h2>
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
        
        {/* Header - Sticky & Responsive */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md px-6 py-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Manajemen Laporan</h1>
              <p className="text-xs font-medium text-slate-500 hidden sm:block mt-1">Kelola dan analisis laporan keamanan</p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 self-end sm:self-auto">
              {/* Storage Usage Indicator */}
              {storageUsage && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <div className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200 shadow-sm">
                    Penyimpanan: {storageUsage.currentUsage} / {storageUsage.maxUsage}
                  </div>
                  <div className="w-full sm:w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        storageUsage.percentageUsed > 90
                          ? 'bg-red-500'
                          : storageUsage.percentageUsed > 75
                            ? 'bg-amber-500'
                            : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(storageUsage.percentageUsed, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                {isSelectionMode ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-700">
                      {selectedReports.length} dipilih
                    </span>
                    <button
                      onClick={handleDeleteMultipleReports}
                      className="flex items-center gap-1 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors shadow-sm"
                      disabled={selectedReports.length === 0}
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
                    onClick={handleDeleteAllReports}
                    className="flex items-center gap-1 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors shadow-sm"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Hapus Semua</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-y-auto">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className="w-full md:hidden flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl mb-4 text-sm font-bold text-slate-700 shadow-sm"
          >
            <span className="flex items-center gap-2"><Filter className="h-4 w-4 text-amber-600" /> Filter</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isFilterExpanded ? 'rotate-180' : ''}`} />
          </button>

          {/* Filters Area - Light Mode */}
          <div className={`${isFilterExpanded ? 'block' : 'hidden'} md:block bg-white border border-slate-200 rounded-2xl p-6 mb-8 shadow-sm transition-all`}>
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Filter className="h-4 w-4 text-amber-600" /> Opsi Filter
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-5">
              
              {/* Search */}
              <div className="col-span-1 sm:col-span-2 xl:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Cari</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cari petugas, catatan..."
                    className="w-full bg-white border border-slate-300 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                </div>
              </div>

              {/* Units */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Unit</label>
                <MultiSelectDropdown options={allUnits} selected={selectedUnits} onChange={setSelectedUnits} placeholder="Semua Unit" />
              </div>

              {/* Categories */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Kategori</label>
                <MultiSelectDropdown options={allCategories} selected={selectedCategories} onChange={setSelectedCategories} placeholder="Semua Kategori" />
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Tanggal Mulai</label>
                <input
                  type="date"
                  className="w-full bg-white border border-slate-300 rounded-xl py-2.5 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Tanggal Akhir</label>
                <input
                  type="date"
                  className="w-full bg-white border border-slate-300 rounded-xl py-2.5 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div className="col-span-1 sm:col-span-2 xl:col-span-6 flex flex-col sm:flex-row justify-end gap-3 mt-4 sm:mt-0 pt-4 border-t border-slate-100 xl:border-0 xl:pt-0">
                <button onClick={handleResetFilters} className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:border-slate-300 rounded-xl transition-colors flex items-center justify-center gap-2">
                  <RotateCcw className="h-4 w-4" /> Atur Ulang
                </button>
                <button onClick={handleApplyFilters} className="px-8 py-2.5 text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                  <Filter className="h-4 w-4" /> Terapkan Filter
                </button>
              </div>
            </div>
          </div>

          {/* Reports Content */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-amber-600" /> Daftar Laporan
              </h2>
              <span className="text-xs font-bold px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 shadow-sm">Total: {totalReports}</span>
            </div>

            {/* Desktop View (Table) - Light Mode */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500 tracking-wider border-b border-slate-200">
                  <tr>
                    {isSelectionMode && (
                      <th className="px-6 py-4 w-12">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={reports.length > 0 && selectedReports.length === reports.length}
                            onChange={toggleSelectAll}
                            className="h-4 w-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500"
                          />
                        </div>
                      </th>
                    )}
                    <th className="px-6 py-4">Bukti</th>
                    <th className="px-6 py-4">Detail</th>
                    <th className="px-6 py-4">Kategori</th>
                    <th className="px-6 py-4">Lokasi</th>
                    <th className="px-6 py-4">Tanggal/Waktu</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-amber-50/30 transition-colors group">
                      {isSelectionMode && (
                        <td className="px-6 py-4 w-12">
                          <input
                            type="checkbox"
                            checked={selectedReports.includes(report.id)}
                            onChange={() => toggleReportSelection(report.id)}
                            className="h-4 w-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500"
                          />
                        </td>
                      )}
                      <td className="px-6 py-4 w-24">
                        <div className="h-14 w-20 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 relative shadow-sm">
                          {report.imagePath ? (
                            <img src={report.imagePath} alt="Evd" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-slate-400"><ImageIcon size={20} /></div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{report.user?.fullName || 'Unknown'}</div>
                        <div className="text-xs font-medium text-slate-500 mt-0.5">{report.unit?.name || 'Unknown Unit'}</div>
                      </td>
                      <td className="px-6 py-4"><CategoryBadge category={report.category} /></td>
                      <td className="px-6 py-4">
                          <span className="font-medium text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-200 text-xs">
                              {report.location?.name || '-'}
                          </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{new Date(report.capturedAt).toLocaleDateString('en-GB')}</span>
                          <span className="text-xs text-slate-500 mt-0.5">{new Date(report.capturedAt).toLocaleTimeString('en-GB')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDeleteSingleReport(report.id)}
                            className="p-2 bg-white border border-red-200 hover:border-red-300 hover:text-red-600 hover:bg-red-50 rounded-lg text-slate-400 transition-all shadow-sm"
                          >
                            <Trash2 size={18} />
                          </button>
                          <button onClick={() => handleViewReport(report)} className="p-2 bg-white border border-slate-200 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50 rounded-lg text-slate-400 transition-all shadow-sm">
                            <Eye size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View (Cards) - Light Mode */}
            <div className="md:hidden divide-y divide-slate-100">
              {reports.map((report) => (
                <div key={report.id} className="p-5">
                  <div className="flex gap-4">
                    {/* Checkbox - only show in selection mode */}
                    {isSelectionMode && (
                      <div className="flex items-start pt-1">
                        <input
                          type="checkbox"
                          checked={selectedReports.includes(report.id)}
                          onChange={() => toggleReportSelection(report.id)}
                          className="h-4 w-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500 mt-0.5"
                        />
                      </div>
                    )}

                    {/* Image */}
                    <div className="h-20 w-20 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0 shadow-sm">
                       {report.imagePath ? (
                        <img src={report.imagePath} alt="Evd" className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-slate-400"><ImageIcon size={24} /></div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-sm text-slate-900 truncate pr-2">{report.user?.fullName}</h3>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 whitespace-nowrap">
                            {new Date(report.capturedAt).toLocaleDateString('en-GB')}
                        </span>
                      </div>

                      <div className="text-xs font-medium text-slate-500 mb-2 truncate flex items-center gap-1">
                          <span className="text-amber-700">{report.unit?.name}</span> • {report.location?.name}
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <CategoryBadge category={report.category} />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeleteSingleReport(report.id)}
                            className="text-xs text-red-600 font-bold flex items-center gap-1 bg-red-50 px-2 py-1 rounded-md"
                          >
                            <Trash2 size={12} /> Hapus
                          </button>
                          <button
                            onClick={() => handleViewReport(report)}
                            className="text-xs text-amber-600 font-bold flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-md"
                          >
                            Detail <MoreHorizontal size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {reports.length === 0 && (
              <div className="p-16 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4 text-slate-400 border border-slate-200">
                  <Search size={32} />
                </div>
                <h3 className="text-slate-900 font-bold text-lg mb-1">No reports found</h3>
                <p className="text-sm text-slate-500 font-medium">Try adjusting your filters or search terms.</p>
              </div>
            )}

            {/* Footer Pagination */}
            {totalPages > 1 && (
              <div className="p-5 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Page {currentPage} of {totalPages}</span>
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
          </div>
        </div>
      </div>

      {isModalOpen && selectedReport && (
        <ReportDetailsModal
          report={selectedReport}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteConfirmationOpen}
        onClose={() => {
          setIsDeleteConfirmationOpen(false);
          setDeletingReportId(null);
        }}
        onConfirm={confirmDelete}
        title={
          deletingReportId
            ? "Hapus Laporan?"
            : selectedReports.length === reports.length
              ? "Hapus Semua Laporan?"
              : "Hapus Laporan Terpilih?"
        }
        message={
          deletingReportId
            ? "Apakah Anda yakin ingin menghapus laporan ini? Tindakan ini tidak dapat dibatalkan. Foto terkait juga akan dihapus dari penyimpanan."
            : selectedReports.length === reports.length
              ? `Apakah Anda yakin ingin menghapus semua ${selectedReports.length} laporan? Tindakan ini tidak dapat dibatalkan. Foto terkait juga akan dihapus dari penyimpanan.`
              : `Apakah Anda yakin ingin menghapus ${selectedReports.length} laporan terpilih? Tindakan ini tidak dapat dibatalkan. Foto terkait juga akan dihapus dari penyimpanan.`
        }
        confirmText="Ya, hapus"
        cancelText="Batal"
        variant="danger"
      />
    </>
  );
}