import api from './api';

// SUPER_ADMIN only — the "all municipalities" overview.
const businessService = {
  getAll: async () => {
    const response = await api.get('/businesses');
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/businesses/${id}`);
    return response.data;
  },
  // Side-effect-free — sum of unread messages across every municipality, for the sidebar badge.
  getUnreadCount: async () => {
    const response = await api.get('/businesses/unread-count');
    return response.data;
  },
  // Suspend (active=false) or reactivate (active=true) a municipality —
  // immediately blocks/restores login for its staff.
  setActive: async (id, active) => {
    const response = await api.patch(`/businesses/${id}/active`, { active });
    return response.data;
  },
  // Recovery path: create the first staff account for a municipality that
  // currently has none. Rejected server-side if it already has staff.
  addFirstStaff: async (id, payload) => {
    const response = await api.post(`/businesses/${id}/staff`, payload);
    return response.data;
  },
};

export default businessService;
