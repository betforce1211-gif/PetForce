// Validation utilities tests

import { describe, it, expect } from 'vitest';
import { validateEmail, calculatePasswordStrength, validatePassword } from '../../utils/validation';

describe('validateEmail', () => {
  it('validates correct email addresses', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user.name@domain.co.uk')).toBe(true);
    expect(validateEmail('user+tag@example.com')).toBe(true);
  });

  it('rejects invalid email addresses', () => {
    expect(validateEmail('invalid')).toBe(false);
    expect(validateEmail('invalid@')).toBe(false);
    expect(validateEmail('@example.com')).toBe(false);
    expect(validateEmail('test@')).toBe(false);
    expect(validateEmail('')).toBe(false);
  });
});

describe('calculatePasswordStrength', () => {
  it('returns weak for short passwords', () => {
    const result = calculatePasswordStrength('abc');
    expect(result.label).toBe('Weak');
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it('returns weak for passwords with only lowercase', () => {
    const result = calculatePasswordStrength('abcdefgh');
    expect(result.label).toBe('Weak');
  });

  it('returns fair for medium complexity passwords', () => {
    const result = calculatePasswordStrength('Password1');
    expect(result.label).toBe('Fair');
    expect(result.score).toBeGreaterThanOrEqual(2);
  });

  it('returns good for strong passwords', () => {
    const result = calculatePasswordStrength('MyPassword123');
    expect(['Good', 'Strong']).toContain(result.label);
    expect(result.score).toBeGreaterThanOrEqual(3);
  });

  it('returns strong for very strong passwords', () => {
    const result = calculatePasswordStrength('MyP@ssw0rd123!');
    expect(result.label).toBe('Strong');
    expect(result.score).toBe(4);
  });

  it('returns correct color codes', () => {
    const weak = calculatePasswordStrength('abc');
    expect(weak.color).toBe('#EF4444');

    const strong = calculatePasswordStrength('MyP@ssw0rd123!');
    expect(strong.color).toBe('#2D9B87');
  });
});

describe('validatePassword', () => {
  it('validates strong passwords', () => {
    const result = validatePassword('MyP@ssw0rd123');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects short passwords', () => {
    const result = validatePassword('Short1!');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters');
  });

  it('requires uppercase letters', () => {
    const result = validatePassword('password123!');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('uppercase'))).toBe(true);
  });

  it('requires lowercase letters', () => {
    const result = validatePassword('PASSWORD123!');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('lowercase'))).toBe(true);
  });

  it('requires numbers', () => {
    const result = validatePassword('MyPassword!');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('number'))).toBe(true);
  });

  it('requires special characters', () => {
    const result = validatePassword('MyPassword123');
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('special'))).toBe(true);
  });

  it('returns all errors for weak passwords', () => {
    const result = validatePassword('weak');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });
});
