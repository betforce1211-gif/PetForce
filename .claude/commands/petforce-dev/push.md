---
description: "Push to GitHub with Chuck's safe push process - auto-generates commit message"
---

# Chuck's Smart Push to GitHub

You called `/petforce-dev:push` - Chuck will analyze your changes and create the perfect commit message!

## What Chuck Will Do:

### Phase 1: Pre-Push Safety Checks

**Git Hooks Run Automatically (Husky):**

Before you even get to this command, if you ran `git commit`, these hooks already ran:

1. **Pre-Commit Hook** (`.husky/pre-commit`)
   - Runs `lint-staged` on staged files only
   - Formats code with Prettier
   - Runs ESLint with auto-fix
   - Fast and efficient - only checks changed files

2. **Commit-Msg Hook** (`.husky/commit-msg`)
   - Validates commit message with commitlint
   - Enforces Conventional Commits format
   - Rejects invalid type, scope, or format
   - Ensures consistency across all commits

**Chuck's Additional Checks:**

1. **Analyze Changed Files**
   - Look at what you modified
   - Understand the scope and impact
   - Determine the type of change
   - Identify which agents own the changed files (via CODEOWNERS)

2. **Run Tests** (MUST PASS)

   ```bash
   cd packages/auth && npm test -- --run
   ```

3. **Run Linting** (MUST PASS)

   ```bash
   npm run lint
   ```

4. **Type Check** (MUST PASS)

   ```bash
   npm run typecheck
   ```

5. **Check Branch Protection Rules**
   - Verify you're not on main/develop
   - Ensure all required status checks will pass
   - Validate that auto-assigned reviewers are available

### Phase 2: Smart Commit Message Generation

Chuck will analyze your changes and generate a commit message following **Conventional Commits**:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types Chuck Uses**:

- `feat` - New feature or functionality
- `fix` - Bug fix
- `refactor` - Code refactoring (no behavior change)
- `test` - Adding or updating tests
- `docs` - Documentation changes
- `style` - Code style/formatting (no logic change)
- `chore` - Build, dependencies, config
- `perf` - Performance improvements

**How Chuck Decides**:

1. Reads `git diff` to see what changed
2. Looks at file paths to determine scope (auth, ui, api, etc.)
3. Analyzes code changes to understand intent
4. Checks for new files, deletions, modifications
5. Looks for test files to determine if it's a test change
6. Generates clear, descriptive message

**Example Generated Messages**:

```
feat(auth): add email verification with auto-detection

- Created EmailVerificationPendingPage component
- Added auto-polling every 10 seconds to detect verification
- Includes resend button with 5-minute cooldown
- Updates useAuth hook to return confirmation state

Addresses user feedback about unclear verification flow

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

```
fix(auth): reject login for unconfirmed users

Previously unconfirmed users could sometimes login. Now
explicitly checks email_confirmed_at field and returns
EMAIL_NOT_CONFIRMED error code.

Fixes #123

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

```
test(auth): add comprehensive auth API tests

Added 16 unit tests covering:
- Registration with unconfirmed state
- Login rejection for unconfirmed users
- Error handling and logging validation

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### Phase 3: Review and Confirm

Chuck will show you the generated message and ask:

```
📝 Chuck generated this commit message:

feat(dashboard): add user metrics dashboard

- Created AuthMetricsDashboard component
- Real-time metrics collection for auth events
- Funnel visualization with progress bars
- Alert system for low confirmation rates

This implements the monitoring requirements from Larry's spec.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>

✓ Approve and push
✎ Edit message
✗ Cancel
```

### Phase 4: Create GitHub Issues (NEW!)

Before pushing, Chuck will analyze your changes and create GitHub Issues for:

1. **Bugs Fixed** - If commit message includes "fix" or "fixes"
   - Creates issue: `[BUG] <description>`
   - Labels: `bug`, priority based on scope, relevant agent
   - Links to commit in description

2. **Features Added** - If commit message includes "feat"
   - Creates issue: `[FEATURE] <description>`
   - Labels: `enhancement`, `roadmap`, relevant agent
   - Adds to Product Roadmap project

3. **Technical Debt** - If commit message includes "refactor"
   - Creates issue: `[TECH DEBT] <description>`
   - Labels: `type:refactor`, relevant agent
   - Adds to Sprint backlog

4. **Documentation** - If commit message includes "docs"
   - Creates issue: `[DOCS] <description>`
   - Labels: `documentation`, `agent:thomas`

**Example**:

```
Your commit: "fix(auth): reject login for unconfirmed users"

