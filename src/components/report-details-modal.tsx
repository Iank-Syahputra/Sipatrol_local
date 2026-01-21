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

  // If not mounted, return nothing to avoid hydration errors
  if (!isMounted || !isOpen || !report) {
    return null;
  }

  // Handle coordinate mapping (database might use different field names)
  const latitude = report.lat || report.latitude || report.profiles?.lat || report.profiles?.latitude;
  const longitude = report.lng || report.longitude || report.profiles?.lng || report.profiles?.longitude;

  // Format the captured timestamp
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h3 className="text-xl font-bold text-white">Report Details</h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="overflow-y-auto flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Photo Evidence */}
            <div className="space-y-4">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Photo Evidence
              </h4>
              <div className="bg-zinc-800 border border-zinc-700 rounded-xl w-full h-64 flex items-center justify-center overflow-hidden">
                {report.image_path || report.imageData || report.photo_url ? (
                  <img
                    src={report.image_path || report.imageData || report.photo_url}
                    alt="Report evidence"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // If image fails to load, show fallback
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.parentElement?.querySelector('.fallback-content');
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : (
                  <div className="fallback-content w-full h-full flex flex-col items-center justify-center text-zinc-500">
                    <Camera className="w-12 h-12 mb-2" />
                    <p>No Photo Available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Details */}
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-white mb-2">Officer Information</h4>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-sm text-zinc-300">
                    <span className="text-zinc-400">Name:</span> {report.profiles?.full_name || report.profiles?.name || 'N/A'}
                  </p>
                  <p className="text-sm text-zinc-300">
                    <span className="text-zinc-400">Unit:</span> {report.units?.name || report.unit?.name || 'N/A'}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">Category & Location</h4>
                <div className="space-y-3">
                  {/* Category */}
                  {report.report_categories?.name && (
                    <div className="bg-zinc-800/50 rounded-lg p-3">
                      <p className="text-sm text-zinc-400">Category</p>
                      <div className="mt-1">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            report.report_categories.color === 'green' || report.report_categories.name.toLowerCase().includes('aman') || report.report_categories.name.toLowerCase().includes('safe')
                              ? 'bg-green-500/20 text-green-400'
                              : report.report_categories.color === 'red' || report.report_categories.name.toLowerCase().includes('unsafe')
                                ? 'bg-red-500/20 text-red-400'
                                : report.report_categories.color === 'yellow' || report.report_categories.name.toLowerCase().includes('maintenance')
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : 'bg-blue-500/20 text-blue-400'
                          }`}
                        >
                          {report.report_categories.name}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Specific Location */}
                  {report.unit_locations?.name && (
                    <div className="bg-zinc-800/50 rounded-lg p-3">
                      <p className="text-sm text-zinc-400">Specific Location</p>
                      <p className="text-sm text-zinc-300 mt-1">{report.unit_locations.name}</p>
                    </div>
                  )}

                  {/* GPS Location */}
                  <div className="bg-zinc-800/50 rounded-lg p-3 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-blue-400 mt-0.5" />
                    <div>
                      {latitude && longitude ? (
                        <>
                          <p className="text-sm text-zinc-300">
                            {latitude.toFixed(6)}, {longitude.toFixed(6)}
                          </p>
                          <a
                            href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-1"
                          >
                            Open in Maps <ExternalLink className="w-3 h-3" />
                          </a>
                        </>
                      ) : (
                        <p className="text-sm text-zinc-300">
                          Location not available
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-2">Timestamp</h4>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-sm text-zinc-300">
                    {report.captured_at ? formatDate(report.captured_at) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="mt-6">
            <h4 className="font-semibold text-white mb-2">Officer Notes</h4>
            <div className="bg-zinc-800/50 rounded-lg p-4 min-h-[100px]">
              <p className="text-zinc-300">
                {report.notes || 'No notes provided for this report.'}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}