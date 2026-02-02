/**
 * Unit Tests for Invite Code Generation
 *
 * Tests all invite code utility functions for correctness, security, and edge cases.
 */

import { describe, it, expect } from 'vitest';
import {
  extractPrefix,
  getRandomPhoneticWord,
  generateInviteCode,
  validateInviteCodeFormat,
  normalizeInviteCodeInput,
  calculateExpirationDate,
  isInviteCodeExpired,
  getExpirationMessage,
} from '../invite-codes';

describe('extractPrefix', () => {
  it('should extract uppercase prefix from normal household name', () => {
    const prefix = extractPrefix('The Zeder House');
    expect(prefix).toBe('THEZED');
    expect(prefix.length).toBeLessThanOrEqual(6);
  });

  it('should remove special characters from household name', () => {
    const prefix = extractPrefix("O'Brien's Pet House!");
    expect(prefix).toBe('OBRIEN');
    expect(prefix).toMatch(/^[A-Z0-9]+$/);
  });

  it('should use default prefix for very short names', () => {
    const prefix = extractPrefix('XY');
    expect(prefix).toBe('HOUSE');
  });

  it('should use default prefix for names with only special characters', () => {
    const prefix = extractPrefix('!!!');
    expect(prefix).toBe('HOUSE');
  });

  it('should handle names with numbers', () => {
    const prefix = extractPrefix('Family 2024');
    expect(prefix).toBe('FAMILY');
  });

  it('should handle names with spaces only', () => {
    const prefix = extractPrefix('   ');
    expect(prefix).toBe('HOUSE');
  });

  it('should limit prefix to 6 characters', () => {
    const prefix = extractPrefix('VeryLongHouseholdName');
    expect(prefix.length).toBe(6);
    expect(prefix).toBe('VERYLO');
  });
});

describe('getRandomPhoneticWord', () => {
  it('should return a valid phonetic word', () => {
    const word = getRandomPhoneticWord();
    expect(word).toMatch(/^[A-Z]+$/);
    expect(word.length).toBeGreaterThan(0);
  });

  it('should return different words on multiple calls (randomness)', () => {
    const words = new Set();
    for (let i = 0; i < 100; i++) {
      words.add(getRandomPhoneticWord());
    }
    // With 26 words, 100 calls should give us multiple different words
    expect(words.size).toBeGreaterThan(5);
  });

  it('should always return uppercase words', () => {
    for (let i = 0; i < 10; i++) {
      const word = getRandomPhoneticWord();
      expect(word).toBe(word.toUpperCase());
    }
  });
});

describe('generateInviteCode', () => {
  it('should generate code in correct format', () => {
    const code = generateInviteCode('The Zeder House');
    const parts = code.split('-');
    expect(parts.length).toBe(3);
    expect(code).toMatch(/^[A-Z]+-[A-Z]+-[A-Z]+$/);
  });

  it('should generate unique codes for same household name (randomness)', () => {
    const codes = new Set();
    for (let i = 0; i < 50; i++) {
      codes.add(generateInviteCode('The Zeder House'));
    }
    // Should generate different codes due to random words
    expect(codes.size).toBeGreaterThan(10);
  });

  it('should generate code with minimum 8 characters', () => {
    const code = generateInviteCode('XY'); // Short name
    expect(code.length).toBeGreaterThanOrEqual(8);
  });

  it('should handle special characters in household name', () => {
    const code = generateInviteCode("O'Brien's House!");
    expect(code).toMatch(/^OBRIEN-[A-Z]+-[A-Z]+$/);
  });

  it('should be uppercase only', () => {
    const code = generateInviteCode('the zeder house');
    expect(code).toBe(code.toUpperCase());
  });

  it('should generate unique codes for different household names', () => {
    const codes = new Set<string>();
    // With different household names, prefixes differ, so codes should be unique
    for (let i = 0; i < 100; i++) {
      const code = generateInviteCode(`Household ${i}`);
      codes.add(code);
    }
    // Different household names should produce different codes
    expect(codes.size).toBeGreaterThan(50); // At least 50% unique with randomness
  });
});

