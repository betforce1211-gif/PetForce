---
name: PetForce: Feature
description: Autonomous feature development with OpenSpec + Multi-Agent Research + Ralph-loop + Quality Gates
category: PetForce Development
tags: [petforce, feature, autonomous, openspec, ralph, agents]
---

# Autonomous Feature Development

You are about to execute the PetForce autonomous development workflow. This combines OpenSpec (planning), Multi-Agent Research (competitive analysis & requirements refinement), Ralph-loop (implementation), and Agent quality gates (iterative validation).

## Process Overview

This workflow will:
1. **Create Initial OpenSpec Proposal** - Generate initial proposal, design, tasks, and spec deltas
2. **Multi-Agent Research & Review** - All agents create checklists, Peter researches competitors and refines requirements
3. **User Approval** - Review final refined proposal before implementation
4. **Autonomous Implementation** - Use Ralph-loop to implement all tasks iteratively
5. **Iterative Quality Validation** - Keep implementing until ALL agent checklists pass
6. **Apply Changes** - Update all affected specs
7. **Ready to Archive** - Present summary for final human approval

## Arguments

Parse the arguments from $ARGUMENTS:
- First argument: Feature description
- `--max-iterations N`: Maximum Ralph iterations (default: 150)
- `--skip-agent-research`: Skip multi-agent research phase (not recommended)
- `--auto-archive`: Automatically archive if all checks pass (dangerous!)

## Step 1: Create Initial OpenSpec Proposal

First, create the initial proposal using the Skill tool:

```
I'll create an initial OpenSpec proposal for: {DESCRIPTION}

Invoking openspec:proposal skill...
```

Use the Skill tool to invoke "openspec:proposal" with the description.

After the proposal is created, tell the user:
```
✅ Initial proposal created!

Next: Multi-agent research & review phase where:
- All agents will create their quality checklists
- Peter will research competitors and best practices
- Peter will refine requirements based on findings
- You'll review the FINAL refined proposal before implementation

Starting agent research phase...
```

**AUTOMATICALLY PROCEED TO STEP 1.5 - DO NOT WAIT FOR USER INPUT YET.**

## Step 1.5: Multi-Agent Research & Review Phase

Launch a Ralph-loop for all agents to research and create checklists, with Peter leading requirements refinement:

```
/ralph-loop "MULTI-AGENT RESEARCH & REVIEW

CONTEXT:
Feature: {DESCRIPTION}
Change ID: {CHANGE_ID}

You are coordinating all PetForce agents to research this feature and create quality checklists. Peter (Product Management) will lead competitive research and requirements refinement.

PROCESS:

1. READ INITIAL PROPOSAL:
   - openspec/changes/{CHANGE_ID}/proposal.md
   - openspec/changes/{CHANGE_ID}/design.md
   - openspec/changes/{CHANGE_ID}/specs/*/spec.md (all spec deltas)

2. CREATE FILE: openspec/changes/{CHANGE_ID}/agent-research.md

3. FOR EACH APPLICABLE AGENT, ADD TO agent-research.md:

   ## {Agent Name} Research & Checklist

   **Scope Review:**
   - Does this feature require {agent} review? [YES/NO with reasoning]

   **Initial Checklist:**
   [If YES, create numbered checklist items specific to this feature]
   1. [ ] Checklist item 1
   2. [ ] Checklist item 2
   ...

   **Questions/Concerns:**
   - List any ambiguities, risks, or questions about the feature

4. PETER (PRODUCT MANAGEMENT) RESEARCH - THIS IS CRITICAL:

   ## Peter (Product Management) Competitive Research

   **Competitor Analysis:**
   Research what competitors are doing for similar features:
   - [Competitor 1]: [What they do, strengths, weaknesses]
   - [Competitor 2]: [What they do, strengths, weaknesses]
   - [Industry standards]: [Best practices, common patterns]

   **Gaps Identified:**
   - What are we missing in the current proposal?
   - What edge cases aren't covered?
   - What could make this feature better?

   **Recommended Requirement Changes:**
   List specific changes to requirements:
   1. ADD: [New requirement with reasoning]
   2. MODIFY: [Existing requirement → Updated version with reasoning]
   3. REMOVE: [Requirement to remove with reasoning]

   **Better Approaches:**
   - Are there better ways to implement this?
   - What would make this more competitive?
   - What would delight users?

5. UPDATE REQUIREMENTS (Peter's Responsibility):

   After Peter's research, UPDATE the spec delta files in openspec/changes/{CHANGE_ID}/specs/*/spec.md:
   - Add new requirements based on competitive research
   - Modify existing requirements to incorporate best practices
   - Remove requirements that don't add value
   - Ensure requirements are competitive and comprehensive

6. OTHER AGENTS REFINE CHECKLISTS:

   After Peter updates requirements, have other agents refine their checklists in agent-research.md:
   - Update checklist items based on new/modified requirements
   - Add items for competitive features Peter added
   - Note any concerns about updated requirements

7. AGENTS TO INCLUDE:

   **Always review (blocking):**
   - Peter (Product Management) - competitive research, requirement refinement
   - Tucker (QA/Testing) - test strategy, edge cases
   - Samantha (Security) - security requirements
   - Dexter (UX Design) - user experience, accessibility
   - Engrid (Software Engineering) - code quality, architecture

   **Conditional (based on feature type):**
   - Axel (API Design) - if API changes
   - Maya (Mobile Development) - if mobile features
   - Isabel (Infrastructure) - if infrastructure changes
   - Buck (Data Engineering) - if data pipelines
   - Ana (Analytics) - if tracking/metrics
   - Thomas (Documentation) - documentation needs
   - Chuck (CI/CD) - deployment considerations
   - Larry (Logging/Observability) - monitoring needs
   - Casey (Customer Success) - customer impact

8. CREATE SUMMARY in agent-research.md:

   ## Research Summary

   **Peter's Key Findings:**
   - [Most important insight from competitive research]
   - [Critical gap that was filled]
   - [Major improvement made to requirements]

   **Requirements Updated:**
   - X requirements added
   - Y requirements modified
   - Z requirements removed

   **Agent Checklist Summary:**
   - Total checklist items across all agents: {count}
   - Agents with concerns/questions: {list}

   **Ready for User Review:** YES

COMPLETION CRITERIA:
✅ agent-research.md created
✅ All applicable agents have created checklists
✅ Peter has researched competitors and best practices
✅ Peter has updated requirements in spec delta files
✅ Other agents have refined checklists based on updated requirements
✅ Summary section complete

Output <promise>AGENT RESEARCH COMPLETE</promise> when done.

IMPORTANT:
- Peter MUST do actual competitive research (use WebSearch if needed)
- Peter MUST update the actual spec delta files with better requirements
- Don't just say 'research needed' - actually do the research
- Be thorough - this is the foundation for quality
" --completion-promise "AGENT RESEARCH COMPLETE" --max-iterations 50
```

