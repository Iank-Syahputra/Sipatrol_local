'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Calendar, Filter, ChevronLeft, ChevronRight, MapPin, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ReportDetailsModal from '@/components/report-details-modal';

interface ReportListProps {
  reports: any[];
  totalPages: number;
  currentPage: number;
  totalCount: number;
  initialStartDate: string;
  initialEndDate: string;
}

export default function ReportList({
  reports,
  totalPages,
  currentPage,
  initialStartDate,
  initialEndDate
}: ReportListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [isLoading, setIsLoading] = useState(false);

  const handleViewReport = (report: any) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  // Helper untuk update URL
  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleApplyFilter = () => {
    setIsLoading(true); // Show loading state
    updateParams({ startDate, endDate, page: '1' }); // Reset ke page 1 saat filter
  };

  const handleResetFilter = () => {
    setStartDate('');
    setEndDate('');
    setIsLoading(true); // Show loading state
    updateParams({ startDate: null, endDate: null, page: '1' });
  };

  const handlePageChange = (newPage: number) => {
    setIsLoading(true); // Show loading state
    updateParams({ page: newPage.toString() });
  };

  // Effect to hide loading when reports change (after navigation)
  useEffect(() => {
    setIsLoading(false);
  }, [reports]);

  return (
    <div className="space-y-6">
      {/* 1. Filter Section */}
      <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="text-xs text-zinc-400 mb-1 block flex gap-2 items-center">
              <Calendar className="w-3 h-3"/> Start Date
            </label>
            <input
              type="date"
              className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm text-white"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="flex-1 w-full">
            <label className="text-xs text-zinc-400 mb-1 block flex gap-2 items-center">
              <Calendar className="w-3 h-3"/> End Date
            </label>
            <input
              type="date"
              className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-sm text-white"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={handleResetFilter}
              disabled={isLoading}
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded text-sm text-white transition-colors flex-1 md:flex-none justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Resetting...' : 'Reset'}
            </button>
            <button
              onClick={handleApplyFilter}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm text-white transition-colors flex items-center gap-2 flex-1 md:flex-none justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Applying...
                </>
              ) : (
                <>
                  <Filter className="w-3 h-3" /> Apply
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. List Report */}
      <div className="space-y-4">
        {reports.length === 0 ? (
          <div className="text-center py-10 text-zinc-500 bg-zinc-800/30 rounded-xl border border-zinc-800">
            No reports found matching your criteria.
          </div>
        ) : (
          reports.map((report) => (
            <div
              key={report.id}
              onClick={() => handleViewReport(report)}
              className="border rounded-lg p-4 hover:bg-zinc-800/50 transition-colors cursor-pointer group bg-zinc-800 border-zinc-700"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold group-hover:text-blue-400 transition-colors text-white">
                    Report #{report.id.substring(0, 8)}
                  </h3>
                  <p className="text-sm text-zinc-400">
                    {report.units?.name || 'UP KENDARI'}
                  </p>
                </div>
                <span className="text-xs font-mono text-zinc-500 bg-zinc-900 px-2 py-1 rounded">
                  {new Date(report.capturedAt).toLocaleString('id-ID')}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
                <MapPin className="w-3 h-3" />
                <span>{report.latitude?.toFixed(6)}, {report.longitude?.toFixed(6)}</span>
              </div>

              <p className="text-sm text-zinc-300 mb-4 line-clamp-2 bg-zinc-900/50 p-2 rounded">
                {report.notes || 'No notes provided.'}
              </p>

              {report.imagePath && (
                <div className="relative w-full h-32 bg-zinc-900 rounded-md overflow-hidden border border-zinc-700">
                  <img
                    src={report.imagePath}
                    alt="Evidence"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}

              <div className="mt-3 text-xs text-zinc-500 pt-2 border-t border-zinc-700/50 flex justify-between">
                 <span>Submitted: {new Date(report.createdAt || report.capturedAt).toLocaleDateString()}</span>
                 {report.isOfflineSubmission && (
                   <Badge variant="outline" className="text-xs">Offline</Badge>
                 )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 3. Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
          <div className="text-sm text-zinc-400">
            Page <span className="text-white font-medium">{currentPage}</span> of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || isLoading}
              className="p-2 bg-zinc-800 border border-zinc-700 rounded-md hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white"
            >
              {isLoading ? (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || isLoading}
              className="p-2 bg-zinc-800 border border-zinc-700 rounded-md hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white"
            >
              {isLoading ? (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Modal Integration */}
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