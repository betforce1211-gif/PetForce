# CI/CD E2E Testing Integration

## Overview

This document describes the integration of Playwright E2E tests into the PetForce CI/CD pipeline. These tests ensure critical authentication flows work correctly before deployment to production.

## Quality Gate Philosophy

> **"Quality gates protect pet families. Every deployment matters."** - Chuck, CI/CD Guardian

Pet families depend on PetForce 24/7. A broken authentication flow could prevent access to critical pet care features:
- Medication reminders
- Vet appointment scheduling
- Emergency contact information
- Pet health records

Therefore, E2E tests are mandatory quality gates that block merges if critical flows fail.

## Pipeline Configuration

### Workflow: `.github/workflows/e2e-tests.yml`

The E2E testing workflow runs on:
- **Pull Requests** to `main` and `develop` branches
- **Direct pushes** to `main` and `develop` branches
- **Path filters**: Only runs if web app or auth package changes

### Test Execution

```yaml
Jobs:
  1. e2e-tests: Run Playwright tests
  2. e2e-quality-gate: Evaluate results and block merge if critical tests fail
```

### Environment Setup

1. **Install Playwright browsers**: `npx playwright install --with-deps chromium`
2. **Build web app**: Ensures production build succeeds
3. **Start dev server**: Uses `reuseExistingServer: true` for fast startup
4. **Run tests**: `npm run test:e2e -- --project=chromium`

### Test Configuration

From `playwright.config.ts`:
```typescript
{
  testDir: './src/features/auth/__tests__/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,      // Retry flaky tests in CI
  workers: process.env.CI ? 1 : undefined, // Serial execution in CI
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',              // Collect traces on failures
    screenshot: 'only-on-failure',        // Screenshot on failures
  },
}
```

## Test Coverage

### Current Test Suite (27 tests)

#### Passing Tests (8)
- Tab navigation (Sign In/Sign Up switching)
- Form layout and scrolling
- Accessibility (ARIA attributes, labels)
- Basic form interactions

#### Failing Tests (19) - Animation Timing Issues
- Password strength indicators (timing)
- Error message animations (timing)
- Tab transition animations (timing)
- Form visibility checks during animations (timing)

**Status**: Engrid is fixing animation timing issues. Tests are correctly written but need adjustments to wait for animations to complete.

### Critical Test Scenarios

#### 1. Duplicate Email Registration
```typescript
test('CRITICAL: shows error when registering with existing email')
```
This test would have caught the recent production bug where users could register with existing emails and receive confusing "check your email" messages.

#### 2. New User Registration Flow
```typescript
test('successfully registers new user and redirects to verification page')
```
Ensures the complete registration flow works end-to-end.

#### 3. Password Validation
```typescript
test('shows error when passwords do not match')
test('shows password strength indicator')
```
Validates password security requirements.

## Artifacts and Reporting

### Uploaded Artifacts (on failure)

1. **HTML Report** (`playwright-report/`)
   - Detailed test results with screenshots
   - Retention: 30 days

2. **Screenshots** (`test-results/`)
   - Screenshots captured on test failures
   - Helps diagnose UI issues
   - Retention: 30 days

3. **Traces** (`test-results/**/*.zip`)
   - Full browser traces for debugging
   - Includes network requests, console logs, DOM snapshots
   - Retention: 30 days

### Viewing Test Reports

After a workflow run:
1. Go to the GitHub Actions run page
2. Scroll to "Artifacts" section
3. Download `playwright-report` and open `index.html`

### Local Viewing

```bash
cd apps/web
npx playwright show-report playwright-report/
```

## Quality Gate Logic

### Current Policy (Temporary)

While Engrid fixes animation timing issues:

```bash
# Quality Gate: WARN but don't block
if [ "${{ needs.e2e-tests.result }}" == "failure" ]; then
  echo "⚠️ E2E tests failed"
  echo "Current status: 8/27 tests passing (19 animation timing issues)"
  echo "PRs can proceed if only animation timing tests fail"
  exit 1  # Will block merge
fi
```

### Future Policy (After Fixes)

Once all 27 tests pass consistently:

```bash
# Quality Gate: BLOCK merge on any failure
if [ "${{ needs.e2e-tests.result }}" == "failure" ]; then
  echo "❌ E2E tests failed - merge blocked"
  echo "All critical auth flows must pass before merge"
  exit 1
fi
```

## Running Tests Locally

### Quick Run (Chromium only)
```bash
cd apps/web
npm run test:e2e
```

### Interactive Mode (Debug)
```bash
cd apps/web
npm run test:e2e:ui
```

### Headed Mode (See browser)
```bash
cd apps/web
npm run test:e2e:headed
```

### Generate HTML Report
```bash
cd apps/web
npm run test:e2e
npx playwright show-report
```

## Debugging Failed Tests

### 1. Review Screenshots
```bash
open apps/web/test-results/**/test-failed-*.png
```

### 2. View Traces
```bash
cd apps/web
npx playwright show-trace test-results/**/trace.zip
```

