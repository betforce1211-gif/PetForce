---
name: PetForce: Bug Fix
description: Autonomous bug fix with testing and quick quality review
category: PetForce Development
tags: [petforce, bugfix, testing, autonomous]
---

# Autonomous Bug Fix Workflow

You are executing a streamlined bug fix workflow. This is faster than /feature because it assumes:
- Smaller scope (fixing specific issue)
- Existing codebase (not creating new features)
- Focus on testing and verification

## Process Overview

1. **Create OpenSpec Proposal** (lightweight for bugs)
2. **Autonomous Fix + Testing** (Ralph-loop with test focus)
3. **Quick Quality Review** (Security + QA only)
4. **Apply & Archive** (faster path to production)

## Arguments

Parse the arguments from $ARGUMENTS:
- First argument: Bug description
- `--max-iterations N`: Maximum Ralph iterations (default: 30)
- `--skip-tests`: Skip test creation (not recommended)
- `--auto-archive`: Auto-archive if tests pass (use with caution)

## Step 1: Create Bug Fix Proposal

Create a proposal using the Skill tool:

```
I'll create a bug fix proposal for: {DESCRIPTION}

Invoking openspec:proposal skill with "BugFix: {DESCRIPTION}"...
```

Use the Skill tool to invoke "openspec:proposal".

After proposal creation, tell the user:
```
✅ Bug fix proposal created!

Quick review of:
- openspec/changes/{change-id}/tasks.md

This is a bug fix, so I'll proceed automatically unless you say "wait" in the next 5 seconds.

To pause: Say "wait" or "stop"
To customize: Edit the files
To proceed: Say "continue" or just wait
```

**Pause for 3 seconds**, then proceed automatically (unless user intervened).

## Step 2: Autonomous Bug Fix + Testing

Launch Ralph-loop optimized for bug fixing:

```
/ralph-loop "AUTONOMOUS BUG FIX

CONTEXT:
Fixing bug: {DESCRIPTION}
Change ID: {CHANGE_ID}

PROCESS:

1. UNDERSTAND THE BUG:
   - Read openspec/changes/{CHANGE_ID}/tasks.md
   - Identify what's broken and why
   - Locate the problematic code

2. REPRODUCE THE BUG:
   - Write a failing test that demonstrates the bug
   - Run the test to confirm it fails
   - Document the failure mode

3. FIX THE BUG:
   - Implement the minimal fix
   - Keep changes focused (don't refactor unrelated code)
   - Follow existing patterns in the codebase

4. VERIFY THE FIX:
   - Run the new test - it should now pass
   - Run ALL existing tests - ensure no regressions
   - Run build - ensure no TypeScript errors
   - Test manually if needed (document steps in tasks.md)

5. UPDATE TASKS:
   - Mark each task in tasks.md as [x] when complete
   - Add any additional verification steps you performed

COMPLETION CRITERIA (ALL must be true):
✅ Bug is fixed (new test passes)
✅ No regressions (all existing tests pass)
✅ Build succeeds
✅ All tasks in tasks.md marked [x]
✅ Changes committed with clear message explaining the fix

Output <promise>BUG FIXED</promise> ONLY when ALL criteria met.

IMPORTANT:
- Focus on minimal, targeted fix
- Don't introduce new features
- Prioritize test coverage
- If you can't reproduce the bug, document why in tasks.md
" --completion-promise "BUG FIXED" --max-iterations {MAX_ITERATIONS}
```

## Step 3: Quick Quality Review

For bug fixes, only review Security and QA (blocking agents):

```
/ralph-loop "BUG FIX QUALITY REVIEW

Review the bug fix '{CHANGE_ID}' against Security and QA checklists.

1. CREATE FILE: openspec/changes/{CHANGE_ID}/quality-review.md

2. SECURITY REVIEW:
   Read openspec/specs/security/spec.md
   Evaluate relevant items (skip N/A items):
   - Did the fix introduce any security issues?
   - Are inputs still validated?
   - Are auth/authorization still working?
   - Any new dependencies that need scanning?

   Write findings in quality-review.md

3. QA TESTING REVIEW:
   Read openspec/specs/qa-testing/spec.md
   Evaluate:
   - ✅ Test written for the bug
   - ✅ All existing tests still pass
   - ✅ No regressions introduced
   - ✅ Edge cases considered
   - ✅ Manual testing documented (if applicable)

   Write findings in quality-review.md

4. SUMMARY:
   ## Summary

   **Security:** [APPROVED/BLOCKED]
   **QA Testing:** [APPROVED/BLOCKED]

   **Ready to Archive:** [YES/NO]
   **Blocking Issues:** [None or list]

Output <promise>BUG FIX REVIEWED</promise> when done.
" --completion-promise "BUG FIX REVIEWED" --max-iterations 15
```

## Step 4: Apply & Ready to Archive

Apply changes using the Skill tool:

```
Applying bug fix changes...

Invoking openspec:apply skill...
```

Use Skill tool to invoke "openspec:apply" with {CHANGE_ID}.

## Step 5: Summary

```
## 🐛 Bug Fix Complete!

### Bug: {DESCRIPTION}
### Change: {CHANGE_ID}

**Fix Status:**
✅ Bug reproduced with test
✅ Fix implemented
✅ Tests passing (including regression tests)
✅ Build successful

**Quality Review:**
✅ Security: {APPROVED/BLOCKED}
✅ QA Testing: {APPROVED/BLOCKED}

**Ready to Archive:** {YES/NO}

### What was fixed:
{Brief summary from tasks.md}

### Next Steps:

{If approved:}
✅ **Ready to ship!** Invoke openspec:archive skill with {CHANGE_ID}

{If blocked:}
❌ **Issues found:**
{List blocking issues}

Review openspec/changes/{CHANGE_ID}/quality-review.md

{If --auto-archive AND approved:}
Auto-archiving bug fix...
Invoking openspec:archive skill...
✅ Bug fix archived and ready for deployment!

---

📋 **Files changed:**
{List modified files}

🧪 **Tests added:**
{List new test files}
```

## Bug Fix Best Practices

This workflow enforces:
- ✅ Test-driven bug fixing (write failing test first)
- ✅ Minimal changes (fix the bug, don't refactor)
- ✅ Regression prevention (all tests must pass)
- ✅ Fast iteration (optimized for speed)

## When to Use /bugfix vs /feature

**Use /bugfix when:**
- Fixing a specific broken behavior
- Scope is well-defined and small
- Need to ship quickly
- Focus is on testing and verification

**Use /feature when:**
- Adding new functionality
- Multiple components affected
- Needs full agent review
- Architectural decisions required