Chuck creates:
✅ Issue #145: [BUG] Login allowed for unconfirmed users
   Labels: bug, priority:high, agent:engrid, component:auth
   Linked: Closes with commit abc1234
```

### Phase 5: Push to GitHub

If approved:

1. **Pull Latest** - Fetches and rebases on current branch
2. **Create Commit** - Using the generated message
3. **Create GitHub Issues** - For bugs/features/tech debt
4. **Push** - With upstream tracking
5. **Show Status** - What was pushed, issues created, next steps

### Phase 6: Auto-Reviewer Assignment (CODEOWNERS)

When you create a pull request, GitHub automatically assigns reviewers based on CODEOWNERS:

**Chuck Analyzes Changed Files:**

```
Modified files:
  packages/auth/src/api/auth-api.ts
  apps/web/src/features/auth/AuthForm.tsx
  apps/mobile/src/screens/AuthScreen.tsx

Auto-assigned reviewers (via CODEOWNERS):
  👤 @agent-engrid (owns packages/auth/*)
  👤 @agent-maya (owns apps/mobile/*)
  👤 @agent-dexter (owns UI components)
```

**CODEOWNERS Coverage:**

- **Authentication:** Engrid + Security (Samantha)
- **Mobile:** Maya
- **Web UI:** Dexter
- **Database:** Buck
- **Infrastructure:** Isabel
- **Documentation:** Thomas
- **Analytics:** Ana
- **Logging:** Larry

**Branch Protection Will Require:**

- ✅ At least 1 approval from code owner
- ✅ All status checks pass (CI/CD)
- ✅ No merge conflicts
- ✅ Linear history (no merge commits)

### Phase 7: Automated CI/CD (GitHub Actions)

After you push, GitHub Actions automatically run:

1. **Quality Gates** (`.github/workflows/ci.yml`)

   ```yaml
   ✓ Lint code
   ✓ Type check
   ✓ Run unit tests
   ✓ Run integration tests
   ✓ Build all apps
   ✓ Check code coverage
   ```

2. **Security Scan** (`.github/workflows/security-scan.yml`)

   ```yaml
   ✓ Scan dependencies for vulnerabilities
   ✓ Check for secrets in code
   ✓ Run SAST analysis
   ✓ Validate licenses
   ```

3. **If Merged to Main:** Automated Release (`.github/workflows/release.yml`)
   ```yaml
   ✓ Analyze commits since last release
   ✓ Determine version bump (major/minor/patch)
   ✓ Generate CHANGELOG.md
   ✓ Create GitHub release
   ✓ Tag with semantic version
   ```

Chuck shows you the CI status:

```
🚀 CI/CD Pipeline Started:
   URL: https://github.com/org/petforce/actions/runs/12345

📋 Status Checks Running:
   ⏳ Lint & Format
   ⏳ Type Check
   ⏳ Unit Tests
   ⏳ Integration Tests
   ⏳ Security Scan

Track progress: gh run watch
```

## What If You're on Main/Develop?

Chuck will **stop you** and say:

```
🚫 Direct push to 'main' not allowed!

Chuck's CI/CD Best Practice:
  ✓ Create a feature branch
  ✓ Push changes to feature branch
  ✓ Create pull request for review

Would you like me to:
  1. Create feature branch from your changes
  2. Cancel push
```

## Handling Different Scenarios

### Scenario 1: Single File Change

```
You modified: src/auth/login.ts

Chuck analyzes and generates:
fix(auth): correct login timeout validation
```

### Scenario 2: Multiple Related Files

```
You modified:
- src/components/Button.tsx
- src/components/Input.tsx
- src/components/Card.tsx

Chuck analyzes and generates:
style(ui): update component styling for consistency
```

### Scenario 3: New Feature

```
You added:
- src/features/dashboard/
- src/features/dashboard/Dashboard.tsx
- src/features/dashboard/metrics.ts
- tests/dashboard.test.ts

Chuck analyzes and generates:
feat(dashboard): add user analytics dashboard

Created new dashboard feature with:
- Real-time metrics display
- Chart visualizations
- Comprehensive test coverage
```

### Scenario 4: Test-Only Changes

```
You modified:
- tests/auth.test.ts (added 10 tests)

Chuck analyzes and generates:
test(auth): add edge case coverage for email verification
```

### Scenario 5: Documentation

```
You modified:
- README.md
- docs/API.md

Chuck analyzes and generates:
docs: update API documentation and README
```

### Scenario 6: Dependencies

```
You modified:
- package.json
- package-lock.json

Chuck analyzes and generates:
chore(deps): upgrade dependencies

Updated:
- vitest: 4.0.18 → 4.1.0
- typescript: 5.3.0 → 5.4.0
```

## Chuck CLI Tool Integration

Chuck is now available as a standalone CLI tool for quick Git operations:

### Create Feature Branch

```bash
# From the chuck CLI
scripts/chuck feature "add-email-verification"

# Creates: feature/add-email-verification
# Tracks: origin/feature/add-email-verification
```

### Quick Commit Helper

```bash
scripts/chuck commit

# Interactive prompts:
#   Type: [feat, fix, docs, style, refactor, test, chore, perf]
#   Scope: [auth, ui, api, database, mobile, web, docs]
#   Subject: Brief description
#   Body: (optional) Detailed description
```

### Create Pull Request

```bash
scripts/chuck pr

# Uses gh CLI under the hood
# Auto-fills title from latest commit
# Assigns reviewers from CODEOWNERS
# Links related issues
```

### Validate Commit Message

```bash
scripts/chuck validate-commit "feat(auth): add login"

# ✅ Valid conventional commit
# ✗ Invalid format - use chuck commit for help
```

## Manual Override

If you want to provide your own message:

```bash
# With message (skips auto-generation)
/petforce-dev:push "feat(auth): custom message here"

# Without message (Chuck generates)
/petforce-dev:push
```

## Scope Detection

Chuck automatically detects scope from file paths:

| Files Changed               | Detected Scope                   |
| --------------------------- | -------------------------------- |
| `packages/auth/**`          | `auth`                           |
| `apps/web/**`               | `web`                            |
| `apps/mobile/**`            | `mobile`                         |
| `packages/ui/**`            | `ui`                             |
| `src/components/**`         | `components`                     |
| `src/features/dashboard/**` | `dashboard`                      |
| `.github/workflows/**`      | `ci`                             |
| `docs/**`                   | `docs`                           |
| Root config files           | `config`                         |
| Multiple areas              | Uses primary area or omits scope |

## Co-Author Attribution

Chuck always adds:

```
Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

This credits the AI assistance properly in git history.

## After Successful Push

Chuck shows:

```
✅ Successfully pushed to origin/feature/new-dashboard

📊 Summary:
  Branch: feature/new-dashboard
  Commit: abc1234
  Files changed: 12

🎫 GitHub Issues Created:
  ✅ Issue #156: [FEATURE] User analytics dashboard
     URL: https://github.com/org/petforce/issues/156
     Labels: enhancement, roadmap, agent:ana, component:analytics

  ✅ Issue #157: [BUG] Dashboard not loading on mobile
     URL: https://github.com/org/petforce/issues/157
     Labels: bug, priority:high, agent:maya, component:mobile

🚀 Next Steps:
  Create pull request:
    gh pr create --base develop --title "Add user dashboard" --body "Closes #156"

  Or view in browser:
    gh pr create --web

📈 CI Status:
  GitHub Actions will run:
    ✓ Lint code
    ✓ Type check
    ✓ Run tests
    ✓ Build apps

  Watch CI: gh run watch
```

## Error Handling

### Pre-Commit Hook Failure

```
❌ Pre-commit hook failed

Husky detected issues:
  ✗ lint-staged failed

ESLint errors in staged files:
  src/auth/login.ts:45:3 - 'foo' is not defined
  src/auth/login.ts:52:10 - Unexpected console.log

Fix with: npm run lint -- --fix
Or manually fix and try again.

To bypass (not recommended): git commit --no-verify
```

### Commit Message Validation Failure

```
❌ Commit message validation failed

commitlint found issues:
  ✗ type must be one of [feat, fix, docs, style, refactor, test, chore, perf, ci, build, revert]
  ✗ subject may not be empty

Your message: "updated stuff"

Valid format:
  <type>(<scope>): <subject>

Example:
  feat(auth): add email verification

Use: scripts/chuck commit (for interactive helper)
Or: /petforce-dev:push (I'll generate it for you)
```

### Tests Fail

```
❌ Tests failed - cannot push

Failed tests:
  ✗ auth-api.test.ts > login() > should reject unconfirmed users

Fix the tests and try again.
Run: npm test
```

### Linting Errors

```
❌ Linting failed - cannot push

Errors:
  src/auth/login.ts:45:3 - 'foo' is not defined

Fix with: npm run lint -- --fix
Or manually fix and try again.
```

### Type Errors

```
❌ Type check failed - cannot push

Errors:
  src/auth/login.ts:52:10 - Type 'string' not assignable to 'number'

Fix the TypeScript errors and try again.
```

### Branch Protection Violation

```
❌ Push rejected by GitHub

Branch protection rules require:
  ✗ Pull request review (missing 1 approval)
  ✗ Status checks must pass (CI still running)
  ✗ Must be up to date with base branch

You cannot push directly to 'main'.

Next steps:
  1. Create feature branch: git checkout -b feature/my-feature
  2. Push to feature branch
  3. Create pull request: gh pr create --web
```

### Merge Conflicts on Pull

```
⚠️ Merge conflicts detected when pulling latest

Conflicts in:
  - src/auth/login.ts

Options:
  1. Resolve conflicts manually
  2. Abort push and fix later
  3. Force push (dangerous!)
```

## Flags (Optional)

```bash
# Skip tests (use only for docs/config)
/petforce-dev:push --skip-tests

# Skip linting
/petforce-dev:push --skip-lint

# Provide custom message (skip auto-generation)
/petforce-dev:push "feat: my custom message"

# Force push (requires confirmation)
/petforce-dev:push --force

# Skip pre-push hooks
/petforce-dev:push --no-verify

# Skip GitHub issue creation (NEW!)
/petforce-dev:push --skip-issues

# Create roadmap issue even for small changes
/petforce-dev:push --roadmap
```

## Chuck's Analysis Process

When you run `/petforce-dev:push`, Chuck:

1. **Runs**: `git status --porcelain`
   - Sees what files are staged/unstaged

2. **Runs**: `git diff --cached` (if files staged)
   - Reads the actual code changes

3. **Runs**: `git diff` (for unstaged)
   - Sees all modifications

4. **Analyzes**:
   - File paths → determines scope
   - Code changes → understands what changed
   - New files → detects features
   - Deleted files → notes removals
   - Test files → identifies test changes
   - Config files → spots config updates

5. **Generates**:
   - Conventional commit type
   - Appropriate scope
   - Clear subject line (imperative, <72 chars)
   - Detailed body (what and why)
   - Footer with refs/breaking changes if needed

6. **Shows you** the message for approval

7. **Commits and pushes** if approved

## Best Practices

Chuck follows these rules:

✅ **Subject Line**:

- Imperative mood ("add" not "added")
- Lowercase (except proper nouns)
- No period at end
- Max 72 characters
- Describes what the commit does

✅ **Body**:

- Explains what and why (not how)
- Wraps at 72 characters
- Separated from subject by blank line
- Bullet points for multiple changes

✅ **Footer**:

- References issues: `Fixes #123`, `Closes #456`
- Breaking changes: `BREAKING CHANGE: description`
- Co-author attribution

## Automated Releases (Semantic Versioning)

When your PR is merged to `main`, Chuck's release workflow automatically:

### Version Bump Rules (Semantic Release)

Based on your commit messages, the version is bumped:

**Patch (1.0.0 → 1.0.1):**

- `fix:` bug fixes
- `perf:` performance improvements
- `docs:` documentation updates

**Minor (1.0.0 → 1.1.0):**

- `feat:` new features (backwards compatible)
- `refactor:` code refactoring

**Major (1.0.0 → 2.0.0):**

- Any commit with `BREAKING CHANGE:` in footer
- Fundamental architecture changes

### Example Release Process

**Your merged commits:**

```
feat(auth): add email verification
fix(ui): correct button alignment
docs: update API documentation
```

**Chuck's automated release:**

```
📦 New Release: v1.5.0

Version Bump: 1.4.2 → 1.5.0 (minor)
Reason: feat(auth) triggers minor bump

📝 CHANGELOG.md Updated:

## [1.5.0] - 2026-01-28

### Features
- **auth:** add email verification

### Bug Fixes
- **ui:** correct button alignment

### Documentation
- update API documentation

🏷️ Git Tag Created: v1.5.0
📦 GitHub Release Published
🚀 Deployment Triggered (if configured)
```

### Breaking Changes

If you introduce breaking changes, use the footer:

```
feat(api): redesign authentication endpoints

Changed authentication from session-based to JWT tokens.
All client applications need to update their auth flow.

BREAKING CHANGE: Authentication endpoints now return JWT tokens
instead of session cookies. Update client code to use
Authorization header with Bearer token.
```

This triggers a **MAJOR** version bump (1.5.0 → 2.0.0).

### Viewing Releases

```bash
# View all releases
gh release list

# View latest release
gh release view

# View CHANGELOG
cat CHANGELOG.md
```

## Examples of Chuck's Messages

### New Feature

```
feat(notifications): add real-time notification system

Implemented real-time notifications using WebSockets:
- Server-side event broadcasting
- Client-side event listeners
- Toast notifications for important events
- Notification center with history
- Mark as read functionality

Includes comprehensive test coverage and error handling.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### Bug Fix

```
fix(cart): prevent negative quantities in shopping cart

Added validation to reject negative quantities before they
reach the database. Also added frontend validation to improve
UX and prevent the issue earlier.

Fixes #234

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### Refactoring

```
refactor(database): extract connection pooling to singleton

Refactored database connection management:
- Created DatabasePool singleton class
- Centralized connection configuration
- Improved connection reuse
- Added connection health checks

No behavior changes - all tests still pass.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### Multiple Changes

```
chore: update project configuration and dependencies

- Upgraded Node.js to 20.19.0 (added .nvmrc)
- Updated package.json dependencies
- Added GitHub Actions workflows for CI/CD
- Configured branch protection rules
- Updated .gitignore for better coverage

Preparing for first production deployment.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

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

📖 **Quick References:**

- `.github/CODEOWNERS` - Current ownership mapping
- `.husky/` - Git hooks implementation
- `.github/workflows/` - CI/CD automation

💡 **Pro Tips:**

```bash
# Quick help
scripts/chuck help

# Verify your Git setup
scripts/verify-git-setup

# Read workflow guide
cat docs/GIT_WORKFLOW.md | less
```

## Chuck's Wisdom

> "A good commit message tells the story of your code. I'll make sure yours does!"
>
> - Chuck, CI/CD Agent

> "Quality gates exist to protect production, not to slow you down."
>
> - Chuck, CI/CD Agent

> "Conventional commits enable automated releases. Write them correctly, and I'll handle the rest."
>
> - Chuck, CI/CD Agent

Let Chuck handle the details while you focus on building!

---

**Ready to push? Just run:**

```bash
/petforce-dev:push
```

Chuck will take it from here! 🚀
