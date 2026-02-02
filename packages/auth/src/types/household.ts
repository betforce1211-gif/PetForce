/**
 * Household Management System Types
 *
 * Defines all TypeScript interfaces and types for the household management feature.
 * This is the core differentiator for PetForce - collaborative family pet care.
 */

// =============================================================================
// CORE ENTITIES
// =============================================================================

/**
 * Household represents a physical household where pets live and are cared for.
 * Example: "The Zeder House" with 2 dogs, 3 cats, 1 bird
 */
export interface Household {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  inviteCodeExpiresAt: string | null; // ISO 8601 timestamp, null = never expires
  leaderId: string;
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}

/**
 * Database representation of household (snake_case for SQL)
 */
export interface HouseholdRow {
  id: string;
  name: string;
  description: string | null;
  invite_code: string;
  invite_code_expires_at: string | null;
  leader_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Household member role
 */
export type HouseholdRole = 'leader' | 'member';

/**
 * Household member status
 */
export type HouseholdMemberStatus = 'active' | 'removed';

/**
 * HouseholdMember represents a user's membership in a household.
 * Supports both permanent members (family) and temporary members (pet sitters).
 */
export interface HouseholdMember {
  id: string;
  householdId: string;
  userId: string;
  role: HouseholdRole;
  status: HouseholdMemberStatus;
  isTemporary: boolean;
  temporaryExpiresAt: string | null; // ISO 8601 timestamp, null = permanent
  invitedBy: string | null; // user_id of inviter, null = household creator
  joinedAt: string; // ISO 8601 timestamp
}

/**
 * Database representation of household member (snake_case for SQL)
 */
export interface HouseholdMemberRow {
  id: string;
  household_id: string;
  user_id: string;
  role: HouseholdRole;
  status: HouseholdMemberStatus;
  is_temporary: boolean;
  temporary_expires_at: string | null;
  invited_by: string | null;
  joined_at: string;
}

/**
 * Join request status
 */
export type JoinRequestStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';

/**
 * HouseholdJoinRequest represents a user's request to join a household.
 * Requires household leader approval.
 */
export interface HouseholdJoinRequest {
  id: string;
  householdId: string;
  userId: string;
  inviteCode: string; // Code used for joining (audit trail)
  status: JoinRequestStatus;
  requestedAt: string; // ISO 8601 timestamp
  respondedAt: string | null; // ISO 8601 timestamp, null = pending
  respondedBy: string | null; // user_id of leader who responded, null = pending
}

/**
 * Database representation of join request (snake_case for SQL)
 */
export interface HouseholdJoinRequestRow {
  id: string;
  household_id: string;
  user_id: string;
  invite_code: string;
  status: JoinRequestStatus;
  requested_at: string;
  responded_at: string | null;
  responded_by: string | null;
}

// =============================================================================
// API REQUEST/RESPONSE TYPES
// =============================================================================

/**
 * Request to create a new household
 */
export interface CreateHouseholdRequest {
  name: string; // 2-50 characters, alphanumeric + spaces only
  description?: string; // Optional, max 200 characters
}

/**
 * Response from creating a household
 */
export interface CreateHouseholdResponse {
  success: boolean;
  household: Household;
  error?: HouseholdError;
}

/**
 * Request to join a household using an invite code
 */
export interface JoinHouseholdRequest {
  inviteCode: string; // Case-sensitive, uppercase only
}

/**
 * Response from requesting to join a household
 */
export interface JoinHouseholdResponse {
  success: boolean;
  requestId?: string;
  message?: string;
  error?: HouseholdError;
}

/**
 * Request to respond to a join request (approve or reject)
 */
export interface RespondToJoinRequestRequest {
  requestId: string;
  action: 'approve' | 'reject';
}

/**
 * Response from responding to a join request
 */
export interface RespondToJoinRequestResponse {
  success: boolean;
  message?: string;
  error?: HouseholdError;
}

/**
 * Request to remove a member from household
 */
export interface RemoveMemberRequest {
  householdId: string;
  memberId: string;
}

/**
 * Response from removing a member
 */
export interface RemoveMemberResponse {
  success: boolean;
  message?: string;
  error?: HouseholdError;
}

/**
 * Request to regenerate household invite code
 */
export interface RegenerateInviteCodeRequest {
  householdId: string;
  expirationDays?: number; // 7, 30, 90, or null (never expires)
}

/**
 * Response from regenerating invite code
 */
export interface RegenerateInviteCodeResponse {
  success: boolean;
  inviteCode?: string;
  expiresAt?: string | null;
  error?: HouseholdError;
}

/**
 * Request to leave a household
 */
export interface LeaveHouseholdRequest {
  householdId: string;
  successorId?: string; // For leaders: designated successor, null = auto-promote
}

/**
 * Response from leaving a household
 */
export interface LeaveHouseholdResponse {
  success: boolean;
  message?: string;
  newLeaderId?: string; // If leader left and new leader was promoted
  error?: HouseholdError;
}

/**
 * Request to withdraw a pending join request
 */
export interface WithdrawJoinRequestRequest {
  requestId: string;
}

/**
 * Response from withdrawing a join request
 */
export interface WithdrawJoinRequestResponse {
  success: boolean;
  message?: string;
  error?: HouseholdError;
}

/**
 * Request to send email invite to join household
 */
export interface SendEmailInviteRequest {
  householdId: string;
  email: string;
  personalMessage?: string; // Optional personalized message
}

/**
 * Response from sending email invite
 */
export interface SendEmailInviteResponse {
  success: boolean;
  message?: string;
  error?: HouseholdError;
}

/**
 * Request to extend temporary member access
 */
export interface ExtendTemporaryAccessRequest {
  householdId: string;
  memberId: string;
  expirationDate: string; // ISO 8601 timestamp
}

/**
 * Response from extending temporary access
 */
export interface ExtendTemporaryAccessResponse {
  success: boolean;
  message?: string;
  newExpirationDate?: string;
  error?: HouseholdError;
}

/**
 * Response containing user's household data
 */
export interface GetHouseholdResponse {
  success: boolean;
  household: Household | null;
  members: HouseholdMember[];
  pendingRequests: HouseholdJoinRequest[];
  memberCount: number;
  userRole: HouseholdRole | null;
  error?: HouseholdError;
}

/**
 * Response containing user's join requests
 */
export interface GetMyJoinRequestsResponse {
  success: boolean;
  requests: HouseholdJoinRequest[];
  error?: HouseholdError;
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

/**
 * Household-specific error codes
 */
export enum HouseholdErrorCode {
  // Household errors
  ALREADY_IN_HOUSEHOLD = 'ALREADY_IN_HOUSEHOLD',
  HOUSEHOLD_NOT_FOUND = 'HOUSEHOLD_NOT_FOUND',
  HOUSEHOLD_AT_CAPACITY = 'HOUSEHOLD_AT_CAPACITY',
  INVALID_HOUSEHOLD_NAME = 'INVALID_HOUSEHOLD_NAME',

