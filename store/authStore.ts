import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  username?: string;
  bio?: string;
  website?: string;
  country?: string;
  avatarUrl?: string;
  farmTypeId?: string;
  socialLinks?: Array<{ platform: string; url: string }>;
  createdAt?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  updateUser: (userData: Partial<User>) => void;
}

// In-memory fallback for when native storage fails
const memoryStorage: Record<string, string> = {};

// Safer AsyncStorage wrapper to prevent "Native module is null" errors
const customStorage = {
  getItem: async (name: string) => {
    try {
      const value = await AsyncStorage.getItem(name);
      return value ?? memoryStorage[name] ?? null;
    } catch (e) {
      return memoryStorage[name] ?? null;
    }
  },
  setItem: async (name: string, value: string) => {
    memoryStorage[name] = value;
    try {
      await AsyncStorage.setItem(name, value);
    } catch (e) {
      // Native save failed, but it's now in memory fallback
    }
  },
  removeItem: async (name: string) => {
    delete memoryStorage[name];
    try {
      await AsyncStorage.removeItem(name);
    } catch (e) {
      // Native remove failed
    }
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      clearAuth: () => set({ user: null, token: null }),
      updateUser: (userData) => 
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => customStorage),
    }
  )
);
