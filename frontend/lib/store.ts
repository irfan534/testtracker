import { create } from 'zustand';
import { User, UserRole } from '@/types';

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  mfaEnabled: boolean;
  tempToken: string | null;
  pending2FAUser: { id: string; email: string; firstName: string; lastName: string } | null;
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  setAuthenticated: (value: boolean) => void;
  setMfaEnabled: (value: boolean) => void;
  setTempToken: (token: string | null) => void;
  setPending2FAUser: (user: { id: string; email: string; firstName: string; lastName: string } | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  mfaEnabled: false,
  tempToken: null,
  pending2FAUser: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setAccessToken: (token) => set({ accessToken: token }),
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  setMfaEnabled: (value) => set({ mfaEnabled: value }),
  setTempToken: (token) => set({ tempToken: token }),
  setPending2FAUser: (user) => set({ pending2FAUser: user }),

  logout: () => set({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    mfaEnabled: false,
    tempToken: null,
    pending2FAUser: null,
  }),
}));

// UI Store
interface UIStore {
  sidebarOpen: boolean;
  setSidebarOpen: (value: boolean) => void;
  toggleSidebar: () => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (value) => set({ sidebarOpen: value }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  theme: 'light',
  setTheme: (theme) => set({ theme }),
}));
