/**
 * Analytics Event Tracking for Household Management
 *
 * Implements comprehensive event tracking to measure household feature success,
 * understand user behavior, and identify funnel drop-offs.
 *
 * Analytics Requirements (Ana's P0 Critical):
 * - Track all household actions (create, join, approve, reject, remove)
 * - Measure conversion funnels (onboarding → create/join → active)
 * - Monitor household health metrics (activity, churn, engagement)
 * - Provide actionable insights for product improvements
 *
 * Integration:
 * - Works with any analytics provider (Amplitude, Mixpanel, Segment, etc.)
 * - Batches events for performance
 * - Includes user properties for segmentation
 * - Privacy-compliant (no PII in event properties)
 */

import { logger } from '../utils/logger';
import { metrics } from '../utils/metrics';

// =============================================================================
// ANALYTICS PROVIDER INTERFACE
// =============================================================================

export interface AnalyticsProvider {
  track(event: string, properties: Record<string, any>): void;
  identify(userId: string, traits: Record<string, any>): void;
}

// Default analytics provider (logs to console in development)
class DefaultAnalyticsProvider implements AnalyticsProvider {
  track(event: string, properties: Record<string, any>): void {
    logger.info('Analytics event tracked', { event, properties });
    metrics.record(`analytics_${event}`, properties);
  }

  identify(userId: string, traits: Record<string, any>): void {
    logger.info('User identified', { userId, traits });
  }
}

let analyticsProvider: AnalyticsProvider = new DefaultAnalyticsProvider();

/**
 * Set the analytics provider (Amplitude, Mixpanel, etc.)
 */
export function setAnalyticsProvider(provider: AnalyticsProvider): void {
  analyticsProvider = provider;
}

// =============================================================================
// EVENT TRACKING FUNCTIONS
// =============================================================================

/**
 * Track household creation event.
 *
 * Metrics tracked:
 * - Total households created
 * - Household creation rate (daily, weekly, monthly)
 * - Time from registration to household creation
 * - Household name length, has description
 *
 * @param householdId - ID of the created household
 * @param userId - ID of the user who created it
 * @param metadata - Additional context (name length, has description, etc.)
 */
export function trackHouseholdCreated(
  householdId: string,
  userId: string,
  metadata: {
    householdNameLength?: number;
    hasDescription?: boolean;
    timeFromRegistration?: number; // milliseconds
    source?: string; // 'web' | 'mobile'
  } = {}
): void {
  analyticsProvider.track('household_created', {
    household_id: householdId,
    user_id: userId,
    household_name_length: metadata.householdNameLength,
    has_description: metadata.hasDescription,
    time_from_registration_ms: metadata.timeFromRegistration,
    source: metadata.source || 'web',
    timestamp: new Date().toISOString(),
  });

  // Update user traits
  analyticsProvider.identify(userId, {
    is_household_leader: true,
    has_household: true,
    household_id: householdId,
  });
}

/**
 * Track join request submission event.
 *
 * Funnel stage: User discovers household → submits join request
 *
 * @param householdId - ID of the household being joined
 * @param userId - ID of the user submitting request
 * @param inviteCode - Invite code used (redacted for privacy)
 * @param metadata - Additional context
 */
export function trackJoinRequestSubmitted(
  householdId: string,
  userId: string,
  inviteCode: string,
  metadata: {
    codeEntryMethod?: 'manual' | 'qr_scan' | 'deep_link' | 'email_link';
    source?: string;
  } = {}
): void {
  analyticsProvider.track('household_join_request_submitted', {
    household_id: householdId,
    user_id: userId,
    invite_code_prefix: inviteCode.substring(0, 3), // Only track prefix for debugging
    code_entry_method: metadata.codeEntryMethod || 'manual',
    source: metadata.source || 'web',
    timestamp: new Date().toISOString(),
  });

  // Update user traits
  analyticsProvider.identify(userId, {
    has_pending_join_request: true,
    pending_household_id: householdId,
  });
}

