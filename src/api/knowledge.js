import api from './axios';
export const getKnowledge   = (p)     => api.get('/knowledge', { params: p });
export const storeKnowledge = (data)  => api.post('/knowledge', data);
export const updateKnowledge= (id, d) => api.put(`/knowledge/${id}`, d);
export const syncKnowledge  = (id)    => api.post(`/knowledge/${id}/sync`);
export const toggleKnowledge= (id)    => api.put(`/knowledge/${id}/toggle`);
export const deleteKnowledge= (id)    => api.delete(`/knowledge/${id}`);
