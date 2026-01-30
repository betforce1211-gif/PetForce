# Chuck - Automated Push Workflow

**Version:** 1.0.0  
**Status:** Production Ready  
**Philosophy:** _Quality gates protect pet families. Every deployment matters._

---

## Quick Start

### One-Command Push

```bash
npm run chuck:push
```

That's it! This single command:

1. ✓ Validates branch name
2. ✓ Analyzes changes and generates commit message
3. ✓ Runs all quality gates (lint, typecheck, build, test, security)
4. ✓ Commits with conventional message
5. ✓ Rebases with latest base branch
6. ✓ Pushes to remote
7. ✓ Creates PR with auto-generated description
8. ✓ Enables auto-merge when CI passes

---

## Prerequisites

### Required

```bash
# Git (already installed)
git --version

# Node.js 18+ (already installed)
node --version

# GitHub CLI
brew install gh
gh auth login
```

### Verify Setup

```bash
# Check GitHub CLI authentication
gh auth status

# Test Chuck script
./scripts/chuck help
```

---

## Usage

### Standard Workflow

```bash
# 1. Create feature branch
./scripts/chuck create-branch feature PET-123 "add medication reminders"

# 2. Make your changes
# ... code code code ...

# 3. Push everything
npm run chuck:push
```

### Available Commands

```bash
# Automated push (recommended)
npm run chuck:push

# Manual validation steps
npm run chuck:validate     # Check branch name
npm run chuck:check        # Run all quality gates
npm run chuck:pr           # Validate PR readiness

# Direct script access
./scripts/chuck help
./scripts/chuck create-branch <type> <ticket> "<description>"
./scripts/chuck validate-branch
./scripts/chuck check commits
./scripts/chuck check all
./scripts/chuck pr validate
```

---

## Workflow Details

### Phase 1: Pre-Push Validation

**What it does:**

- Validates branch name follows Git Flow conventions
- Detects uncommitted changes
- Analyzes changed files to determine commit type
- Generates conventional commit message
- Allows message review/editing

**Branch Naming:**

```
Pattern: type/TICKET-ID-description

Valid types:
  - feature/    → New features (merges to develop)
  - fix/        → Bug fixes (merges to develop)
  - bugfix/     → Bug fixes (merges to develop)
  - hotfix/     → Critical fixes (merges to main)
  - docs/       → Documentation (merges to develop)
  - refactor/   → Code refactoring (merges to develop)
  - test/       → Test additions (merges to develop)
  - chore/      → Maintenance (merges to develop)
  - release/    → Release branches (merges to main)

Examples:
  feature/PET-123-add-medication-reminders
  fix/PET-456-login-validation-bug
  hotfix/PET-789-critical-auth-issue
  release/v1.2.0
```

**Commit Message Generation:**

```
Input:
  Branch: feature/PET-123-add-medication-reminders
  Changed files: apps/mobile/src/features/medications/

Output:
  feat(mobile): Add medication reminders

  Refs: PET-123

  Co-Authored-By: Chuck Guardian <chuck@petforce.dev>
```

---

### Phase 2: Quality Gates

**Required Gates (must pass):**

| Gate          | Command             | Purpose               | Blocks Push |
| ------------- | ------------------- | --------------------- | ----------- |
| **Lint**      | `npm run lint`      | ESLint code quality   | ✓ Yes       |
| **TypeCheck** | `npm run typecheck` | TypeScript validation | ✓ Yes       |
| **Build**     | `npm run build`     | Compilation check     | ✓ Yes       |

**Optional Gates (warnings only):**

| Gate         | Command                  | Agent    | Blocks Push        |
| ------------ | ------------------------ | -------- | ------------------ |
| **Tests**    | `npm test`               | Tucker   | ✗ No (future: yes) |
| **Security** | `npm run security:audit` | Samantha | ✗ No (future: yes) |

