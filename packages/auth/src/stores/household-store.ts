/**
 * Household State Management Store
 *
 * Zustand store for managing household state across the application.
 * Handles all household operations including creation, joining, member management,
 * and invite code management.
 *
 * Design Principles:
 * - Single source of truth for household state
 * - Async actions with proper loading/error handling
 * - Automatic state updates after successful operations
 * - Clear error messages for user feedback
 */

import { create } from 'zustand';
import * as householdApi from '../api/household-api';
import type {
  Household,
  HouseholdMember,
  HouseholdJoinRequest,
  HouseholdError,
} from '../types/household';
import { logger } from '../utils/logger';

// =============================================================================
// TYPES
// =============================================================================

interface HouseholdState {
  // Core state
  household: Household | null;
  members: HouseholdMember[];
  pendingRequests: HouseholdJoinRequest[];
  userRole: 'leader' | 'member' | null;
  memberCount: number;

  // UI state
  loading: boolean;
  error: HouseholdError | null;

  // Actions
  fetchHousehold: (userId: string) => Promise<void>;
  createHousehold: (userId: string, name: string, description?: string) => Promise<void>;
  joinHousehold: (userId: string, inviteCode: string) => Promise<void>;
  approveRequest: (requestId: string, responderId: string) => Promise<void>;
  rejectRequest: (requestId: string, responderId: string) => Promise<void>;
  removeMember: (householdId: string, memberId: string, removerId: string) => Promise<void>;
  regenerateInviteCode: (householdId: string, leaderId: string, expirationDays?: number) => Promise<void>;
  leaveHousehold: (householdId: string, userId: string, successorId?: string) => Promise<void>;
  withdrawRequest: (requestId: string, userId: string) => Promise<void>;
  sendEmailInvite: (householdId: string, email: string, leaderId: string, personalMessage?: string) => Promise<void>;

  // Utility actions
  clearError: () => void;
  reset: () => void;
}

// Initial state
const initialState = {
  household: null,
  members: [],
  pendingRequests: [],
  userRole: null,
  memberCount: 0,
  loading: false,
  error: null,
};

// =============================================================================
// STORE
// =============================================================================

