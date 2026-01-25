# Migrating to New Supabase Keys

## Overview

Supabase is deprecating legacy `anon` and `service_role` keys in favor of new **publishable keys** (`sb_publishable_...`) and **secret keys** (`sb_secret_...`). This guide explains how to migrate your project.

## Why Migrate?

**Deadline**: Late 2026 (Supabase will remove legacy keys)

**Benefits of New Keys**:
- Instant revocation capability
- Zero-downtime rotation
- Better browser security (built-in detection)
- Configurable expiration
- Resource-specific scoping

## Key Differences

| Aspect | Legacy Keys | New Keys |
|--------|-------------|----------|
| **Format** | JWT (eyJh...) | Prefixed (sb_publishable_, sb_secret_) |
| **Client Key** | `SUPABASE_ANON_KEY` | `SUPABASE_PUBLISHABLE_KEY` |
| **Server Key** | `SUPABASE_SERVICE_ROLE_KEY` | `SUPABASE_SECRET_KEY` |
| **Revocation** | Requires project rebuild | Instant |
| **Rotation** | Downtime required | Zero-downtime |
| **Security** | Manual validation | Built-in browser prevention |

## Migration Steps

### Step 1: Generate New Keys

#### For Local Development

```bash
# Start Supabase locally
supabase start
```

Look for these keys in the output:
```
publishable_key: sb_publishable_...  ← Use this
secret_key: sb_secret_...            ← Use this (server-side only)
anon key: eyJh...                    ← Legacy (keep for now)
service_role key: eyJh...            ← Legacy (keep for now)
```

#### For Production (Supabase Cloud)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Settings → API**
4. Find **Project API Keys** section:
   - **Publishable Key** (sb_publishable_...) - Use in client-side code
   - **Secret Key** (sb_secret_...) - Use in server-side code only

### Step 2: Update Environment Variables

#### Root `.env` (Server-Side)

```bash
# Add new keys
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...

# Keep legacy keys during transition (optional)
SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_ROLE_KEY=eyJh...
```

#### `apps/web/.env` (Client-Side)

```bash
# Add new publishable key
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

# Keep legacy anon key during transition (optional)
VITE_SUPABASE_ANON_KEY=eyJh...
```

**IMPORTANT**: Never put `SUPABASE_SECRET_KEY` in client-side environment variables!

### Step 3: Test the Migration

#### Test with New Keys

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open browser console - you should see NO deprecation warnings

3. Test authentication:
   - Register a new account
   - Log in
   - Log out
   - Access protected routes

#### Test Backward Compatibility

1. Comment out the new keys temporarily:
   ```bash
   # VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   VITE_SUPABASE_ANON_KEY=eyJh...
   ```

2. Restart dev server

3. Check browser console - you should see:
   ```
   [DEPRECATED] Using legacy SUPABASE_ANON_KEY.
   Please migrate to SUPABASE_PUBLISHABLE_KEY.
   Legacy keys will be removed by Supabase in late 2026.
   ```

4. Verify app still works with legacy key

### Step 4: Update All Environments

Apply the same changes to:
- [x] Local development
- [ ] Staging environment
- [ ] Production environment

### Step 5: Remove Legacy Keys (Optional)

Once you've verified new keys work in all environments:

1. Remove legacy key variables:
   ```bash
   # Delete these lines (or keep commented for reference)
   # SUPABASE_ANON_KEY=...
   # SUPABASE_SERVICE_ROLE_KEY=...
   ```

2. Test again to ensure no errors

3. Commit changes

## Troubleshooting

### Error: "No valid Supabase key found"

**Cause**: Neither new nor legacy keys are provided

**Solution**: Add `VITE_SUPABASE_PUBLISHABLE_KEY` to your `.env` file

### Warning: "Using legacy SUPABASE_ANON_KEY"

**This is expected** if you're still using legacy keys. To remove the warning:
- Add `VITE_SUPABASE_PUBLISHABLE_KEY` to your environment
- Restart your dev server

### Error: "CRITICAL SECURITY ERROR: Cannot use secret key in browser"

**Cause**: Attempting to use `SUPABASE_SECRET_KEY` in client-side code

**Solution**:
- Use `SUPABASE_PUBLISHABLE_KEY` for client-side
- Only use `SUPABASE_SECRET_KEY` in server-side code (Node.js, Edge Functions)
- Remove `VITE_` prefix from secret key variable name

### Keys Don't Work in Production

**Checklist**:
- [ ] Generated keys from correct Supabase project
- [ ] Updated environment variables in hosting platform
- [ ] Deployed new code that uses new keys
- [ ] Verified keys are not commented out in `.env`

## Code Changes

### Before (Legacy Keys)

```typescript
// apps/web/src/App.tsx
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (supabaseUrl && supabaseAnonKey) {
  createSupabaseClient(supabaseUrl, supabaseAnonKey);
}
```

### After (New Keys with Backward Compatibility)

```typescript
// apps/web/src/App.tsx
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const legacyAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (supabaseUrl && (publishableKey || legacyAnonKey)) {
  createSupabaseClient(supabaseUrl, publishableKey, legacyAnonKey);
}
```

## Server-Side Usage (Database Management)

For server-side operations that bypass Row Level Security:

```typescript
import { createSupabaseAdminClient } from '@petforce/auth';

// Use secret key (never in browser!)
const supabase = createSupabaseAdminClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Optional fallback
);
```

## Timeline

- **Now - Late 2026**: Both key systems supported
- **Late 2026**: Supabase removes legacy keys
- **Recommendation**: Migrate as soon as possible to avoid forced migration

## Need Help?

- Check `GETTING-STARTED.md` for setup instructions
- Review `README.md` for project overview
- Check browser console for deprecation warnings
- Verify keys in Supabase Dashboard → Settings → API

---

**Migration Status**: This migration is backward compatible - legacy keys continue to work until late 2026.