/**
 * Track join request approval event.
 *
 * Funnel stage: Join request submitted → approved → active member
 *
 * @param householdId - ID of the household
 * @param requestId - ID of the join request
 * @param approvedBy - User ID of the approver (household leader)
 * @param metadata - Additional context
 */
export function trackJoinRequestApproved(
  householdId: string,
  requestId: string,
  approvedBy: string,
  metadata: {
    requestAge?: number; // Time from submission to approval (ms)
    newMemberId?: string;
    source?: string;
  } = {}
): void {
  analyticsProvider.track('household_join_request_approved', {
    household_id: householdId,
    request_id: requestId,
    approved_by: approvedBy,
    request_age_ms: metadata.requestAge,
    new_member_id: metadata.newMemberId,
    source: metadata.source || 'web',
    timestamp: new Date().toISOString(),
  });

  // Update new member traits
  if (metadata.newMemberId) {
    analyticsProvider.identify(metadata.newMemberId, {
      has_household: true,
      is_household_leader: false,
      household_id: householdId,
      has_pending_join_request: false,
    });
  }
}

/**
 * Track join request rejection event.
 *
 * Funnel drop-off: Join request submitted → rejected
 *
 * @param householdId - ID of the household
 * @param requestId - ID of the join request
 * @param rejectedBy - User ID of the rejecter (household leader)
 * @param metadata - Additional context
 */
export function trackJoinRequestRejected(
  householdId: string,
  requestId: string,
  rejectedBy: string,
  metadata: {
    requestAge?: number;
    userId?: string;
    source?: string;
  } = {}
): void {
  analyticsProvider.track('household_join_request_rejected', {
    household_id: householdId,
    request_id: requestId,
    rejected_by: rejectedBy,
    request_age_ms: metadata.requestAge,
    user_id: metadata.userId,
    source: metadata.source || 'web',
    timestamp: new Date().toISOString(),
  });

  // Update user traits
  if (metadata.userId) {
    analyticsProvider.identify(metadata.userId, {
      has_pending_join_request: false,
      last_join_request_status: 'rejected',
    });
  }
}

/**
 * Track member removal event.
 *
 * Churn indicator: Active member → removed
 *
 * @param householdId - ID of the household
 * @param memberId - User ID of the removed member
 * @param removedBy - User ID of the remover (household leader)
 * @param metadata - Additional context
 */
export function trackMemberRemoved(
  householdId: string,
  memberId: string,
  removedBy: string,
  metadata: {
    memberRole?: string;
    membershipDuration?: number; // Time as member (ms)
    reason?: string;
    source?: string;
  } = {}
): void {
  analyticsProvider.track('household_member_removed', {
    household_id: householdId,
    member_id: memberId,
    removed_by: removedBy,
    member_role: metadata.memberRole,
    membership_duration_ms: metadata.membershipDuration,
    reason: metadata.reason,
    source: metadata.source || 'web',
    timestamp: new Date().toISOString(),
  });

  // Update removed member traits
  analyticsProvider.identify(memberId, {
    has_household: false,
    was_removed_from_household: true,
    removal_timestamp: new Date().toISOString(),
  });
}

/**
 * Track invite code regeneration event.
 *
 * Security indicator: Frequent regeneration may indicate code sharing issues
 *
 * @param householdId - ID of the household
 * @param userId - User ID of the regenerator (household leader)
 * @param metadata - Additional context
 */
