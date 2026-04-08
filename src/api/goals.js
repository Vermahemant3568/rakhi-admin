import api from './axios';
export const getGoals   = ()      => api.get('/goals');
export const storeGoal  = (data)  => api.post('/goals', data);
export const updateGoal = (id, d) => api.put(`/goals/${id}`, d);
export const toggleGoal = (id)    => api.put(`/goals/${id}/toggle`);
export const deleteGoal = (id)    => api.delete(`/goals/${id}`);
