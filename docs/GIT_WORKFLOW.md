# Git Workflow Guide

This guide explains PetForce's Git workflow, branching strategy, and best practices.

## Table of Contents

- [Branch Strategy](#branch-strategy)
- [Branch Naming](#branch-naming)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Git Hooks](#git-hooks)
- [Release Process](#release-process)
- [Common Operations](#common-operations)

---

## Branch Strategy

We follow **Git Flow** with some modifications for simplicity.

### Main Branches

```
main (production)
  ↑
develop (staging)
  ↑
feature/* (development)
```

#### `main` Branch
- Production-ready code
- Protected branch (requires 2 approvals)
- Only accepts merges from `develop` or hotfixes
- Every merge triggers production deployment
- Must have all tests passing

#### `develop` Branch
- Integration branch for features
- Protected branch (requires 1 approval)
- Auto-deploys to staging environment
- All feature branches merge here first
- Must be stable and deployable

### Supporting Branches

#### Feature Branches (`feature/*`)
- Created from: `develop`
- Merges back to: `develop`
- Naming: `feature/TICKET-ID-description`
- Purpose: New features or enhancements
- Lifetime: Until feature is complete

#### Bugfix Branches (`fix/*`, `bugfix/*`)
- Created from: `develop`
- Merges back to: `develop`
- Naming: `fix/TICKET-ID-description`
- Purpose: Bug fixes
- Lifetime: Until bug is fixed

#### Hotfix Branches (`hotfix/*`)
- Created from: `main`
- Merges back to: `main` AND `develop`
- Naming: `hotfix/TICKET-ID-description`
- Purpose: Critical production fixes
- Lifetime: Very short (hours, not days)

#### Release Branches (`release/*`)
- Created from: `develop`
- Merges back to: `main` AND `develop`
- Naming: `release/v1.2.3`
- Purpose: Prepare for production release
- Lifetime: Until release is deployed

---

## Branch Naming

### Format

```
<type>/<TICKET-ID>-<description>
```

### Types

- `feature/` - New features
- `fix/` or `bugfix/` - Bug fixes
- `hotfix/` - Critical production fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates
- `test/` - Test additions/updates
- `chore/` - Build, CI/CD, dependencies

### Examples

**Good:**
```bash
feature/PET-123-add-medication-reminders
fix/PET-456-login-validation-error
hotfix/PET-789-critical-auth-bug
refactor/PET-234-simplify-user-store
docs/PET-567-update-api-docs
```

**Bad:**
```bash
feature  # No ticket ID or description
fix-bug  # Not descriptive enough
my-changes  # No type or ticket
```

### Creating a Branch

```bash
# Start from develop
git checkout develop
git pull origin develop

# Create and checkout new branch
git checkout -b feature/PET-123-add-medication-reminders

# Or use Chuck's helper (if configured)
chuck create-branch feature PET-123 "add medication reminders"
```

---

## Commit Messages

We follow **Conventional Commits** specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style (formatting, no logic change)
- `refactor` - Code refactoring
- `perf` - Performance improvements
- `test` - Adding or updating tests
- `build` - Build system or external dependencies
- `ci` - CI/CD configuration changes
- `chore` - Other changes (tooling, etc.)
- `revert` - Revert previous commit

### Rules

1. **Subject line**: <= 100 characters
2. **Body**: Optional, explain *why* not *what*
3. **Footer**: Reference issues, breaking changes
4. **Type**: Must be lowercase
5. **Scope**: Optional, component/package name
6. **Breaking changes**: Use `!` after type/scope or `BREAKING CHANGE:` in footer

### Examples

**Simple commit:**
```bash
git commit -m "feat(auth): add biometric authentication"
```

**Detailed commit:**
```bash
git commit -m "fix(auth): prevent login for unconfirmed users

Previously, users could sometimes login before confirming their email.
This adds explicit check for email_confirmed_at field.

Fixes #123"
```

**Breaking change:**
```bash
git commit -m "feat(api)!: change authentication response format

BREAKING CHANGE: Authentication endpoints now return user object
in 'data' field instead of root level. Update client code accordingly.

Migration guide: docs/migration/v2-auth.md
Fixes #456"
```

**Multiple changes:**
```bash
git commit -m "feat(reminders): add medication reminder feature

- Created MedicationReminder component
- Added reminder scheduling logic
- Implemented push notifications
- Added tests for all scenarios

Closes #789"
```

### Git Hooks

Commit messages are **automatically validated** by Git hooks. Invalid messages will be rejected.

---

## Pull Request Process

### 1. Before Creating PR

```bash
# Ensure branch is up to date
git checkout develop
git pull origin develop
git checkout feature/PET-123-my-feature
git rebase develop

# Run all checks locally
npm run lint
npm run typecheck
npm test
npm run build
```

Or use Chuck's validator:
```bash
chuck pr validate
```

### 2. Create Pull Request

1. Push your branch:
   ```bash
   git push origin feature/PET-123-my-feature
   ```

2. Go to GitHub and create PR

3. Fill out PR template completely:
   - Description of changes
   - Type of change
   - Related issues
   - Testing performed
   - Agent checklists
   - Deployment notes

4. Request reviewers based on CODEOWNERS

### 3. PR Requirements

Before merge, ensure:

- [ ] All CI checks pass (lint, typecheck, test, build)
- [ ] Required approvals received (1 for develop, 2 for main)
- [ ] Branch is up to date with base
- [ ] All conversations resolved
- [ ] Agent checklists completed
- [ ] Documentation updated
- [ ] No merge conflicts

### 4. Merge Strategy

**Feature → Develop:**
- Use **Squash and Merge**
- Creates clean, linear history
- One commit per feature in develop

**Develop → Main:**
- Use **Merge Commit**
- Preserves feature history
- Clear release boundaries

### 5. After Merge

- Branch is automatically deleted (if enabled)
- Staging deployment triggered (for develop)
- Production deployment triggered (for main)
- Close related issues

---

## Git Hooks

We use **Husky** for Git hooks. They run automatically.

### Pre-Commit Hook

Runs before each commit:
- Lints staged files with ESLint
- Formats staged files with Prettier
- Only affects files you're committing

**Bypass (not recommended):**
```bash
git commit --no-verify -m "message"
```

### Commit-Msg Hook

Validates commit message format:
- Checks Conventional Commits format
- Enforces type, subject rules
- Prevents bad commit messages

**Cannot be bypassed** (for quality control).

### Pre-Push Hook

Runs before pushing:
- Runs test suite
- Ensures tests pass before pushing
- Prevents breaking code in remote

**Bypass (not recommended):**
```bash
git push --no-verify
```

---

## Release Process

### Automatic Release

1. Go to **Actions** → **Release** workflow
2. Click **Run workflow**
3. Select version bump type:
   - `patch` - Bug fixes (0.0.X)
   - `minor` - New features (0.X.0)
   - `major` - Breaking changes (X.0.0)
4. Check **prerelease** if needed
5. Click **Run workflow**

The workflow will:
- Bump version in all packages
- Generate changelog from commits
- Create Git tag
- Push to GitHub
- Create GitHub release
- Notify via Slack

### Manual Release

```bash
# 1. Checkout main
git checkout main
git pull origin main

# 2. Create release branch
git checkout -b release/v1.2.3

# 3. Bump version
npm version minor  # or patch, major

# 4. Update CHANGELOG.md manually

# 5. Commit
git commit -am "chore(release): bump version to 1.2.3"

# 6. Merge to main
git checkout main
git merge release/v1.2.3

# 7. Tag
git tag -a v1.2.3 -m "Release v1.2.3"

# 8. Push
git push origin main --tags

# 9. Merge back to develop
git checkout develop
git merge main
git push origin develop
```

### Semantic Versioning

We follow **Semantic Versioning (SemVer)**:

```
MAJOR.MINOR.PATCH
  1  .  2  .  3
```

- **MAJOR**: Breaking changes
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes (backwards compatible)

Examples:
- `1.0.0` → `1.0.1` (bug fix)
- `1.0.1` → `1.1.0` (new feature)
- `1.1.0` → `2.0.0` (breaking change)

---

## Common Operations

### Starting New Feature

```bash
# 1. Update develop
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/PET-123-my-feature

# 3. Make changes and commit
git add .
git commit -m "feat(component): add new feature"

# 4. Push and create PR
git push origin feature/PET-123-my-feature
```

### Updating Branch with Latest Develop

```bash
# Option 1: Rebase (cleaner history)
git checkout feature/PET-123-my-feature
git fetch origin
git rebase origin/develop

# If conflicts, resolve and continue
git add .
git rebase --continue

# Force push (required after rebase)
git push origin feature/PET-123-my-feature --force-with-lease

# Option 2: Merge (preserves history)
git checkout feature/PET-123-my-feature
git merge origin/develop
git push origin feature/PET-123-my-feature
```

### Fixing Merge Conflicts

```bash
# 1. Fetch latest
git fetch origin

# 2. Try to merge/rebase
git merge origin/develop
# or
git rebase origin/develop

# 3. Resolve conflicts in editor
# Look for markers: <<<<<<<, =======, >>>>>>>

# 4. Mark as resolved
git add resolved-file.ts

# 5. Continue
git merge --continue
# or
git rebase --continue

# 6. Push
git push origin feature/PET-123-my-feature
```

### Cherry-Picking Commits

```bash
# 1. Find commit hash
git log

# 2. Cherry-pick to current branch
git cherry-pick abc1234

# 3. Resolve conflicts if any
git add .
git cherry-pick --continue

# 4. Push
git push
```

### Reverting Changes

```bash
# Revert a commit (creates new commit)
git revert abc1234
git push

# Revert a merge commit
git revert -m 1 abc1234
git push

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1
git push --force-with-lease  # Be careful!
```

### Cleaning Up Local Branches

```bash
# Delete merged local branches
git branch --merged | grep -v "\*" | xargs -n 1 git branch -d

# Delete all local branches except main/develop
git branch | grep -v "main\|develop" | xargs git branch -D

# Prune remote branches
git fetch --prune
```

---

## Troubleshooting

### "Your branch is behind"

```bash
git pull origin develop
```

### "Your branch has diverged"

```bash
# Option 1: Rebase
git rebase origin/develop

# Option 2: Merge
git merge origin/develop
```

### "Commit message doesn't follow format"

Use conventional commit format:
```bash
git commit -m "feat(scope): description"
```

### "Pre-commit hook failed"

Fix linting/formatting errors:
```bash
npm run lint -- --fix
npm run format
git add .
git commit
```

### "Tests failed on push"

Fix failing tests:
```bash
npm test
# Fix tests
git add .
git commit -m "fix(tests): resolve failing tests"
git push
```

---

## Best Practices

### DO

✅ Create small, focused branches
✅ Commit often with clear messages
✅ Keep branches up to date with develop
✅ Test locally before pushing
✅ Request reviews from relevant agents
✅ Resolve all PR comments
✅ Delete branches after merge
✅ Write meaningful commit messages

### DON'T

❌ Commit directly to main or develop
❌ Push without running tests
❌ Use generic commit messages ("fix", "wip")
❌ Leave branches unmerged for weeks
❌ Force push to shared branches (except after rebase)
❌ Ignore CI failures
❌ Skip code review
❌ Commit secrets or sensitive data

---

## Getting Help

- **Documentation**: Check `/docs` folder
- **CONTRIBUTING.md**: Detailed contribution guide
- **Chuck Agent**: CI/CD guardian - ask for help
- **GitHub Discussions**: Ask questions
- **CODEOWNERS**: Find the right reviewer

---

## Related Documentation

- [CONTRIBUTING.md](../CONTRIBUTING.md) - Full contribution guide
- [TESTING.md](../TESTING.md) - Testing guidelines
- [OpenSpec Workflow](../openspec/AGENTS.md) - Planning process
- [Branch Protection](./BRANCH_PROTECTION.md) - GitHub settings

---

**Made with 🐾 by Chuck, your CI/CD Guardian**
