import api from './axios';
export const getLanguages   = ()      => api.get('/languages');
export const storeLanguage  = (data)  => api.post('/languages', data);
export const updateLanguage = (id, d) => api.put(`/languages/${id}`, d);
export const toggleLanguage = (id)    => api.put(`/languages/${id}/toggle`);
export const deleteLanguage = (id)    => api.delete(`/languages/${id}`);
