# Thomas Documentation Guardian - Quick Start Guide

Get Thomas up and running in your repository in 10 minutes.

## Prerequisites

- GitHub repository
- Markdown documentation (or plans to create it)
- Basic understanding of Git workflows

---

## Step 1: Add Configuration Files

### Copy these files to your repository:

```
your-repo/
├── .github/
│   └── workflows/
│       └── thomas-docs.yml    # Documentation CI pipeline
├── .thomas.yml                 # Thomas configuration
├── CLAUDE.md                   # Claude Code agent config
└── docs/
    ├── _templates/            # Documentation templates
    │   ├── feature.md
    │   ├── troubleshooting.md
    │   ├── prd.md
    │   ├── release-notes.md
    │   ├── api-endpoint.md
    │   ├── runbook.md
    │   └── adr.md
    └── STYLE_GUIDE.md         # Writing standards
```

### Quick copy commands:

```bash
# Create directories
mkdir -p .github/workflows
mkdir -p docs/_templates

# Copy from this package (adjust path as needed)
cp thomas-docs-agent/.github/workflows/*.yml .github/workflows/
cp thomas-docs-agent/.thomas.yml .
cp thomas-docs-agent/CLAUDE.md .
cp -r thomas-docs-agent/docs/_templates docs/
cp thomas-docs-agent/docs/STYLE_GUIDE.md docs/
```

---

## Step 2: Configure for Your Project

### Update `.thomas.yml`

Edit the configuration for your project:

```yaml
# .thomas.yml - Minimum required changes

version: 1

paths:
  docs: 'docs/'                    # Your docs folder
  internal: 'docs/internal/'       # Internal docs (optional)
  templates: 'docs/_templates/'

style:
  readability:
    target_reading_level: 8        # Grade level (adjust as needed)

terminology:
  terms:
    - correct: 'YourProductName'   # Add product-specific terms
      incorrect: ['yourproductname', 'Your Product Name']

freshness:
  warn_after_days: 60              # When to flag aging docs
  stale_after_days: 90             # When to mark as stale
```

---

## Step 3: Set Up Documentation Structure

Create your basic documentation structure:

```bash
# Create recommended directories
mkdir -p docs/getting-started
mkdir -p docs/guides/features
mkdir -p docs/reference
mkdir -p docs/troubleshooting
mkdir -p docs/releases
mkdir -p docs/internal/requirements

# Create essential files
touch docs/getting-started/introduction.md
touch docs/reference/glossary.md
touch docs/troubleshooting/common-issues.md
```

### Starter introduction.md:

```markdown
# Introduction

Welcome to [Your Product]!

## What is [Your Product]?

[Brief description of your product and its value.]

## Who is this for?

This documentation is for:
- [User type 1]
- [User type 2]

## Getting Started

Ready to dive in? Start here:
- [Quick Start Guide](./quick-start.md)
- [Installation](./installation.md)

## Getting Help

- [Troubleshooting](../troubleshooting/common-issues.md)
- [FAQ](../troubleshooting/faq.md)
- [Contact Support](link)
```

---

## Step 4: Commit and Push

```bash
# Create a properly named branch (if using Chuck)
git checkout -b docs/setup-thomas

# Or just work on your main branch
git checkout main

# Add files
git add .github/workflows/ .thomas.yml CLAUDE.md docs/

# Commit
git commit -m "docs: add Thomas documentation guardian"

# Push
git push -u origin docs/setup-thomas
```

---

## Step 5: Verify Setup

After pushing, check:

1. ✅ GitHub Actions workflow runs on docs changes
2. ✅ Thomas's Verdict comment appears on PRs with doc changes
3. ✅ Style and structure checks execute

---

## Using Thomas with Claude Code

Once set up, open Claude Code in your repository and Thomas will:

1. **Help create documentation** using templates
2. **Review documentation** for quality and consistency
3. **Enforce style guide** standards
4. **Track documentation** health and coverage

