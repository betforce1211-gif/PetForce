# GitHub Automation Scripts

Scripts for managing GitHub Issues, PRs, and automation workflows.

## Scripts

### 1. setup-labels.sh
Creates all GitHub labels for agents, priorities, components, etc.

**Usage**:
```bash
./setup-labels.sh
```

**Run once** when setting up the repository.

### 2. bulk-import-issues.js
Import multiple issues from JSON or Markdown files.

**Usage**:
```bash
node bulk-import-issues.js <file.json>
node bulk-import-issues.js <file.md>
```

**JSON Format**:
```json
[
  {
    "title": "[AGENT] Title",
    "body": "Description",
    "labels": ["agent:chuck", "priority:high"],
    "assignees": [],
    "milestone": null
  }
]
```

**Markdown Format**:
```markdown
## [Agent] Title
Description here
- label1, label2
Priority: High
```

### 3. sync-issue-status.js
Manage issue lifecycle and generate reports.

**Usage**:
```bash
# Status report
node sync-issue-status.js report

# Mark stale issues (30+ days)
node sync-issue-status.js stale [--dry-run]

# Close very stale issues (37+ days)
node sync-issue-status.js close-stale [--dry-run]
```

### 4. chuck-cli.js
Interactive CLI for issue management.

**Usage**:
```bash
node chuck-cli.js create   # Create issue
node chuck-cli.js list     # List issues
node chuck-cli.js update   # Update issue
node chuck-cli.js close    # Close issue
```

## Requirements

- Node.js 18+
- GitHub CLI (`gh`) installed and authenticated
- Git repository with GitHub remote

## Installation

```bash
# Install GitHub CLI
brew install gh

# Authenticate
gh auth login

# Make scripts executable
chmod +x *.sh *.js

# Add to PATH (optional)
echo 'export PATH="$PATH:'"$(pwd)"'"' >> ~/.zshrc
source ~/.zshrc
```

## Examples

### Create Single Issue
```bash
gh issue create \
  --title "[CHUCK] Add health checks" \
  --body "Implement /health endpoint" \
  --label "agent:chuck,priority:high"
```

### Bulk Import
```bash
# Create tasks file
cat > tasks.json << 'JSONEOF'
[
  {
    "title": "[CHUCK] Task 1",
    "body": "Description 1",
    "labels": ["agent:chuck", "priority:high"],
    "assignees": [],
    "milestone": null
  }
]
JSONEOF

# Import
node bulk-import-issues.js tasks.json
```

### Weekly Status Check
```bash
# Generate report
node sync-issue-status.js report

# Check for stale issues
node sync-issue-status.js stale --dry-run

# Close abandoned issues
node sync-issue-status.js close-stale --dry-run
```

## Label System

See [GITHUB-AUTOMATION-QUICKSTART.md](../../GITHUB-AUTOMATION-QUICKSTART.md) for full label list.

**Key Labels**:
- Agent: `agent:peter`, `agent:engrid`, `agent:tucker`, etc.
- Priority: `priority:critical`, `priority:high`, `priority:medium`, `priority:low`
- Type: `type:bug`, `type:feature`, `type:docs`, etc.
- Component: `component:auth`, `component:database`, etc.

## Automation

These scripts work with GitHub Actions workflows:
- `.github/workflows/issue-automation.yml`
- `.github/workflows/ci-issue-sync.yml`
- `.github/workflows/pr-issue-link.yml`
- `.github/workflows/pr-status-sync.yml`

## Support

Create an issue with `agent:chuck` label for questions.
