---
description: "Pull from GitHub with Chuck's safe pull process - protects local work"
---

# Chuck's Smart Pull from GitHub

You called `/petforce-dev:pull` - Chuck will safely pull the latest changes without losing your local work!

## What Chuck Will Do:

### Phase 1: Safety First - Protect Your Work

**Pre-Pull Validation:**

Chuck first checks your local setup:

1. **Git Hooks Installed?**

   ```bash
   ls -la .husky/
   ```

   - Verifies Husky hooks are installed
   - Ensures pre-commit, commit-msg, pre-push are present
   - Warns if hooks are missing or outdated

2. **Check Current Status**

   ```bash
   git status
   ```

   - See if you have uncommitted changes
   - Check which branch you're on
   - Identify what files would be affected
   - Verify you're not on a protected branch (main/develop)

3. **Auto-Stash Uncommitted Changes** (if any)
   ```bash
   git stash push -m "Chuck: Auto-stash before pull"
   ```

   - Safely stores your uncommitted work
   - Prevents merge conflicts
   - Can be restored after pull
   - Includes untracked files if needed

### Phase 2: Fetch Latest Changes

1. **Fetch from Remote**

   ```bash
   git fetch origin
   ```

   - Downloads latest commits
   - Shows what's new
   - Doesn't modify your files yet

2. **Show What's New**

   ```
   📥 New commits on origin/main:

   abc1234 - feat(auth): add email verification (2 hours ago)
   def5678 - fix(ui): correct button styling (5 hours ago)
   ghi9012 - docs: update API documentation (1 day ago)

   📊 Changes:
     +15 files changed
     +234 additions
     -67 deletions
   ```

### Phase 3: Smart Pull Strategy

Chuck uses **rebase** for a clean history:

```bash
git pull --rebase origin <current-branch>
```

**Why Rebase?**

- ✅ Clean, linear history
- ✅ No merge commits
- ✅ Easier to review changes
- ✅ Follows PetForce best practices

**Alternative (if conflicts are complex):**

```bash
git pull --no-rebase origin <current-branch>  # Merge strategy
```

### Phase 4: Handle Merge Conflicts (if any)

If conflicts occur, Chuck will:

1. **Show Conflicting Files**

   ```
   ⚠️ Merge conflicts detected:

   Conflicts in:
     ✗ packages/auth/src/api/auth-api.ts
     ✗ apps/web/src/App.tsx

   Options:
     1. Open files and resolve manually
     2. Abort pull and try later
     3. Use theirs (remote version)
     4. Use yours (local version)
   ```

2. **Help Resolve**
   - Show conflict markers location
   - Explain what changed remotely
   - Suggest resolution strategy

3. **Continue After Resolution**
   ```bash
   git add <resolved-files>
   git rebase --continue
   ```

### Phase 5: Restore Your Work

1. **Apply Stashed Changes** (if any were stashed)

   ```bash
   git stash pop
   ```

2. **Handle Stash Conflicts**

   ```
   ⚠️ Stash conflicts with pulled changes:

   Conflicts in:
     ✗ packages/auth/src/api/auth-api.ts

   Your stashed changes conflict with remote updates.

   Options:
     1. Resolve manually (recommended)
     2. Keep remote version (discard your changes)
     3. Keep your version (may break things)
   ```

### Phase 6: Post-Pull Actions

Chuck automatically checks for:

1. **Package.json Changes**

   ```
   📦 Dependencies changed - running install:
   npm install
   ```

2. **Git Hooks Updates** (Husky)

   ```
   🪝 Husky hooks updated

   Changes detected in:
     - .husky/pre-commit (added lint-staged)
     - .husky/commit-msg (added commitlint)

   Re-running: npm run prepare
   ✅ Hooks reinstalled successfully
   ```

3. **GitHub Actions Workflows**

   ```
   ⚙️ CI/CD workflows updated

   New/changed workflows:
     + .github/workflows/release.yml
     + .github/workflows/security-scan.yml

   These will run on your next push.
   ```

4. **CODEOWNERS Changes**

   ```
   👥 CODEOWNERS updated

   New ownership rules:
     + packages/analytics/** → @agent-ana
     + docs/LOGGING.md → @agent-larry

   Your PRs may have different reviewers now.
   ```