### Example interactions:

```
You: I need to document our new export feature

Thomas: I'll help you create documentation for the export feature. 
Let me use the feature template.

📝 Created: docs/guides/features/export.md

Template includes these sections to complete:
  □ Overview - What and why
  □ Prerequisites - What users need first
  □ Steps - How to do it
  □ Examples - Show it in action
  □ Troubleshooting - Common issues

Would you like help filling in any section?
```

```
You: Can you review the authentication docs?

Thomas: 📝 Reviewing: docs/guides/features/authentication.md

## Structure ✓
  - Has clear headings
  - Follows feature template

## Content
  ⚠️ Missing prerequisites section (line 15)
  ⚠️ Code example on line 45 needs language specifier
  ✓ Includes troubleshooting section

## Style
  ⚠️ Found "simply" on line 23 - consider removing
  ✓ Uses active voice

3 items to address. Want help fixing them?
```

---

## Thomas Commands

### Creating Documentation

```bash
# Create from template
thomas create feature "User Authentication"
thomas create troubleshooting "API Errors"
thomas create prd "Export Feature"
thomas create release-notes "v2.0.0"
thomas create runbook "Database Maintenance"
thomas create adr "Authentication Strategy"
```

### Reviewing Documentation

```bash
# Review specific file
thomas review docs/guides/authentication.md

# Check all documentation
thomas review all

# Check specific aspects
thomas check style
thomas check links
thomas check freshness
```

### Analyzing Documentation

```bash
# Coverage analysis
thomas analyze coverage

# Find gaps
thomas analyze gaps

# Check readability
thomas analyze readability docs/guides/feature.md
```

---

## Templates Overview

| Template | Use When |
|----------|----------|
| `feature.md` | Documenting a product feature |
| `troubleshooting.md` | Creating help guides for issues |
| `prd.md` | Writing product requirements |
| `release-notes.md` | Publishing release notes |
| `api-endpoint.md` | Documenting API endpoints |
| `runbook.md` | Creating operational procedures |
| `adr.md` | Recording architecture decisions |

---

## Customization

### Adjust Style Rules

```yaml
# .thomas.yml
style:
  readability:
    max_sentence_length: 30    # Allow longer sentences
    target_reading_level: 10   # Higher complexity OK
```

### Custom Terminology

```yaml
# .thomas.yml
terminology:
  terms:
    - correct: 'MyProduct Pro'
      incorrect: ['MyProduct pro', 'myproduct pro']
    - correct: 'workspace'
      incorrect: ['work space', 'Workspace']
```

### Custom Freshness Rules

```yaml
# .thomas.yml
freshness:
  warn_after_days: 90          # More lenient
  stale_after_days: 180
  exempt_paths:
    - 'docs/releases/'         # Don't age-check release notes
    - 'docs/reference/glossary.md'
```

---

## Troubleshooting

### Workflow not running?

- Verify `.github/workflows/thomas-docs.yml` exists
- Check workflow is triggered by `docs/**` path changes
- Ensure workflow has correct permissions

### Style checks too strict?

- Adjust rules in `.thomas.yml`
- Add exceptions for specific files
- Customize terminology list

### Links incorrectly flagged?

- Add patterns to `links.ignore_patterns` in `.thomas.yml`
- Use relative links within docs
- Check external links are accessible

---

## Next Steps

1. 📖 Read the full [THOMAS.md](./THOMAS.md) documentation
2. 🎨 Customize the [Style Guide](./docs/STYLE_GUIDE.md) for your team
3. 📝 Start documenting with templates
4. 🔄 Set up regular documentation reviews

---

## Integration with Chuck

If you're also using Chuck (CI/CD Guardian):

- Chuck handles: Branch naming, commit messages, code quality
- Thomas handles: Documentation quality, structure, freshness

They complement each other—Chuck ensures code quality, Thomas ensures documentation quality.

---

*Thomas: Because if it's not documented, it doesn't exist.* 📚
