import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import ProtectedRoute from './components/ProtectedRoute';
import RequireBusinessContext from './components/RequireBusinessContext';
import DashboardLayout from './layouts/DashboardLayout';
import { useAuth } from './context/AuthContext';

import Login from './pages/Login';
import BusinessSignup from './pages/BusinessSignup';
import Register from './pages/Register';
import Municipalities from './pages/Municipalities';
import AuditLog from './pages/AuditLog';
import Dashboard from './pages/Dashboard';
import Sites from './pages/Sites';
import Vehicles from './pages/Vehicles';
import RoutesPage from './pages/Routes';
import Collections from './pages/Collections';
import Disposal from './pages/Disposal';
import Landfills from './pages/Landfills';
import Incidents from './pages/Incidents';
import Contracts from './pages/Contracts';
import Compliance from './pages/Compliance';
import Reports from './pages/Reports';
import Messages from './pages/Messages';

// A SUPER_ADMIN with nothing selected lands on the municipalities list;
// everyone else (and a SUPER_ADMIN currently viewing a municipality) lands
// on the normal operational dashboard.
function DefaultRedirect() {
  const { isSuperAdmin, viewingBusiness } = useAuth();
  const target = isSuperAdmin && !viewingBusiness ? '/municipalities' : '/dashboard';
  return <Navigate to={target} replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<BusinessSignup />} />

      {/* Authenticated routes share the dashboard shell (sidebar + navbar) */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Platform-level: no municipality needs to be selected yet */}
        <Route
          path="/municipalities"
          element={
            <ProtectedRoute requiredRole="SUPER_ADMIN">
              <Municipalities />
            </ProtectedRoute>
          }
        />

        <Route
          path="/audit-log"
          element={
            <ProtectedRoute requiredRole="SUPER_ADMIN">
              <AuditLog />
            </ProtectedRoute>
          }
        />

        {/* Everything below needs a municipality in context — either the
            caller's own business, or (for SUPER_ADMIN) whichever one
            they've clicked into from /municipalities. */}
        <Route element={<RequireBusinessContext />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/sites" element={<Sites />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/routes" element={<RoutesPage />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/disposal" element={<Disposal />} />
          <Route path="/landfills" element={<Landfills />} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/contracts" element={<Contracts />} />
          <Route path="/compliance" element={<Compliance />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/messages" element={<Messages />} />

          {/* Admin-only: creating new user accounts */}
          <Route
            path="/register"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <Register />
              </ProtectedRoute>
            }
          />
        </Route>
      </Route>

      {/* Fallbacks */}
      <Route path="/" element={<DefaultRedirect />} />
      <Route path="*" element={<DefaultRedirect />} />
    </Routes>
  );
}
