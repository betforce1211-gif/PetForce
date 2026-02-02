# Git Workflow Guide

**Chuck's Git Best Practices for PetForce**

> "Pets are part of the family, so let's take care of them as simply as we can."
> 
> Quality gates protect pet families. Every deployment matters.

## Pre-Push Checklist

Before pushing code to GitHub, run this checklist:

```bash
# 1. Run linter
npm run lint

# 2. Run type checker
npm run typecheck

# 3. Run unit tests
npm test -- --run

# 4. Run E2E tests (if touching auth or UI)
npm run test:e2e
```

## Running Tests Locally

### Unit Tests (Vitest)

```bash
# Run all unit tests
npm test

# Run in CI mode (no watch)
npm test -- --run

# Run with coverage report
npm run test:coverage

# Run specific file
npm test -- src/features/auth/components/__tests__/EmailPasswordForm.test.tsx
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run in UI mode (interactive)
npm run test:e2e:ui
```

## Understanding Test Failures

### Unit Test Failures

When unit tests fail:

1. Read the error message carefully
2. Run the specific test file
3. Add debug logs if needed
4. Check if component logic changed
5. Update test if behavior intentionally changed

### E2E Test Failures

When E2E tests fail, screenshots are saved in `test-results/`:

1. Check the screenshot
2. Look at error context in `error-context.md`
3. Run test in headed mode: `npm run test:e2e:headed`
4. Use Playwright Inspector: `PWDEBUG=1 npm run test:e2e`

## Test Coverage Requirements

### Minimum Coverage Targets

| Package | Line Coverage | Branch Coverage |
|---------|---------------|-----------------|
| @petforce/auth | 80% | 75% |
| @petforce/web | 80% | 75% |
| @petforce/ui | 90% | 85% |

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/index.html
```

## Quick Reference

```bash
# Run all checks before push
npm run lint && npm run typecheck && npm test -- --run

# Run E2E tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```
