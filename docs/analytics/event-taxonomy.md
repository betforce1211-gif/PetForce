# Event Taxonomy - Complete Specification

Complete reference for all analytics events tracked in PetForce.

## Event Naming Convention

**Format:** `{object}_{action}`

**Rules:**

- Lowercase with underscores
- Past tense for completed actions (`created`, `updated`, `deleted`)
- Present tense for ongoing actions (`creating`, `loading`)
- Noun + verb pattern

**Examples:**

- ✅ `household_created`
- ✅ `member_invited`
- ✅ `email_verified`
- ❌ `CreateHousehold`
- ❌ `click_button`
- ❌ `action`

---

## Event Categories

### 1. Authentication Events

#### user_registered

**When:** User completes registration form (before email verification)

**Properties:**

```typescript
{
  userId: string;              // SHA256 hashed user ID
  email: string;               // SHA256 hashed email
  registrationMethod: 'email' | 'google' | 'apple';
  emailConfirmed: boolean;     // Usually false on registration
  timestamp: Date;
  platform: 'web' | 'ios' | 'android';
  referrer?: string;           // How they found us (optional)
}
```

**Example:**

```typescript
analytics.track("user_registered", {
  userId: "a3f2b1...",
  email: "8d7f6e...",
  registrationMethod: "email",
  emailConfirmed: false,
  timestamp: new Date(),
  platform: "web",
});
```

**Usage:**

- Registration funnel analysis
- Attribution tracking
- Platform distribution

---

#### email_verified

**When:** User successfully verifies their email

**Properties:**

```typescript
{
  userId: string;
  verificationMethod: "link" | "auto_poll" | "manual";
  timeToVerify: number; // Seconds from registration
  timestamp: Date;
  platform: "web" | "ios" | "android";
}
```

**Example:**

```typescript
analytics.track("email_verified", {
  userId: "a3f2b1...",
  verificationMethod: "link",
  timeToVerify: 185, // 3 minutes, 5 seconds
  timestamp: new Date(),
  platform: "web",
});
```

**Usage:**

- Email verification funnel
- Time-to-verification analysis
- Identify verification friction

---

#### email_resent

**When:** User requests email verification to be resent

**Properties:**

```typescript
{
  userId: string;
  attemptNumber: number; // 1st resend, 2nd resend, etc.
  timeSinceRegistration: number; // Seconds
  timeSinceLastSent: number; // Seconds
  timestamp: Date;
  platform: "web" | "ios" | "android";
}
```

**Example:**

```typescript
analytics.track("email_resent", {
  userId: "a3f2b1...",
  attemptNumber: 2,
  timeSinceRegistration: 600, // 10 minutes
  timeSinceLastSent: 120, // 2 minutes (should be blocked!)
  timestamp: new Date(),
  platform: "web",
});
```

**Usage:**

- Identify email deliverability issues
- Measure verification friction
- Detect abuse (too many resends)

---

#### user_logged_in

**When:** User successfully logs in

**Properties:**

```typescript
{
  userId: string;
  loginMethod: 'email' | 'google' | 'apple';
  sessionId: string;
  timeSinceLastLogin?: number; // Seconds (for returning users)
  timestamp: Date;
  platform: 'web' | 'ios' | 'android';
}
```

**Example:**

```typescript
analytics.track("user_logged_in", {
  userId: "a3f2b1...",
  loginMethod: "email",
  sessionId: "sess_xyz123",
  timeSinceLastLogin: 86400, // 1 day
  timestamp: new Date(),
  platform: "ios",
});
```

**Usage:**

- Login frequency
- Platform preferences
- Session tracking

---

#### login_failed

**When:** User attempts to login but fails

**Properties:**

```typescript
{
  userId?: string;             // If we can identify them
  email: string;               // SHA256 hashed
  failureReason: 'wrong_password' | 'user_not_found' | 'email_not_confirmed' | 'network_error';
  attemptNumber: number;       // Consecutive failed attempts
  timestamp: Date;
  platform: 'web' | 'ios' | 'android';
}
```

**Example:**

```typescript
analytics.track("login_failed", {
  email: "8d7f6e...",
  failureReason: "email_not_confirmed",
  attemptNumber: 1,
  timestamp: new Date(),
  platform: "web",
});
```