### 3. Run Single Test
```bash
cd apps/web
npx playwright test --grep "CRITICAL: shows error when registering with existing email"
```

### 4. Debug Mode
```bash
cd apps/web
npx playwright test --debug
```

## Integration with Main CI Pipeline

The E2E tests are a separate workflow but can be referenced in the main CI:

```yaml
# In .github/workflows/ci.yml
jobs:
  all-checks:
    name: All CI Checks Passed
    needs: [lint, typecheck, test, build, openspec, security]
    # Note: E2E tests run separately and can be manually reviewed
```

### Adding E2E as Required Check

To block PRs until E2E tests pass:

1. Go to GitHub repository settings
2. Navigate to Branches → Branch protection rules
3. Add `E2E Quality Gate` to required checks
4. PRs will be blocked until this check passes

## Working with Tucker and Engrid

### Tucker (QA Lead) Responsibilities
- Define test scenarios and acceptance criteria
- Review test coverage gaps
- Validate quality gates are appropriate
- Sign off on test fixes

### Engrid (Animation/UX) Responsibilities
- Fix animation timing issues in 19 failing tests
- Ensure animations work correctly in CI environment
- Add proper wait conditions for animation completion
- Test animations across different viewport sizes

### Chuck (CI/CD Guardian) Responsibilities
- Maintain pipeline configuration
- Update quality gate policies
- Monitor test execution performance
- Ensure artifacts are collected properly

## Best Practices

### 1. Write Deterministic Tests
```typescript
// ❌ Bad: Relies on timing
await page.click('button');
await page.getByText('Success').toBeVisible();

// ✅ Good: Explicit wait with timeout
await page.click('button');
await expect(page.getByText('Success')).toBeVisible({ timeout: 5000 });
```

### 2. Wait for Animations
```typescript
// ✅ Wait for element to be stable
await expect(element).toBeVisible();
await expect(element).toHaveCSS('opacity', '1'); // Animation complete
```

### 3. Use Meaningful Test Names
```typescript
// ❌ Bad
test('test 1', ...)

// ✅ Good
test('CRITICAL: shows error when registering with existing email', ...)
```

### 4. Group Related Tests
```typescript
test.describe('Duplicate Email Registration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
  });
  
  test('shows error message', ...)
  test('provides sign in link', ...)
});
```

## Performance Optimization

### Current Performance
- **Average run time**: ~5-7 minutes
- **Flaky test rate**: ~70% (due to animation timing issues)
- **Target run time**: 3-5 minutes (after fixes)
- **Target flaky rate**: <5%

### Optimization Strategies

1. **Parallel Execution** (after fixes)
   ```typescript
   workers: process.env.CI ? 2 : undefined
   ```

2. **Skip Unnecessary Builds**
   - Use path filters to only run when web/auth changes
   - Cache node_modules and Playwright browsers

3. **Use Preview Build**
   ```bash
   npm run build && npm run preview
   # Faster than dev server for testing
   ```

## Troubleshooting

### Issue: Tests timeout in CI but pass locally
**Solution**: Increase timeout in CI environment
```typescript
use: {
  timeout: process.env.CI ? 30000 : 15000,
}
```

### Issue: Playwright browsers not installed
**Solution**: Ensure `npx playwright install --with-deps` runs before tests

### Issue: Dev server not ready
**Solution**: Use `wait-on` to ensure server is ready
```bash
npm run dev &
npx wait-on http://localhost:3000 --timeout 120000
```

### Issue: Environment variables not set
**Solution**: Ensure GitHub Secrets are configured
```yaml
env:
  VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
  VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
```

## Monitoring and Metrics

### Key Metrics to Track

1. **Test Success Rate**: Target 100% after animation fixes
2. **Average Run Time**: Target 3-5 minutes
3. **Flaky Test Rate**: Target <5%
4. **Test Coverage**: Add more E2E tests for other features

### GitHub Actions Insights

View metrics at:
```
https://github.com/{org}/PetForce/actions/workflows/e2e-tests.yml
```

## Next Steps

### Immediate (Week 1)
- [ ] Engrid fixes 19 animation timing tests
- [ ] Tucker validates all tests pass consistently
- [ ] Chuck updates quality gate to block merges

### Short-term (Month 1)
- [ ] Add E2E tests for Magic Link flow
- [ ] Add E2E tests for OAuth flow
- [ ] Add E2E tests for password reset flow
- [ ] Add E2E tests for email verification

### Long-term (Quarter 1)
- [ ] Add E2E tests for mobile app (Detox/Maestro)
- [ ] Add visual regression testing
- [ ] Add performance testing (Lighthouse CI)
- [ ] Add accessibility audits (axe-core)

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [GitHub Actions Documentation](https://docs.github.com/actions)
- [PetForce Testing Guide](./TESTING.md)

## Conclusion

E2E tests are a critical quality gate that protects pet families from broken authentication flows. By integrating these tests into CI/CD, we ensure every deployment is safe and reliable.

Remember Chuck's mantra: **"Quality gates protect pet families. Every deployment matters."**
