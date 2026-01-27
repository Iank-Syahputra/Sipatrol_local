'use client';

import { useState, useEffect } from 'react';
import { useOfflineReports } from '@/hooks/use-offline-reports';
import { getAllOfflineReports } from '@/hooks/use-offline-reports'; // Import directly
import { useSession } from 'next-auth/react';

export function useAutoSync() {
  const { refreshOfflineReports, deleteOfflineReport } = useOfflineReports();
  const { data: session, status } = useSession();
  const isSignedIn = status === 'authenticated';
  const [isSyncing, setIsSyncing] = useState(false);

  // Fungsi Sinkronisasi Inti
  const syncOfflineReports = async () => {
    if (!navigator.onLine) {
      console.log('Browser offline, skip sync.');
      return;
    }

    if (isSyncing) return;

    try {
      setIsSyncing(true);

      // 3. Panggil fungsi yang di-import langsung
      const offlineReports = await getAllOfflineReports();

      if (offlineReports.length === 0) {
        setIsSyncing(false);
        return;
      }

      console.log(`📡 Menemukan ${offlineReports.length} laporan pending. Memulai upload...`);

      let syncedCount = 0;

      for (const report of offlineReports) {
        try {
          // Convert Base64 Image balik ke File
          const res = await fetch(report.imageData);
          const blob = await res.blob();
          const imageFile = new File([blob], "offline_evidence.jpg", { type: "image/jpeg" });

          const formData = new FormData();
          formData.append('image', imageFile);
          formData.append('notes', report.notes || '');
          formData.append('latitude', String(report.latitude || ''));
          formData.append('longitude', String(report.longitude || ''));
          formData.append('unitId', report.unitId);
          formData.append('userId', session?.user?.id as string ?? report.userId);
          formData.append('categoryId', report.categoryId || '');
          formData.append('locationId', report.locationId || '');
          // Pastikan field ini sesuai dengan yang diminta backend (capturedAt vs captured_at)
          formData.append('capturedAt', report.capturedAt);
          formData.append('is_offline_submission', 'true');

          // Kirim ke API
          const response = await fetch('/api/reports', {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            // PERBAIKAN DI SINI:
            // Hapus dari IndexedDB. Pastikan ID dikirim sebagai STRING, sesuai dengan tipe di IndexedDB.
            if (report.id) {
              // report.id sudah berupa string karena IndexedDB menggunakan UUID
              await deleteOfflineReport(report.id.toString());
            }

            syncedCount++;
            console.log(`✅ Laporan ID ${report.id} terkirim dan dihapus dari lokal.`);
          } else {
            console.error(`❌ Gagal kirim laporan ID ${report.id}`);
          }
        } catch (err) {
          console.error(`❌ Error processing ID ${report.id}:`, err);
        }
      }

      // Update UI setelah sync selesai
      await refreshOfflineReports();

      if (syncedCount > 0) {
        console.log(`${syncedCount} Laporan offline berhasil disinkronisasi ke server!`);
      }

    } catch (error) {
      console.error('Sync process failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (!isSignedIn) return;

    const handleOnline = () => {
      console.log('🌐 Internet terhubung kembali! Memicu auto-sync...');
      syncOfflineReports();
    };

    window.addEventListener('online', handleOnline);

    if (navigator.onLine) {
      syncOfflineReports();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [isSignedIn]);

  return { isSyncing, syncOfflineReports };
}