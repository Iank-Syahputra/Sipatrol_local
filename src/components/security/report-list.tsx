'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Calendar, Filter, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
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
    setIsLoading(true);
    updateParams({ startDate, endDate, page: '1' });
  };

  const handleResetFilter = () => {
    setStartDate('');
    setEndDate('');
    setIsLoading(true);
    updateParams({ startDate: null, endDate: null, page: '1' });
  };

  const handlePageChange = (newPage: number) => {
    setIsLoading(true);
    updateParams({ page: newPage.toString() });
  };

  useEffect(() => {
    setIsLoading(false);
  }, [reports]);

  return (
    <div className="space-y-6">
      {/* 1. Filter Section - Light Mode Updated */}
      <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1 flex gap-2 items-center">
              <Calendar className="w-3 h-3 text-cyan-600"/> Start Date
            </label>
            <input
              type="date"
              className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="flex-1 w-full">
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 ml-1 flex gap-2 items-center">
              <Calendar className="w-3 h-3 text-cyan-600"/> End Date
            </label>
            <input
              type="date"
              className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={handleResetFilter}
              disabled={isLoading}
              className="px-6 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 transition-all shadow-sm flex-1 md:flex-none justify-center disabled:opacity-50"
            >
              {isLoading ? '...' : 'Reset'}
            </button>
            <button
              onClick={handleApplyFilter}
              disabled={isLoading}
              className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-400 rounded-lg text-sm font-bold text-white transition-all shadow-md shadow-cyan-200/50 flex items-center gap-2 flex-1 md:flex-none justify-center disabled:opacity-50"
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
              ) : (
                <><Filter className="w-3 h-3" /> Apply</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. List Report - Light Mode with Cyan Accents */}
      <div className="space-y-4">
        {reports.length === 0 ? (
          <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-100 shadow-inner">
            No reports found matching your criteria.
          </div>
        ) : (
          reports.map((report) => (
            <div
              key={report.id}
              onClick={() => handleViewReport(report)}
              className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/10 transition-all cursor-pointer group relative overflow-hidden"
            >
              {/* Decorative side accent */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-cyan-400 transition-colors" />

              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">
                    Report #{report.id.substring(0, 8)}
                  </h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mt-1">
                    {report.units?.name || 'ULPLTD WUAWUA'}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                  {new Date(report.capturedAt).toLocaleString('id-ID')}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-4">
                <div className="p-1 bg-cyan-50 rounded text-cyan-600"><MapPin className="w-3 h-3" /></div>
                <span>{report.latitude?.toFixed(6)}, {report.longitude?.toFixed(6)}</span>
              </div>

              <p className="text-sm text-slate-600 mb-5 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                "{report.notes || 'No notes provided.'}"
              </p>

              {report.imagePath && (
                <div className="relative w-full h-40 bg-slate-100 rounded-xl overflow-hidden border border-slate-100 shadow-inner mb-4">
                  <img
                    src={report.imagePath}
                    alt="Evidence"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
              )}

              <div className="mt-4 text-[10px] font-bold text-slate-400 pt-3 border-t border-slate-50 flex justify-between items-center">
                 <span className="uppercase tracking-widest">Submitted: {new Date(report.createdAt || report.capturedAt).toLocaleDateString()}</span>
                 {report.isOfflineSubmission && (
                   <Badge variant="outline" className="text-cyan-600 border-cyan-200 bg-cyan-50 px-2 py-0.5 rounded-full text-[10px]">Offline</Badge>
                 )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 3. Pagination Controls - Updated to Light Mode */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-slate-100">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Page <span className="text-slate-900">{currentPage}</span> of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || isLoading}
              className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 shadow-sm text-slate-600 transition-all"
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-slate-300 border-t-cyan-500 animate-spin rounded-full" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || isLoading}
              className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 shadow-sm text-slate-600 transition-all"
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-slate-300 border-t-cyan-500 animate-spin rounded-full" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      )}

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