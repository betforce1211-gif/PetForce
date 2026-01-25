# 📚 Thomas: The Documentation Guardian

> *If it's not documented, it doesn't exist.*

Thomas is a comprehensive documentation management system powered by Claude Code. He ensures every piece of documentation is clear, complete, consistent, and current—whether it's customer-facing guides, internal runbooks, or product requirements.

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Template System** | Consistent structure for features, troubleshooting, PRDs, release notes, API docs, runbooks, and ADRs |
| **Style Enforcement** | Writing standards for voice, tone, formatting, and terminology |
| **Quality Checks** | Automated validation of structure, links, readability, and freshness |
| **Coverage Tracking** | Know what's documented and what's missing |
| **Freshness Monitoring** | Identify stale documentation before it becomes a problem |
| **Review Workflow** | Comprehensive review process with actionable feedback |

## 📁 Package Contents

```
thomas-docs-agent/
├── THOMAS.md                   # Full Thomas documentation & rules
├── CLAUDE.md                   # Claude Code agent configuration
├── QUICKSTART.md               # 10-minute setup guide
├── .thomas.yml                 # Thomas configuration file
├── .github/
│   └── workflows/
│       └── thomas-docs.yml     # Documentation CI pipeline
└── docs/
    ├── STYLE_GUIDE.md          # Writing standards
    └── _templates/
        ├── feature.md          # Feature documentation
        ├── troubleshooting.md  # Troubleshooting guides
        ├── prd.md              # Product requirements
        ├── release-notes.md    # Release notes
        ├── api-endpoint.md     # API documentation
        ├── runbook.md          # Operational procedures
        └── adr.md              # Architecture decisions
```

## 🚀 Quick Start

### 1. Copy files to your repository

```bash
# Copy configuration and templates
cp -r thomas-docs-agent/.github your-repo/
cp thomas-docs-agent/.thomas.yml your-repo/
cp thomas-docs-agent/CLAUDE.md your-repo/
cp -r thomas-docs-agent/docs/_templates your-repo/docs/
cp thomas-docs-agent/docs/STYLE_GUIDE.md your-repo/docs/
```

### 2. Configure for your project

```yaml
# .thomas.yml
version: 1

paths:
  docs: 'docs/'

terminology:
  terms:
    - correct: 'YourProduct'
      incorrect: ['yourproduct', 'Your product']

freshness:
  stale_after_days: 90
```

### 3. Create your documentation structure

```bash
mkdir -p docs/{getting-started,guides/features,reference,troubleshooting}
```

**[📖 Full Setup Guide →](./QUICKSTART.md)**

## 📝 Documentation Types

Thomas helps create and maintain:

### Customer-Facing

| Type | Template | Purpose |
|------|----------|---------|
| **Feature Docs** | `feature.md` | How to use product features |
| **Troubleshooting** | `troubleshooting.md` | Solving common problems |
| **API Reference** | `api-endpoint.md` | API endpoint documentation |
| **Release Notes** | `release-notes.md` | What's new in each version |

### Internal

| Type | Template | Purpose |
|------|----------|---------|
| **PRDs** | `prd.md` | Product requirements |
| **Runbooks** | `runbook.md` | Operational procedures |
| **ADRs** | `adr.md` | Architecture decisions |

## 🎨 Style Guide Highlights

Thomas enforces consistent, clear documentation:

### Voice & Tone
- **Active voice**: "Click Save" not "The Save button should be clicked"
- **Second person**: "You can..." not "Users can..."
- **Present tense**: "The system saves..." not "The system will save..."

### Formatting
- **Sentence case headings**: "Getting started" not "Getting Started"
- **Bold for UI elements**: Click **Save**
- **Code for technical terms**: `apiKey`, `config.yaml`

### Forbidden Phrases

| ❌ Avoid | ✅ Use Instead |
|----------|----------------|
| "Simply" | Just state the action |
| "Obviously" | Remove entirely |
| "Just" | State directly |
| "In order to" | "To" |

## 🔍 Quality Checks

The CI pipeline validates:

```
📁 Structure Check    - Required directories and files
📝 Markdown Lint      - Formatting consistency
🎨 Style Guide        - Writing standards
🔗 Link Validation    - Working internal/external links
📊 Content Quality    - Code examples, prerequisites
📅 Freshness Check    - Stale documentation alerts
📖 Spell Check        - Typos and misspellings
```

