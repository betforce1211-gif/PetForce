# PetForce Autonomous Development

## 🎉 You Now Have Autonomous Development Superpowers!

A custom Claude Code plugin has been created that combines OpenSpec, Ralph-loop, and Agent quality gates into simple slash commands.

## Available Commands

### `/feature <description>`
**Fully autonomous feature development**

Creates proposal → Implements all tasks → Reviews quality → Ready to archive

Example:
```bash
/feature "Add user profile page with avatar upload"
```

Time: 30-90 minutes (autonomous)

### `/bugfix <description>`
**Fast bug fix with testing**

Reproduces bug → Fixes it → Tests → Quick review → Ready to deploy

Example:
```bash
/bugfix "Shopping cart total incorrect with coupons"
```

Time: 10-30 minutes (autonomous)

### `/change <description>`
**General changes (refactor, config, docs)**

Implements change → Appropriate review → Ready to merge

Example:
```bash
/change "Refactor auth middleware" --type refactor
```

Time: 15-60 minutes (autonomous)

### `/help`
**Complete documentation**

Shows detailed help, examples, and best practices

## Quick Start

```bash
# Try your first autonomous feature
/feature "Add GET /health endpoint returning {status: 'ok'}"

# Review proposal when prompted
# Say "proceed" 
# Wait ~15 minutes
# Review results
# Archive when ready
```

## How It Works

```
┌──────────────────────────────────────────────────┐
│ YOU: /feature "Add notifications system"         │
└────────────────┬─────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────┐
│ CLAUDE: Creates OpenSpec proposal                │
│ ├── proposal.md (why)                            │
│ ├── design.md (how)                              │
│ └── tasks.md (what)                              │
└────────────────┬─────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────┐
│ YOU: Review and approve (or edit and customize)  │
└────────────────┬─────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────┐
│ RALPH-LOOP: Implements autonomously (30-60 min)  │
│ ├── Writes code                                  │
│ ├── Writes tests                                 │
│ ├── Fixes test failures                          │
│ ├── Iterates until done                          │
│ └── Commits work                                 │
└────────────────┬─────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────┐
│ AGENTS: Review quality (10-15 min)               │
│ ├── Security checklist (17 items)                │
│ ├── QA Testing checklist (15 items)              │
│ ├── Product Management (12 items)                │
│ ├── UX, Docs, API, Infrastructure, etc.          │
│ └── Creates quality-review.md                    │
└────────────────┬─────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────┐
│ SYSTEM: Applies changes to specs                 │
└────────────────┬─────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────┐
│ YOU: Review quality-review.md                    │
│      Archive: /openspec:archive {change-id}      │
└────────────────┬─────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────┐
│ ✅ DONE: Production-ready code!                  │
└──────────────────────────────────────────────────┘
```

## What You Get

For every feature/bugfix/change:

```
openspec/changes/{change-id}/
├── proposal.md           # Why this change, what's affected
├── design.md             # Technical decisions, trade-offs
├── tasks.md              # Implementation tasks (✓ auto-updated)
├── quality-review.md     # All agent checklists evaluated
└── specs/                # Spec deltas for affected agents
    ├── security/
    ├── qa-testing/
    ├── product-management/
    └── ...
```

## The Magic Formula

```
OpenSpec (structure) + Ralph-loop (automation) + Agents (quality) = 
    Autonomous, production-ready development
```

## Benefits

**You focus on:**
- ✅ What to build (requirements)
- ✅ Strategic decisions (approve proposals)
- ✅ Final review (quality-review.md)
- ✅ When to ship (archive)

**Claude handles:**
- ✅ How to build it (implementation)
- ✅ Writing tests
- ✅ Fixing bugs iteratively
- ✅ Running quality checks
- ✅ Documentation

**Result:**
- ✅ Faster development (30-60 min vs days)
- ✅ Higher quality (15 agent checklists)
- ✅ Complete traceability (OpenSpec)
- ✅ Consistent process (every time)

## Real World Examples

### Feature: Password Reset
```bash
/feature "Add password reset via email:
- User requests reset
- Generate secure token (24hr expiry)
- Send email with reset link
- Validate token and update password
- Include tests with 80%+ coverage
"
```

**Result after ~45 minutes:**
- ✅ Complete flow implemented
- ✅ Email templates created
- ✅ Security reviewed (token generation, expiry)
- ✅ QA reviewed (tests passing, edge cases)
- ✅ Ready to deploy

### Bug Fix: Email Validation
```bash
/bugfix "Email validation accepts invalid TLDs"
```

**Result after ~15 minutes:**
- ✅ Bug reproduced with test
- ✅ Validation regex fixed
- ✅ All tests passing
- ✅ No regressions
- ✅ Ready to deploy

