/**
 * Offline Storage Utilities
 *
 * Provides offline caching for household data using AsyncStorage.
 *
 * Features:
 * - Household data caching
 * - Member list caching
 * - Pending requests caching
 * - Last sync timestamp tracking
 * - Automatic cache invalidation
 * - Offline-first data access
 *
 * Cache Strategy:
 * - Cache household data for 5 minutes
 * - Always fetch fresh data when online
 * - Fall back to cache when offline
 * - Auto-refresh cache on app foreground
 *
 * Dependencies:
 * - @react-native-async-storage/async-storage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEYS = {
  HOUSEHOLD: '@household',
  MEMBERS: '@household_members',
  PENDING_REQUESTS: '@household_pending_requests',
  USER_ROLE: '@household_user_role',
  LAST_SYNC: '@household_last_sync',
};

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export interface CachedHousehold {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string | null;
  inviteCodeExpiresAt: string | null;
  leaderId: string;
  createdAt: string;
}

export interface CachedMember {
  id: string;
  userId: string;
  householdId: string;
  role: 'leader' | 'member';
  status: 'active' | 'pending' | 'removed';
  joinedAt: string;
  userName: string;
  userEmail: string;
}

export interface CachedJoinRequest {
  id: string;
  householdId: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  requesterName: string;
  requesterEmail: string;
}

/**
 * Check if cache is valid (not expired)
 *
 * @returns True if cache is fresh, false if expired
 */
async function isCacheValid(): Promise<boolean> {
  try {
    const lastSyncStr = await AsyncStorage.getItem(CACHE_KEYS.LAST_SYNC);

    if (!lastSyncStr) {
      return false;
    }

    const lastSync = parseInt(lastSyncStr, 10);
    const now = Date.now();

    return now - lastSync < CACHE_DURATION_MS;
  } catch (error) {
    console.error('Failed to check cache validity', error);
    return false;
  }
}

/**
 * Update last sync timestamp
 */
async function updateLastSync(): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEYS.LAST_SYNC, Date.now().toString());
  } catch (error) {
    console.error('Failed to update last sync', error);
  }
}

/**
 * Cache household data
 *
 * @param household - Household data to cache
 */
export async function cacheHousehold(household: CachedHousehold | null): Promise<void> {
  try {
    if (household) {
      await AsyncStorage.setItem(CACHE_KEYS.HOUSEHOLD, JSON.stringify(household));
    } else {
      await AsyncStorage.removeItem(CACHE_KEYS.HOUSEHOLD);
    }
    await updateLastSync();
  } catch (error) {
    console.error('Failed to cache household', error);
  }
}

/**
 * Get cached household data
 *
 * @param checkValidity - Whether to check cache expiration
 * @returns Cached household or null
 */
export async function getCachedHousehold(
  checkValidity = true
): Promise<CachedHousehold | null> {
  try {
    if (checkValidity) {
      const isValid = await isCacheValid();
      if (!isValid) {
        console.log('Household cache expired');
        return null;
      }
    }

    const data = await AsyncStorage.getItem(CACHE_KEYS.HOUSEHOLD);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to get cached household', error);
    return null;
  }
}

/**
 * Cache household members
 *
 * @param members - Members array to cache
 */
export async function cacheMembers(members: CachedMember[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEYS.MEMBERS, JSON.stringify(members));
    await updateLastSync();
  } catch (error) {
    console.error('Failed to cache members', error);
  }
}

/**
 * Get cached household members
 *
 * @param checkValidity - Whether to check cache expiration
 * @returns Cached members array
 */
export async function getCachedMembers(checkValidity = true): Promise<CachedMember[]> {
  try {
    if (checkValidity) {
      const isValid = await isCacheValid();
      if (!isValid) {
        console.log('Members cache expired');
        return [];
      }
    }

    const data = await AsyncStorage.getItem(CACHE_KEYS.MEMBERS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get cached members', error);
    return [];
  }
}

/**
 * Cache pending join requests
 *
 * @param requests - Requests array to cache
 */
export async function cachePendingRequests(
  requests: CachedJoinRequest[]
): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEYS.PENDING_REQUESTS, JSON.stringify(requests));
    await updateLastSync();
  } catch (error) {
    console.error('Failed to cache pending requests', error);
  }
}

