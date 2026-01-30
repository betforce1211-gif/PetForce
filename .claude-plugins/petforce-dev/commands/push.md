# Push to GitHub - Chuck's Safe Push Process

This command ensures you follow Chuck's CI/CD best practices when pushing code to GitHub.

## Usage

```
/petforce-dev:push [commit-message]
```

If no commit message is provided, you'll be prompted to enter one.

## What This Command Does

### Pre-Push Checks (Must Pass):

1. **Run Tests** - All tests must pass
   ```bash
   cd packages/auth && npm test -- --run
   ```

2. **Run Linting** - Code must pass ESLint
   ```bash
   npm run lint
   ```

3. **Type Checking** - TypeScript must compile without errors
   ```bash
   npm run typecheck
   ```

4. **Check for Uncommitted Changes** - Ensures working directory is clean or ready to commit

### Git Operations:

5. **Stage Changes** - Adds all modified files
6. **Create Commit** - Using conventional commit format
7. **Pull Latest** - Fetches and rebases on current branch
8. **Push to GitHub** - Pushes with upstream tracking

### Post-Push Actions:

9. **Display Status** - Shows what was pushed and next steps
10. **Remind About PR** - If on feature branch, reminds to create PR

## Commit Message Format

The command enforces **Conventional Commits** format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**: feat, fix, docs, style, refactor, test, chore, perf

## Examples

```bash
# Simple push with message
/petforce-dev:push "feat(auth): add password reset functionality"

# Push with detailed message (will be prompted for body)
/petforce-dev:push

# Emergency push (skips some checks - use with caution)
/petforce-dev:push --skip-tests "hotfix: critical security patch"
```

## Safety Features

✅ **Tests must pass** - No push if tests fail
✅ **Linting must pass** - No push if ESLint errors
✅ **Type checking** - No push if TypeScript errors
✅ **Pull before push** - Ensures you have latest changes
✅ **Protected branches** - Won't push directly to main/develop
✅ **Conventional commits** - Enforces proper commit format

## Flags

- `--skip-tests` - Skip test run (use only for docs/config changes)
- `--skip-lint` - Skip linting (use with caution)
- `--force` - Force push (dangerous, requires confirmation)
- `--no-verify` - Skip git hooks (not recommended)

## Branch Protection

This command will **prevent** direct pushes to:
- `main` branch (must go through PR)
- `develop` branch (must go through PR)

Instead, it will:
1. Remind you to create a feature branch
2. Help you create a PR after pushing feature branch

## Error Handling

If any check fails, the command will:
1. Show clear error message
2. Provide fix suggestions
3. Allow you to fix and retry
4. Not push any code until all checks pass

## What Happens Next

After successful push:

1. **Feature Branch** → Reminds you to create PR
   ```bash
   gh pr create --base develop --title "Your Feature"
   ```

2. **Develop Branch** → Triggers staging deployment
   - GitHub Actions runs CI checks
   - Auto-deploys to https://staging.petforce.app
   - Runs smoke tests

3. **Main Branch** → Should never happen (blocked)
   - Command will prevent this
   - Tells you to create PR instead

## Co-Authoring with AI

The command automatically adds:
```
Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

To your commits when working with Claude.

## Troubleshooting

**"Tests failed"**
```bash
# Run tests locally first
cd packages/auth
npm test

# Fix failing tests, then retry push
```

**"Linting errors"**
```bash
# See linting errors
npm run lint

# Auto-fix most issues
npm run lint -- --fix

# Then retry push
```

**"Type errors"**
```bash
# See type errors
npm run typecheck

# Fix TypeScript issues, then retry
```

**"Merge conflicts"**
```bash
# The command will help you resolve conflicts
# Or manually:
git pull --rebase origin develop
# Fix conflicts
git rebase --continue
```

## Best Practices

✅ **DO**:
- Run `/petforce-dev:push` for every code change
- Write clear, descriptive commit messages
- Push to feature branches
- Create PRs for code review
- Let CI run before merging

❌ **DON'T**:
- Use `--force` unless absolutely necessary
- Skip tests for code changes
- Push directly to main/develop
- Commit secrets or .env files
- Use generic commit messages like "WIP" or "fix"

## Integration with CI/CD

After push, GitHub Actions will:

1. **Run CI Pipeline** (.github/workflows/ci.yml)
   - Install dependencies
   - Lint code
   - Type check
   - Run tests
   - Build apps
   - Security audit

2. **Deploy to Staging** (if develop branch)
   - Deploy to Vercel
   - Run database migrations
   - Run smoke tests
   - Notify Slack

3. **Show Status**
   ```bash
   # Check CI status
   gh run list --limit 5

   # Watch current run
   gh run watch
   ```

## Chuck's Wisdom

> "A failed CI check caught locally is 10x faster than one caught on GitHub."
> - Chuck, CI/CD Agent

Always run checks locally before pushing!

---

**Created by Chuck for PetForce CI/CD Best Practices**
