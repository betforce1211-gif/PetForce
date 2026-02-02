# @petforce/auth

**Version:** 0.1.0
**License:** Private

Authentication and household management package for PetForce.

---

## Table of Contents

1. [Features](#features)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [Household Management](#household-management)
5. [API Reference](#api-reference)
6. [Testing](#testing)
7. [Contributing](#contributing)

---

## Features

### Authentication
- ✅ User registration and login
- ✅ Email verification
- ✅ Password reset
- ✅ Session management
- ✅ JWT token handling

### Household Management
- ✅ **Household Creation** - Create collaborative households for pet care
- ✅ **Invite System** - 3 methods: manual codes, QR codes, email invites
- ✅ **Member Management** - Approve/reject requests, remove members
- ✅ **Temporary Access** - Time-limited access for pet sitters
- ✅ **Leadership Transfer** - Seamless handoff when leaders leave
- ✅ **Push Notifications** - Real-time updates for all household events
- ✅ **Security** - XSS protection, rate limiting, distributed locking

---

## Installation

```bash
npm install @petforce/auth
```

**Peer Dependencies:**
```bash
npm install @supabase/supabase-js react zustand @tanstack/react-query
```

---

## Quick Start

### 1. Setup Supabase Client

```typescript
import { initializeSupabase } from '@petforce/auth';

initializeSupabase({
  url: process.env.SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY,
});
```

### 2. Use Authentication

```typescript
import { useAuthStore } from '@petforce/auth';

function LoginForm() {
  const { signIn, isLoading, error } = useAuthStore();

  const handleSubmit = async (email: string, password: string) => {
    await signIn(email, password);
  };

  return (/* your form */);
}
```

### 3. Use Household Management

```typescript
import { useHouseholdStore } from '@petforce/auth';

function CreateHousehold() {
  const { createHousehold, isLoading } = useHouseholdStore();

  const handleCreate = async () => {
    await createHousehold({
      name: 'The Smith Family',
      description: '2 dogs, 1 cat',
    });
  };

  return (/* your form */);
}
```

---

## Household Management

### Overview

Households enable families and caregivers to collaborate on pet care. Share feeding schedules, vet appointments, medications, and photos with everyone who cares for your pets.

**Key Features:**
- 👥 Up to 15 members per household
- 📱 QR codes for easy in-person invites
- ✉️ Email invites with branded templates
- 🔐 Leader controls for member management
- ⏰ Temporary access for pet sitters

### Creating a Household

```typescript
import { createHousehold } from '@petforce/auth/api/household-api';

const result = await createHousehold(
  {
    name: 'The Smith Family',
    description: '2 dogs, 1 cat', // optional
  },
  userId
);

if (result.success) {
  console.log('Household created!', result.household);
  console.log('Invite code:', result.household.inviteCode); // e.g., "SMITH-ALPHA-BRAVO"
} else {
  console.error('Error:', result.error);
}
```

### Joining a Household

```typescript
import { requestJoinHousehold } from '@petforce/auth/api/household-api';

const result = await requestJoinHousehold(
  { inviteCode: 'SMITH-ALPHA-BRAVO' },
  userId
);

if (result.success) {
  console.log('Join request submitted!', result.requestId);
  // User will receive push notification when approved
} else {
  console.error('Error:', result.error);
}
```

### Generating QR Code

```typescript
import { generateHouseholdQRCodeDataURL } from '@petforce/auth/api/household-api';

const result = await generateHouseholdQRCodeDataURL(householdId, userId);

if (result.success) {
  // Display QR code in <img> tag
  return <img src={result.qrCodeDataURL} alt="Household QR Code" />;
}
```

### Sending Email Invites

```typescript
import { sendEmailInvite } from '@petforce/auth/api/household-api';

const result = await sendEmailInvite(
  {
    householdId,
    email: 'friend@example.com',
    personalMessage: 'Join our household!', // optional
  },
  leaderId
);

if (result.success) {
  console.log('Email invite sent!');
}
```

### Managing Members

```typescript
import {
  respondToJoinRequest,
  removeMember,
  extendTemporaryMemberAccess,
} from '@petforce/auth/api/household-api';

// Approve join request
await respondToJoinRequest(
  { requestId, action: 'approve' },
  leaderId
);

// Remove member
await removeMember(
  { householdId, memberId },
  leaderId
);

// Extend temporary member access
await extendTemporaryMemberAccess(
  householdId,
  memberId,
  new Date('2026-03-01'), // new expiration
  leaderId
);
```

---

## API Reference

### Household API

All household functions return a response with `success: boolean` and either `data` or `error`.

#### Core Functions

| Function | Description | Permission |
|----------|-------------|------------|
| `createHousehold()` | Create a new household | Authenticated user |
| `getHousehold()` | Get user's current household | Authenticated user |
| `requestJoinHousehold()` | Submit join request with invite code | Authenticated user |
| `respondToJoinRequest()` | Approve/reject join request | Household leader |
| `removeMember()` | Remove a member | Household leader |
| `regenerateInviteCode()` | Generate new invite code | Household leader |
| `leaveHousehold()` | Leave household | Household member |
| `withdrawJoinRequest()` | Withdraw pending request | Request owner |
| `sendEmailInvite()` | Send email invite | Household leader |
| `generateHouseholdQRCodeDataURL()` | Generate QR code image | Household leader |
| `extendTemporaryMemberAccess()` | Extend temporary member expiration | Household leader |

#### Utility Functions

| Function | Description |
|----------|-------------|
| `generateHouseholdQRCode()` | Generate QR code from invite code |
| `parseQRCodeData()` | Parse QR code to extract invite code |
| `generateShareableQRCode()` | Convenience wrapper for web display |

See [API Documentation](./docs/api/household-api.yaml) for complete OpenAPI spec.

---

## Testing

### Run All Tests

```bash
npm test
```

### Run Specific Test Suite

```bash
npm test qr-codes.test.ts
npm test household-store.test.ts
```

### Test Coverage

```bash
npm run test:coverage
```

**Current Coverage:**
- QR Codes: 21/21 tests passing (100%)
- Invite Codes: 15/15 tests passing (100%)
- Household Store: 12/12 tests passing (100%)

---

## Documentation

### User Guides
- [Household Management User Guide](../../docs/user-guides/household-management.md)

### Architecture
- [Household System Architecture](../../docs/architecture/household-system.md)
- [ER Diagram](../../docs/diagrams/household-er-diagram.mermaid)

### API
- [Household API Spec (OpenAPI)](./docs/api/household-api.yaml)

---

## Security

### Best Practices

1. **Never log sensitive data:**
   - Invite codes are logged as `[REDACTED]`
   - User IDs are logged only in secure contexts

2. **Always sanitize inputs:**
   ```typescript
   import { sanitizeHouseholdName } from '@petforce/auth/utils/security';
   const safe = sanitizeHouseholdName(userInput);
   ```

3. **Respect rate limits:**
   - All mutation APIs have rate limiting
   - Handle `RATE_LIMIT_EXCEEDED` errors gracefully

4. **Use distributed locks for critical operations:**
   ```typescript
   import { withLock } from '@petforce/auth/utils/locks';
   await withLock('resource:id', async () => {
     // critical operation
   });
   ```

---

## Contributing

### Development Setup

```bash
# Install dependencies
npm install

# Run tests in watch mode
npm test -- --watch

# Type checking
npm run type-check

# Linting
npm run lint
```

### Before Submitting PR

1. ✅ All tests passing (`npm test`)
2. ✅ Type checking clean (`npm run type-check`)
3. ✅ Linting clean (`npm run lint`)
4. ✅ Updated documentation (if user-facing)
5. ✅ Added analytics tracking (if user action)
6. ✅ Added E2E tests (if new flow)

---

## Changelog

### 0.1.0 (2026-02-02)

**Features:**
- ✅ Household creation and management
- ✅ QR code generation and scanning
- ✅ Push notifications for household events
- ✅ Email invites with branded templates
- ✅ Temporary member access
- ✅ Comprehensive test suite

**Security:**
- ✅ XSS sanitization on all text inputs
- ✅ Rate limiting on all mutations
- ✅ Distributed locking for critical operations
- ✅ Session invalidation on member removal

---

## License

Private - © 2026 PetForce

---

## Support

**Questions?**
- 📧 Email: auth-team@petforce.app
- 💬 Slack: #auth-team
- 📚 Docs: https://petforce.app/docs/auth

**Report a bug:**
- GitHub Issues: https://github.com/petforce/petforce/issues
- Include: reproduction steps, error messages, screenshots
