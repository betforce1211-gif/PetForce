# GitHub Issues Auto-Sync

This script is automatically called by `/petforce-dev:push` to create GitHub Issues from your commits.

## How It Works

When you push code using `/petforce-dev:push`, Chuck will:

1. Analyze your commit message
2. Extract the type (feat, fix, refactor, docs, etc.)
3. Extract the scope (auth, mobile, api, etc.)
4. Create appropriate GitHub Issues automatically

## What Gets Created

### Feature Commits (`feat`)
```bash
Commit: "feat(auth): add email verification"
Creates: Issue #123 "[FEATURE] Add email verification"
Labels: enhancement, roadmap, agent:engrid, component:auth, priority:medium
```

### Bug Fix Commits (`fix`)
```bash
Commit: "fix(mobile): correct login timeout"
Creates: Issue #124 "[BUG] Correct login timeout"
Labels: bug, agent:maya, component:mobile, priority:high
```

### Refactoring Commits (`refactor`)
```bash
Commit: "refactor(database): optimize query performance"
Creates: Issue #125 "[TECH DEBT] Optimize query performance"
Labels: type:refactor, agent:buck, component:database, priority:medium
```

### Documentation Commits (`docs`)
```bash
Commit: "docs: update API documentation"
Creates: Issue #126 "[DOCS] Update API documentation"
Labels: documentation, agent:thomas, priority:low
```

## Scope to Agent Mapping

| Scope | Agent | Component |
|-------|-------|-----------|
| `auth` | engrid | auth |
| `mobile` | maya | mobile |
| `web` | engrid | frontend |
| `ui`, `components` | dexter | frontend |
| `api` | axel | backend |
| `database`, `db` | buck | database |
| `ci`, `cicd` | chuck | ci-cd |
| `docs` | thomas | documentation |
| `test`, `testing` | tucker | test |
| `security` | samantha | security |
| `monitoring`, `logging` | larry | observability |
| `analytics` | ana | analytics |
| `infrastructure`, `infra` | isabel | infrastructure |

## Skipped Commit Types

These types do NOT create issues:
- `test` - Tests tracked via coverage
- `chore` - No roadmap item needed
- `style` - Formatting changes
- `perf` - Performance improvements (unless significant)

## Manual Usage

If you want to run this script manually:

```bash
# Syntax
./scripts/github/sync-bugs-and-roadmap.sh "<commit-msg>" "<commit-sha>" "<branch>"

# Example
./scripts/github/sync-bugs-and-roadmap.sh \
  "feat(auth): add magic link authentication" \
  "abc1234def" \
  "feature/magic-link"
```

## Disabling Auto-Sync

If you don't want issues created for a specific push:

```bash
/petforce-dev:push --skip-issues
```

## Issue Format

All auto-created issues include:

1. **Title**: `[TYPE] Description` (e.g., `[FEATURE] Add magic link`)
2. **Body**:
   - Description
   - Commit SHA reference
   - Branch name
   - Scope
   - Checklist for follow-up actions
3. **Labels**:
   - Type label (enhancement, bug, etc.)
   - Agent label (who owns it)
   - Component label (what part of system)
   - Priority label (critical, high, medium, low)
4. **Footer**: "Auto-created by /petforce-dev:push"

## Example Issue Created

**Title**: `[FEATURE] Add email verification`

**Body**:
```markdown
## Feature

This feature was implemented in commit: abc1234def

### Commit Message
feat(auth): add email verification

- Created EmailVerificationPendingPage component
- Added auto-polling to detect verification
- Includes resend button with cooldown

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>

### Branch
`feature/email-verification`

### Scope
`auth`

### Next Steps
- [ ] Create tests if not included
- [ ] Update documentation
- [ ] Add to release notes
- [ ] Monitor after deployment

---
*Auto-created by /petforce-dev:push*
```

**Labels**: `enhancement`, `roadmap`, `agent:engrid`, `component:auth`, `priority:medium`

## Benefits

1. **Automatic Tracking**: Every significant change gets tracked
2. **External Visibility**: Other teams can see what was done
3. **Roadmap Updates**: Features automatically added to roadmap
4. **Bug Database**: All fixes are documented
5. **Agent Assignment**: Issues auto-assigned to responsible agent
6. **Traceability**: Direct link from issue to commit

## Troubleshooting

### Issue Not Created

Check:
1. Was commit type recognized? (feat, fix, refactor, docs)
2. Did you use `--skip-issues` flag?
3. Is GitHub CLI authenticated? Run `gh auth status`
4. Do labels exist? Run `gh label list`

### Wrong Agent Assigned

The script uses scope to determine agent:
- Update your commit message scope to match correct area
- Or manually reassign issue after creation

### Wrong Labels

Labels are based on:
- Commit type (feat → enhancement, fix → bug)
- Commit scope (auth → agent:engrid, mobile → agent:maya)
- Automatic priority assignment

You can manually edit labels after creation.

## Integration with Push Command

The `/petforce-dev:push` command calls this script automatically:

```
Phase 4: Create GitHub Issues
└── Calls: ./scripts/github/sync-bugs-and-roadmap.sh

Phase 5: Push to GitHub
└── git push origin <branch>
```

## Future Enhancements

Potential additions:
- Auto-close issues when related PR merges
- Link issues to milestones based on branch
- Create epic issues for large features
- Sync issue status with deployment status
- Notify agents via Slack when assigned
