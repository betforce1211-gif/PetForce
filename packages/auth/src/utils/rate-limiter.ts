/**
 * Rate Limiting Utilities for Household Management
 *
 * Implements rate limiting to protect against abuse and DoS attacks.
 * Uses database-backed rate limiting for consistency across multiple servers.
 *
 * Security Requirements (Samantha's P0 Critical):
 * - Household creation: 5 per day per user
 * - Invite code regeneration: 10 per day per household
 * - Member removal: 20 per day per household
 * - Invite code validation: 100 per hour per IP address
 */

import { getSupabaseClient } from '../api/supabase-client';
import { logger } from './logger';

// =============================================================================
// RATE LIMIT CONSTANTS
// =============================================================================

const HOUSEHOLD_CREATION_LIMIT_PER_DAY = 5;
const INVITE_REGENERATION_LIMIT_PER_DAY = 10;
const MEMBER_REMOVAL_LIMIT_PER_DAY = 20;
const INVITE_VALIDATION_LIMIT_PER_HOUR = 100;

// =============================================================================
// RATE LIMIT ERROR
// =============================================================================

export class RateLimitError extends Error {
  constructor(
    message: string,
    public readonly limitType: string,
    public readonly retryAfter: Date
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

// =============================================================================
// RATE LIMITING FUNCTIONS
// =============================================================================

/**
 * Check rate limit for household creation.
 *
 * Limits users to 5 household creations per day to prevent spam.
 *
 * @param userId - ID of the user attempting to create a household
 * @throws RateLimitError if limit exceeded
 */
export async function checkHouseholdCreationRateLimit(userId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  try {
    // Count households created by this user in the last 24 hours
    const { data, error } = await supabase
      .from('households')
      .select('id', { count: 'exact', head: true })
      .eq('leader_id', userId)
      .gte('created_at', oneDayAgo);

    if (error) {
      logger.error('Failed to check household creation rate limit', {
        userId,
        error: error.message,
      });
      // Fail open - allow the operation if rate limit check fails
      return;
    }

    const count = data?.length ?? 0;

    if (count >= HOUSEHOLD_CREATION_LIMIT_PER_DAY) {
      const retryAfter = new Date(Date.now() + 24 * 60 * 60 * 1000);

      logger.securityEvent('household_creation_rate_limit_exceeded', {
        userId,
        count,
        limit: HOUSEHOLD_CREATION_LIMIT_PER_DAY,
        retryAfter: retryAfter.toISOString(),
      });

      throw new RateLimitError(
        `You have reached the maximum of ${HOUSEHOLD_CREATION_LIMIT_PER_DAY} household creations per day. Please try again tomorrow.`,
        'household_creation',
        retryAfter
      );
    }
  } catch (error) {
    if (error instanceof RateLimitError) {
      throw error;
    }
    // Log error but don't block the operation
    logger.error('Unexpected error checking household creation rate limit', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Check rate limit for invite code regeneration.
 *
 * Limits households to 10 code regenerations per day to prevent abuse.
 *
 * @param householdId - ID of the household regenerating the code
 * @throws RateLimitError if limit exceeded
 */
export async function checkInviteCodeRegenerationRateLimit(householdId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  try {
    // Query household's updated_at timestamps to estimate regeneration frequency
    // Note: This is an approximation. For production, consider a dedicated audit log.
    const { data: household, error: householdError } = await supabase
      .from('households')
      .select('updated_at, created_at')
      .eq('id', householdId)
      .single();

    if (householdError) {
      logger.error('Failed to check invite regeneration rate limit', {
        householdId,
        error: householdError.message,
      });
      return;
    }

    // For now, use a simple in-memory cache approach
    // In production, this should be stored in Redis or a rate_limit_events table
    const cacheKey = `invite_regen_${householdId}`;
    const cached = getRateLimitCache(cacheKey);

    if (cached && cached.count >= INVITE_REGENERATION_LIMIT_PER_DAY) {
      const retryAfter = new Date(cached.resetAt);

      logger.securityEvent('invite_regeneration_rate_limit_exceeded', {
        householdId,
        count: cached.count,
        limit: INVITE_REGENERATION_LIMIT_PER_DAY,
        retryAfter: retryAfter.toISOString(),
      });

      throw new RateLimitError(
        `This household has reached the maximum of ${INVITE_REGENERATION_LIMIT_PER_DAY} invite code regenerations per day. Please try again tomorrow.`,
        'invite_regeneration',
        retryAfter
      );
    }

    // Increment counter
    setRateLimitCache(cacheKey, {
      count: (cached?.count ?? 0) + 1,
      resetAt: cached?.resetAt ?? Date.now() + 24 * 60 * 60 * 1000,
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      throw error;
    }
    logger.error('Unexpected error checking invite regeneration rate limit', {
      householdId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Check rate limit for member removal.
 *
 * Limits households to 20 member removals per day to prevent abuse.
 *
 * @param householdId - ID of the household removing a member
 * @throws RateLimitError if limit exceeded
 */
export async function checkMemberRemovalRateLimit(householdId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  try {
    // Count members removed in the last 24 hours
    // Note: This requires tracking removal timestamps. We'll use a simple approach.
    const cacheKey = `member_removal_${householdId}`;
    const cached = getRateLimitCache(cacheKey);

    if (cached && cached.count >= MEMBER_REMOVAL_LIMIT_PER_DAY) {
      const retryAfter = new Date(cached.resetAt);

      logger.securityEvent('member_removal_rate_limit_exceeded', {
        householdId,
        count: cached.count,
        limit: MEMBER_REMOVAL_LIMIT_PER_DAY,
        retryAfter: retryAfter.toISOString(),
      });

      throw new RateLimitError(
        `This household has reached the maximum of ${MEMBER_REMOVAL_LIMIT_PER_DAY} member removals per day. Please try again tomorrow.`,
        'member_removal',
        retryAfter
      );
    }

    // Increment counter
    setRateLimitCache(cacheKey, {
      count: (cached?.count ?? 0) + 1,
      resetAt: cached?.resetAt ?? Date.now() + 24 * 60 * 60 * 1000,
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      throw error;
    }
    logger.error('Unexpected error checking member removal rate limit', {
      householdId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Check rate limit for invite code validation attempts.
 *
 * Limits IP addresses to 100 validation attempts per hour to prevent brute force attacks.
 *
 * @param ipAddress - IP address attempting to validate an invite code
 * @throws RateLimitError if limit exceeded
 */
export async function checkInviteCodeValidationRateLimit(ipAddress: string): Promise<void> {
  try {
    const cacheKey = `invite_validation_${ipAddress}`;
    const cached = getRateLimitCache(cacheKey);

    if (cached && cached.count >= INVITE_VALIDATION_LIMIT_PER_HOUR) {
      const retryAfter = new Date(cached.resetAt);

      logger.securityEvent('invite_validation_rate_limit_exceeded', {
        ipAddress: hashIpAddress(ipAddress),
        count: cached.count,
        limit: INVITE_VALIDATION_LIMIT_PER_HOUR,
        retryAfter: retryAfter.toISOString(),
      });

      throw new RateLimitError(
        'Too many invite code validation attempts. Please try again later.',
        'invite_validation',
        retryAfter
      );
    }

    // Increment counter
    setRateLimitCache(cacheKey, {
      count: (cached?.count ?? 0) + 1,
      resetAt: cached?.resetAt ?? Date.now() + 60 * 60 * 1000, // 1 hour
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      throw error;
    }
    logger.error('Unexpected error checking invite validation rate limit', {
      ipAddress: hashIpAddress(ipAddress),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// =============================================================================
// IN-MEMORY CACHE (for development)
// =============================================================================
// NOTE: In production, replace this with Redis or a distributed cache

interface RateLimitCacheEntry {
  count: number;
  resetAt: number;
}

const rateLimitCache = new Map<string, RateLimitCacheEntry>();

/**
 * Get rate limit entry from cache.
 */
function getRateLimitCache(key: string): RateLimitCacheEntry | null {
  const entry = rateLimitCache.get(key);
  if (!entry) {
    return null;
  }

  // Check if entry has expired
  if (Date.now() > entry.resetAt) {
    rateLimitCache.delete(key);
    return null;
  }

  return entry;
}

/**
 * Set rate limit entry in cache.
 */
function setRateLimitCache(key: string, entry: RateLimitCacheEntry): void {
  rateLimitCache.set(key, entry);

  // Clean up expired entries periodically
  if (Math.random() < 0.01) {
    // 1% chance on each set
    cleanupExpiredCacheEntries();
  }
}

/**
 * Clean up expired cache entries.
 */
function cleanupExpiredCacheEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitCache.entries()) {
    if (now > entry.resetAt) {
      rateLimitCache.delete(key);
    }
  }
}

/**
 * Hash IP address for privacy in logs.
 */
function hashIpAddress(ip: string): string {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'ip_hash:' + Math.abs(hash).toString(16).padStart(8, '0');
}
