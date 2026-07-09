'use client';

import { useState, useEffect } from 'react';

// Define types for offline reports
export interface OfflineReport {
  id: string;
  userId: string;
  unitId: string;
  imageData?: string; // Base64 encoded image
  notes?: string;
  latitude?: number;
  longitude?: number;
  categoryId?: string;
  locationId?: string;
  capturedAt: string;
  createdAt: string;
}

// Initialize IndexedDB
const DB_NAME = 'SiPatrolDB';
const DB_VERSION = 1;
const OFFLINE_REPORTS_STORE = 'offlineReports';

let db: IDBDatabase | null = null;

// Open IndexedDB connection
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      if (!database.objectStoreNames.contains(OFFLINE_REPORTS_STORE)) {
        const store = database.createObjectStore(OFFLINE_REPORTS_STORE, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
};

// Add an offline report to IndexedDB
export const addOfflineReport = async (report: Omit<OfflineReport, 'id' | 'createdAt'>): Promise<string> => {
  const database = await openDB();
  const transaction = database.transaction([OFFLINE_REPORTS_STORE], 'readwrite');
  const store = transaction.objectStore(OFFLINE_REPORTS_STORE);

  const id = crypto.randomUUID();
  const reportWithId: OfflineReport = {
    ...report,
    id,
    createdAt: new Date().toISOString()
  };

  const request = store.add(reportWithId);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(id);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

// Get all offline reports from IndexedDB
export const getAllOfflineReports = async (): Promise<OfflineReport[]> => {
  const database = await openDB();
  const transaction = database.transaction([OFFLINE_REPORTS_STORE], 'readonly');
  const store = transaction.objectStore(OFFLINE_REPORTS_STORE);

  const request = store.getAll();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

// Delete an offline report from IndexedDB
export const deleteOfflineReport = async (id: string): Promise<void> => {
  const database = await openDB();
  const transaction = database.transaction([OFFLINE_REPORTS_STORE], 'readwrite');
  const store = transaction.objectStore(OFFLINE_REPORTS_STORE);

  const request = store.delete(id);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

// Clear all offline reports from IndexedDB
export const clearAllOfflineReports = async (): Promise<void> => {
  const database = await openDB();
  const transaction = database.transaction([OFFLINE_REPORTS_STORE], 'readwrite');
  const store = transaction.objectStore(OFFLINE_REPORTS_STORE);

  const request = store.clear();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

// Custom hook to manage offline reports
export const useOfflineReports = () => {
  const [offlineReports, setOfflineReports] = useState<OfflineReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncInProgress, setSyncInProgress] = useState(false);

  // Load offline reports from IndexedDB
  useEffect(() => {
    const loadOfflineReports = async () => {
      try {
        setLoading(true);
        const reports = await getAllOfflineReports();
        setOfflineReports(reports);
      } catch (err) {
        console.error('Error loading offline reports:', err);
        setError(err instanceof Error ? err.message : 'Failed to load offline reports');
      } finally {
        setLoading(false);
      }
    };

    loadOfflineReports();

    // Listen for sync completion messages from service worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'report-synced') {
        console.log('Report synced successfully:', event.data.reportId);
        // Refresh the list after sync
        refreshOfflineReports();
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, []);

  // Refresh offline reports
  const refreshOfflineReports = async () => {
    try {
      setLoading(true);
      const reports = await getAllOfflineReports();
      setOfflineReports(reports);
    } catch (err) {
      console.error('Error refreshing offline reports:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh offline reports');
    } finally {
      setLoading(false);
    }
  };

  // Trigger background sync
  const triggerSync = async () => {
    if (!navigator.onLine) {
      console.log('[Sync] Device is offline, skipping sync trigger');
      return;
    }

    if (!('serviceWorker' in navigator)) {
      console.error('[Sync] Service Worker not supported');
      return;
    }

    try {
      setSyncInProgress(true);
      
      // Check if Background Sync is supported
      if ('sync' in window.registration || 'serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        
        // Try to use Background Sync API if available
        if ('sync' in registration) {
          await (registration as ServiceWorkerRegistration).sync.register('sync-reports');
          console.log('[Sync] Background sync registered successfully');
        } else {
          // Fallback: Manual sync by sending message to service worker
          registration.active?.postMessage({ type: 'SYNC_REPORTS' });
          console.log('[Sync] Manual sync message sent to service worker');
        }
      }
    } catch (error) {
      console.error('[Sync] Error triggering sync:', error);
    } finally {
      setSyncInProgress(false);
    }
  };

  // Manual sync function (immediate sync, not background)
  const syncNow = async (): Promise<{ success: number; failed: number }> => {
    if (!navigator.onLine) {
      return { success: 0, failed: 0 };
    }

    setSyncInProgress(true);
    let successCount = 0;
    let failedCount = 0;

    try {
      const reports = await getAllOfflineReports();
      
      for (const report of reports) {
        try {
          // Convert base64 imageData to Blob
          const blob = await (await fetch(report.imageData!)).blob();
          const file = new File([blob], 'sync_photo.jpg', { type: 'image/jpeg' });

          const formData = new FormData();
          formData.append('image', file);
          formData.append('notes', report.notes || '');
          formData.append('latitude', report.latitude!.toString());
          formData.append('longitude', report.longitude!.toString());
          formData.append('unitId', report.unitId);
          formData.append('categoryId', report.categoryId || '');
          formData.append('locationId', report.locationId || '');
          formData.append('capturedAt', report.capturedAt);
          formData.append('is_offline_submission', 'true');

          const response = await fetch('/api/reports', {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            await deleteOfflineReport(report.id);
            successCount++;
          } else {
            failedCount++;
          }
        } catch (error) {
          console.error('Error syncing report:', error);
          failedCount++;
        }
      }

      // Refresh the list after sync
      await refreshOfflineReports();
      
    } catch (error) {
      console.error('Error during manual sync:', error);
    } finally {
      setSyncInProgress(false);
    }

    return { success: successCount, failed: failedCount };
  };

  return {
    offlineReports,
    loading,
    error,
    syncInProgress,
    addOfflineReport,
    deleteOfflineReport,
    clearAllOfflineReports,
    refreshOfflineReports,
    triggerSync,
    syncNow
  };
};