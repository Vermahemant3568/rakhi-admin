import api from './axios';
export const getServices   = ()     => api.get('/api-manager');
export const toggleService = (id)   => api.put(`/api-manager/${id}/toggle`);
export const getLLMs       = ()     => api.get('/llm-configs');
export const activateLLM   = (id)   => api.put(`/llm-configs/${id}/activate`);
export const storeLLM      = (data) => api.post('/llm-configs', data);
export const updateLLM     = (id, data) => api.put(`/llm-configs/${id}`, data);