5. **Database Migration Files**

   ```
   🗄️ New migrations detected:
   - 20260125_add_email_confirmation.sql
   - 20260127_add_user_preferences.sql

   Run migrations?
     ✓ Yes, run now
     ✗ Skip for now
   ```

6. **Environment Variable Changes**

   ```
   🔧 .env.example updated

   New variables:
     + SMTP_HOST
     + SMTP_PORT
     + EMAIL_VERIFICATION_ENABLED

   Update your .env file accordingly.
   See: docs/ENVIRONMENT_VARIABLES.md
   ```

7. **Breaking Changes Warning**

   ```
   ⚠️ BREAKING CHANGES detected in commits

   Commits with breaking changes:
     - abc1234: feat(api)!: redesign authentication endpoints

   Breaking change details:
     "Authentication endpoints now return JWT tokens
      instead of session cookies."

   📖 Migration guide: docs/MIGRATION_v2.0.md
   ⚠️ Action required before continuing development
   ```

### Phase 7: Understanding What Changed

Chuck analyzes the pulled commits and shows you:

**Commit Analysis:**

```
📝 Pulled Commits (by type):

Features (2):
  ✨ feat(auth): add email verification (Engrid)
  ✨ feat(dashboard): add user metrics (Ana)

Bug Fixes (1):
  🐛 fix(ui): correct button alignment (Maya)

Documentation (1):
  📚 docs: update API documentation (Thomas)

Tests (1):
  🧪 test(auth): add verification tests (Tucker)

Total: 5 commits from 5 agents
```

**Code Ownership Impact:**

```
👥 Changed code owned by:
  @agent-engrid (packages/auth/**)
  @agent-maya (apps/web/src/components/**)
  @agent-ana (packages/analytics/**)

If you modify these areas, they'll review your PR.
```

**Automated Release (if on main):**

```
🏷️ New Release Pulled: v1.5.0

Version: 1.4.2 → 1.5.0 (minor bump)
Released: 2 hours ago
Changelog: CHANGELOG.md updated

What's New:
  - Email verification feature
  - User metrics dashboard
  - Button alignment fixes

View full release:
  gh release view v1.5.0
```

### Phase 8: Summary

```
✅ Pull complete!

📊 Summary:
  Branch: main
  Commits pulled: 5
  Files updated: 23
  Version: v1.5.0 (was v1.4.2)

🔄 Changes:
  Modified:
    - packages/auth/src/api/auth-api.ts
    - apps/web/src/App.tsx
    - packages/analytics/src/metrics.ts
  Added:
    - packages/auth/src/utils/logger.ts
    - docs/LOGGING.md
    - docs/MIGRATION_v2.0.md

🚨 Action Required:
  - Run: npm install (dependencies changed)
  - Review: .env.example (new variables)
  - Read: docs/MIGRATION_v2.0.md (breaking changes)
  - Run: npm test (verify nothing broke)

🪝 Git Infrastructure:
  - Husky hooks reinstalled
  - CODEOWNERS updated
  - CI workflows updated

✅ Your local changes: Restored from stash
```

## Common Scenarios

### Scenario 1: No Local Changes

```
You: /petforce-dev:pull

Chuck:
✓ No uncommitted changes
✓ Fetching from origin...
✓ Pulling with rebase...
✓ 3 commits pulled successfully

📁 Files updated: 5
No action required - you're up to date!
```

### Scenario 2: Uncommitted Changes (No Conflicts)

```
You: /petforce-dev:pull

Chuck:
⚠️ You have uncommitted changes
✓ Stashing changes...
✓ Pulling with rebase...
✓ Restoring your changes...
✓ Success!

Your work is preserved and up to date.
```

### Scenario 3: Uncommitted Changes + Conflicts

```
You: /petforce-dev:pull

Chuck:
⚠️ You have uncommitted changes
✓ Stashing changes...
✓ Pulling with rebase...
✓ Attempting to restore stash...
❌ Conflicts detected in stash

Conflicts in:
  - packages/auth/src/api/auth-api.ts (you changed lines 45-60)

Options:
  1. Resolve conflicts now (recommended)
  2. Keep stash for later (git stash apply stash@{0})
  3. Discard your changes (not recommended)
```

### Scenario 4: Diverged Branches

