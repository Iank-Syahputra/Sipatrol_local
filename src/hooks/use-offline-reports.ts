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

  return {
    offlineReports,
    loading,
    error,
    addOfflineReport,
    deleteOfflineReport,
    clearAllOfflineReports,
    refreshOfflineReports
  };
};