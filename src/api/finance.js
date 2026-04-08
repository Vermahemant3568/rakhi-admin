import api from './axios';
export const getFinance = () => api.get('/finance');
