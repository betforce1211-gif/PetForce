# Business Event Logging

Complete guide to logging business events in PetForce for analytics, monitoring, and product insights.

---

## What are Business Events?

Business events are significant actions or state changes that matter to the business:

- User signs up
- Household created
- Member joins household
- Invite code regenerated
- Leadership transferred

**Why Log Business Events?**

- Product analytics
- User behavior tracking
- Conversion funnels
- Feature adoption
- Customer success metrics
- Debugging user issues

---

## Event Schema Standard

All business events MUST follow this schema:

```typescript
interface BusinessEvent {
  // Event identification
  event: string; // Event name (namespace.action)
  eventVersion: string; // Schema version

  // Context
  timestamp: string; // ISO 8601
  correlationId?: string; // Request tracing
  userId: string; // User performing action
  sessionId?: string; // User session

  // Event-specific data
  metadata: {
    [key: string]: any; // Event-specific fields
  };

  // Performance
  duration_ms?: number; // Operation duration

  // Result
  status: "success" | "failure";
  errorCode?: string; // If status is failure
}
```

---

## Household Events

### household.created

**When**: User successfully creates a new household

**Schema**:

```typescript
{
  event: 'household.created',
  eventVersion: '1.0.0',
  timestamp: '2026-02-02T10:30:00Z',
  correlationId: 'req-abc123',
  userId: 'user-456',
  status: 'success',
  duration_ms: 150,
  metadata: {
    householdId: 'household-789',
    householdName: '[REDACTED]',
    memberCount: 1,
    hasInviteCode: true,
    source: 'web' | 'mobile',
  }
}
```

**Implementation**:

```typescript
logger.info("Household created", {
  event: "household.created",
  eventVersion: "1.0.0",
  userId: user.id,
  status: "success",
  duration_ms: Date.now() - startTime,
  metadata: {
    householdId: household.id,
    householdName: "[REDACTED]",
    memberCount: 1,
    hasInviteCode: !!household.inviteCode,
    source: req.headers["user-agent"]?.includes("Mobile") ? "mobile" : "web",
  },
});
```

### household.join_requested

**When**: User submits request to join household via invite code

**Schema**:

```typescript
{
  event: 'household.join_requested',
  eventVersion: '1.0.0',
  timestamp: '2026-02-02T10:31:00Z',
  correlationId: 'req-def456',
  userId: 'user-111',
  status: 'success',
  duration_ms: 100,
  metadata: {
    householdId: 'household-789',
    inviteCode: '[REDACTED]',
    requiresApproval: true,
    source: 'mobile',
    scannedQR: true, // If joined via QR code
  }
}
```

### household.join_approved

**When**: Household leader approves a join request

**Schema**:

```typescript
{
  event: 'household.join_approved',
  eventVersion: '1.0.0',
  timestamp: '2026-02-02T10:35:00Z',
  correlationId: 'req-ghi789',
  userId: 'user-456', // Leader who approved
  status: 'success',
  duration_ms: 80,
  metadata: {
    householdId: 'household-789',
    requestId: 'request-222',
    newMemberId: 'user-111',
    newMemberCount: 2,
    approvalDuration_seconds: 240, // Time from request to approval
  }
}
```

### household.join_rejected

**When**: Household leader rejects a join request

**Schema**:

```typescript
{
  event: 'household.join_rejected',
  eventVersion: '1.0.0',
  timestamp: '2026-02-02T10:32:00Z',
  correlationId: 'req-jkl012',
  userId: 'user-456', // Leader who rejected
  status: 'success',
  duration_ms: 60,
  metadata: {
    householdId: 'household-789',
    requestId: 'request-333',
    rejectedUserId: 'user-222',
    reason: 'unknown_user', // Optional rejection reason
  }
}
```

### household.member_removed

**When**: Leader removes a member from household

**Schema**:

```typescript
{
  event: 'household.member_removed',
  eventVersion: '1.0.0',
  timestamp: '2026-02-02T10:40:00Z',
  correlationId: 'req-mno345',
  userId: 'user-456', // Leader who removed
  status: 'success',
  duration_ms: 90,
  metadata: {
    householdId: 'household-789',
    removedUserId: 'user-111',
    removedUserRole: 'member',
    newMemberCount: 1,
    reason: 'leader_action',
  }
}
```

### household.invite_code_regenerated

**When**: Leader regenerates household invite code

**Schema**:

```typescript
{
  event: 'household.invite_code_regenerated',
  eventVersion: '1.0.0',
  timestamp: '2026-02-02T10:45:00Z',
  correlationId: 'req-pqr678',
  userId: 'user-456',
  status: 'success',
  duration_ms: 120,
  metadata: {
    householdId: 'household-789',
    oldInviteCode: '[REDACTED]',
    newInviteCode: '[REDACTED]',
    expiresIn_days: 30,
    reason: 'security_concern' | 'expired' | 'manual',
  }
}
```

### household.leadership_transferred

**When**: Current leader transfers leadership to another member

**Schema**:

```typescript
{
  event: 'household.leadership_transferred',
  eventVersion: '1.0.0',
  timestamp: '2026-02-02T10:50:00Z',
  correlationId: 'req-stu901',
  userId: 'user-456', // Old leader
  status: 'success',
  duration_ms: 110,
  metadata: {
    householdId: 'household-789',
    oldLeaderId: 'user-456',
    newLeaderId: 'user-111',
    transferReason: 'voluntary' | 'leaving',
  }
}
```

---

## Authentication Events

### auth.signup_started

**When**: User begins sign-up process

**Schema**:

```typescript
{
  event: 'auth.signup_started',
  eventVersion: '1.0.0',
  timestamp: '2026-02-02T10:00:00Z',
  correlationId: 'req-vwx234',
  userId: 'anonymous-session-id',
  status: 'success',
  metadata: {
    signupMethod: 'email' | 'google' | 'apple',
    source: 'web' | 'mobile',
    referrer: req.headers.referer,
  }
}
```

### auth.signup_completed

**When**: User successfully completes sign-up

**Schema**:

```typescript
{
  event: 'auth.signup_completed',
  eventVersion: '1.0.0',
  timestamp: '2026-02-02T10:02:00Z',
  correlationId: 'req-vwx234',
  userId: 'user-789',
  status: 'success',
  duration_ms: 2000,
  metadata: {
    signupMethod: 'email',
    emailConfirmed: false,
    timeToComplete_seconds: 120,
    source: 'web',
  }
}
```

### auth.email_verification_sent

**When**: Email verification sent to user

**Schema**:

```typescript
{
  event: 'auth.email_verification_sent',
  eventVersion: '1.0.0',
  timestamp: '2026-02-02T10:02:05Z',
  correlationId: 'req-vwx234',
  userId: 'user-789',
  status: 'success',
  duration_ms: 50,
  metadata: {
    emailProvider: 'supabase',
    expiresIn_hours: 24,
  }
}
```

### auth.email_verified

**When**: User confirms their email address

**Schema**:

```typescript
{
  event: 'auth.email_verified',
  eventVersion: '1.0.0',
  timestamp: '2026-02-02T10:15:00Z',
  correlationId: 'req-yza567',
  userId: 'user-789',
  status: 'success',
  duration_ms: 30,
  metadata: {
    timeToVerify_minutes: 13,
    verificationAttempts: 1,
  }
}
```

### auth.login_succeeded

**When**: User successfully logs in

**Schema**:

```typescript
{
  event: 'auth.login_succeeded',
  eventVersion: '1.0.0',
  timestamp: '2026-02-02T11:00:00Z',
  correlationId: 'req-bcd890',
  userId: 'user-789',
  status: 'success',
  duration_ms: 150,
  metadata: {
    loginMethod: 'email' | 'google' | 'apple',
    mfaEnabled: false,
    daysSinceLastLogin: 1,
    source: 'mobile',
  }
}
```

### auth.login_failed

**When**: Login attempt fails

**Schema**:

```typescript
{
  event: 'auth.login_failed',
  eventVersion: '1.0.0',
  timestamp: '2026-02-02T11:05:00Z',
  correlationId: 'req-efg123',
  userId: 'unknown',
  status: 'failure',
  errorCode: 'INVALID_CREDENTIALS',
  metadata: {
    loginMethod: 'email',
    attemptNumber: 3,
    accountLocked: false,
    reason: 'invalid_credentials' | 'email_not_verified' | 'account_suspended',
  }
}
```

---

## Event Implementation Helpers

### Event Logger Function

```typescript
// utils/event-logger.ts

interface LogEventOptions {
  event: string;
  userId: string;
  status: "success" | "failure";
  duration_ms?: number;
  errorCode?: string;
  metadata?: Record<string, any>;
}

export function logBusinessEvent(
  options: LogEventOptions,
  logger: Logger = contextAwareLogger,
): void {
  const {
    event,
    userId,
    status,
    duration_ms,
    errorCode,
    metadata = {},
  } = options;

  // Get event version from registry
  const eventVersion = EVENT_VERSION_REGISTRY[event] || "1.0.0";

  logger.info(`Business event: ${event}`, {
    event,
    eventVersion,
    userId,
    status,
    duration_ms,
    errorCode,
    metadata: sanitizeForLogging(metadata),
  });
}
```

