# PetForce Authentication Documentation

Welcome to the comprehensive authentication documentation for PetForce.

## Quick Links

### For Pet Parents (Users)
- **[User Guide](./USER_GUIDE.md)** - How to create your account, handle errors, get help

### For Developers
- **[Duplicate Email Detection Guide](./DUPLICATE_EMAIL_DETECTION.md)** - Complete technical guide
- **[API Reference](./API_REFERENCE.md)** - All auth APIs, error codes, examples
- **[Testing Guide](./TESTING_GUIDE.md)** - How to test authentication features
- **[Architecture Decision Record](./ADR-001-DUPLICATE-EMAIL-DETECTION.md)** - Why we built it this way

### Quick Start
- **[Configuration](#configuration)** - Set up Supabase correctly
- **[Common Tasks](#common-tasks)** - Jump to what you need
- **[Troubleshooting](#troubleshooting)** - Fix common issues

## What's Documented

### Current Features

All documentation reflects the **current production implementation** as of 2026-02-01:

- ✅ Email/password registration
- ✅ Duplicate email detection
- ✅ User-friendly error messages
- ✅ Email verification flow
- ✅ Password reset
- ✅ Sign in/sign out

### Feature: Duplicate Email Detection

When a pet parent tries to register with an email that already has an account, they see:

```
┌─────────────────────────────────────┐
│ Email Already Registered            │
│                                     │
│ This email is already associated    │
│ with an account. Would you like to  │
│ sign in instead or reset your       │
│ password?                           │
│                                     │
│ [  Sign in  ] [Reset password]      │
└─────────────────────────────────────┘
```

**Why it matters:**
- Prevents user confusion ("Why can't I create an account?")
- Reduces support burden (users self-serve)
- Guides users to correct action (sign in or reset password)
- Maintains security while providing helpful UX

## Documentation Structure

```
docs/auth/
├── README.md                              ← You are here
├── USER_GUIDE.md                          ← For pet parents
├── DUPLICATE_EMAIL_DETECTION.md           ← Technical guide
├── API_REFERENCE.md                       ← API documentation
├── TESTING_GUIDE.md                       ← Testing guide
└── ADR-001-DUPLICATE-EMAIL-DETECTION.md   ← Architecture decisions
```

## Configuration

### Supabase Setup (Required)

For duplicate email detection to work:

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your PetForce project

2. **Navigate to Authentication**
   - Click "Authentication" in sidebar
   - Click "Email" provider

3. **Required Settings**
   ```
   ✅ Enable email sign-up: ON
   ✅ Enable email confirmations: ON
   ❌ Auto-confirm emails: OFF
   ```

4. **Verify Configuration**
   ```bash
   # Test with known existing email
   curl -X POST https://your-project.supabase.co/auth/v1/signup \
     -H "apikey: YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"email":"existing@email.com","password":"test123"}'

   # Should return error (not success)
   ```

### Environment Variables

```env
# .env.local
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Common Tasks

### I Want To...

#### Add Duplicate Email Detection to a New Form

1. Import the hook and error handler:
   ```typescript
   import { useAuth } from '@petforce/auth';
   import { getAuthErrorMessage } from '@/features/auth/utils/error-messages';
   ```

2. Use in your component:
   ```typescript
   const { registerWithPassword, error } = useAuth();

   const errorConfig = getAuthErrorMessage(error, {
     onSwitchToLogin: () => navigate('/login')
   });
   ```

3. Display the error:
   ```tsx
   {errorConfig && (
     <Alert role="alert">
       <AlertTitle>{errorConfig.title}</AlertTitle>
       <AlertDescription>{errorConfig.message}</AlertDescription>
       {errorConfig.action && (
         <Button onClick={errorConfig.action.onClick}>
           {errorConfig.action.text}
         </Button>
       )}
     </Alert>
   )}
   ```

**Full example**: [API_REFERENCE.md#complete-registration-flow](./API_REFERENCE.md#complete-registration-flow)

#### Test Duplicate Email Detection

```bash
# Run E2E tests
npm run test:e2e

# Run specific duplicate email tests
npx playwright test -g "duplicate email"

# Run unit tests
npm test error-messages
```

**Full guide**: [TESTING_GUIDE.md](./TESTING_GUIDE.md)

#### Customize Error Messages

Edit `src/features/auth/utils/error-messages.ts`:

```typescript
export function getAuthErrorMessage(error, context) {
  // Add your custom logic
  if (error.message.includes('already')) {
    return {
      title: 'Your Custom Title',
      message: 'Your custom message',
      action: { /* ... */ }
    };
  }
}
```

**Full guide**: [API_REFERENCE.md#error-message-customization](./API_REFERENCE.md#error-message-customization)

#### Debug a Failing Test

```bash
# Run in debug mode
npx playwright test --debug -g "duplicate email"

# Run in headed mode (see browser)
npx playwright test --headed

# View test report
npx playwright show-report
```

**Full guide**: [TESTING_GUIDE.md#debugging-e2e-tests](./TESTING_GUIDE.md#debugging-e2e-tests)

#### Switch Auth Providers

See the migration path in:
- [ADR-001: Migration Path](./ADR-001-DUPLICATE-EMAIL-DETECTION.md#migration-path)
- [DUPLICATE_EMAIL_DETECTION.md: Future Database-Agnostic Implementation](./DUPLICATE_EMAIL_DETECTION.md#configuration)

#### Help a User Who Can't Register

**If they see "Email already registered":**
1. Guide them to click "Sign in" button
2. If they forgot password, use "Reset password"

**If they don't receive verification email:**
1. Check spam/junk folder
2. Resend verification email
3. Try different email address

**Full guide**: [USER_GUIDE.md](./USER_GUIDE.md)

## Troubleshooting

### Common Issues

| Problem | Quick Fix | Full Guide |
|---------|-----------|------------|
| No error shown for duplicate email | Check Supabase auto-confirm setting | [DUPLICATE_EMAIL_DETECTION.md#troubleshooting](./DUPLICATE_EMAIL_DETECTION.md#troubleshooting) |
| E2E tests failing | Ensure dev server is running | [TESTING_GUIDE.md#common-issues](./TESTING_GUIDE.md#common-issues) |
| Error message not user-friendly | Update error detection logic | [API_REFERENCE.md#error-handling](./API_REFERENCE.md#error-handling) |
| "Sign in" button doesn't work | Provide `onToggleMode` callback | [DUPLICATE_EMAIL_DETECTION.md#problem-sign-in-button-doesnt-work](./DUPLICATE_EMAIL_DETECTION.md#troubleshooting) |

### Quick Diagnostics

```bash
# 1. Check Supabase configuration
# Visit: https://app.supabase.com/project/_/auth/providers
# Verify: Auto-confirm is OFF

# 2. Run tests
npm run test:e2e

# 3. Test manually
# Go to: http://localhost:3000/auth
# Try: dzeder14@gmail.com (known existing email)
# Expect: Error message appears

# 4. Check logs
# Open browser DevTools → Console
# Look for: Error messages or API responses
```

## Architecture

### How It Works

```
User submits form
       ↓
registerWithPassword({ email, password })
       ↓
Supabase API: POST /auth/v1/signup
       ↓
Supabase checks: Does email exist?
       ↓
   Yes → Return error
       ↓
getAuthErrorMessage(error)
       ↓
Display user-friendly error + actions
```

### Key Design Decisions

1. **Use Supabase built-in detection** (not custom pre-flight check)
   - Why: Fast, atomic, no race conditions
   - Trade-off: Supabase-specific (acceptable short-term)

2. **Normalize errors in UI layer** (not backend)
   - Why: No backend yet, simple for now
   - Trade-off: Will need refactor when adding backend

3. **Reveal duplicate email** (security vs. UX)
   - Why: Better UX for pet parents
   - Trade-off: Email enumeration risk (mitigated with rate limiting)

**Full details**: [ADR-001](./ADR-001-DUPLICATE-EMAIL-DETECTION.md)

### Technology Stack

- **Auth Provider**: Supabase Auth
- **Frontend**: React + TypeScript
- **Testing**: Playwright (E2E) + Vitest (unit)
- **Error Handling**: Custom error normalization layer
- **UI**: Tailwind CSS + Framer Motion

## Testing

### Test Coverage

| Type | Coverage | Status |
|------|----------|--------|
| E2E Tests | 100% critical paths | ✅ Passing |
| Unit Tests | 95% code coverage | ✅ Passing |
| Integration | 0% (planned) | ⚠️ Future |
| Manual | 100% user flows | ✅ Complete |

### Quick Test Commands

```bash
# Run all tests
npm run tucker:full

# E2E only
npm run test:e2e

# Unit only
npm test

# Specific feature
npx playwright test -g "duplicate email"
```

**Full guide**: [TESTING_GUIDE.md](./TESTING_GUIDE.md)

## Team Resources

### For Different Roles

#### Product Managers (Peter)
- [USER_GUIDE.md](./USER_GUIDE.md) - Understand user experience
- [ADR-001](./ADR-001-DUPLICATE-EMAIL-DETECTION.md) - Understand design decisions and trade-offs

#### QA Engineers (Tucker)
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Complete testing guide
- [Manual Test Checklist](./TESTING_GUIDE.md#manual-test-checklist)

#### Frontend Developers
- [API_REFERENCE.md](./API_REFERENCE.md) - APIs, types, examples
- [DUPLICATE_EMAIL_DETECTION.md](./DUPLICATE_EMAIL_DETECTION.md) - Implementation guide

#### DevOps Engineers (Chuck)
- [DUPLICATE_EMAIL_DETECTION.md#configuration](./DUPLICATE_EMAIL_DETECTION.md#configuration) - Supabase setup
- [TESTING_GUIDE.md#cicd-integration](./TESTING_GUIDE.md#cicd-integration) - CI/CD config

#### Support Team
- [USER_GUIDE.md](./USER_GUIDE.md) - Help users with common issues
- [DUPLICATE_EMAIL_DETECTION.md#user-experience](./DUPLICATE_EMAIL_DETECTION.md#user-experience) - What users see

## Recent Changes

### 2026-02-01: Documentation Complete
- ✅ Created comprehensive documentation suite
- ✅ Documented current Supabase implementation
- ✅ Added user guide for pet parents
- ✅ Added testing guide for QA
- ✅ Added API reference for developers
- ✅ Added ADR for architecture decisions

### 2026-02-01: Tucker's P0 Investigation
- ✅ Identified root cause (Supabase auto-confirm)
- ✅ Documented configuration requirements
- ✅ All 26 E2E tests passing
- ✅ No code regression found

**Full report**: [TUCKER_P0_INVESTIGATION.md](../../TUCKER_P0_INVESTIGATION.md)

## Future Enhancements

### Planned

1. **Integration Tests with Real Supabase** (Q1 2026)
   - Test against actual Supabase instance
   - Verify error formats don't drift
   - Catch configuration issues early

2. **Database-Agnostic Implementation** (Q2 2026)
   - Add `user_registrations` table
   - Implement provider abstraction layer
   - Support multiple auth providers

3. **Rate Limiting Dashboard** (Q2 2026)
   - Monitor registration attempts
   - Alert on enumeration patterns
   - CAPTCHA after failed attempts

4. **Multi-Language Support** (Q3 2026)
   - Spanish error messages
   - French error messages
   - Internationalized user guide

### Under Consideration

- Pre-flight duplicate check (for database-agnostic)
- OAuth provider integration (Google, Apple)
- Two-factor authentication
- Passwordless authentication (magic links)

## Getting Help

### Internal

- **Questions about implementation**: Ask Thomas (Documentation Guardian)
- **Testing questions**: Ask Tucker (QA Guardian)
- **CI/CD questions**: Ask Chuck (DevOps)
- **Product questions**: Ask Peter (Product)

### External

- **Supabase Issues**: [Supabase Discord](https://discord.supabase.com/)
- **Playwright Issues**: [Playwright GitHub](https://github.com/microsoft/playwright/issues)
- **React Issues**: [React Community](https://react.dev/community)

## Contributing

### Updating Documentation

When you change authentication code:

1. **Update relevant docs**:
   - API changes → Update [API_REFERENCE.md](./API_REFERENCE.md)
   - Behavior changes → Update [DUPLICATE_EMAIL_DETECTION.md](./DUPLICATE_EMAIL_DETECTION.md)
   - New tests → Update [TESTING_GUIDE.md](./TESTING_GUIDE.md)
   - UX changes → Update [USER_GUIDE.md](./USER_GUIDE.md)

2. **Update "Last Updated" date** in each file

3. **Run documentation review**:
   ```bash
   thomas review docs/auth/
   ```

4. **Include in PR**:
   - Code changes
   - Test changes
   - Documentation changes

### Documentation Standards

- **Clear language** - No jargon, explain technical terms
- **Family-first tone** - Compassionate, helpful, encouraging
- **Action-oriented** - Tell readers what to do, not just what is
- **Examples** - Show code, show UI, show results
- **Complete** - Prerequisites, steps, troubleshooting

**Full guide**: See `/.thomas.yml` for Thomas's configuration

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-01 | Initial documentation suite |
| - | - | Supabase implementation documented |
| - | - | E2E and unit tests documented |
| - | - | User guide created |
| - | - | ADR written |

## License

This documentation is part of PetForce and follows the same license as the codebase.

## Acknowledgments

- **Tucker** - For comprehensive P0 investigation and test coverage
- **Development Team** - For implementing robust duplicate detection
- **Product Team** - For prioritizing user experience
- **Pet Parents** - For feedback that drives improvements

---

**Maintained By**: Thomas (Documentation Guardian)
**Last Updated**: 2026-02-01
**Status**: Living Documentation - Update as implementation changes

*"If it's not documented, it doesn't exist."* - Thomas
