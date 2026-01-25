---
description: "Autonomous feature development with OpenSpec + Ralph-loop"
argument-hint: "DESCRIPTION [--max-iterations N] [--skip-quality-review]"
---

# Autonomous Feature Development

You are about to execute the PetForce autonomous development workflow. This combines OpenSpec (planning), Ralph-loop (implementation), and Agent quality gates (review).

## Process Overview

This workflow will:
1. **Create OpenSpec Proposal** - Generate proposal, design, tasks, and spec deltas
2. **Autonomous Implementation** - Use Ralph-loop to implement all tasks iteratively
3. **Quality Gate Review** - Evaluate against all agent checklists
4. **Apply Changes** - Update all affected specs
5. **Ready to Archive** - Present summary for final human approval

## Arguments

Parse the arguments:
- First argument: Feature description
- `--max-iterations N`: Maximum Ralph iterations (default: 150)
- `--skip-quality-review`: Skip agent checklist review phase
- `--auto-archive`: Automatically archive if all checks pass (dangerous!)

## Step 1: Create OpenSpec Proposal

First, create the proposal:

```
I'll create an OpenSpec proposal for: {DESCRIPTION}

Running: /openspec:proposal "{DESCRIPTION}"
```

Use the Skill tool to invoke the openspec:proposal skill with the description.

After the proposal is created, **DO NOT CONTINUE TO STEP 2 YET**.

Instead, tell the user:
```
✅ Proposal created!

Review the proposal files:
- openspec/changes/{change-id}/proposal.md
- openspec/changes/{change-id}/design.md
- openspec/changes/{change-id}/tasks.md

Once you've reviewed and are happy with the plan, I'll start autonomous implementation.

To continue: Say "proceed" or "start implementation"
To modify: Edit the files and say "ready"
To cancel: Say "cancel"
```

**WAIT FOR USER CONFIRMATION BEFORE PROCEEDING TO STEP 2.**

## Step 2: Autonomous Implementation (After User Confirms)

Only execute this after the user confirms they're ready to proceed.

Launch a Ralph-loop to autonomously implement all tasks:

```
/ralph-loop "AUTONOMOUS FEATURE IMPLEMENTATION

CONTEXT:
You are implementing the '{CHANGE_ID}' OpenSpec change for PetForce.

PROCESS:
1. Read openspec/changes/{CHANGE_ID}/proposal.md for context
2. Read openspec/changes/{CHANGE_ID}/design.md for technical approach
3. Read openspec/changes/{CHANGE_ID}/tasks.md for task list

4. IMPLEMENTATION LOOP:
   - Find the next uncompleted task (first [ ] checkbox in tasks.md)
   - Implement that specific task completely:
     * Follow the design decisions in design.md
     * Write tests for the functionality
     * Run tests and fix any failures
     * Ensure TypeScript/build has no errors
     * Commit your changes with clear message
   - Mark the task as [x] in tasks.md
   - Move to the next [ ] task
   - Repeat until ALL tasks are [x]

5. VERIFICATION:
   - Run full test suite: npm test (or appropriate command)
   - Run build: npm run build (or appropriate command)
   - Ensure no errors or failures
   - Review all changed files
   - All tasks in tasks.md must be [x]

COMPLETION CRITERIA (ALL must be true):
✅ Every task in tasks.md is marked [x]
✅ All tests passing (npm test shows 0 failures)
✅ Build succeeds with no errors (npm run build)
✅ All code is committed to git
✅ Implementation matches the design.md specifications

Output <promise>IMPLEMENTATION COMPLETE</promise> ONLY when ALL criteria are met.

IMPORTANT:
- Work systematically through tasks.md in order
- Don't skip tasks or mark them complete prematurely
- If you get stuck on a task after 5 attempts, document the blocker in tasks.md and move on
- Commit frequently (after each completed task)
- Read your previous work in files - you're iterating on your own code

--completion-promise 'IMPLEMENTATION COMPLETE' --max-iterations {MAX_ITERATIONS}
```

Replace {CHANGE_ID} and {MAX_ITERATIONS} with actual values.

After Ralph-loop completes, proceed to Step 3 (unless --skip-quality-review was specified).

## Step 3: Quality Gate Review

Run the agent quality checklist review:

