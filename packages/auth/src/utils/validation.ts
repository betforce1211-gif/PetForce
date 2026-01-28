import { z } from 'zod';
import {
  EMAIL_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_STRONG_MIN_LENGTH,
  PASSWORD_STRENGTH_THRESHOLD_WEAK,
  PASSWORD_STRENGTH_THRESHOLD_MEDIUM,
  PASSWORD_STRENGTH_MAX_SCORE,
  PASSWORD_STRENGTH_COLORS,
} from '../config/constants';

// Email validation
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .min(1, 'Email is required')
  .max(EMAIL_MAX_LENGTH, 'Email is too long');

// Password validation
// Minimum 8 characters, at least one uppercase, one lowercase, one number
export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH, 'Password is too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// Registration schema
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().max(PASSWORD_MAX_LENGTH).optional(),
  lastName: z.string().max(PASSWORD_MAX_LENGTH).optional(),
});

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Magic link schema
export const magicLinkSchema = z.object({
  email: emailSchema,
});

// Password reset schema
export const passwordResetSchema = z.object({
  email: emailSchema,
});

// Password reset confirm schema
export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: passwordSchema,
});

// Password change schema
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

// Helper to validate email format
export function isValidEmail(email: string): boolean {
  try {
    emailSchema.parse(email);
    return true;
  } catch {
    return false;
  }
}

// Helper to get password strength
export function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  if (password.length < PASSWORD_MIN_LENGTH) return 'weak';

  let strength = 0;

  if (password.length >= PASSWORD_STRONG_MIN_LENGTH) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++; // Special characters

  if (strength <= PASSWORD_STRENGTH_THRESHOLD_WEAK) return 'weak';
  if (strength <= PASSWORD_STRENGTH_THRESHOLD_MEDIUM) return 'medium';
  return 'strong';
}

/**
 * Calculate detailed password strength for UI feedback
 * Returns score, label, and color for visual indicators
 */
export function calculatePasswordStrength(password: string): {
  score: number; // 0-4
  label: 'Weak' | 'Fair' | 'Good' | 'Strong';
  color: string;
} {
  let score = 0;

  if (password.length >= PASSWORD_MIN_LENGTH) score++;
  if (password.length >= PASSWORD_STRONG_MIN_LENGTH) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const labels: ('Weak' | 'Fair' | 'Good' | 'Strong')[] = ['Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = [
    PASSWORD_STRENGTH_COLORS.WEAK,
    PASSWORD_STRENGTH_COLORS.WEAK,
    PASSWORD_STRENGTH_COLORS.FAIR,
    PASSWORD_STRENGTH_COLORS.GOOD,
    PASSWORD_STRENGTH_COLORS.STRONG,
  ];

  return {
    score: Math.min(score, PASSWORD_STRENGTH_MAX_SCORE),
    label: labels[score],
    color: colors[score],
  };
}

/**
 * Check if email exists in the database
 * Note: This should be called sparingly to prevent email enumeration attacks
 */
export async function checkEmailExists(_email: string): Promise<boolean> {
  // This will be implemented with the actual API call
  // For now, return false (will be enhanced in Phase 2)
  // In production, this should rate-limit and may obfuscate results for security
  return Promise.resolve(false);
}

// Helper to validate password complexity
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
