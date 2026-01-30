# Mock Infrastructure Fix - Technical Documentation

## Problem Statement

E2E tests were timing out because Playwright mocks never intercepted API calls. The root cause was an environment variable configuration mismatch between the test runner and the development server.

## Root Cause Analysis

### The Disconnect

**Two separate processes** with different environment configurations:

1. **Playwright Test Runner** (Node.js process)
   - Loaded `.env.test` via `dotenv.config()`
   - Knew about mock URL: `https://test.supabase.co`
   - Configured route interceptors to match this URL

2. **Vite Dev Server** (Separate Node.js process)
   - Loaded `.env` (production environment)
   - Served real Supabase URL to browser: `https://[project].supabase.co`
   - Browser JavaScript had real URL hardcoded at build time

### The Failure Chain

```
1. Browser loads page from Vite dev server
   ↓
2. JavaScript bundle contains: VITE_SUPABASE_URL = 'https://real-project.supabase.co'
   ↓
3. User submits signup form
   ↓
4. Supabase client makes request to: https://real-project.supabase.co/auth/v1/signup
   ↓
5. Playwright mock is listening for: https://test.supabase.co/auth/v1/signup
   ↓
6. MISMATCH - Mock doesn't intercept
   ↓
7. Request goes to real API
   ↓
8. Real API times out or rate limits
   ↓
9. Test fails with timeout error
```

## Solution Architecture

### Implementation

Modified `playwright.config.ts` to inject test environment variables into the Vite dev server process:

```typescript
// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, ".env.test") });

// ...

if (!process.env.CI) {
  config.webServer = {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120000,
    // CRITICAL FIX: Inject test env vars into Vite
    env: {
      VITE_SUPABASE_URL:
        process.env.VITE_SUPABASE_URL || "https://test.supabase.co",
      VITE_SUPABASE_ANON_KEY:
        process.env.VITE_SUPABASE_ANON_KEY || "mock-anon-key-for-testing-only",
      NODE_ENV: "test",
    },
  };
}
```

### How It Works

**Before Fix**:

```
┌─────────────────────┐
│ Playwright Runner   │
│ .env.test loaded    │
│ VITE_SUPABASE_URL=  │
│ test.supabase.co    │
└──────────┬──────────┘
           │ spawns
           ↓
┌─────────────────────┐       ┌─────────────────────┐
│ Vite Dev Server     │       │ Browser             │
│ .env loaded         │──────→│ JavaScript has:     │
│ VITE_SUPABASE_URL=  │       │ real.supabase.co    │
│ real.supabase.co    │       └──────────┬──────────┘
└─────────────────────┘                  │
                                         ↓
                              ┌─────────────────────┐
                              │ Real API            │
                              │ Times out / Fails   │
                              └─────────────────────┘
```

**After Fix**:

```
┌─────────────────────┐
│ Playwright Runner   │
│ .env.test loaded    │
│ VITE_SUPABASE_URL=  │
│ test.supabase.co    │
└──────────┬──────────┘
           │ spawns with env injection
           ↓
┌─────────────────────┐       ┌─────────────────────┐
│ Vite Dev Server     │       │ Browser             │
│ Injected env vars:  │──────→│ JavaScript has:     │
│ VITE_SUPABASE_URL=  │       │ test.supabase.co    │
│ test.supabase.co    │       └──────────┬──────────┘
└─────────────────────┘                  │
                                         ↓
                              ┌─────────────────────┐
                              │ Playwright Mocks    │
                              │ Intercept & Respond │
                              └─────────────────────┘
```

## Technical Details

### Environment Variable Precedence in Vite

Vite loads environment variables in this order (highest to lowest priority):

1. Command-line environment variables (what we inject via `webServer.env`)
2. `.env.local`
3. `.env.[mode]` (e.g., `.env.test`)
4. `.env`

By injecting via `webServer.env`, we ensure the test values take highest priority.

### Why This Affects Browser Code

Vite replaces `import.meta.env.*` variables at **build time**, not runtime. When the browser loads the JavaScript bundle:

1. Vite reads `VITE_SUPABASE_URL` from environment
2. Replaces all `import.meta.env.VITE_SUPABASE_URL` with the actual value
3. Bundles JavaScript with hardcoded URL
4. Serves to browser

This means the browser never "knows" about environment variables - it only sees the hardcoded values that were injected during bundling.

### Mock Interception Mechanism

Playwright's `page.route()` matches requests by URL pattern:

```typescript
await page.route("https://test.supabase.co/auth/v1/signup", async (route) => {
  console.log("🔍 Mock intercepted signup request");
  await route.fulfill({
    status: 200,
    body: JSON.stringify({ user: { id: "mock-user-id" } }),
  });
});
```