```
/ralph-loop "QUALITY GATE REVIEW

CONTEXT:
Review the '{CHANGE_ID}' change against all applicable PetForce agent quality checklists.

PROCESS:
1. Read openspec/changes/{CHANGE_ID}/ to understand what was implemented
2. Identify which agents need to review (based on what was changed)
3. For each applicable agent, read their checklist from openspec/specs/{agent}/spec.md

4. CREATE FILE: openspec/changes/{CHANGE_ID}/quality-review.md

5. FOR EACH APPLICABLE AGENT:
   Read their quality checklist from openspec/specs/{agent}/spec.md

   Evaluate EVERY checklist item as:
   - ✅ Yes (requirement met)
   - ❌ No (requirement not met)
   - ⚠️  N/A (not applicable - with justification)

   Write findings in quality-review.md following this format:

   ## {Agent Name} Review - [APPROVED/BLOCKED/APPROVED WITH NOTES]

   **Checklist Evaluation:**
   1. Item name: ✅ Yes - [brief finding]
   2. Item name: ❌ No - [what's missing]
   3. Item name: ⚠️ N/A - [why not applicable]

   **Status**: APPROVED / APPROVED WITH NOTES / BLOCKED
   **Blocking Issues**: [list if any]
   **Recommendations**: [list improvements]

6. AGENTS TO REVIEW:
   **Blocking (must approve):**
   - Product Management (requirements quality)
   - Security (security review)
   - QA Testing (testing quality)
   - CI/CD (deployment readiness)
   - Feature Development Process (overall coordination)

   **Non-blocking (feedback only):**
   - UX Design (if UI changes)
   - Documentation (docs quality)
   - Analytics (if tracking added)
   - Logging & Observability (if monitoring added)
   - Customer Success (if customer-facing)

   **Conditional (if applicable):**
   - Software Engineering (code quality)
   - API Design (if API changes)
   - Infrastructure (if infra changes)
   - Data Engineering (if data pipeline changes)
   - Mobile Development (if mobile changes)

7. CREATE SUMMARY in quality-review.md:

   ## Summary

   **Blocking Agents:** {pass_count}/{total_blocking} APPROVED
   - Product Management: [APPROVED/BLOCKED]
   - Security: [APPROVED/BLOCKED]
   - QA Testing: [APPROVED/BLOCKED]
   - CI/CD: [APPROVED/BLOCKED]
   - Feature Development Process: [APPROVED/BLOCKED]

   **Non-blocking Agents:** {findings_count} issues tracked

   **Ready to Archive:** [YES/NO]
   **Blocking Issues:** [list or "None"]

COMPLETION CRITERIA:
✅ quality-review.md created
✅ All applicable agents reviewed
✅ Every checklist item evaluated (Yes/No/N/A)
✅ Summary section complete with clear YES/NO on "Ready to Archive"

Output <promise>QUALITY REVIEW COMPLETE</promise> when done.

--completion-promise 'QUALITY REVIEW COMPLETE' --max-iterations 25
```

## Step 4: Apply Changes

Apply the OpenSpec changes to update specs:

```
Applying changes to specs...

Running: /openspec:apply {CHANGE_ID}
```

Use the Skill tool to invoke openspec:apply.

## Step 5: Summary & Archive Readiness

Present a final summary to the user:

```
## 🎉 Autonomous Development Complete!

### Change: {CHANGE_ID}

**Implementation Status:**
✅ All {task_count} tasks completed
✅ Tests passing
✅ Build successful
✅ Code committed

**Quality Review Status:**
{Show blocking agent approvals}
{Show non-blocking findings}

**Ready to Archive:** {YES/NO based on quality-review.md}

### Files Created/Modified:
- {list key files changed}

### Next Steps:

{If all blocking agents approved:}
✅ **Ready to archive!** Run:
   `/openspec:archive {CHANGE_ID}`

{If blocking issues exist:}
❌ **Blocking issues found:**
{list blocking issues from quality-review.md}

Review openspec/changes/{CHANGE_ID}/quality-review.md for details.
Fix blocking issues and re-run quality review.

{If --auto-archive was specified AND all checks pass:}
Auto-archiving...
Running: /openspec:archive {CHANGE_ID}

---

📋 **Review the complete change:**
- Proposal: openspec/changes/{CHANGE_ID}/proposal.md
- Design: openspec/changes/{CHANGE_ID}/design.md
- Tasks: openspec/changes/{CHANGE_ID}/tasks.md
- Quality Review: openspec/changes/{CHANGE_ID}/quality-review.md
```

## Error Handling

If any step fails:
- Document the failure clearly
- Show what was completed
- Show where it failed
- Provide next steps for the user

## Important Notes

- This workflow can take 30+ minutes for complex features
- Ralph-loop will iterate many times - this is expected
- Monitor progress by checking tasks.md (tasks will be marked [x])
- You can always /cancel-ralph if needed
- Review quality-review.md before archiving

## Philosophy

This implements the PetForce autonomous development philosophy:
- **OpenSpec** provides structure and planning
- **Ralph-loop** provides relentless iteration until completion
- **Agent checklists** ensure quality and completeness
- **Human oversight** at key decision points (proposal review, final archive)

You are the orchestrator - Claude is the autonomous implementer.