**Quality Gate Flow:**

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│   Lint   │───▶│TypeCheck │───▶│  Tests   │───▶│ Security │───▶│  Build   │
│ (Required)│   │(Required)│    │(Optional)│    │(Optional)│    │(Required)│
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
     │               │                │               │               │
     ▼               ▼                ▼               ▼               ▼
   PASS            PASS             WARN            WARN            PASS
     │               │                │               │               │
     └───────────────┴────────────────┴───────────────┴───────────────┘
                                      │
                                      ▼
                            ✓ All Required Gates Pass
                                      │
                                      ▼
                           Proceed to Git Operations
```

**On Failure:**

- Displays detailed error messages
- Provides actionable fix suggestions
- Initiates rollback (no commit created)
- Allows retry after fixes

---

### Phase 3: Git Operations

**What it does:**

1. **Fetch Latest**

   ```bash
   git fetch origin <base-branch>
   ```

   - Updates remote tracking
   - Checks if local is behind

2. **Rebase if Behind**

   ```bash
   git rebase origin/<base-branch>
   ```

   - Keeps history clean (Git Flow best practice)
   - Handles conflicts interactively

3. **Create Commit**

   ```bash
   git commit -m "<generated-message>"
   ```

   - Uses generated/edited message
   - Adds co-author attribution

4. **Push to Remote**
   ```bash
   git push -u origin <branch>  # First push
   git push origin <branch>      # Updates
   ```

**Conflict Handling:**

If rebase has conflicts:

```
❌ Rebase failed with conflicts

Files in conflict:
  apps/web/src/components/Button.tsx

To resolve:
  1. Edit conflicted files
  2. git add <resolved-files>
  3. git rebase --continue
  4. npm run chuck:push  # Retry
```

**Error Recovery:**

- Automatic rollback on failure
- Uncommits if commit was created
- Warns about remote pushes
- Provides cleanup commands

---

### Phase 4: PR Creation & Auto-Merge

**What it does:**

1. **Check for Existing PR**
   - Avoids duplicate PRs
   - Updates existing PR if found

2. **Generate PR Metadata**

   **Title:**

   ```
   [PET-123] Add Medication Reminders
   ```

   **Description:**

   ```markdown
   ## Summary

   - feat(mobile): Add medication reminders
   - test(mobile): Add medication reminder tests

   ## Test Plan

   - [ ] All tests pass
   - [ ] Manual testing completed
   - [ ] No regressions found

   ## Reviewers

   Auto-assigned based on CODEOWNERS

   ---

   Generated by Chuck - CI/CD Guardian
   Quality gates protect pet families.
   ```

3. **Create Pull Request**

   ```bash
   gh pr create \
     --base develop \
     --title "[PET-123] Add Medication Reminders" \
     --body "<generated-description>" \
     --assignee "@me"
   ```

4. **Auto-Assign Reviewers**
   - Reads `.github/CODEOWNERS`
   - Assigns based on changed files
   - Notifies via GitHub

5. **Enable Auto-Merge**
   ```bash
   gh pr merge <pr-number> --auto --squash
   ```

   - Waits for CI checks
   - Requires approval (configurable)
   - Squash merges when ready
   - Deletes branch after merge

**Auto-Merge Conditions:**

- ✓ All CI checks pass
- ✓ Required approvals received
- ✓ Branch up-to-date with base
- ✓ No merge conflicts
- ✓ No blocking reviews

---

## Configuration

### `.chuckrc.yml`

```yaml
version: 1.0.0

branches:
  patterns:
    feature: "^feature/[A-Z]+-[0-9]+-[a-z0-9-]+$"
  base:
    feature: develop
    hotfix: main

quality_gates:
  required:
    - lint
    - typecheck
    - build
  optional:
    - test
    - security

pull_requests:
  auto_create: true
  auto_merge:
    enabled: true
    require_approval: true
    merge_method: squash
