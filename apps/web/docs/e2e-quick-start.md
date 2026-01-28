# E2E Testing Quick Start Guide

## For Developers

### Running Tests Locally

```bash
# Navigate to web app
cd apps/web

# Install dependencies (if not already done)
npm install

# Install Playwright browsers (first time only)
npx playwright install chromium

# Run all E2E tests
npm run test:e2e

# Run with UI (recommended for debugging)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run specific test
npx playwright test --grep "CRITICAL"
```

### Before Creating a PR

```bash
# 1. Run E2E tests locally
cd apps/web
npm run test:e2e

# 2. Fix any failures

# 3. Create PR - E2E tests will run automatically in CI
```

### Debugging Failed Tests

```bash
# View HTML report
npx playwright show-report

# Run single test in debug mode
npx playwright test --debug --grep "test name"

# View traces from last run
npx playwright show-trace test-results/**/trace.zip
```

## For Tucker (QA Lead)

### Reviewing E2E Test Results

1. **GitHub Actions**
   - Go to PR → Checks tab
   - Find "E2E Tests" workflow
   - Click to view details

2. **Download Artifacts**
   - Scroll to "Artifacts" section
   - Download `playwright-report`
   - Open `index.html` in browser

3. **Validate Failures**
   - Check if failures are animation timing (known issue)
   - Check if failures are critical auth flows (blocker)
   - Comment on PR with findings

### Defining New Test Scenarios

Add test scenarios to `/apps/web/src/features/auth/__tests__/e2e/`

Example:
```typescript
test.describe('New Feature Flow', () => {
  test('CRITICAL: scenario that must work', async ({ page }) => {
    // Test implementation
  });
});
```

### Quality Gate Checklist

- [ ] All CRITICAL tests pass
- [ ] No new test failures introduced
- [ ] Screenshots look correct
- [ ] Traces show expected behavior
- [ ] Animation timing issues are documented

## For Engrid (Animation/UX)

### Fixing Animation Timing Issues

Current issues (19 tests):
- Password strength indicators
- Error message animations
- Tab transition animations

### Recommended Fixes

```typescript
// Wait for animation to complete
await expect(element).toBeVisible();
await page.waitForTimeout(300); // Animation duration
await expect(element).toHaveCSS('opacity', '1');

// Or use Playwright's built-in animation wait
await expect(element).toBeVisible();
await expect(element).toHaveClass(/animate-complete/);
```

### Testing Animations in CI

```bash
# Run tests with CI environment variables
CI=true npm run test:e2e

# This enables:
# - 2 retries for flaky tests
# - Serial execution (workers: 1)
# - Stricter timeout settings
```

## For Chuck (CI/CD Guardian)

### Monitoring Pipeline

```bash
# View workflow status
gh workflow view e2e-tests.yml

# View recent runs
gh run list --workflow=e2e-tests.yml

# View logs from latest run
gh run view --log
```

### Updating Quality Gates

Edit `.github/workflows/e2e-tests.yml`:

```yaml
# Current: Warn on failure
exit 1  # Blocks merge

# Future: Strict blocking
exit 1  # Blocks merge (no warnings)
```

### Adding to Branch Protection

1. GitHub → Settings → Branches
2. Edit branch protection rule for `main`
3. Check "Require status checks to pass"
4. Search for "E2E Quality Gate"
5. Save changes

## Common Issues

### Issue: "Playwright executable doesn't exist"
```bash
npx playwright install chromium
```

### Issue: "Target page timeout"
```bash
# Ensure dev server is running
npm run dev

# Or increase timeout in playwright.config.ts
timeout: 60000
```

### Issue: "Browser not found"
```bash
# Reinstall browsers with dependencies
npx playwright install --with-deps chromium
```

### Issue: Tests pass locally but fail in CI
```bash
# Run with CI flag
CI=true npm run test:e2e

# Check environment variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY
```

## Test Status Dashboard

| Test Category | Total | Passing | Failing | Status |
|--------------|-------|---------|---------|--------|
| Tab Navigation | 5 | 5 | 0 | ✅ |
| Duplicate Email | 3 | 1 | 2 | ⚠️ Animation |
| New User Registration | 2 | 0 | 2 | ⚠️ Animation |
| Password Validation | 5 | 0 | 5 | ⚠️ Animation |
| Form Layout | 4 | 2 | 2 | ⚠️ Animation |
| Accessibility | 4 | 0 | 4 | ⚠️ Animation |
| Edge Cases | 4 | 0 | 4 | ⚠️ Animation |
| **TOTAL** | **27** | **8** | **19** | **⚠️** |

## Next Steps

1. **Engrid**: Fix 19 animation timing tests
2. **Tucker**: Validate all tests pass consistently
3. **Chuck**: Update quality gate to strict blocking
4. **Team**: Add more E2E tests for other flows

## Resources

- [Full CI/CD Integration Docs](./ci-cd-e2e-integration.md)
- [Playwright Documentation](https://playwright.dev)
- [PetForce Testing Guide](./TESTING.md)
