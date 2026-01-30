# Ghost Users Fix - Summary

## Problem

Users registering successfully in `auth.users` but NOT being created in `public.users`.

**Impact**: Users can authenticate but have no profile data, causing app failures.

## Root Cause

Missing database trigger to automatically sync `auth.users` → `public.users` on user creation.

## Solution

Created two migrations:

### Migration 1: `20260127000001_create_user_sync_trigger.sql`

Creates a PostgreSQL trigger that automatically creates a `public.users` record whenever a new user is added to `auth.users`.

**Key Components**:
- `handle_new_user()` function: Creates matching public.users record
- `on_auth_user_created` trigger: Fires on INSERT to auth.users
- `ON CONFLICT DO NOTHING`: Safety mechanism to prevent duplicate errors

### Migration 2: `20260127000002_backfill_ghost_users.sql`

Backfills existing ghost users (users in auth.users but not in public.users).

**Features**:
- Identifies and fixes all existing ghost users
- Logs operation to cleanup_audit_log
- Provides detailed console output
- Idempotent (safe to run multiple times)

## Files Created

```
/Users/danielzeddr/PetForce/supabase/migrations/
├── 20260127000001_create_user_sync_trigger.sql  # Trigger creation
├── 20260127000002_backfill_ghost_users.sql      # Backfill script
├── DEPLOYMENT_GUIDE.md                           # Full deployment instructions
├── GHOST_USERS_FIX_SUMMARY.md                   # This file
└── verify-trigger.sql                            # Verification queries
```

## Quick Deploy (Local)

```bash
cd /Users/danielzeddr/PetForce

# Start Supabase
npx supabase start

# Apply migrations
npx supabase db reset

# Verify
npx supabase db execute --file supabase/migrations/verify-trigger.sql
```

## Quick Deploy (Production)

```bash
# Link to project
npx supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
npx supabase db push

# Verify
npx supabase db execute --file supabase/migrations/verify-trigger.sql
```

## Verification (Must Run After Deploy)

```sql
-- 1. Should return 0
SELECT COUNT(*) FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- 2. Counts should match
SELECT
  (SELECT COUNT(*) FROM auth.users) as auth,
  (SELECT COUNT(*) FROM public.users) as public;

-- 3. Trigger should exist
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

## Architecture

### Before Fix
```
User Registration
       ↓
   auth.users ✅
       ↓
   public.users ❌ (not created)
       ↓
   Ghost User 👻
```

### After Fix
```
User Registration
       ↓
   auth.users ✅
       ↓ (trigger fires)
   public.users ✅ (automatically created)
       ↓
   Complete User ✅
```

## Database Schema

### auth.users (Managed by Supabase)
- id (UUID, PK)
- email
- email_confirmed_at
- created_at
- ... (other Supabase auth fields)

### public.users (Your application)
- id (UUID, PK, references auth.users)
- email
- email_verified (computed from email_confirmed_at)
- first_name, last_name, profile_photo_url
- created_at, updated_at

## Trigger Logic

```plpgsql
ON INSERT to auth.users:
  → Create public.users record with:
    - Same id (UUID)
    - Same email
    - email_verified = (email_confirmed_at IS NOT NULL)
    - timestamps = NOW()
  → If conflict: DO NOTHING (already exists)
```

## Safety Features

1. **SECURITY DEFINER**: Trigger runs with elevated permissions
2. **ON CONFLICT DO NOTHING**: Prevents duplicate key errors
3. **Idempotent backfill**: Safe to run multiple times
4. **Audit logging**: Tracks backfill execution
5. **Error handling**: Logs failures, doesn't crash

## Testing

### Test New User Creation

```bash
# 1. Register new user via your API
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "Test123!@#"}'

# 2. Verify user in both tables
psql -c "
  SELECT au.id, au.email, pu.id IS NOT NULL as has_profile
  FROM auth.users au
  LEFT JOIN public.users pu ON au.id = pu.id
  WHERE au.email = 'test@example.com';
"
```

Expected: `has_profile` = true

## Rollback

If needed:

```sql
-- Remove trigger (stops automatic sync)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Remove function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Note: Keep backfilled users (they're valid now)
```

## Monitoring

Set up alerts for:

```sql
-- Ghost user count (should always be 0)
SELECT COUNT(*) FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;
```

Add to your monitoring dashboard or scheduled checks.

## Success Criteria

- [ ] Zero ghost users
- [ ] User counts match between auth.users and public.users
- [ ] Trigger exists and is enabled
- [ ] New registrations create both records
- [ ] No errors in application logs

## Impact

- **Downtime**: None
- **Performance**: Negligible (single INSERT per registration)
- **Risk**: Low (has safety mechanisms)
- **Benefits**:
  - Fixes existing ghost users
  - Prevents future ghost users
  - Automatic sync going forward

## Related Documentation

- Tucker's Test Report: `/src/features/auth/__tests__/e2e/TUCKER_TEST_CLEANUP_REPORT.md`
- Auth Architecture: `/docs/auth/ARCHITECTURE.md`
- API Docs: `/docs/API.md`

## Next Steps

1. Review this summary and deployment guide
2. Test migrations locally
3. Schedule production deployment
4. Run verification queries
5. Monitor for 24 hours
6. Document results

## Questions?

Contact:
- **Infrastructure (Isabel)**: Database, migrations, deployment
- **Auth Flow (Zara)**: User registration flow
- **Backend (Thomas)**: API integration
- **Testing (Tucker)**: E2E test validation
