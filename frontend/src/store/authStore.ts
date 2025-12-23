import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string | null;
  role: 'USER' | 'ADMIN' | 'AFFILIATE';
  affiliateCode?: string | null;
  orderCount?: number;
}

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  incrementOrderCount: () => void;
  checkAuth: () => Promise<void>;
  hasHydrated?: boolean;
}

import axios from 'axios';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      incrementOrderCount: () => set((state) => ({
          user: state.user ? { ...state.user, orderCount: (state.user.orderCount || 0) + 1 } : null
      })),
      checkAuth: async () => {
          const token = get().token;
          if (!token) return;
          try {
              const res = await axios.get('/api/auth/me', {
                  headers: { Authorization: `Bearer ${token}` }
              });
              set({ user: res.data });
          } catch (error) {
              console.error("Auth check failed", error);
              // distinct handling? maybe logout if 401?
              // keeping it simple for now to avoid loops
          }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => {
          if (typeof window !== 'undefined') {
              return localStorage;
          }
          return {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
          };
      }),
      onRehydrateStorage: () => (state) => {
          if (state) {
             state.hasHydrated = true;
          }
      }
    }
  )
);
