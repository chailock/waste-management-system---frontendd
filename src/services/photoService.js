import api from './api';

const photoService = {
  getByEntity: async (type, id) => {
    const response = await api.get('/photos/by-entity', { params: { type, id } });
    return response.data;
  },
  upload: async (file, relatedEntityType, relatedEntityId, caption) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('relatedEntityType', relatedEntityType);
    formData.append('relatedEntityId', relatedEntityId);
    if (caption) formData.append('caption', caption);

    const response = await api.post('/photos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  remove: async (id) => {
    await api.delete(`/photos/${id}`);
  },
};

export default photoService;
