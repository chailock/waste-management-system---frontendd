import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps a route so it requires authentication, and optionally a specific
 * role. Usage:
 *   <ProtectedRoute><Dashboard /></ProtectedRoute>
 *   <ProtectedRoute requiredRole="ADMIN"><Contracts /></ProtectedRoute>
 */
export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7770' }}>
        <h2 style={{ color: '#1f2a24' }}>Access denied</h2>
        <p>You don't have permission to view this page.</p>
      </div>
    );
  }

  return children;
}
