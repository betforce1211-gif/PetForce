# Design: Household Management System

**Change ID**: `implement-household-management-system`

## Architecture Overview

The Household Management System follows PetForce's database-agnostic philosophy (established in `user_registrations`) and creates a collaborative foundation for all future pet care features.

### Design Principles

1. **Database-Agnostic**: Custom tables with explicit relationships, not provider-dependent
2. **Simple by Default**: Minimal configuration, maximum usability
3. **Secure by Design**: Row-level security, leader-only mutations
4. **Mobile-First**: All flows optimized for mobile (60-80% of users)
5. **Family-Centric**: Terminology and UX reflect family relationships

## Data Model

### Table: `households`

Represents a physical household where pets live and are cared for.

```sql
CREATE TABLE public.households (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  leader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT households_name_length CHECK (length(name) >= 2 AND length(name) <= 100),
  CONSTRAINT households_invite_code_format CHECK (length(invite_code) >= 8)
);

CREATE INDEX idx_households_leader_id ON public.households(leader_id);
CREATE INDEX idx_households_invite_code ON public.households(invite_code);
```

**Fields**:
- `id`: Unique household identifier
- `name`: Household display name (e.g., "The Zeder House")
- `invite_code`: Unique shareable code (e.g., "ZEDER-2024-ALPHA")
- `leader_id`: Current household leader (can transfer)
- `created_at`: Household creation timestamp
- `updated_at`: Last modification timestamp

**Constraints**:
- Name must be 2-100 characters
- Invite code must be at least 8 characters
- Invite code must be globally unique
- Leader must be a valid user

### Table: `household_members`

Tracks membership in households with roles and status.

```sql
CREATE TABLE public.household_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'active',
  is_temporary BOOLEAN DEFAULT false,
  temporary_expires_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT household_members_unique_user_household UNIQUE(household_id, user_id),
  CONSTRAINT household_members_role_check CHECK (role IN ('leader', 'member')),
  CONSTRAINT household_members_status_check CHECK (status IN ('active', 'removed'))
);

CREATE INDEX idx_household_members_household_id ON public.household_members(household_id);
CREATE INDEX idx_household_members_user_id ON public.household_members(user_id);
CREATE INDEX idx_household_members_status ON public.household_members(status);
```

**Fields**:
- `id`: Unique membership identifier
- `household_id`: Reference to household
- `user_id`: Reference to user
- `role`: Member role ('leader' or 'member')
- `status`: Membership status ('active' or 'removed')
- `is_temporary`: Whether this is temporary access (pet sitter)
- `temporary_expires_at`: When temporary access expires (NULL for permanent)
- `joined_at`: When user joined household

**Constraints**:
- User can only be in a household once (unique constraint)
- Role must be 'leader' or 'member'
- Status must be 'active' or 'removed'

**Business Rules**:
- A household must have exactly one leader at all times
- Leader is automatically added as member with role='leader'
- When leader leaves, longest-standing member becomes leader

### Table: `household_join_requests`

Tracks pending requests to join households.

```sql
CREATE TABLE public.household_join_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES auth.users(id),

  CONSTRAINT household_join_requests_unique_pending UNIQUE(household_id, user_id, status),
  CONSTRAINT household_join_requests_status_check CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE INDEX idx_household_join_requests_household_id ON public.household_join_requests(household_id);
CREATE INDEX idx_household_join_requests_user_id ON public.household_join_requests(user_id);
CREATE INDEX idx_household_join_requests_status ON public.household_join_requests(status);
```

**Fields**:
- `id`: Unique request identifier
- `household_id`: Target household
- `user_id`: Requesting user
- `invite_code`: Code used for joining (for audit trail)
- `status`: Request status ('pending', 'approved', 'rejected')
- `requested_at`: When request was made
- `responded_at`: When leader responded
- `responded_by`: Which leader/admin responded

**Constraints**:
- User can only have one pending request per household
- Status must be 'pending', 'approved', or 'rejected'

## API Design

### Endpoints

All endpoints under `/api/households` (packages/auth/src/api/household-api.ts)

