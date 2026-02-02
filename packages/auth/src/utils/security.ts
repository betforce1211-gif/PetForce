/**
 * Security Utilities for Household Management
 *
 * Provides XSS sanitization and input validation to protect against security vulnerabilities.
 * All user-generated content should be sanitized before database insertion or display.
 *
 * Security Requirements (Samantha's P0 Critical):
 * - Strip HTML tags from all text inputs
 * - Escape special characters that could be used for XSS attacks
 * - Validate input length and format
 * - Log all sanitization events for security auditing
 */

import { logger } from './logger';

// =============================================================================
// XSS SANITIZATION
// =============================================================================

/**
 * Sanitize household name to prevent XSS attacks.
 *
 * Strips HTML tags, escapes special characters, and validates length.
 * Household names should only contain alphanumeric characters and spaces.
 *
 * @param name - Raw household name from user input
 * @returns Sanitized household name safe for storage and display
 */
export function sanitizeHouseholdName(name: string): string {
  if (!name) {
    return '';
  }

  // Remove leading/trailing whitespace
  let sanitized = name.trim();

  // Strip all HTML tags (simple regex approach for backend)
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Remove any null bytes (could be used for SQL injection)
  sanitized = sanitized.replace(/\0/g, '');

  // Remove control characters except newlines and tabs (then remove those too)
  sanitized = sanitized.replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  // Replace multiple spaces with single space
  sanitized = sanitized.replace(/\s+/g, ' ');

  // Remove any characters that aren't alphanumeric or spaces
  // This enforces the validation rule in household-api.ts
  sanitized = sanitized.replace(/[^A-Za-z0-9 ]/g, '');

  // Truncate to maximum length (50 characters)
  sanitized = sanitized.substring(0, 50);

  // Log if sanitization changed the input (potential attack attempt)
  if (sanitized !== name.trim()) {
    logger.securityEvent('household_name_sanitized', {
      originalLength: name.length,
      sanitizedLength: sanitized.length,
      hadHtmlTags: /<[^>]*>/.test(name),
      hadSpecialChars: /[^A-Za-z0-9 ]/.test(name),
    });
  }

  return sanitized;
}

/**
 * Sanitize household description to prevent XSS attacks.
 *
 * Strips HTML tags, escapes special characters, but allows more characters
 * than household name (punctuation, etc.) for better user experience.
 *
 * @param description - Raw household description from user input
 * @returns Sanitized household description safe for storage and display
 */
export function sanitizeDescription(description: string): string {
  if (!description) {
    return '';
  }

  // Remove leading/trailing whitespace
  let sanitized = description.trim();

  // Strip all HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Remove any null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  // Escape HTML entities for extra safety
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  // Replace multiple spaces/newlines with single space
  sanitized = sanitized.replace(/\s+/g, ' ');

  // Truncate to maximum length (200 characters)
  sanitized = sanitized.substring(0, 200);

  // Log if sanitization changed the input
  if (sanitized !== description.trim()) {
    logger.securityEvent('household_description_sanitized', {
      originalLength: description.length,
      sanitizedLength: sanitized.length,
      hadHtmlTags: /<[^>]*>/.test(description),
      hadEntities: /[&<>"'\/]/.test(description),
    });
  }

  return sanitized;
}

/**
 * Validate and sanitize email addresses.
 *
 * Ensures email format is valid and safe for database storage.
 *
 * @param email - Raw email address from user input
 * @returns Sanitized email in lowercase, or null if invalid
 */
export function sanitizeEmail(email: string): string | null {
  if (!email) {
    return null;
  }

  // Remove whitespace and convert to lowercase
  const sanitized = email.trim().toLowerCase();

  // Validate email format (basic regex)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    return null;
  }

  // Check for common XSS patterns in email
  if (/<|>|script|javascript|onerror|onload/i.test(sanitized)) {
    logger.securityEvent('suspicious_email_format', {
      emailLength: sanitized.length,
      hadSuspiciousPattern: true,
    });
    return null;
  }

  return sanitized;
}

/**
 * Sanitize user-provided text for general use.
 *
 * More permissive than household name sanitization, but still safe.
 * Useful for personal messages, notes, etc.
 *
 * @param text - Raw text from user input
 * @param maxLength - Maximum allowed length (default 500)
 * @returns Sanitized text safe for storage and display
 */
export function sanitizeText(text: string, maxLength: number = 500): string {
  if (!text) {
    return '';
  }

  let sanitized = text.trim();

  // Strip HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove dangerous control characters
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  // Escape HTML entities
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  // Truncate to max length
  sanitized = sanitized.substring(0, maxLength);

  return sanitized;
}

// =============================================================================
// SECURITY VALIDATION
// =============================================================================

/**
 * Check if input contains suspicious patterns that might indicate an attack.
 *
 * @param input - User input to validate
 * @returns true if suspicious patterns detected, false otherwise
 */
export function containsSuspiciousPatterns(input: string): boolean {
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers like onclick=, onerror=
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /eval\(/i,
    /expression\(/i,
    /vbscript:/i,
    /data:text\/html/i,
  ];

  return suspiciousPatterns.some(pattern => pattern.test(input));
}

/**
 * Validate that input doesn't exceed rate limits for security.
 *
 * Checks for abnormally long inputs that might indicate a DoS attack.
 *
 * @param input - User input to validate
 * @param maxLength - Maximum allowed length
 * @returns true if valid, false if exceeds limits
 */
export function validateInputLength(input: string, maxLength: number): boolean {
  if (!input) {
    return true;
  }

  if (input.length > maxLength * 2) {
    logger.securityEvent('excessive_input_length_detected', {
      inputLength: input.length,
      maxAllowed: maxLength,
      ratio: input.length / maxLength,
    });
    return false;
  }

  return input.length <= maxLength;
}
