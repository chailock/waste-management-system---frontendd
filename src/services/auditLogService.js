import api from './api';

// SUPER_ADMIN only — platform-wide activity trail.
const auditLogService = {
  getRecent: async (businessId) => {
    const response = await api.get('/audit-logs', { params: businessId ? { businessId } : {} });
    return response.data;
  },
};

export default auditLogService;
