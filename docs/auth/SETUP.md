# Authentication Setup Guide

Developer guide for setting up and configuring the PetForce authentication system.

## Table of Contents

- [Quick Start](#quick-start)
- [Supabase Configuration](#supabase-configuration)
- [Environment Variables](#environment-variables)
- [Email Verification Setup](#email-verification-setup)
- [OAuth Configuration](#oauth-configuration)
- [Testing Setup](#testing-setup)
- [Local Development](#local-development)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Prerequisites

- Node.js 20.19.0 or higher
- npm 10.2.4 or higher
- Supabase account (free tier)

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (see below)
cd apps/web
cp .env.example .env

# 3. Run development server
npm run dev --workspace @petforce/web
```

## Supabase Configuration

### Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in details:
   - **Name**: PetForce (or your project name)
   - **Database Password**: Strong password (save it!)
   - **Region**: Select closest to your location
   - **Plan**: Free (or paid based on needs)

4. Click "Create new project"
5. Wait 2-3 minutes for project to initialize

### Enable Email Authentication

1. In your Supabase project dashboard, go to:
   **Authentication > Providers**

2. Find **Email** provider and click "Enable"

3. Configure email settings:
   ```
   ✅ Enable Email provider
   ✅ Confirm email
   ✅ Secure email change
   ✅ Double confirm email change
   ```

4. Click "Save"

### Configure Email Confirmation

Email confirmation is enabled by default in Supabase. This ensures users verify their email before logging in.

**To enable/disable email confirmation:**

1. Go to **Authentication > Policies**
2. Or edit directly in `supabase/config.toml`:

```toml
[auth.email]
enable_signup = true
enable_confirmations = true  # Set to false to disable
double_confirm_changes = true
max_frequency = "1h"
```

**Why email confirmation matters:**

- Prevents fake accounts
- Verifies user owns the email
- Improves deliverability
- Reduces spam

**For development only:**
You can temporarily disable confirmation by setting `enable_confirmations = false` in Supabase dashboard under **Authentication > Settings > Auth Providers > Email**.

### Get API Keys

1. Go to **Settings > API**

2. Copy these values:
   - **Project URL**: `https://your-project.supabase.co`
   - **anon public key**: Starts with `eyJ...` (safe for client-side use)

3. **DO NOT use service_role key** in client code (it bypasses security rules)

## Environment Variables

### Web Application

Create `apps/web/.env`:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here

# Optional: App Configuration
VITE_APP_NAME=PetForce
VITE_REDIRECT_URL=http://localhost:3000/auth/verify
```

**Important:**
- Variables MUST start with `VITE_` to be exposed to browser
- Never commit `.env` to git (already in `.gitignore`)
- Restart dev server after changing `.env`

### Mobile Application

Create `apps/mobile/.env`:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key-here

# Optional: App Configuration
EXPO_PUBLIC_APP_NAME=PetForce
```

**Important:**
- Variables MUST start with `EXPO_PUBLIC_` to be exposed
- Clear cache after changing: `npx expo start -c`

### Environment Variable Template

**Create `.env.example` files** in both `apps/web/` and `apps/mobile/`:

```env
# Supabase Configuration
# Get these from: https://supabase.com/dashboard/project/_/settings/api

VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# For mobile, replace VITE_ with EXPO_PUBLIC_
```

## Email Verification Setup

### Email Templates

Customize email templates in Supabase:

1. Go to **Authentication > Email Templates**

2. Configure these templates:

#### Confirm Signup Template

```html
<h2>Confirm your email</h2>
<p>Welcome to PetForce! Please confirm your email address to complete registration.</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
<p>If the button doesn't work, copy and paste this link:</p>
<p>{{ .ConfirmationURL }}</p>
<p>This link expires in 24 hours.</p>
```

#### Reset Password Template

```html
<h2>Reset your password</h2>
<p>Someone requested a password reset for your PetForce account.</p>
<p><a href="{{ .ConfirmationURL }}">Reset your password</a></p>
<p>If you didn't request this, you can safely ignore this email.</p>
<p>This link expires in 1 hour.</p>
```

#### Magic Link Template

```html
<h2>Your magic link</h2>
<p>Click the link below to sign in to PetForce:</p>
<p><a href="{{ .ConfirmationURL }}">Sign in</a></p>
<p>If you didn't request this, you can safely ignore this email.</p>
<p>This link expires in 1 hour.</p>
```

### Redirect URLs

Configure where users go after clicking email links.

**In Supabase Dashboard:**

1. Go to **Authentication > URL Configuration**

2. Add redirect URLs:

```
# Development
http://localhost:3000/auth/verify
http://localhost:3000/auth/reset-password

# Production
https://yourapp.com/auth/verify
https://yourapp.com/auth/reset-password
```

**In Code:**

When calling auth functions, specify redirectTo:

```typescript
// Registration
await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/verify`
  }
});

// Password reset
await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/auth/reset-password`
});
```

### Test Email Delivery

**Using MailHog (Local Testing):**

1. Install MailHog:
   ```bash
   brew install mailhog  # macOS
   # or download from https://github.com/mailhog/MailHog
   ```

2. Start MailHog:
   ```bash
   mailhog
   ```

3. Configure Supabase to use MailHog:
   - Go to **Settings > Project Settings > SMTP Settings**
   - Host: `localhost`
   - Port: `1025`
   - User: (leave empty)
   - Pass: (leave empty)

4. View emails at http://localhost:8025

**Using Real Email (Testing):**

1. Create test account with a real email you control
2. Register in your app
3. Check inbox (and spam folder!)
4. Click verification link
5. Should redirect to `/auth/verify`

## OAuth Configuration

### Google OAuth

**1. Create Google OAuth Credentials:**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Navigate to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth 2.0 Client ID**
5. Configure OAuth consent screen if prompted
6. Application type: **Web application**
7. Name: PetForce
8. Authorized redirect URIs:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```
9. Click **Create**
10. Copy **Client ID** and **Client Secret**

**2. Configure in Supabase:**

1. Go to **Authentication > Providers**
2. Find **Google** and click to expand
3. Enable Google provider
4. Paste:
   - **Client ID**: From step 1
   - **Client Secret**: From step 1
5. Click **Save**

**3. Test Google OAuth:**

```typescript
import { signInWithGoogle } from '@petforce/auth';

const result = await signInWithGoogle();

if (result.success && result.url) {
  window.location.href = result.url; // Redirect to Google
}
```

### Apple OAuth

**1. Create Apple OAuth Credentials:**

1. Go to [Apple Developer](https://developer.apple.com)
2. Navigate to **Certificates, IDs & Profiles**
3. Click **Identifiers** > **+** (Add)
4. Select **Services IDs** > Continue
5. Description: PetForce
6. Identifier: `com.yourcompany.petforce.web`
7. Enable **Sign in with Apple**
8. Configure:
   - Domains: `your-project.supabase.co`
   - Return URLs: `https://your-project.supabase.co/auth/v1/callback`
9. Save

**2. Create Key:**

1. Click **Keys** > **+** (Add)
2. Name: PetForce Sign in with Apple
3. Enable **Sign in with Apple**
4. Configure with Services ID created above
5. Download `.p8` key file (save it - only shown once!)
6. Note Key ID

**3. Configure in Supabase:**

1. Go to **Authentication > Providers**
2. Find **Apple** and click to expand
3. Enable Apple provider
4. Paste:
   - **Services ID**: From step 1
   - **Team ID**: From Apple Developer account
   - **Key ID**: From step 2
   - **Private Key**: Contents of `.p8` file
5. Click **Save**

## Testing Setup

### Install Testing Dependencies

Testing dependencies are already included in `package.json`:

```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.1.2",
    "@testing-library/react-hooks": "^8.0.1",
    "@testing-library/user-event": "^14.5.1"
  }
}
```

### Mock Supabase for Tests

Create `packages/auth/src/__tests__/setup.ts`:

```typescript
import { vi } from 'vitest';

// Mock Supabase client
export const mockSupabaseClient = {
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getUser: vi.fn(),
    refreshSession: vi.fn(),
    resend: vi.fn(),
    resetPasswordForEmail: vi.fn(),
  }
};

vi.mock('../api/supabase-client', () => ({
  getSupabaseClient: () => mockSupabaseClient,
}));
```

### Run Tests

```bash
# All tests
npm test --workspace @petforce/auth

# Watch mode
npm test --workspace @petforce/auth -- --watch

# With coverage
npm test --workspace @petforce/auth -- --coverage

# Specific test file
npm test --workspace @petforce/auth -- auth-api.test.ts
```

### Test Configuration

`packages/auth/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
      ],
    },
  },
});
```

## Local Development

### Development Workflow

1. **Start Supabase (if using local instance):**
   ```bash
   npx supabase start
   ```

2. **Start web dev server:**
   ```bash
   npm run dev --workspace @petforce/web
   ```

3. **Start mobile dev server:**
   ```bash
   npm start --workspace @petforce/mobile
   ```

### Using Local Supabase (Optional)

For fully offline development:

1. **Install Supabase CLI:**
   ```bash
   brew install supabase/tap/supabase
   ```

2. **Initialize Supabase:**
   ```bash
   npx supabase init
   ```

3. **Start local instance:**
   ```bash
   npx supabase start
   ```

4. **Get local credentials:**
   ```bash
   npx supabase status
   ```

5. **Update .env to use local instance:**
   ```env
   VITE_SUPABASE_URL=http://localhost:54321
   VITE_SUPABASE_ANON_KEY=<local-anon-key>
   ```

### Development Tips

**Hot Reload:**
- Web: Changes auto-reload
- Mobile: Shake device or press `r` to reload

**Clear Cache:**
```bash
# Web
rm -rf apps/web/.vite

# Mobile
npx expo start -c
```

**Type Checking:**
```bash
# All packages
npm run typecheck --workspaces

# Specific package
npm run typecheck --workspace @petforce/auth
```

**Linting:**
```bash
# All packages
npm run lint --workspaces

# Auto-fix
npm run lint --workspaces -- --fix
```

## Troubleshooting

### Supabase Connection Issues

**Symptom:** Can't connect to Supabase, seeing CORS errors.

**Solutions:**

1. **Verify credentials:**
   ```bash
   # Check .env file
   cat apps/web/.env

   # Should show valid URL and key
   ```

2. **Check project status:**
   - Go to Supabase dashboard
   - Verify project is not paused (free tier pauses after inactivity)
   - Click "Resume" if paused

3. **Verify URL format:**
   ```
   ✅ Correct: https://abcdefghijklmn.supabase.co
   ❌ Wrong: https://supabase.co
   ❌ Wrong: https://abcdefghijklmn.supabase.co/
   ```

4. **Check CORS configuration:**
   - Supabase allows all origins by default for `anon` key
   - If using custom domain, add to allowed origins

### Email Verification Not Working

**Symptom:** Users don't receive verification emails.

**Diagnosis:**

1. **Check email logs:**
   - Go to **Authentication > Email Rate Limits**
   - View recent emails sent
   - Check for errors

2. **Check spam folder:**
   - Verification emails often go to spam
   - Consider custom SMTP for production

3. **Verify redirect URL:**
   ```typescript
   // Should match URL in Supabase dashboard
   emailRedirectTo: `${window.location.origin}/auth/verify`
   ```

4. **Check email confirmation is enabled:**
   - **Authentication > Providers > Email**
   - "Confirm email" should be checked

**Solutions:**

1. **Use custom SMTP:**
   - Go to **Settings > SMTP Settings**
   - Configure SendGrid, Mailgun, or AWS SES
   - Improves deliverability

2. **Test with MailHog (development):**
   - See "Test Email Delivery" section above

3. **Check rate limits:**
   - Free tier: 3 emails per hour per user
   - Upgrade plan for higher limits

### Module Resolution Errors

**Symptom:** `Cannot find module '@petforce/auth'`

**Solutions:**

1. **Rebuild packages:**
   ```bash
   npm run build --workspace @petforce/auth
   ```

2. **Clear node_modules:**
   ```bash
   rm -rf node_modules package-lock.json
   rm -rf apps/*/node_modules packages/*/node_modules
   npm install
   ```

3. **Check package.json exports:**
   ```json
   {
     "name": "@petforce/auth",
     "exports": {
       ".": "./src/index.ts"
     }
   }
   ```

### Environment Variables Not Loading

**Web (Vite):**

**Problem:** Variables not available in code.

**Solutions:**

1. **Ensure VITE_ prefix:**
   ```env
   ✅ VITE_SUPABASE_URL=...
   ❌ SUPABASE_URL=...
   ```

2. **Restart dev server:**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev --workspace @petforce/web
   ```

3. **Check import.meta.env:**
   ```typescript
   // Correct
   const url = import.meta.env.VITE_SUPABASE_URL;

   // Wrong (Node.js only)
   const url = process.env.VITE_SUPABASE_URL;
   ```

**Mobile (Expo):**

**Problem:** Variables not available.

**Solutions:**

1. **Ensure EXPO_PUBLIC_ prefix:**
   ```env
   ✅ EXPO_PUBLIC_SUPABASE_URL=...
   ❌ SUPABASE_URL=...
   ```

2. **Clear cache and restart:**
   ```bash
   npx expo start -c
   ```

3. **Check Constants import:**
   ```typescript
   import Constants from 'expo-constants';

   const url = Constants.expoConfig?.extra?.supabaseUrl;
   ```

### TypeScript Errors

**Symptom:** Type errors in IDE or build.

**Solutions:**

1. **Install types:**
   ```bash
   npm install --save-dev @types/node
   ```

2. **Rebuild:**
   ```bash
   npm run build --workspace @petforce/auth
   ```

3. **Check tsconfig.json:**
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "moduleResolution": "bundler",
       "esModuleInterop": true
     }
   }
   ```

4. **Restart TS server in VSCode:**
   - Cmd/Ctrl + Shift + P
   - "TypeScript: Restart TS Server"

## Related Documentation

- [Getting Started](/docs/GETTING_STARTED.md) - General project setup
- [Architecture](/docs/auth/ARCHITECTURE.md) - System architecture
- [API Reference](/docs/API.md) - API documentation
- [Error Codes](/docs/auth/ERRORS.md) - Error reference
- [Security](/docs/auth/SECURITY.md) - Security best practices

---

**Last Updated:** January 25, 2026
**Maintained By:** Thomas (Documentation Agent)
**Version:** 1.0.0
