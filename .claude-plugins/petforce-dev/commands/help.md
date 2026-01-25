---
description: "Help for PetForce autonomous development commands"
---

# PetForce Autonomous Development Plugin

Welcome to the PetForce development workflow! This plugin automates feature development, bug fixes, and code changes using OpenSpec + Ralph-loop + Agent quality gates.

## Available Commands

### `/feature <description>`

**Full autonomous feature development workflow**

Creates an OpenSpec proposal, implements all tasks iteratively, runs quality gates, and prepares for archive.

**When to use:**
- Adding new functionality
- Building new components or services
- Changes affecting multiple parts of the system
- Anything that needs full planning and review

**Example:**
```bash
/feature "Add user profile page with avatar upload and bio editing"
```

**Options:**
```
--max-iterations N        Max Ralph iterations (default: 150)
--skip-quality-review     Skip agent checklist review (not recommended)
--auto-archive           Auto-archive if all checks pass (use with caution)
```

**Time estimate:** 30-90 minutes for medium complexity features

**Process:**
1. Creates OpenSpec proposal (you review and approve)
2. Autonomous implementation via Ralph-loop
3. Quality gate review (all applicable agents)
4. Applies changes to specs
5. Ready to archive

---

### `/bugfix <description>`

**Fast bug fix workflow with testing focus**

Streamlined workflow optimized for fixing specific issues quickly.

**When to use:**
- Fixing broken functionality
- Addressing specific error or bug
- Quick fixes that need testing
- Production issues

**Example:**
```bash
/bugfix "Login form doesn't validate email format correctly"
```

**Options:**
```
--max-iterations N    Max Ralph iterations (default: 30)
--skip-tests         Skip test creation (not recommended)
--auto-archive       Auto-archive if tests pass
```

**Time estimate:** 10-30 minutes for typical bugs

**Process:**
1. Creates lightweight proposal
2. Reproduces bug with test
3. Fixes bug
4. Verifies no regressions
5. Quick quality review (Security + QA only)
6. Ready to archive

---

### `/push [commit-message]`

**Chuck's safe push process to GitHub**

Enforces CI/CD best practices when pushing code to GitHub.

**When to use:**
- Every time you want to push code changes
- After completing a task or feature
- At end of day to backup your work
- Before switching branches

**Example:**
```bash
/push "feat(auth): add email verification flow"
```

**Process:**
1. Runs all tests (must pass)
2. Runs linting (must pass)
3. Type checks TypeScript (must pass)
4. Creates properly formatted commit
5. Pulls latest changes
6. Pushes to GitHub
7. Reminds you to create PR if needed

**Time estimate:** 2-5 minutes

**Safety features:**
- Won't push if tests fail
- Prevents direct pushes to main/develop
- Enforces conventional commits
- Auto-adds co-author attribution

---

### `/pull [branch-name]`

**Chuck's safe pull process from GitHub**

Safely pulls changes from GitHub without losing local work.

**When to use:**
- Start of each day
- Before starting new work
- Before creating feature branch
- When teammate notifies you of changes

**Example:**
```bash
/pull develop
```

**Process:**
1. Checks for uncommitted changes
2. Stashes local work if needed
3. Fetches remote updates
4. Pulls with rebase (clean history)
5. Applies stashed changes
6. Updates dependencies if needed
7. Runs migrations if needed

**Time estimate:** 1-3 minutes

**Safety features:**
- Never loses uncommitted work
- Detects merge conflicts early
- Auto-updates dependencies
- Runs new migrations
- Creates backup before risky operations

---

### `/change <description>`

**General change workflow**

For changes that aren't features or bugs: refactoring, dependency updates, config changes, documentation, etc.

**When to use:**
- Refactoring code
- Updating dependencies
- Configuration changes
- Documentation improvements
- Performance optimizations
- Code cleanup

**Example:**
```bash
/change "Refactor authentication module to use dependency injection" --type refactor
```

**Options:**
```
--max-iterations N    Max Ralph iterations (default: 75)
--type TYPE          Change type: refactor, deps, config, docs, perf, cleanup
```

**Time estimate:** 15-60 minutes depending on scope

**Process:**
1. Creates proposal
2. Implements change
3. Runs appropriate quality reviews (based on --type)
4. Ready to archive

---

## Workflow Overview

All commands follow this pattern:

```
┌─────────────────────────────────────────────────────────────┐
│  1. PLANNING (OpenSpec)                                     │
│     - Creates proposal.md, design.md, tasks.md              │
│     - You review and approve                                │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│  2. IMPLEMENTATION (Ralph-loop)                             │
│     - Works through tasks.md autonomously                   │
│     - Writes tests, fixes failures, iterates                │
│     - Commits work, updates tasks                           │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│  3. QUALITY GATES (Agent Checklists)                        │
│     - Reviews against agent quality standards               │
│     - Creates quality-review.md                             │
│     - Identifies blocking issues                            │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│  4. APPLY & ARCHIVE (OpenSpec)                              │
│     - Applies changes to specs                              │
│     - You archive when ready                                │
└─────────────────────────────────────────────────────────────┘
```

