import { create } from 'zustand';
import { login as apiLogin, logout as apiLogout, getLoggedUser, clearCsrfToken } from '../api/client';

interface AuthState {
  user: string | null;
  loading: boolean;
  checkAuth: () => Promise<void>;
  login: (usr: string, pwd: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  checkAuth: async () => {
    set({ loading: true });
    const user = await getLoggedUser();
    set({ user: user && user !== 'Guest' ? user : null, loading: false });
  },

  login: async (usr: string, pwd: string) => {
    await apiLogin(usr, pwd);
    clearCsrfToken();
    set({ user: usr });
  },

  logout: async () => {
    await apiLogout();
    clearCsrfToken();
    set({ user: null });
  },
}));
