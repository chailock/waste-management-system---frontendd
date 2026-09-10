import api from './api';
import createCrudService from './crudServiceFactory';

const baseReportService = createCrudService('/reports');

const reportService = {
  ...baseReportService,
  generate: async (month, year, notes) => {
    const response = await api.post('/reports/generate', null, {
      params: { month, year, notes },
    });
    return response.data;
  },
  getDashboardStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },
};

export default reportService;
