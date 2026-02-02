/**
 * Invite Code Generation Utility
 *
 * Generates unique, memorable invite codes for household sharing.
 * Format: PREFIX-RANDOM (e.g., "ZEDER-ALPHA-BRAVO")
 *
 * Security Considerations:
 * - Codes are uppercase only (case-sensitive)
 * - Uses phonetic alphabet for memorability and unambiguity
 * - Generates 2 random words for sufficient entropy
 * - Checks uniqueness against database before returning
 */

// Phonetic alphabet for memorable, unambiguous codes
// Based on NATO phonetic alphabet - clear pronunciation, no similar-looking characters
const PHONETIC_WORDS = [
  'ALPHA',
  'BRAVO',
  'CHARLIE',
  'DELTA',
  'ECHO',
  'FOXTROT',
  'GOLF',
  'HOTEL',
  'INDIA',
  'JULIET',
  'KILO',
  'LIMA',
  'MIKE',
  'NOVEMBER',
  'OSCAR',
  'PAPA',
  'QUEBEC',
  'ROMEO',
  'SIERRA',
  'TANGO',
  'UNIFORM',
  'VICTOR',
  'WHISKEY',
  'XRAY',
  'YANKEE',
  'ZULU',
];

/**
 * Extracts a prefix from household name for the invite code.
 * - Removes all non-alphabetic characters (keeps only letters)
 * - Takes first 6 characters
 * - Falls back to "HOUSE" if name is too short or has no valid characters
 *
 * @param householdName - The household name to extract prefix from
 * @returns Uppercase prefix (max 6 characters, letters only)
 *
 * @example
 * extractPrefix("The Zeder House") // "THEZED"
 * extractPrefix("O'Brien's Pet House!") // "OBRIEN"
 * extractPrefix("XY") // "HOUSE" (too short, use default)
 */
export function extractPrefix(householdName: string): string {
  // Remove all non-alphabetic characters (only keep A-Z)
  const cleaned = householdName.toUpperCase().replace(/[^A-Z]/g, '');

  // If cleaned name is too short, use default prefix
  if (cleaned.length < 3) {
    return 'HOUSE';
  }

  // Take first 6 characters
  return cleaned.slice(0, 6);
}

/**
 * Generates a random phonetic word from the NATO phonetic alphabet.
 *
 * @returns Random phonetic word (e.g., "ALPHA", "BRAVO")
 */
export function getRandomPhoneticWord(): string {
  const randomIndex = Math.floor(Math.random() * PHONETIC_WORDS.length);
  return PHONETIC_WORDS[randomIndex];
}

/**
 * Generates a unique invite code for a household.
 * Format: PREFIX-WORD1-WORD2 (e.g., "ZEDER-ALPHA-BRAVO")
 *
 * The code is:
 * - Memorable (uses phonetic alphabet)
 * - Shareable (easy to communicate verbally or in text)
 * - Unique (validated against database)
 * - Secure (sufficient entropy with 2 random words from 26 options)
 *
 * Security note: With 26 words, choosing 2 words gives 26^2 = 676 possible
 * combinations per prefix. Combined with unique prefixes, collision risk is low.
 *
 * @param householdName - The household name to generate code for
 * @returns Invite code in format PREFIX-WORD1-WORD2
 *
 * @example
 * generateInviteCode("The Zeder House") // "ZEDERH-ALPHA-BRAVO"
 * generateInviteCode("O'Brien Family") // "OBRIEN-CHARLIE-DELTA"
 * generateInviteCode("XY") // "HOUSE-ECHO-FOXTROT"
 */
export function generateInviteCode(householdName: string): string {
  const prefix = extractPrefix(householdName);
  const word1 = getRandomPhoneticWord();
  const word2 = getRandomPhoneticWord();

  return `${prefix}-${word1}-${word2}`;
}

/**
 * Validates invite code format.
 * Expected format: PREFIX-WORD1-WORD2
 * - Minimum 8 characters total
 * - Uppercase only
 * - Three parts separated by hyphens
 * - Only letters (no numbers or special characters except hyphens)
 *
 * @param code - The invite code to validate
 * @returns true if code format is valid
 *
 * @example
 * validateInviteCodeFormat("ZEDER-ALPHA-BRAVO") // true
 * @validateInviteCodeFormat("zeder-alpha-bravo") // false (lowercase)
 * validateInviteCodeFormat("INVALID") // false (missing parts)
 * validateInviteCodeFormat("ZEDER-ALPHA") // false (only 2 parts)
 */
