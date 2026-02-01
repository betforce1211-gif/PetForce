# Database Migrations

## Database-Agnostic Duplicate Email Prevention

This migration creates a `user_registrations` table that gives us full control over duplicate email detection, independent of any auth provider configuration.

### Why We Need This

**Problem**: Different auth providers (Supabase, Auth0, Firebase, etc.) handle duplicate emails differently based on configuration:
- Some create duplicate user records for unconfirmed emails
- Some silently return existing users
- Some return errors only in certain configurations

**Solution**: Maintain our own `user_registrations` table with a UNIQUE constraint on email. We check this table BEFORE calling the auth provider.

### Benefits

1. **Database-Agnostic**: Works with any auth provider
2. **Portable**: Easy to migrate to different auth systems
3. **Reliable**: Duplicate detection always works, regardless of provider config
4. **Fast**: Database unique constraint is faster than API calls
5. **Controllable**: We control the logic, not the auth provider

## Running Migrations

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `001_user_registrations_table.sql`
5. Paste and click **Run**

### Option 2: Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migration
supabase db push --include-all
```

### Option 3: Node.js Script

```bash
# From packages/auth directory
npm run migrate
```

## Migration Files

- `001_user_registrations_table.sql` - Creates user_registrations table with unique email constraint

## Table Schema

```sql
CREATE TABLE public.user_registrations (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,  -- Prevents duplicates
  auth_user_id UUID,            -- Links to auth.users
  registered_at TIMESTAMPTZ,    -- When user registered
  confirmed_at TIMESTAMPTZ,     -- When email was confirmed
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

## Row Level Security

- **SELECT**: Public (allows duplicate checking)
- **INSERT/UPDATE**: Service role only (server-side operations)

This prevents client-side tampering while allowing legitimate duplicate checks.

## Verification

After running the migration, verify it worked:

```sql
-- Check table exists
SELECT * FROM public.user_registrations LIMIT 1;

-- Test unique constraint
INSERT INTO public.user_registrations (email) VALUES ('test@example.com');
INSERT INTO public.user_registrations (email) VALUES ('test@example.com'); -- Should fail
```

## Rollback

If you need to remove the table:

```sql
DROP TABLE IF EXISTS public.user_registrations CASCADE;
```
