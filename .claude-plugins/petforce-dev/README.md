# PetForce Autonomous Development Plugin

Autonomous development workflow for PetForce that combines OpenSpec, Ralph-loop, and Agent quality gates into single commands.

## What This Does

This plugin automates the entire feature development lifecycle:

1. **Planning** - Creates OpenSpec proposals with design docs and task lists
2. **Implementation** - Uses Ralph-loop to autonomously implement all tasks
3. **Quality Gates** - Reviews code against all 15 agent quality checklists
4. **Ready to Ship** - Prepares changes for archive and deployment

## Commands

- `/feature <description>` - Full autonomous feature development
- `/bugfix <description>` - Fast bug fix workflow with testing
- `/change <description>` - General changes (refactoring, config, docs)
- `/help` - Detailed help and examples

## Quick Start

```bash
# Install the plugin (done automatically when in PetForce directory)

# Create a new feature
/feature "Add user settings page with theme preferences"

# Fix a bug
/bugfix "Login redirect loops on invalid credentials"

# Refactor code
/change "Extract validation logic into utils" --type refactor
```

## How It Works

```
You: /feature "Add notifications system"
    ↓
Claude creates OpenSpec proposal
    ↓
You review and approve
    ↓
Ralph-loop implements all tasks (autonomous, may take 30-60 min)
    ↓
Agent checklists review quality
    ↓
Changes applied to specs
    ↓
You: /openspec:archive <change-id>
    ↓
Ready to deploy! 🚀
```

## Requirements

- OpenSpec must be initialized in your project
- Ralph-loop plugin must be installed
- Git repository (for commits)
- Test infrastructure (for verification)

## Benefits

**For developers:**
- Focus on WHAT to build, not HOW
- Autonomous implementation while you do other things
- Guaranteed quality through agent reviews
- Consistent development process

**For the codebase:**
- All changes documented in OpenSpec
- Comprehensive test coverage
- Quality gates prevent issues
- Traceable decisions and changes

**For the team:**
- Faster development cycles
- Consistent code quality
- Reduced review burden
- Knowledge captured in specs

## Philosophy

This plugin embodies PetForce's development philosophy:

> **"Structure + Automation + Quality = Autonomous Excellence"**

- **OpenSpec** provides structure and planning
- **Ralph-loop** provides autonomous iteration
- **Agent checklists** ensure comprehensive quality
- **Human oversight** at critical decision points

You remain in control while delegating the implementation details to autonomous agents.

## Examples

### Example: E-commerce Feature

```bash
/feature "Add shopping cart with checkout flow:
- Add/remove items from cart
- Persist cart across sessions
- Calculate totals with tax
- Checkout form with validation
- Payment integration (Stripe)
- Order confirmation email
"
```

Result after ~60 minutes:
- ✅ Complete implementation with tests
- ✅ Security reviewed (payment handling)
- ✅ QA reviewed (checkout flow tested)
- ✅ All agent checklists complete
- ✅ Ready to ship

### Example: Quick Bug Fix

```bash
/bugfix "Email validation accepts invalid domains"
```

Result after ~15 minutes:
- ✅ Bug reproduced with test
- ✅ Fix implemented
- ✅ All tests passing
- ✅ Security + QA approved
- ✅ Ready to deploy

### Example: Refactoring

```bash
/change "Refactor database connection pooling to use singleton pattern" --type refactor
```

Result after ~20 minutes:
- ✅ Code refactored
- ✅ No behavior changes
- ✅ All tests still passing
- ✅ Code quality improved
- ✅ Ready to merge

## Advanced Usage

### Custom Iteration Limits

```bash
# For complex features
/feature "Build recommendation engine" --max-iterations 200

# For simple bugs
/bugfix "Fix typo in error message" --max-iterations 5
```

### Skip Quality Review (Not Recommended)

```bash
# For quick experiments only
/feature "Test new library" --skip-quality-review
```

### Auto-Archive (Use With Caution)

```bash
# Only for trusted, automated workflows
/bugfix "Update dependency version" --auto-archive
```

## Monitoring Progress

While Ralph is running, monitor progress:

```bash
# Check tasks being completed
cat openspec/changes/{change-id}/tasks.md

# Watch git commits
git log --oneline

# Monitor test output
# (Ralph will show test results in terminal)
```

## Troubleshooting

**Ralph gets stuck:**
```bash
/cancel-ralph
# Review what's blocking in tasks.md
# Fix manually or adjust proposal
```

**Quality gates fail:**
```bash
# Review quality-review.md
# Fix blocking issues
# Re-run: invoke ralph-loop for quality review step manually
```

**Proposal isn't what you want:**
```bash
# Edit the proposal files before saying "proceed"
# Customize tasks.md, design.md as needed
```

## Integration

This plugin works alongside:
- **OpenSpec commands** - `/openspec:proposal`, `/openspec:archive`
- **Ralph-loop commands** - `/ralph-loop`, `/cancel-ralph`
- **Git** - All work committed automatically
- **Testing frameworks** - Tests run during implementation
- **CI/CD** - Works with your existing pipeline

## Files Created

For each feature/bugfix/change, creates:

```
openspec/changes/{change-id}/
├── proposal.md          # Why this change
├── design.md            # How it's built
├── tasks.md             # Implementation tasks (auto-updated)
├── quality-review.md    # Agent checklist results
└── specs/               # Spec deltas for affected agents
    ├── security/
    ├── qa-testing/
    └── ...
```

## Best Practices

1. **Review proposals** - Don't blindly approve, customize if needed
2. **Set max-iterations** - Safety net for runaway tasks
3. **Check quality-review.md** - Don't skip agent feedback
4. **Use right command** - /feature vs /bugfix vs /change
5. **Monitor progress** - Check tasks.md periodically
6. **Archive manually** - Review before archiving (unless confident)

## When NOT to Use

Don't use for:
- Exploratory work (use regular development)
- Tasks requiring many design decisions (collaborate first)
- Quick one-line changes (faster to do manually)
- Production debugging (use targeted debugging)

## Contributing

To modify this plugin:

1. Edit files in `.claude-plugins/petforce-dev/`
2. Restart Claude Code to reload
3. Test with simple examples first

## License

Internal PetForce tool - not for external distribution.

## Support

Questions or issues? Check:
- `/help` - Built-in help command
- `openspec/AGENTS.md` - Agent documentation
- Ralph-loop README - `/ralph-loop help`

---

**Ready to build autonomously?**

```bash
/feature "Your idea here"
```
