import { useState, useEffect, useCallback } from 'react';
import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState('unknown');

  useEffect(() => {
    const isNative = Capacitor.getPlatform() !== 'web';

    if (isNative) {
      // Use Capacitor Network plugin for native
      const checkStatus = async () => {
        const status = await Network.getStatus();
        setIsOnline(status.connected);
        setConnectionType(status.connectionType);
      };

      checkStatus();

      const listener = Network.addListener('networkStatusChange', (status) => {
        setIsOnline(status.connected);
        setConnectionType(status.connectionType);
      });

      return () => {
        listener.then(l => l.remove());
      };
    } else {
      // Use browser navigator for web
      setIsOnline(navigator.onLine);

      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  return { isOnline, connectionType };
}

export function useOfflineSync(apiBaseUrl = '') {
  const { isOnline } = useNetworkStatus();
  const [syncQueue, setSyncQueue] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Load queue from storage
  useEffect(() => {
    const saved = localStorage.getItem('clearmind_sync_queue');
    if (saved) {
      setSyncQueue(JSON.parse(saved));
    }
  }, []);

  // Save queue to storage
  useEffect(() => {
    localStorage.setItem('clearmind_sync_queue', JSON.stringify(syncQueue));
  }, [syncQueue]);

  // Add item to sync queue
  const addToQueue = useCallback((item) => {
    setSyncQueue(prev => [...prev, { ...item, queuedAt: Date.now() }]);
  }, []);

  // Process sync queue when online
  const processQueue = useCallback(async (token) => {
    if (!isOnline || syncQueue.length === 0 || isSyncing) return;

    setIsSyncing(true);
    const processed = [];

    for (const item of syncQueue) {
      try {
        const response = await fetch(`${apiBaseUrl}${item.endpoint}`, {
          method: item.method || 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify(item.data)
        });

        if (response.ok) {
          processed.push(item.queuedAt);
        }
      } catch (error) {
        console.error('Sync failed for item:', item, error);
      }
    }

    // Remove processed items
    setSyncQueue(prev => prev.filter(item => !processed.includes(item.queuedAt)));
    setLastSyncTime(Date.now());
    setIsSyncing(false);
  }, [isOnline, syncQueue, isSyncing, apiBaseUrl]);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && syncQueue.length > 0) {
      const token = localStorage.getItem('clearmind_token');
      processQueue(token);
    }
  }, [isOnline]);

  return {
    isOnline,
    syncQueue,
    isSyncing,
    lastSyncTime,
    addToQueue,
    processQueue,
    pendingCount: syncQueue.length
  };
}

export default useOfflineSync;
