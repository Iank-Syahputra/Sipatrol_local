import { Serwist } from "serwist";

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts-cache",
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts-cache",
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "image-cache",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      urlPattern: /^https:\/\/.*\.json$/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 60 * 60, // 1 hour
        },
      },
    },
  ],
});

// ============================================
// BACKGROUND SYNC FOR OFFLINE REPORTS (SRS-F-OUT-013)
// ============================================

// Listen for sync events
serwist.addEventListener('sync', async (event) => {
  if (event.tag === 'sync-reports') {
    event.waitUntil(syncOfflineReports());
  }
});

// Function to sync offline reports to server
async function syncOfflineReports(): Promise<void> {
  const DB_NAME = 'SiPatrolDB';
  const OFFLINE_REPORTS_STORE = 'offlineReports';

  try {
    // Open IndexedDB
    const db = await openIndexedDB(DB_NAME, DB_VERSION);
    const transaction = db.transaction([OFFLINE_REPORTS_STORE], 'readwrite');
    const store = transaction.objectStore(OFFLINE_REPORTS_STORE);

    // Get all pending reports
    const pendingReports = await getAllFromStore(store);

    if (pendingReports.length === 0) {
      console.log('[Background Sync] No pending reports to sync');
      return;
    }

    console.log(`[Background Sync] Syncing ${pendingReports.length} report(s)...`);

    const syncedIds: string[] = [];

    // Sync each report
    for (const report of pendingReports) {
      try {
        // Convert base64 imageData to Blob
        const blob = await base64ToBlob(report.imageData!, 'image/jpeg');
        const file = new File([blob], report.capturedAt.replace(/[:.]/g, '-') + '_sync.jpg', { type: 'image/jpeg' });

        // Create FormData
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

        // Send to server
        const response = await fetch('/api/reports', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          syncedIds.push(report.id);
          console.log(`[Background Sync] Successfully synced report ${report.id}`);
          
          // Notify client about successful sync
          await notifyClient('report-synced', {
            reportId: report.id,
            timestamp: new Date().toISOString()
          });
        } else {
          console.error(`[Background Sync] Failed to sync report ${report.id}:`, await response.text());
        }
      } catch (error) {
        console.error(`[Background Sync] Error syncing report ${report.id}:`, error);
      }
    }

    // Delete successfully synced reports
    if (syncedIds.length > 0) {
      for (const id of syncedIds) {
        await store.delete(id);
      }
      console.log(`[Background Sync] Deleted ${syncedIds.length} synced report(s) from IndexedDB`);
    }

  } catch (error) {
    console.error('[Background Sync] Error during sync:', error);
  }
}

// Helper function to open IndexedDB
function openIndexedDB(dbName: string, dbVersion: number): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

// Helper function to get all records from store
function getAllFromStore(store: IDBObjectStore): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

// Helper function to convert base64 to Blob
function base64ToBlob(base64: string, mimeType: string): Promise<Blob> {
  return fetch(`data:${mimeType};base64,${base64}`).then(res => res.blob());
}

// Helper function to notify client
async function notifyClient(event: string, data: any): Promise<void> {
  const clients = await self.clients.matchAll();
  for (const client of clients) {
    client.postMessage({ type: event, ...data });
  }
}

serwist.addEventListener();