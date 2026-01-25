# Pull from GitHub - Chuck's Safe Pull Process

This command ensures you safely pull changes from GitHub without losing local work.

## Usage

```
/petforce-dev:pull [branch-name]
```

If no branch is specified, pulls from the current branch's upstream.

## What This Command Does

### Pre-Pull Checks:

1. **Check for Uncommitted Changes** - Warns if you have unsaved work
2. **Stash Local Changes** (if any) - Safely saves your work
3. **Fetch Remote Updates** - Gets latest from GitHub
4. **Check for Conflicts** - Identifies potential merge conflicts

### Pull Operations:

5. **Pull Changes** - Using rebase strategy for clean history
6. **Resolve Conflicts** (if needed) - Helps you resolve merge conflicts
7. **Apply Stashed Changes** - Restores your local work
8. **Update Dependencies** - Runs `npm install` if package.json changed
9. **Run Migrations** - Applies database migrations if needed

### Post-Pull Actions:

10. **Display Changes** - Shows what was pulled
11. **Run Tests** - Optionally runs tests to verify everything works
12. **Show Status** - Displays current branch and sync status

## Pull Strategies

### Default: Rebase (Recommended)
```bash
git pull --rebase origin develop
```
- ✅ Clean, linear history
- ✅ Easier to follow commits
- ✅ No merge commits

### Merge (Alternative)
```bash
git pull origin develop
```
- Creates merge commit
- Preserves exact history
- Use for main/develop branches

## Examples

```bash
# Pull latest changes on current branch
/petforce-dev:pull

# Pull specific branch
/petforce-dev:pull develop

# Pull and run tests
/petforce-dev:pull --test

# Pull without updating dependencies
/petforce-dev:pull --skip-deps

# Pull from main branch
/petforce-dev:pull main
```

## Safety Features

✅ **Stash before pull** - Never lose uncommitted work
✅ **Conflict detection** - Identifies merge conflicts early
✅ **Automatic backup** - Creates backup branch before risky operations
✅ **Dependency updates** - Keeps node_modules in sync
✅ **Migration detection** - Runs new database migrations
✅ **Test verification** - Optionally verifies code still works

## Flags

- `--test` - Run tests after pulling
- `--skip-deps` - Skip npm install (faster for doc changes)
- `--skip-migrations` - Skip database migrations
- `--merge` - Use merge strategy instead of rebase
- `--force` - Force pull (dangerous, requires confirmation)

## Handling Uncommitted Changes

### Scenario 1: Clean Working Directory
```bash
✓ No uncommitted changes
→ Pulling directly
```

### Scenario 2: Uncommitted Changes (No Conflicts)
```bash
⚠ You have uncommitted changes
→ Stashing changes
→ Pulling updates
→ Applying stashed changes
✓ Done
```

### Scenario 3: Merge Conflicts
```bash
⚠ Merge conflicts detected:
  - src/file1.ts
  - src/file2.ts

→ Options:
  1. Resolve conflicts manually
  2. Abort and restore previous state
  3. Accept incoming changes
  4. Keep your changes
```

## Dependency Management

The command automatically detects if dependencies changed:

```bash
📦 package.json has changed
→ Running: npm install
→ This may take a moment...
✓ Dependencies updated
```

**Skip if not needed**:
```bash
/petforce-dev:pull --skip-deps
```

## Database Migrations

Detects new migration files:

```bash
🗄️ New migrations detected:
  - 20260124_add_user_preferences.sql
  - 20260124_add_analytics_tables.sql

→ Running migrations...
✓ Migrations applied successfully
```

**Skip migrations**:
```bash
/petforce-dev:pull --skip-migrations
```

## Conflict Resolution

### Automatic Resolution (Simple Conflicts)
```bash
✓ Auto-resolved conflicts:
  - package-lock.json (using newer version)
  - .env.example (merged both versions)
```

### Manual Resolution Required
```bash
⚠ Manual resolution needed:

File: src/auth/login.ts
<<<<<<< HEAD (Your changes)
const timeout = 5000;
=======
const timeout = 3000;
>>>>>>> origin/develop (Incoming changes)

Choose:
  1. Keep your changes (5000)
  2. Accept incoming (3000)
  3. Edit manually
  4. Abort pull
```

## Branch Sync Status

After pull, shows sync status:

```bash
Branch: feature/new-login
✓ Up to date with origin/develop

Commits ahead: 3
Commits behind: 0

Your changes (not on remote):
  - feat(auth): add login throttling
  - test(auth): add throttling tests
  - docs(auth): update login docs

Ready to push: Yes ✓
```

