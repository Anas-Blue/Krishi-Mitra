import api from './axiosInstance';

export const getFields = () => api.get('/fields');
export const getField = (id) => api.get(`/fields/${id}`);
export const createField = (data) => api.post('/fields', data);
export const updateField = (id, data) => api.put(`/fields/${id}`, data);
export const deleteField = (id) => api.delete(`/fields/${id}`);
export const checkField = (id) => api.post(`/fields/${id}/check`);
export const uploadPhoto = (id, formData) =>
  api.post(`/fields/${id}/photo`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const harvestField = (id, actualYield) =>
  api.post(`/fields/${id}/harvest`, { actualYield });
export const getFieldWeather = (id) => api.get(`/fields/${id}/weather`);
