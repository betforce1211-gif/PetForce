// Authentication types for PetForce
// Shared across web and mobile applications

export type AuthMethod =
  | 'email_password'
  | 'magic_link'
  | 'google_sso'
  | 'apple_sso'
  | 'biometric';

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  firstName?: string;
  lastName?: string;
  profilePhotoUrl?: string;
  authMethods: AuthMethod[];
  preferredAuthMethod?: AuthMethod;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface MagicLinkRequest {
  email: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export interface EmailVerificationRequest {
  token: string;
}

// Error types
export interface AuthError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// OAuth types
export interface OAuthConnection {
  id: string;
  provider: 'google' | 'apple';
  email: string;
  providerData: {
    name?: string;
    picture?: string;
  };
  createdAt: string;
}

// Biometric types
export interface BiometricDevice {
  id: string;
  deviceId: string;
  deviceName: string;
  biometricType: 'face_id' | 'touch_id';
  lastUsedAt?: string;
  createdAt: string;
}

// 2FA types
export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface TwoFactorVerifyRequest {
  code: string;
}
