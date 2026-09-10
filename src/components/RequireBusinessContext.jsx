import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Guards every page that needs a specific municipality's data (Dashboard,
 * Sites, Messages, etc.). A SUPER_ADMIN has no business of their own, so
 * until they've clicked into a municipality from /municipalities, these
 * pages have nothing to scope their API calls to — send them back there
 * instead of letting every request fail.
 */
export default function RequireBusinessContext() {
  const { isSuperAdmin, viewingBusiness } = useAuth();

  if (isSuperAdmin && !viewingBusiness) {
    return <Navigate to="/municipalities" replace />;
  }

  return <Outlet />;
}