```

### Environment Variables

```bash
# Non-interactive mode
export CHUCK_AUTO_STAGE=true
export CHUCK_AUTO_COMMIT=true
export CHUCK_INTERACTIVE=false

# Custom commit message
export CHUCK_COMMIT_MESSAGE="feat: Custom message"

# Skip gates (emergency only!)
export CHUCK_SKIP_GATES=true

# Dry run (preview without pushing)
export CHUCK_DRY_RUN=true

# Custom base branch
export CHUCK_BASE_BRANCH=release/v1.2.0

# Verbose logging
export CHUCK_VERBOSE=true
```

---

## Agent Coordination

### Tucker (Test Guardian)

**Role:** Run tests and validate coverage

**Integration:**

```bash
npm test -- --run --coverage
```

**Checks:**

- Unit tests pass
- Integration tests pass
- Coverage meets thresholds (80% line, 75% branch)

---

### Samantha (Security Guardian)

**Role:** Security scanning and vulnerability detection

**Integration:**

```bash
npm run security:audit
```

**Checks:**

- No critical vulnerabilities
- No high-severity issues
- License compliance
- No secrets in code

---

### Thomas (Documentation Guardian)

**Role:** Ensure documentation is updated

**Integration:**

```bash
# Automated check for README updates
./scripts/thomas-docs-check
```

**Checks:**

- README updated for new features
- API docs updated
- Changelog entry exists

---

### Peter (OpenSpec Guardian)

**Role:** Validate OpenSpec compliance

**Integration:**

```bash
openspec validate --all
```

**Checks:**

- OpenSpec changes are valid
- Proposals properly formatted
- No breaking changes without approval

---

## Common Scenarios

### Feature Development

```bash
# Start work
./scripts/chuck create-branch feature PET-123 "add push notifications"

# Make changes
# ... code ...

# Push (creates PR to develop)
npm run chuck:push

# PR auto-merges when approved and CI passes
```

### Hotfix Workflow

```bash
# Start hotfix from main
git checkout main
git pull origin main
./scripts/chuck create-branch hotfix PET-999 "critical-data-loss-bug"

# Make fix
# ... code ...

# Push (creates PR to main)
npm run chuck:push

# After merge to main, backport to develop
git checkout develop
git pull origin develop
git cherry-pick <commit-hash>
git push origin develop
```

### Release Workflow

```bash
# Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/v1.2.0

# Bump version
npm version minor

# Push release branch
npm run chuck:push

# PR to main
# After merge and deploy, tag
git checkout main
git pull origin main
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin v1.2.0

# Merge back to develop
git checkout develop
git merge main
git push origin develop
```

---

## Troubleshooting

### Error: Invalid Branch Name

**Problem:**

```
❌ Invalid branch name: my-feature
```

**Solution:**

```bash
git branch -m feature/PET-XXX-description
```

---

### Error: Lint Failed

**Problem:**

```
❌ Linting failed
apps/web/src/Button.tsx:15 - Missing semicolon
```

**Solution:**

```bash
npm run lint -- --fix
npm run format
```

---

### Error: Merge Conflicts

**Problem:**

```
❌ Rebase failed with conflicts
```

**Solution:**

```bash
# Resolve conflicts in editor
git add <resolved-files>
git rebase --continue
npm run chuck:push  # Retry
```

---

### Error: GitHub CLI Not Authenticated

**Problem:**

```
❌ GitHub CLI not authenticated
```

**Solution:**

```bash
gh auth login
# Follow prompts
```

---

## Best Practices

### 1. Push Frequently

Push at least once per day to:

- Backup your work
- Get early CI feedback
- Enable team collaboration

### 2. Keep Branches Small

Merge feature branches within 2-3 days to:

- Reduce merge conflicts
- Faster code reviews
- Quicker feedback loops

### 3. Never Skip Quality Gates

Always fix gate failures:

- Maintains code quality
- Prevents technical debt
- Protects production

### 4. Review Generated Messages

Always review auto-generated commit messages:

- Ensure accuracy
- Add context if needed
- Maintain clean history

### 5. Test Locally First

Run tests before pushing:

- Faster feedback
- Avoid CI queue
- Catch issues early

---

## Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Chuck Push Workflow                       │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   Phase 1:    │───▶│   Phase 2:    │───▶│   Phase 3:    │
│  Validation   │    │ Quality Gates │    │ Git Operations│
└───────────────┘    └───────────────┘    └───────────────┘
        │                     │                     │
        │              ┌──────┴──────┐             │
        │              ▼             ▼             │
        │         ┌────────┐    ┌────────┐        │
        │         │ Tucker │    │Samantha│        │
        │         │ (Test) │    │(Security)│      │
        │         └────────┘    └────────┘        │
        │                                          │
        └──────────────────┬───────────────────────┘
                           ▼
                   ┌───────────────┐
                   │   Phase 4:    │
                   │  PR & Merge   │
                   └───────────────┘
                           │
                    ┌──────┴──────┐
                    ▼             ▼
              ┌─────────┐   ┌─────────┐
              │ GitHub  │   │Auto-    │
              │   API   │   │Merge    │
              └─────────┘   └─────────┘
```