### Event Version Registry

```typescript
// Event schema versions
export const EVENT_VERSION_REGISTRY: Record<string, string> = {
  "household.created": "1.0.0",
  "household.join_requested": "1.0.0",
  "household.join_approved": "1.0.0",
  "household.join_rejected": "1.0.0",
  "household.member_removed": "1.0.0",
  "household.invite_code_regenerated": "1.0.0",
  "household.leadership_transferred": "1.0.0",
  "auth.signup_started": "1.0.0",
  "auth.signup_completed": "1.0.0",
  "auth.email_verification_sent": "1.0.0",
  "auth.email_verified": "1.0.0",
  "auth.login_succeeded": "1.0.0",
  "auth.login_failed": "1.0.0",
};
```

### Usage in Application Code

```typescript
// api/households/create.ts
export async function createHousehold(
  input: CreateHouseholdInput,
  userId: string,
): Promise<Household> {
  const startTime = Date.now();

  try {
    const household = await db.households.insert({
      ...input,
      leaderId: userId,
    });

    // Log business event
    logBusinessEvent({
      event: "household.created",
      userId,
      status: "success",
      duration_ms: Date.now() - startTime,
      metadata: {
        householdId: household.id,
        householdName: "[REDACTED]",
        memberCount: 1,
        hasInviteCode: !!household.inviteCode,
        source: "web",
      },
    });

    return household;
  } catch (error) {
    // Log failure event
    logBusinessEvent({
      event: "household.created",
      userId,
      status: "failure",
      duration_ms: Date.now() - startTime,
      errorCode: error.code,
      metadata: {
        errorMessage: error.message,
      },
    });

    throw error;
  }
}
```

---

## Event Analytics

### Funnel Analysis

Track user journey through multi-step flows:

```typescript
// Sign-up funnel
1. auth.signup_started       (100% - baseline)
2. auth.signup_completed      (85% - 15% drop-off)
3. auth.email_verification_sent (85% - automatic)
4. auth.email_verified        (70% - 15% don't verify)
5. household.created          (50% - 20% don't create)

// Join household funnel
1. household.join_requested   (100% - baseline)
2. household.join_approved    (80% - 20% rejected/ignored)
```

**Query**:

```sql
-- DataDog or CloudWatch Insights
SELECT
  COUNT(CASE WHEN event = 'auth.signup_started' THEN 1 END) as started,
  COUNT(CASE WHEN event = 'auth.signup_completed' THEN 1 END) as completed,
  COUNT(CASE WHEN event = 'auth.email_verified' THEN 1 END) as verified,
  COUNT(CASE WHEN event = 'household.created' THEN 1 END) as household_created
FROM logs
WHERE timestamp >= NOW() - INTERVAL 7 DAY
```

### Conversion Rates

```typescript
// Time to first household creation
SELECT
  userId,
  MIN(CASE WHEN event = 'auth.signup_completed' THEN timestamp END) as signup_time,
  MIN(CASE WHEN event = 'household.created' THEN timestamp END) as first_household_time,
  EXTRACT(EPOCH FROM (first_household_time - signup_time)) as time_to_convert_seconds
FROM logs
WHERE event IN ('auth.signup_completed', 'household.created')
GROUP BY userId
HAVING first_household_time IS NOT NULL
```

### Feature Adoption

```typescript
// QR code usage rate
SELECT
  COUNT(CASE WHEN metadata.scannedQR = true THEN 1 END) * 100.0 / COUNT(*) as qr_adoption_percent
FROM logs
WHERE event = 'household.join_requested'
  AND timestamp >= NOW() - INTERVAL 30 DAY
```

---

## Event-Driven Alerts

### Critical Business Metrics

```yaml
# DataDog Monitor
- name: "Low Household Creation Rate"
  query: "sum:household.created.count{status:success}.as_count() < 10"
  timeframe: "last_1h"
  message: |
    Household creation rate below threshold.
    Expected: 10+ per hour
    Actual: {{value}}

    Check for:
    - API errors
    - UI/UX issues
    - External service problems

    @slack-product-team

- name: "High Join Request Rejection Rate"
  query: "(sum:household.join_rejected.count / sum:household.join_requested.count) * 100 > 50"
  timeframe: "last_1h"
  message: |
    High join request rejection rate: {{value}}%

    Possible causes:
    - Spam/abuse
    - Confusing UX
    - Invalid invite codes

    @slack-product-team
```

### Real-Time Product Insights