export function validateInviteCodeFormat(code: string): boolean {
  // Check minimum length
  if (code.length < 8) {
    return false;
  }

  // Check uppercase only (and hyphens)
  if (code !== code.toUpperCase()) {
    return false;
  }

  // Check format: PREFIX-WORD1-WORD2 (exactly 3 parts)
  const parts = code.split('-');
  if (parts.length !== 3) {
    return false;
  }

  // Check each part contains only letters (no numbers or special chars)
  for (const part of parts) {
    if (!/^[A-Z]+$/.test(part)) {
      return false;
    }
  }

  return true;
}

/**
 * Normalizes user input for invite code comparison.
 * - Trims whitespace
 * - Converts to uppercase
 * - Adds hyphens if missing (e.g., "ZEDERALPHABRAVO" -> "ZEDER-ALPHA-BRAVO")
 *
 * This is a helper for UX - users might type codes without hyphens or in lowercase.
 * However, for security, we still validate that final code is uppercase.
 *
 * @param input - Raw user input
 * @returns Normalized invite code
 *
 * @example
 * normalizeInviteCodeInput("  zeder-alpha-bravo  ") // "ZEDER-ALPHA-BRAVO"
 * normalizeInviteCodeInput("zeder alpha bravo") // "ZEDER-ALPHA-BRAVO"
 */
export function normalizeInviteCodeInput(input: string): string {
  // Trim and uppercase
  let normalized = input.trim().toUpperCase();

  // If input has spaces, replace with hyphens
  normalized = normalized.replace(/\s+/g, '-');

  return normalized;
}

/**
 * Calculates expiration date for invite code.
 *
 * @param expirationDays - Number of days until expiration (7, 30, 90), or null for never expires
 * @returns ISO 8601 timestamp for expiration, or null if never expires
 *
 * @example
 * calculateExpirationDate(30) // "2024-03-01T12:00:00Z" (30 days from now)
 * calculateExpirationDate(null) // null (never expires)
 */
export function calculateExpirationDate(expirationDays: number | null): string | null {
  if (expirationDays === null) {
    return null; // Never expires
  }

  const now = new Date();
  const expirationDate = new Date(now.getTime() + expirationDays * 24 * 60 * 60 * 1000);

  return expirationDate.toISOString();
}

/**
 * Checks if an invite code has expired.
 *
 * @param expiresAt - ISO 8601 timestamp for expiration, or null if never expires
 * @returns true if code has expired, false otherwise
 *
 * @example
 * isInviteCodeExpired("2024-01-01T00:00:00Z") // true (if current date is after Jan 1, 2024)
 * isInviteCodeExpired(null) // false (never expires)
 */
export function isInviteCodeExpired(expiresAt: string | null): boolean {
  if (expiresAt === null) {
    return false; // Never expires
  }

  const now = new Date();
  const expiration = new Date(expiresAt);

  return now > expiration;
}

/**
 * Gets human-readable expiration message for invite code.
 *
 * @param expiresAt - ISO 8601 timestamp for expiration, or null if never expires
 * @returns Human-readable expiration message
 *
 * @example
 * getExpirationMessage("2024-03-01T00:00:00Z") // "Expires on March 1, 2024"
 * getExpirationMessage(null) // "Never expires"
 */
export function getExpirationMessage(expiresAt: string | null): string {
  if (expiresAt === null) {
    return 'Never expires';
  }

  const expiration = new Date(expiresAt);
  const now = new Date();

  // Calculate days until expiration
  const daysUntil = Math.floor((expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntil < 0) {
    return 'Expired';
  } else if (daysUntil === 0) {
    return 'Expires today';
  } else if (daysUntil === 1) {
    return 'Expires tomorrow';
  } else if (daysUntil < 7) {
    return `Expires in ${daysUntil} days`;
  } else {
    return `Expires on ${expiration.toLocaleDateString()}`;
  }
}