After agent research completes, tell the user:
```
✅ Agent research & review complete!

Peter researched competitors and updated requirements.
All agents created quality checklists.

📋 Review the research:
- openspec/changes/{CHANGE_ID}/agent-research.md (agent checklists & Peter's research)
- openspec/changes/{CHANGE_ID}/proposal.md (updated with better requirements)
- openspec/changes/{CHANGE_ID}/specs/*/spec.md (updated spec deltas)

Once you've reviewed and approve the FINAL refined proposal, I'll start implementation.

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
4. Read openspec/changes/{CHANGE_ID}/agent-research.md for agent checklists

4. IMPLEMENTATION LOOP:
   - Find the next uncompleted task (first [ ] checkbox in tasks.md)
   - Implement that specific task completely:
     * Follow the design decisions in design.md
     * Keep agent checklists in mind (from agent-research.md)
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
" --completion-promise "IMPLEMENTATION COMPLETE" --max-iterations {MAX_ITERATIONS}
```

Replace {CHANGE_ID} and {MAX_ITERATIONS} with actual values.

After Ralph-loop completes, proceed to Step 3.

## Step 3: Iterative Quality Validation (Ralph Method)

This is the critical phase where we keep implementing and validating until ALL agent checklists pass.

Run a Ralph-loop that validates against checklists and implements fixes until everything passes:

```
/ralph-loop "ITERATIVE QUALITY VALIDATION (RALPH METHOD)

CONTEXT:
Feature: {CHANGE_ID}
This is the Ralph method - we keep iterating until EVERY agent checklist item passes.

PROCESS:

1. READ AGENT CHECKLISTS:
   - openspec/changes/{CHANGE_ID}/agent-research.md (all agent checklists created in research phase)

2. VALIDATE AGAINST EVERY CHECKLIST:

   CREATE/UPDATE FILE: openspec/changes/{CHANGE_ID}/quality-validation.md

   For each agent's checklist from agent-research.md, evaluate EVERY item:

   ## {Agent Name} Validation - Iteration {N}

   **Checklist Evaluation:**
   1. [Item text]: ✅ PASS | ❌ FAIL - [finding/what's missing]
   2. [Item text]: ✅ PASS | ❌ FAIL - [finding/what's missing]
   ...

   **Status**: APPROVED / BLOCKED
   **Failures**: {count} items failed
   **Blocking Issues**: [list of failed items]

3. IF ANY CHECKLIST ITEMS FAIL:

   a. Document failures in quality-validation.md

   b. Implement fixes for failed items:
      - Add missing tests
      - Fix security issues
      - Improve code quality
      - Add missing documentation
      - Fix UX issues
      - etc.

   c. Mark fixes as completed

   d. Re-run validation (go back to step 2)

   e. Keep iterating until ALL items pass

4. WHEN ALL CHECKLIST ITEMS PASS:

   Add to quality-validation.md:

   ## Final Validation Summary

   **Total Iterations**: {N}
   **All Agent Checklists**: ✅ PASSED

   **Agent Approvals:**
   - Peter (Product Management): ✅ APPROVED - All requirements met
   - Tucker (QA/Testing): ✅ APPROVED - All tests passing
   - Samantha (Security): ✅ APPROVED - No security issues
   - Dexter (UX Design): ✅ APPROVED - UX standards met
   - Engrid (Software Engineering): ✅ APPROVED - Code quality excellent
   [... all applicable agents ...]

   **Ready to Archive**: YES
   **Total Fixes Applied**: {count}

COMPLETION CRITERIA (Ralph Method - ALL must pass):
✅ EVERY checklist item from EVERY agent is ✅ PASS
✅ No ❌ FAIL items remaining
✅ All tests passing
✅ Build succeeds
✅ All fixes committed
✅ quality-validation.md shows all agents APPROVED

Output <promise>ALL CHECKLISTS PASSED</promise> ONLY when EVERY item passes.

IMPORTANT - RALPH METHOD:
- Do NOT proceed until EVERY checklist item passes
- If something fails, FIX IT and re-validate
- Keep iterating - this may take many iterations
- Document each iteration in quality-validation.md
- No shortcuts - every item must pass
- This is the core of quality - don't skip items
" --completion-promise "ALL CHECKLISTS PASSED" --max-iterations 100
```