  // Invite code errors
  INVALID_INVITE_CODE = 'INVALID_INVITE_CODE',
  EXPIRED_INVITE_CODE = 'EXPIRED_INVITE_CODE',

  // Permission errors
  NOT_HOUSEHOLD_LEADER = 'NOT_HOUSEHOLD_LEADER',
  NOT_HOUSEHOLD_MEMBER = 'NOT_HOUSEHOLD_MEMBER',
  CANNOT_REMOVE_LEADER = 'CANNOT_REMOVE_LEADER',
  CANNOT_REMOVE_SELF = 'CANNOT_REMOVE_SELF',

  // Join request errors
  REQUEST_NOT_FOUND = 'REQUEST_NOT_FOUND',
  DUPLICATE_REQUEST = 'DUPLICATE_REQUEST',
  CANNOT_WITHDRAW_RESPONDED_REQUEST = 'CANNOT_WITHDRAW_RESPONDED_REQUEST',

  // Member errors
  MEMBER_NOT_FOUND = 'MEMBER_NOT_FOUND',
  MEMBER_ALREADY_REMOVED = 'MEMBER_ALREADY_REMOVED',

  // Rate limiting errors
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Validation errors
  INVALID_INPUT = 'INVALID_INPUT',
  INVALID_EMAIL = 'INVALID_EMAIL',

  // System errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Household error object
 */
export interface HouseholdError {
  code: HouseholdErrorCode;
  message: string;
  details?: unknown;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Extended household member with user information
 * Used in UI to display member details
 */
export interface HouseholdMemberWithUser extends HouseholdMember {
  email?: string;
  displayName?: string;
}

/**
 * Extended join request with household and user information
 * Used in UI to display request details
 */
export interface JoinRequestWithDetails extends HouseholdJoinRequest {
  householdName?: string;
  householdDescription?: string | null;
  userEmail?: string;
}

/**
 * Invite code expiration options
 */
export type InviteCodeExpiration = 7 | 30 | 90 | null; // days, null = never expires

/**
 * QR code data for household invite
 */
export interface HouseholdQRCodeData {
  inviteCode: string;
  householdName: string;
  householdId: string;
  deepLink: string; // petforce://household/join?code=...
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Type guard to check if error is a HouseholdError
 */
export function isHouseholdError(error: unknown): error is HouseholdError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    Object.values(HouseholdErrorCode).includes((error as HouseholdError).code)
  );
}

/**
 * Type guard to check if user is household leader
 */
export function isHouseholdLeader(member: HouseholdMember | null): boolean {
  return member?.role === 'leader' && member?.status === 'active';
}

/**
 * Type guard to check if member is temporary
 */
export function isTemporaryMember(member: HouseholdMember): boolean {
  return member.isTemporary;
}

/**
 * Type guard to check if temporary access has expired
 */
export function hasTemporaryAccessExpired(member: HouseholdMember): boolean {
  if (!member.isTemporary || !member.temporaryExpiresAt) {
    return false;
  }
  return new Date(member.temporaryExpiresAt) < new Date();
}

/**
 * Type guard to check if invite code has expired
 */
export function hasInviteCodeExpired(household: Household): boolean {
  if (!household.inviteCodeExpiresAt) {
    return false; // Never expires
  }
  return new Date(household.inviteCodeExpiresAt) < new Date();
}
