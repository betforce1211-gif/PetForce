# Mock Infrastructure Fix - Verification Guide

## What Was Fixed

**Problem**: Playwright test runner loaded `.env.test` (mock URL), but Vite dev server loaded `.env` (real URL). Result: Browser received real Supabase URL in JavaScript bundle, mocks never intercepted requests.

**Solution**: Added `env` injection to `webServer` config in `playwright.config.ts`, forcing Vite to use test environment variables.

## Modified Files

- `/Users/danielzeddr/PetForce/apps/web/playwright.config.ts`
  - Added `env` object to `webServer` configuration
  - Injects `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `NODE_ENV=test`
  - Ensures browser gets mock URL, not real URL

## Verification Steps

### Step 1: Clean Environment

```bash
cd /Users/danielzeddr/PetForce/apps/web

# Kill any running dev servers
pkill -f "vite" || true
pkill -f "node.*vite" || true

# Clear Playwright cache
npx playwright cache clean

# Wait a moment
sleep 2
```

### Step 2: Run Single Test

```bash
# Run the unified auth flow test
npx playwright test src/features/auth/__tests__/e2e/unified-auth-flow.spec.ts --grep "successfully registers new user"
```

### Step 3: Expected Output

**Console Output Should Show**:

```
🔍 Mock intercepted signup request for: test@example.com
```

**Console Output Should NOT Show**:

- Real Supabase URLs (like `https://[your-project].supabase.co`)
- Network timeout errors
- Rate limit errors
- "Failed to fetch" errors after long delays

**Timing**:

- Test should complete in 2-5 seconds
- NOT 10+ seconds
- Mock responses return instantly (<100ms)

### Step 4: Browser DevTools Check (Optional)

If you want to see the fix in action:

```bash
# Run test in headed mode
npx playwright test src/features/auth/__tests__/e2e/unified-auth-flow.spec.ts --grep "successfully registers new user" --headed --debug
```

**In Browser DevTools**:

1. Open Network tab
2. Look for Supabase API calls
3. Request URL should be: `https://test.supabase.co/auth/v1/signup`
4. NOT: `https://[real-project].supabase.co/...`

**In Console**:

1. Should see mock interception messages
2. No real API errors
3. No CORS errors (since mocks handle everything)

### Step 5: Verify Environment Variables

You can verify Vite is using the correct env vars:

```bash
# Temporarily add this to your test file to debug
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
```

**Expected**: `https://test.supabase.co`
**NOT**: Your real Supabase URL

## Success Criteria

- Mock interception console message appears
- No timeout errors
- Test completes in 2-5 seconds
- All API requests use mock URL (`https://test.supabase.co`)
- No real Supabase API calls in network tab

## Troubleshooting

### If Mocks Still Don't Intercept

1. **Check if old dev server is still running**:

   ```bash
   lsof -i :3000
   # Kill any processes using port 3000
   kill -9 <PID>
   ```

2. **Clear browser cache**:

   ```bash
   npx playwright cache clean
   ```

3. **Verify .env.test is loaded**:
   - Add debug logging to `playwright.config.ts`:
     ```typescript
     console.log("VITE_SUPABASE_URL:", process.env.VITE_SUPABASE_URL);
     ```

4. **Check webServer env injection**:
   - Ensure `env` object is inside `webServer` config
   - Ensure it's only added when `!process.env.CI`

### If Test Still Times Out

1. **Verify mock setup**:
   - Check `test-helpers.ts` has correct mock URL pattern
   - Ensure mock URL matches: `https://test.supabase.co/**`

2. **Check test file**:
   - Ensure `setupMocks(page)` is called in `beforeEach`
   - Ensure mocks are registered before navigation

3. **Increase timeout temporarily**:
   ```typescript
   test.setTimeout(60000); // 1 minute for debugging
   ```

## Alternative Solution (If Primary Fix Fails)

If the `webServer.env` injection doesn't work, we can create a separate Vite config:

**Create**: `apps/web/vite.config.test.ts`

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  envDir: ".",
  envPrefix: "VITE_",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  mode: "test",
});
```

**Update**: `package.json`

```json
{
  "scripts": {
    "dev:test": "vite --config vite.config.test.ts --mode test"
  }
}
```

**Update**: `playwright.config.ts`

```typescript
command: 'npm run dev:test',  // Changed from 'npm run dev'
```

## Next Steps for Tucker

1. Run verification steps above
2. Confirm mocks intercept successfully
3. If successful, mark P0 infrastructure fix as complete
4. Proceed with remaining P0 test fixes
5. Report back any issues for further debugging

## Technical Details

### Why This Works

**Before**:

```
Playwright → loads .env.test → knows mock URL
Vite → loads .env → serves real URL to browser
Browser → requests real URL
Playwright mocks → listening for test URL → MISS
Request → goes to real API → timeout/rate limit
```

**After**:

```
Playwright → loads .env.test → knows mock URL
Playwright → injects env vars to Vite via webServer.env
Vite → uses injected test env vars → serves mock URL to browser
Browser → requests mock URL
Playwright mocks → listening for test URL → INTERCEPT
Mock response → returned instantly
Test → completes successfully
```

### Key Insight

The problem wasn't in the test code or mock setup - it was in the **build pipeline**. The JavaScript bundle served to the browser had the real URL hardcoded from Vite's environment, so mocks could never intercept those requests.

By injecting the test environment variables into Vite's build process, we ensure the browser receives the mock URL, allowing Playwright's route interceptors to do their job.

---

**Fix implemented by**: Engrid (Senior Software Engineer)
**Diagnosed by**: Tucker (Senior QA Engineer)
**Date**: 2026-01-28
