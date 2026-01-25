# 🤖 Chuck: The CI/CD Guardian

> *Because clean code and clear history aren't optional.*

Chuck is a comprehensive CI/CD enforcement system powered by Claude Code. It ensures code quality, enforces git best practices, and maintains a pristine repository history through automated validation and helpful guidance.

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Branch Validation** | Enforces naming conventions (`feature/PROJ-123-description`) |
| **Commit Linting** | Requires conventional commits with ticket references |
| **PR Enforcement** | Validates descriptions, required sections, and linked issues |
| **Test Coverage** | Enforces 80% line / 75% branch coverage thresholds |
| **Documentation Checks** | Ensures CHANGELOG and README updates |
| **Squash Merging** | Clean, single-commit merges with meaningful messages |
| **Release Automation** | Semantic versioning with automated releases |

## 📁 Package Contents

```
chuck-cicd-docs/
├── CHUCK.md                    # Full Chuck documentation & rules
├── CLAUDE.md                   # Claude Code agent configuration  
├── QUICKSTART.md               # 5-minute setup guide
├── .chuck.yml                  # Chuck configuration file
├── .github/
│   ├── workflows/
│   │   ├── chuck-ci.yml        # Main CI pipeline
│   │   └── chuck-release.yml   # Release automation
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── ISSUE_TEMPLATE/
│       ├── bug_report.yml
│       └── feature_request.yml
├── docs/
│   └── BRANCH_PROTECTION_SETUP.md
├── scripts/
│   └── setup-hooks.sh          # Git hooks installer
└── templates/
    ├── .gitmessage             # Commit message template
    └── CHANGELOG.md            # Changelog template
```

## 🚀 Quick Start

### 1. Copy files to your repository

```bash
# Clone or download this package
# Copy contents to your project root
cp -r chuck-cicd-docs/.github your-repo/
cp -r chuck-cicd-docs/.chuck.yml your-repo/
cp -r chuck-cicd-docs/CLAUDE.md your-repo/
```

### 2. Configure for your project

Edit `.chuck.yml` with your settings:

```yaml
commits:
  ticket_pattern: '[A-Z]+-[0-9]+'  # Your ticket format

tests:
  coverage:
    line: 80    # Adjust to current coverage
    branch: 75
```

### 3. Set up branch protection

```bash
# Using GitHub CLI
gh api repos/{owner}/{repo}/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["🧪 Tests","🏗️ Build"]}'
```

### 4. Install git hooks (optional)

```bash
chmod +x scripts/setup-hooks.sh
./scripts/setup-hooks.sh
```

**[📖 Full Setup Guide →](./QUICKSTART.md)**

## 🌿 Branch Naming Convention

```
<type>/<ticket-id>-<description>
```

| Type | Example |
|------|---------|
| `feature/` | `feature/PROJ-123-user-auth` |
| `bugfix/` | `bugfix/PROJ-456-fix-login` |
| `hotfix/` | `hotfix/PROJ-789-security-patch` |
| `release/` | `release/v2.1.0` |
| `docs/` | `docs/PROJ-101-api-docs` |
| `refactor/` | `refactor/PROJ-202-optimize` |

## 📝 Commit Message Format

```
type(scope): description [TICKET-ID]

Optional body explaining what and why.

Closes #123
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

**Examples:**
```bash
feat(auth): add OAuth2 login flow [PROJ-123]
fix(api): resolve null pointer in user service [PROJ-456]
docs: update API documentation [PROJ-789]
```

## 🔍 CI Pipeline

Chuck's CI pipeline runs on every push and PR:

```
┌─────────────────┐
│ Branch Validate │──┐
└─────────────────┘  │
                     │
┌─────────────────┐  │   ┌─────────────────┐
│ Commit Validate │──┼──▶│  Chuck Verdict  │
└─────────────────┘  │   └─────────────────┘
                     │           │
┌─────────────────┐  │           ▼
│  Lint & Format  │──┤   ┌─────────────────┐
└─────────────────┘  │   │   PR Comment    │
                     │   └─────────────────┘