export const useHouseholdStore = create<HouseholdState>((set, get) => ({
  ...initialState,

  // ===========================================================================
  // FETCH HOUSEHOLD
  // ===========================================================================
  fetchHousehold: async (userId: string) => {
    set({ loading: true, error: null });

    try {
      const result = await householdApi.getHousehold(userId);

      if (result.success) {
        set({
          household: result.household,
          members: result.members,
          pendingRequests: result.pendingRequests,
          userRole: result.userRole,
          memberCount: result.memberCount,
          loading: false,
        });

        logger.debug('Household state updated', {
          householdId: result.household?.id,
          memberCount: result.memberCount,
          userRole: result.userRole,
        });
      } else {
        set({
          error: result.error || null,
          loading: false,
        });

        logger.warn('Failed to fetch household', { error: result.error });
      }
    } catch (error) {
      logger.error('Unexpected error fetching household', { error });
      set({
        error: {
          code: 'DATABASE_ERROR' as any,
          message: 'Failed to fetch household data',
        },
        loading: false,
      });
    }
  },

  // ===========================================================================
  // CREATE HOUSEHOLD
  // ===========================================================================
  createHousehold: async (userId: string, name: string, description?: string) => {
    set({ loading: true, error: null });

    try {
      const result = await householdApi.createHousehold({ name, description }, userId);

      if (result.success && result.household) {
        // After creating, fetch full household data to get members, etc.
        await get().fetchHousehold(userId);

        logger.info('Household created successfully', {
          householdId: result.household.id,
          name: result.household.name,
        });
      } else {
        set({
          error: result.error || null,
          loading: false,
        });

        logger.warn('Failed to create household', { error: result.error });
      }
    } catch (error) {
      logger.error('Unexpected error creating household', { error });
      set({
        error: {
          code: 'DATABASE_ERROR' as any,
          message: 'Failed to create household',
        },
        loading: false,
      });
    }
  },

  // ===========================================================================
  // JOIN HOUSEHOLD (REQUEST TO JOIN)
  // ===========================================================================
  joinHousehold: async (userId: string, inviteCode: string) => {
    set({ loading: true, error: null });

    try {
      const result = await householdApi.requestJoinHousehold({ inviteCode }, userId);

      if (result.success) {
        set({ loading: false });

        logger.info('Join request sent successfully', {
          requestId: result.requestId,
          inviteCode: '[REDACTED]',
        });
      } else {
        set({
          error: result.error || null,
          loading: false,
        });

        logger.warn('Failed to send join request', { error: result.error });
      }
    } catch (error) {
      logger.error('Unexpected error sending join request', { error });
      set({
        error: {
          code: 'DATABASE_ERROR' as any,
          message: 'Failed to send join request',
        },
        loading: false,
      });
    }
  },

  // ===========================================================================
  // APPROVE REQUEST
  // ===========================================================================
  approveRequest: async (requestId: string, responderId: string) => {
    set({ loading: true, error: null });

    try {
      const result = await householdApi.respondToJoinRequest(
        { requestId, action: 'approve' },
        responderId
      );

      if (result.success) {
        // Refresh household data to show new member
        await get().fetchHousehold(responderId);

        logger.info('Join request approved', { requestId });
      } else {
        set({
          error: result.error || null,
          loading: false,
        });

        logger.warn('Failed to approve join request', { error: result.error });
      }
    } catch (error) {
      logger.error('Unexpected error approving join request', { error });
      set({
        error: {
          code: 'DATABASE_ERROR' as any,
          message: 'Failed to approve join request',
        },
        loading: false,
      });
    }
  },

  // ===========================================================================
  // REJECT REQUEST
  // ===========================================================================
  rejectRequest: async (requestId: string, responderId: string) => {
    set({ loading: true, error: null });

    try {
      const result = await householdApi.respondToJoinRequest(
        { requestId, action: 'reject' },
        responderId
      );

      if (result.success) {
        // Refresh household data to update pending requests list
        await get().fetchHousehold(responderId);

        logger.info('Join request rejected', { requestId });
      } else {
        set({
          error: result.error || null,
          loading: false,
        });

        logger.warn('Failed to reject join request', { error: result.error });
      }
    } catch (error) {
      logger.error('Unexpected error rejecting join request', { error });
      set({
        error: {
          code: 'DATABASE_ERROR' as any,
          message: 'Failed to reject join request',
        },
        loading: false,
      });
    }
  },

  // ===========================================================================
  // REMOVE MEMBER
  // ===========================================================================
  removeMember: async (householdId: string, memberId: string, removerId: string) => {
    set({ loading: true, error: null });

    try {
      const result = await householdApi.removeMember({ householdId, memberId }, removerId);

      if (result.success) {
        // Refresh household data to update member list
        await get().fetchHousehold(removerId);

        logger.info('Member removed successfully', { householdId, memberId });
      } else {
        set({
          error: result.error || null,
          loading: false,
        });

        logger.warn('Failed to remove member', { error: result.error });
      }
    } catch (error) {
      logger.error('Unexpected error removing member', { error });
      set({
        error: {
          code: 'DATABASE_ERROR' as any,
          message: 'Failed to remove member',
        },
        loading: false,
      });
    }
  },

  // ===========================================================================
  // REGENERATE INVITE CODE
  // ===========================================================================
  regenerateInviteCode: async (
    householdId: string,
    leaderId: string,
    expirationDays?: number
  ) => {
    set({ loading: true, error: null });

    try {
      const result = await householdApi.regenerateInviteCode(
        { householdId, expirationDays },
        leaderId
      );

      if (result.success && result.inviteCode) {
        // Update household with new invite code
        const currentHousehold = get().household;
        if (currentHousehold) {
          set({
            household: {
              ...currentHousehold,
              inviteCode: result.inviteCode,
              inviteCodeExpiresAt: result.expiresAt || null,
            },
            loading: false,
          });
        }

        logger.info('Invite code regenerated', {
          householdId,
          expiresAt: result.expiresAt,
        });
      } else {
        set({
          error: result.error || null,
          loading: false,
        });

        logger.warn('Failed to regenerate invite code', { error: result.error });
      }
    } catch (error) {
      logger.error('Unexpected error regenerating invite code', { error });
      set({
        error: {
          code: 'DATABASE_ERROR' as any,
          message: 'Failed to regenerate invite code',
        },
        loading: false,
      });
    }
  },

  // ===========================================================================
  // LEAVE HOUSEHOLD
  // ===========================================================================
  leaveHousehold: async (householdId: string, userId: string, successorId?: string) => {
    set({ loading: true, error: null });

    try {
      const result = await householdApi.leaveHousehold(
        { householdId, successorId },
        userId
      );

      if (result.success) {
        // Clear household state since user left
        set({
          ...initialState,
          loading: false,
        });

        logger.info('Left household successfully', { householdId, successorId });
      } else {
        set({
          error: result.error || null,
          loading: false,
        });

        logger.warn('Failed to leave household', { error: result.error });
      }
    } catch (error) {
      logger.error('Unexpected error leaving household', { error });
      set({
        error: {
          code: 'DATABASE_ERROR' as any,
          message: 'Failed to leave household',
        },
        loading: false,
      });
    }
  },

  // ===========================================================================
  // WITHDRAW REQUEST
  // ===========================================================================
  withdrawRequest: async (requestId: string, userId: string) => {
    set({ loading: true, error: null });

    try {
      const result = await householdApi.withdrawJoinRequest({ requestId }, userId);

      if (result.success) {
        set({ loading: false });

        logger.info('Join request withdrawn', { requestId });
      } else {
        set({
          error: result.error || null,
          loading: false,
        });

        logger.warn('Failed to withdraw join request', { error: result.error });
      }
    } catch (error) {
      logger.error('Unexpected error withdrawing join request', { error });
      set({
        error: {
          code: 'DATABASE_ERROR' as any,
          message: 'Failed to withdraw join request',
        },
        loading: false,
      });
    }
  },

  // ===========================================================================
  // SEND EMAIL INVITE
  // ===========================================================================
  sendEmailInvite: async (
    householdId: string,
    email: string,
    leaderId: string,
    personalMessage?: string
  ) => {
    set({ loading: true, error: null });

    try {
      const result = await householdApi.sendEmailInvite(
        { householdId, email, personalMessage },
        leaderId
      );

      if (result.success) {
        set({ loading: false });

        logger.info('Email invite sent', { householdId, recipientEmail: email });
      } else {
        set({
          error: result.error || null,
          loading: false,
        });

        logger.warn('Failed to send email invite', { error: result.error });
      }
    } catch (error) {
      logger.error('Unexpected error sending email invite', { error });
      set({
        error: {
          code: 'DATABASE_ERROR' as any,
          message: 'Failed to send email invite',
        },
        loading: false,
      });
    }
  },

  // ===========================================================================
  // UTILITY ACTIONS
  // ===========================================================================

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set(initialState);
    logger.debug('Household store reset');
  },
}));

// =============================================================================
// SELECTORS (for convenience)
// =============================================================================

export const selectIsLeader = (state: HouseholdState) => state.userRole === 'leader';
export const selectHasHousehold = (state: HouseholdState) => state.household !== null;
export const selectCanManageMembers = (state: HouseholdState) => state.userRole === 'leader';
export const selectPendingRequestCount = (state: HouseholdState) => state.pendingRequests.length;
