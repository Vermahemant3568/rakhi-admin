import api from './axios';
export const getPlans   = ()      => api.get('/plans');
export const storePlan  = (data)  => api.post('/plans', data);
export const updatePlan = (id, d) => api.put(`/plans/${id}`, d);
export const togglePlan = (id)    => api.put(`/plans/${id}/toggle`);
