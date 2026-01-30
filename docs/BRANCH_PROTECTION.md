# Branch Protection Rules

This document describes the branch protection rules configured for PetForce.

## Overview

Branch protection ensures code quality by requiring reviews, status checks, and preventing accidental force pushes or deletions.

---

## Protected Branches

### `main` Branch (Production)

The `main` branch contains production-ready code. Every push triggers a production deployment.

#### Rules

**Pull Request Requirements:**
- ✅ Require pull request before merging
- ✅ Require 2 approvals
- ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ Require review from CODEOWNERS
- ✅ Require approval of the most recent reviewable push

**Status Checks:**
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- Required checks:
  - `CI / Lint Code`
  - `CI / Type Check`
  - `CI / Run Tests`
  - `CI / Build All Apps`
  - `CI / Security Audit`
  - `E2E Tests / Run E2E Tests` (if applicable)

**Additional Restrictions:**
- ✅ Require conversation resolution before merging
- ✅ Require linear history (no merge commits from feature branches)
- ✅ Require signed commits (recommended, not enforced)
- ❌ Do not allow bypassing the above settings
- ✅ Restrict who can push to matching branches (admins only)
- ✅ Allow force pushes: No
- ✅ Allow deletions: No

**Merge Options:**
- ✅ Allow merge commits (for develop → main)
- ❌ Allow squash merging (not for main)
- ❌ Allow rebase merging (not for main)
- ✅ Automatically delete head branches after merge

---

### `develop` Branch (Staging)

The `develop` branch is the integration branch. Every push triggers a staging deployment.

#### Rules

**Pull Request Requirements:**
- ✅ Require pull request before merging
- ✅ Require 1 approval
- ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ Require review from CODEOWNERS
- ✅ Require approval of the most recent reviewable push

**Status Checks:**
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- Required checks:
  - `CI / Lint Code`
  - `CI / Type Check`
  - `CI / Run Tests`
  - `CI / Build All Apps`
  - `CI / Security Audit`

**Additional Restrictions:**
- ✅ Require conversation resolution before merging
- ✅ Require linear history (enforce squash merges from features)
- ✅ Require signed commits (recommended, not enforced)
- ❌ Do not allow bypassing the above settings
- ✅ Restrict who can push to matching branches (team members only)
- ✅ Allow force pushes: No
- ✅ Allow deletions: No

**Merge Options:**
- ❌ Allow merge commits (not for feature branches)
- ✅ Allow squash merging (default for features)
- ❌ Allow rebase merging
- ✅ Automatically delete head branches after merge

---

### `release/*` Branches

Release branches prepare code for production deployment.

#### Rules

**Pull Request Requirements:**
- ✅ Require pull request before merging
- ✅ Require 2 approvals
- ✅ Require review from CODEOWNERS

**Status Checks:**
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- All CI checks required

**Additional Restrictions:**
- ✅ Require conversation resolution before merging
- ✅ Restrict who can push (release managers only)
- ✅ Allow force pushes: No
- ✅ Allow deletions: No

---

## GitHub Settings Configuration

### How to Configure (Admins Only)

1. Go to **Repository Settings**
2. Navigate to **Branches**
3. Click **Add branch protection rule**

### Main Branch Configuration

**Branch name pattern:** `main`

```yaml
# Branch protection rule for main
branch_protection:
  required_pull_request_reviews:
    required_approving_review_count: 2
    dismiss_stale_reviews: true
    require_code_owner_reviews: true
    require_last_push_approval: true
  
  required_status_checks:
    strict: true
    checks:
      - context: "CI / Lint Code"
      - context: "CI / Type Check"
      - context: "CI / Run Tests"
      - context: "CI / Build All Apps"
      - context: "CI / Security Audit"
  
  enforce_admins: true
  required_conversation_resolution: true
  required_linear_history: true
  allow_force_pushes: false
  allow_deletions: false
  
  restrictions:
    users: []
    teams: ["admins"]
```

### Develop Branch Configuration

**Branch name pattern:** `develop`

```yaml
# Branch protection rule for develop
branch_protection:
  required_pull_request_reviews:
    required_approving_review_count: 1
    dismiss_stale_reviews: true
    require_code_owner_reviews: true
    require_last_push_approval: true
  
  required_status_checks:
    strict: true
    checks:
      - context: "CI / Lint Code"
      - context: "CI / Type Check"
      - context: "CI / Run Tests"
      - context: "CI / Build All Apps"
      - context: "CI / Security Audit"
  
  enforce_admins: false
  required_conversation_resolution: true
  required_linear_history: true
  allow_force_pushes: false
  allow_deletions: false
  
  restrictions:
    users: []
    teams: ["developers"]
```

### Release Branch Configuration

