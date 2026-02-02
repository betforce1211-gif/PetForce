/**
 * QR Code Generation for Household Invites
 *
 * Generates branded QR codes for PetForce household invites with deep link support.
 * Includes parsing for QR code scanning in mobile app.
 */

import QRCode from 'qrcode';
import { logger } from './logger';

export interface QRCodeOptions {
  inviteCode: string;
  householdName: string;
  size?: number;
  logo?: string;
}

/**
 * Generates a QR code for household invite with PetForce branding.
 *
 * Creates a deep link QR code that can be scanned by the mobile app
 * to automatically fill in the invite code.
 *
 * @param options - QR code generation options
 * @returns Data URL of the generated QR code image
 */
export async function generateHouseholdQRCode(options: QRCodeOptions): Promise<string> {
  const { inviteCode, householdName, size = 300, logo } = options;

  try {
    // Deep link URL for mobile app (handles universal links and app schemes)
    const url = `petforce://household/join?code=${inviteCode}`;

    // QR code generation with PetForce branding
    const qrDataURL = await QRCode.toDataURL(url, {
      width: size,
      margin: 2,
      color: {
        dark: '#1a1a1a', // PetForce dark color
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H', // High error correction for logo overlay
    });

    // If logo provided, overlay it on QR code
    if (logo) {
      return await overlayLogoOnQRCode(qrDataURL, logo, size);
    }

    logger.info('QR code generated successfully', {
      householdName,
      size,
      hasLogo: !!logo,
    });

    return qrDataURL;
  } catch (error) {
    logger.error('Failed to generate QR code', {
      error: error instanceof Error ? error.message : 'Unknown error',
      householdName,
      inviteCode: '[REDACTED]',
    });
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Parses QR code data to extract invite code.
 *
 * Validates that the QR code is a PetForce household invite
 * and extracts the invite code from the deep link.
 *
 * @param data - Raw QR code data string
 * @returns Parsed invite code or null if invalid
 */
export function parseQRCodeData(data: string): { inviteCode: string } | null {
  try {
    // Try parsing as URL first
    const url = new URL(data);

    // Check if it's a PetForce deep link (petforce://household/join?code=...)
    // For custom protocols like petforce://, the URL parsing is:
    // petforce://household/join?code=TEST
    //   protocol: 'petforce:'
    //   hostname: 'household'
    //   pathname: '/join'
    //   searchParams: code=TEST
    if (url.protocol === 'petforce:') {
      if (url.hostname === 'household' && url.pathname === '/join') {
        const code = url.searchParams.get('code');
        if (code) {
          logger.info('QR code parsed successfully', {
            inviteCode: '[REDACTED]',
          });
          return { inviteCode: code };
        }
      }
    }

    // Also support HTTPS universal links (petforce.app/household/join?code=...)
    if (
      (url.protocol === 'https:' || url.protocol === 'http:') &&
      url.hostname === 'petforce.app' &&
      url.pathname === '/household/join'
    ) {
      const code = url.searchParams.get('code');
      if (code) {
        logger.info('QR code parsed successfully (universal link)', {
          inviteCode: '[REDACTED]',
        });
        return { inviteCode: code };
      }
    }

    logger.warn('Invalid QR code format', { data: data.substring(0, 50) });
    return null;
  } catch (error) {
    logger.warn('Failed to parse QR code data', {
      error: error instanceof Error ? error.message : 'Unknown error',
      data: data.substring(0, 50),
    });
    return null;
  }
}

/**
 * Helper to overlay logo on QR code (browser/Node.js compatible).
 *
 * This is a placeholder implementation. In production, this would:
 * 1. Load the logo image
 * 2. Create a canvas
 * 3. Draw the QR code
 * 4. Draw the logo in the center
 * 5. Return the final image as data URL
 *
 * @param qrDataURL - QR code data URL
 * @param logoURL - Logo image URL
 * @param size - QR code size
 * @returns QR code with logo overlay
 */
async function overlayLogoOnQRCode(
  qrDataURL: string,
  logoURL: string,
  size: number
): Promise<string> {
  // TODO: Implement logo overlay using canvas (browser) or sharp (Node.js)
  // For now, return the original QR code
  logger.info('Logo overlay requested (not yet implemented)', {
    logoURL,
    size,
  });

  return qrDataURL;
}

/**
 * Generates a shareable QR code image URL for web display.
 *
 * This is a convenience wrapper around generateHouseholdQRCode
 * for use in React components.
 *
 * @param inviteCode - Household invite code
 * @param householdName - Household name
 * @returns Data URL of the QR code image
 */
export async function generateShareableQRCode(
  inviteCode: string,
  householdName: string
): Promise<string> {
  return generateHouseholdQRCode({
    inviteCode,
    householdName,
    size: 400, // Larger size for web display
  });
}
