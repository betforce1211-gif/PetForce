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
      mockTableQuery.single.mockResolvedValueOnce({
        data: {
          household_id: 'existing-household',
          status: 'active',
        },
        error: null,
      });

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

      // Mock: User's membership
      mockTableQuery.single.mockResolvedValueOnce({
        data: {
          household_id: 'household-456',
          role: 'leader',
          status: 'active',
        },
        error: null,
      });

      // Mock: Household details
      mockTableQuery.single.mockResolvedValueOnce({
        data: householdData,
        error: null,
      });

      // Mock: Members list
      mockTableQuery.order.mockResolvedValueOnce({
        data: membersData,
        error: null,
      });

      // Mock: Pending requests (for leader)
      mockTableQuery.order.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await getHousehold(userId);

      expect(result.success).toBe(true);
      expect(result.household?.id).toBe('household-456');
      expect(result.members).toHaveLength(1);
      expect(result.memberCount).toBe(1);
      expect(result.userRole).toBe('leader');
    });

    it('should return null if user is not in a household', async () => {
      // Mock: No membership found
      mockTableQuery.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await getHousehold('user-123');

      expect(result.success).toBe(true);
      expect(result.household).toBeNull();
      expect(result.members).toHaveLength(0);
      expect(result.userRole).toBeNull();
    });

    it('should only return pending requests if user is leader', async () => {
      const userId = 'user-123';

      // Mock: User's membership (as member, not leader)
      mockTableQuery.single.mockResolvedValueOnce({
        data: {
          household_id: 'household-456',
          role: 'member',
          status: 'active',
        },
        error: null,
      });

      // Mock: Household details
      mockTableQuery.single.mockResolvedValueOnce({
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
      });

      // Mock: Members list
      mockTableQuery.order.mockResolvedValueOnce({
        data: [],
        error: null,
      });

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

      // Mock: No existing membership
      mockTableQuery.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      // Mock: Rate limit check (within limit)
      mockTableQuery.gte.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      // Mock: Find household by invite code
      mockTableQuery.single.mockResolvedValueOnce({
        data: {
          id: 'household-456',
          name: 'The Zeder House',
          invite_code: inviteCode,
          invite_code_expires_at: '2026-12-31T00:00:00Z', // Future date
          leader_id: 'leader-123',
        },
        error: null,
      });

      // Mock: Member count check (under limit)
      mockTableQuery.eq.mockResolvedValueOnce({
        data: Array(10), // 10 members (under 15 limit)
        error: null,
      });

      // Mock: No existing pending request
      mockTableQuery.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      // Mock: Create join request
      mockTableQuery.single.mockResolvedValueOnce({
        data: {
          id: 'request-789',
          household_id: 'household-456',
          user_id: userId,
          invite_code: inviteCode,
          status: 'pending',
          requested_at: '2026-02-01T00:00:00Z',
        },
        error: null,
      });

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
      mockTableQuery.single.mockResolvedValueOnce({
        data: {
          household_id: 'existing-household',
        },
        error: null,
      });

      const result = await requestJoinHousehold(
        { inviteCode: 'ZEDER-ALPHA-BRAVO' },
        'user-123'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.ALREADY_IN_HOUSEHOLD);
    });

    it('should fail if rate limit exceeded', async () => {
      // Mock: No existing membership
      mockTableQuery.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      // Mock: Rate limit exceeded (6 requests in last hour)
      mockTableQuery.gte.mockResolvedValueOnce({
        data: Array(6), // 6 requests (exceeds 5 limit)
        error: null,
      });

      const result = await requestJoinHousehold(
        { inviteCode: 'ZEDER-ALPHA-BRAVO' },
        'user-123'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.RATE_LIMIT_EXCEEDED);
    });

    it('should fail if invite code does not exist', async () => {
      // Mock: No existing membership
      mockTableQuery.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      // Mock: Rate limit check
      mockTableQuery.gte.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      // Mock: Invite code not found
      mockTableQuery.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await requestJoinHousehold(
        { inviteCode: 'INVALID-CODE-HERE' },
        'user-123'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.INVALID_INVITE_CODE);
    });

    it('should fail if invite code has expired', async () => {
      // Mock: No existing membership
      mockTableQuery.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      // Mock: Rate limit check
      mockTableQuery.gte.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      // Mock: Find household with expired code
      mockTableQuery.single.mockResolvedValueOnce({
        data: {
          id: 'household-456',
          invite_code: 'ZEDER-ALPHA-BRAVO',
          invite_code_expires_at: '2020-01-01T00:00:00Z', // Past date
        },
        error: null,
      });

      const result = await requestJoinHousehold(
        { inviteCode: 'ZEDER-ALPHA-BRAVO' },
        'user-123'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.EXPIRED_INVITE_CODE);
    });

    it('should fail if household is at capacity', async () => {
      // Mock: No existing membership
      mockTableQuery.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      // Mock: Rate limit check
      mockTableQuery.gte.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      // Mock: Find household
      mockTableQuery.single.mockResolvedValueOnce({
        data: {
          id: 'household-456',
          invite_code: 'ZEDER-ALPHA-BRAVO',
          invite_code_expires_at: '2026-12-31T00:00:00Z',
        },
        error: null,
      });

      // Mock: Member count at capacity (15 members)
      mockTableQuery.eq.mockResolvedValueOnce({
        data: Array(15),
        error: null,
      });

      const result = await requestJoinHousehold(
        { inviteCode: 'ZEDER-ALPHA-BRAVO' },
        'user-123'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.HOUSEHOLD_AT_CAPACITY);
    });

    it('should fail if duplicate pending request exists', async () => {
      // Mock: No existing membership
      mockTableQuery.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      // Mock: Rate limit check
      mockTableQuery.gte.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      // Mock: Find household
      mockTableQuery.single.mockResolvedValueOnce({
        data: {
          id: 'household-456',
          invite_code: 'ZEDER-ALPHA-BRAVO',
          invite_code_expires_at: '2026-12-31T00:00:00Z',
        },
        error: null,
      });

      // Mock: Member count check
      mockTableQuery.eq.mockResolvedValueOnce({
        data: Array(5),
        error: null,
      });

      // Mock: Existing pending request
      mockTableQuery.single.mockResolvedValueOnce({
        data: {
          id: 'existing-request',
          status: 'pending',
        },
        error: null,
      });

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
      const leaderId = 'leader-123';
      const requestId = 'request-789';

      // Mock: Get join request
      mockTableQuery.single.mockResolvedValueOnce({
        data: {
          id: requestId,
          household_id: 'household-456',
          user_id: 'user-123',
          status: 'pending',
        },
        error: null,
      });

      // Mock: Verify leader
      mockTableQuery.single.mockResolvedValueOnce({
        data: {
          leader_id: leaderId,
        },
        error: null,
      });

      // Mock: Update request status
      mockTableQuery.eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock: Check for existing member (race condition)
      mockTableQuery.single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock: Add member
      mockTableQuery.insert.mockResolvedValueOnce({
        data: [{ id: 'member-new' }],
        error: null,
      });

      const result = await respondToJoinRequest(
        {
          requestId,
          action: 'approve',
        },
        leaderId
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('approved');
    });

    it('should successfully reject a join request', async () => {
      const leaderId = 'leader-123';
      const requestId = 'request-789';

      // Mock: Get join request
      mockTableQuery.single.mockResolvedValueOnce({
        data: {
          id: requestId,
          household_id: 'household-456',
          user_id: 'user-123',
          status: 'pending',
        },
        error: null,
      });

      // Mock: Verify leader
      mockTableQuery.single.mockResolvedValueOnce({
        data: {
          leader_id: leaderId,
        },
        error: null,
      });

      // Mock: Update request status
      mockTableQuery.eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await respondToJoinRequest(
        {
          requestId,
          action: 'reject',
        },
        leaderId
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('rejected');
    });

    it('should fail if request not found', async () => {
      // Mock: Request not found
      mockTableQuery.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await respondToJoinRequest(
        {
          requestId: 'nonexistent',
          action: 'approve',
        },
        'leader-123'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.REQUEST_NOT_FOUND);
    });

    it('should fail if request already responded to', async () => {
      // Mock: Get join request (already approved)
      mockTableQuery.single.mockResolvedValueOnce({
        data: {
          id: 'request-789',
          status: 'approved',
        },
        error: null,
      });

      const result = await respondToJoinRequest(
        {
          requestId: 'request-789',
          action: 'approve',
        },
        'leader-123'
      );

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('already been');
    });

    it('should fail if responder is not the household leader', async () => {
      // Mock: Get join request
      mockTableQuery.single.mockResolvedValueOnce({
        data: {
          id: 'request-789',
          household_id: 'household-456',
          status: 'pending',
        },
        error: null,
      });

      // Mock: Verify leader (different user)
      mockTableQuery.single.mockResolvedValueOnce({
        data: {
          leader_id: 'actual-leader',
        },
        error: null,
      });

      const result = await respondToJoinRequest(
        {
          requestId: 'request-789',
          action: 'approve',
        },
        'not-leader'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.NOT_HOUSEHOLD_LEADER);
    });
  });

  // ==========================================================================
  // REMOVE MEMBER TESTS
  // ==========================================================================

  describe('removeMember()', () => {
    it('should successfully remove a member', async () => {
      const leaderId = 'leader-123';

      // Mock: Verify leader
      mockTableQuery.single.mockResolvedValueOnce({
        data: {
          leader_id: leaderId,
        },
        error: null,
      });

      // Mock: Get member to remove
      mockTableQuery.single.mockResolvedValueOnce({
        data: {
          id: 'member-456',
          user_id: 'member-user',
          role: 'member',
        },
        error: null,
      });

      // Mock: Update member status
      mockTableQuery.eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await removeMember(
        {
          householdId: 'household-456',
          memberId: 'member-user',
        },
        leaderId
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('removed');
    });

    it('should fail if household not found', async () => {
      // Mock: Household not found
      mockTableQuery.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await removeMember(
        {
          householdId: 'nonexistent',
          memberId: 'member-user',
        },
        'leader-123'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.HOUSEHOLD_NOT_FOUND);
    });

    it('should fail if remover is not the household leader', async () => {
      // Mock: Verify leader (different user)
      mockTableQuery.single.mockResolvedValueOnce({
        data: {
          leader_id: 'actual-leader',
        },
        error: null,
      });

      const result = await removeMember(
        {
          householdId: 'household-456',
          memberId: 'member-user',
        },
        'not-leader'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.NOT_HOUSEHOLD_LEADER);
    });

    it('should fail if trying to remove self', async () => {
      const leaderId = 'leader-123';

      // Mock: Verify leader
      mockTableQuery.single.mockResolvedValueOnce({
        data: {
          leader_id: leaderId,
        },
        error: null,
      });

      const result = await removeMember(
        {
          householdId: 'household-456',
          memberId: leaderId, // Trying to remove self
        },
        leaderId
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.CANNOT_REMOVE_SELF);
    });

    it('should fail if member not found', async () => {
      const leaderId = 'leader-123';

      // Mock: Verify leader
      mockTableQuery.single.mockResolvedValueOnce({
        data: {
          leader_id: leaderId,
        },
        error: null,
      });

      // Mock: Member not found
      mockTableQuery.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await removeMember(
        {
          householdId: 'household-456',
          memberId: 'nonexistent',
        },
        leaderId
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.MEMBER_NOT_FOUND);
    });
  });

  // ==========================================================================
  // REGENERATE INVITE CODE TESTS
  // ==========================================================================

  describe('regenerateInviteCode()', () => {
    it('should successfully regenerate invite code', async () => {
      const leaderId = 'leader-123';

      // Mock: Get household and verify leader
      mockTableQuery.single.mockResolvedValueOnce({
        data: {
          id: 'household-456',
          name: 'The Zeder House',
          leader_id: leaderId,
        },
        error: null,
      });

      // Mock: Check new code uniqueness
      mockTableQuery.single.mockResolvedValueOnce({
        data: null, // Code is unique
        error: null,
      });

      // Mock: Update household with new code
      mockTableQuery.eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await regenerateInviteCode(
        {
          householdId: 'household-456',
          expirationDays: 30,
        },
        leaderId
      );

      expect(result.success).toBe(true);
      expect(result.inviteCode).toBe('ZEDER-ALPHA-BRAVO');
      expect(result.expiresAt).toBe('2026-03-01T00:00:00Z');
    });

    it('should fail if household not found', async () => {
      // Mock: Household not found
      mockTableQuery.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await regenerateInviteCode(
        {
          householdId: 'nonexistent',
        },
        'leader-123'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.HOUSEHOLD_NOT_FOUND);
    });

    it('should fail if user is not the household leader', async () => {
      // Mock: Get household (different leader)
      mockTableQuery.single.mockResolvedValueOnce({
        data: {
          id: 'household-456',
          leader_id: 'actual-leader',
        },
        error: null,
      });

      const result = await regenerateInviteCode(
        {
          householdId: 'household-456',
        },
        'not-leader'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.NOT_HOUSEHOLD_LEADER);
    });
  });

  // ==========================================================================
  // LEAVE HOUSEHOLD TESTS
  // ==========================================================================

  describe('leaveHousehold()', () => {
    it('should allow member to leave household', async () => {
      const userId = 'user-123';

      // Mock: Get user's membership (as member, not leader)
      mockTableQuery.single.mockResolvedValueOnce({
        data: {
          id: 'member-456',
          household_id: 'household-789',
          user_id: userId,
          role: 'member',
        },
        error: null,
      });

      // Mock: Get all active members
      mockTableQuery.order.mockResolvedValueOnce({
        data: [
          { user_id: 'leader-123', role: 'leader' },
          { user_id: userId, role: 'member' },
        ],
        error: null,
      });

      // Mock: Remove user's membership
      mockTableQuery.eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await leaveHousehold(
        {
          householdId: 'household-789',
        },
        userId
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('left the household');
    });

    it('should transfer leadership when leader leaves with other members', async () => {
      const leaderId = 'leader-123';

      // Mock: Get leader's membership
      mockTableQuery.single.mockResolvedValueOnce({
        data: {
          id: 'member-leader',
          household_id: 'household-789',
          user_id: leaderId,
          role: 'leader',
        },
        error: null,
      });

      // Mock: Get all active members (leader + 2 others)
      mockTableQuery.order.mockResolvedValueOnce({
        data: [
          {
            user_id: leaderId,
            role: 'leader',
            joined_at: '2026-01-01T00:00:00Z',
          },
          {
            user_id: 'member-1',
            role: 'member',
            joined_at: '2026-01-02T00:00:00Z', // Oldest member (after leader)
          },
          {
            user_id: 'member-2',
            role: 'member',
            joined_at: '2026-01-03T00:00:00Z',
          },
        ],
        error: null,
      });

      // Mock: Update household leader
      mockTableQuery.eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock: Update new leader's role
      mockTableQuery.eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock: Remove leader's membership
      mockTableQuery.eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await leaveHousehold(
        {
          householdId: 'household-789',
        },
        leaderId
      );

      expect(result.success).toBe(true);
      expect(result.newLeaderId).toBe('member-1'); // Longest-standing member
      expect(result.message).toContain('Leadership has been transferred');
    });

    it('should use designated successor if provided', async () => {
      const leaderId = 'leader-123';
      const successorId = 'member-2'; // Not longest-standing, but designated

      // Mock: Get leader's membership
      mockTableQuery.single.mockResolvedValueOnce({
        data: {
          id: 'member-leader',
          household_id: 'household-789',
          user_id: leaderId,
          role: 'leader',
        },
        error: null,
      });

      // Mock: Get all active members
      mockTableQuery.order.mockResolvedValueOnce({
        data: [
          { user_id: leaderId, role: 'leader', joined_at: '2026-01-01T00:00:00Z' },
          { user_id: 'member-1', role: 'member', joined_at: '2026-01-02T00:00:00Z' },
          { user_id: successorId, role: 'member', joined_at: '2026-01-03T00:00:00Z' },
        ],
        error: null,
      });

      // Mock: Update household leader
      mockTableQuery.eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock: Update new leader's role
      mockTableQuery.eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock: Remove leader's membership
      mockTableQuery.eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await leaveHousehold(
        {
          householdId: 'household-789',
          successorId,
        },
        leaderId
      );

      expect(result.success).toBe(true);
      expect(result.newLeaderId).toBe(successorId);
    });

    it('should fail if user is not a member', async () => {
      // Mock: Membership not found
      mockTableQuery.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await leaveHousehold(
        {
          householdId: 'household-789',
        },
        'user-123'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.NOT_HOUSEHOLD_MEMBER);
    });

    it('should fail if designated successor is not a member', async () => {
      const leaderId = 'leader-123';

      // Mock: Get leader's membership
      mockTableQuery.single.mockResolvedValueOnce({
        data: {
          id: 'member-leader',
          household_id: 'household-789',
          user_id: leaderId,
          role: 'leader',
        },
        error: null,
      });

      // Mock: Get all active members
      mockTableQuery.order.mockResolvedValueOnce({
        data: [
          { user_id: leaderId, role: 'leader' },
          { user_id: 'member-1', role: 'member' },
        ],
        error: null,
      });

      const result = await leaveHousehold(
        {
          householdId: 'household-789',
          successorId: 'nonexistent-member',
        },
        leaderId
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.MEMBER_NOT_FOUND);
    });
  });

  // ==========================================================================
  // WITHDRAW JOIN REQUEST TESTS
  // ==========================================================================

  describe('withdrawJoinRequest()', () => {
    it('should successfully withdraw a pending request', async () => {
      const userId = 'user-123';
      const requestId = 'request-789';

      // Mock: Get join request
      mockTableQuery.single.mockResolvedValueOnce({
        data: {
          id: requestId,
          user_id: userId,
          household_id: 'household-456',
          status: 'pending',
        },
        error: null,
      });

      // Mock: Update request status
      mockTableQuery.eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await withdrawJoinRequest(
        { requestId },
        userId
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('withdrawn');
    });

    it('should fail if request not found', async () => {
      // Mock: Request not found
      mockTableQuery.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await withdrawJoinRequest(
        { requestId: 'nonexistent' },
        'user-123'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.REQUEST_NOT_FOUND);
    });

    it('should fail if user does not own the request', async () => {
      // Mock: Get join request (different user)
      mockTableQuery.single.mockResolvedValueOnce({
        data: {
          id: 'request-789',
          user_id: 'other-user',
          status: 'pending',
        },
        error: null,
      });

      const result = await withdrawJoinRequest(
        { requestId: 'request-789' },
        'user-123'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.REQUEST_NOT_FOUND);
    });

    it('should fail if request has already been responded to', async () => {
      // Mock: Get join request (already approved)
      mockTableQuery.single.mockResolvedValueOnce({
        data: {
          id: 'request-789',
          user_id: 'user-123',
          status: 'approved',
        },
        error: null,
      });

      const result = await withdrawJoinRequest(
        { requestId: 'request-789' },
        'user-123'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.CANNOT_WITHDRAW_RESPONDED_REQUEST);
    });
  });

  // ==========================================================================
  // SEND EMAIL INVITE TESTS
  // ==========================================================================

  describe('sendEmailInvite()', () => {
    it('should successfully queue email invite', async () => {
      const leaderId = 'leader-123';

      // Mock: Verify leader
      mockTableQuery.single.mockResolvedValueOnce({
        data: {
          id: 'household-456',
          name: 'The Zeder House',
          leader_id: leaderId,
          invite_code: 'ZEDER-ALPHA-BRAVO',
        },
        error: null,
      });

      const result = await sendEmailInvite(
        {
          householdId: 'household-456',
          email: 'friend@example.com',
          personalMessage: 'Join our household!',
        },
        leaderId
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('sent successfully');
    });

    it('should fail with invalid email', async () => {
      const result = await sendEmailInvite(
        {
          householdId: 'household-456',
          email: 'invalid-email',
        },
        'leader-123'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.INVALID_EMAIL);
    });

    it('should fail if household not found', async () => {
      // Mock: Household not found
      mockTableQuery.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await sendEmailInvite(
        {
          householdId: 'nonexistent',
          email: 'friend@example.com',
        },
        'leader-123'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.HOUSEHOLD_NOT_FOUND);
    });

    it('should fail if user is not the household leader', async () => {
      // Mock: Verify leader (different user)
      mockTableQuery.single.mockResolvedValueOnce({
        data: {
          id: 'household-456',
          leader_id: 'actual-leader',
        },
        error: null,
      });

      const result = await sendEmailInvite(
        {
          householdId: 'household-456',
          email: 'friend@example.com',
        },
        'not-leader'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(HouseholdErrorCode.NOT_HOUSEHOLD_LEADER);
    });
  });
});