After validation completes with all checklists passed, proceed to Step 4.

## Step 4: Apply Changes

Apply the OpenSpec changes to update specs using the Skill tool:

```
Applying changes to specs...

Invoking openspec:apply skill...
```

Use the Skill tool to invoke "openspec:apply" with {CHANGE_ID}.

## Step 5: Summary & Archive Readiness

Present a final summary to the user:

```
## 🎉 Feature Development Complete!

### Change: {CHANGE_ID}

**Research Phase:**
✅ All agents researched and created checklists
✅ Peter researched competitors and refined requirements
✅ User approved final refined proposal

**Implementation Status:**
✅ All {task_count} tasks completed
✅ Tests passing
✅ Build successful
✅ Code committed

**Quality Validation (Ralph Method):**
✅ ALL agent checklist items passed
✅ Total iterations: {N}
✅ Total fixes applied: {count}

**Agent Approvals:**
{List each agent with ✅ APPROVED}

**Ready to Archive:** YES (all checklists passed)

### Files Created/Modified:
- {list key files changed}

### Key Achievements:
- {Highlight Peter's competitive research findings}
- {Highlight quality improvements from agent checklists}
- {Note any innovative features added during research}

### Next Steps:

✅ **Ready to archive!**

{If --auto-archive was specified:}
Auto-archiving...
Invoking openspec:archive skill...

{Otherwise:}
To archive this change, invoke the openspec:archive skill with {CHANGE_ID}

---

📋 **Review the complete change:**
- Proposal: openspec/changes/{CHANGE_ID}/proposal.md (refined with Peter's research)
- Design: openspec/changes/{CHANGE_ID}/design.md
- Tasks: openspec/changes/{CHANGE_ID}/tasks.md (all ✅)
- Agent Research: openspec/changes/{CHANGE_ID}/agent-research.md (checklists & competitive research)
- Quality Validation: openspec/changes/{CHANGE_ID}/quality-validation.md (all checklists passed)
- Updated Specs: openspec/specs/*/spec.md (changes applied)
```

## Error Handling

If any step fails:
- Document the failure clearly
- Show what was completed
- Show where it failed
- Provide next steps for the user

## Important Notes

- This workflow can take 45-90+ minutes for complex features
- Multi-agent research phase ensures competitive, well-thought-out requirements
- Ralph-loop will iterate many times during validation - this is expected and desired
- Monitor progress by checking:
  - agent-research.md (research findings & checklists)
  - tasks.md (tasks will be marked [x])
  - quality-validation.md (checklist validations & iterations)
- You can always /cancel-ralph if needed
- Peter's competitive research is CRITICAL - don't skip it
- Quality validation keeps iterating until EVERY checklist passes - no shortcuts

## Philosophy

This implements the PetForce autonomous development philosophy:

1. **Research First** - Peter researches competitors and best practices BEFORE implementation, ensuring we build competitive features
2. **Agent Collaboration** - All agents create checklists upfront, providing clear quality targets
3. **OpenSpec** - Provides structure, planning, and requirements that evolve based on research
4. **Ralph Method** - Relentless iteration until EVERY agent checklist item passes, ensuring quality
5. **No Shortcuts** - Every checklist item must pass - we don't ship until quality gates are met
6. **Human Oversight** - You approve the final refined proposal before implementation starts

### The Ralph Method

The Ralph method is applied in two phases:
- **Phase 1 (Implementation)**: Iterate until all tasks complete
- **Phase 2 (Validation)**: Iterate until all agent checklists pass

This ensures:
- Features are competitive (Peter's research)
- Features meet quality standards (Agent checklists)
- No shortcuts or skipped items
- Production-ready code

You are the orchestrator - Claude is the autonomous implementer - Agents ensure quality.
