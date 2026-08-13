import api from './axiosInstance';

export const getStats = () => api.get('/admin/stats');
export const getAdminFields = () => api.get('/admin/fields');
export const getAdminFarmers = () => api.get('/admin/farmers');
export const getAdminAlerts = () => api.get('/admin/alerts');
export const getYieldMap = () => api.get('/admin/yield-map');
export const runAllChecks = () => api.post('/admin/run-all-checks');
