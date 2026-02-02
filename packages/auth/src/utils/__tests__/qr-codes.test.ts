/**
 * QR Code Utilities Tests
 *
 * Tests for QR code generation and parsing functionality.
 */

import { describe, it, expect } from 'vitest';
import {
  generateHouseholdQRCode,
  parseQRCodeData,
  generateShareableQRCode,
} from '../qr-codes';

describe('QR Code Utilities', () => {
  describe('generateHouseholdQRCode', () => {
    it('should generate a QR code data URL', async () => {
      const result = await generateHouseholdQRCode({
        inviteCode: 'ZEDER-ALPHA-BRAVO',
        householdName: 'The Zeder House',
        size: 300,
      });

      expect(result).toContain('data:image/png;base64,');
      expect(result.length).toBeGreaterThan(100);
    });

    it('should generate QR codes with different sizes', async () => {
      const small = await generateHouseholdQRCode({
        inviteCode: 'ZEDER-ALPHA-BRAVO',
        householdName: 'The Zeder House',
        size: 200,
      });

      const large = await generateHouseholdQRCode({
        inviteCode: 'ZEDER-ALPHA-BRAVO',
        householdName: 'The Zeder House',
        size: 600,
      });

      expect(small).toContain('data:image/png;base64,');
      expect(large).toContain('data:image/png;base64,');
      // Larger QR codes should have more data
      expect(large.length).toBeGreaterThan(small.length);
    });

    it('should use default size if not provided', async () => {
      const result = await generateHouseholdQRCode({
        inviteCode: 'ZEDER-ALPHA-BRAVO',
        householdName: 'The Zeder House',
      });

      expect(result).toContain('data:image/png;base64,');
    });

    it('should handle special characters in household name', async () => {
      const result = await generateHouseholdQRCode({
        inviteCode: 'ZEDER-ALPHA-BRAVO',
        householdName: "The O'Connor House & Friends",
        size: 300,
      });

      expect(result).toContain('data:image/png;base64,');
    });
  });

  describe('parseQRCodeData', () => {
    it('should parse valid PetForce deep link', () => {
      // Custom protocols like petforce:// have pathname with double slashes
      const data = 'petforce://household/join?code=ZEDER-ALPHA-BRAVO';
      const result = parseQRCodeData(data);

      expect(result).not.toBeNull();
      expect(result?.inviteCode).toBe('ZEDER-ALPHA-BRAVO');
    });

    it('should parse valid HTTPS universal link', () => {
      const data = 'https://petforce.app/household/join?code=ZEDER-ALPHA-BRAVO';
      const result = parseQRCodeData(data);

      expect(result).not.toBeNull();
      expect(result?.inviteCode).toBe('ZEDER-ALPHA-BRAVO');
    });

    it('should parse HTTP universal link', () => {
      const data = 'http://petforce.app/household/join?code=ZEDER-ALPHA-BRAVO';
      const result = parseQRCodeData(data);

      expect(result).not.toBeNull();
      expect(result?.inviteCode).toBe('ZEDER-ALPHA-BRAVO');
    });

    it('should return null for invalid protocol', () => {
      const data = 'https://example.com/household/join?code=ZEDER-ALPHA-BRAVO';
      const result = parseQRCodeData(data);

      expect(result).toBeNull();
    });

    it('should return null for invalid path', () => {
      const data = 'petforce://household/create?code=ZEDER-ALPHA-BRAVO';
      const result = parseQRCodeData(data);

      expect(result).toBeNull();
    });

    it('should return null if code parameter is missing', () => {
      const data = 'petforce://household/join';
      const result = parseQRCodeData(data);

      expect(result).toBeNull();
    });

    it('should return null for malformed URL', () => {
      const data = 'not a url at all';
      const result = parseQRCodeData(data);

      expect(result).toBeNull();
    });

    it('should handle URL with additional parameters', () => {
      // Use universal link for this test
      const data = 'https://petforce.app/household/join?code=ZEDER-ALPHA-BRAVO&ref=email&utm=test';
      const result = parseQRCodeData(data);

      expect(result).not.toBeNull();
      expect(result?.inviteCode).toBe('ZEDER-ALPHA-BRAVO');
    });

    it('should handle invite codes with different formats', () => {
      const codes = [
        'SMITH-BAKER-CHARLIE',
        'JONES-DELTA-ECHO',
        'TEST-FOX-GOLF',
      ];

      codes.forEach((code) => {
        // Use universal link for cross-platform compatibility
        const data = `https://petforce.app/household/join?code=${code}`;
        const result = parseQRCodeData(data);

        expect(result).not.toBeNull();
        expect(result?.inviteCode).toBe(code);
      });
    });
  });

  describe('generateShareableQRCode', () => {
    it('should generate a shareable QR code with default size', async () => {
      const result = await generateShareableQRCode(
        'ZEDER-ALPHA-BRAVO',
        'The Zeder House'
      );

      expect(result).toContain('data:image/png;base64,');
      expect(result.length).toBeGreaterThan(100);
    });

    it('should use larger size for web display', async () => {
      const webCode = await generateShareableQRCode(
        'ZEDER-ALPHA-BRAVO',
        'The Zeder House'
      );

      const mobileCode = await generateHouseholdQRCode({
        inviteCode: 'ZEDER-ALPHA-BRAVO',
        householdName: 'The Zeder House',
        size: 200,
      });

      // Web code (400px) should be larger than mobile code (200px)
      expect(webCode.length).toBeGreaterThan(mobileCode.length);
    });
  });

  describe('QR Code Integration', () => {
    it('should generate and parse QR code round-trip', async () => {
      const inviteCode = 'ZEDER-ALPHA-BRAVO';
      const householdName = 'The Zeder House';

      // Generate QR code
      const qrCode = await generateHouseholdQRCode({
        inviteCode,
        householdName,
        size: 300,
      });

      expect(qrCode).toContain('data:image/png;base64,');

      // Simulate scanning the QR code (which would extract the deep link)
      // Use universal link for cross-platform compatibility
      const deepLink = `https://petforce.app/household/join?code=${inviteCode}`;
      const parsed = parseQRCodeData(deepLink);

      expect(parsed).not.toBeNull();
      expect(parsed?.inviteCode).toBe(inviteCode);
    });

    it('should handle multiple QR code generations', async () => {
      const households = [
        { code: 'SMITH-ALPHA-BRAVO', name: 'Smith Family' },
        { code: 'JONES-CHARLIE-DELTA', name: 'Jones Household' },
        { code: 'BROWN-ECHO-FOXTROT', name: 'Brown Pets' },
      ];

      const qrCodes = await Promise.all(
        households.map((h) =>
          generateHouseholdQRCode({
            inviteCode: h.code,
            householdName: h.name,
            size: 300,
          })
        )
      );

      // All should be valid QR codes
      qrCodes.forEach((qr) => {
        expect(qr).toContain('data:image/png;base64,');
      });

      // All should be unique (different codes = different QR patterns)
      const uniqueQRs = new Set(qrCodes);
      expect(uniqueQRs.size).toBe(households.length);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty invite code', async () => {
      // Empty invite code still generates QR code (validation happens at API level)
      const result = await generateHouseholdQRCode({
        inviteCode: '',
        householdName: 'Test House',
        size: 300,
      });

      expect(result).toContain('data:image/png;base64,');
    });

    it('should handle empty household name', async () => {
      const result = await generateHouseholdQRCode({
        inviteCode: 'ZEDER-ALPHA-BRAVO',
        householdName: '',
        size: 300,
      });

      // Should still generate QR code (household name is for logging only)
      expect(result).toContain('data:image/png;base64,');
    });

    it('should handle very long invite codes', async () => {
      const longCode = 'A'.repeat(100);
      const result = await generateHouseholdQRCode({
        inviteCode: longCode,
        householdName: 'Test House',
        size: 300,
      });

      expect(result).toContain('data:image/png;base64,');
    });

    it('should handle invalid size gracefully', async () => {
      const result = await generateHouseholdQRCode({
        inviteCode: 'ZEDER-ALPHA-BRAVO',
        householdName: 'Test House',
        size: 0, // Invalid size
      });

      // Should still generate with default/minimum size
      expect(result).toContain('data:image/png;base64,');
    });
  });
});
