import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // When a SUPER_ADMIN is "viewing as" a chosen municipality, every request
  // carries that business's id so the backend scopes data to it — this is
  // what lets the super admin reuse every normal manager-dashboard page.
  try {
    const raw = localStorage.getItem('viewingBusiness');
    if (raw) {
      const viewingBusiness = JSON.parse(raw);
      if (viewingBusiness?.id) {
        config.headers['X-Business-Id'] = viewingBusiness.id;
      }
    }
  } catch {
    // ignore malformed storage
  }

  return config;
});

// Handle expired/invalid tokens globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('viewingBusiness');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
