# GitHub Automation Quick Start

## What's Been Set Up

Chuck (CI/CD Guardian) has created a complete GitHub automation system to track bugs, tasks, and roadmap items.

## Quick Start

### 1. Setup Labels (One-time)

```bash
cd /Users/danielzeddr/PetForce
./scripts/github/setup-labels.sh
```

### 2. Create an Issue

**Option A: Using GitHub CLI**
```bash
gh issue create --title "[CHUCK] Add health checks" \
  --body "Implement /health endpoint" \
  --label "agent:chuck,priority:high,type:feature"
```

**Option B: Using Chuck CLI**
```bash
node scripts/github/chuck-cli.js create
# Follow interactive prompts
```

**Option C: Using GitHub Web UI**
- Go to: https://github.com/betforce1211-gif/PetForce/issues/new/choose
- Choose template: Bug Report, Feature Request, Task, or Roadmap
- Fill out the form

### 3. Create a Branch

```bash
# Format: type/GH-<issue-number>-description
git checkout -b feature/GH-123-add-health-checks
```

Valid types: `feature`, `bugfix`, `hotfix`, `docs`, `refactor`, `test`, `chore`

### 4. Create a Pull Request

```bash
git push -u origin feature/GH-123-add-health-checks
gh pr create --title "Add health checks" --body "Closes #123"
```

**Important**: Always include `Closes #123` or `Relates to #123` in PR description!

### 5. Check Status

```bash
# Generate issue report
node scripts/github/sync-issue-status.js report

# List your issues
gh issue list --label "agent:chuck"

# List critical issues
gh issue list --label "priority:critical"
```

## Workflows

All workflows are in `.github/workflows/` and run automatically:

1. **issue-automation.yml** - Auto-labels and assigns issues
2. **ci-issue-sync.yml** - Creates issues from CI failures
3. **pr-issue-link.yml** - Validates PRs reference issues
4. **pr-status-sync.yml** - Updates issues when PRs merge

## Bulk Import

To import multiple tasks from a file:

```bash
# Create tasks.json
cat > tasks.json << 'JSONEOF'
[
  {
    "title": "[CHUCK] Add deployment health checks",
    "body": "Implement health check endpoints for all services",
    "labels": ["agent:chuck", "ci-cd", "priority:high"],
    "assignees": [],
    "milestone": null
  },
  {
    "title": "[TUCKER] Write E2E tests for checkout",
    "body": "Cover happy path and error cases",
    "labels": ["agent:tucker", "testing", "priority:medium"],
    "assignees": [],
    "milestone": null
  }
]
JSONEOF

# Import
node scripts/github/bulk-import-issues.js tasks.json
```

## Labels

### Agent Labels
- `agent:peter` - Product Management
- `agent:engrid` - Engineering
- `agent:tucker` - Testing/QA
- `agent:chuck` - CI/CD
- `agent:maya` - Mobile
- `agent:samantha` - Security
- (+ 8 more agents)

### Priority Labels
- `priority:critical` - System down, critical bug
- `priority:high` - Important work
- `priority:medium` - Normal priority
- `priority:low` - Nice to have

### Type Labels
- `type:bug` - Bug fix
- `type:feature` - New feature
- `type:docs` - Documentation
- `type:refactor` - Refactoring
- `type:test` - Testing
- `type:chore` - Maintenance

### Component Labels
- `component:auth` - Authentication
- `component:database` - Database
- `component:frontend` - Frontend
- `component:backend` - Backend
- `component:mobile` - Mobile
- `component:ci-cd` - CI/CD
- `component:security` - Security
- (+ more)

## Common Commands

### Issues
```bash
# Create
gh issue create --template bug_report.md

# List
gh issue list --label "agent:chuck"

# View
gh issue view 123

# Comment
gh issue comment 123 --body "Update here"

# Close
gh issue close 123
```

### Pull Requests
```bash
# Create
gh pr create --title "Title" --body "Closes #123"

# List
gh pr list

# View
gh pr view 456

# Merge (after approval)
gh pr merge 456 --squash
```

### Reports
```bash
# Status report
node scripts/github/sync-issue-status.js report

# Check stale issues
node scripts/github/sync-issue-status.js stale --dry-run

# Close stale issues
node scripts/github/sync-issue-status.js close-stale --dry-run
```

## Branch Naming Convention

**Format**: `type/GH-<number>-description`

**Examples**:
- `feature/GH-123-add-pet-profile`
- `bugfix/GH-456-fix-auth-redirect`
- `hotfix/GH-789-critical-data-loss`
- `docs/GH-012-update-readme`

## PR Requirements

Every PR must:
1. Reference a GitHub Issue (`Closes #123` or `Relates to #123`)
2. Follow branch naming convention
3. Pass all CI checks
4. Have required approvals (1 for develop, 2 for main)

## Quality Gates

**Chuck's Quality Gates**:
- All code changes tracked in GitHub Issues
- All PRs linked to issues
- All CI checks must pass
- Branch naming follows convention
- Proper labels and priorities set

**Remember**: Quality gates protect pet families. Every deployment matters.

## Scripts Location

All scripts are in `/Users/danielzeddr/PetForce/scripts/github/`:
- `bulk-import-issues.js` - Import multiple issues
- `sync-issue-status.js` - Status reports and stale checks
- `chuck-cli.js` - Interactive CLI
- `setup-labels.sh` - One-time label setup

## Example Workflow

```bash
# 1. Create issue
gh issue create --title "[CHUCK] Add health checks" \
  --body "Need /health endpoint" \
  --label "agent:chuck,priority:high"
# Created issue #123

# 2. Create branch
git checkout -b feature/GH-123-add-health-checks

# 3. Make changes
# ... code changes ...

# 4. Commit
git add .
git commit -m "feat: add health check endpoints"

# 5. Push and create PR
git push -u origin feature/GH-123-add-health-checks
gh pr create --title "Add health checks" --body "Closes #123"

# 6. Wait for CI and reviews
gh pr checks  # Check CI status
gh pr view    # View PR details

# 7. Merge (after approval)
gh pr merge --squash

# 8. Issue automatically closed and labeled "merged"
```

## Troubleshooting

### PR Check Failing: "Missing Issue Link"
**Fix**: Add `Closes #123` to PR description

### PR Check Failing: "Invalid Branch Name"
**Fix**: Rename branch:
```bash
git branch -m feature/GH-123-description
git push origin -u feature/GH-123-description
git push origin --delete old-branch-name
```

### Workflow Not Running
**Check**:
```bash
gh workflow list
gh run list --workflow=issue-automation.yml
gh run view <run-id> --log
```

## Next Steps

1. Run `./scripts/github/setup-labels.sh` to create labels
2. Import existing tasks using `bulk-import-issues.js`
3. Create issues for current work
4. Start using the PR workflow
5. Review weekly status report

## Support

Questions? Create an issue with `agent:chuck` label.

---

🛡️ Chuck - CI/CD Guardian
*Quality gates protect pet families. Every deployment matters.*