**Usage:**

- Identify authentication friction
- Detect brute force attempts
- Measure impact of unconfirmed emails

---

#### user_logged_out

**When:** User explicitly logs out (not session expiration)

**Properties:**

```typescript
{
  userId: string;
  sessionDuration: number; // Seconds
  sessionId: string;
  timestamp: Date;
  platform: "web" | "ios" | "android";
}
```

**Example:**

```typescript
analytics.track("user_logged_out", {
  userId: "a3f2b1...",
  sessionDuration: 1800, // 30 minutes
  sessionId: "sess_xyz123",
  timestamp: new Date(),
  platform: "web",
});
```

**Usage:**

- Average session duration
- Logout patterns (time of day)

---

### 2. Household Events

#### household_created

**When:** User successfully creates a new household

**Properties:**

```typescript
{
  householdId: string;
  userId: string; // Creator
  name: string; // Household name (not PII)
  hasDescription: boolean;
  memberCount: number; // Always 1 initially
  inviteCode: string; // Generated code
  timeSinceRegistration: number; // Seconds from user registration
  timestamp: Date;
  platform: "web" | "ios" | "android";
}
```

**Example:**

```typescript
analytics.track("household_created", {
  householdId: "hh_abc123",
  userId: "a3f2b1...",
  name: "The Smith Family",
  hasDescription: true,
  memberCount: 1,
  inviteCode: "SMITH-ALPHA-BRAVO",
  timeSinceRegistration: 300, // 5 minutes
  timestamp: new Date(),
  platform: "web",
});
```

**Usage:**

- Activation funnel (registration → first household)
- Time to value metric
- Household naming patterns

---

#### household_viewed

**When:** User views household details page

**Properties:**

```typescript
{
  householdId: string;
  userId: string;
  userRole: "leader" | "member";
  memberCount: number;
  householdAge: number; // Days since creation
  timestamp: Date;
  platform: "web" | "ios" | "android";
}
```

**Example:**

```typescript
analytics.track("household_viewed", {
  householdId: "hh_abc123",
  userId: "a3f2b1...",
  userRole: "leader",
  memberCount: 3,
  householdAge: 7, // 1 week old
  timestamp: new Date(),
  platform: "ios",
});
```

**Usage:**

- Engagement by household size
- Leader vs. member behavior
- Household lifecycle analysis

---

#### household_updated

**When:** User updates household information

**Properties:**

```typescript
{
  householdId: string;
  userId: string;
  fieldsChanged: string[];     // ['name', 'description']
  userRole: 'leader' | 'member';
  timestamp: Date;
  platform: 'web' | 'ios' | 'android';
}
```

**Example:**

```typescript
analytics.track("household_updated", {
  householdId: "hh_abc123",
  userId: "a3f2b1...",
  fieldsChanged: ["name", "description"],
  userRole: "leader",
  timestamp: new Date(),
  platform: "web",
});
```

**Usage:**

- Field update frequency
- Leader activity patterns

---

#### household_deleted

**When:** User deletes a household

**Properties:**

```typescript
{
  householdId: string;
  userId: string; // Who deleted
  memberCount: number; // At deletion
  householdAge: number; // Days since creation
  hadPendingRequests: boolean;
  timestamp: Date;
  platform: "web" | "ios" | "android";
}
```

**Example:**

```typescript
analytics.track("household_deleted", {
  householdId: "hh_abc123",
  userId: "a3f2b1...",
  memberCount: 2,
  householdAge: 3, // Only 3 days old
  hadPendingRequests: true,
  timestamp: new Date(),
  platform: "web",
});
```

**Usage:**

- Churn analysis
- Identify deletion patterns
- Measure household lifespan

---

#### invite_code_regenerated

**When:** Leader regenerates household invite code

**Properties:**

```typescript
{
  householdId: string;
  userId: string;
  previousCode: string;
  newCode: string;
  reason?: 'security' | 'preference' | 'manual';
  timestamp: Date;
  platform: 'web' | 'ios' | 'android';
}
```

**Example:**

```typescript
analytics.track("invite_code_regenerated", {
  householdId: "hh_abc123",
  userId: "a3f2b1...",
  previousCode: "SMITH-ALPHA-BRAVO",
  newCode: "SMITH-DELTA-ECHO",
  reason: "security",
  timestamp: new Date(),
  platform: "web",
});
```

