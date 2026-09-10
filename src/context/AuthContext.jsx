import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

const VIEWING_BUSINESS_KEY = 'viewingBusiness';

function getStoredViewingBusiness() {
  try {
    const raw = localStorage.getItem(VIEWING_BUSINESS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(authService.getCurrentUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // When a SUPER_ADMIN clicks into a municipality, this holds
  // { id, name } for that business. Every API call then carries an
  // X-Business-Id header for that id (see services/api.js), which is how
  // the super admin sees "everything on the manager dashboard" for that
  // municipality using the exact same pages/endpoints as a normal user.
  const [viewingBusiness, setViewingBusinessState] = useState(getStoredViewingBusiness());

  useEffect(() => {
    // Keep state in sync if the token is cleared elsewhere (e.g. 401 interceptor)
    const handleStorage = () => {
      setUser(authService.getCurrentUser());
      setViewingBusinessState(getStoredViewingBusiness());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const login = useCallback(async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.login(username, password);
      setUser(data);
      return data;
    } catch (err) {
      const message = err.response?.data?.message || 'Invalid username or password';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      return await authService.register(payload);
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const registerBusiness = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      return await authService.registerBusiness(payload);
    } catch (err) {
      const message = err.response?.data?.message || 'Sign up failed';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    localStorage.removeItem(VIEWING_BUSINESS_KEY);
    setUser(null);
    setViewingBusinessState(null);
  }, []);

  const enterBusiness = useCallback((business) => {
    const value = { id: business.id, name: business.name };
    localStorage.setItem(VIEWING_BUSINESS_KEY, JSON.stringify(value));
    setViewingBusinessState(value);
  }, []);

  const exitBusiness = useCallback(() => {
    localStorage.removeItem(VIEWING_BUSINESS_KEY);
    setViewingBusinessState(null);
  }, []);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER';

  const value = {
    user,
    loading,
    error,
    login,
    register,
    registerBusiness,
    logout,
    isAdmin,
    isManager,
    isSuperAdmin,
    isAuthenticated: !!user,
    viewingBusiness,
    enterBusiness,
    exitBusiness,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
