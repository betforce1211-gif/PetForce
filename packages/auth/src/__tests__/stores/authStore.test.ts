// Auth store tests

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../../stores/authStore';

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const store = useAuthStore.getState();
    store.setUser(null);
    store.setTokens(null);
  });

  it('initializes with default state', () => {
    const state = useAuthStore.getState();

    expect(state.user).toBeNull();
    expect(state.tokens).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
  });

  it('sets user correctly', () => {
    const mockUser = {
      id: 'test-id',
      email: 'test@example.com',
      emailVerified: true,
      authMethods: ['email_password' as const],
      twoFactorEnabled: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };

    useAuthStore.getState().setUser(mockUser);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
  });

  it('sets tokens correctly', async () => {
    const mockTokens = {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
    };

    await useAuthStore.getState().setTokens(mockTokens);

    const state = useAuthStore.getState();
    expect(state.tokens).toEqual(mockTokens);
  });

  it('clears auth state on logout', async () => {
    // Set up authenticated state
    const mockUser = {
      id: 'test-id',
      email: 'test@example.com',
      emailVerified: true,
      authMethods: ['email_password' as const],
      twoFactorEnabled: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };

    const mockTokens = {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
    };

    useAuthStore.getState().setUser(mockUser);
    await useAuthStore.getState().setTokens(mockTokens);

    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    // Logout
    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.tokens).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('updates isAuthenticated based on user state', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);

    const mockUser = {
      id: 'test-id',
      email: 'test@example.com',
      emailVerified: true,
      authMethods: ['email_password' as const],
      twoFactorEnabled: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };

    useAuthStore.getState().setUser(mockUser);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    useAuthStore.getState().setUser(null);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
