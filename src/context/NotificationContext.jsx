import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import messageService from '../services/messageService';
import businessService from '../services/businessService';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

const POLL_INTERVAL_MS = 30000;

export function NotificationProvider({ children }) {
  const { isAuthenticated, isSuperAdmin, viewingBusiness } = useAuth();

  // Unread count for the Messages nav badge — the current business context's
  // thread (the caller's own municipality, or whichever one a super admin
  // is currently viewing).
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);

  // Sum of unread messages across every municipality — the Municipalities
  // nav badge, visible to a super admin even before they've entered one.
  const [municipalitiesUnreadTotal, setMunicipalitiesUnreadTotal] = useState(0);

  const hasBusinessContext = isAuthenticated && (!isSuperAdmin || !!viewingBusiness);

  const refreshMessageCount = useCallback(() => {
    if (!hasBusinessContext) {
      setMessageUnreadCount(0);
      return;
    }
    messageService.getUnreadCount().then(setMessageUnreadCount).catch(() => {});
  }, [hasBusinessContext]);

  const refreshMunicipalitiesTotal = useCallback(() => {
    if (!isAuthenticated || !isSuperAdmin) {
      setMunicipalitiesUnreadTotal(0);
      return;
    }
    businessService.getUnreadCount().then(setMunicipalitiesUnreadTotal).catch(() => {});
  }, [isAuthenticated, isSuperAdmin]);

  // Keep the latest callbacks in a ref so the polling interval below doesn't
  // need to be torn down and rebuilt every time they change identity.
  const refreshersRef = useRef({ refreshMessageCount, refreshMunicipalitiesTotal });
  useEffect(() => {
    refreshersRef.current = { refreshMessageCount, refreshMunicipalitiesTotal };
  }, [refreshMessageCount, refreshMunicipalitiesTotal]);

  useEffect(() => {
    if (!isAuthenticated) return;

    refreshersRef.current.refreshMessageCount();
    refreshersRef.current.refreshMunicipalitiesTotal();

    const interval = setInterval(() => {
      refreshersRef.current.refreshMessageCount();
      refreshersRef.current.refreshMunicipalitiesTotal();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
    // Re-arm immediately (not just on the next tick) whenever the business
    // context changes, e.g. a super admin entering/exiting a municipality.
  }, [isAuthenticated, hasBusinessContext]);

  const value = {
    messageUnreadCount,
    municipalitiesUnreadTotal,
    refreshMessageCount,
    refreshMunicipalitiesTotal,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
