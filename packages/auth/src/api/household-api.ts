/**
 * Household Management API
 *
 * Core API functions for the household management system - PetForce's differentiator.
 * Enables collaborative family pet care through household creation, joining, and member management.
 *
 * Design Principles:
 * - Database-Agnostic: Uses standard SQL patterns, not Supabase-specific features
 * - Atomic Operations: Critical operations use transactions for data integrity
 * - Secure by Default: All operations validate permissions and use RLS
 * - Structured Logging: All operations logged with correlation IDs (Larry's patterns)
 * - Rate Limiting: Protection against abuse (5 join requests/hour, 20 email invites/hour)
 */

import { getSupabaseClient } from './supabase-client';
import { logger } from '../utils/logger';
import {
  generateInviteCode,
  calculateExpirationDate,
  isInviteCodeExpired,
  normalizeInviteCodeInput,
  validateInviteCodeFormat,
} from '../utils/invite-codes';
import type {
  CreateHouseholdRequest,
  CreateHouseholdResponse,
  JoinHouseholdRequest,
  JoinHouseholdResponse,
  RespondToJoinRequestRequest,
  RespondToJoinRequestResponse,
  RemoveMemberRequest,
  RemoveMemberResponse,
  RegenerateInviteCodeRequest,
  RegenerateInviteCodeResponse,
  LeaveHouseholdRequest,
  LeaveHouseholdResponse,
  WithdrawJoinRequestRequest,
  WithdrawJoinRequestResponse,
  SendEmailInviteRequest,
  SendEmailInviteResponse,
  GetHouseholdResponse,
  Household,
  HouseholdMember,
  HouseholdJoinRequest,
  HouseholdRow,
  HouseholdMemberRow,
  HouseholdJoinRequestRow,
  HouseholdError,
} from '../types/household';
import { HouseholdErrorCode } from '../types/household';

// =============================================================================
// CONSTANTS
// =============================================================================

const MAX_HOUSEHOLD_MEMBERS = 15; // Peter's research: matches PetNote+ (15 members)
const DEFAULT_INVITE_EXPIRATION_DAYS = 30; // Peter's research: Slack standard (30 days)
const JOIN_REQUEST_RATE_LIMIT_PER_HOUR = 5; // Samantha's security requirement
const EMAIL_INVITE_RATE_LIMIT_PER_HOUR = 20; // Samantha's security requirement

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Converts database row (snake_case) to API type (camelCase)
 */
