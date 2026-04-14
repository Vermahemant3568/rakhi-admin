import axios from 'axios';

const api = axios.create({
  baseURL: 'https://13.234.114.78/api/admin',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rakhi_admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('rakhi_admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
