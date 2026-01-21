'use client';

import { useEffect, useState } from 'react';
import { useOfflineReports } from '@/hooks/use-offline-reports';
import { useUser } from '@clerk/nextjs';

interface SyncResult {
  success: boolean;
  message: string;
  syncedCount: number;
}

// Function to sync offline reports with the server
export const syncOfflineReports = async (
  getAllOfflineReports: () => Promise<any[]>,
  deleteOfflineReport: (id: string) => Promise<void>
): Promise<SyncResult> => {
  try {
    // Get all offline reports from IndexedDB
    const offlineReports = await getAllOfflineReports();

    if (offlineReports.length === 0) {
      return { success: true, message: 'No offline reports to sync', syncedCount: 0 };
    }

    let syncedCount = 0;

    // Attempt to sync each report
    for (const report of offlineReports) {
      try {
        const syncResponse = await fetch('/api/reports/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageData: report.imageData,
            notes: report.notes,
            latitude: report.latitude,
            longitude: report.longitude,
            unitId: report.unitId,
            userId: report.userId,
            categoryId: report.categoryId || '',
            locationId: report.locationId || '',
            capturedAt: report.capturedAt
          }),
        });

        if (syncResponse.ok) {
          // Delete the synced report from IndexedDB
          await deleteOfflineReport(report.id);
          syncedCount++;
        } else {
          console.error(`Failed to sync report ${report.id}:`, await syncResponse.text());
        }
      } catch (error) {
        console.error(`Error syncing report ${report.id}:`, error);
        // Continue with other reports even if one fails
      }
    }

    return {
      success: true,
      message: `Synced ${syncedCount} out of ${offlineReports.length} reports`,
      syncedCount
    };
  } catch (error) {
    console.error('Error during sync:', error);
    return { success: false, message: 'Sync failed', syncedCount: 0 };
  }
};

// Hook to handle automatic sync when online
export const useAutoSync = () => {
  const { offlineReports, refreshOfflineReports, addOfflineReport, deleteOfflineReport, clearAllOfflineReports, getAllOfflineReports } = useOfflineReports();
  const { isSignedIn } = useUser();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    if (!isSignedIn) return;

    const handleOnline = async () => {
      if (offlineReports.length > 0 && !isSyncing) {
        setIsSyncing(true);
        try {
          await syncOfflineReports(getAllOfflineReports, deleteOfflineReport);
          refreshOfflineReports(); // Refresh the list after sync
          setLastSync(new Date());
        } finally {
          setIsSyncing(false);
        }
      }
    };

    // Listen for online event
    window.addEventListener('online', handleOnline);

    // Also try to sync when component mounts if online and has offline reports
    if (navigator.onLine && offlineReports.length > 0 && !isSyncing) {
      handleOnline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [offlineReports.length, isSignedIn, isSyncing, refreshOfflineReports, getAllOfflineReports, deleteOfflineReport]);

  return { isSyncing, lastSync, getAllOfflineReports };
};