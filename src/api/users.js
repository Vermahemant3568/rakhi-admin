import api from './axios';
export const getUsers    = (p)  => api.get('/users', { params: p });
export const getUser     = (id) => api.get(`/users/${id}`);
export const banUser     = (id) => api.put(`/users/${id}/ban`);
export const unbanUser   = (id) => api.put(`/users/${id}/unban`);
export const getUserChats= (id) => api.get(`/users/${id}/chats`);
export const getUserPlans= (id) => api.get(`/users/${id}/plans`);
export const getUserMeals= (id) => api.get(`/users/${id}/meal-logs`);