## Integration with CI/CD

After pulling, you might need to:

### 1. Update Environment Variables
```bash
⚠ .env.example was updated
→ Check if your .env needs updating
→ New variables:
  + SENTRY_DSN
  + ANALYTICS_KEY
```

### 2. Rebuild After Dependencies Change
```bash
📦 Dependencies changed
→ Recommendation: Rebuild app
→ Run: npm run build
```

### 3. Restart Dev Server
```bash
⚠ Config files changed
→ Recommendation: Restart dev server
→ Stop current server and run: npm run dev
```

## What Happens During Pull

### Phase 1: Safety Checks
```bash
[1/9] Checking for uncommitted changes...
[2/9] Stashing local work (if needed)...
[3/9] Fetching remote updates...
```

### Phase 2: Pull Operations
```bash
[4/9] Pulling changes with rebase...
[5/9] Checking for conflicts...
[6/9] Applying stashed changes...
```

### Phase 3: Post-Pull Updates
```bash
[7/9] Checking for dependency updates...
[8/9] Running database migrations (if needed)...
[9/9] Verifying working state...
```

### Final Status
```bash
✓ Pull completed successfully!

Summary:
  Files changed: 23
  Dependencies updated: 5
  Migrations applied: 2

Next steps:
  - Review changes: git log -5
  - Run tests: npm test
  - Restart dev server if running
```

## Common Workflows

### Daily Sync
```bash
# Start of day: sync with develop
/petforce-dev:pull develop

# Make changes...
# ...

# End of day: push changes
/petforce-dev:push "feat: implement feature X"
```

### Before Starting New Feature
```bash
# Sync with latest develop
/petforce-dev:pull develop

# Create feature branch
git checkout -b feature/new-feature

# Start coding...
```

### Updating Feature Branch
```bash
# On your feature branch
git checkout feature/my-feature

# Pull latest develop into feature branch
/petforce-dev:pull develop

# Resolve any conflicts
# Continue working...
```

## Troubleshooting

**"Merge conflicts"**
```bash
# Command will guide you through resolution
# Or manually:
git status # See conflicted files
# Edit files to resolve conflicts
git add .
git rebase --continue
```

**"Stash pop failed"**
```bash
# Your stashed changes conflict with pulled changes
# Options shown by command:
1. Manually merge stashed changes
2. Keep pulled version
3. Create new branch with your changes
```

**"npm install failed"**
```bash
# Try:
rm -rf node_modules package-lock.json
npm install

# Then:
/petforce-dev:pull --skip-deps
```

**"Migration failed"**
```bash
# Check migration error
# Manually run:
npx supabase db push

# Or skip for now:
/petforce-dev:pull --skip-migrations
```

## Best Practices

✅ **DO**:
- Pull before starting work each day
- Pull before creating new branch
- Pull develop into feature branches regularly
- Review changes after pulling (`git log -5`)
- Run tests after major pulls
- Restart dev server after config changes

❌ **DON'T**:
- Pull with uncommitted changes (command will stash)
- Use `--force` unless you understand consequences
- Ignore merge conflict warnings
- Skip dependency updates for code changes
- Forget to restart dev server

## Chuck's Wisdom

> "Pull early, pull often. It's easier to merge small changes than big ones."
> - Chuck, CI/CD Agent

Pull from develop at least once a day!

## Advanced Usage

### Pull Multiple Branches
```bash
# Update main and develop
/petforce-dev:pull main
/petforce-dev:pull develop

# Then merge develop into feature
git checkout feature/my-feature
git merge develop
```

### Pull with Test Verification
```bash
# Pull and automatically run tests
/petforce-dev:pull --test

# Output:
→ Pulling changes...
✓ Pull completed
→ Running tests...
✓ All tests passed
```

### Emergency Pull (Skip Everything)
```bash
# Only for emergencies!
/petforce-dev:pull --skip-deps --skip-migrations --skip-tests

# Or just use git directly:
git pull origin develop
```

## Integration with Other Commands

Works seamlessly with other petforce-dev commands:

```bash
# Pull → Make changes → Push workflow
/petforce-dev:pull develop
# ... make changes ...
/petforce-dev:push "feat: add new feature"

# Pull → Start feature → Push workflow
/petforce-dev:pull develop
/petforce-dev:feature "New user dashboard"
# ... implement feature ...
/petforce-dev:push "feat(dashboard): add user dashboard"
```

---

**Created by Chuck for PetForce CI/CD Best Practices**
