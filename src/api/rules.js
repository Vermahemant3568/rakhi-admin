import api from './axios';
export const getRules     = (p)     => api.get('/rules', { params: p });
export const storeRule    = (data)  => api.post('/rules', data);
export const updateRule   = (id, d) => api.put(`/rules/${id}`, d);
export const toggleRule   = (id)    => api.put(`/rules/${id}/toggle`);
export const deleteRule   = (id)    => api.delete(`/rules/${id}`);
export const getRuleTypes = ()      => api.get('/rules/types');