**Branch name pattern:** `release/*`

```yaml
# Branch protection rule for release branches
branch_protection:
  required_pull_request_reviews:
    required_approving_review_count: 2
    dismiss_stale_reviews: true
    require_code_owner_reviews: true
  
  required_status_checks:
    strict: true
    checks:
      - context: "CI / All CI Checks Passed"
  
  enforce_admins: true
  required_conversation_resolution: true
  allow_force_pushes: false
  allow_deletions: false
  
  restrictions:
    users: []
    teams: ["release-managers", "admins"]
```

---

## Required Status Checks

### What They Check

| Check | Description | Failure Action |
|-------|-------------|----------------|
| **Lint Code** | ESLint checks for code quality | Fix linting errors |
| **Type Check** | TypeScript compilation | Fix type errors |
| **Run Tests** | Unit and integration tests | Fix failing tests |
| **Build All Apps** | Production build verification | Fix build errors |
| **Security Audit** | npm audit for vulnerabilities | Update dependencies |
| **E2E Tests** | End-to-end tests (production) | Fix E2E failures |

### How to Fix Failures

```bash
# Lint errors
npm run lint -- --fix

# Type errors
npm run typecheck

# Test failures
npm test

# Build errors
npm run build

# Security vulnerabilities
npm audit fix
```

---

## CODEOWNERS Review

Certain files require review from specific agents (defined in `.github/CODEOWNERS`).

### Example

```
# Authentication code requires Engrid and Samantha
/packages/auth/ @engrid-agent @samantha-agent

# CI/CD requires Chuck
/.github/workflows/ @chuck-agent

# Documentation requires Peter
/docs/ @peter-agent
```

When you modify these files, the specified reviewers are automatically requested.

---

## Bypassing Protections (Admins Only)

### When to Bypass

Bypassing protections should be **extremely rare**:
- ✅ Emergency hotfixes (critical production bug)
- ✅ CI/CD system issues (false failures)
- ❌ "I don't have time for review" (NOT acceptable)
- ❌ "Tests are flaky" (Fix the tests instead)

### How to Bypass

1. Admin privileges required
2. Use with **extreme caution**
3. Document reason in PR comment
4. Notify team immediately
5. Create follow-up issue to fix properly

---

## Rulesets (GitHub)

GitHub Rulesets provide more flexible branch protection. Consider enabling:

### Organization-Level Rulesets

Apply rules across all repositories:
- Require signed commits
- Block force pushes
- Require linear history
- Prevent secret commits

### Repository-Level Rulesets

Customize per repository:
- Tag protection rules
- Workflow approval requirements
- Deployment environments

---

## Enforcement

### Automated Enforcement

- GitHub Actions automatically run on every PR
- Status checks must pass before merge button activates
- CODEOWNERS automatically request reviews
- Husky Git hooks prevent bad commits locally

### Manual Enforcement

- Code reviewers verify quality standards
- Agents check their specific concerns
- Chuck (CI/CD agent) ensures deployment safety

---

## Troubleshooting

### "Required status check is failing"

Check the CI logs and fix the issue:
```bash
# View workflow logs on GitHub
# Or reproduce locally
npm run lint
npm run typecheck
npm test
npm run build
```

### "Waiting for required review"

Ping reviewers on PR or Slack:
```
@engrid-agent - Could you review this auth change?
```

### "Branch is not up to date"

Update your branch:
```bash
git pull origin develop
git push
```

### "Cannot force push to protected branch"

Don't force push to `main` or `develop`. Create a new PR instead.

### "Need to bypass protection for emergency"

Contact admin with:
- Clear reason for bypass
- Impact assessment
- Timeline for proper fix

---

## Best Practices

### DO

✅ Always create PRs for changes
✅ Keep branches up to date
✅ Respond to review comments promptly
✅ Fix CI failures immediately
✅ Request specific reviewers
✅ Resolve conversations before merging

### DON'T

❌ Try to bypass protections
❌ Merge with failing checks
❌ Ignore review feedback
❌ Force push to protected branches
❌ Commit directly to main/develop
❌ Merge without approvals

---

## Monitoring

### Check Protection Status

```bash
# Using GitHub CLI
gh api repos/:owner/:repo/branches/main/protection

# View in GitHub UI
Settings → Branches → Branch protection rules
```

### Audit Changes

All protection rule changes are logged in:
- Repository audit log
- Organization audit log
- GitHub Actions logs

---

## Related Documentation

- [Git Workflow](./GIT_WORKFLOW.md) - Complete Git workflow
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution guidelines
- [CODEOWNERS](../.github/CODEOWNERS) - Code ownership

---

**Maintained by Chuck, your CI/CD Guardian**

Questions? Open an issue or discussion!
