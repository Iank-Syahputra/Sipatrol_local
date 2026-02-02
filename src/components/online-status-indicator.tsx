'use client';

import { useState, useEffect } from 'react';
// Import for user authentication will be handled by NextAuth
import { useOfflineReports } from '@/hooks/use-offline-reports';
import { useAutoSync } from '@/hooks/use-auto-sync';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, RefreshCw, X, FileText, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function OnlineStatusIndicator() {
  const [isOnline, setIsOnline] = useState<boolean | null>(null); // Start with null to avoid hydration mismatch
  const [isOpen, setIsOpen] = useState(false);
  // TODO: Replace with NextAuth session check once implemented
  const isAuthenticated = true; // Placeholder - will be replaced with actual session check
  const { offlineReports } = useOfflineReports();
  const { isSyncing, lastSync } = useAutoSync();

  useEffect(() => {
    // Set the initial state on the client side only
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isAuthenticated) return null;

  return (
    <>
      <div className="flex items-center gap-3">
        <Badge variant={isOnline === null ? "secondary" : isOnline ? "default" : "destructive"}>
          {isOnline === null ? (
            <>
              <Wifi className="mr-1 h-3 w-3" /> Checking...
            </>
          ) : isOnline ? (
            <>
              <Wifi className="mr-1 h-3 w-3" /> Online
            </>
          ) : (
            <>
              <WifiOff className="mr-1 h-3 w-3" /> Offline
            </>
          )}
        </Badge>

        {offlineReports.length > 0 && (
          <Button
            variant="secondary"
            size="sm"
            className="gap-2 h-6 text-xs bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border border-orange-500/20"
            onClick={() => setIsOpen(true)}
          >
            <RefreshCw className="h-3 w-3 animate-spin" />
            {offlineReports.length} Pending
          </Button>
        )}

        {lastSync && (
          <Badge variant="secondary" className="text-xs">
            Last sync: {lastSync.toLocaleTimeString()}
          </Badge>
        )}
      </div>

      {/* MODAL: DAFTAR LAPORAN PENDING */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md bg-white border-slate-200 text-slate-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <RefreshCw className="h-4 w-4 text-orange-500" />
              Antrean Laporan ({offlineReports.length})
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Laporan ini tersimpan di perangkat Anda dan akan otomatis terkirim saat koneksi internet stabil kembali.
            </DialogDescription>
          </DialogHeader>

          {/* List Container */}
          <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {offlineReports.map((report: any, idx: number) => (
              <div
                key={idx}
                className="flex gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                {/* Thumbnail Gambar */}
                <div className="w-16 h-16 bg-slate-200 rounded-md overflow-hidden flex-shrink-0 border border-slate-300 relative group">
                  {report.imageData ? (
                    <img
                      src={report.imageData}
                      alt="Bukti"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500">
                      <FileText className="h-6 w-6" />
                    </div>
                  )}
                </div>

                {/* Detail Laporan */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-medium text-slate-800 truncate">
                        {report.categoryId || 'Tanpa Kategori'}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-600">
                        {new Date(report.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-1">
                      {report.notes || 'Tidak ada catatan tambahan...'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-2">
                    <MapPin className="h-3 w-3 text-slate-500" />
                    <span>Lat: {report.latitude?.toFixed(4)}, Long: {report.longitude?.toFixed(4)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="border-slate-300 hover:bg-slate-100 text-slate-700"
            >
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}