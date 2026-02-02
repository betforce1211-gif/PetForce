/**
 * Household API Unit Tests
 *
 * Comprehensive test coverage for household management system.
 * Tests all API functions with both happy paths and error paths.
 *
 * Coverage Target: >80% (Tucker's requirement)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  createHousehold,
  getHousehold,
  requestJoinHousehold,
  respondToJoinRequest,
  removeMember,
  regenerateInviteCode,
  leaveHousehold,
  withdrawJoinRequest,
  sendEmailInvite,
} from '../../api/household-api';
import { getSupabaseClient } from '../../api/supabase-client';
import { logger } from '../../utils/logger';
import { HouseholdErrorCode } from '../../types/household';

// Mock Supabase client
vi.mock('../../api/supabase-client', () => ({
  getSupabaseClient: vi.fn(),
}));

// Mock logger
vi.mock('../../utils/logger', () => ({
  logger: {
    generateRequestId: vi.fn(() => 'test-request-id'),
    authEvent: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock invite code generation (for predictable tests)
vi.mock('../../utils/invite-codes', async () => {
  const actual = await vi.importActual('../../utils/invite-codes');
  return {
    ...actual,
    generateInviteCode: vi.fn(() => 'ZEDER-ALPHA-BRAVO'),
    calculateExpirationDate: vi.fn((days) => days ? '2026-03-01T00:00:00Z' : null),
  };
});

// Mock rate limiter (for security tests)
vi.mock('../../utils/rate-limiter', () => ({
  checkHouseholdCreationRateLimit: vi.fn().mockResolvedValue(undefined),
  checkJoinRequestRateLimit: vi.fn().mockResolvedValue(undefined),
  checkMemberRemovalRateLimit: vi.fn().mockResolvedValue(undefined),
  checkInviteCodeRegenerationRateLimit: vi.fn().mockResolvedValue(undefined),
  RateLimitError: class RateLimitError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'RateLimitError';
    }
  },
}));

// Mock distributed locks (for concurrent operation prevention)
vi.mock('../../utils/locks', () => ({
  withLock: vi.fn().mockImplementation(async (resource, fn) => {
    // Simply execute the function without actual locking in tests
    return await fn();
  }),
  LockError: class LockError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'LockError';
    }
  },
}));

// Mock email invites (for sendEmailInvite tests)
vi.mock('../../email/household-invites', () => ({
  sendHouseholdEmailInvite: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock notifications (for household operations)
vi.mock('../../notifications/household-notifications', () => ({
  sendJoinRequestNotification: vi.fn().mockResolvedValue({ success: true }),
  sendJoinApprovedNotification: vi.fn().mockResolvedValue({ success: true }),
  sendJoinRejectedNotification: vi.fn().mockResolvedValue({ success: true }),
  sendMemberRemovedNotification: vi.fn().mockResolvedValue({ success: true }),
  sendLeadershipTransferredNotification: vi.fn().mockResolvedValue({ success: true }),
  sendEmailInviteNotification: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock security/sanitization utilities (for validation tests)
vi.mock('../../utils/security', async () => {
  const actual = await vi.importActual('../../utils/security');
  return {
    ...actual,
    // Keep the actual implementations for proper validation
  };
});

describe('Household API', () => {
  let mockSupabase: any;
  let mockTableQuery: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock table query chain - will be recreated for each from() call
    mockTableQuery = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(),
      order: vi.fn().mockReturnThis(),
    };

    // Mock Supabase client - create new query chain for each from() call
    mockSupabase = {
      from: vi.fn().mockImplementation(() => {
        // Return a new query object for each from() call
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          update: vi.fn().mockReturnThis(),
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn(),
          order: vi.fn().mockReturnThis(),
        };
      }),
    };

    (getSupabaseClient as any).mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // CREATE HOUSEHOLD TESTS
  // ==========================================================================

  describe('createHousehold()', () => {
    it('should successfully create a household with leader member', async () => {
      const userId = 'user-123';
      const householdData = {
        id: 'household-456',
        name: 'The Zeder House',
        description: 'Our happy household',
        invite_code: 'ZEDER-ALPHA-BRAVO',
        invite_code_expires_at: '2026-03-01T00:00:00Z',
        leader_id: userId,
        created_at: '2026-02-01T00:00:00Z',
        updated_at: '2026-02-01T00:00:00Z',
      };

      // Create proper mock responses for each database call in sequence
      const mockCalls = [
        // 1. Check for existing membership
        {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' }, // No rows found
          }),
        },
        // 2. Check invite code uniqueness
        {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        },
        // 3. Insert household
        {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: householdData,
            error: null,
          }),
        },
        // 4. Insert leader member
        {
          insert: vi.fn().mockResolvedValue({
            data: [{ id: 'member-789' }],
            error: null,
          }),
        },
      ];

      let callIndex = 0;
      mockSupabase.from.mockImplementation(() => mockCalls[callIndex++]);

      const result = await createHousehold(
        {
          name: 'The Zeder House',
          description: 'Our happy household',
        },
        userId
      );

      expect(result.success).toBe(true);
      expect(result.household).toBeDefined();
      expect(result.household?.name).toBe('The Zeder House');
      expect(result.household?.leaderId).toBe(userId);
      expect(logger.info).toHaveBeenCalledWith(
        'household_created',
        expect.objectContaining({
          userId,
          householdId: 'household-456',
        })
      );
    });

    it('should fail if household name is too short', async () => {
      const result = await createHousehold(
        { name: 'A' },
        'user-123'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.INVALID_HOUSEHOLD_NAME);
      expect(result.error?.message).toContain('at least 2 characters');
    });

    it('should fail if household name is too long', async () => {
      const longName = 'A'.repeat(51);
      const result = await createHousehold(
        { name: longName },
        'user-123'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.INVALID_HOUSEHOLD_NAME);
      expect(result.error?.message).toContain('50 characters or less');
    });

    it('should fail if household name contains invalid characters', async () => {
      const result = await createHousehold(
        { name: 'Invalid! @#$%' },
        'user-123'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.INVALID_HOUSEHOLD_NAME);
      expect(result.error?.message).toContain('letters, numbers, and spaces');
    });

    it('should fail if description is too long', async () => {
      const longDescription = 'A'.repeat(201);
      const result = await createHousehold(
        {
          name: 'Valid Name',
          description: longDescription,
        },
        'user-123'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.INVALID_INPUT);
      expect(result.error?.message).toContain('200 characters or less');
    });

    it('should fail if user is already in a household', async () => {
      // Mock: Existing membership found
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            household_id: 'existing-household',
            status: 'active',
          },
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValueOnce(mockQuery);

      const result = await createHousehold(
        { name: 'New House' },
        'user-123'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.ALREADY_IN_HOUSEHOLD);
    });

    it('should rollback household if leader member creation fails', async () => {
      const userId = 'user-123';
      const householdData = {
        id: 'household-456',
        name: 'The Zeder House',
        description: null,
        invite_code: 'ZEDER-ALPHA-BRAVO',
        invite_code_expires_at: '2026-03-01T00:00:00Z',
        leader_id: userId,
        created_at: '2026-02-01T00:00:00Z',
        updated_at: '2026-02-01T00:00:00Z',
      };

      // Mock: No existing membership
      mockTableQuery.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      // Mock: Invite code is unique
      mockTableQuery.single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock: Household creation succeeds
      mockTableQuery.single.mockResolvedValueOnce({
        data: householdData,
        error: null,
      });

      // Mock: Leader member creation fails
      mockTableQuery.insert.mockResolvedValueOnce({
        data: null,
        error: new Error('Database error'),
      });

      // Mock: Rollback delete
      mockTableQuery.eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await createHousehold(
        { name: 'The Zeder House' },
        userId
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.DATABASE_ERROR);
    });
  });

  // ==========================================================================
  // GET HOUSEHOLD TESTS
  // ==========================================================================

  describe('getHousehold()', () => {
    it('should return user\'s household with members', async () => {
      const userId = 'user-123';
      const householdData = {
        id: 'household-456',
        name: 'The Zeder House',
        description: 'Our household',
        invite_code: 'ZEDER-ALPHA-BRAVO',
        invite_code_expires_at: '2026-03-01T00:00:00Z',
        leader_id: userId,
        created_at: '2026-02-01T00:00:00Z',
        updated_at: '2026-02-01T00:00:00Z',
      };

      const membersData = [
        {
          id: 'member-1',
          household_id: 'household-456',
          user_id: userId,
          role: 'leader',
          status: 'active',
          is_temporary: false,
          temporary_expires_at: null,
          invited_by: null,
          joined_at: '2026-02-01T00:00:00Z',
        },
      ];

      const mockCalls = [
        // 1. Get user's membership
        {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              household_id: 'household-456',
              role: 'leader',
              status: 'active',
            },
            error: null,
          }),
        },
        // 2. Get household details
        {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: householdData,
            error: null,
          }),
        },
        // 3. Get members list
        {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: membersData,
            error: null,
          }),
        },
        // 4. Get pending requests (for leader)
        {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        },
      ];

      let callIndex = 0;
      mockSupabase.from.mockImplementation(() => mockCalls[callIndex++]);

      const result = await getHousehold(userId);

      expect(result.success).toBe(true);
      expect(result.household?.id).toBe('household-456');
      expect(result.members).toHaveLength(1);
      expect(result.memberCount).toBe(1);
      expect(result.userRole).toBe('leader');
    });

    it('should return null if user is not in a household', async () => {
      // Mock: No membership found
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      };

      mockSupabase.from.mockReturnValueOnce(mockQuery);

      const result = await getHousehold('user-123');

      expect(result.success).toBe(true);
      expect(result.household).toBeNull();
      expect(result.members).toHaveLength(0);
      expect(result.userRole).toBeNull();
    });

    it('should only return pending requests if user is leader', async () => {
      const userId = 'user-123';

      const mockCalls = [
        // 1. Get user's membership (as member, not leader)
        {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              household_id: 'household-456',
              role: 'member',
              status: 'active',
            },
            error: null,
          }),
        },
        // 2. Get household details
        {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'household-456',
              name: 'Test House',
              description: null,
              invite_code: 'TEST-CODE',
              invite_code_expires_at: null,
              leader_id: 'other-user',
              created_at: '2026-02-01T00:00:00Z',
              updated_at: '2026-02-01T00:00:00Z',
            },
            error: null,
          }),
        },
        // 3. Get members list
        {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        },
      ];

      let callIndex = 0;
      mockSupabase.from.mockImplementation(() => mockCalls[callIndex++]);

      const result = await getHousehold(userId);

      expect(result.success).toBe(true);
      expect(result.pendingRequests).toHaveLength(0);
      expect(result.userRole).toBe('member');
    });
  });

  // ==========================================================================
  // REQUEST JOIN HOUSEHOLD TESTS
  // ==========================================================================

  describe('requestJoinHousehold()', () => {
    it('should successfully create a join request', async () => {
      const userId = 'user-123';
      const inviteCode = 'ZEDER-ALPHA-BRAVO';

      const mockCalls = [
        // 1. Check existing membership
        {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        },
        // 2. Rate limit check (within limit)
        {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        },
        // 3. Find household by invite code
        {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'household-456',
              name: 'The Zeder House',
              invite_code: inviteCode,
              invite_code_expires_at: '2026-12-31T00:00:00Z', // Future date
              leader_id: 'leader-123',
            },
            error: null,
          }),
        },
        // 4. Member count check (under limit) - needs select().eq().eq()
        {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: Array(10), // 10 members (under 15 limit)
                error: null,
              }),
            }),
          }),
        },
        // 5. No existing pending request
        {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        },
        // 6. Create join request
        {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'request-789',
              household_id: 'household-456',
              user_id: userId,
              invite_code: inviteCode,
              status: 'pending',
              requested_at: '2026-02-01T00:00:00Z',
            },
            error: null,
          }),
        },
      ];

      let callIndex = 0;
      mockSupabase.from.mockImplementation(() => mockCalls[callIndex++]);

      const result = await requestJoinHousehold(
        { inviteCode },
        userId
      );

      expect(result.success).toBe(true);
      expect(result.requestId).toBe('request-789');
      expect(result.message).toContain('Join request sent');
    });

    it('should fail with invalid invite code format', async () => {
      const result = await requestJoinHousehold(
        { inviteCode: 'INVALID' },
        'user-123'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.INVALID_INVITE_CODE);
    });

    it('should fail if user is already in a household', async () => {
      // Mock: Existing membership
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            household_id: 'existing-household',
          },
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValueOnce(mockQuery);

      const result = await requestJoinHousehold(
        { inviteCode: 'ZEDER-ALPHA-BRAVO' },
        'user-123'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.ALREADY_IN_HOUSEHOLD);
    });

    it('should fail if rate limit exceeded', async () => {
      const mockCalls = [
        // 1. Check existing membership
        {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        },
        // 2. Rate limit check (6 requests in last hour)
        {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockResolvedValue({
            data: Array(6), // 6 requests (exceeds 5 limit)
            error: null,
          }),
        },
      ];

      let callIndex = 0;
      mockSupabase.from.mockImplementation(() => mockCalls[callIndex++]);

      const result = await requestJoinHousehold(
        { inviteCode: 'ZEDER-ALPHA-BRAVO' },
        'user-123'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.RATE_LIMIT_EXCEEDED);
    });

    it('should fail if invite code does not exist', async () => {
      const mockCalls = [
        // 1. Check existing membership
        {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        },
        // 2. Rate limit check
        {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        },
        // 3. Invite code not found
        {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        },
      ];

      let callIndex = 0;
      mockSupabase.from.mockImplementation(() => mockCalls[callIndex++]);

      const result = await requestJoinHousehold(
        { inviteCode: 'INVALID-CODE-HERE' },
        'user-123'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.INVALID_INVITE_CODE);
    });

    it('should fail if invite code has expired', async () => {
      const mockCalls = [
        // 1. Check existing membership
        {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        },
        // 2. Rate limit check
        {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        },
        // 3. Find household with expired code
        {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'household-456',
              invite_code: 'ZEDER-ALPHA-BRAVO',
              invite_code_expires_at: '2020-01-01T00:00:00Z', // Past date
            },
            error: null,
          }),
        },
      ];

      let callIndex = 0;
      mockSupabase.from.mockImplementation(() => mockCalls[callIndex++]);

      const result = await requestJoinHousehold(
        { inviteCode: 'ZEDER-ALPHA-BRAVO' },
        'user-123'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.EXPIRED_INVITE_CODE);
    });

    it('should fail if household is at capacity', async () => {
      // Create a proper chain for member count (needs 2 eq() calls)
      const eq2Mock = {
        mockResolvedValue: vi.fn().mockResolvedValue({
          data: Array(15),
          error: null,
        }),
      };
      const eq1Mock = {
        mockReturnThis: vi.fn().mockReturnValue(eq2Mock),
      };

      const mockCalls = [
        // 1. Check existing membership
        {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        },
        // 2. Rate limit check
        {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        },
        // 3. Find household
        {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'household-456',
              invite_code: 'ZEDER-ALPHA-BRAVO',
              invite_code_expires_at: '2026-12-31T00:00:00Z',
            },
            error: null,
          }),
        },
        // 4. Member count at capacity (15 members) - needs select().eq().eq()
        {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: Array(15),
                error: null,
              }),
            }),
          }),
        },
      ];

      let callIndex = 0;
      mockSupabase.from.mockImplementation(() => mockCalls[callIndex++]);

      const result = await requestJoinHousehold(
        { inviteCode: 'ZEDER-ALPHA-BRAVO' },
        'user-123'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.HOUSEHOLD_AT_CAPACITY);
    });

    it('should fail if duplicate pending request exists', async () => {
      const mockCalls = [
        // 1. Check existing membership
        {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        },
        // 2. Rate limit check
        {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        },
        // 3. Find household
        {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'household-456',
              invite_code: 'ZEDER-ALPHA-BRAVO',
              invite_code_expires_at: '2026-12-31T00:00:00Z',
            },
            error: null,
          }),
        },
        // 4. Member count check - needs select().eq().eq()
        {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: Array(5),
                error: null,
              }),
            }),
          }),
        },
        // 5. Existing pending request
        {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'existing-request',
              status: 'pending',
            },
            error: null,
          }),
        },
      ];

      let callIndex = 0;
      mockSupabase.from.mockImplementation(() => mockCalls[callIndex++]);

      const result = await requestJoinHousehold(
        { inviteCode: 'ZEDER-ALPHA-BRAVO' },
        'user-123'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.DUPLICATE_REQUEST);
    });
  });

  // ==========================================================================
  // RESPOND TO JOIN REQUEST TESTS
  // ==========================================================================

  describe('respondToJoinRequest()', () => {
    it('should successfully approve a join request', async () => {
      const mockCalls = [
        { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { id: 'request-789', household_id: 'household-456', user_id: 'user-123', status: 'pending' }, error: null }) },
        { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { leader_id: 'leader-123' }, error: null }) },
        { update: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ data: null, error: null }) },
        { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null, error: null }) },
        { insert: vi.fn().mockResolvedValue({ data: [{ id: 'member-new' }], error: null }) },
      ];
      let callIndex = 0;
      mockSupabase.from.mockImplementation(() => mockCalls[callIndex++]);

      const result = await respondToJoinRequest({ requestId: 'request-789', action: 'approve' }, 'leader-123');
      expect(result.success).toBe(true);
      expect(result.message).toContain('approved');
    });

    it('should successfully reject a join request', async () => {
      const mockCalls = [
        { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { id: 'request-789', household_id: 'household-456', user_id: 'user-123', status: 'pending' }, error: null }) },
        { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { leader_id: 'leader-123' }, error: null }) },
        { update: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ data: null, error: null }) },
      ];
      let callIndex = 0;
      mockSupabase.from.mockImplementation(() => mockCalls[callIndex++]);

      const result = await respondToJoinRequest({ requestId: 'request-789', action: 'reject' }, 'leader-123');
      expect(result.success).toBe(true);
      expect(result.message).toContain('rejected');
    });

    it('should fail if request not found', async () => {
      mockSupabase.from.mockReturnValueOnce({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }) });
      const result = await respondToJoinRequest({ requestId: 'nonexistent', action: 'approve' }, 'leader-123');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.REQUEST_NOT_FOUND);
    });

    it('should fail if request already responded to', async () => {
      mockSupabase.from.mockReturnValueOnce({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { id: 'request-789', status: 'approved' }, error: null }) });
      const result = await respondToJoinRequest({ requestId: 'request-789', action: 'approve' }, 'leader-123');
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('already been');
    });

    it('should fail if responder is not the household leader', async () => {
      const mockCalls = [
        { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { id: 'request-789', household_id: 'household-456', status: 'pending' }, error: null }) },
        { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { leader_id: 'actual-leader' }, error: null }) },
      ];
      let callIndex = 0;
      mockSupabase.from.mockImplementation(() => mockCalls[callIndex++]);

      const result = await respondToJoinRequest({ requestId: 'request-789', action: 'approve' }, 'not-leader');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.NOT_HOUSEHOLD_LEADER);
    });
  });

  // ==========================================================================
  // REMOVE MEMBER TESTS
  // ==========================================================================

  describe('removeMember()', () => {
    it('should successfully remove a member', async () => {
      const mockCalls = [
        // First call: Get household
        {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { leader_id: 'leader-123' },
            error: null
          })
        },
        // Second call: Get member with multiple eq() calls
        {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(), // household_id
          single: vi.fn().mockResolvedValue({
            data: { id: 'member-456', user_id: 'member-user', role: 'member' },
            error: null
          })
        },
        // Third call: Update member status
        {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null
          })
        },
      ];
      let callIndex = 0;
      mockSupabase.from.mockImplementation(() => mockCalls[callIndex++]);

      const result = await removeMember({ householdId: 'household-456', memberId: 'member-user' }, 'leader-123');
      expect(result.success).toBe(true);
      expect(result.message).toContain('removed');
    });

    it('should fail if household not found', async () => {
      mockSupabase.from.mockReturnValueOnce({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }) });
      const result = await removeMember({ householdId: 'nonexistent', memberId: 'member-user' }, 'leader-123');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.HOUSEHOLD_NOT_FOUND);
    });

    it('should fail if remover is not the household leader', async () => {
      mockSupabase.from.mockReturnValueOnce({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { leader_id: 'actual-leader' }, error: null }) });
      const result = await removeMember({ householdId: 'household-456', memberId: 'member-user' }, 'not-leader');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.NOT_HOUSEHOLD_LEADER);
    });

    it('should fail if trying to remove self', async () => {
      mockSupabase.from.mockReturnValueOnce({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { leader_id: 'leader-123' }, error: null }) });
      const result = await removeMember({ householdId: 'household-456', memberId: 'leader-123' }, 'leader-123');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.CANNOT_REMOVE_SELF);
    });

    it('should fail if member not found', async () => {
      const mockCalls = [
        { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { leader_id: 'leader-123' }, error: null }) },
        { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }) },
      ];
      let callIndex = 0;
      mockSupabase.from.mockImplementation(() => mockCalls[callIndex++]);
      const result = await removeMember({ householdId: 'household-456', memberId: 'nonexistent' }, 'leader-123');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.MEMBER_NOT_FOUND);
    });
  });

  // ==========================================================================
  // REGENERATE INVITE CODE TESTS
  // ==========================================================================

  describe('regenerateInviteCode()', () => {
    it('should successfully regenerate invite code', async () => {
      const mockCalls = [
        // First call: Get household
        {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: 'household-456', name: 'The Zeder House', leader_id: 'leader-123' },
            error: null
          })
        },
        // Second call: Check if invite code exists (inside withLock)
        {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: null
          })
        },
        // Third call: Update household with new invite code
        {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null
          })
        },
      ];
      let callIndex = 0;
      mockSupabase.from.mockImplementation(() => mockCalls[callIndex++]);

      const result = await regenerateInviteCode({ householdId: 'household-456', expirationDays: 30 }, 'leader-123');
      expect(result.success).toBe(true);
      expect(result.inviteCode).toBeDefined();
      expect(result.expiresAt).toBeDefined();
    });

    it('should fail if household not found', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }
        })
      };
      mockSupabase.from.mockReturnValueOnce(mockChain);

      const result = await regenerateInviteCode({ householdId: 'nonexistent' }, 'leader-123');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.HOUSEHOLD_NOT_FOUND);
    });

    it('should fail if user is not the household leader', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'household-456', leader_id: 'actual-leader' },
          error: null
        })
      };
      mockSupabase.from.mockReturnValueOnce(mockChain);

      const result = await regenerateInviteCode({ householdId: 'household-456' }, 'not-leader');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.NOT_HOUSEHOLD_LEADER);
    });
  });

  // ==========================================================================
  // LEAVE HOUSEHOLD TESTS
  // ==========================================================================

  describe('leaveHousehold()', () => {
    it('should allow member to leave household', async () => {
      const mockCalls = [
        { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { id: 'member-456', household_id: 'household-789', user_id: 'user-123', role: 'member' }, error: null }) },
        { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockResolvedValue({ data: [{ user_id: 'leader-123', role: 'leader' }, { user_id: 'user-123', role: 'member' }], error: null }) },
        { update: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ data: null, error: null }) },
      ];
      let callIndex = 0;
      mockSupabase.from.mockImplementation(() => mockCalls[callIndex++]);
      const result = await leaveHousehold({ householdId: 'household-789' }, 'user-123');
      expect(result.success).toBe(true);
      expect(result.message).toContain('left the household');
    });

    it('should transfer leadership when leader leaves with other members', async () => {
      const mockCalls = [
        { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { id: 'member-leader', household_id: 'household-789', user_id: 'leader-123', role: 'leader' }, error: null }) },
        { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockResolvedValue({ data: [{ user_id: 'leader-123', role: 'leader', joined_at: '2026-01-01T00:00:00Z' }, { user_id: 'member-1', role: 'member', joined_at: '2026-01-02T00:00:00Z' }, { user_id: 'member-2', role: 'member', joined_at: '2026-01-03T00:00:00Z' }], error: null }) },
        { update: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ data: null, error: null }) },
        { update: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }) }) },
        { update: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ data: null, error: null }) },
      ];
      let callIndex = 0;
      mockSupabase.from.mockImplementation(() => mockCalls[callIndex++]);
      const result = await leaveHousehold({ householdId: 'household-789' }, 'leader-123');
      expect(result.success).toBe(true);
      expect(result.newLeaderId).toBe('member-1');
      expect(result.message).toContain('Leadership has been transferred');
    });

    it('should use designated successor if provided', async () => {
      const mockCalls = [
        { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { id: 'member-leader', household_id: 'household-789', user_id: 'leader-123', role: 'leader' }, error: null }) },
        { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockResolvedValue({ data: [{ user_id: 'leader-123', role: 'leader', joined_at: '2026-01-01T00:00:00Z' }, { user_id: 'member-1', role: 'member', joined_at: '2026-01-02T00:00:00Z' }, { user_id: 'member-2', role: 'member', joined_at: '2026-01-03T00:00:00Z' }], error: null }) },
        { update: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ data: null, error: null }) },
        { update: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }) }) },
        { update: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ data: null, error: null }) },
      ];
      let callIndex = 0;
      mockSupabase.from.mockImplementation(() => mockCalls[callIndex++]);
      const result = await leaveHousehold({ householdId: 'household-789', successorId: 'member-2' }, 'leader-123');
      expect(result.success).toBe(true);
      expect(result.newLeaderId).toBe('member-2');
    });

    it('should fail if user is not a member', async () => {
      mockSupabase.from.mockReturnValueOnce({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }) });
      const result = await leaveHousehold({ householdId: 'household-789' }, 'user-123');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.NOT_HOUSEHOLD_MEMBER);
    });

    it('should fail if designated successor is not a member', async () => {
      const mockCalls = [
        { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { id: 'member-leader', household_id: 'household-789', user_id: 'leader-123', role: 'leader' }, error: null }) },
        { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockResolvedValue({ data: [{ user_id: 'leader-123', role: 'leader' }, { user_id: 'member-1', role: 'member' }], error: null }) },
      ];
      let callIndex = 0;
      mockSupabase.from.mockImplementation(() => mockCalls[callIndex++]);
      const result = await leaveHousehold({ householdId: 'household-789', successorId: 'nonexistent-member' }, 'leader-123');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.MEMBER_NOT_FOUND);
    });
  });

  // ==========================================================================
  // WITHDRAW JOIN REQUEST TESTS
  // ==========================================================================

  describe('withdrawJoinRequest()', () => {
    it('should successfully withdraw a pending request', async () => {
      const mockCalls = [
        { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { id: 'request-789', user_id: 'user-123', household_id: 'household-456', status: 'pending' }, error: null }) },
        { update: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ data: null, error: null }) },
      ];
      let callIndex = 0;
      mockSupabase.from.mockImplementation(() => mockCalls[callIndex++]);

      const result = await withdrawJoinRequest({ requestId: 'request-789' }, 'user-123');
      expect(result.success).toBe(true);
      expect(result.message).toContain('withdrawn');
    });

    it('should fail if request not found', async () => {
      mockSupabase.from.mockReturnValueOnce({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }) });
      const result = await withdrawJoinRequest({ requestId: 'nonexistent' }, 'user-123');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.REQUEST_NOT_FOUND);
    });

    it('should fail if user does not own the request', async () => {
      mockSupabase.from.mockReturnValueOnce({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { id: 'request-789', user_id: 'other-user', status: 'pending' }, error: null }) });
      const result = await withdrawJoinRequest({ requestId: 'request-789' }, 'user-123');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.REQUEST_NOT_FOUND);
    });

    it('should fail if request has already been responded to', async () => {
      mockSupabase.from.mockReturnValueOnce({ select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { id: 'request-789', user_id: 'user-123', status: 'approved' }, error: null }) });
      const result = await withdrawJoinRequest({ requestId: 'request-789' }, 'user-123');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.CANNOT_WITHDRAW_RESPONDED_REQUEST);
    });
  });

  // ==========================================================================
  // SEND EMAIL INVITE TESTS
  // ==========================================================================

  describe('sendEmailInvite()', () => {
    it('should successfully queue email invite', async () => {
      const mockCalls = [
        // First call: Get household
        {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'household-456',
              name: 'The Zeder House',
              leader_id: 'leader-123',
              invite_code: 'ZEDER-ALPHA-BRAVO',
              description: 'Our family household'
            },
            error: null
          })
        },
        // Second call: Get leader profile
        {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              name: 'John Leader',
              email: 'leader@example.com'
            },
            error: null
          })
        },
      ];
      let callIndex = 0;
      mockSupabase.from.mockImplementation(() => mockCalls[callIndex++]);

      const result = await sendEmailInvite(
        { householdId: 'household-456', email: 'friend@example.com', personalMessage: 'Join our household!' },
        'leader-123'
      );
      expect(result.success).toBe(true);
      expect(result.message).toContain('sent successfully');
    });

    it('should fail with invalid email', async () => {
      const result = await sendEmailInvite({ householdId: 'household-456', email: 'invalid-email' }, 'leader-123');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.INVALID_EMAIL);
    });

    it('should fail if household not found', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }
        })
      };
      mockSupabase.from.mockReturnValueOnce(mockChain);

      const result = await sendEmailInvite({ householdId: 'nonexistent', email: 'friend@example.com' }, 'leader-123');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.HOUSEHOLD_NOT_FOUND);
    });

    it('should fail if user is not the household leader', async () => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'household-456', leader_id: 'actual-leader' },
          error: null
        })
      };
      mockSupabase.from.mockReturnValueOnce(mockChain);

      const result = await sendEmailInvite({ householdId: 'household-456', email: 'friend@example.com' }, 'not-leader');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.NOT_HOUSEHOLD_LEADER);
    });
  });
});
