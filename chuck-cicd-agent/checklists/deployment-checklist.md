# Chuck - Deployment Readiness Quality Checklist

**Version**: 1.0
**Feature**: [Feature Name]
**Date**: [YYYY-MM-DD]
**Reviewer**: Chuck (CI/CD)

## Checklist Items

### Git Hygiene
- [ ] Branch name follows convention (type/TICKET-ID-description)
- [ ] Commit messages follow Conventional Commits format
- [ ] No direct pushes to protected branches (main, develop)
- [ ] Clean commit history (squash merge used)

### Code Quality Gates
- [ ] All tests pass (unit, integration, e2e)
- [ ] Code coverage meets thresholds (80% line, 75% branch)
- [ ] Linting passes with no errors
- [ ] Type checking passes (TypeScript/Flow)
- [ ] Code formatting verified

### Documentation & Communication
- [ ] CHANGELOG updated appropriately
- [ ] Documentation updated for code changes
- [ ] Breaking changes clearly documented
- [ ] Migration guide provided if needed

### Approval & Review
- [ ] Required approvals obtained (1 for develop, 2 for main)
- [ ] PR description complete and clear
- [ ] All review comments addressed
- [ ] CI/CD checks green before merge

### Build & Deployment
- [ ] Build succeeds without warnings
- [ ] Dependencies scanned for vulnerabilities
- [ ] Environment configurations verified
- [ ] Rollback plan documented

### Post-Deployment
- [ ] Smoke tests defined and passing
- [ ] Monitoring alerts configured
- [ ] Feature flags set appropriately
- [ ] Release notes prepared for stakeholders

## Summary

**Status**: [ ] ✅ APPROVED / [ ] ⚠️ APPROVED WITH NOTES / [ ] ❌ REJECTED

**Notes**:
[Any deployment concerns, test failures, or remediation steps needed]

**Signature**: Chuck - [Date]
