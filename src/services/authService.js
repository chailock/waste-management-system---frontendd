import api from './api';

const authService = {
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },

  register: async (payload) => {
    const response = await api.post('/auth/register', payload);
    return response.data;
  },

  // Public: creates a brand-new Business (tenant) plus its first user,
  // who becomes that business's ADMIN. Does not log the user in — they
  // sign in afterwards like any other user.
  registerBusiness: async (payload) => {
    const response = await api.post('/auth/register-business', payload);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};

export default authService;
