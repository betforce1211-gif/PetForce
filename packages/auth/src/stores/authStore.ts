// Zustand Auth Store
// Centralized state management for authentication

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, AuthTokens } from '../types/auth';
import { storeTokens, getTokens, clearTokens } from '../utils/storage';

export interface AuthState {
  // State
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean; // Tracks if state has been loaded from storage

  // Actions
  setUser: (user: User | null) => void;
  setTokens: (tokens: AuthTokens | null) => Promise<void>;
  setLoading: (isLoading: boolean) => void;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  setHydrated: (isHydrated: boolean) => void;
}

/**
 * Auth store using Zustand
 * Persists to secure storage (sessionStorage on web, keychain on mobile)
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: true, // Start as loading until hydrated
      isHydrated: false,

      // Set user
      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user,
        });
      },

      // Set tokens (stores securely)
      setTokens: async (tokens) => {
        if (tokens) {
          try {
            await storeTokens(tokens);
            set({ tokens, isAuthenticated: !!get().user });
          } catch (error) {
            console.error('Failed to store tokens:', error);
          }
        } else {
          try {
            await clearTokens();
            set({ tokens: null, isAuthenticated: false });
          } catch (error) {
            console.error('Failed to clear tokens:', error);
          }
        }
      },

      // Set loading state
      setLoading: (isLoading) => {
        set({ isLoading });
      },

      // Logout (clears all state)
      logout: async () => {
        try {
          await clearTokens();
          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error) {
          console.error('Failed to logout:', error);
        }
      },

      // Refresh session (reload tokens from storage)
      refreshSession: async () => {
        set({ isLoading: true });
        try {
          const tokens = await getTokens();
          if (tokens) {
            set({ tokens });
          } else {
            // No tokens found, clear state
            set({
              user: null,
              tokens: null,
              isAuthenticated: false,
            });
          }
        } catch (error) {
          console.error('Failed to refresh session:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      // Set hydrated (called after initial load from storage)
      setHydrated: (isHydrated) => {
        set({ isHydrated, isLoading: !isHydrated });
      },
    }),
    {
      name: 'petforce-auth',
      storage: createJSONStorage(() => {
        // Use sessionStorage on web, will be enhanced for React Native
        if (typeof sessionStorage !== 'undefined') {
          return sessionStorage;
        }
        // Fallback to in-memory storage
        return {
          getItem: (name) => {
            // @ts-ignore
            return global.__petforceAuthStore?.[name] || null;
          },
          setItem: (name, value) => {
            // @ts-ignore
            if (!global.__petforceAuthStore) {
              // @ts-ignore
              global.__petforceAuthStore = {};
            }
            // @ts-ignore
            global.__petforceAuthStore[name] = value;
          },
          removeItem: (name) => {
            // @ts-ignore
            if (global.__petforceAuthStore) {
              // @ts-ignore
              delete global.__petforceAuthStore[name];
            }
          },
        };
      }),
      // Only persist user data, not tokens (tokens are stored separately in secure storage)
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      // Called after state is loaded from storage
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error('Failed to hydrate auth store:', error);
          }
          if (state) {
            state.setHydrated(true);
          }
        };
      },
    }
  )
);
