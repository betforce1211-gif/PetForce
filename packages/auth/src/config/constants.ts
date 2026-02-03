// Authentication Constants
// Centralized configuration for all magic numbers in auth package

/**
 * Token and Session Configuration
 */
export const TOKEN_EXPIRY_SECONDS = 900; // 15 minutes default access token expiry
export const REFRESH_TOKEN_EXPIRY_DAYS = 7; // Default refresh token expiry

/**
 * Password Validation Rules
 */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 100;
export const PASSWORD_STRONG_MIN_LENGTH = 12;

/**
 * Email Validation Rules
 */
export const EMAIL_MAX_LENGTH = 255;

/**
 * Password Strength Scoring
 */
export const PASSWORD_STRENGTH_THRESHOLD_WEAK = 2;
export const PASSWORD_STRENGTH_THRESHOLD_MEDIUM = 4;
export const PASSWORD_STRENGTH_MAX_SCORE = 4;

/**
 * Password Strength UI Colors
 */
export const PASSWORD_STRENGTH_COLORS = {
  WEAK: '#EF4444',
  FAIR: '#FFC107',
  GOOD: '#4CAF50',
  STRONG: '#2D9B87',
} as const;

/**
 * Platform-specific Redirect URLs
 */
export const REDIRECT_PATHS = {
  AUTH_CALLBACK: '/auth/callback',
  AUTH_VERIFY: '/auth/verify-email',
  PASSWORD_RESET: '/auth/reset-password',
  NATIVE_CALLBACK: 'petforce://auth/callback',
} as const;

/**
 * Error Codes
 */
export const AUTH_ERROR_CODES = {
  UNEXPECTED_ERROR: 'UNEXPECTED_ERROR',
  REGISTRATION_ERROR: 'REGISTRATION_ERROR',
  LOGIN_ERROR: 'LOGIN_ERROR',
  LOGOUT_ERROR: 'LOGOUT_ERROR',
  MAGIC_LINK_ERROR: 'MAGIC_LINK_ERROR',
  VERIFICATION_ERROR: 'VERIFICATION_ERROR',
  RESEND_ERROR: 'RESEND_ERROR',
  PASSWORD_RESET_ERROR: 'PASSWORD_RESET_ERROR',
  GET_USER_ERROR: 'GET_USER_ERROR',
  REFRESH_ERROR: 'REFRESH_ERROR',
  OAUTH_ERROR: 'OAUTH_ERROR',
  OAUTH_CALLBACK_ERROR: 'OAUTH_CALLBACK_ERROR',
  EMAIL_NOT_CONFIRMED: 'EMAIL_NOT_CONFIRMED',
  BIOMETRIC_CHECK_ERROR: 'BIOMETRIC_CHECK_ERROR',
  BIOMETRIC_AUTH_FAILED: 'BIOMETRIC_AUTH_FAILED',
  BIOMETRIC_AUTH_ERROR: 'BIOMETRIC_AUTH_ERROR',
  BIOMETRIC_ENROLL_ERROR: 'BIOMETRIC_ENROLL_ERROR',
  BIOMETRIC_DISABLE_ERROR: 'BIOMETRIC_DISABLE_ERROR',
  NOT_AVAILABLE: 'NOT_AVAILABLE',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
} as const;

/**
 * OAuth Configuration
 */
export const OAUTH_CONFIG = {
  GOOGLE_SCOPES: 'email profile',
} as const;

/**
 * Biometric Authentication Configuration
 */
export const BIOMETRIC_CONFIG = {
  DEFAULT_PROMPT_MESSAGE: 'Authenticate to access PetForce',
  FALLBACK_LABEL: 'Use passcode',
  DISABLE_DEVICE_FALLBACK: false,
} as const;
