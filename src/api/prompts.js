import api from './axios';
export const getPrompts       = (p)     => api.get('/prompts', { params: p });
export const storePrompt      = (data)  => api.post('/prompts', data);
export const updatePrompt     = (id, d) => api.put(`/prompts/${id}`, d);
export const togglePrompt     = (id)    => api.put(`/prompts/${id}/toggle`);
export const deletePrompt     = (id)    => api.delete(`/prompts/${id}`);
export const getPromptTypes   = ()      => api.get('/prompts/types');
