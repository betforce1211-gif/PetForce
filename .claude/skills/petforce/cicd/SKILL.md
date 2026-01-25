# CI/CD Best Practices for PetForce

## Branch Naming Convention

All branches must follow this pattern:
```
<type>/<ticket-id>-<short-description>
```

### Valid Types
- `feature/` - New functionality
- `bugfix/` - Bug repairs
- `hotfix/` - Critical production fixes
- `release/` - Release preparation (format: `release/v#.#.#`)
- `docs/` - Documentation only
- `refactor/` - Code restructuring
- `test/` - Test additions/fixes
- `chore/` - Maintenance tasks

### Validation Rules
- Lowercase only (no uppercase letters)
- Hyphens for word separation (no underscores or spaces)
- Ticket ID required (except for release branches)
- Description must be 3-50 characters

## Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### Types
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Formatting, missing semicolons, etc.
- `refactor` - Code change that neither fixes nor adds
- `perf` - Performance improvement
- `test` - Adding or correcting tests
- `build` - Build system or dependencies
- `ci` - CI configuration changes
- `chore` - Other changes (maintenance)
- `revert` - Reverting a previous commit

### Rules
- Subject line max 72 characters
- Use imperative mood ("add" not "added" or "adds")
- No period at end of subject
- Body wrapped at 72 characters
- Reference issues in footer: `Closes #123` or `Refs: PROJ-456`

## Deployment Readiness Checklist

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

## Coverage Thresholds
| Metric | Minimum | Target |
|--------|---------|--------|
| Line Coverage | 80% | 90% |
| Branch Coverage | 75% | 85% |
| Function Coverage | 80% | 90% |

## Protected Branches
- `main` - Production branch (requires 2 approvals)
- `develop` - Integration branch (requires 1 approval)
- `release/*` - Release branches (requires 2 approvals)
