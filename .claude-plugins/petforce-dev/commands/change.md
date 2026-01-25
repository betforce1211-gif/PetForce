---
description: "General autonomous change workflow (refactoring, updates, etc.)"
argument-hint: "DESCRIPTION [--max-iterations N]"
---

# General Change Workflow

Use this for changes that aren't new features or bug fixes:
- Refactoring
- Dependency updates
- Configuration changes
- Documentation improvements
- Performance optimizations
- Code cleanup

This is a flexible workflow that adapts to the type of change.

## Arguments

Parse the arguments:
- First argument: Change description
- `--max-iterations N`: Maximum Ralph iterations (default: 75)
- `--type TYPE`: Change type (refactor, deps, config, docs, perf, cleanup)

## Process

This follows the same workflow as /feature but with adapted messaging:

1. **Create Proposal** - OpenSpec proposal for the change
2. **Implement** - Ralph-loop for autonomous implementation
3. **Quality Review** - Agent checklists (subset based on change type)
4. **Apply & Archive** - Update specs and prepare for archive

Use the same structure as /feature command, but:

### Adapt Quality Review Based on Type

**For refactoring (--type refactor):**
- Review: Software Engineering, QA Testing
- Focus: Code quality, test coverage, no behavior changes

**For dependency updates (--type deps):**
- Review: Security, CI/CD, Software Engineering
- Focus: Vulnerability scanning, build success, breaking changes

**For configuration (--type config):**
- Review: Infrastructure, CI/CD, Security
- Focus: Environment parity, secrets management, deployment safety

**For documentation (--type docs):**
- Review: Documentation, Product Management
- Focus: Completeness, accuracy, examples

**For performance (--type perf):**
- Review: Software Engineering, QA Testing, Infrastructure
- Focus: Benchmarks, load testing, resource usage

**For cleanup (--type cleanup):**
- Review: Software Engineering, QA Testing
- Focus: No breaking changes, tests still pass, code quality

### If no --type specified:

Ask the user:
```
What type of change is this?
1. refactor - Code refactoring
2. deps - Dependency updates
3. config - Configuration changes
4. docs - Documentation improvements
5. perf - Performance optimization
6. cleanup - Code cleanup

Reply with the number or type name, or I'll treat it as a general change and review with all agents.
```

Wait for user response, then proceed with appropriate agent subset.

## Implementation Prompt

Use similar Ralph-loop structure as /feature but adapt the completion criteria based on change type.

For refactoring example:
```
COMPLETION CRITERIA (refactoring):
✅ Code is cleaner and more maintainable
✅ All existing tests still pass (no behavior changes)
✅ No new bugs introduced
✅ Refactoring documented in code comments if complex
✅ Build succeeds
```

## Summary Format

```
## 🔄 Change Complete!

### Change: {DESCRIPTION}
### Type: {TYPE}
### Change ID: {CHANGE_ID}

**Implementation Status:**
✅ All tasks completed
✅ {Type-specific verification} passed
✅ Build successful

**Quality Review:**
{List relevant agents and their status}

**Ready to Archive:** {YES/NO}

### Next Steps:
{Same as /feature}
```

## Philosophy

The /change command is for maintaining and improving existing code without adding features or fixing bugs. It emphasizes:
- Code quality
- Maintainability
- Safety (no breaking changes)
- Appropriate review based on change type