#### Create Household
```typescript
POST /api/households
{
  name: string; // "The Zeder House"
}

Response:
{
  success: true,
  household: {
    id: string,
    name: string,
    inviteCode: string, // "ZEDER-2024-ALPHA"
    leaderId: string,
    createdAt: string
  }
}
```

#### Get User's Household
```typescript
GET /api/households/me

Response:
{
  success: true,
  household: {
    id: string,
    name: string,
    inviteCode: string, // Only if user is leader
    role: 'leader' | 'member',
    memberCount: number,
    members: [{
      id: string,
      email: string,
      role: 'leader' | 'member',
      isTemporary: boolean,
      joinedAt: string
    }]
  } | null
}
```

#### Request to Join Household
```typescript
POST /api/households/join
{
  inviteCode: string; // "ZEDER-2024-ALPHA"
}

Response:
{
  success: true,
  message: "Join request sent to household leader",
  requestId: string
}
```

#### Approve/Reject Join Request (Leader Only)
```typescript
POST /api/households/:householdId/requests/:requestId/respond
{
  action: 'approve' | 'reject'
}

Response:
{
  success: true,
  message: "Request approved" | "Request rejected"
}
```

#### Remove Member (Leader Only)
```typescript
DELETE /api/households/:householdId/members/:memberId

Response:
{
  success: true,
  message: "Member removed from household"
}
```

#### Regenerate Invite Code (Leader Only)
```typescript
POST /api/households/:householdId/regenerate-code

Response:
{
  success: true,
  inviteCode: string // New code
}
```

#### Leave Household
```typescript
POST /api/households/:householdId/leave

Response:
{
  success: true,
  message: "Left household successfully"
}

Note: If leader leaves and other members exist,
      longest-standing member becomes new leader
```

### Error Codes

```typescript
enum HouseholdErrorCode {
  ALREADY_IN_HOUSEHOLD = 'ALREADY_IN_HOUSEHOLD',
  INVALID_INVITE_CODE = 'INVALID_INVITE_CODE',
  NOT_HOUSEHOLD_LEADER = 'NOT_HOUSEHOLD_LEADER',
  HOUSEHOLD_NOT_FOUND = 'HOUSEHOLD_NOT_FOUND',
  MEMBER_NOT_FOUND = 'MEMBER_NOT_FOUND',
  REQUEST_NOT_FOUND = 'REQUEST_NOT_FOUND',
  CANNOT_REMOVE_LEADER = 'CANNOT_REMOVE_LEADER',
  DUPLICATE_REQUEST = 'DUPLICATE_REQUEST',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}
```

## Security Model

### Row-Level Security Policies

#### `households` table
```sql
-- Anyone can view households they're a member of
CREATE POLICY "Users can view their households" ON public.households
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = id
      AND user_id = auth.uid()
      AND status = 'active'
    )
  );

-- Only authenticated users can create households
CREATE POLICY "Authenticated users can create households" ON public.households
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND leader_id = auth.uid());

-- Only leaders can update their households
CREATE POLICY "Leaders can update their households" ON public.households
  FOR UPDATE
  USING (leader_id = auth.uid());

-- Only leaders can delete their households
CREATE POLICY "Leaders can delete their households" ON public.households
  FOR DELETE
  USING (leader_id = auth.uid());
```

#### `household_members` table
```sql
-- Members can view other members in their household
CREATE POLICY "Users can view household members" ON public.household_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members AS hm
      WHERE hm.household_id = household_id
      AND hm.user_id = auth.uid()
      AND hm.status = 'active'
    )
  );

-- System can insert members (via API with leader check)
CREATE POLICY "Service role can insert members" ON public.household_members
  FOR INSERT
  WITH CHECK (true);

-- Leaders can update members (role changes, removals)
CREATE POLICY "Leaders can update members" ON public.household_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.households
      WHERE id = household_id
      AND leader_id = auth.uid()
    )
  );
```

