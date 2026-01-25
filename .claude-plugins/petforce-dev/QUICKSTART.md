# Quick Start Guide

## Installation

The plugin is automatically available when working in the PetForce directory. No manual installation needed!

## Your First Autonomous Feature

```bash
# 1. Start a simple feature
/feature "Add a GET /health endpoint that returns {status: 'ok'}"

# 2. Review the proposal when prompted
# 3. Say "proceed" to start autonomous implementation
# 4. Wait 10-15 minutes while Ralph implements it
# 5. Review the quality-review.md
# 6. Archive when ready:
/openspec:archive {change-id}
```

## Common Commands

### New Feature
```bash
/feature "Add user logout functionality"
```

### Bug Fix
```bash
/bugfix "Login form doesn't handle network errors gracefully"
```

### Refactoring
```bash
/change "Extract email validation into a utility function" --type refactor
```

### Need Help?
```bash
/help
```

## What Happens During a /feature Command

```
[You] /feature "Add notifications"
     ↓
[1-2 min] Creates OpenSpec proposal
     ↓
[You review] Check proposal.md, design.md, tasks.md
     ↓
[You approve] Say "proceed"
     ↓
[30-60 min] Ralph-loop implements autonomously
     - Writes code
     - Writes tests
     - Fixes test failures
     - Commits work
     - Updates tasks.md
     ↓
[10-15 min] Quality review by all agents
     - Security checklist
     - QA checklist
     - Documentation checklist
     - etc.
     ↓
[1 min] Applies changes to specs
     ↓
[You] Review quality-review.md
     ↓
[You] /openspec:archive {change-id}
     ↓
[Done!] Ready to deploy
```

## Tips

1. **Be specific** - Clear requirements = better results
   - ✅ "Add password reset via email with 24-hour expiry token"
   - ❌ "Add password stuff"

2. **Include success criteria** - Ralph knows when it's done
   - ✅ "Add tests with 80%+ coverage"
   - ✅ "All existing tests must pass"

3. **Use the right command** - Faster results
   - New stuff? → `/feature`
   - Broken stuff? → `/bugfix`
   - Refactor/config/docs? → `/change`

4. **Monitor progress** - Check tasks.md
   ```bash
   watch -n 5 cat openspec/changes/{change-id}/tasks.md
   ```

5. **Set safety limits** - Prevent infinite loops
   ```bash
   /feature "..." --max-iterations 50
   ```

## File Locations

All work goes into:
```
openspec/changes/{change-id}/
├── proposal.md          # What and why
├── design.md            # How
├── tasks.md             # Checklist (auto-updated)
└── quality-review.md    # Agent reviews (created during workflow)
```

## Emergency Stop

If something goes wrong:
```bash
/cancel-ralph
```

Your work is saved in files - you can continue manually.

## Example: Your First Feature

Let's build a simple health check endpoint:

```bash
/feature "Add GET /api/health endpoint:
- Returns JSON: {status: 'ok', timestamp: ISO8601, version: package.json.version}
- Include a test that verifies response structure
- Add to API documentation
"
```

Expected result after ~15 minutes:
- ✅ Endpoint implemented
- ✅ Test written and passing
- ✅ API docs updated
- ✅ Quality reviewed
- ✅ Ready to archive

## Next Steps

Once you're comfortable:
- Try a real feature from your backlog
- Experiment with `/bugfix` for quick fixes
- Use `/change` for refactoring
- Combine multiple commands for complex work

## Need More Help?

```bash
/help  # Detailed documentation
```

Or check:
- `README.md` - Full plugin documentation
- `openspec/AGENTS.md` - Agent details
- Ralph-loop docs - `/ralph-loop help`

---

**Ready? Let's build something!**

```bash
/feature "Your idea here"
```