```typescript
// Email verification conversion alert
SELECT
  COUNT(CASE WHEN event = 'auth.email_verified' THEN 1 END) * 100.0 /
  COUNT(CASE WHEN event = 'auth.email_verification_sent' THEN 1 END) as verification_rate
FROM logs
WHERE timestamp >= NOW() - INTERVAL 1 HOUR
HAVING verification_rate < 60 -- Alert if below 60%
```

---

## Event Schema Evolution

When updating event schemas:

### Version Bump

```typescript
// Old version (1.0.0)
{
  event: 'household.created',
  eventVersion: '1.0.0',
  metadata: {
    householdId: string,
    memberCount: number,
  }
}

// New version (1.1.0) - Added field
{
  event: 'household.created',
  eventVersion: '1.1.0',
  metadata: {
    householdId: string,
    memberCount: number,
    hasInviteCode: boolean, // NEW FIELD
  }
}

// Breaking change (2.0.0) - Renamed field
{
  event: 'household.created',
  eventVersion: '2.0.0',
  metadata: {
    householdId: string,
    initialMemberCount: number, // RENAMED from memberCount
    hasInviteCode: boolean,
  }
}
```

### Migration Strategy

1. **Non-breaking changes** (add fields): Minor version bump
2. **Breaking changes** (rename/remove fields): Major version bump
3. **Support both versions** during transition period
4. **Deprecate old version** after 90 days
5. **Remove old version** after 180 days

---

## Testing Business Events

```typescript
// tests/business-events.test.ts
describe("Business Event Logging", () => {
  let eventSpy: jest.SpyInstance;

  beforeEach(() => {
    eventSpy = jest.spyOn(logger, "info");
  });

  it("should log household.created event", async () => {
    await createHousehold(input, userId);

    expect(eventSpy).toHaveBeenCalledWith(
      expect.stringContaining("Business event: household.created"),
      expect.objectContaining({
        event: "household.created",
        eventVersion: "1.0.0",
        userId,
        status: "success",
        duration_ms: expect.any(Number),
        metadata: expect.objectContaining({
          householdId: expect.any(String),
          memberCount: 1,
        }),
      }),
    );
  });

  it("should include all required fields", async () => {
    await createHousehold(input, userId);

    const call = eventSpy.mock.calls[0][1];
    expect(call).toHaveProperty("event");
    expect(call).toHaveProperty("eventVersion");
    expect(call).toHaveProperty("userId");
    expect(call).toHaveProperty("status");
    expect(call).toHaveProperty("metadata");
  });
});
```

---

## Best Practices

### DO ✅

- Log all significant business events
- Use consistent event naming (`namespace.action`)
- Include event version for schema evolution
- Redact PII in metadata
- Include duration for operations
- Log both success and failure
- Use typed event interfaces
- Test event logging in unit tests
- Document event schemas
- Set up analytics dashboards

### DON'T ❌

- Log high-frequency events without sampling
- Include PII in event names
- Change event schemas without version bump
- Log events synchronously (use async)
- Duplicate events across logs and analytics
- Forget to log failure cases
- Use inconsistent naming
- Skip event documentation
- Log sensitive data in metadata

---

## Event Catalog

Complete list of all business events:

| Event                               | When                    | Key Metrics                            |
| ----------------------------------- | ----------------------- | -------------------------------------- |
| `household.created`                 | Household created       | Creation rate, time to first household |
| `household.join_requested`          | Join request submitted  | Request rate, QR scan rate             |
| `household.join_approved`           | Join request approved   | Approval rate, approval time           |
| `household.join_rejected`           | Join request rejected   | Rejection rate, rejection reasons      |
| `household.member_removed`          | Member removed          | Removal rate, churn                    |
| `household.invite_code_regenerated` | Invite code regenerated | Regeneration rate, reasons             |
| `household.leadership_transferred`  | Leadership transferred  | Transfer rate, reasons                 |
| `auth.signup_started`               | Sign-up initiated       | Sign-up start rate                     |
| `auth.signup_completed`             | Sign-up finished        | Sign-up completion rate                |
| `auth.email_verification_sent`      | Verification email sent | Email sent rate                        |
| `auth.email_verified`               | Email verified          | Verification rate, time to verify      |
| `auth.login_succeeded`              | Login successful        | Login rate, return user rate           |
| `auth.login_failed`                 | Login failed            | Login failure rate, failure reasons    |

---

## Related Documentation

- [Structured Logging Guide](./structured-logging.md)
- [Log Analysis](./log-analysis.md)
- [DataDog Integration](./datadog.md)
- [Alerting Best Practices](./alerting.md)

---

Built with ❤️ by Larry (Logging & Observability Agent)

**Product Analytics Through Logging**: Every log is a data point. Every event tells a story.
