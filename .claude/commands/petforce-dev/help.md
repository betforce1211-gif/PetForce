---
name: PetForce: Help
description: Help and documentation for PetForce autonomous development commands
category: PetForce Development
tags: [petforce, help, documentation]
---

# PetForce Autonomous Development

Welcome to the PetForce development workflow! This system combines OpenSpec, Ralph-loop, and Agent quality gates into autonomous development commands.

## Available Commands

### `/feature <description>`

**Full autonomous feature development**

Creates OpenSpec proposal → Implements all tasks → Reviews quality → Ready to archive

**Example:**
```
/feature "Add user profile page with avatar upload and bio editing"
```

**Time:** 30-90 minutes (autonomous)

**Options:**
- `--max-iterations N` - Max Ralph iterations (default: 150)
- `--skip-quality-review` - Skip agent checklist review
- `--auto-archive` - Auto-archive if all checks pass (use with caution)

---

### `/bugfix <description>`

**Fast bug fix with testing focus**

Reproduces bug → Fixes it → Tests → Quick review (Security + QA) → Ready to deploy

**Example:**
```
/bugfix "Shopping cart total calculation incorrect with discounts"
```

**Time:** 10-30 minutes (autonomous)

**Options:**
- `--max-iterations N` - Max Ralph iterations (default: 30)
- `--skip-tests` - Skip test creation (not recommended)
- `--auto-archive` - Auto-archive if tests pass

---

### `/change <description>`

**General changes (refactoring, config, docs, etc.)**

Implements change → Appropriate review based on type → Ready to merge

**Example:**
```
/change "Refactor authentication module to use dependency injection" --type refactor
```

**Time:** 15-60 minutes (autonomous)

**Options:**
- `--max-iterations N` - Max Ralph iterations (default: 75)
- `--type TYPE` - Change type: refactor, deps, config, docs, perf, cleanup

---

## How It Works

```
┌─────────────────────────────────────────────────┐
│  YOU: /feature "Add notifications"              │
└──────────────┬──────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────┐
│  OPENSPEC: Creates proposal                     │
│  - proposal.md, design.md, tasks.md             │
└──────────────┬──────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────┐
│  YOU: Review and approve                        │
└──────────────┬──────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────┐
│  RALPH-LOOP: Implements autonomously (30-60min) │
│  - Writes code, tests, fixes failures           │
│  - Updates tasks.md, commits work               │
└──────────────┬──────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────┐
│  AGENTS: Quality review (10-15min)              │
│  - 15 agent checklists evaluated                │
│  - Creates quality-review.md                    │
└──────────────┬──────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────┐
│  YOU: Review and archive                        │
└──────────────┬──────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────┐
│  ✅ DONE: Production-ready code!                │
└─────────────────────────────────────────────────┘
```

## Command Comparison

| Feature | /feature | /bugfix | /change |
|---------|----------|---------|---------|
| **Use case** | New features | Bug fixes | Refactor/updates |
| **Iterations** | 150 | 30 | 75 |
| **Quality gates** | All agents | Security + QA | Type-specific |
| **Speed** | Slower | Fastest | Medium |

## Your 15 Agents

**Blocking (must approve):**
- 📋 Product Management - Requirements quality
- 🔒 Security - Security review (17 items)
- ✅ QA Testing - Test coverage (15 items)
- 🚀 CI/CD - Deployment readiness
- 📊 Feature Dev Process - Coordination

**Non-blocking (feedback):**
- 🎨 UX Design - User experience
- 📚 Documentation - Docs quality
- 📈 Analytics - Event tracking
- 🔍 Logging - Observability
- 💬 Customer Success - Customer impact

**Conditional (when applicable):**
- 💻 Software Engineering - Code quality
- 🔌 API Design - API standards
- 🏗️ Infrastructure - Infra requirements
- 📊 Data Engineering - Data pipelines
- 📱 Mobile Development - Mobile quality

## Quick Start

```
# Try your first feature
/feature "Add GET /api/health endpoint returning {status: 'ok'}"

# Review proposal when prompted
# Say "proceed"
# Wait ~15 minutes
# Review results
# Archive when ready
```

## Best Practices

### ✅ Do:
- Be specific in descriptions
- Review proposals before proceeding
- Check quality-review.md before archiving
- Use appropriate command for the task
- Set --max-iterations for safety

### ❌ Don't:
- Use --auto-archive without reviewing
- Skip proposal review
- Interrupt Ralph mid-implementation
- Ignore blocking agent failures

## Monitoring Progress

While Ralph is running:

```bash
# Watch tasks being completed
watch -n 5 cat openspec/changes/{change-id}/tasks.md

# Check git commits
git log --oneline -10
```

## Emergency Stop

If needed:
```
/cancel-ralph
```

Your progress is saved in files.

## Documentation

- **Project Root:** `/Users/danielzeddr/PetForce/AUTONOMOUS-DEVELOPMENT.md`
- **Quick Start:** `.claude-plugins/petforce-dev/QUICKSTART.md`
- **Full Docs:** `.claude-plugins/petforce-dev/README.md`
- **OpenSpec:** `openspec/AGENTS.md`

## Example Workflows

### New Feature
```
/feature "Add password reset via email:
- User requests reset
- Generate secure token (24hr expiry)
- Send email with reset link
- Validate token and update password
- Include tests with 80%+ coverage
"
```

### Bug Fix
```
/bugfix "Email validation accepts invalid TLDs"
```

### Refactoring
```
/change "Extract validation logic into utils" --type refactor
```

## Philosophy

> **"You define WHAT to build, Claude builds it autonomously, Agents verify quality, You approve and ship."**

**The Magic Formula:**
```
OpenSpec (structure) + Ralph-loop (automation) + Agents (quality) =
    Autonomous, production-ready development
```

## Support

Questions? Check:
- This help (you're reading it!)
- AUTONOMOUS-DEVELOPMENT.md in project root
- OpenSpec docs: `openspec/AGENTS.md`
- Ralph-loop: `/ralph-loop help`

---

**Ready to build autonomously?**

```
/feature "Your next great idea"
```
