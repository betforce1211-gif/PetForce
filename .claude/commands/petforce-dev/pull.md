---
description: "Pull from GitHub with Chuck's safe pull process - protects local work"
---

# Chuck's Smart Pull from GitHub

You called `/petforce-dev:pull` - Chuck will safely pull the latest changes without losing your local work!

## What Chuck Will Do:

### Phase 1: Safety First - Protect Your Work

1. **Check Current Status**
   ```bash
   git status
   ```
   - See if you have uncommitted changes
   - Check which branch you're on
   - Identify what files would be affected

2. **Auto-Stash Uncommitted Changes** (if any)
   ```bash
   git stash push -m "Chuck: Auto-stash before pull"
   ```
   - Safely stores your uncommitted work
   - Prevents merge conflicts
   - Can be restored after pull

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

2. **Database Migration Files**
   ```
   🗄️ New migrations detected:
   - 20260125_add_email_confirmation.sql

   Run migrations?
     ✓ Yes, run now
     ✗ Skip for now
   ```

3. **Environment Variable Changes**
   ```
   🔧 .env.example updated

   New variables:
     + SMTP_HOST
     + SMTP_PORT

   Update your .env file accordingly.
   ```

### Phase 7: Summary

```
✅ Pull complete!

📊 Summary:
  Branch: main
  Commits pulled: 3
  Files updated: 15

🔄 Changes:
  Modified:
    - packages/auth/src/api/auth-api.ts
    - apps/web/src/App.tsx
  Added:
    - packages/auth/src/utils/logger.ts
    - docs/LOGGING.md

🚨 Action Required:
  - Run: npm install (dependencies changed)
  - Review: .env.example (new variables)

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

### Error: Cannot Pull (Uncommitted Changes)

```
❌ Cannot pull - uncommitted changes in working directory

Chuck detected changes in:
  - packages/auth/src/api/auth-api.ts (modified)
  - apps/web/src/App.tsx (modified)

Options:
  1. Stash and pull (safe) - /petforce-dev:pull
  2. Commit changes first
  3. Discard changes (dangerous): git reset --hard
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

- [ ] **Migrations Pending?**
  - Check for new SQL files in `supabase/migrations/`
  - Run migrations: `npm run db:migrate`

- [ ] **Environment Variables?**
  - Review `.env.example` for new variables
  - Update your `.env` file

- [ ] **Breaking Changes?**
  - Read commit messages for BREAKING CHANGE notes
  - Update your code accordingly

- [ ] **Tests Still Pass?**
  - Run `npm test` to catch integration issues
  - Run `npm run lint` to check code style

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

## When to Use

Use `/petforce-dev:pull` when:
- ✅ Starting work each day
- ✅ Before creating a new branch
- ✅ Before pushing your changes
- ✅ When team members pushed updates
- ✅ After PR merges
- ✅ Regularly (at least daily)

Don't pull when:
- ❌ In middle of complex changes (commit first)
- ❌ Tests are failing (fix first)
- ❌ During active debugging session
- ❌ Right before a demo (risky timing)

## Chuck's Wisdom

> "Pull early, pull often. But let me handle the complexity!"
> - Chuck, CI/CD Agent

> "Your work is precious. I'll protect it while keeping you up to date."
> - Chuck, CI/CD Agent

---

**Ready to pull? Just run:**
```bash
/petforce-dev:pull
```

Chuck will safely pull the latest changes and protect your work! 🔄
