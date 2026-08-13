import api from './axiosInstance';

export const getEvents = (fieldId) =>
  api.get('/events', { params: fieldId ? { fieldId } : {} });
export const getUnreadCount = () => api.get('/events/unread-count');
export const markRead = (id) => api.patch(`/events/${id}/read`);