**Usage:**

- Security consciousness
- Code regeneration frequency

---

### 3. Member Events

#### member_invited

**When:** User initiates a member invitation

**Properties:**

```typescript
{
  householdId: string;
  inviterId: string;
  inviteMethod: "qr_code" | "share_link" | "copy_code";
  currentMemberCount: number;
  timestamp: Date;
  platform: "web" | "ios" | "android";
}
```

**Example:**

```typescript
analytics.track("member_invited", {
  householdId: "hh_abc123",
  inviterId: "a3f2b1...",
  inviteMethod: "qr_code",
  currentMemberCount: 2,
  timestamp: new Date(),
  platform: "ios",
});
```

**Usage:**

- Viral coefficient (invites per user)
- Preferred invitation method
- Growth patterns

---

#### join_request_submitted

**When:** User submits request to join household

**Properties:**

```typescript
{
  householdId: string;
  userId: string;
  inviteCode: string;
  inviteMethod: "qr_scan" | "manual_code" | "deep_link";
  currentMemberCount: number;
  timestamp: Date;
  platform: "web" | "ios" | "android";
}
```

**Example:**

```typescript
analytics.track("join_request_submitted", {
  householdId: "hh_abc123",
  userId: "b4g3c2...",
  inviteCode: "SMITH-ALPHA-BRAVO",
  inviteMethod: "qr_scan",
  currentMemberCount: 2,
  timestamp: new Date(),
  platform: "ios",
});
```

**Usage:**

- QR code effectiveness
- Invitation funnel
- Join request patterns

---

#### member_approved

**When:** Leader approves a join request

**Properties:**

```typescript
{
  householdId: string;
  approverId: string;
  newMemberId: string;
  timeToApproval: number; // Seconds from request
  newMemberCount: number;
  timestamp: Date;
  platform: "web" | "ios" | "android";
}
```

**Example:**

```typescript
analytics.track("member_approved", {
  householdId: "hh_abc123",
  approverId: "a3f2b1...",
  newMemberId: "b4g3c2...",
  timeToApproval: 120, // 2 minutes
  newMemberCount: 3,
  timestamp: new Date(),
  platform: "web",
});
```

**Usage:**

- Approval latency
- Growth rate
- Household size distribution

---

#### member_rejected

**When:** Leader rejects a join request

**Properties:**

```typescript
{
  householdId: string;
  rejectorId: string;
  rejectedUserId: string;
  timeToRejection: number; // Seconds from request
  timestamp: Date;
  platform: "web" | "ios" | "android";
}
```

**Example:**

```typescript
analytics.track("member_rejected", {
  householdId: "hh_abc123",
  rejectorId: "a3f2b1...",
  rejectedUserId: "b4g3c2...",
  timeToRejection: 60,
  timestamp: new Date(),
  platform: "web",
});
```

**Usage:**

- Rejection rate
- Identify spam/abuse

---

#### member_removed

**When:** Leader removes a member from household

**Properties:**

```typescript
{
  householdId: string;
  removerId: string;
  removedMemberId: string;
  membershipDuration: number; // Days
  remainingMemberCount: number;
  timestamp: Date;
  platform: "web" | "ios" | "android";
}
```

**Example:**

```typescript
analytics.track("member_removed", {
  householdId: "hh_abc123",
  removerId: "a3f2b1...",
  removedMemberId: "b4g3c2...",
  membershipDuration: 14, // 2 weeks
  remainingMemberCount: 2,
  timestamp: new Date(),
  platform: "web",
});
```

**Usage:**

- Member retention
- Conflict indicators
- Household health

---

#### member_left

**When:** Member voluntarily leaves household

**Properties:**

```typescript
{
  householdId: string;
  userId: string;
  membershipDuration: number; // Days
  remainingMemberCount: number;
  timestamp: Date;
  platform: "web" | "ios" | "android";
}
```

**Example:**

```typescript
analytics.track("member_left", {
  householdId: "hh_abc123",
  userId: "b4g3c2...",
  membershipDuration: 30, // 1 month
  remainingMemberCount: 1,
  timestamp: new Date(),
  platform: "web",
});
```

