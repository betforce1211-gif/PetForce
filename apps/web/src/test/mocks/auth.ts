// Mock authentication utilities for testing

import { vi } from 'vitest';
import type { User, AuthTokens, AuthError } from '@petforce/auth';

export const mockUser: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  emailVerified: true,
  firstName: 'Test',
  lastName: 'User',
  authMethods: ['email_password'],
  preferredAuthMethod: 'email_password',
  twoFactorEnabled: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

export const mockTokens: AuthTokens = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  expiresIn: 3600,
};

export const mockAuthError: AuthError = {
  code: 'AUTH_ERROR',
  message: 'Authentication failed',
};

// Mock useAuth hook
export const mockUseAuth = {
  loginWithPassword: vi.fn(),
  registerWithPassword: vi.fn(),
  logout: vi.fn(),
  isLoading: false,
  error: null,
  user: null,
};

// Mock useAuthStore
export const mockUseAuthStore = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: false,
  isHydrated: true,
  setUser: vi.fn(),
  setTokens: vi.fn(),
  logout: vi.fn(),
  refreshSession: vi.fn(),
};

// Mock useOAuth hook
export const mockUseOAuth = {
  loginWithGoogle: vi.fn(),
  loginWithApple: vi.fn(),
  isLoading: false,
  error: null,
};

// Mock useMagicLink hook
export const mockUseMagicLink = {
  sendLink: vi.fn(),
  isLoading: false,
  error: null,
  emailSent: false,
};

// Mock usePasswordReset hook
export const mockUsePasswordReset = {
  sendResetEmail: vi.fn(),
  resetPassword: vi.fn(),
  isLoading: false,
  error: null,
  emailSent: false,
  resetComplete: false,
};
