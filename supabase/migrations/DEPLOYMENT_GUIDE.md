# Ghost Users Fix - Deployment Guide

## Priority: P0 - CRITICAL

**Issue**: Users can register successfully in `auth.users` but are not being created in `public.users`, resulting in "ghost users" who can authenticate but have no profile data.

**Root Cause**: Missing database trigger to sync `auth.users` → `public.users`

## Migrations Created

1. **20260127000001_create_user_sync_trigger.sql** - Creates the sync trigger
2. **20260127000002_backfill_ghost_users.sql** - Backfills existing ghost users

## Pre-Deployment Checklist

- [ ] Review both migration files
- [ ] Backup production database
- [ ] Document current ghost user count
- [ ] Schedule deployment during low-traffic window

## Deployment Steps

### Local Testing (REQUIRED before production)

```bash
# Start Supabase locally
npx supabase start

# Apply migrations
npx supabase db reset

# Or apply specific migrations
npx supabase migration up

# Verify trigger exists
npx supabase db execute --file verify-trigger.sql
```

### Production Deployment

```bash
# Option 1: Via Supabase CLI (recommended)
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push

# Option 2: Via Supabase Dashboard
# 1. Go to SQL Editor
# 2. Copy contents of 20260127000001_create_user_sync_trigger.sql
# 3. Execute
# 4. Copy contents of 20260127000002_backfill_ghost_users.sql
# 5. Execute
```

## Post-Deployment Verification

### 1. Check for Remaining Ghost Users

```sql
-- Should return 0
SELECT COUNT(*) as ghost_users
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;
```

### 2. Verify User Counts Match

```sql
SELECT
  (SELECT COUNT(*) FROM auth.users) as auth_users_count,
  (SELECT COUNT(*) FROM public.users WHERE deleted_at IS NULL) as public_users_count;
```

### 3. Verify Trigger Exists

```sql
SELECT
  tgname as trigger_name,
  tgenabled as enabled,
  tgrelid::regclass as table_name
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';
```

Expected result:
```
trigger_name         | enabled | table_name
---------------------|---------|------------
on_auth_user_created | O       | auth.users
```

### 4. View Backfill Audit Log

```sql
SELECT
  job_name,
  status,
  records_affected,
  started_at,
  completed_at,
  error_message
FROM cleanup_audit_log
WHERE job_name = 'backfill_ghost_users'
ORDER BY started_at DESC;
```

### 5. Test New User Registration

```bash
# Register a new user via your app or API
# Then verify the user exists in both tables

SELECT
  au.id,
  au.email,
  au.created_at as auth_created,
  pu.id IS NOT NULL as has_profile
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'test@example.com';
```

## Rollback Plan

If issues occur after deployment:

```sql
-- 1. Drop the trigger (stops automatic sync)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Drop the function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Note: DO NOT delete the backfilled users
-- They are now valid user records
```

## Monitoring

After deployment, monitor for:

1. **Ghost User Count**: Should remain at 0
   ```sql
   -- Add to your monitoring dashboard
   SELECT COUNT(*)
   FROM auth.users au
   LEFT JOIN public.users pu ON au.id = pu.id
   WHERE pu.id IS NULL;
   ```

2. **Registration Errors**: Check application logs for registration failures

3. **Database Performance**: Monitor trigger execution time

## Expected Impact

- **Downtime**: None (migrations run online)
- **Duration**: < 1 second for trigger creation, < 5 seconds for backfill (depends on ghost user count)
- **Locking**: Brief lock on `auth.users` table during trigger creation
- **Risk Level**: Low (trigger has `ON CONFLICT DO NOTHING` safety)

## Success Criteria

- [ ] Zero ghost users remaining
- [ ] `auth.users` count matches `public.users` count
- [ ] Trigger exists and is enabled
- [ ] New user registration creates both records
- [ ] No registration errors in logs
- [ ] Backfill logged in `cleanup_audit_log`

## Emergency Contacts

- **Database Issues**: Isabel (Infrastructure)
- **Auth Issues**: Zara (Auth Flow)
- **API Issues**: Thomas (Backend)
- **Monitoring**: Larry (Logging & Observability)

## Notes

- This fix is **backwards compatible** - existing functionality is not affected
- The trigger uses `SECURITY DEFINER` to ensure it has permissions
- `ON CONFLICT DO NOTHING` prevents duplicate key errors
- Backfill is idempotent - safe to run multiple times
