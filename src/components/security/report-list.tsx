'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { MapPin, FileText } from 'lucide-react';
import ReportDetailsModal from '@/components/report-details-modal';

export default function ReportList({ reports }: { reports: any[] }) {
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewReport = (report: any) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  if (reports.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 font-semibold">No reports yet</h3>
        <p className="text-muted-foreground mt-2">You haven't submitted any security reports yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {reports.map((report) => (
          <div
            key={report.id}
            onClick={() => handleViewReport(report)}
            className="border rounded-lg p-4 hover:bg-zinc-800/50 transition-colors cursor-pointer group"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold group-hover:text-blue-400 transition-colors">
                  Report #{report.id.substring(0, 8)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {report.units?.name || 'Unknown Unit'}
                </p>
              </div>
              <Badge variant="secondary">
                {new Date(report.captured_at).toLocaleString()}
              </Badge>
            </div>

            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              {report.latitude && report.longitude && (
                <>
                  <MapPin className="h-4 w-4" />
                  <span>{report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}</span>
                </>
              )}
            </div>

            {/* Note Preview */}
            {report.notes && (
              <p className="mt-2 text-sm line-clamp-2 text-zinc-300">{report.notes}</p>
            )}

            {/* Image Preview */}
            {report.image_path && (
              <div className="mt-3">
                <img
                  src={report.image_path}
                  alt="Evidence"
                  className="w-full h-32 object-cover rounded-md border border-zinc-700"
                />
              </div>
            )}

            <div className="mt-3 flex justify-between items-center text-xs text-muted-foreground">
              <span>Submitted: {new Date(report.created_at).toLocaleString()}</span>
              {report.is_offline_submission && (
                <Badge variant="outline">Offline</Badge>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Integration */}
      {isModalOpen && selectedReport && (
        <ReportDetailsModal
          report={selectedReport}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}