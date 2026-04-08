import { create } from 'zustand';

const useAuthStore = create((set) => ({
  admin: null,
  token: localStorage.getItem('rakhi_admin_token') || null,

  setAuth: (admin, token) => {
    localStorage.setItem('rakhi_admin_token', token);
    set({ admin, token });
  },

  logout: () => {
    localStorage.removeItem('rakhi_admin_token');
    set({ admin: null, token: null });
  },
}));

export default useAuthStore;