**Critical**: The route pattern MUST exactly match the URL the browser requests. If browser requests `https://real.supabase.co/...` but mock listens for `https://test.supabase.co/...`, the mock will never intercept.

## Configuration Files

### `.env.test`

```env
# Mock Supabase URL - matches what test-helpers.ts expects
VITE_SUPABASE_URL=https://test.supabase.co

# Mock anon key - not a real key, just for test configuration
VITE_SUPABASE_ANON_KEY=mock-anon-key-for-testing-only

# Ensure we're in test mode
NODE_ENV=test
```

### `playwright.config.ts`

Key sections:

1. **Environment loading** (line 11):

   ```typescript
   dotenv.config({ path: path.resolve(__dirname, ".env.test") });
   ```

2. **Environment injection** (lines 56-60):
   ```typescript
   env: {
     VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'https://test.supabase.co',
     VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'mock-anon-key-for-testing-only',
     NODE_ENV: 'test',
   },
   ```

## Testing the Fix

### Quick Test

```bash
cd /Users/danielzeddr/PetForce/apps/web
./test-mock-fix.sh
```

### Manual Test

```bash
cd /Users/danielzeddr/PetForce/apps/web

# Kill existing servers
pkill -f "vite"

# Run test
npx playwright test src/features/auth/__tests__/e2e/unified-auth-flow.spec.ts --grep "successfully registers new user"
```

### Expected Results

**Console Output**:

```
✓ Mock intercepted signup request for: test@example.com
```

**Timing**:

- Test completes in 2-5 seconds
- NOT 10+ seconds
- No timeout errors

**Network Tab** (if running in headed mode):

- Requests go to: `https://test.supabase.co/...`
- NOT: `https://[real-project].supabase.co/...`

## Verification Checklist

- [ ] `.env.test` contains mock URL
- [ ] `playwright.config.ts` loads `.env.test` via `dotenv.config()`
- [ ] `playwright.config.ts` injects env vars via `webServer.env`
- [ ] Test runs without killing existing dev server manually
- [ ] Mock interception console message appears
- [ ] No timeout errors in test output
- [ ] Test completes in < 5 seconds
- [ ] Network requests (if visible) show mock URL

## Fallback Solutions

### If `webServer.env` Doesn't Work

Some versions of Playwright may not support `webServer.env`. Alternative solution:

1. Create separate Vite config for tests
2. Use `npm run dev:test` with test config
3. Update `webServer.command` to use test script

See `MOCK_FIX_VERIFICATION.md` for detailed alternative implementation.

## Future Improvements

### 1. Dedicated Test Server Script

Create `apps/web/scripts/dev-test.sh`:

```bash
#!/bin/bash
export VITE_SUPABASE_URL=https://test.supabase.co
export VITE_SUPABASE_ANON_KEY=mock-anon-key-for-testing-only
export NODE_ENV=test
npm run dev
```

Update `playwright.config.ts`:

```typescript
command: './scripts/dev-test.sh',
```

### 2. CI/CD Integration

Ensure CI environment also uses test configuration:

```yaml
# .github/workflows/test.yml
env:
  VITE_SUPABASE_URL: https://test.supabase.co
  VITE_SUPABASE_ANON_KEY: mock-anon-key-for-testing-only
  NODE_ENV: test
```

### 3. Mock Server URL Validation

Add validation in test-helpers.ts:

```typescript
if (import.meta.env.VITE_SUPABASE_URL !== "https://test.supabase.co") {
  throw new Error(
    "Test environment misconfigured! " +
      `Expected mock URL but got: ${import.meta.env.VITE_SUPABASE_URL}`,
  );
}
```

## Related Documentation

- E2E Test Strategy: `/docs/E2E_STRATEGY.md`
- Mock Infrastructure Verification: `/MOCK_FIX_VERIFICATION.md`
- Playwright Configuration: `playwright.config.ts`
- Test Helpers: `src/features/auth/__tests__/e2e/test-helpers.ts`

## Credits

- **Diagnosed by**: Tucker (Senior QA Engineer)
- **Implemented by**: Engrid (Senior Software Engineer)
- **Date**: 2026-01-28
- **Issue**: Mock infrastructure not intercepting API calls
- **Fix**: Environment variable injection in Playwright webServer config

---

**Key Takeaway**: When testing applications that bundle environment variables at build time (like Vite), ensure the build process uses the same environment as the test runner. The browser only sees what was baked into the bundle, not what the test runner knows.