/**
 * Get cached pending requests
 *
 * @param checkValidity - Whether to check cache expiration
 * @returns Cached requests array
 */
export async function getCachedPendingRequests(
  checkValidity = true
): Promise<CachedJoinRequest[]> {
  try {
    if (checkValidity) {
      const isValid = await isCacheValid();
      if (!isValid) {
        console.log('Pending requests cache expired');
        return [];
      }
    }

    const data = await AsyncStorage.getItem(CACHE_KEYS.PENDING_REQUESTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get cached pending requests', error);
    return [];
  }
}

/**
 * Cache user role
 *
 * @param role - User's household role
 */
export async function cacheUserRole(role: 'leader' | 'member' | null): Promise<void> {
  try {
    if (role) {
      await AsyncStorage.setItem(CACHE_KEYS.USER_ROLE, role);
    } else {
      await AsyncStorage.removeItem(CACHE_KEYS.USER_ROLE);
    }
    await updateLastSync();
  } catch (error) {
    console.error('Failed to cache user role', error);
  }
}

/**
 * Get cached user role
 *
 * @returns Cached user role
 */
export async function getCachedUserRole(): Promise<'leader' | 'member' | null> {
  try {
    const role = await AsyncStorage.getItem(CACHE_KEYS.USER_ROLE);
    return role as 'leader' | 'member' | null;
  } catch (error) {
    console.error('Failed to get cached user role', error);
    return null;
  }
}

/**
 * Clear all household cache
 */
export async function clearHouseholdCache(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      CACHE_KEYS.HOUSEHOLD,
      CACHE_KEYS.MEMBERS,
      CACHE_KEYS.PENDING_REQUESTS,
      CACHE_KEYS.USER_ROLE,
      CACHE_KEYS.LAST_SYNC,
    ]);
    console.log('Household cache cleared');
  } catch (error) {
    console.error('Failed to clear household cache', error);
  }
}

/**
 * Get last sync timestamp
 *
 * @returns Last sync timestamp in milliseconds
 */
export async function getLastSyncTime(): Promise<number | null> {
  try {
    const lastSyncStr = await AsyncStorage.getItem(CACHE_KEYS.LAST_SYNC);
    return lastSyncStr ? parseInt(lastSyncStr, 10) : null;
  } catch (error) {
    console.error('Failed to get last sync time', error);
    return null;
  }
}

/**
 * Check if cache exists
 *
 * @returns True if household cache exists
 */
export async function hasCachedHousehold(): Promise<boolean> {
  try {
    const data = await AsyncStorage.getItem(CACHE_KEYS.HOUSEHOLD);
    return data !== null;
  } catch (error) {
    console.error('Failed to check cached household', error);
    return false;
  }
}

/**
 * Get cache statistics
 *
 * @returns Cache stats object
 */
export async function getCacheStats(): Promise<{
  hasHousehold: boolean;
  memberCount: number;
  pendingRequestCount: number;
  lastSync: number | null;
  isValid: boolean;
}> {
  try {
    const [household, members, requests, lastSync, isValid] = await Promise.all([
      getCachedHousehold(false),
      getCachedMembers(false),
      getCachedPendingRequests(false),
      getLastSyncTime(),
      isCacheValid(),
    ]);

    return {
      hasHousehold: household !== null,
      memberCount: members.length,
      pendingRequestCount: requests.length,
      lastSync,
      isValid,
    };
  } catch (error) {
    console.error('Failed to get cache stats', error);
    return {
      hasHousehold: false,
      memberCount: 0,
      pendingRequestCount: 0,
      lastSync: null,
      isValid: false,
    };
  }
}