describe('validateInviteCodeFormat', () => {
  it('should validate correct invite code format', () => {
    expect(validateInviteCodeFormat('ZEDER-ALPHA-BRAVO')).toBe(true);
    expect(validateInviteCodeFormat('HOUSE-CHARLIE-DELTA')).toBe(true);
    expect(validateInviteCodeFormat('OBRIEN-ECHO-FOXTROT')).toBe(true);
  });

  it('should reject lowercase codes', () => {
    expect(validateInviteCodeFormat('zeder-alpha-bravo')).toBe(false);
    expect(validateInviteCodeFormat('ZEDER-alpha-BRAVO')).toBe(false);
  });

  it('should reject codes with wrong number of parts', () => {
    expect(validateInviteCodeFormat('ZEDER-ALPHA')).toBe(false); // Only 2 parts
    expect(validateInviteCodeFormat('ZEDER')).toBe(false); // Only 1 part
    expect(validateInviteCodeFormat('ZEDER-ALPHA-BRAVO-CHARLIE')).toBe(false); // 4 parts
  });

  it('should reject codes that are too short', () => {
    expect(validateInviteCodeFormat('A-B-C')).toBe(false);
  });

  it('should reject codes with numbers in parts', () => {
    expect(validateInviteCodeFormat('ZEDER123-ALPHA-BRAVO')).toBe(false);
  });

  it('should reject codes with special characters (except hyphens)', () => {
    expect(validateInviteCodeFormat('ZEDER!-ALPHA-BRAVO')).toBe(false);
    expect(validateInviteCodeFormat('ZEDER-ALPHA@-BRAVO')).toBe(false);
  });

  it('should reject empty string', () => {
    expect(validateInviteCodeFormat('')).toBe(false);
  });
});

describe('normalizeInviteCodeInput', () => {
  it('should convert lowercase to uppercase', () => {
    expect(normalizeInviteCodeInput('zeder-alpha-bravo')).toBe('ZEDER-ALPHA-BRAVO');
  });

  it('should trim whitespace', () => {
    expect(normalizeInviteCodeInput('  ZEDER-ALPHA-BRAVO  ')).toBe('ZEDER-ALPHA-BRAVO');
  });

  it('should replace spaces with hyphens', () => {
    expect(normalizeInviteCodeInput('ZEDER ALPHA BRAVO')).toBe('ZEDER-ALPHA-BRAVO');
  });

  it('should handle mixed case and spaces', () => {
    expect(normalizeInviteCodeInput('  zeder alpha bravo  ')).toBe('ZEDER-ALPHA-BRAVO');
  });

  it('should handle already normalized codes', () => {
    expect(normalizeInviteCodeInput('ZEDER-ALPHA-BRAVO')).toBe('ZEDER-ALPHA-BRAVO');
  });
});

