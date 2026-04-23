import api from './axios';

export const getQueueJobs  = () => api.get('/jobs');
export const getUserPlans  = () => api.get('/user-plans');
export const clearAllFailed = () => api.delete('/jobs/clear-all-failed');
export const retryAllFailed = () => api.post('/jobs/retry-all-failed');
export const deleteFailedJob = (id) => api.delete(`/jobs/failed/${id}`);
export const regenerateUserPlans = (userId) => api.post(`/users/${userId}/regenerate-plans`);
