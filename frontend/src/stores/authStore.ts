import { create } from 'zustand';
import { login as apiLogin, logout as apiLogout, getLoggedUser, clearCsrfToken } from '../api/client';

// Dev mode: bypass Frappe auth when backend is down
const DEV_BYPASS = import.meta.env.DEV;

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
    if (DEV_BYPASS) {
      // Try real backend first, fall back to dev bypass
      try {
        const user = await getLoggedUser();
        if (user && user !== 'Guest') {
          set({ user, loading: false });
          return;
        }
      } catch { /* backend down */ }
      set({ user: null, loading: false });
      return;
    }
    const user = await getLoggedUser();
    set({ user: user && user !== 'Guest' ? user : null, loading: false });
  },

  login: async (usr: string, pwd: string) => {
    if (DEV_BYPASS) {
      // Try real backend first
      try {
        await apiLogin(usr, pwd);
        clearCsrfToken();
        set({ user: usr });
        return;
      } catch {
        // Backend down — allow dev login with any credentials
        console.warn('[DEV] Backend unavailable — using dev bypass login');
        set({ user: usr || 'Administrator' });
        return;
      }
    }
    await apiLogin(usr, pwd);
    clearCsrfToken();
    set({ user: usr });
  },

  logout: async () => {
    if (DEV_BYPASS) {
      try { await apiLogout(); } catch { /* ok */ }
      clearCsrfToken();
      set({ user: null });
      return;
    }
    await apiLogout();
    clearCsrfToken();
    set({ user: null });
  },
}));
