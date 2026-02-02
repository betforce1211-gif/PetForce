# Quick Reference Card

**Chuck's CI/CD Quick Reference for PetForce Developers**

---

## Before You Push

```bash
# Run all checks
npm run lint && npm run typecheck && npm test -- --run
```

---

## Test Commands

```bash
# Unit tests
npm test                       # Watch mode
npm test -- --run              # CI mode
npm run test:coverage          # With coverage

# E2E tests
npm run test:e2e               # All tests
npm run test:e2e:headed        # See browser
npm run test:e2e:ui            # Interactive

# Accessibility
npm run test:a11y              # A11y tests only
npm run tucker:full            # All Tucker tests
```

---

## Common Test Failures

| Error | Fix |
|-------|-----|
| Lint failure | `npm run lint -- --fix` |
| Type error | `npm run typecheck` |
| Test timeout | Add `vi.useFakeTimers()` |
| Element not found | Update selector |
| Viewport issue | Check CSS or scroll |

---

## Test Files Location

```
apps/web/src/
├── components/ui/__tests__/         # UI component tests
├── features/auth/__tests__/         # Auth feature tests
│   ├── e2e/                        # E2E tests (Playwright)
│   ├── accessibility.test.tsx      # A11y tests
│   └── auth-flow.integration.test.tsx  # Integration tests
└── features/auth/components/__tests__/  # Component tests
```

---

## Coverage Requirements

| Package | Line | Branch |
|---------|------|--------|
| @petforce/auth | 80% | 75% |
| @petforce/web | 80% | 75% |
| @petforce/ui | 90% | 85% |

---

## Current Test Status

- Unit tests: 139 passing
- E2E tests: 26/28 passing (93%)
- Known issues:
  - 28 timer tests need fixing (Issue #27)
  - 2 viewport tests failing (Issue #28)

---

## GitHub Issues

- #25: Duplicate email detection (CLOSED)
- #26: Success messages (CLOSED)
- #27: Timer tests (OPEN - Tucker)
- #28: Viewport tests (OPEN - Engrid)

---

## CI/CD Status

CI runs automatically on:
- Every push to main/develop
- Every pull request
- Manual trigger via GitHub UI

Checks:
- Lint
- TypeCheck
- Unit Tests
- E2E Tests
- Build
- Security Audit

---

## Need Help?

- CI/CD issues: Chuck
- Test failures: Tucker
- Documentation: Thomas
- Security: Samantha
- Code review: Engrid

---

**Quality gates protect pet families. Every deployment matters.**
