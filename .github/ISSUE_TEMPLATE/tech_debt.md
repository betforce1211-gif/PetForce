---
name: Technical Debt
about: Report technical debt or refactoring needs
title: '[TECH-DEBT] '
labels: tech-debt, refactor
assignees: ''
---

## Technical Debt Description

<!-- Describe the technical debt or area that needs refactoring -->

## Current State

<!-- What's the current implementation? -->

## Desired State

<!-- What should it be refactored to? -->

## Impact

### Code Quality
- [ ] Increases complexity
- [ ] Reduces maintainability
- [ ] Makes testing difficult
- [ ] Violates best practices
- [ ] Creates performance issues

### Business Impact
- [ ] Slows down feature development
- [ ] Increases bug risk
- [ ] Makes onboarding harder
- [ ] Affects scalability

## Proposed Refactoring

<!-- How would you refactor this? -->

## Effort Estimate

- [ ] Small (< 1 day)
- [ ] Medium (1-3 days)
- [ ] Large (1-2 weeks)
- [ ] Epic (> 2 weeks)

## Dependencies

<!-- Are there any dependencies or blockers? -->

## Agent Responsibilities

### Engrid (Engineering)
- [ ] Review current implementation
- [ ] Design refactoring approach
- [ ] Ensure backwards compatibility
- [ ] Code quality improvements

### Tucker (Testing)
- [ ] Verify test coverage before refactoring
- [ ] Update tests during refactoring
- [ ] Ensure no regressions

### Chuck (CI/CD)
- [ ] Deployment strategy
- [ ] Feature flags if needed
- [ ] Rollback plan

### Larry (Logging)
- [ ] Update logging if needed
- [ ] Ensure observability maintained

## Priority

- [ ] Critical - Blocking other work
- [ ] High - Should address soon
- [ ] Medium - Plan for next sprint
- [ ] Low - Nice to have

## Related Issues

<!-- Link to related issues -->

Relates to #
