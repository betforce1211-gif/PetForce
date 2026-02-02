/**
 * Household Store Unit Tests
 *
 * Comprehensive test coverage for the household Zustand store.
 * Tests all actions, state updates, error handling, and edge cases.
 *
 * Coverage Target: >80%
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useHouseholdStore } from '../../stores/household-store';
import * as householdApi from '../../api/household-api';
import { HouseholdErrorCode } from '../../types/household';

// Mock the household API
vi.mock('../../api/household-api', () => ({
  getHousehold: vi.fn(),
  createHousehold: vi.fn(),
  requestJoinHousehold: vi.fn(),
  respondToJoinRequest: vi.fn(),
  removeMember: vi.fn(),
  regenerateInviteCode: vi.fn(),
  leaveHousehold: vi.fn(),
  withdrawJoinRequest: vi.fn(),
  sendEmailInvite: vi.fn(),
}));

// Mock logger
vi.mock('../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Household Store', () => {
  beforeEach(() => {
    // Reset store to initial state
    useHouseholdStore.getState().reset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // INITIAL STATE
  // ===========================================================================

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useHouseholdStore.getState();

      expect(state.household).toBeNull();
      expect(state.members).toEqual([]);
      expect(state.pendingRequests).toEqual([]);
      expect(state.userRole).toBeNull();
      expect(state.memberCount).toBe(0);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  // ===========================================================================
  // FETCH HOUSEHOLD
  // ===========================================================================

  describe('fetchHousehold', () => {
    it('should fetch household successfully', async () => {
      const mockHousehold = {
        id: 'household-1',
        name: 'Test House',
        description: 'Test description',
        inviteCode: 'TEST-CODE',
        inviteCodeExpiresAt: null,
        leaderId: 'user-1',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      };

      const mockMembers = [
        {
          id: 'member-1',
          householdId: 'household-1',
          userId: 'user-1',
          role: 'leader' as const,
          status: 'active' as const,
          isTemporary: false,
          temporaryExpiresAt: null,
          invitedBy: null,
          joinedAt: '2026-01-01',
        },
      ];

      vi.mocked(householdApi.getHousehold).mockResolvedValue({
        success: true,
        household: mockHousehold,
        members: mockMembers,
        pendingRequests: [],
        memberCount: 1,
        userRole: 'leader',
      });

      const store = useHouseholdStore.getState();
      await store.fetchHousehold('user-1');

      const state = useHouseholdStore.getState();
      expect(state.household).toEqual(mockHousehold);
      expect(state.members).toEqual(mockMembers);
      expect(state.memberCount).toBe(1);
      expect(state.userRole).toBe('leader');
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle fetch household error', async () => {
      const mockError = {
        code: HouseholdErrorCode.DATABASE_ERROR,
        message: 'Database error',
      };

      vi.mocked(householdApi.getHousehold).mockResolvedValue({
        success: false,
        household: null,
        members: [],
        pendingRequests: [],
        memberCount: 0,
        userRole: null,
        error: mockError,
      });

      const store = useHouseholdStore.getState();
      await store.fetchHousehold('user-1');

      const state = useHouseholdStore.getState();
      expect(state.error).toEqual(mockError);
      expect(state.loading).toBe(false);
      expect(state.household).toBeNull();
    });

    it('should set loading state during fetch', async () => {
      vi.mocked(householdApi.getHousehold).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  success: true,
                  household: null,
                  members: [],
                  pendingRequests: [],
                  memberCount: 0,
                  userRole: null,
                }),
              100
            );
          })
      );

      const store = useHouseholdStore.getState();
      const promise = store.fetchHousehold('user-1');

      // Check loading state immediately
      expect(useHouseholdStore.getState().loading).toBe(true);

      await promise;
      expect(useHouseholdStore.getState().loading).toBe(false);
    });
  });

  // ===========================================================================
  // CREATE HOUSEHOLD
  // ===========================================================================

  describe('createHousehold', () => {
    it('should create household successfully', async () => {
      const mockHousehold = {
        id: 'household-1',
        name: 'New House',
        description: 'New description',
        inviteCode: 'NEW-CODE',
        inviteCodeExpiresAt: null,
        leaderId: 'user-1',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      };

      vi.mocked(householdApi.createHousehold).mockResolvedValue({
        success: true,
        household: mockHousehold,
      });

      vi.mocked(householdApi.getHousehold).mockResolvedValue({
        success: true,
        household: mockHousehold,
        members: [],
        pendingRequests: [],
        memberCount: 1,
        userRole: 'leader',
      });

      const store = useHouseholdStore.getState();
      await store.createHousehold('user-1', 'New House', 'New description');

      const state = useHouseholdStore.getState();
      expect(state.household).toEqual(mockHousehold);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();

      expect(householdApi.createHousehold).toHaveBeenCalledWith(
        { name: 'New House', description: 'New description' },
        'user-1'
      );
      expect(householdApi.getHousehold).toHaveBeenCalledWith('user-1');
    });

    it('should handle create household error', async () => {
      const mockError = {
        code: HouseholdErrorCode.INVALID_HOUSEHOLD_NAME,
        message: 'Invalid name',
      };

      vi.mocked(householdApi.createHousehold).mockResolvedValue({
        success: false,
        household: null as any,
        error: mockError,
      });

      const store = useHouseholdStore.getState();
      await store.createHousehold('user-1', 'A');

      const state = useHouseholdStore.getState();
      expect(state.error).toEqual(mockError);
      expect(state.loading).toBe(false);
      expect(state.household).toBeNull();
    });
  });

  // ===========================================================================
  // JOIN HOUSEHOLD
  // ===========================================================================

  describe('joinHousehold', () => {
    it('should send join request successfully', async () => {
      vi.mocked(householdApi.requestJoinHousehold).mockResolvedValue({
        success: true,
        requestId: 'request-1',
        message: 'Request sent',
      });

      const store = useHouseholdStore.getState();
      await store.joinHousehold('user-1', 'TEST-CODE');

      const state = useHouseholdStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();

      expect(householdApi.requestJoinHousehold).toHaveBeenCalledWith(
        { inviteCode: 'TEST-CODE' },
        'user-1'
      );
    });

    it('should handle join household error', async () => {
      const mockError = {
        code: HouseholdErrorCode.INVALID_INVITE_CODE,
        message: 'Invalid code',
      };

      vi.mocked(householdApi.requestJoinHousehold).mockResolvedValue({
        success: false,
        error: mockError,
      });

      const store = useHouseholdStore.getState();
      await store.joinHousehold('user-1', 'INVALID');

      const state = useHouseholdStore.getState();
      expect(state.error).toEqual(mockError);
      expect(state.loading).toBe(false);
    });
  });

  // ===========================================================================
  // APPROVE REQUEST
  // ===========================================================================

  describe('approveRequest', () => {
    it('should approve request and refresh household', async () => {
      vi.mocked(householdApi.respondToJoinRequest).mockResolvedValue({
        success: true,
        message: 'Request approved',
      });

      vi.mocked(householdApi.getHousehold).mockResolvedValue({
        success: true,
        household: null,
        members: [],
        pendingRequests: [],
        memberCount: 0,
        userRole: 'leader',
      });

      const store = useHouseholdStore.getState();
      await store.approveRequest('request-1', 'user-1');

      expect(householdApi.respondToJoinRequest).toHaveBeenCalledWith(
        { requestId: 'request-1', action: 'approve' },
        'user-1'
      );
      expect(householdApi.getHousehold).toHaveBeenCalledWith('user-1');
    });

    it('should handle approve request error', async () => {
      const mockError = {
        code: HouseholdErrorCode.REQUEST_NOT_FOUND,
        message: 'Request not found',
      };

      vi.mocked(householdApi.respondToJoinRequest).mockResolvedValue({
        success: false,
        error: mockError,
      });

      const store = useHouseholdStore.getState();
      await store.approveRequest('request-1', 'user-1');

      const state = useHouseholdStore.getState();
      expect(state.error).toEqual(mockError);
      expect(state.loading).toBe(false);
    });
  });

  // ===========================================================================
  // REJECT REQUEST
  // ===========================================================================

  describe('rejectRequest', () => {
    it('should reject request and refresh household', async () => {
      vi.mocked(householdApi.respondToJoinRequest).mockResolvedValue({
        success: true,
        message: 'Request rejected',
      });

      vi.mocked(householdApi.getHousehold).mockResolvedValue({
        success: true,
        household: null,
        members: [],
        pendingRequests: [],
        memberCount: 0,
        userRole: 'leader',
      });

      const store = useHouseholdStore.getState();
      await store.rejectRequest('request-1', 'user-1');

      expect(householdApi.respondToJoinRequest).toHaveBeenCalledWith(
        { requestId: 'request-1', action: 'reject' },
        'user-1'
      );
      expect(householdApi.getHousehold).toHaveBeenCalledWith('user-1');
    });

    it('should handle reject request error', async () => {
      const mockError = {
        code: HouseholdErrorCode.REQUEST_NOT_FOUND,
        message: 'Request not found',
      };

      vi.mocked(householdApi.respondToJoinRequest).mockResolvedValue({
        success: false,
        error: mockError,
      });

      const store = useHouseholdStore.getState();
      await store.rejectRequest('request-1', 'user-1');

      const state = useHouseholdStore.getState();
      expect(state.error).toEqual(mockError);
      expect(state.loading).toBe(false);
    });
  });

  // ===========================================================================
  // REMOVE MEMBER
  // ===========================================================================

  describe('removeMember', () => {
    it('should remove member and refresh household', async () => {
      vi.mocked(householdApi.removeMember).mockResolvedValue({
        success: true,
        message: 'Member removed',
      });

      vi.mocked(householdApi.getHousehold).mockResolvedValue({
        success: true,
        household: null,
        members: [],
        pendingRequests: [],
        memberCount: 0,
        userRole: 'leader',
      });

      const store = useHouseholdStore.getState();
      await store.removeMember('household-1', 'member-1', 'user-1');

      expect(householdApi.removeMember).toHaveBeenCalledWith(
        { householdId: 'household-1', memberId: 'member-1' },
        'user-1'
      );
      expect(householdApi.getHousehold).toHaveBeenCalledWith('user-1');
    });

    it('should handle remove member error', async () => {
      const mockError = {
        code: HouseholdErrorCode.NOT_HOUSEHOLD_LEADER,
        message: 'Not leader',
      };

      vi.mocked(householdApi.removeMember).mockResolvedValue({
        success: false,
        error: mockError,
      });

      const store = useHouseholdStore.getState();
      await store.removeMember('household-1', 'member-1', 'user-1');

      const state = useHouseholdStore.getState();
      expect(state.error).toEqual(mockError);
      expect(state.loading).toBe(false);
    });
  });

  // ===========================================================================
  // REGENERATE INVITE CODE
  // ===========================================================================

  describe('regenerateInviteCode', () => {
    it('should regenerate invite code successfully', async () => {
      const existingHousehold = {
        id: 'household-1',
        name: 'Test House',
        description: null,
        inviteCode: 'OLD-CODE',
        inviteCodeExpiresAt: null,
        leaderId: 'user-1',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      };

      // Set existing household in store
      useHouseholdStore.setState({ household: existingHousehold });

      vi.mocked(householdApi.regenerateInviteCode).mockResolvedValue({
        success: true,
        inviteCode: 'NEW-CODE',
        expiresAt: '2026-02-01',
      });

      const store = useHouseholdStore.getState();
      await store.regenerateInviteCode('household-1', 'user-1', 30);

      const state = useHouseholdStore.getState();
      expect(state.household?.inviteCode).toBe('NEW-CODE');
      expect(state.household?.inviteCodeExpiresAt).toBe('2026-02-01');
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle regenerate invite code error', async () => {
      const mockError = {
        code: HouseholdErrorCode.NOT_HOUSEHOLD_LEADER,
        message: 'Not leader',
      };

      vi.mocked(householdApi.regenerateInviteCode).mockResolvedValue({
        success: false,
        error: mockError,
      });

      const store = useHouseholdStore.getState();
      await store.regenerateInviteCode('household-1', 'user-1');

      const state = useHouseholdStore.getState();
      expect(state.error).toEqual(mockError);
      expect(state.loading).toBe(false);
    });
  });

  // ===========================================================================
  // LEAVE HOUSEHOLD
  // ===========================================================================

  describe('leaveHousehold', () => {
    it('should leave household and reset state', async () => {
      // Set some state first
      useHouseholdStore.setState({
        household: {
          id: 'household-1',
          name: 'Test House',
          description: null,
          inviteCode: 'CODE',
          inviteCodeExpiresAt: null,
          leaderId: 'user-1',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
        members: [],
        userRole: 'member',
      });

      vi.mocked(householdApi.leaveHousehold).mockResolvedValue({
        success: true,
        message: 'Left household',
      });

      const store = useHouseholdStore.getState();
      await store.leaveHousehold('household-1', 'user-1');

      const state = useHouseholdStore.getState();
      expect(state.household).toBeNull();
      expect(state.members).toEqual([]);
      expect(state.userRole).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle leave household error', async () => {
      const mockError = {
        code: HouseholdErrorCode.NOT_HOUSEHOLD_MEMBER,
        message: 'Not a member',
      };

      vi.mocked(householdApi.leaveHousehold).mockResolvedValue({
        success: false,
        error: mockError,
      });

      const store = useHouseholdStore.getState();
      await store.leaveHousehold('household-1', 'user-1');

      const state = useHouseholdStore.getState();
      expect(state.error).toEqual(mockError);
      expect(state.loading).toBe(false);
    });
  });

  // ===========================================================================
  // WITHDRAW REQUEST
  // ===========================================================================

  describe('withdrawRequest', () => {
    it('should withdraw request successfully', async () => {
      vi.mocked(householdApi.withdrawJoinRequest).mockResolvedValue({
        success: true,
        message: 'Request withdrawn',
      });

      const store = useHouseholdStore.getState();
      await store.withdrawRequest('request-1', 'user-1');

      const state = useHouseholdStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();

      expect(householdApi.withdrawJoinRequest).toHaveBeenCalledWith(
        { requestId: 'request-1' },
        'user-1'
      );
    });

    it('should handle withdraw request error', async () => {
      const mockError = {
        code: HouseholdErrorCode.REQUEST_NOT_FOUND,
        message: 'Request not found',
      };

      vi.mocked(householdApi.withdrawJoinRequest).mockResolvedValue({
        success: false,
        error: mockError,
      });

      const store = useHouseholdStore.getState();
      await store.withdrawRequest('request-1', 'user-1');

      const state = useHouseholdStore.getState();
      expect(state.error).toEqual(mockError);
      expect(state.loading).toBe(false);
    });
  });

  // ===========================================================================
  // SEND EMAIL INVITE
  // ===========================================================================

  describe('sendEmailInvite', () => {
    it('should send email invite successfully', async () => {
      vi.mocked(householdApi.sendEmailInvite).mockResolvedValue({
        success: true,
        message: 'Invite sent',
      });

      const store = useHouseholdStore.getState();
      await store.sendEmailInvite('household-1', 'test@example.com', 'user-1', 'Join us!');

      const state = useHouseholdStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();

      expect(householdApi.sendEmailInvite).toHaveBeenCalledWith(
        { householdId: 'household-1', email: 'test@example.com', personalMessage: 'Join us!' },
        'user-1'
      );
    });

    it('should handle send email invite error', async () => {
      const mockError = {
        code: HouseholdErrorCode.INVALID_EMAIL,
        message: 'Invalid email',
      };

      vi.mocked(householdApi.sendEmailInvite).mockResolvedValue({
        success: false,
        error: mockError,
      });

      const store = useHouseholdStore.getState();
      await store.sendEmailInvite('household-1', 'invalid', 'user-1');

      const state = useHouseholdStore.getState();
      expect(state.error).toEqual(mockError);
      expect(state.loading).toBe(false);
    });
  });

  // ===========================================================================
  // UTILITY ACTIONS
  // ===========================================================================

  describe('Utility Actions', () => {
    it('should clear error', () => {
      useHouseholdStore.setState({
        error: { code: HouseholdErrorCode.DATABASE_ERROR, message: 'Error' },
      });

      const store = useHouseholdStore.getState();
      store.clearError();

      const state = useHouseholdStore.getState();
      expect(state.error).toBeNull();
    });

    it('should reset state', () => {
      useHouseholdStore.setState({
        household: {
          id: 'household-1',
          name: 'Test',
          description: null,
          inviteCode: 'CODE',
          inviteCodeExpiresAt: null,
          leaderId: 'user-1',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
        members: [],
        userRole: 'leader',
        loading: true,
        error: { code: HouseholdErrorCode.DATABASE_ERROR, message: 'Error' },
      });

      const store = useHouseholdStore.getState();
      store.reset();

      const state = useHouseholdStore.getState();
      expect(state.household).toBeNull();
      expect(state.members).toEqual([]);
      expect(state.userRole).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  // ===========================================================================
  // SELECTORS
  // ===========================================================================

  describe('Selectors', () => {
    it('selectIsLeader should return true when user is leader', async () => {
      useHouseholdStore.setState({ userRole: 'leader' });
      const { selectIsLeader } = await import('../../stores/household-store');

      const state = useHouseholdStore.getState();
      expect(selectIsLeader(state)).toBe(true);
    });

    it('selectIsLeader should return false when user is not leader', async () => {
      useHouseholdStore.setState({ userRole: 'member' });
      const { selectIsLeader } = await import('../../stores/household-store');

      const state = useHouseholdStore.getState();
      expect(selectIsLeader(state)).toBe(false);
    });

    it('selectHasHousehold should return true when household exists', async () => {
      useHouseholdStore.setState({
        household: {
          id: 'household-1',
          name: 'Test',
          description: null,
          inviteCode: 'CODE',
          inviteCodeExpiresAt: null,
          leaderId: 'user-1',
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      });
      const { selectHasHousehold } = await import('../../stores/household-store');

      const state = useHouseholdStore.getState();
      expect(selectHasHousehold(state)).toBe(true);
    });

    it('selectPendingRequestCount should return correct count', async () => {
      useHouseholdStore.setState({
        pendingRequests: [
          { id: '1' } as any,
          { id: '2' } as any,
        ],
      });
      const { selectPendingRequestCount } = await import('../../stores/household-store');

      const state = useHouseholdStore.getState();
      expect(selectPendingRequestCount(state)).toBe(2);
    });
  });
});
