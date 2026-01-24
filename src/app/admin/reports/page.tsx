'use client';

import { useState, useEffect } from 'react';
import { Activity, Map, Users, AlertTriangle, CircleGauge, Clock, Shield, Eye, Search, Filter, FileText, Building, User, Download, Printer, ChevronDown, Check } from "lucide-react";
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
  // 2. ADD DATE STATE
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. ADD TRIGGER STATE
  const [filterTrigger, setFilterTrigger] = useState(0);

  // 2. UPDATE FETCH LOGIC
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Add date param to URL
        const queryParams = new URLSearchParams({
          search: searchTerm,
          date: selectedDate,
          units: selectedUnits.join(','),       // Array to String
          categories: selectedCategories.join(','), // Array to String
          locations: selectedLocations.join(',') // Add this
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
    setSelectedLocations([]); // Reset this
    setSelectedDate('');
    // Trigger fetch after state update (React batches these, so effect sees new state)
    setFilterTrigger(prev => prev + 1);
  };

  const handleViewReport = (report: any) => {
    setSelectedReport(report);
    setIsModalOpen(true);
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
              <button className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700">
                <Download className="h-4 w-4" />
                Export
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-lg text-sm hover:bg-zinc-700">
                <Printer className="h-4 w-4" />
                Print
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-y-auto">
          {/* Filters */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4"> {/* Increase cols to 6 */}
              {/* Use New Component */}
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Filter Units</label>
                <MultiSelectDropdown
                  options={allUnits}
                  selected={selectedUnits}
                  onChange={setSelectedUnits}
                  placeholder="Select Units"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Filter Categories</label>
                <MultiSelectDropdown
                  options={allCategories}
                  selected={selectedCategories}
                  onChange={setSelectedCategories}
                  placeholder="Select Categories"
                />
              </div>

              {/* NEW LOCATION FILTER */}
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Filter Location</label>
                <MultiSelectDropdown
                  options={allLocations}
                  selected={selectedLocations}
                  onChange={setSelectedLocations}
                  placeholder="Select Spots"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Search Name</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                </div>
              </div>
              {/* 4. ADD DATE INPUT */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Filter by Date</label>
                <input
                  type="date"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              {/* 4. BUTTONS SECTION */}
              <div className="flex items-end gap-2">
                <button
                  onClick={handleApplyFilters}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                >
                  <Filter className="h-4 w-4" />
                  Apply
                </button>
                <button
                  onClick={handleResetFilters}
                  className="px-3 py-2 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg text-sm transition-colors"
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
                    <th className="pb-3">Officer</th>
                    <th className="pb-3">Unit</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Specific Loc</th> {/* New Header */}
                    <th className="pb-3">Date/Time</th>
                    <th className="pb-3">Location</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {reports.map((report: any) => (
                    <tr key={report.id} className="text-sm">
                      <td className="py-3 font-medium text-white">
                        {report.profiles?.full_name || 'N/A'}
                      </td>
                      <td className="py-3 text-zinc-300">
                        {report.units?.name || 'N/A'}
                      </td>

                      {/* NEW COLORED CATEGORY COLUMN */}
                      <td className="py-3">
                        {report.report_categories && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            // Logic: Red (Unsafe) > Yellow > Green
                            (report.report_categories.color === 'red' || report.report_categories.name.toLowerCase().includes('unsafe') || report.report_categories.name.toLowerCase().includes('tidak aman') || report.report_categories.name.toLowerCase().includes('bahaya'))
                              ? 'bg-red-500/20 text-red-400'
                              : report.report_categories.color === 'yellow' || report.report_categories.name.toLowerCase().includes('maintenance') || report.report_categories.name.toLowerCase().includes('perbaikan') || report.report_categories.name.toLowerCase().includes('warning')
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-green-500/20 text-green-400'
                          }`}>
                            {report.report_categories.name}
                          </span>
                        )}
                      </td>

                      {/* NEW SPECIFIC LOCATION COLUMN */}
                      <td className="py-3 text-zinc-300">
                        {report.unit_locations?.name || '-'}
                      </td>

                      <td className="py-3 text-zinc-300">
                        {new Date(report.captured_at).toLocaleString()}
                      </td>
                      <td className="py-3 text-zinc-300">
                        {report.latitude && report.longitude
                          ? `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`
                          : 'N/A'}
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-full">
                          Completed
                        </span>
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => handleViewReport(report)}
                          className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}

                  {reports.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-zinc-500">
                        No reports found matching your criteria
                      </td>
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