### File Structure

```
PetForce/
├── scripts/
│   ├── chuck                    # Main CLI tool
│   └── chuck-push               # Automated push workflow
├── .github/
│   ├── workflows/
│   │   └── chuck-push-validation.yml  # CI validation
│   └── CODEOWNERS               # Auto-reviewer assignment
├── .chuckrc.yml                 # Configuration
├── commitlint.config.js         # Commit message rules
├── docs/
│   └── workflows/
│       └── CHUCK_PUSH_WORKFLOW.md  # Full documentation
└── CHUCK_AUTOMATION.md          # This file
```

---

## Future Enhancements

### Planned Features

1. **Intelligent Conflict Resolution**
   - AI-powered merge suggestions
   - Auto-resolve trivial conflicts
   - Interactive conflict UI

2. **Progressive Deployment**
   - Canary deployments from PR
   - Auto-rollback on metrics
   - Feature flag integration

3. **Advanced Analytics**
   - Push success rates
   - Time to merge metrics
   - Quality trends dashboard

4. **Custom Quality Gates**
   - Plugin system
   - Organization rules
   - Per-project overrides

5. **Enhanced Agent Coordination**
   - Parallel gate execution
   - Real-time status dashboard
   - Agent dependency graph

---

## Support

### Documentation

- **This Guide:** `/CHUCK_AUTOMATION.md`
- **Full Workflow Docs:** `/docs/workflows/CHUCK_PUSH_WORKFLOW.md`
- **Git Flow Reference:** `/docs/progit.pdf`
- **OpenSpec:** `/openspec/AGENTS.md`

### Commands

```bash
# Help
./scripts/chuck help

# Validate setup
npm run chuck:validate

# Test workflow (dry run)
CHUCK_DRY_RUN=true npm run chuck:push
```

### Get Help

- GitHub Issues: Tag with `chuck` label
- Slack: #engineering-chuck
- Email: chuck@petforce.dev

---

## Changelog

### v1.0.0 (2026-01-29)

**Initial Release:**

- ✓ Full Git Flow automation
- ✓ Quality gate integration
- ✓ Auto-PR creation
- ✓ Auto-merge capability
- ✓ Agent coordination framework
- ✓ Comprehensive error handling
- ✓ Interactive & non-interactive modes
- ✓ GitHub Actions integration
- ✓ Full documentation

**Tested with:**

- Git 2.40+
- Node.js 18.0+
- GitHub CLI 2.40+
- macOS, Linux

---

## License

MIT License - See LICENSE file

---

**Remember:** Quality gates protect pet families. Every deployment matters.

_Chuck - CI/CD Guardian_
