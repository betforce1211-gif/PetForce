# Testing Checklist

Use this checklist to ensure comprehensive test coverage for new features.

## Before Submitting PR

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] All accessibility tests pass
- [ ] Coverage meets minimum thresholds (80% lines, 75% branches, 85% functions)
- [ ] No new accessibility violations introduced
- [ ] Tests added for new features
- [ ] Tests added for bug fixes

## Unit Test Checklist

### Component Tests
- [ ] Component renders without crashing
- [ ] Component renders with all props
- [ ] Component handles prop changes
- [ ] Component handles events correctly
- [ ] Component handles loading states
- [ ] Component handles error states
- [ ] Component is accessible

### Function/Logic Tests
- [ ] Happy path works
- [ ] Edge cases handled
- [ ] Error cases handled
- [ ] Boundary values tested
- [ ] Null/undefined handled
- [ ] Type validation works

## Integration Test Checklist

- [ ] Components work together correctly
- [ ] State management works across components
- [ ] API calls are mocked and tested
- [ ] Navigation works correctly
- [ ] Form submission flows work
- [ ] Error handling works end-to-end

## E2E Test Checklist

### User Journeys
- [ ] Complete registration flow
- [ ] Complete login flow
- [ ] Password reset flow
- [ ] Email verification flow
- [ ] Dashboard access after login
- [ ] Logout flow

### Cross-Browser Testing
- [ ] Works in Chrome/Chromium
- [ ] Works in Firefox (if configured)
- [ ] Works in Safari (if configured)
- [ ] Works on mobile viewport

### Error Scenarios
- [ ] Invalid credentials handled
- [ ] Network errors handled
- [ ] Timeout errors handled
- [ ] Unconfirmed email handled
- [ ] Session expiry handled

## Accessibility Checklist

### WCAG 2.1 AA Compliance
- [ ] No violations detected by axe
- [ ] Color contrast meets standards (4.5:1 for text)
- [ ] All interactive elements keyboard accessible
- [ ] Proper heading hierarchy (h1 → h2 → h3)
- [ ] Form fields have labels
- [ ] Error messages are accessible
- [ ] Loading states announced
- [ ] Focus management works correctly

### Keyboard Navigation
- [ ] Tab navigation works logically
- [ ] Enter submits forms
- [ ] Escape closes modals/dialogs
- [ ] Arrow keys work in custom widgets
- [ ] Focus visible on all interactive elements
- [ ] No keyboard traps

### Screen Reader Testing
- [ ] All images have alt text
- [ ] ARIA labels on complex widgets
- [ ] ARIA live regions for dynamic content
- [ ] Form errors announced
- [ ] Loading states announced
- [ ] Success messages announced

### Mobile Accessibility
- [ ] Touch targets at least 44x44 pixels
- [ ] Content readable at 200% zoom
- [ ] No horizontal scrolling at mobile sizes
- [ ] Gestures not required (alternatives provided)

## Edge Case Checklist

### Input Validation
- [ ] Empty string ""
- [ ] Whitespace only "   "
- [ ] Very long strings (> 1000 chars)
- [ ] Special characters (!, @, #, $, etc.)
- [ ] Unicode and emoji
- [ ] SQL injection attempts
- [ ] XSS attempts
- [ ] HTML/script tags

### Number Validation
- [ ] Zero
- [ ] Negative numbers
- [ ] Very large numbers (> MAX_SAFE_INTEGER)
- [ ] Decimal numbers
- [ ] NaN
- [ ] Infinity
- [ ] String numbers ("123")

### Array/Collection Validation
- [ ] Empty array []
- [ ] Single element
- [ ] Many elements (> 1000)
- [ ] Duplicates
- [ ] Null/undefined elements
- [ ] Mixed types

### Date/Time Validation
- [ ] Leap year dates (Feb 29)
- [ ] DST transitions
- [ ] Timezone boundaries
- [ ] Unix epoch (Jan 1, 1970)
- [ ] Far future dates
- [ ] Invalid dates

### Authentication Validation
- [ ] Expired tokens
- [ ] Invalid token format
- [ ] Missing tokens
- [ ] Wrong user's resources
- [ ] Revoked permissions
- [ ] Concurrent sessions

## Performance Checklist

- [ ] Tests complete in reasonable time (< 30s for unit, < 5min for E2E)
- [ ] No memory leaks in long-running tests
- [ ] Mock expensive operations
- [ ] Parallel test execution works
- [ ] No race conditions

## Security Testing Checklist

- [ ] XSS vulnerabilities tested
- [ ] SQL injection tested
- [ ] CSRF protection tested
- [ ] Authentication bypasses tested
- [ ] Authorization checks tested
- [ ] Sensitive data not logged
- [ ] Credentials not hardcoded

## Documentation Checklist

- [ ] Test purpose documented
- [ ] Complex test logic explained
- [ ] Test data documented
- [ ] Known limitations documented
- [ ] Flaky test workarounds documented

## CI/CD Checklist

- [ ] Tests pass in CI environment
- [ ] Tests don't depend on external services
- [ ] Tests use deterministic data
- [ ] Tests clean up after themselves
- [ ] Tests can run in parallel
- [ ] Tests can run in any order

## Tucker's Final Checks

Before declaring your tests complete, ask yourself:

1. **Did I test the happy path?**
   - Does the feature work when everything goes right?

2. **Did I test sad paths?**
   - What happens when things go wrong?
   - Are errors handled gracefully?

3. **Did I test edge cases?**
   - Reviewed the edge case checklist above?
   - Tested boundary values?

4. **Did I test accessibility?**
   - Can keyboard users complete the task?
   - Will screen reader users understand it?
   - Are there any WCAG violations?

5. **Did I test on mobile?**
   - Does it work on small screens?
   - Are touch targets large enough?

6. **Did I test like an attacker?**
   - Can I inject malicious input?
   - Can I access unauthorized data?
   - Can I bypass authentication?

7. **Would I trust my pet's safety to this code?**
   - This is the ultimate test for PetForce
   - If not, add more tests!

---

**Remember**: Every bug caught in testing is a bug that won't hurt a pet family. Test thoroughly!

- Tucker, QA Guardian