```
You: /petforce-dev:pull

Chuck:
⚠️ Your branch has diverged from origin/feature/auth

  Your commits (not on remote):
    - abc1234: "work in progress"
    - def5678: "fix bug"

  Remote commits (not local):
    - ghi9012: "feat: add logging"
    - jkl3456: "fix: correct types"

Strategy options:
  1. Rebase (recommended) - replay your commits on top
  2. Merge - create merge commit
  3. Reset - discard local commits (dangerous!)

Choose: 1
```

### Scenario 5: Behind Remote (Fast-Forward)

```
You: /petforce-dev:pull

Chuck:
✓ Your branch is behind origin/main by 5 commits
✓ Fast-forward pull...
✓ Success!

📥 Pulled commits:
  - abc1234: feat(auth): add verification
  - def5678: fix(ui): button styles
  - ghi9012: docs: update API docs
  (and 2 more)

All caught up!
```

## Protected Branches

Chuck is extra careful with main/develop:

```
Current branch: main

⚠️ You're on a protected branch!

Chuck's recommendation:
  1. Pull latest changes ✓
  2. Create feature branch for your work
  3. Never commit directly to main

Proceed with pull?
  ✓ Yes, pull latest
  ✗ Cancel
```

## Flags (Optional)

```bash
# Use merge instead of rebase
/petforce-dev:pull --no-rebase

# Force pull (discards local changes - requires confirmation)
/petforce-dev:pull --force

# Pull without auto-stash (fails if uncommitted changes)
/petforce-dev:pull --no-autostash

# Skip post-pull actions (migrations, npm install)
/petforce-dev:pull --skip-post-actions

# Quiet mode (minimal output)
/petforce-dev:pull --quiet
```

## Error Handling

### Error: Git Hooks Not Installed

```
⚠️ Husky hooks not found

Chuck detected missing Git hooks:
  ✗ .husky/pre-commit
  ✗ .husky/commit-msg
  ✗ .husky/pre-push

This may be a fresh clone. Install hooks with:
  npm install
  npm run prepare

Or continue pull without hooks (not recommended).
```

### Error: Cannot Pull (Uncommitted Changes)

```
❌ Cannot pull - uncommitted changes in working directory

Chuck detected changes in:
  - packages/auth/src/api/auth-api.ts (modified)
  - apps/web/src/App.tsx (modified)

Options:
  1. Stash and pull (safe) - /petforce-dev:pull
  2. Commit changes first (recommended if ready)
  3. Discard changes (dangerous): git reset --hard

Recommendation: Option 1 (Chuck will auto-stash)
```

### Error: Branch Diverged Significantly

```
⚠️ Your branch has diverged from origin/main

Local commits not on remote: 47
Remote commits not on local: 123

This is highly unusual. Possible causes:
  1. You're on the wrong branch
  2. Force push happened on remote (rare)
  3. Repository corruption

Recommended action:
  1. Backup your work: git branch backup/$(date +%s)
  2. Check with team about force pushes
  3. Consider fresh clone if corrupted

Do NOT proceed without understanding why.
```

### Error: Merge Conflict

```
❌ Merge conflict during rebase

Conflicts in:
  ✗ packages/auth/src/api/auth-api.ts

<<<<<<< HEAD (yours)
  const result = await login({ email, password });
=======
  const response = await authenticate({ email, password });
>>>>>>> abc1234 (remote)

To resolve:
  1. Edit file and remove conflict markers
  2. Keep the version you want (or merge both)
  3. Stage resolved file: git add <file>
  4. Continue: git rebase --continue

Or abort: git rebase --abort
```

### Error: Network Issues

```
❌ Failed to fetch from remote

Error: Unable to connect to github.com
Check your network connection and try again.

Troubleshooting:
  1. Check internet connection
  2. Verify GitHub is accessible
  3. Check SSH keys: ssh -T git@github.com
  4. Try again in a moment
```

### Error: Diverged Too Much

```
⚠️ Your branch has diverged significantly

Your commits: 23
Remote commits: 45

This is unusual. Recommended actions:
  1. Verify you're on the right branch
  2. Consider resetting to remote: git reset --hard origin/<branch>
  3. Or create a backup branch first:
     git branch backup/<branch>-$(date +%s)
     git reset --hard origin/<branch>

Proceed with caution!
```

## Post-Pull Checklist

