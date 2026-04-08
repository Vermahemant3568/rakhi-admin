import api from './axios';
export const getQueueJobs  = () => api.get('/jobs');
export const getUserPlans  = () => api.get('/user-plans');
