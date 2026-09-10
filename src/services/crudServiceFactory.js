import api from './api';

/**
 * Generic CRUD service factory — keeps every entity service file thin
 * and consistent while still exposing a dedicated, named module per
 * resource (siteService, vehicleService, etc.) as requested by the
 * project structure.
 */
export default function createCrudService(resourcePath) {
  return {
    getAll: async () => {
      const response = await api.get(resourcePath);
      return response.data;
    },
    getById: async (id) => {
      const response = await api.get(`${resourcePath}/${id}`);
      return response.data;
    },
    create: async (payload) => {
      const response = await api.post(resourcePath, payload);
      return response.data;
    },
    update: async (id, payload) => {
      const response = await api.put(`${resourcePath}/${id}`, payload);
      return response.data;
    },
    remove: async (id) => {
      await api.delete(`${resourcePath}/${id}`);
    },
  };
}