After Chuck pulls successfully:

- [ ] **Dependencies Updated?**
  - Run `npm install` if package.json changed
  - Run `npm test` to verify everything works

- [ ] **Git Hooks Updated?**
  - Run `npm run prepare` to reinstall hooks
  - Verify with `ls -la .husky/`

- [ ] **Migrations Pending?**
  - Check for new SQL files in `supabase/migrations/`
  - Run migrations: `npm run db:migrate`

- [ ] **Environment Variables?**
  - Review `.env.example` for new variables
  - Update your `.env` file
  - Check `.env.local` for development overrides

- [ ] **Breaking Changes?**
  - Read commit messages for BREAKING CHANGE notes
  - Check for migration guides in `docs/`
  - Update your code accordingly

- [ ] **CODEOWNERS Changes?**
  - Review `.github/CODEOWNERS` for new ownership rules
  - Note which agents will review your PRs

- [ ] **CI/CD Workflows Updated?**
  - Check `.github/workflows/` for new actions
  - Understand new quality gates or checks

- [ ] **Tests Still Pass?**
  - Run `npm test` to catch integration issues
  - Run `npm run lint` to check code style
  - Run `npm run typecheck` for TypeScript

- [ ] **Release Notes?**
  - Read `CHANGELOG.md` for latest changes
  - Check `gh release view` for detailed notes

## Chuck CLI Tool Integration

Chuck is available as a CLI tool for quick Git operations:

### Verify Git Setup

```bash
scripts/verify-git-setup

# Checks:
#   ✓ Husky hooks installed
#   ✓ Commitlint configured
#   ✓ CODEOWNERS present
#   ✓ Branch protection (if admin)
#   ✓ GitHub Actions workflows
```

### Pull with Chuck CLI

```bash
scripts/chuck pull

# Interactive pull with:
#   - Auto-stash uncommitted changes
#   - Smart conflict resolution
#   - Post-pull validation
#   - Breaking change detection
```

### Sync with Remote

```bash
scripts/chuck sync

# Full sync operation:
#   1. Stash changes
#   2. Fetch all remotes
#   3. Prune deleted branches
#   4. Pull with rebase
#   5. Restore stash
#   6. Run post-pull checks
```

### View What's New

```bash
scripts/chuck whats-new

# Shows:
#   - Commits since last pull
#   - New features by agent
#   - Bug fixes
#   - Breaking changes
#   - New releases
```

## Chuck's Pull Workflow

```mermaid
graph TD
    A[/petforce-dev:pull] --> B{Uncommitted changes?}
    B -->|Yes| C[Stash changes]
    B -->|No| D[Fetch from remote]
    C --> D
    D --> E{Branch diverged?}
    E -->|No| F[Fast-forward pull]
    E -->|Yes| G[Rebase on remote]
    F --> H{Stash exists?}
    G --> I{Conflicts?}
    I -->|Yes| J[Help resolve]
    I -->|No| H
    J --> H
    H -->|Yes| K[Restore stash]
    H -->|No| L[Check post-pull actions]
    K --> M{Stash conflicts?}
    M -->|Yes| N[Help resolve stash]
    M -->|No| L
    N --> L
    L --> O{Dependencies changed?}
    O -->|Yes| P[Run npm install]
    O -->|No| Q{Migrations detected?}
    P --> Q
    Q -->|Yes| R[Prompt to run migrations]
    Q -->|No| S[Show summary]
    R --> S
    S --> T[✅ Done!]
```

## Chuck's Safety Guarantees

Chuck ensures:

✅ **No Data Loss**

- Your uncommitted work is always stashed
- Stash is kept even if pull fails
- You can recover from any state

✅ **Clear Communication**

- Shows exactly what changed
- Explains what actions are needed
- Asks before destructive operations

✅ **Conflict Resolution Help**

- Identifies conflict locations
- Suggests resolution strategies
- Guides through resolution process

✅ **Post-Pull Validation**

- Checks for dependency updates
- Detects database migrations
- Alerts about environment changes

## Understanding Releases (Semantic Versioning)

When you pull from `main`, you may get new releases:

### Version Numbers Explained

**Format: MAJOR.MINOR.PATCH** (e.g., 2.3.5)