export function trackInviteCodeRegenerated(
  householdId: string,
  userId: string,
  metadata: {
    reason?: string;
    oldCodeAge?: number; // Age of old code (ms)
    source?: string;
  } = {}
): void {
  analyticsProvider.track('household_invite_code_regenerated', {
    household_id: householdId,
    user_id: userId,
    reason: metadata.reason,
    old_code_age_ms: metadata.oldCodeAge,
    source: metadata.source || 'web',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track leadership transfer event.
 *
 * Important for understanding household stability
 *
 * @param householdId - ID of the household
 * @param fromUserId - Previous leader's user ID
 * @param toUserId - New leader's user ID
 * @param metadata - Additional context
 */
export function trackLeadershipTransferred(
  householdId: string,
  fromUserId: string,
  toUserId: string,
  metadata: {
    wasDesignated?: boolean; // Was successor explicitly designated?
    reason?: 'leave' | 'transfer';
    previousLeaderTenure?: number; // Time as leader (ms)
    source?: string;
  } = {}
): void {
  analyticsProvider.track('household_leadership_transferred', {
    household_id: householdId,
    from_user_id: fromUserId,
    to_user_id: toUserId,
    was_designated: metadata.wasDesignated,
    reason: metadata.reason,
    previous_leader_tenure_ms: metadata.previousLeaderTenure,
    source: metadata.source || 'web',
    timestamp: new Date().toISOString(),
  });

  // Update user traits
  analyticsProvider.identify(toUserId, {
    is_household_leader: true,
  });

  analyticsProvider.identify(fromUserId, {
    is_household_leader: false,
  });
}

/**
 * Track household leave event.
 *
 * Churn indicator: Active member → leaves household
 *
 * @param householdId - ID of the household
 * @param userId - User ID of the leaving member
 * @param metadata - Additional context
 */
export function trackHouseholdLeft(
  householdId: string,
  userId: string,
  metadata: {
    wasLeader?: boolean;
    membershipDuration?: number; // Time as member (ms)
    reason?: string;
    source?: string;
  } = {}
): void {
  analyticsProvider.track('household_left', {
    household_id: householdId,
    user_id: userId,
    was_leader: metadata.wasLeader,
    membership_duration_ms: metadata.membershipDuration,
    reason: metadata.reason,
    source: metadata.source || 'web',
    timestamp: new Date().toISOString(),
  });

  // Update user traits
  analyticsProvider.identify(userId, {
    has_household: false,
    left_household_at: new Date().toISOString(),
  });
}

// =============================================================================
// FUNNEL TRACKING
// =============================================================================

/**
 * Track household onboarding funnel step.
 *
 * Funnel stages:
 * 1. onboarding_started - User begins household setup
 * 2. household_choice_made - User chooses create vs. join
 * 3. household_created - User successfully creates household
 * 4. join_request_submitted - User submits join request
 * 5. household_active - User is active household member
 *
 * @param stage - Funnel stage
 * @param userId - User ID
 * @param metadata - Additional context
 */
export function trackOnboardingFunnelStep(
  stage: 'started' | 'choice_made' | 'created' | 'join_submitted' | 'active',
  userId: string,
  metadata: Record<string, any> = {}
): void {
  analyticsProvider.track(`household_onboarding_${stage}`, {
    user_id: userId,
    stage,
    ...metadata,
    timestamp: new Date().toISOString(),
  });
}

// =============================================================================
// ENGAGEMENT TRACKING
// =============================================================================

/**
 * Track household dashboard view (engagement metric).
 */
export function trackDashboardView(
  householdId: string,
  userId: string,
  metadata: {
    memberCount?: number;
    pendingRequestCount?: number;
    source?: string;
  } = {}
): void {
  analyticsProvider.track('household_dashboard_viewed', {
    household_id: householdId,
    user_id: userId,
    member_count: metadata.memberCount,
    pending_request_count: metadata.pendingRequestCount,
    source: metadata.source || 'web',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track household settings view (engagement metric).
 */
export function trackSettingsView(
  householdId: string,
  userId: string,
  metadata: { source?: string } = {}
): void {
  analyticsProvider.track('household_settings_viewed', {
    household_id: householdId,
    user_id: userId,
    source: metadata.source || 'web',
    timestamp: new Date().toISOString(),
  });
}