## Command Comparison

### Development Workflows

| Feature | /feature | /bugfix | /change |
|---------|----------|---------|---------|
| **Use case** | New features | Bug fixes | Refactor/updates |
| **Planning** | Full proposal | Lightweight | Adapted to type |
| **Iterations** | 150 (default) | 30 (default) | 75 (default) |
| **Quality gates** | All agents | Security + QA | Type-specific |
| **Speed** | Slower | Fastest | Medium |
| **Thoroughness** | Most thorough | Focused | Flexible |

### Git Operations (Chuck's CI/CD)

| Feature | /push | /pull |
|---------|-------|-------|
| **Use case** | Save & share work | Get latest changes |
| **Tests** | Must pass | Optional |
| **Linting** | Must pass | N/A |
| **Safety** | High | High |
| **Speed** | 2-5 min | 1-3 min |
| **Automation** | Full checks | Smart updates |

## Agent Quality Gates

Your changes are reviewed by 15 specialized agents:

**Blocking (must approve):**
- 📋 Product Management - Requirements quality
- 🔒 Security - Security standards
- ✅ QA Testing - Test coverage
- 🚀 CI/CD - Deployment readiness
- 📊 Feature Dev Process - Overall coordination

**Non-blocking (feedback only):**
- 🎨 UX Design - User experience
- 📚 Documentation - Docs quality
- 📈 Analytics - Tracking
- 🔍 Logging - Observability
- 💬 Customer Success - Customer impact

**Conditional (when applicable):**
- 💻 Software Engineering - Code quality
- 🔌 API Design - API standards
- 🏗️ Infrastructure - Infra requirements
- 📊 Data Engineering - Data pipelines
- 📱 Mobile Development - Mobile standards

## Best Practices

### ✅ Do:
- Review the proposal before implementation starts
- Let Ralph-loop iterate - don't interrupt it
- Check quality-review.md before archiving
- Use appropriate command for the task type
- Set reasonable --max-iterations for safety

### ❌ Don't:
- Use --auto-archive without reviewing first
- Skip quality reviews on production code
- Interrupt Ralph mid-task (use /cancel-ralph if needed)
- Ignore blocking agent failures
- Rush through the proposal review

## Monitoring Progress

While Ralph is running:
- Check `openspec/changes/{change-id}/tasks.md` - tasks get marked [x]
- Watch test output in terminal
- Monitor git commits
- Check iteration count

## Canceling a Workflow

If you need to stop:
```bash
/cancel-ralph
```

This stops the Ralph-loop. Your progress is saved in files and you can resume manually.

## Example Workflows

### Example 1: New Feature
```bash
# Start autonomous feature development
/feature "Add password reset via email with secure token"

# Review proposal when prompted
# Say "proceed" to start implementation
# Wait for completion (may take 30-60 minutes)
# Review quality-review.md
# Archive when ready:
/openspec:archive {change-id}
```

### Example 2: Bug Fix
```bash
# Quick bug fix
/bugfix "Shopping cart total calculation incorrect with discounts"

# Auto-starts after 3 seconds
# Fixes bug with tests
# Reviews Security + QA
# Archive when ready
```

### Example 3: Refactoring
```bash
# Refactor with specific type
/change "Extract email sending logic into separate service" --type refactor

# Implements refactoring
# Reviews: Software Engineering + QA
# Ensures no behavior changes
# Archive when ready
```

## Integration with Existing Tools

This plugin enhances your existing workflow:
- **OpenSpec**: Still used for spec management
- **Ralph-loop**: Still available for manual use
- **Git**: All work is committed automatically
- **Tests**: Run automatically during implementation
- **Build**: Verified before completion

## Philosophy

**"Structure + Automation + Quality = Autonomous Excellence"**

- **OpenSpec** provides structure and traceability
- **Ralph-loop** provides relentless iteration
- **Agent checklists** ensure quality
- **Human oversight** at key decision points

You define WHAT to build, Claude builds it autonomously, agents verify quality, you approve and ship.

## Troubleshooting

**Ralph is stuck in a loop:**
- Check tasks.md - is it actually making progress?
- Use /cancel-ralph and review what's blocking
- Adjust the proposal/tasks and try again

**Quality review shows blocking issues:**
- Review openspec/changes/{change-id}/quality-review.md
- Fix the issues manually or with targeted commands
- Re-run quality review: manually invoke the ralph-loop from Step 3

**Build or tests fail:**
- Ralph should fix these automatically
- If it can't after max iterations, check the error logs
- May need to adjust tasks or fix manually

**Proposal doesn't match what you want:**
- Edit proposal.md, design.md, tasks.md before proceeding
- Say "ready" when you've customized it
- Implementation will follow your edited plan

## Support

For issues or questions:
- Check this help: `/help` (from this plugin)
- OpenSpec docs: `openspec/AGENTS.md`
- Ralph-loop docs: `/ralph-loop help` (if installed)

---

**Ready to build autonomously?**

Try it now:
```bash
/feature "Add a simple hello world API endpoint with tests"
```
