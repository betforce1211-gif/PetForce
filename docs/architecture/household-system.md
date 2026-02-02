# Household System Architecture

**Version:** 1.0.0
**Last Updated:** 2026-02-02
**Audience:** Developers, System Architects

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Principles](#architecture-principles)
3. [Data Model](#data-model)
4. [Core Flows](#core-flows)
5. [Security](#security)
6. [Performance](#performance)
7. [Monitoring & Observability](#monitoring--observability)

---

## System Overview

The Household Management System is PetForce's core collaboration feature, enabling families to jointly manage pet care. It supports household creation, member invitations (via codes, QR, email), approval workflows, and member lifecycle management.

### Key Components

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend Layer                         │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────┐  │
│  │  Web (React) │  │ Mobile (RN)   │  │ Email HTML  │  │
│  └──────────────┘  └───────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    API Layer                             │
│        packages/auth/src/api/household-api.ts            │
│  - createHousehold()                                     │
│  - requestJoinHousehold()                                │
│  - respondToJoinRequest()                                │
│  - removeMember()                                        │
│  - regenerateInviteCode()                                │
│  - leaveHousehold()                                      │
│  - sendEmailInvite()                                     │
│  - generateHouseholdQRCode()                             │
│  - extendTemporaryMemberAccess()                         │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  Support Services                        │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────────┐ │
│  │  QR Codes    │ │ Notifications│ │ Email Invites   │ │
│  │  (qrcode)    │ │ (Expo/FCM)   │ │ (SendGrid/SES)  │ │
│  └──────────────┘ └──────────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│               Data Layer (Supabase/PostgreSQL)           │
│  - households                                            │
│  - household_members                                     │
│  - household_join_requests                               │
│  - Row-Level Security (RLS) policies                     │
└─────────────────────────────────────────────────────────┘
```

---

## Architecture Principles

### 1. Database-Agnostic Design
- Uses standard SQL patterns (no Supabase-specific features)
- Easy to migrate to other PostgreSQL providers
- Portable to MySQL/MariaDB with minimal changes

### 2. Atomic Operations
- Critical operations use transactions
- Rollback on failure (e.g., household creation + leader membership)
- Prevents partial state

### 3. Secure by Default
- All operations validate permissions
- Row-Level Security (RLS) enforced at database level
- XSS sanitization on all text inputs
- Rate limiting on mutations

### 4. Structured Logging
- Larry's patterns: correlation IDs, structured JSON
- Every operation logged with context
- Easy to trace requests across services

### 5. Observability-First
- Ana's analytics: track all user actions
- Funnel tracking: onboarding → create/join → active
- Error tracking: Sentry integration ready

---

## Data Model

### Entity-Relationship Diagram

See: `docs/diagrams/household-er-diagram.png`

### Tables

#### households
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Unique household ID |
| name | text | NOT NULL | Household name (2-50 chars) |
| description | text | NULL | Optional description (200 chars max) |
| invite_code | text | UNIQUE, NOT NULL | Invite code (FORMAT: PREFIX-WORD1-WORD2) |
| invite_code_expires_at | timestamptz | NOT NULL | Code expiration (30 days default) |
| leader_id | uuid | FK → users.id | Household leader user ID |
| created_at | timestamptz | DEFAULT NOW() | Creation timestamp |
| updated_at | timestamptz | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE INDEX (invite_code)
- INDEX (leader_id)

**RLS Policies:**
- Leaders can read/update their household
- Members can read their household
- No public access

#### household_members
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Unique membership ID |
| household_id | uuid | FK → households.id | Household ID |
| user_id | uuid | FK → users.id | Member user ID |
| role | text | NOT NULL | Role: 'leader' or 'member' |
| status | text | NOT NULL | Status: 'active' or 'removed' |
| is_temporary | boolean | DEFAULT FALSE | Is temporary member? |
| temporary_expires_at | timestamptz | NULL | Expiration for temporary members |
| invited_by | uuid | FK → users.id, NULL | Who invited this member |
| joined_at | timestamptz | DEFAULT NOW() | Join timestamp |

**Indexes:**
- PRIMARY KEY (id)
- INDEX (household_id, user_id) - for membership lookups
- INDEX (household_id, status) - for active member queries
- INDEX (user_id, status) - for user's household lookup

**RLS Policies:**
- Members can read members of their household
- Leaders can update members in their household
- No cross-household access

#### household_join_requests
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK | Unique request ID |
| household_id | uuid | FK → households.id | Target household |
| user_id | uuid | FK → users.id | Requesting user |
| invite_code | text | NOT NULL | Code used to request |
| status | text | NOT NULL | 'pending', 'approved', 'rejected', 'withdrawn' |
| requested_at | timestamptz | DEFAULT NOW() | Request timestamp |
| responded_at | timestamptz | NULL | Response timestamp |
| responded_by | uuid | FK → users.id, NULL | Who responded (leader) |

**Indexes:**
- PRIMARY KEY (id)
- INDEX (household_id, status) - for pending request queries
- INDEX (user_id, household_id) - for duplicate request checks

**RLS Policies:**
- Users can read their own requests
- Leaders can read requests for their household
- Leaders can update requests for their household

---

## Core Flows

### 1. Household Creation Flow

```
User → createHousehold(name, description)
  ↓
[API] Validate name format (2-50 chars, alphanumeric + spaces)
  ↓
[API] Check user not already in household
  ↓
[API] Generate unique invite code (PREFIX-WORD1-WORD2)
  ↓
[DB] BEGIN TRANSACTION
  ↓
[DB] INSERT INTO households (name, description, invite_code, leader_id)
  ↓
[DB] INSERT INTO household_members (household_id, user_id, role='leader')
  ↓
[DB] COMMIT (or ROLLBACK on error)
  ↓
[Analytics] trackHouseholdCreated(householdId, userId, metadata)
  ↓
[API] Return household data to user
```

### 2. Join Request Flow

```
User → requestJoinHousehold(inviteCode)
  ↓
[API] Normalize code (uppercase, trim spaces)
  ↓
[API] Validate code format (PREFIX-WORD1-WORD2)
  ↓
[API] Check user not already in household
  ↓
[API] Check rate limit (5 requests/hour per user)
  ↓
[DB] Find household by invite_code
  ↓
[API] Check code not expired (< 30 days old)
  ↓
[API] Check household not at capacity (< 15 members)
  ↓
[API] Check no pending request from user
  ↓
[DB] INSERT INTO household_join_requests (household_id, user_id, status='pending')
  ↓
[Notifications] sendJoinRequestNotification(leaderId, requesterName, householdName)
  ↓
[Analytics] trackJoinRequestSubmitted(householdId, userId, inviteCode)
  ↓
[API] Return requestId to user
```

### 3. Approval/Rejection Flow

```
Leader → respondToJoinRequest(requestId, action='approve'/'reject')
  ↓
[API] Fetch join request
  ↓
[API] Verify request status = 'pending'
  ↓
[API] Verify user is household leader
  ↓
[DB] UPDATE household_join_requests SET status='approved'/'rejected'
  ↓
IF approved:
  ↓
  [DB] INSERT INTO household_members (household_id, user_id, role='member')
  ↓
  [Notifications] sendApprovalNotification(userId, householdName)
  ↓
  [Analytics] trackJoinRequestApproved(householdId, requestId, leaderId)
ELSE (rejected):
  ↓
  [Notifications] sendRejectionNotification(userId, householdName)
  ↓
  [Analytics] trackJoinRequestRejected(householdId, requestId, leaderId)
  ↓
[API] Return success message
```

### 4. Member Removal Flow

```
Leader → removeMember(householdId, memberId)
  ↓
[API] Check rate limit (10 removals/hour per household)
  ↓
[API] Verify user is household leader
  ↓
[API] Verify not trying to remove self
  ↓
[API] Fetch member to remove
  ↓
[DB] UPDATE household_members SET status='removed'
  ↓
[Auth] Invalidate member's session (via admin client)
  ↓
[Notifications] sendRemovalNotification(memberId, householdName)
  ↓
[Analytics] trackMemberRemoved(householdId, memberId, leaderId)
  ↓
[API] Return success message
```

---

## Security

### XSS Prevention (Samantha's P0 Requirement)

All user inputs sanitized using DOMPurify:
- Household name
- Household description
- Email addresses

```typescript
import { sanitizeHouseholdName, sanitizeDescription, sanitizeEmail } from '../utils/security';

const sanitizedName = sanitizeHouseholdName(request.name);
const sanitizedDescription = sanitizeDescription(request.description);
```

### Rate Limiting (Samantha's P0 Requirement)

| Operation | Limit | Window | Implementation |
|-----------|-------|--------|----------------|
| Household Creation | 3 | 1 hour | `checkHouseholdCreationRateLimit(userId)` |
| Join Requests | 5 | 1 hour | `checkJoinRequestRateLimit(userId)` |
| Member Removal | 10 | 1 hour | `checkMemberRemovalRateLimit(householdId)` |
| Code Regeneration | 5 | 1 hour | `checkInviteCodeRegenerationRateLimit(householdId)` |
| Email Invites | 20 | 1 hour | `checkEmailInviteRateLimit(householdId)` |

### Distributed Locking (Samantha's P0 Requirement)

Critical operations use distributed locks to prevent race conditions:
- Invite code regeneration
- Leadership transfer (leave household)

```typescript
import { withLock } from '../utils/locks';

const lockResource = `household:regenerate_code:${householdId}`;
await withLock(lockResource, async () => {
  // Atomic code regeneration
});
```

### Session Invalidation

When members are removed, their sessions are invalidated immediately to prevent unauthorized access after removal.

---

## Performance

### Database Optimizations

1. **Indexes on frequently queried columns:**
   - `household_members(user_id, status)` - for user's household lookup
   - `household_members(household_id, status)` - for member lists
   - `household_join_requests(household_id, status)` - for pending requests

2. **Connection pooling:**
   - Supabase handles connection pooling automatically
   - Max 100 connections per database instance

3. **Query patterns:**
   - Single queries for household + members + requests (no N+1)
   - Use `select()` with specific columns (no `select *`)
   - Pagination for member lists (100 members max per page)

### Caching Strategy

1. **Client-side:**
   - React Query for API response caching (5 min stale time)
   - Zustand store for household state

2. **Server-side (future):**
   - Redis cache for frequently accessed households
   - Cache invalidation on mutations

---

## Monitoring & Observability

### Structured Logging (Larry's Patterns)

All operations logged with correlation IDs:

```typescript
const requestId = logger.generateRequestId();

logger.info('household_creation_attempt_started', {
  correlationId: requestId,
  userId,
  householdName: request.name,
  hasDescription: !!request.description,
});

// ... operation ...

logger.info('household_created', {
  correlationId: requestId,
  userId,
  householdId: household.id,
  inviteCode: '[REDACTED]',
});
```

### Analytics Events (Ana's P0 Requirement)

All user actions tracked:

```typescript
trackHouseholdCreated(householdId, userId, {
  householdNameLength: name.length,
  hasDescription: !!description,
  source: 'web',
});

trackJoinRequestSubmitted(householdId, userId, inviteCode, {
  codeEntryMethod: 'manual', // or 'qr', 'email'
  source: 'web', // or 'mobile'
});

trackJoinRequestApproved(householdId, requestId, leaderId, {
  requestAge: Date.now() - requestedAt,
  newMemberId: userId,
  source: 'web',
});
```

### Error Tracking

Integration with Sentry (ready):

```typescript
try {
  // operation
} catch (error) {
  logger.error('Unexpected error during operation', {
    correlationId: requestId,
    error: error instanceof Error ? error.message : 'Unknown error',
  });

  // Sentry.captureException(error);

  return { success: false, error: createHouseholdError(...) };
}
```

---

## Testing Strategy

### Unit Tests
- `utils/qr-codes.test.ts` - QR code generation/parsing (21 tests)
- `utils/invite-codes.test.ts` - Invite code generation/validation
- `utils/security.test.ts` - XSS sanitization

### Integration Tests
- API endpoint tests (mock Supabase client)
- Database transaction tests (rollback scenarios)

### E2E Tests (Tucker's P0 Requirement)
- `apps/web/tests/e2e/household-flows.spec.ts` - full user flows
- `apps/mobile/tests/e2e/household-mobile.spec.ts` - mobile QR scanning

### Performance Tests
- Household creation: < 500ms
- Join request: < 300ms
- Member list query: < 200ms (up to 15 members)

---

## Deployment

### Environment Variables

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx (server-side only)

# Push Notifications (future)
EXPO_PUSH_TOKEN=xxx

# Email (future)
SENDGRID_API_KEY=xxx
# or
AWS_SES_REGION=us-east-1
AWS_SES_ACCESS_KEY=xxx
AWS_SES_SECRET_KEY=xxx
```

### Database Migrations

Run migrations in order:
1. `001_create_households.sql`
2. `002_create_household_members.sql`
3. `003_create_household_join_requests.sql`
4. `004_add_rls_policies.sql`
5. `005_add_indexes.sql`

### Rollback Plan

1. Disable household feature flag (if errors spike)
2. Revert database migrations (in reverse order)
3. Restore from backup (last resort)

---

## Future Enhancements

### Phase 2 (Q2 2026)
- Multi-household support (users can join multiple households)
- Household templates (pre-configured roles/permissions)
- Bulk member invites (CSV import)
- Household-level pet profiles

### Phase 3 (Q3 2026)
- Household analytics dashboard (Peter's vision)
- Advanced permissions (custom roles beyond leader/member)
- Household activity feed (audit log for all actions)
- Household data export (GDPR compliance)

---

## Contributing

When adding new household features:

1. **Update API docs** (`docs/api/household-api.yaml`)
2. **Add analytics tracking** (Ana's requirement)
3. **Write E2E tests** (Tucker's requirement)
4. **Add structured logging** (Larry's patterns)
5. **Update user guide** (if user-facing)

---

**Questions?** Contact the Auth Team:
- Slack: #auth-team
- Email: auth-team@petforce.app
- Docs: https://petforce.app/docs/households

---

**Last Updated:** 2026-02-02 by Claude Sonnet 4.5