### Refactoring: Auth Module
```bash
/change "Refactor authentication to use dependency injection" --type refactor
```

**Result after ~25 minutes:**
- ✅ Code refactored
- ✅ All tests still passing
- ✅ No behavior changes
- ✅ Code quality improved
- ✅ Ready to merge

## Workflow Comparison

| Before (Manual) | After (Autonomous) |
|-----------------|-------------------|
| Write proposal manually | `/feature "description"` |
| Create tasks list | Auto-generated |
| Implement task 1 | Autonomous |
| Write tests | Autonomous |
| Fix test failures | Autonomous (iterates) |
| Implement task 2... | Autonomous |
| Manual QA review | 15 agent checklists |
| Update documentation | Auto-tracked |
| Code review | Quality-review.md |
| **Time:** Days | **Time:** 30-90 minutes |
| **Quality:** Variable | **Quality:** Consistent |

## Safety Features

1. **Max iterations** - Prevents infinite loops
   ```bash
   /feature "..." --max-iterations 50
   ```

2. **Proposal review** - You approve before implementation
   
3. **Quality gates** - 5 blocking agents must approve
   - Product Management
   - Security
   - QA Testing
   - CI/CD
   - Feature Development Process

4. **Emergency stop** - Cancel anytime
   ```bash
   /cancel-ralph
   ```

5. **Human in the loop** - You archive when ready
   ```bash
   /openspec:archive {change-id}
   ```

## Best Practices

### ✅ Do:
- Be specific in descriptions
- Review proposals before proceeding
- Check quality-review.md before archiving
- Use appropriate command (/feature vs /bugfix vs /change)
- Set --max-iterations for safety

### ❌ Don't:
- Use --auto-archive without reviewing
- Skip proposal review phase
- Interrupt Ralph mid-implementation
- Ignore blocking agent failures
- Use for exploratory work

## Monitoring Progress

While Ralph is running:

```bash
# Watch tasks being completed
watch -n 5 cat openspec/changes/{change-id}/tasks.md

# Check git commits
git log --oneline -10

# Monitor tests in terminal
# (Ralph shows output automatically)
```

## Documentation

- **Quick Start**: `.claude-plugins/petforce-dev/QUICKSTART.md`
- **Full Docs**: `.claude-plugins/petforce-dev/README.md`
- **Help Command**: `/help` (in Claude Code)
- **OpenSpec**: `openspec/AGENTS.md`
- **Ralph-loop**: `/ralph-loop help`

## Command Location

```
/Users/danielzeddr/PetForce/.claude/commands/petforce-dev/
├── feature.md      # /feature command
├── bugfix.md       # /bugfix command
├── change.md       # /change command
└── help.md         # /help command

Documentation:
/Users/danielzeddr/PetForce/.claude-plugins/petforce-dev/
├── README.md           # Full documentation
└── QUICKSTART.md       # Quick start guide
```

## Your 15 Agents

All working for you:

**Blocking (must approve):**
1. 📋 Product Management - Requirements quality
2. 🔒 Security - Security review (17-item checklist)
3. ✅ QA Testing - Test coverage (15-item checklist)
4. 🚀 CI/CD - Deployment readiness
5. 📊 Feature Dev Process - Coordination

**Non-blocking (feedback):**
6. 🎨 UX Design - User experience
7. 📚 Documentation - Docs quality
8. 📈 Analytics - Event tracking
9. 🔍 Logging - Observability
10. 💬 Customer Success - Customer impact

**Conditional (when applicable):**
11. 💻 Software Engineering - Code quality
12. 🔌 API Design - API standards
13. 🏗️ Infrastructure - Infra requirements
14. 📊 Data Engineering - Data pipelines
15. 📱 Mobile Development - Mobile quality

## Next Steps

1. **Try it now:**
   ```bash
   /feature "Add a simple /health endpoint"
   ```

2. **Read the quick start:**
   ```bash
   cat .claude-plugins/petforce-dev/QUICKSTART.md
   ```

3. **Get detailed help:**
   ```bash
   /help
   ```

4. **Build something real:**
   - Pick a feature from your backlog
   - Use `/feature` to build it autonomously
   - Review the results
   - Archive and ship!

## Philosophy

> **"You define WHAT to build, Claude builds it autonomously, Agents verify quality, You approve and ship."**

This is development at a new level:
- **Faster** - Hours instead of days
- **Better** - 15 quality checklists
- **Traceable** - Complete OpenSpec documentation
- **Scalable** - Same process every time

## Questions?

- `/help` - Built-in help
- Check `.claude-plugins/petforce-dev/README.md`
- Review example outputs in `openspec/changes/archive/`

---

## 🚀 Ready to Build?

```bash
/feature "Your next great idea"
```

**Welcome to autonomous development!**
