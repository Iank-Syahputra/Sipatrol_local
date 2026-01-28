'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { MapPin, FileText } from 'lucide-react';
import ReportDetailsModal from '@/components/report-details-modal';

export default function RecentReportList({ reports }: { reports: any[] }) {
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
            className="border rounded-lg p-4 hover:bg-accent transition-colors cursor-pointer group"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">Report #{report.id.substring(0, 8)}</h3>
                <p className="text-sm text-muted-foreground">
                  {report.units?.name || 'Unknown Unit'}
                </p>
              </div>
              <Badge variant="secondary">
                {new Date(report.capturedAt).toLocaleDateString()}
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

            {/* Note Preview - truncated for dashboard */}
            {report.notes && (
              <p className="mt-2 text-sm truncate">{report.notes}</p>
            )}

            {/* Image Preview */}
            {report.imagePath && (
              <div className="mt-3">
                <img
                  src={report.imagePath}
                  alt="Evidence"
                  className="w-full h-32 object-cover rounded-md border border-zinc-700"
                />
              </div>
            )}

            <div className="mt-3 flex justify-between items-center text-xs text-muted-foreground">
              <span>Submitted: {new Date(report.createdAt).toLocaleString()}</span>
              {report.isOfflineSubmission && (
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