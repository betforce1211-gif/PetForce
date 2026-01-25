---
name: PetForce: Change
description: General autonomous change workflow (refactoring, updates, config, docs)
category: PetForce Development
tags: [petforce, change, refactor, autonomous]
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

Parse the arguments from $ARGUMENTS:
- First argument: Change description
- `--max-iterations N`: Maximum Ralph iterations (default: 75)
- `--type TYPE`: Change type (refactor, deps, config, docs, perf, cleanup)

## Process

This follows the same workflow as /feature but with adapted messaging and agent reviews based on change type.

### Determine Change Type

If `--type` is not specified, ask the user:
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

### Execute Workflow

Follow these steps (same as /feature):

1. **Create Proposal** - Use Skill tool to invoke "openspec:proposal"
2. **User Review** - Wait for approval
3. **Implementation** - Ralph-loop autonomous implementation
4. **Quality Review** - Adapted based on change type (see below)
5. **Apply** - Use Skill tool to invoke "openspec:apply"
6. **Summary** - Present results

### Quality Review Adaptation

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

### Implementation Prompt Template

Adapt the Ralph-loop prompt based on change type. Example for refactoring:

```
/ralph-loop "AUTONOMOUS REFACTORING

CONTEXT:
Refactoring: {DESCRIPTION}
Change ID: {CHANGE_ID}

PROCESS:
1. Read openspec/changes/{CHANGE_ID}/tasks.md
2. Implement refactoring changes following design.md
3. Ensure NO behavior changes (tests must still pass)
4. Update tasks.md as you complete each task

COMPLETION CRITERIA (refactoring):
✅ Code is cleaner and more maintainable
✅ All existing tests still pass (no behavior changes)
✅ No new bugs introduced
✅ Refactoring documented in code comments if complex
✅ Build succeeds
✅ All tasks marked [x]

Output <promise>REFACTORING COMPLETE</promise> when done.
" --completion-promise "REFACTORING COMPLETE" --max-iterations {MAX_ITERATIONS}
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
{If approved, show how to archive}
{If blocked, show what needs fixing}
```

## Philosophy

The /change command is for maintaining and improving existing code without adding features or fixing bugs. It emphasizes:
- Code quality
- Maintainability
- Safety (no breaking changes)
- Appropriate review based on change type