**Usage:**

- Voluntary churn
- Member satisfaction
- Household stability

---

### 4. QR Code Events

#### qr_code_generated

**When:** User generates a QR code for household

**Properties:**

```typescript
{
  householdId: string;
  userId: string;
  qrCodeSize: number; // Pixels
  format: "png" | "svg";
  includesLogo: boolean;
  timestamp: Date;
  platform: "web" | "ios" | "android";
}
```

**Example:**

```typescript
analytics.track("qr_code_generated", {
  householdId: "hh_abc123",
  userId: "a3f2b1...",
  qrCodeSize: 400,
  format: "png",
  includesLogo: false,
  timestamp: new Date(),
  platform: "web",
});
```

**Usage:**

- QR code feature adoption
- Format preferences
- Platform usage

---

#### qr_code_scanned

**When:** User scans a QR code (detected via deep link)

**Properties:**

```typescript
{
  householdId: string;
  scannerId?: string;          // If logged in
  inviteCode: string;
  isExistingUser: boolean;
  timestamp: Date;
  platform: 'web' | 'ios' | 'android';
}
```

**Example:**

```typescript
analytics.track("qr_code_scanned", {
  householdId: "hh_abc123",
  scannerId: "b4g3c2...",
  inviteCode: "SMITH-ALPHA-BRAVO",
  isExistingUser: true,
  timestamp: new Date(),
  platform: "ios",
});
```

**Usage:**

- QR code effectiveness
- Acquisition source
- Mobile vs web usage

---

#### qr_code_shared

**When:** User shares QR code via native sharing

**Properties:**

```typescript
{
  householdId: string;
  userId: string;
  shareMethod: "download" | "system_share" | "copy_link";
  timestamp: Date;
  platform: "web" | "ios" | "android";
}
```

**Example:**

```typescript
analytics.track("qr_code_shared", {
  householdId: "hh_abc123",
  userId: "a3f2b1...",
  shareMethod: "system_share",
  timestamp: new Date(),
  platform: "ios",
});
```

**Usage:**

- Viral mechanics
- Sharing preferences
- Platform capabilities

---

### 5. Page View Events

#### page_viewed

**When:** User navigates to a new page/screen

**Properties:**

```typescript
{
  pageName: string;            // Human-readable name
  path: string;                // URL path or screen route
  referrer?: string;           // Previous page
  userId?: string;             // If authenticated
  sessionId: string;
  loadTime?: number;           // Milliseconds (web only)
  timestamp: Date;
  platform: 'web' | 'ios' | 'android';
}
```

**Example:**

```typescript
analytics.page("Household Details", {
  pageName: "Household Details",
  path: "/households/hh_abc123",
  referrer: "/dashboard",
  userId: "a3f2b1...",
  sessionId: "sess_xyz123",
  loadTime: 234,
  timestamp: new Date(),
  platform: "web",
});
```

**Common Page Names:**

- `Registration`
- `Email Verification`
- `Login`
- `Dashboard`
- `Household List`
- `Household Details`
- `Create Household`
- `Join Household`
- `Member Management`
- `Settings`
- `Profile`

**Usage:**

- User journey mapping
- Page performance
- Drop-off analysis

---

### 6. Error Events

#### error_occurred

**When:** User encounters an error (client-side)

**Properties:**

```typescript
{
  errorType: 'validation' | 'network' | 'client' | 'unknown';
  errorCode: string;
  errorMessage: string;        // User-facing message
  page: string;
  userId?: string;
  stackTrace?: string;         // Sanitized, no PII
  timestamp: Date;
  platform: 'web' | 'ios' | 'android';
}
```

**Example:**

```typescript
analytics.track("error_occurred", {
  errorType: "validation",
  errorCode: "VALIDATION_ERROR",
  errorMessage: "Household name is required",
  page: "Create Household",
  userId: "a3f2b1...",
  timestamp: new Date(),
  platform: "web",
});
```

**Usage:**

- Error rate monitoring
- User experience issues
- Prioritize bug fixes

---

#### api_error

**When:** API request fails

**Properties:**

```typescript
{
  endpoint: string;            // e.g., '/households'
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  statusCode: number;
  errorCode: string;
  errorMessage: string;
  userId?: string;
  retryAttempt?: number;
  timestamp: Date;
  platform: 'web' | 'ios' | 'android';
}
```

