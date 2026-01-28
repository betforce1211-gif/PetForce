# Ghost Users Fix - Quick Deploy Card

## 30-Second Summary

**Problem**: Users in auth.users but not in public.users (ghost users)
**Fix**: Database trigger to auto-sync + backfill script
**Risk**: LOW
**Downtime**: NONE

---

## Deploy Commands

### Local Testing
```bash
cd /Users/danielzeddr/PetForce
npx supabase start
npx supabase db reset
npx supabase db execute --file supabase/migrations/verify-trigger.sql
```

### Production Deploy
```bash
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
npx supabase db execute --file supabase/migrations/verify-trigger.sql
```

---

## Verify Success (Must Run)

```sql
-- Should return 0
SELECT COUNT(*) FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;
```

---

## If Problems

```sql
-- Rollback (stops auto-sync)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
```

---

## Files Created

- `20260127000001_create_user_sync_trigger.sql` - The trigger
- `20260127000002_backfill_ghost_users.sql` - Fixes existing
- `verify-trigger.sql` - Verification
- `DEPLOYMENT_GUIDE.md` - Full instructions
- `GHOST_USERS_FIX_SUMMARY.md` - Technical details
- `ISABEL_INFRASTRUCTURE_REPORT.md` - Complete report

---

## Support

- Database: Isabel
- Auth: Zara
- API: Thomas
- Testing: Tucker
