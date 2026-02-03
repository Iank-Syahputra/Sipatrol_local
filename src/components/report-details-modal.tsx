'use client';

import { useState, useEffect } from 'react';
import { X, MapPin, Camera, ExternalLink } from 'lucide-react';

interface ReportDetailsModalProps {
  report: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReportDetailsModal({ report, isOpen, onClose }: ReportDetailsModalProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !isOpen || !report) {
    return null;
  }

  const latitude = report.lat || report.latitude || report.profiles?.lat || report.profiles?.latitude || report.latitude;
  const longitude = report.lng || report.longitude || report.profiles?.lng || report.profiles?.longitude || report.longitude;

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    };
    return new Date(dateString).toLocaleString(undefined, options);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-xl font-black text-slate-900">Report Details</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="overflow-y-auto flex-1 p-6 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Photo Evidence */}
            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#00F7FF]" />
                Foto
              </h4>
              <div className="bg-slate-100 border border-slate-200 rounded-2xl w-full h-64 flex items-center justify-center overflow-hidden shadow-inner">
                {report.image_path || report.imagePath || report.imageData || report.photo_url ? (
                  <img
                    src={report.image_path || report.imagePath || report.imageData || report.photo_url}
                    alt="Report evidence"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.parentElement?.querySelector('.fallback-content');
                      if (fallback) fallback.setAttribute('style', 'display: flex');
                    }}
                  />
                ) : (
                  <div className="fallback-content w-full h-full flex flex-col items-center justify-center text-slate-400">
                    <Camera className="w-12 h-12 mb-2" />
                    <p className="font-bold">No Photo Available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Details with Cyan Accents */}
            <div className="space-y-3">
              {/* Full Name */}
              <div className="bg-slate-50 border border-slate-100 hover:border-[#00F7FF]/30 rounded-xl p-3 transition-colors">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Lengkap</p>
                <p className="text-sm font-bold text-slate-800 mt-1">
                  {report.profiles?.full_name || report.profiles?.name || report.user?.fullName || report.user?.name || 'N/A'}
                </p>
              </div>

              {/* Unit */}
              <div className="bg-slate-50 border border-slate-100 hover:border-[#00F7FF]/30 rounded-xl p-3 transition-colors">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit</p>
                <p className="text-sm font-bold text-slate-800 mt-1">
                  {report.units?.name || report.unit?.name || 'N/A'}
                </p>
              </div>

              {/* Category */}
              {(report.report_categories?.name || report.category?.name) && (
                <div className="bg-slate-50 border border-slate-100 hover:border-[#00F7FF]/30 rounded-xl p-3 transition-colors">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori</p>
                  <div className="mt-2">
                    <span
                      className={`inline-block px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                        (report.report_categories?.color || report.category?.color) === 'red' ||
                        (report.report_categories?.name || report.category?.name)?.toLowerCase().includes('action') 
                          ? 'bg-red-100 text-red-600 border border-red-200'
                          : (report.report_categories?.color || report.category?.color) === 'yellow' ||
                          (report.report_categories?.name || report.category?.name)?.toLowerCase().includes('condition')
                            ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                            : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {report.report_categories?.name || report.category?.name || 'N/A'}
                    </span>
                  </div>
                </div>
              )}

              {/* Specific Location */}
              {(report.unit_locations?.name || report.location?.name || report.locationNameCached) && (
                <div className="bg-slate-50 border border-slate-100 hover:border-[#00F7FF]/30 rounded-xl p-3 transition-colors">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lokasi Spesifik</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">
                    {report.locationNameCached || report.unit_locations?.name || report.location?.name || 'N/A'}
                  </p>
                </div>
              )}

              {/* Coordinates */}
              <div className="bg-slate-50 border border-slate-100 hover:border-[#00F7FF]/30 rounded-xl p-3 flex items-start gap-3 transition-colors">
                <div className="p-2 bg-cyan-50 rounded-lg text-[#00F7FF]"><MapPin className="w-4 h-4" /></div>
                <div>
                  {latitude && longitude ? (
                    <>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Koordinat</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">
                        {latitude.toFixed(6)}, {longitude.toFixed(6)}
                      </p>
                      <a
                        href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-black text-black hover:underline flex items-center gap-1 mt-1 uppercase"
                      >
                        Open in Maps <ExternalLink className="w-3 h-3" />
                      </a>
                    </>
                  ) : (
                    <p className="text-sm font-bold text-slate-400">Location not available</p>
                  )}
                </div>
              </div>

              {/* Timestamp */}
              <div className="bg-slate-50 border border-slate-100 hover:border-[#00F7FF]/30 rounded-xl p-3 transition-colors">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Waktu</p>
                <p className="text-sm font-bold text-slate-800 mt-1">
                  {report.captured_at || report.capturedAt ? formatDate(report.captured_at || report.capturedAt) : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="mt-6">
            <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">Deskripsi</h4>
            <div className="bg-slate-50 border border-slate-100 border-l-4 border-l-[#00F7FF] rounded-xl p-4 min-h-[100px] shadow-sm">
              <p className="text-slate-600 font-medium italic leading-relaxed">
                "{report.notes || 'No description provided for this report.'}"
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-100 flex justify-end bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-8 py-2 bg-[#00F7FF] hover:bg-cyan-400 text-slate-900 font-black rounded-xl shadow-lg shadow-cyan-200/50 transition-all active:scale-95"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}