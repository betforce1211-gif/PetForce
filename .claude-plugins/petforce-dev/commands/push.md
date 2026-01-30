# Push to GitHub - Chuck's Automated Push Workflow

**ENTERPRISE-GRADE AUTOMATION** - This command runs Chuck's complete automated push workflow following Pro Git best practices.

## Usage

```
/petforce-dev:push
```

**That's it!** One command does everything.

## What This Command Does

Chuck's automated workflow handles the complete push process:

### Phase 1: Pre-Push Validation

1. **Branch Validation** - Ensures branch follows Git Flow naming conventions
2. **Change Analysis** - Intelligently analyzes your changes
3. **Message Generation** - Auto-generates conventional commit message
4. **Scope Detection** - Determines type and scope from changed files

### Phase 2: Quality Gates

5. **Linting** - Runs ESLint (BLOCKS on failure)
6. **Type Checking** - Validates TypeScript (BLOCKS on failure)
7. **Build** - Ensures project builds (BLOCKS on failure)
8. **Tests** - Tucker runs test suite (WARNS on failure)
9. **Security** - Samantha scans for vulnerabilities (WARNS on issues)

### Phase 3: Git Operations

10. **Auto-Rebase** - Pulls latest from base branch and rebases
11. **Commit** - Creates commit with generated message
12. **Push** - Pushes to remote with tracking

### Phase 4: PR & Auto-Merge

13. **Create PR** - Auto-creates PR with smart description
14. **Assign Reviewers** - Uses CODEOWNERS to assign reviewers
15. **Enable Auto-Merge** - Enables auto-merge when CI passes
16. **Squash Strategy** - Configures squash merge

## Implementation

When you run `/petforce-dev:push`, Claude executes:

```bash
npm run chuck:push
```

This invokes Chuck's automation script at `./scripts/chuck-push`.

## Commit Message Format

Chuck **automatically generates** conventional commit messages by analyzing your changes:

```
<type>(<scope>): <subject>

Refs: <ticket-id>
```

**Auto-detected types**: feat, fix, docs, style, refactor, test, chore, perf
**Auto-detected scopes**: Extracted from file paths

## Examples

```bash
# Automated push (recommended)
/petforce-dev:push

# Chuck will:
# - Detect you changed auth files → scope: "auth"
# - Detect new feature → type: "feat"
# - Generate: "feat(auth): add password reset functionality"
# - Run all quality gates
# - Create PR automatically
```

## Safety Features

✅ **Quality Gates** - Blocks push on lint/type/build failures
✅ **Agent Coordination** - Tucker (tests), Samantha (security), Thomas (docs)
✅ **Auto-Rollback** - Undoes changes if any gate fails
✅ **Protected Branches** - Prevents direct push to main/develop
✅ **Smart Rebase** - Handles conflicts with guidance
✅ **Conventional Commits** - Auto-generated in proper format
✅ **PR Automation** - Creates, assigns reviewers, enables auto-merge

## Environment Variables

Chuck respects these environment variables:

- `CHUCK_DRY_RUN=true` - Show what would happen without doing it
- `CHUCK_SKIP_TESTS=true` - Skip test execution (docs/config only)
- `CHUCK_SKIP_SECURITY=true` - Skip security scan
- `CHUCK_AUTO_CONFIRM=true` - Skip confirmation prompts

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

After successful push, Chuck automatically:

1. **Creates PR** with generated description including:
   - Summary of changes
   - List of commits
   - Test plan checklist
   - Links to tickets

2. **Assigns Reviewers** from CODEOWNERS:
   - Auth changes → Engrid + Samantha
   - Mobile changes → Maya
   - UI changes → Dexter
   - Docs changes → Thomas

3. **Enables Auto-Merge**:
   - PR will auto-merge when CI passes
   - Squash merge strategy
   - Branch auto-deleted after merge

4. **GitHub Actions Run**:
   - Full CI pipeline executes
   - Status reported to PR
   - Auto-merge triggers on success

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

## Agent Coordination

Chuck coordinates with the full PetForce team:

**Tucker (QA Guardian)**

- Runs test suite during quality gates
- Validates coverage thresholds
- Status: WARN mode (doesn't block yet)

**Samantha (Security Guardian)**

- Scans for vulnerabilities
- Detects secrets in code
- Status: WARN mode (doesn't block critical yet)

**Thomas (Documentation Guardian)**

- Checks README updates
- Validates CHANGELOG entries
- Status: ADVISORY mode

## Chuck's Wisdom

> "Quality gates protect pet families. Every deployment matters."
>
> - Chuck, CI/CD Guardian

One command. Zero errors. Production-ready code.

---

**Created by Chuck for PetForce CI/CD Best Practices**