#### `household_join_requests` table
```sql
-- Users can view requests they created
CREATE POLICY "Users can view their join requests" ON public.household_join_requests
  FOR SELECT
  USING (user_id = auth.uid());

-- Leaders can view requests to their households
CREATE POLICY "Leaders can view household requests" ON public.household_join_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.households
      WHERE id = household_id
      AND leader_id = auth.uid()
    )
  );

-- Authenticated users can create join requests
CREATE POLICY "Users can create join requests" ON public.household_join_requests
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Leaders can update requests (approve/reject)
CREATE POLICY "Leaders can update requests" ON public.household_join_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.households
      WHERE id = household_id
      AND leader_id = auth.uid()
    )
  );
```

### Invite Code Generation

```typescript
function generateInviteCode(householdName: string): string {
  // Format: PREFIX-YEAR-RANDOM
  // Example: ZEDER-2024-ALPHA

  const prefix = householdName
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 6) || 'HOUSE';

  const year = new Date().getFullYear();
  const random = generateRandomWord(5); // e.g., "ALPHA", "BRAVO"

  return `${prefix}-${year}-${random}`;
}
```

**Security**:
- Codes are stored hashed in database
- Plaintext code only shown once at creation
- Can be regenerated to invalidate old codes
- Rate limiting on join attempts (5 per hour)

## UI/UX Design

### Route Structure

```
/onboarding/household          - Post-registration household setup
/households                    - Household management (if member)
/households/create             - Create new household
/households/join               - Join with invite code
/households/:id/settings       - Household settings (leader only)
/households/:id/members        - Member management (leader only)
/households/:id/requests       - Pending join requests (leader only)
```

### Component Hierarchy

```
HouseholdOnboarding/
├── HouseholdChoiceScreen      - Create or Join choice
├── CreateHouseholdForm        - Name input + submit
├── CreateHouseholdSuccess     - Show invite code
└── JoinHouseholdForm          - Invite code input + submit

HouseholdManagement/
├── HouseholdDashboard         - Overview of household
├── MemberList                 - All household members
├── PendingRequests            - Join requests (leader only)
├── HouseholdSettings          - Settings (leader only)
└── InviteCodeDisplay          - Show/regenerate code (leader only)
```

### Mobile Considerations (Maya's Domain)

- **QR Code Scanning**: Generate QR code from invite code for easy mobile sharing
- **Touch Targets**: All buttons minimum 44x44px
- **Offline Support**: Cache household data locally
- **Push Notifications**: When join request approved/rejected
- **Deep Links**: `petforce://household/join?code=ZEDER-2024-ALPHA`

## State Management

### Zustand Store: `useHouseholdStore`

```typescript
interface HouseholdStore {
  household: Household | null;
  members: HouseholdMember[];
  pendingRequests: JoinRequest[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchHousehold: () => Promise<void>;
  createHousehold: (name: string) => Promise<void>;
  joinHousehold: (inviteCode: string) => Promise<void>;
  approveRequest: (requestId: string) => Promise<void>;
  rejectRequest: (requestId: string) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  regenerateInviteCode: () => Promise<void>;
  leaveHousehold: () => Promise<void>;
}
```

## Analytics Events (Ana's Domain)

Track these events for household adoption metrics:

```typescript
// Household Creation
trackEvent('household_created', {
  householdId: string,
  householdName: string,
  userId: string,
  timestamp: string
});

// Household Join
trackEvent('household_join_requested', {
  householdId: string,
  inviteCode: string,
  userId: string,
  timestamp: string
});

trackEvent('household_join_approved', {
  householdId: string,
  memberId: string,
  approvedBy: string,
  timestamp: string
});

trackEvent('household_join_rejected', {
  householdId: string,
  userId: string,
  rejectedBy: string,
  timestamp: string
});

// Member Management
trackEvent('household_member_removed', {
  householdId: string,
  memberId: string,
  removedBy: string,
  timestamp: string
});

trackEvent('household_invite_code_regenerated', {
  householdId: string,
  leaderId: string,
  timestamp: string
});

// Household Metrics
trackEvent('household_member_count', {
  householdId: string,
  memberCount: number,
  temporaryCount: number
});
```

## Logging Strategy (Larry's Domain)

Use structured logging with correlation IDs:

```typescript
// Household creation
logger.info('household_created', {
  correlationId: uuid(),
  userId: user.id,
  householdId: household.id,
  householdName: household.name,
  inviteCode: '[REDACTED]', // Don't log plaintext codes
  timestamp: new Date().toISOString()
});

// Join request
logger.info('household_join_request_received', {
  correlationId: uuid(),
  userId: user.id,
  householdId: household.id,
  inviteCodeUsed: '[REDACTED]',
  timestamp: new Date().toISOString()
});

// Approval
logger.info('household_join_request_approved', {
  correlationId: uuid(),
  requestId: request.id,
  householdId: household.id,
  approvedBy: leader.id,
  newMemberId: user.id,
  timestamp: new Date().toISOString()
});

// Errors
logger.error('household_join_failed', {
  correlationId: uuid(),
  userId: user.id,
  inviteCode: '[REDACTED]',
  errorCode: 'INVALID_INVITE_CODE',
  errorMessage: error.message,
  timestamp: new Date().toISOString()
});
```

## Migration Strategy

### Migration File: `002_households_system.sql`

```sql
-- Create households table
CREATE TABLE public.households (...);

-- Create household_members table
CREATE TABLE public.household_members (...);

-- Create household_join_requests table
CREATE TABLE public.household_join_requests (...);

-- Create indexes
CREATE INDEX ...;

-- Enable RLS
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_join_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY ...;
```

### Rollback Plan

```sql
-- Drop policies
DROP POLICY IF EXISTS ... ON public.households;
DROP POLICY IF EXISTS ... ON public.household_members;
DROP POLICY IF EXISTS ... ON public.household_join_requests;

-- Drop tables (CASCADE will remove all data)
DROP TABLE IF EXISTS public.household_join_requests CASCADE;
DROP TABLE IF EXISTS public.household_members CASCADE;
DROP TABLE IF EXISTS public.households CASCADE;
```

## Testing Strategy (Tucker's Domain)

### Unit Tests
- Invite code generation (uniqueness, format)
- Household creation logic
- Member role validation
- Leader promotion logic
- Join request flow

### Integration Tests
- Create household + auto-add leader as member
- Join household flow (request → approve → member)
- Remove member (except leader)
- Regenerate invite code (old code invalidated)
- Leader leaves (auto-promote)

### E2E Tests (Playwright)
- Complete onboarding: create household → see dashboard
- Complete onboarding: join household → wait for approval
- Leader workflow: approve request → see new member
- Leader workflow: remove member → member can't access
- QR code generation and scanning (mobile)

## Performance Considerations

### Database Indexes
- `idx_households_invite_code`: Fast invite code lookups
- `idx_household_members_user_id`: Fast "get user's household" queries
- `idx_household_join_requests_status`: Fast pending request queries

### Caching Strategy
- Cache household data in Zustand (client-side)
- Invalidate cache on mutations (create, join, remove)
- Server-side caching of household lookups (Redis future)

### Rate Limiting
- Join requests: 5 per hour per user
- Invite code regeneration: 10 per hour per household
- Prevents spam and abuse

## Future Enhancements (Out of Scope)

These are intentionally excluded from initial implementation:

1. **Multiple Households per User**: Phase 2 feature
2. **Custom Permissions**: Beyond leader/member (e.g., read-only)
3. **Household Avatar/Photo**: Nice-to-have
4. **Household Activity Feed**: Requires task tracking first
5. **Household Settings**: Privacy, notification preferences
6. **Sub-Groups**: (e.g., "Kids" group within household)
7. **Household Transfer**: Transfer ownership to another user
8. **Household Archiving**: Soft-delete instead of hard-delete

## Open Technical Questions

To be answered during agent research:

1. **Axel**: Should we use GraphQL subscriptions for real-time member updates?
2. **Isabel**: What's the expected household growth rate? (Affects database scaling)
3. **Buck**: Should household data go into a separate data warehouse?
4. **Samantha**: Should invite codes expire after N days?
5. **Larry**: What monitoring/alerting is needed for household operations?
6. **Chuck**: How should we deploy database migrations? (Blue-green? Rolling?)

---

**Design Status**: Ready for agent review and refinement