describe('calculateExpirationDate', () => {
  it('should return null for never-expiring codes', () => {
    expect(calculateExpirationDate(null)).toBe(null);
  });

  it('should calculate expiration date for 7 days', () => {
    const now = new Date();
    const expiresAt = calculateExpirationDate(7);
    expect(expiresAt).not.toBe(null);

    const expiration = new Date(expiresAt!);
    const daysDiff = Math.floor((expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Allow 6 or 7 days due to millisecond timing differences
    expect(daysDiff).toBeGreaterThanOrEqual(6);
    expect(daysDiff).toBeLessThanOrEqual(7);
  });

  it('should calculate expiration date for 30 days', () => {
    const now = new Date();
    const expiresAt = calculateExpirationDate(30);
    expect(expiresAt).not.toBe(null);

    const expiration = new Date(expiresAt!);
    const daysDiff = Math.floor((expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Allow 29 or 30 days due to millisecond timing differences
    expect(daysDiff).toBeGreaterThanOrEqual(29);
    expect(daysDiff).toBeLessThanOrEqual(30);
  });

  it('should calculate expiration date for 90 days', () => {
    const now = new Date();
    const expiresAt = calculateExpirationDate(90);
    expect(expiresAt).not.toBe(null);

    const expiration = new Date(expiresAt!);
    const daysDiff = Math.floor((expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Allow 89 or 90 days due to millisecond timing differences
    expect(daysDiff).toBeGreaterThanOrEqual(89);
    expect(daysDiff).toBeLessThanOrEqual(90);
  });

  it('should return ISO 8601 formatted date', () => {
    const expiresAt = calculateExpirationDate(30);
    expect(expiresAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});

describe('isInviteCodeExpired', () => {
  it('should return false for never-expiring codes', () => {
    expect(isInviteCodeExpired(null)).toBe(false);
  });

  it('should return true for expired codes', () => {
    const pastDate = new Date('2020-01-01T00:00:00Z').toISOString();
    expect(isInviteCodeExpired(pastDate)).toBe(true);
  });

  it('should return false for future expiration dates', () => {
    const futureDate = new Date('2030-01-01T00:00:00Z').toISOString();
    expect(isInviteCodeExpired(futureDate)).toBe(false);
  });

  it('should handle current date boundary correctly', () => {
    // Code that expires in 1 second should not be expired yet
    const almostExpired = new Date(Date.now() + 1000).toISOString();
    expect(isInviteCodeExpired(almostExpired)).toBe(false);

    // Code that expired 1 second ago should be expired
    const justExpired = new Date(Date.now() - 1000).toISOString();
    expect(isInviteCodeExpired(justExpired)).toBe(true);
  });
});

describe('getExpirationMessage', () => {
  it('should return "Never expires" for null expiration', () => {
    expect(getExpirationMessage(null)).toBe('Never expires');
  });

  it('should return "Expired" for past dates', () => {
    const pastDate = new Date('2020-01-01T00:00:00Z').toISOString();
    expect(getExpirationMessage(pastDate)).toBe('Expired');
  });

  it('should return "Expires today" for same-day expiration', () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    expect(getExpirationMessage(today.toISOString())).toBe('Expires today');
  });

  it('should return "Expires tomorrow" for next-day expiration', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(getExpirationMessage(tomorrow.toISOString())).toBe('Expires tomorrow');
  });

  it('should return "Expires in X days" for near-future expiration', () => {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    expect(getExpirationMessage(threeDaysFromNow.toISOString())).toBe('Expires in 3 days');
  });

  it('should return formatted date for far-future expiration', () => {
    const farFuture = new Date();
    farFuture.setDate(farFuture.getDate() + 30);
    const message = getExpirationMessage(farFuture.toISOString());
    expect(message).toContain('Expires on');
    expect(message.length).toBeGreaterThan(10);
  });
});

describe('invite code security', () => {
  it('should have sufficient entropy (many unique codes)', () => {
    // Generate 500 codes and ensure reasonable uniqueness
    const codes = new Set<string>();
    for (let i = 0; i < 500; i++) {
      codes.add(generateInviteCode('Test Household'));
    }

    // With 26 words chosen twice, we have 26^2 = 676 possible combinations
    // per prefix. With 500 codes, we expect ~63% unique due to birthday paradox
    const uniquePercentage = (codes.size / 500) * 100;
    expect(uniquePercentage).toBeGreaterThan(60); // At least 60% unique
  });

  it('should generate codes that are always valid format', () => {
    for (let i = 0; i < 100; i++) {
      const code = generateInviteCode(`Test ${i}`);
      expect(validateInviteCodeFormat(code)).toBe(true);
    }
  });

  it('should not include year in code (per spec update)', () => {
    const code = generateInviteCode('The Zeder House');
    const currentYear = new Date().getFullYear().toString();
    expect(code).not.toContain(currentYear);
    expect(code).not.toContain('2024');
    expect(code).not.toContain('2025');
    expect(code).not.toContain('2026');
  });
});
