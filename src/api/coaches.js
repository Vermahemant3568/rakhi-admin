import api from './axios';
export const getCoaches    = ()      => api.get('/coaches');
export const storeCoach    = (data)  => api.post('/coaches', data);
export const updateCoach   = (id, d) => api.put(`/coaches/${id}`, d);
export const toggleCoach   = (id)    => api.put(`/coaches/${id}/toggle`);
export const toggleLaunch  = (id)    => api.put(`/coaches/${id}/toggle-launch`);
export const deleteCoach   = (id)    => api.delete(`/coaches/${id}`);