- **PATCH (2.3.5 → 2.3.6):** Bug fixes, docs, performance
  - Safe to update - no breaking changes
  - Usually automatic updates in dependencies

- **MINOR (2.3.5 → 2.4.0):** New features (backwards compatible)
  - Safe to update - new features available
  - Existing code continues to work

- **MAJOR (2.3.5 → 3.0.0):** Breaking changes
  - ⚠️ Requires code updates
  - Read migration guide before updating
  - May break existing integrations

### After Pulling a New Release

**Patch Update (1.5.2 → 1.5.3):**

```
📦 Pulled: v1.5.3 (patch)

Changes:
  - Bug fixes only
  - No action required
  - Tests should still pass

Action: npm test (verify)
```

**Minor Update (1.5.3 → 1.6.0):**

```
📦 Pulled: v1.6.0 (minor)

New Features:
  - Email verification system
  - User analytics dashboard

Action:
  ✓ Read CHANGELOG.md
  ✓ Try new features (optional)
  ✓ Update docs if relevant
```

**Major Update (1.6.0 → 2.0.0):**

```
🚨 Pulled: v2.0.0 (MAJOR - BREAKING CHANGES)

Breaking Changes:
  - Authentication now uses JWT tokens (was sessions)
  - API endpoints restructured
  - Database schema updated

⚠️ REQUIRED ACTIONS:
  1. Read: docs/MIGRATION_v2.0.md
  2. Update: your authentication code
  3. Run: npm run db:migrate
  4. Test: npm test (may have failures)
  5. Update: .env variables (see .env.example)

DO NOT PROCEED WITHOUT READING MIGRATION GUIDE
```

### Viewing Release History

```bash
# List all releases
gh release list

# View specific release
gh release view v2.0.0

# Read changelog
cat CHANGELOG.md

# Compare versions
git log v1.6.0..v2.0.0 --oneline
```

## When to Use

Use `/petforce-dev:pull` when:

- ✅ Starting work each day (morning routine)
- ✅ Before creating a new branch
- ✅ Before pushing your changes (avoid conflicts)
- ✅ When team members pushed updates
- ✅ After PR merges to main
- ✅ After new releases are published
- ✅ Regularly (at least daily)
- ✅ Before important meetings/demos (be up to date)

Don't pull when:

- ❌ In middle of complex changes (commit first)
- ❌ Tests are failing (fix first, then pull)
- ❌ During active debugging session
- ❌ Right before a demo (risky timing - pull earlier)
- ❌ When you have merge conflicts to resolve
- ❌ During a production incident (coordinate with team)

## Git Workflow Resources

Chuck has created comprehensive documentation for PetForce's Git workflow:

📚 **Core Documentation:**

- `docs/GIT_WORKFLOW.md` - Complete Git workflow guide
- `docs/BRANCH_STRATEGY.md` - Branching model and strategies
- `docs/COMMIT_STANDARDS.md` - Conventional commits guide
- `docs/CODE_REVIEW.md` - PR and code review process
- `docs/RELEASE_PROCESS.md` - Automated releases explained

🛠️ **Technical Setup:**

- `docs/GIT_SETUP.md` - Git infrastructure setup
- `docs/BRANCH_PROTECTION.md` - Branch protection rules
- `docs/CODEOWNERS_GUIDE.md` - Code ownership system

📖 **Migration Guides:**

- `docs/MIGRATION_v*.md` - Version-specific migration guides
- `CHANGELOG.md` - Full release history

💡 **Pro Tips:**

```bash
# Quick help
scripts/chuck help

# Verify your Git setup
scripts/verify-git-setup

# View what's new since last pull
scripts/chuck whats-new

# Check for breaking changes
git log --grep="BREAKING CHANGE" origin/main..HEAD
```

## Chuck's Wisdom

> "Pull early, pull often. But let me handle the complexity!"
>
> - Chuck, CI/CD Agent

> "Your work is precious. I'll protect it while keeping you up to date."
>
> - Chuck, CI/CD Agent

> "Understanding what changed is as important as pulling the changes."
>
> - Chuck, CI/CD Agent

> "Breaking changes deserve your full attention. Always read the migration guide."
>
> - Chuck, CI/CD Agent

---

**Ready to pull? Just run:**

```bash
/petforce-dev:pull
```

Chuck will safely pull the latest changes and protect your work! 🔄
