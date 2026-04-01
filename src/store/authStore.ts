import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authFetch } from '../utils/authFetch';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface User {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'user' | 'employee';
  email?: string;
  department?: string;
  permissions: string[];
  systemAccess?: string[];
  pageAccess?: string[];
}

interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
  logout: () => void;
  fetchMe: () => Promise<void>;
  syncWithLocalStorage: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: !!localStorage.getItem('user-name'),
      currentUser: null,

      syncWithLocalStorage: () => {
        const username = localStorage.getItem('user-name');
        const role = localStorage.getItem('role');
        const systemAccessRaw = localStorage.getItem('system_access');
        const pageAccessRaw = localStorage.getItem('page_access');

        if (!username) {
          set({ isAuthenticated: false, currentUser: null });
          return;
        }

        try {
          const systemAccess = systemAccessRaw ? JSON.parse(systemAccessRaw) : [];
          const pageAccess = pageAccessRaw ? JSON.parse(pageAccessRaw) : [];
          
          set({
            isAuthenticated: true,
            currentUser: {
              id: '',
              username: username,
              name: username,
              role: (role as any) || 'user',
              permissions: systemAccess,
              systemAccess,
              pageAccess,
            }
          });
        } catch (e) {
          console.error('Error syncing auth store with localStorage', e);
        }
      },

      fetchMe: async () => {
        try {
          const username = localStorage.getItem('user-name');
          const role = localStorage.getItem('role');
          if (!username) return;

          const res = await authFetch(`${API_BASE_URL}/users/auth/me`, {
             headers: { 
                 'x-user-name': username,
                 'x-user-role': role || 'user'
             }
          });
          if (res.ok) {
             const data = await res.json();
             const currentUser = get().currentUser || {
                 id: '',
                 username: username,
                 name: username,
                 role: (role as any) || 'user',
                 permissions: []
             };

             if (data.permissions) {
                const systemAccess = data.permissions.systemAccess || [];
                const pageAccess = data.permissions.pageAccess || [];
                
                const permissions = systemAccess.map((s: string) =>
                  s.charAt(0).toUpperCase() + s.slice(1)
                ) || [];

                set({
                  isAuthenticated: true,
                  currentUser: {
                    ...currentUser,
                    systemAccess,
                    pageAccess,
                    permissions: Array.from(new Set<string>(permissions))
                  }
                });
             }
          }
        } catch (err) {
          console.error('Failed to fetch me:', err);
        }
      },

      logout: () => {
         // Clear main app session too
         localStorage.removeItem('user-name');
         localStorage.removeItem('role');
         localStorage.removeItem('email_id');
         localStorage.removeItem('system_access');
         localStorage.removeItem('page_access');
         set({ isAuthenticated: false, currentUser: null });
         window.location.href = '/login';
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Initialize from local storage immediately
if (typeof window !== 'undefined') {
  useAuthStore.getState().syncWithLocalStorage();
}

export default useAuthStore;