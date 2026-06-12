import { create } from 'zustand';
import { login as apiLogin, logout as apiLogout, getLoggedUser, getUserRoles, clearCsrfToken } from '../api/client';

// Active in local dev OR when VITE_MOCK_MODE=true (e.g. Vercel demo without backend)
const DEV_BYPASS = import.meta.env.DEV || import.meta.env.VITE_MOCK_MODE === 'true';

// Frappe's built-in admin role. The literal `Administrator` account has every role
// implicitly but isn't returned by the roles query, so treat it as admin directly —
// this also keeps the admin UI visible in local dev where there's no backend.
const ADMIN_ROLE = 'System Manager';
function computeIsAdmin(user: string | null, roles: string[]): boolean {
  return user === 'Administrator' || roles.includes(ADMIN_ROLE);
}

interface AuthState {
  user: string | null;
  roles: string[];
  isAdmin: boolean;
  loading: boolean;
  checkAuth: () => Promise<void>;
  login: (usr: string, pwd: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => {
  // Resolve a signed-in user into full auth state: fetch their roles and derive isAdmin.
  const applyUser = async (user: string | null) => {
    const roles = user ? await getUserRoles(user) : [];
    set({ user, roles, isAdmin: computeIsAdmin(user, roles), loading: false });
  };

  return {
    user: null,
    roles: [],
    isAdmin: false,
    loading: true,

    checkAuth: async () => {
      set({ loading: true });
      if (DEV_BYPASS) {
        // Try real backend first, fall back to dev bypass
        try {
          const user = await getLoggedUser();
          if (user && user !== 'Guest') {
            await applyUser(user);
            return;
          }
        } catch { /* backend down */ }
        await applyUser(null);
        return;
      }
      const user = await getLoggedUser();
      await applyUser(user && user !== 'Guest' ? user : null);
    },

    login: async (usr: string, pwd: string) => {
      if (DEV_BYPASS) {
        // Try real backend first
        try {
          await apiLogin(usr, pwd);
          clearCsrfToken();
          await applyUser(usr);
          return;
        } catch {
          // Backend down — allow dev login with any credentials
          console.warn('[DEV] Backend unavailable — using dev bypass login');
          await applyUser(usr || 'Administrator');
          return;
        }
      }
      await apiLogin(usr, pwd);
      clearCsrfToken();
      await applyUser(usr);
    },

    logout: async () => {
      if (DEV_BYPASS) {
        try { await apiLogout(); } catch { /* ok */ }
        clearCsrfToken();
        set({ user: null, roles: [], isAdmin: false });
        return;
      }
      await apiLogout();
      clearCsrfToken();
      set({ user: null, roles: [], isAdmin: false });
    },
  };
});