┌─────────────────┐  │
│  Tests + Cover  │──┤
└─────────────────┘  │
                     │
┌─────────────────┐  │
│      Build      │──┘
└─────────────────┘
```

## 🤖 Using Chuck with Claude Code

Once configured, Claude Code becomes Chuck:

```
You: I want to start working on adding user notifications

Chuck: I'll help you create a properly named branch. What's your ticket ID?

You: PROJ-567

Chuck: ✅ Created branch: feature/PROJ-567-user-notifications

Remember to use conventional commits:
  feat(notifications): add email notification service [PROJ-567]
```

Chuck helps with:
- Creating branches with correct naming
- Validating commit messages
- Running pre-PR checks
- Fixing validation failures
- Managing releases

## 📊 Status Checks

All PRs require these checks to pass:

| Check | Description |
|-------|-------------|
| `🌿 Branch Validation` | Branch name matches pattern |
| `📝 Commit Messages` | All commits follow convention |
| `📋 PR Requirements` | Description complete, issue linked |
| `🔍 Lint & Format` | Code passes linting and formatting |
| `🧪 Tests` | All tests pass, coverage met |
| `🏗️ Build` | Project builds successfully |
| `✅ Chuck's Verdict` | Final aggregated status |

## 📋 PR Template

Every PR must include:

- **Summary** - Brief description
- **Type of Change** - Bug fix, feature, breaking change, etc.
- **Related Issues** - `Closes #123`
- **Changes Made** - Detailed list
- **Testing** - How changes were tested
- **Checklist** - Self-review confirmation

## ⚙️ Configuration

Chuck is configured via `.chuck.yml`:

```yaml
version: 1

branches:
  protected: [main, develop]
  naming:
    standard: '^(feature|bugfix)/[A-Z]+-[0-9]+-[a-z0-9-]+$'

commits:
  conventional: true
  require_ticket: true

pull_requests:
  require_description: true
  min_reviewers:
    main: 2
    develop: 1

tests:
  coverage:
    line: 80
    branch: 75
```

**[📖 Full Configuration Reference →](./CHUCK.md#configuration)**

## 🚢 Release Workflow

Chuck automates releases:

1. Create release branch: `release/v1.2.0`
2. Update CHANGELOG with version section
3. Push branch → triggers release workflow
4. Workflow validates, tests, builds
5. Creates GitHub release with notes
6. Publishes to npm (if configured)
7. Creates back-merge PR to develop

## 🛠️ Customization

### Adjust coverage thresholds
```yaml
tests:
  coverage:
    line: 60   # Lower for legacy projects
```

### Disable ticket requirement
```yaml
commits:
  require_ticket: false
```

### Custom branch patterns
```yaml
branches:
  naming:
    standard: '^(feature|fix)/GH-[0-9]+-.*$'
```

## 🆘 Troubleshooting

**Branch name invalid?**
```bash
git branch -m feature/PROJ-XXX-correct-name
```

**Commit message rejected?**
```bash
git commit --amend -m "feat(scope): description [PROJ-123]"
```

**Coverage too low?**
```bash
npm test -- --coverage --collectCoverageFrom='src/**'
```

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [CHUCK.md](./CHUCK.md) | Complete Chuck documentation |
| [CLAUDE.md](./CLAUDE.md) | Claude Code agent config |
| [QUICKSTART.md](./QUICKSTART.md) | 5-minute setup guide |
| [Branch Protection](./docs/BRANCH_PROTECTION_SETUP.md) | GitHub setup guide |

## 🤝 Contributing

1. Create branch: `feature/PROJ-XXX-description`
2. Make changes with conventional commits
3. Open PR with complete description
4. Pass all Chuck checks
5. Get approved and merge!

---

<p align="center">
  <strong>Chuck: Your CI/CD Guardian</strong><br>
  <em>Clean code. Clear history. No exceptions.</em>
</p>
