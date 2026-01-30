# Larry's Registration Logging - Quick Start

## 30-Second Overview

Tucker found registration navigation is broken. Larry created comprehensive logging to debug it in 5 minutes instead of 4 hours.

## Install & Test (5 Minutes)

```bash
cd /Users/danielzeddr/PetForce

# 1. Build logging package
cd packages/observability && npm run build && cd ../..

# 2. Backup and use instrumented form
cp apps/web/src/features/auth/components/EmailPasswordForm.tsx \
   apps/web/src/features/auth/components/EmailPasswordForm.tsx.backup
cp apps/web/src/features/auth/components/EmailPasswordForm.instrumented.tsx \
   apps/web/src/features/auth/components/EmailPasswordForm.tsx

# 3. Test
cd apps/web && npm run dev
```

Open http://localhost:3000/auth/register, check browser console for:

```
[Registration] Flow started { correlation_id: "abc-123" }
[Registration] Validation passed { ... }
[Registration] API request sent { ... }
[Registration] API response received { ... }
[Registration] Navigation decision { should_navigate: true }
[Registration] Navigate called { url: "/auth/verify-pending?email=..." }
[Registration] Navigation result { success: ??? }  ← THIS IS THE KEY
```

## What To Look For

### If Navigation Works

```javascript
[Registration] Navigation result {
  success: true,
  current_url: "/auth/verify-pending"
}
```

→ Problem is intermittent or already fixed!

### If Navigation Fails

```javascript
[Registration] Navigation result {
  success: false,
  current_url: "/auth/register"  // Still on same page
}
```

→ Navigate() was called but blocked. Check:

1. Does `/auth/verify-pending` route exist?
2. Is there a RequireAuth guard blocking it?
3. Is there a useEffect redirecting back?

## Debug Decision Tree

```
1. Check API response success
   ├─ false → Fix API/backend
   └─ true → Go to step 2

2. Check confirmation_required
   ├─ false → Enable email confirmation in Supabase
   └─ true → Go to step 3

3. Check has_navigate_function
   ├─ false → Fix Router context
   └─ true → Go to step 4

4. Check "Navigate called" appears
   ├─ no → Fix conditional logic
   └─ yes → Go to step 5

5. Check Navigation result success
   ├─ false → Fix route guard or missing route ← LIKELY ISSUE
   └─ true → It works!
```

## Files Created

```
packages/observability/src/
  └─ registration-logger.ts              (400 lines - Core logging)

apps/web/src/features/auth/components/
  └─ EmailPasswordForm.instrumented.tsx  (450 lines - Instrumented form)

docs/logging/
  ├─ REGISTRATION-FLOW-LOGGING.md        (15 pages - Event catalog)
  ├─ LARRY-IMPLEMENTATION-CHECKLIST.md   (12 pages - Step-by-step)
  ├─ NAVIGATION-DEBUG-GUIDE.md           (10 pages - Debug guide)
  ├─ LARRY-DELIVERY-SUMMARY.md           (20 pages - Complete spec)
  └─ LARRY-QUICK-START.md                (This file)
```

## Key Features

- 8 critical registration events logged
- Correlation ID tracks entire flow
- Privacy-safe email hashing
- Automatic PII sanitization
- Performance timing (<100ms button, <5s API, <10s total)
- Double-submit prevention
- Debug console logs

## Rollback

```bash
cp apps/web/src/features/auth/components/EmailPasswordForm.tsx.backup \
   apps/web/src/features/auth/components/EmailPasswordForm.tsx
```

## Next Steps

1. Test (5 min)
2. Debug navigation with logs (5 min)
3. Fix issue (30 min)
4. Deploy (varies)
5. Set up dashboards (P1)
6. Configure alerts (P1)

## Documentation

- Quick start: This file
- Implementation: `LARRY-IMPLEMENTATION-CHECKLIST.md`
- Debugging: `NAVIGATION-DEBUG-GUIDE.md`
- Complete spec: `LARRY-DELIVERY-SUMMARY.md`

## Questions?

Check the docs or ask Larry.

---

**Larry** - Logging & Observability Agent
"If it's not logged, it didn't happen."