function householdRowToHousehold(row: HouseholdRow): Household {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    inviteCode: row.invite_code,
    inviteCodeExpiresAt: row.invite_code_expires_at,
    leaderId: row.leader_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Converts database row (snake_case) to API type (camelCase)
 */
function memberRowToMember(row: HouseholdMemberRow): HouseholdMember {
  return {
    id: row.id,
    householdId: row.household_id,
    userId: row.user_id,
    role: row.role,
    status: row.status,
    isTemporary: row.is_temporary,
    temporaryExpiresAt: row.temporary_expires_at,
    invitedBy: row.invited_by,
    joinedAt: row.joined_at,
  };
}

/**
 * Converts database row (snake_case) to API type (camelCase)
 */
function joinRequestRowToJoinRequest(row: HouseholdJoinRequestRow): HouseholdJoinRequest {
  return {
    id: row.id,
    householdId: row.household_id,
    userId: row.user_id,
    inviteCode: row.invite_code,
    status: row.status,
    requestedAt: row.requested_at,
    respondedAt: row.responded_at,
    respondedBy: row.responded_by,
  };
}

/**
 * Creates a standardized household error
 */
function createHouseholdError(code: HouseholdErrorCode, message: string, details?: unknown): HouseholdError {
  return { code, message, details };
}

/**
 * Validates household name format and length
 */
function validateHouseholdName(name: string): HouseholdError | null {
  if (!name || name.trim().length < 2) {
    return createHouseholdError(
      HouseholdErrorCode.INVALID_HOUSEHOLD_NAME,
      'Household name must be at least 2 characters'
    );
  }

  if (name.length > 50) {
    return createHouseholdError(
      HouseholdErrorCode.INVALID_HOUSEHOLD_NAME,
      'Household name must be 50 characters or less'
    );
  }

  // Alphanumeric and spaces only (per Peter's requirement)
  if (!/^[A-Za-z0-9 ]+$/.test(name)) {
    return createHouseholdError(
      HouseholdErrorCode.INVALID_HOUSEHOLD_NAME,
      'Household name can only contain letters, numbers, and spaces'
    );
  }

  return null;
}

/**
 * Checks rate limiting for join requests (5 per hour per user)
 */
async function checkJoinRequestRateLimit(userId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('household_join_requests')
    .select('id')
    .eq('user_id', userId)
    .gte('requested_at', oneHourAgo);

  if (error) {
    logger.error('Failed to check join request rate limit', { userId, error: error.message });
    return false; // Fail open for now
  }

  return (data?.length ?? 0) < JOIN_REQUEST_RATE_LIMIT_PER_HOUR;
}

// =============================================================================
// CORE API FUNCTIONS
// =============================================================================

/**
 * Create a new household and automatically add the creator as the leader.
 *
 * This is an atomic operation - both the household and leader membership are
 * created together or rolled back if either fails.
 *
 * @param request - Household creation request
 * @param userId - ID of the user creating the household (becomes leader)
 * @returns CreateHouseholdResponse with household data or error
 */
export async function createHousehold(
  request: CreateHouseholdRequest,
  userId: string
): Promise<CreateHouseholdResponse> {
  const requestId = logger.generateRequestId();

  try {
    logger.info('household_creation_attempt_started', {
      correlationId: requestId,
      userId,
      householdName: request.name,
      hasDescription: !!request.description,
    });

    // Validate household name
    const nameError = validateHouseholdName(request.name);
    if (nameError) {
      logger.authEvent('household_creation_failed', requestId, {
        userId,
        errorCode: nameError.code,
        errorMessage: nameError.message,
      });
      return { success: false, household: null as any, error: nameError };
    }

    // Validate description length (200 chars max per Peter's requirement)
    if (request.description && request.description.length > 200) {
      const error = createHouseholdError(
        HouseholdErrorCode.INVALID_INPUT,
        'Household description must be 200 characters or less'
      );
      return { success: false, household: null as any, error };
    }

    const supabase = getSupabaseClient();

    // Check if user is already in a household (Phase 1: one household per user)
    const { data: existingMembership, error: membershipCheckError } = await supabase
      .from('household_members')
      .select('household_id, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(1)
      .single();

    if (membershipCheckError && membershipCheckError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is what we want
      throw membershipCheckError;
    }

    if (existingMembership) {
      logger.authEvent('household_creation_failed', requestId, {
        userId,
        errorCode: HouseholdErrorCode.ALREADY_IN_HOUSEHOLD,
        existingHouseholdId: existingMembership.household_id,
      });

      return {
        success: false,
        household: null as any,
        error: createHouseholdError(
          HouseholdErrorCode.ALREADY_IN_HOUSEHOLD,
          'You are already a member of a household. Please leave your current household before creating a new one.'
        ),
      };
    }

    // Generate unique invite code
    let inviteCode = generateInviteCode(request.name);
    let uniqueCodeFound = false;
    let attempts = 0;
    const maxAttempts = 10;

    // Check uniqueness (rare collisions possible, but we handle it)
    while (!uniqueCodeFound && attempts < maxAttempts) {
      const { data: existingCode } = await supabase
        .from('households')
        .select('id')
        .eq('invite_code', inviteCode)
        .single();

      if (!existingCode) {
        uniqueCodeFound = true;
      } else {
        inviteCode = generateInviteCode(request.name);
        attempts++;
      }
    }

    if (!uniqueCodeFound) {
      const error = createHouseholdError(
        HouseholdErrorCode.DATABASE_ERROR,
        'Failed to generate unique invite code. Please try again.'
      );
      return { success: false, household: null as any, error };
    }

    // Calculate expiration date (30 days by default)
    const inviteCodeExpiresAt = calculateExpirationDate(DEFAULT_INVITE_EXPIRATION_DAYS);

    // Create household
    const { data: householdData, error: householdError } = await supabase
      .from('households')
      .insert({
        name: request.name.trim(),
        description: request.description?.trim() || null,
        invite_code: inviteCode,
        invite_code_expires_at: inviteCodeExpiresAt,
        leader_id: userId,
      })
      .select()
      .single();

    if (householdError) {
      logger.error('Failed to create household', {
        correlationId: requestId,
        userId,
        error: householdError.message,
      });
      throw householdError;
    }

    // Automatically add creator as leader member (atomic operation)
    const { error: memberError } = await supabase
      .from('household_members')
      .insert({
        household_id: householdData.id,
        user_id: userId,
        role: 'leader',
        status: 'active',
        is_temporary: false,
        invited_by: null, // Creator wasn't invited by anyone
      });

    if (memberError) {
      // Rollback: Delete the household if member creation fails
      await supabase.from('households').delete().eq('id', householdData.id);

      logger.error('Failed to add leader as member, rolled back household creation', {
        correlationId: requestId,
        userId,
        householdId: householdData.id,
        error: memberError.message,
      });
      throw memberError;
    }

    const household = householdRowToHousehold(householdData);

    // Log successful creation
    logger.info('household_created', {
      correlationId: requestId,
      userId,
      householdId: household.id,
      householdName: household.name,
      inviteCode: '[REDACTED]', // Don't log plaintext codes (Samantha's security requirement)
      inviteCodeExpiresAt,
    });

    return {
      success: true,
      household,
    };
  } catch (error) {
    logger.error('Unexpected error during household creation', {
      correlationId: requestId,
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      household: null as any,
      error: createHouseholdError(
        HouseholdErrorCode.DATABASE_ERROR,
        'Failed to create household. Please try again.',
        error
      ),
    };
  }
}

/**
 * Get the user's current household with members and pending requests.
 *
 * Returns null if user is not in a household.
 * Only returns pending requests if user is the household leader.
 *
 * @param userId - ID of the user requesting their household
 * @returns GetHouseholdResponse with household data or null
 */
export async function getHousehold(userId: string): Promise<GetHouseholdResponse> {
  const requestId = logger.generateRequestId();

  try {
    const supabase = getSupabaseClient();

    // Get user's active membership
    const { data: membershipData, error: membershipError } = await supabase
      .from('household_members')
      .select('household_id, role, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (membershipError) {
      if (membershipError.code === 'PGRST116') {
        // No rows returned - user is not in a household
        return {
          success: true,
          household: null,
          members: [],
          pendingRequests: [],
          memberCount: 0,
          userRole: null,
        };
      }
      throw membershipError;
    }

    // Get household details
    const { data: householdData, error: householdError } = await supabase
      .from('households')
      .select('*')
      .eq('id', membershipData.household_id)
      .single();

    if (householdError) {
      throw householdError;
    }

    // Get all household members
    const { data: membersData, error: membersError } = await supabase
      .from('household_members')
      .select('*')
      .eq('household_id', membershipData.household_id)
      .eq('status', 'active')
      .order('joined_at', { ascending: true });

    if (membersError) {
      throw membersError;
    }

    const members = membersData.map(memberRowToMember);
    const household = householdRowToHousehold(householdData);

    // Get pending requests (only if user is leader)
    let pendingRequests: HouseholdJoinRequest[] = [];
    if (membershipData.role === 'leader') {
      const { data: requestsData, error: requestsError } = await supabase
        .from('household_join_requests')
        .select('*')
        .eq('household_id', membershipData.household_id)
        .eq('status', 'pending')
        .order('requested_at', { ascending: true });

      if (requestsError) {
        logger.error('Failed to fetch pending requests', {
          correlationId: requestId,
          userId,
          householdId: membershipData.household_id,
          error: requestsError.message,
        });
      } else {
        pendingRequests = requestsData.map(joinRequestRowToJoinRequest);
      }
    }

    return {
      success: true,
      household,
      members,
      pendingRequests,
      memberCount: members.length,
      userRole: membershipData.role,
    };
  } catch (error) {
    logger.error('Unexpected error fetching household', {
      correlationId: requestId,
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      household: null,
      members: [],
      pendingRequests: [],
      memberCount: 0,
      userRole: null,
      error: createHouseholdError(
        HouseholdErrorCode.DATABASE_ERROR,
        'Failed to fetch household data',
        error
      ),
    };
  }
}

/**
 * Request to join a household using an invite code.
 *
 * Creates a pending join request that must be approved by the household leader.
 * Rate limited to 5 requests per hour per user.
 *
 * @param request - Join request with invite code
 * @param userId - ID of the user requesting to join
 * @returns JoinHouseholdResponse with request ID or error
 */
export async function requestJoinHousehold(
  request: JoinHouseholdRequest,
  userId: string
): Promise<JoinHouseholdResponse> {
  const requestId = logger.generateRequestId();

  try {
    // Normalize and validate invite code format
    const normalizedCode = normalizeInviteCodeInput(request.inviteCode);
    if (!validateInviteCodeFormat(normalizedCode)) {
      return {
        success: false,
        error: createHouseholdError(
          HouseholdErrorCode.INVALID_INVITE_CODE,
          'Invalid invite code format. Expected format: PREFIX-WORD1-WORD2'
        ),
      };
    }

    logger.info('household_join_request_started', {
      correlationId: requestId,
      userId,
      inviteCode: '[REDACTED]',
    });

    const supabase = getSupabaseClient();

    // Check if user is already in a household
    const { data: existingMembership, error: membershipCheckError } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (membershipCheckError && membershipCheckError.code !== 'PGRST116') {
      throw membershipCheckError;
    }

    if (existingMembership) {
      return {
        success: false,
        error: createHouseholdError(
          HouseholdErrorCode.ALREADY_IN_HOUSEHOLD,
          'You are already a member of a household'
        ),
      };
    }

    // Check rate limiting
    const withinRateLimit = await checkJoinRequestRateLimit(userId);
    if (!withinRateLimit) {
      logger.authEvent('household_join_request_rate_limited', requestId, {
        userId,
        limit: JOIN_REQUEST_RATE_LIMIT_PER_HOUR,
      });

      return {
        success: false,
        error: createHouseholdError(
          HouseholdErrorCode.RATE_LIMIT_EXCEEDED,
          `You can only make ${JOIN_REQUEST_RATE_LIMIT_PER_HOUR} join requests per hour. Please try again later.`
        ),
      };
    }

    // Find household by invite code
    const { data: householdData, error: householdError } = await supabase
      .from('households')
      .select('*')
      .eq('invite_code', normalizedCode)
      .single();

    if (householdError) {
      if (householdError.code === 'PGRST116') {
        return {
          success: false,
          error: createHouseholdError(
            HouseholdErrorCode.INVALID_INVITE_CODE,
            'Invalid invite code. Please check the code and try again.'
          ),
        };
      }
      throw householdError;
    }

    // Check if invite code has expired
    if (isInviteCodeExpired(householdData.invite_code_expires_at)) {
      return {
        success: false,
        error: createHouseholdError(
          HouseholdErrorCode.EXPIRED_INVITE_CODE,
          'This invite code has expired. Please ask the household leader for a new code.'
        ),
      };
    }

    // Check if household is at capacity (15 members max)
    const { data: memberCountData, error: countError } = await supabase
      .from('household_members')
      .select('id', { count: 'exact', head: true })
      .eq('household_id', householdData.id)
      .eq('status', 'active');

    if (countError) {
      throw countError;
    }

    const memberCount = memberCountData?.length ?? 0;
    if (memberCount >= MAX_HOUSEHOLD_MEMBERS) {
      return {
        success: false,
        error: createHouseholdError(
          HouseholdErrorCode.HOUSEHOLD_AT_CAPACITY,
          `This household has reached its maximum capacity of ${MAX_HOUSEHOLD_MEMBERS} members.`
        ),
      };
    }

    // Check for existing pending request
    const { data: existingRequest, error: requestCheckError } = await supabase
      .from('household_join_requests')
      .select('id, status')
      .eq('household_id', householdData.id)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .single();

    if (requestCheckError && requestCheckError.code !== 'PGRST116') {
      throw requestCheckError;
    }

    if (existingRequest) {
      return {
        success: false,
        error: createHouseholdError(
          HouseholdErrorCode.DUPLICATE_REQUEST,
          'You already have a pending request for this household'
        ),
      };
    }

    // Create join request
    const { data: joinRequestData, error: joinRequestError } = await supabase
      .from('household_join_requests')
      .insert({
        household_id: householdData.id,
        user_id: userId,
        invite_code: normalizedCode,
        status: 'pending',
      })
      .select()
      .single();

    if (joinRequestError) {
      throw joinRequestError;
    }

    logger.info('household_join_request_created', {
      correlationId: requestId,
      userId,
      householdId: householdData.id,
      requestId: joinRequestData.id,
      inviteCode: '[REDACTED]',
    });

    return {
      success: true,
      requestId: joinRequestData.id,
      message: 'Join request sent! Waiting for approval from the household leader.',
    };
  } catch (error) {
    logger.error('Unexpected error during join request', {
      correlationId: requestId,
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      error: createHouseholdError(
        HouseholdErrorCode.DATABASE_ERROR,
        'Failed to send join request. Please try again.',
        error
      ),
    };
  }
}

/**
 * Respond to a join request (approve or reject).
 *
 * Only the household leader can approve or reject join requests.
 * Approving adds the user as an active member of the household.
 *
 * @param request - Response with requestId and action (approve/reject)
 * @param responderId - ID of the user responding (must be household leader)
 * @returns RespondToJoinRequestResponse with result or error
 */
export async function respondToJoinRequest(
  request: RespondToJoinRequestRequest,
  responderId: string
): Promise<RespondToJoinRequestResponse> {
  const requestId = logger.generateRequestId();

  try {
    logger.info('household_join_request_response_started', {
      correlationId: requestId,
      responderId,
      joinRequestId: request.requestId,
      action: request.action,
    });

    const supabase = getSupabaseClient();

    // Get the join request
    const { data: joinRequestData, error: joinRequestError } = await supabase
      .from('household_join_requests')
      .select('*')
      .eq('id', request.requestId)
      .single();

    if (joinRequestError) {
      if (joinRequestError.code === 'PGRST116') {
        return {
          success: false,
          error: createHouseholdError(
            HouseholdErrorCode.REQUEST_NOT_FOUND,
            'Join request not found'
          ),
        };
      }
      throw joinRequestError;
    }

    // Check if request is still pending
    if (joinRequestData.status !== 'pending') {
      return {
        success: false,
        error: createHouseholdError(
          HouseholdErrorCode.INVALID_INPUT,
          `This request has already been ${joinRequestData.status}`
        ),
      };
    }

    // Verify responder is the household leader
    const { data: householdData, error: householdError } = await supabase
      .from('households')
      .select('leader_id')
      .eq('id', joinRequestData.household_id)
      .single();

    if (householdError) {
      throw householdError;
    }

    if (householdData.leader_id !== responderId) {
      return {
        success: false,
        error: createHouseholdError(
          HouseholdErrorCode.NOT_HOUSEHOLD_LEADER,
          'Only the household leader can approve or reject join requests'
        ),
      };
    }

    const newStatus = request.action === 'approve' ? 'approved' : 'rejected';

    // Update join request status
    const { error: updateError } = await supabase
      .from('household_join_requests')
      .update({
        status: newStatus,
        responded_at: new Date().toISOString(),
        responded_by: responderId,
      })
      .eq('id', request.requestId);

    if (updateError) {
      throw updateError;
    }

    // If approved, add user as household member
    if (request.action === 'approve') {
      // Check if user is already a member (race condition protection)
      const { data: existingMember } = await supabase
        .from('household_members')
        .select('id')
        .eq('household_id', joinRequestData.household_id)
        .eq('user_id', joinRequestData.user_id)
        .eq('status', 'active')
        .single();

      if (!existingMember) {
        const { error: memberError } = await supabase
          .from('household_members')
          .insert({
            household_id: joinRequestData.household_id,
            user_id: joinRequestData.user_id,
            role: 'member',
            status: 'active',
            is_temporary: false,
            invited_by: responderId,
          });

        if (memberError) {
          throw memberError;
        }
      }

      logger.info('household_join_request_approved', {
        correlationId: requestId,
        responderId,
        joinRequestId: request.requestId,
        householdId: joinRequestData.household_id,
        newMemberId: joinRequestData.user_id,
      });

      return {
        success: true,
        message: 'Join request approved. User has been added to the household.',
      };
    } else {
      logger.info('household_join_request_rejected', {
        correlationId: requestId,
        responderId,
        joinRequestId: request.requestId,
        householdId: joinRequestData.household_id,
        userId: joinRequestData.user_id,
      });

      return {
        success: true,
        message: 'Join request rejected.',
      };
    }
  } catch (error) {
    logger.error('Unexpected error responding to join request', {
      correlationId: requestId,
      responderId,
      joinRequestId: request.requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      error: createHouseholdError(
        HouseholdErrorCode.DATABASE_ERROR,
        'Failed to respond to join request. Please try again.',
        error
      ),
    };
  }
}

/**
 * Remove a member from the household.
 *
 * Only the household leader can remove members.
 * Leader cannot remove themselves (must use leaveHousehold instead).
 *
 * @param request - Removal request with householdId and memberId
 * @param removerId - ID of the user removing the member (must be leader)
 * @returns RemoveMemberResponse with result or error
 */
export async function removeMember(
  request: RemoveMemberRequest,
  removerId: string
): Promise<RemoveMemberResponse> {
  const requestId = logger.generateRequestId();

  try {
    logger.info('household_member_removal_started', {
      correlationId: requestId,
      removerId,
      householdId: request.householdId,
      memberId: request.memberId,
    });

    const supabase = getSupabaseClient();

    // Verify remover is the household leader
    const { data: householdData, error: householdError } = await supabase
      .from('households')
      .select('leader_id')
      .eq('id', request.householdId)
      .single();

    if (householdError) {
      if (householdError.code === 'PGRST116') {
        return {
          success: false,
          error: createHouseholdError(
            HouseholdErrorCode.HOUSEHOLD_NOT_FOUND,
            'Household not found'
          ),
        };
      }
      throw householdError;
    }

    if (householdData.leader_id !== removerId) {
      return {
        success: false,
        error: createHouseholdError(
          HouseholdErrorCode.NOT_HOUSEHOLD_LEADER,
          'Only the household leader can remove members'
        ),
      };
    }

    // Check if trying to remove self
    if (request.memberId === removerId) {
      return {
        success: false,
        error: createHouseholdError(
          HouseholdErrorCode.CANNOT_REMOVE_SELF,
          'Cannot remove yourself. Use leaveHousehold instead.'
        ),
      };
    }

    // Get the member to remove
    const { data: memberData, error: memberError } = await supabase
      .from('household_members')
      .select('*')
      .eq('household_id', request.householdId)
      .eq('user_id', request.memberId)
      .eq('status', 'active')
      .single();

    if (memberError) {
      if (memberError.code === 'PGRST116') {
        return {
          success: false,
          error: createHouseholdError(
            HouseholdErrorCode.MEMBER_NOT_FOUND,
            'Member not found in this household'
          ),
        };
      }
      throw memberError;
    }

    // Mark member as removed (soft delete)
    const { error: updateError } = await supabase
      .from('household_members')
      .update({ status: 'removed' })
      .eq('id', memberData.id);

    if (updateError) {
      throw updateError;
    }

    logger.info('household_member_removed', {
      correlationId: requestId,
      removerId,
      householdId: request.householdId,
      removedMemberId: request.memberId,
      memberRole: memberData.role,
    });

    return {
      success: true,
      message: 'Member removed from household successfully.',
    };
  } catch (error) {
    logger.error('Unexpected error removing member', {
      correlationId: requestId,
      removerId,
      householdId: request.householdId,
      memberId: request.memberId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      error: createHouseholdError(
        HouseholdErrorCode.DATABASE_ERROR,
        'Failed to remove member. Please try again.',
        error
      ),
    };
  }
}

/**
 * Regenerate the household invite code.
 *
 * Only the household leader can regenerate the invite code.
 * The old code becomes invalid immediately.
 *
 * @param request - Regeneration request with householdId and optional expirationDays
 * @param leaderId - ID of the user regenerating the code (must be leader)
 * @returns RegenerateInviteCodeResponse with new code or error
 */
export async function regenerateInviteCode(
  request: RegenerateInviteCodeRequest,
  leaderId: string
): Promise<RegenerateInviteCodeResponse> {
  const requestId = logger.generateRequestId();

  try {
    logger.info('household_invite_code_regeneration_started', {
      correlationId: requestId,
      leaderId,
      householdId: request.householdId,
      expirationDays: request.expirationDays,
    });

    const supabase = getSupabaseClient();

    // Get household and verify leader
    const { data: householdData, error: householdError } = await supabase
      .from('households')
      .select('*')
      .eq('id', request.householdId)
      .single();

    if (householdError) {
      if (householdError.code === 'PGRST116') {
        return {
          success: false,
          error: createHouseholdError(
            HouseholdErrorCode.HOUSEHOLD_NOT_FOUND,
            'Household not found'
          ),
        };
      }
      throw householdError;
    }

    if (householdData.leader_id !== leaderId) {
      return {
        success: false,
        error: createHouseholdError(
          HouseholdErrorCode.NOT_HOUSEHOLD_LEADER,
          'Only the household leader can regenerate the invite code'
        ),
      };
    }

    // Generate new unique invite code
    let newInviteCode = generateInviteCode(householdData.name);
    let uniqueCodeFound = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!uniqueCodeFound && attempts < maxAttempts) {
      const { data: existingCode } = await supabase
        .from('households')
        .select('id')
        .eq('invite_code', newInviteCode)
        .single();

      if (!existingCode) {
        uniqueCodeFound = true;
      } else {
        newInviteCode = generateInviteCode(householdData.name);
        attempts++;
      }
    }

    if (!uniqueCodeFound) {
      return {
        success: false,
        error: createHouseholdError(
          HouseholdErrorCode.DATABASE_ERROR,
          'Failed to generate unique invite code. Please try again.'
        ),
      };
    }

    // Calculate expiration date
    const expirationDays = request.expirationDays ?? DEFAULT_INVITE_EXPIRATION_DAYS;
    const newExpiresAt = calculateExpirationDate(expirationDays);

    // Update household with new invite code
    const { error: updateError } = await supabase
      .from('households')
      .update({
        invite_code: newInviteCode,
        invite_code_expires_at: newExpiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', request.householdId);

    if (updateError) {
      throw updateError;
    }

    logger.info('household_invite_code_regenerated', {
      correlationId: requestId,
      leaderId,
      householdId: request.householdId,
      oldCode: '[REDACTED]',
      newCode: '[REDACTED]',
      expiresAt: newExpiresAt,
    });

    return {
      success: true,
      inviteCode: newInviteCode,
      expiresAt: newExpiresAt,
    };
  } catch (error) {
    logger.error('Unexpected error regenerating invite code', {
      correlationId: requestId,
      leaderId,
      householdId: request.householdId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      error: createHouseholdError(
        HouseholdErrorCode.DATABASE_ERROR,
        'Failed to regenerate invite code. Please try again.',
        error
      ),
    };
  }
}

/**
 * Leave a household.
 *
 * If the user is the leader and there are other members, either:
 * 1. Transfer leadership to designated successor (if provided)
 * 2. Auto-promote longest-standing member (if no successor designated)
 *
 * If the user is the only member, the household remains but becomes inactive.
 *
 * @param request - Leave request with householdId and optional successorId
 * @param userId - ID of the user leaving the household
 * @returns LeaveHouseholdResponse with result or error
 */
export async function leaveHousehold(
  request: LeaveHouseholdRequest,
  userId: string
): Promise<LeaveHouseholdResponse> {
  const requestId = logger.generateRequestId();

  try {
    logger.info('household_leave_started', {
      correlationId: requestId,
      userId,
      householdId: request.householdId,
      hasSuccessor: !!request.successorId,
    });

    const supabase = getSupabaseClient();

    // Get user's membership
    const { data: memberData, error: memberError } = await supabase
      .from('household_members')
      .select('*')
      .eq('household_id', request.householdId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (memberError) {
      if (memberError.code === 'PGRST116') {
        return {
          success: false,
          error: createHouseholdError(
            HouseholdErrorCode.NOT_HOUSEHOLD_MEMBER,
            'You are not a member of this household'
          ),
        };
      }
      throw memberError;
    }

    // Get all active members
    const { data: allMembersData, error: allMembersError } = await supabase
      .from('household_members')
      .select('*')
      .eq('household_id', request.householdId)
      .eq('status', 'active')
      .order('joined_at', { ascending: true });

    if (allMembersError) {
      throw allMembersError;
    }

    const isLeader = memberData.role === 'leader';
    const otherMembers = allMembersData.filter((m) => m.user_id !== userId);

    // If user is leader and there are other members, transfer leadership
    if (isLeader && otherMembers.length > 0) {
      let newLeaderId: string;

      if (request.successorId) {
        // Validate successor is an active member
        const successor = otherMembers.find((m) => m.user_id === request.successorId);
        if (!successor) {
          return {
            success: false,
            error: createHouseholdError(
              HouseholdErrorCode.MEMBER_NOT_FOUND,
              'Designated successor is not an active member of this household'
            ),
          };
        }
        newLeaderId = request.successorId;
      } else {
        // Auto-promote longest-standing member (first in list due to order by joined_at)
        newLeaderId = otherMembers[0].user_id;
      }

      // Update household leader
      const { error: householdUpdateError } = await supabase
        .from('households')
        .update({ leader_id: newLeaderId, updated_at: new Date().toISOString() })
        .eq('id', request.householdId);

      if (householdUpdateError) {
        throw householdUpdateError;
      }

      // Update new leader's role in members table
      const { error: newLeaderUpdateError } = await supabase
        .from('household_members')
        .update({ role: 'leader' })
        .eq('household_id', request.householdId)
        .eq('user_id', newLeaderId);

      if (newLeaderUpdateError) {
        throw newLeaderUpdateError;
      }

      logger.info('household_leadership_transferred', {
        correlationId: requestId,
        previousLeaderId: userId,
        newLeaderId,
        householdId: request.householdId,
        wasDesignated: !!request.successorId,
      });
    }

    // Remove user's membership (soft delete)
    const { error: removeError } = await supabase
      .from('household_members')
      .update({ status: 'removed' })
      .eq('id', memberData.id);

    if (removeError) {
      throw removeError;
    }

    logger.info('household_member_left', {
      correlationId: requestId,
      userId,
      householdId: request.householdId,
      wasLeader: isLeader,
      remainingMembers: otherMembers.length,
    });

    const response: LeaveHouseholdResponse = {
      success: true,
      message: isLeader && otherMembers.length > 0
        ? 'You have left the household. Leadership has been transferred.'
        : 'You have left the household.',
    };

    if (isLeader && otherMembers.length > 0) {
      response.newLeaderId = request.successorId || otherMembers[0].user_id;
    }

    return response;
  } catch (error) {
    logger.error('Unexpected error leaving household', {
      correlationId: requestId,
      userId,
      householdId: request.householdId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      error: createHouseholdError(
        HouseholdErrorCode.DATABASE_ERROR,
        'Failed to leave household. Please try again.',
        error
      ),
    };
  }
}

/**
 * Withdraw a pending join request.
 *
 * Users can withdraw their own pending join requests before they are approved or rejected.
 *
 * @param request - Withdrawal request with requestId
 * @param userId - ID of the user withdrawing the request
 * @returns WithdrawJoinRequestResponse with result or error
 */
export async function withdrawJoinRequest(
  request: WithdrawJoinRequestRequest,
  userId: string
): Promise<WithdrawJoinRequestResponse> {
  const requestId = logger.generateRequestId();

  try {
    logger.info('household_join_request_withdrawal_started', {
      correlationId: requestId,
      userId,
      joinRequestId: request.requestId,
    });

    const supabase = getSupabaseClient();

    // Get the join request
    const { data: joinRequestData, error: joinRequestError } = await supabase
      .from('household_join_requests')
      .select('*')
      .eq('id', request.requestId)
      .single();

    if (joinRequestError) {
      if (joinRequestError.code === 'PGRST116') {
        return {
          success: false,
          error: createHouseholdError(
            HouseholdErrorCode.REQUEST_NOT_FOUND,
            'Join request not found'
          ),
        };
      }
      throw joinRequestError;
    }

    // Verify user owns this request
    if (joinRequestData.user_id !== userId) {
      return {
        success: false,
        error: createHouseholdError(
          HouseholdErrorCode.REQUEST_NOT_FOUND,
          'Join request not found'
        ),
      };
    }

    // Check if request is still pending
    if (joinRequestData.status !== 'pending') {
      return {
        success: false,
        error: createHouseholdError(
          HouseholdErrorCode.CANNOT_WITHDRAW_RESPONDED_REQUEST,
          `Cannot withdraw a request that has already been ${joinRequestData.status}`
        ),
      };
    }

    // Update request status to withdrawn
    const { error: updateError } = await supabase
      .from('household_join_requests')
      .update({
        status: 'withdrawn',
        responded_at: new Date().toISOString(),
      })
      .eq('id', request.requestId);

    if (updateError) {
      throw updateError;
    }

    logger.info('household_join_request_withdrawn', {
      correlationId: requestId,
      userId,
      joinRequestId: request.requestId,
      householdId: joinRequestData.household_id,
    });

    return {
      success: true,
      message: 'Join request withdrawn successfully.',
    };
  } catch (error) {
    logger.error('Unexpected error withdrawing join request', {
      correlationId: requestId,
      userId,
      joinRequestId: request.requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      error: createHouseholdError(
        HouseholdErrorCode.DATABASE_ERROR,
        'Failed to withdraw join request. Please try again.',
        error
      ),
    };
  }
}

/**
 * Send an email invite to join the household.
 *
 * Only the household leader can send email invites.
 * Rate limited to 20 invites per hour per household.
 *
 * NOTE: This is a placeholder implementation. Email sending functionality
 * will be implemented when email infrastructure is ready.
 *
 * @param request - Email invite request with email and optional message
 * @param leaderId - ID of the household leader sending the invite
 * @returns SendEmailInviteResponse with result or error
 */
export async function sendEmailInvite(
  request: SendEmailInviteRequest,
  leaderId: string
): Promise<SendEmailInviteResponse> {
  const requestId = logger.generateRequestId();

  try {
    logger.info('household_email_invite_started', {
      correlationId: requestId,
      leaderId,
      householdId: request.householdId,
      recipientEmail: request.email,
    });

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(request.email)) {
      return {
        success: false,
        error: createHouseholdError(
          HouseholdErrorCode.INVALID_EMAIL,
          'Invalid email address'
        ),
      };
    }

    const supabase = getSupabaseClient();

    // Verify leader is household leader
    const { data: householdData, error: householdError } = await supabase
      .from('households')
      .select('*')
      .eq('id', request.householdId)
      .single();

    if (householdError) {
      if (householdError.code === 'PGRST116') {
        return {
          success: false,
          error: createHouseholdError(
            HouseholdErrorCode.HOUSEHOLD_NOT_FOUND,
            'Household not found'
          ),
        };
      }
      throw householdError;
    }

    if (householdData.leader_id !== leaderId) {
      return {
        success: false,
        error: createHouseholdError(
          HouseholdErrorCode.NOT_HOUSEHOLD_LEADER,
          'Only the household leader can send email invites'
        ),
      };
    }

    // TODO: Implement rate limiting for email invites (20 per hour)
    // TODO: Implement actual email sending via email service
    // For now, just log the intent

    logger.info('household_email_invite_queued', {
      correlationId: requestId,
      leaderId,
      householdId: request.householdId,
      recipientEmail: request.email,
      inviteCode: '[REDACTED]',
      hasPersonalMessage: !!request.personalMessage,
    });

    return {
      success: true,
      message: 'Email invite sent successfully. (Note: Email sending not yet implemented)',
    };
  } catch (error) {
    logger.error('Unexpected error sending email invite', {
      correlationId: requestId,
      leaderId,
      householdId: request.householdId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      error: createHouseholdError(
        HouseholdErrorCode.DATABASE_ERROR,
        'Failed to send email invite. Please try again.',
        error
      ),
    };
  }
}
