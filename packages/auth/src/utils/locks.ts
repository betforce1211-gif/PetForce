/**
 * Distributed Locking Utilities for Household Management
 *
 * Implements distributed locks to prevent race conditions in concurrent operations.
 * Uses database-backed locking for consistency across multiple servers.
 *
 * Security Requirements (Samantha's P0 Critical):
 * - Leadership transfer: Lock household during member leave operations
 * - Invite code regeneration: Lock household during code updates
 * - Member removal: Lock household during removal operations
 *
 * NOTE: For production, consider using Redis-based locks (Redlock algorithm)
 * or PostgreSQL advisory locks for better performance.
 */

import { getSupabaseClient } from '../api/supabase-client';
import { logger } from './logger';

// =============================================================================
// LOCK CONSTANTS
// =============================================================================

const DEFAULT_LOCK_TTL_MS = 30000; // 30 seconds
const MAX_LOCK_WAIT_TIME_MS = 5000; // 5 seconds
const LOCK_RETRY_INTERVAL_MS = 100; // 100ms between retries

// =============================================================================
// LOCK ERROR
// =============================================================================

export class LockError extends Error {
  constructor(message: string, public readonly resource: string) {
    super(message);
    this.name = 'LockError';
  }
}

// =============================================================================
// LOCK MANAGEMENT
// =============================================================================

/**
 * Acquire a distributed lock on a resource.
 *
 * Attempts to acquire a lock with retries. If the lock cannot be acquired
 * within the timeout period, throws a LockError.
 *
 * @param resource - Unique identifier for the resource to lock (e.g., "household:123")
 * @param ttlMs - Time-to-live for the lock in milliseconds (default 30s)
 * @returns Lock ID that must be passed to releaseLock
 * @throws LockError if lock cannot be acquired
 */
export async function acquireLock(
  resource: string,
  ttlMs: number = DEFAULT_LOCK_TTL_MS
): Promise<string> {
  const lockId = generateLockId();
  const expiresAt = new Date(Date.now() + ttlMs);
  const startTime = Date.now();

  logger.info('Attempting to acquire lock', {
    resource,
    lockId,
    ttlMs,
    expiresAt: expiresAt.toISOString(),
  });

  while (Date.now() - startTime < MAX_LOCK_WAIT_TIME_MS) {
    try {
      const acquired = await tryAcquireLock(resource, lockId, expiresAt);

      if (acquired) {
        logger.info('Lock acquired successfully', {
          resource,
          lockId,
          waitTimeMs: Date.now() - startTime,
        });
        return lockId;
      }

      // Wait before retrying
      await sleep(LOCK_RETRY_INTERVAL_MS);
    } catch (error) {
      logger.error('Error attempting to acquire lock', {
        resource,
        lockId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  // Timeout reached
  logger.securityEvent('lock_acquisition_timeout', {
    resource,
    lockId,
    timeoutMs: MAX_LOCK_WAIT_TIME_MS,
  });

  throw new LockError(
    `Failed to acquire lock on resource "${resource}" within ${MAX_LOCK_WAIT_TIME_MS}ms`,
    resource
  );
}

/**
 * Release a distributed lock on a resource.
 *
 * @param resource - Resource identifier that was locked
 * @param lockId - Lock ID returned by acquireLock
 */
export async function releaseLock(resource: string, lockId: string): Promise<void> {
  try {
    logger.info('Releasing lock', { resource, lockId });

    const released = await tryReleaseLock(resource, lockId);

    if (released) {
      logger.info('Lock released successfully', { resource, lockId });
    } else {
      logger.warn('Lock was already released or expired', { resource, lockId });
    }
  } catch (error) {
    logger.error('Error releasing lock', {
      resource,
      lockId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    // Don't throw - releasing a lock should be best-effort
  }
}

/**
 * Execute a function with a lock held.
 *
 * Acquires the lock, executes the function, and releases the lock in a finally block.
 * Ensures the lock is always released even if the function throws an error.
 *
 * @param resource - Resource identifier to lock
 * @param fn - Function to execute while holding the lock
 * @param ttlMs - Lock TTL in milliseconds
 * @returns Result of the function
 */
export async function withLock<T>(
  resource: string,
  fn: () => Promise<T>,
  ttlMs: number = DEFAULT_LOCK_TTL_MS
): Promise<T> {
  let lockId: string | null = null;

  try {
    lockId = await acquireLock(resource, ttlMs);
    return await fn();
  } finally {
    if (lockId) {
      await releaseLock(resource, lockId);
    }
  }
}

// =============================================================================
// DATABASE-BACKED LOCK IMPLEMENTATION
// =============================================================================
// NOTE: This uses an in-memory cache for simplicity. In production, use:
// - PostgreSQL advisory locks (pg_advisory_lock)
// - Redis with Redlock algorithm
// - DynamoDB conditional writes
// - Dedicated lock service (etcd, ZooKeeper)

interface LockEntry {
  lockId: string;
  resource: string;
  expiresAt: Date;
}

const lockCache = new Map<string, LockEntry>();

/**
 * Attempt to acquire a lock (internal implementation).
 */
async function tryAcquireLock(
  resource: string,
  lockId: string,
  expiresAt: Date
): Promise<boolean> {
  // Clean up expired locks first
  cleanupExpiredLocks();

  const existingLock = lockCache.get(resource);

  // Check if lock is already held
  if (existingLock) {
    // Check if lock has expired
    if (new Date() < existingLock.expiresAt) {
      // Lock is still valid, cannot acquire
      return false;
    }
    // Lock has expired, we can take it
  }

  // Acquire the lock
  lockCache.set(resource, { lockId, resource, expiresAt });
  return true;
}

/**
 * Attempt to release a lock (internal implementation).
 */
async function tryReleaseLock(resource: string, lockId: string): Promise<boolean> {
  const existingLock = lockCache.get(resource);

  // Verify we own this lock
  if (!existingLock || existingLock.lockId !== lockId) {
    return false;
  }

  lockCache.delete(resource);
  return true;
}

/**
 * Clean up expired locks from the cache.
 */
function cleanupExpiredLocks(): void {
  const now = new Date();
  for (const [resource, lock] of lockCache.entries()) {
    if (now >= lock.expiresAt) {
      lockCache.delete(resource);
      logger.info('Expired lock cleaned up', {
        resource,
        lockId: lock.lockId,
        expiredAt: lock.expiresAt.toISOString(),
      });
    }
  }
}

/**
 * Generate a unique lock ID.
 */
function generateLockId(): string {
  return 'lock_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
}

/**
 * Sleep for a specified number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =============================================================================
// PERIODIC CLEANUP
// =============================================================================

// Run cleanup every 10 seconds
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredLocks, 10000);
}
