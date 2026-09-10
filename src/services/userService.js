import api from './api';

const userService = {
  getMe: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  updateNotificationPreference: async (emailNotificationsEnabled) => {
    const response = await api.patch('/users/me/notifications', { emailNotificationsEnabled });
    return response.data;
  },
};

export default userService;