**Example:**

```typescript
analytics.track("api_error", {
  endpoint: "/households",
  method: "POST",
  statusCode: 400,
  errorCode: "VALIDATION_ERROR",
  errorMessage: "Household name is required",
  userId: "a3f2b1...",
  retryAttempt: 0,
  timestamp: new Date(),
  platform: "web",
});
```

**Usage:**

- API reliability
- Error code distribution
- Retry patterns

---

## Event Volume Estimates

### Expected Daily Volumes (at 1,000 DAU)

| Event Category       | Events/Day | Events/User/Day |
| -------------------- | ---------- | --------------- |
| Page Views           | 15,000     | 15              |
| Authentication       | 2,000      | 2               |
| Household Operations | 3,000      | 3               |
| Member Operations    | 1,500      | 1.5             |
| QR Code Operations   | 500        | 0.5             |
| Errors               | 300        | 0.3             |
| **Total**            | **22,300** | **22.3**        |

### Storage Requirements

**Per Event (avg):** ~500 bytes (JSON)

**Daily Storage (1,000 DAU):** 22,300 events × 500 bytes = ~11 MB/day

**Monthly Storage:** ~330 MB/month

**Yearly Storage:** ~4 GB/year

**At 10,000 DAU:** ~40 GB/year

---

## Event Schema Versioning

### Version 1.0 (Current)

All events in this document are version 1.0.

### Adding New Properties (Non-Breaking)

When adding optional properties, increment minor version:

- v1.0 → v1.1

**Example:**

```typescript
// v1.0
analytics.track('household_created', {
  householdId: string;
  userId: string;
  name: string;
});

// v1.1 (added optional property)
analytics.track('household_created', {
  householdId: string;
  userId: string;
  name: string;
  hasDescription: boolean;  // ← New optional property
});
```

### Changing Existing Properties (Breaking)

When modifying required properties or removing properties, increment major version:

- v1.1 → v2.0

**Example:**

```typescript
// v1.1
analytics.track('household_created', {
  name: string;  // Plain text
});

// v2.0 (breaking change)
analytics.track('household_created', {
  nameHash: string;  // ← Changed to hashed
});
```

### Deprecation Process

1. Announce deprecation (3 months notice)
2. Support both old and new versions
3. Remove old version after deprecation period

---

## Privacy & PII Handling

### Automatic Hashing

These fields are automatically hashed (SHA256) before storage:

- `userId`
- `email`
- `name` (user names)
- IP addresses (anonymized)

### Never Track These

- ❌ Passwords
- ❌ Credit card numbers
- ❌ Social security numbers
- ❌ Phone numbers
- ❌ Precise geolocation (lat/long)
- ❌ Pet names (could be PII)
- ❌ Personal notes/descriptions (could contain PII)

### Safe to Track

- ✅ Household names (user-generated, public)
- ✅ Invite codes (public)
- ✅ Booleans (`hasDescription`, not the description itself)
- ✅ Counts (`memberCount`)
- ✅ Timestamps
- ✅ Platform/device type (not device ID)

---

## Testing Events

### Development Environment

Use `debug: true` to log events to console:

```typescript
const analytics = new AnalyticsClient({
  debug: process.env.NODE_ENV === 'development',
});

// Logs to console but doesn't send to server
analytics.track('household_created', { ... });
```

### Staging Environment

Events are sent to separate staging database:

```typescript
const analytics = new AnalyticsClient({
  writeKey: process.env.ANALYTICS_KEY_STAGING,
  environment: "staging",
});
```

### Validation

**Event Schema Validator:**

```typescript
import { validateEvent } from "@petforce/analytics";

const isValid = validateEvent("household_created", {
  householdId: "hh_abc123",
  userId: "a3f2b1...",
  name: "The Smith Family",
});

if (!isValid) {
  console.error("Event validation failed");
}
```

---

## Related Documentation

- [Analytics Overview](./README.md)
- [Dashboard Catalog](./dashboards.md)
- [Privacy Policy](../legal/PRIVACY.md)

---

Built with 📊 by Ana (Analytics Agent)

**Every event tells a story. Make sure you're tracking the right ones.**
