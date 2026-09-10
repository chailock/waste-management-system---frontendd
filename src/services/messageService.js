import api from './api';

// The communication + document channel with a municipality. Scoped to the
// caller's own business (or, for a SUPER_ADMIN, whichever municipality
// they're currently "viewing as" — see AuthContext/api.js).
const messageService = {
  getAll: async () => {
    const response = await api.get('/messages');
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/messages/${id}`);
    return response.data;
  },
  getAttachments: async (id) => {
    const response = await api.get(`/messages/${id}/attachments`);
    return response.data;
  },
  // Side-effect-free — safe to poll for a badge without marking anything read.
  getUnreadCount: async () => {
    const response = await api.get('/messages/unread-count');
    return response.data;
  },
  send: async (subject, body, files = []) => {
    const formData = new FormData();
    formData.append('subject', subject);
    if (body) formData.append('body', body);
    files.forEach((file) => formData.append('files', file));

    const response = await api.post('/messages', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  // Downloads via blob (not a plain <a href>) because the endpoint is
  // authenticated — documents are private to the sender's/recipient's
  // business, not publicly reachable by URL.
  download: async (messageId, attachment) => {
    const response = await api.get(
      `/messages/${messageId}/attachments/${attachment.id}/download`,
      { responseType: 'blob' }
    );
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', attachment.fileName || 'document');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default messageService;