## 🤖 Using Thomas with Claude Code

Once configured, Claude Code becomes Thomas:

```
You: I need to document our new search feature

Thomas: I'll help you create documentation for the search feature.
📝 Created: docs/guides/features/search.md

Template includes these sections to complete:
  □ Overview - What and why
  □ Prerequisites - What users need
  □ Steps - How to use it
  □ Examples - Real-world usage
  □ Troubleshooting - Common issues

Want me to help fill in any section?
```

```
You: Review our API docs before we publish

Thomas: 📝 Documentation Review Complete!

✅ Structure: Clear and consistent
✅ Code examples: All tested and working
⚠️ Found 2 items to address:

1. Missing authentication section (api/users.md)
   Add: Prerequisites section with auth requirements

2. Stale screenshot (api/dashboard.png) - 95 days old
   Update: Screenshot shows old UI

Overall: Good quality, minor updates needed.
```

## 📊 Documentation Health

Thomas tracks documentation metrics:

```
📊 Documentation Health Report
==============================

Coverage:     ████████░░ 82%  (41/50 features)
Freshness:    █████████░ 91%  (< 90 days old)
Link Health:  ██████████ 100% (0 broken)
Style Score:  ████████░░ 85%  (compliance)

📈 Trend: +5% coverage this month

⚠️ Attention Needed:
- 3 features missing documentation
- 4 docs not updated in 90+ days
```

## ⚙️ Configuration

Thomas is configured via `.thomas.yml`:

```yaml
version: 1

# Documentation locations
paths:
  docs: 'docs/'
  templates: 'docs/_templates/'

# Style enforcement
style:
  readability:
    max_sentence_length: 25
    target_reading_level: 8

# Terminology consistency
terminology:
  enforce: true
  terms:
    - correct: 'sign in'
      incorrect: ['log in', 'login']

# Freshness monitoring
freshness:
  warn_after_days: 60
  stale_after_days: 90
```

**[📖 Full Configuration Reference →](./THOMAS.md#configuration)**

## 🤝 Working with Chuck

Thomas pairs perfectly with Chuck (CI/CD Guardian):

| Agent | Responsibility |
|-------|----------------|
| **Chuck** | Code quality, branch naming, commits, tests |
| **Thomas** | Documentation quality, structure, freshness |

Together, they ensure both your code AND documentation meet high standards.

## 📋 Commands

### Create Documentation
```bash
thomas create feature "Authentication"
thomas create troubleshooting "Login Issues"
thomas create prd "Export Feature"
thomas create release-notes "v2.0.0"
```

### Review Documentation
```bash
thomas review docs/guides/auth.md
thomas check style
thomas check links
thomas check freshness
```

### Analyze Documentation
```bash
thomas analyze coverage
thomas analyze gaps
thomas analyze readability docs/guide.md
```

## 📚 Templates

All templates include:

- ✅ Required sections clearly marked
- ✅ Helpful comments and guidance
- ✅ Consistent structure
- ✅ Placeholder text to replace
- ✅ Examples of good content

## 🆘 Troubleshooting

**Style checks too strict?**
```yaml
# .thomas.yml - adjust rules
style:
  readability:
    max_sentence_length: 30  # More lenient
```

**Docs incorrectly flagged as stale?**
```yaml
# .thomas.yml - exempt certain paths
freshness:
  exempt_paths:
    - 'docs/releases/'
```

**Links failing validation?**
```yaml
# .thomas.yml - ignore patterns
links:
  ignore_patterns:
    - 'localhost'
    - 'internal.company.com'
```

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [THOMAS.md](./THOMAS.md) | Complete Thomas documentation |
| [CLAUDE.md](./CLAUDE.md) | Claude Code configuration |
| [QUICKSTART.md](./QUICKSTART.md) | 10-minute setup guide |
| [STYLE_GUIDE.md](./docs/STYLE_GUIDE.md) | Writing standards |

---

<p align="center">
  <strong>Thomas: Your Documentation Guardian</strong><br>
  <em>Clear. Complete. Consistent. Current.</em>
</p>

---

*Because if it's not documented, it doesn't exist.* 📚
