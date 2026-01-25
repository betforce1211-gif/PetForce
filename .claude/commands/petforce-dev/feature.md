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

3. FOR EVERY AGENT (ALL 14 REQUIRED), ADD TO agent-research.md:

   ## {Agent Name} Research & Checklist

   **Scope Review:**
   - How does this feature affect {agent}'s domain? [Describe impact or state "N/A"]
   - Review Status: APPLICABLE / NOT APPLICABLE (with reasoning)

   **Checklist:**
   [EVERY agent must create a checklist, even if N/A]

   If APPLICABLE:
   1. [ ] Checklist item 1 specific to this feature
   2. [ ] Checklist item 2 specific to this feature
   ...

   If NOT APPLICABLE:
   1. [N/A] Verified feature does not affect {domain}
   2. [N/A] No {domain} concerns or requirements

   **Questions/Concerns:**
   - List any ambiguities, risks, or questions about the feature
   - If N/A, explicitly state "No concerns from {domain} perspective"

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

7. ALL AGENTS MUST REVIEW (14 REQUIRED):

   EVERY agent must review EVERY feature and create a checklist.
   Even if a feature doesn't affect their domain, they must explicitly
   review and state "N/A - Does not affect {domain}".

   This ensures:
   - No blind spots where cross-domain issues are missed
   - Explicit acknowledgment vs. "wasn't reviewed"
   - Every agent signs off on every feature
   - Cross-domain insights are captured

   **Required Agents (ALL 14):**
   1. Peter (Product Management) - requirements, competitive research
   2. Tucker (QA/Testing) - test strategy, quality assurance
   3. Samantha (Security) - security review, vulnerabilities
   4. Dexter (UX Design) - user experience, accessibility
   5. Engrid (Software Engineering) - code quality, architecture
   6. Larry (Logging/Observability) - monitoring, metrics, logging
   7. Thomas (Documentation) - documentation completeness
   8. Axel (API Design) - API contracts, consistency
   9. Maya (Mobile Development) - mobile app impact
   10. Isabel (Infrastructure) - infrastructure, deployment, scaling
   11. Buck (Data Engineering) - data pipelines, analytics data
   12. Ana (Analytics) - event tracking, funnel metrics
   13. Chuck (CI/CD) - CI/CD pipeline, deployment automation
   14. Casey (Customer Success) - customer impact, support docs

   If an agent determines the feature truly doesn't affect their domain,
   their checklist should be:
   1. [N/A] Verified feature does not affect {domain}
   2. [N/A] No {domain} concerns or requirements

   This is VALID and expected for some agents on some features.

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

   **Agent Review Status (ALL 14 REQUIRED):**
   - ✅ Peter (Product Management) - [APPLICABLE/N/A]
   - ✅ Tucker (QA/Testing) - [APPLICABLE/N/A]
   - ✅ Samantha (Security) - [APPLICABLE/N/A]
   - ✅ Dexter (UX Design) - [APPLICABLE/N/A]
   - ✅ Engrid (Software Engineering) - [APPLICABLE/N/A]
   - ✅ Larry (Logging/Observability) - [APPLICABLE/N/A]
   - ✅ Thomas (Documentation) - [APPLICABLE/N/A]
   - ✅ Axel (API Design) - [APPLICABLE/N/A]
   - ✅ Maya (Mobile Development) - [APPLICABLE/N/A]
   - ✅ Isabel (Infrastructure) - [APPLICABLE/N/A]
   - ✅ Buck (Data Engineering) - [APPLICABLE/N/A]
   - ✅ Ana (Analytics) - [APPLICABLE/N/A]
   - ✅ Chuck (CI/CD) - [APPLICABLE/N/A]
   - ✅ Casey (Customer Success) - [APPLICABLE/N/A]

   **Agent Checklist Summary:**
   - Agents with applicable checklists: {count}
   - Agents with N/A: {count}
   - Total checklist items across all agents: {count}
   - Agents with concerns/questions: {list}

   **Ready for User Review:** YES

COMPLETION CRITERIA:
✅ agent-research.md created
✅ ALL 14 agents have created checklists (applicable or N/A)
✅ Peter has researched competitors and best practices
✅ Peter has updated requirements in spec delta files
✅ Other agents have refined checklists based on updated requirements
✅ Summary section shows all 14 agents reviewed
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

2. VALIDATE AGAINST EVERY CHECKLIST (ALL 14 AGENTS):

   CREATE/UPDATE FILE: openspec/changes/{CHANGE_ID}/quality-validation.md

   For EVERY agent's checklist from agent-research.md (all 14), evaluate EVERY item:

   ## {Agent Name} Validation - Iteration {N}

   **Review Status**: [APPLICABLE / N/A]

   **Checklist Evaluation:**
   [If APPLICABLE:]
   1. [Item text]: ✅ PASS | ❌ FAIL - [finding/what's missing]
   2. [Item text]: ✅ PASS | ❌ FAIL - [finding/what's missing]
   ...

   [If N/A:]
   1. [N/A] Verified feature does not affect {domain}: ✅ ACKNOWLEDGED
   2. [N/A] No {domain} concerns: ✅ ACKNOWLEDGED

   **Status**: APPROVED / BLOCKED / N/A-APPROVED
   **Failures**: {count} items failed (N/A items don't count as failures)
   **Blocking Issues**: [list of failed items, or "None - N/A"]

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

4. WHEN ALL CHECKLIST ITEMS PASS (OR N/A):

   Add to quality-validation.md:

   ## Final Validation Summary

   **Total Iterations**: {N}
   **All Agent Checklists**: ✅ PASSED

   **Agent Approvals (ALL 14 REQUIRED):**
   1. Peter (Product Management): ✅ APPROVED - [summary or N/A]
   2. Tucker (QA/Testing): ✅ APPROVED - [summary or N/A]
   3. Samantha (Security): ✅ APPROVED - [summary or N/A]
   4. Dexter (UX Design): ✅ APPROVED - [summary or N/A]
   5. Engrid (Software Engineering): ✅ APPROVED - [summary or N/A]
   6. Larry (Logging/Observability): ✅ APPROVED - [summary or N/A]
   7. Thomas (Documentation): ✅ APPROVED - [summary or N/A]
   8. Axel (API Design): ✅ APPROVED - [summary or N/A]
   9. Maya (Mobile Development): ✅ APPROVED - [summary or N/A]
   10. Isabel (Infrastructure): ✅ APPROVED - [summary or N/A]
   11. Buck (Data Engineering): ✅ APPROVED - [summary or N/A]
   12. Ana (Analytics): ✅ APPROVED - [summary or N/A]
   13. Chuck (CI/CD): ✅ APPROVED - [summary or N/A]
   14. Casey (Customer Success): ✅ APPROVED - [summary or N/A]

   **Approval Summary:**
   - Applicable Reviews: {count}
   - N/A Reviews: {count}
   - Total: 14/14 ✅

   **Ready to Archive**: YES
   **Total Fixes Applied**: {count}

COMPLETION CRITERIA (Ralph Method - ALL must pass):
✅ EVERY checklist item from ALL 14 agents is ✅ PASS or ✅ N/A-ACKNOWLEDGED
✅ No ❌ FAIL items remaining
✅ All 14 agents have APPROVED status
✅ All tests passing
✅ Build succeeds
✅ All fixes committed
✅ quality-validation.md shows all 14 agents APPROVED

Output <promise>ALL CHECKLISTS PASSED</promise> ONLY when EVERY item passes.

IMPORTANT - RALPH METHOD:
- Do NOT proceed until EVERY checklist item passes (or is acknowledged as N/A)
- ALL 14 agents must have APPROVED status (even if N/A)
- If something fails, FIX IT and re-validate
- Keep iterating - this may take many iterations
- Document each iteration in quality-validation.md
- No shortcuts - every item must pass
- N/A items are valid but must be explicitly acknowledged
- This is the core of quality - don't skip items or agents
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

## Step 4.5: Create Permanent Feature Documentation Folder

After specs are applied, create a permanent feature folder that serves as a reference for this feature:

```
/ralph-loop "CREATE FEATURE DOCUMENTATION FOLDER

CONTEXT:
Feature: {CHANGE_ID}
Create a permanent reference folder for this feature with all documentation and passing checklists.

PROCESS:

1. DETERMINE FEATURE NAME:
   - Convert {CHANGE_ID} to a clean feature name
   - Example: 'add-email-verification' → 'email-verification'
   - Example: 'implement-user-dashboard' → 'user-dashboard'

2. CREATE FOLDER STRUCTURE:

   docs/features/{feature-name}/
   ├── README.md
   ├── documentation/
   │   └── (Thomas's documentation)
   ├── checklists/
   │   └── (Agent checklists showing ✅ PASSED)
   ├── quality-validation.md
   └── implementation-summary.md

3. CREATE README.md:

   ```markdown
   # Feature: {Feature Title}

   **Status**: ✅ Production Ready
   **Completed**: {Date}
   **Change ID**: {CHANGE_ID}

   ## Overview

   {Brief description of what this feature does}

   ## Implementation Summary

   - **Total Tasks**: {count}
   - **Quality Iterations**: {count}
   - **Agent Approvals**: 14/14 ✅
   - **Applicable Reviews**: {count}
   - **N/A Reviews**: {count}
   - **Tests Added**: {count}
   - **Files Modified**: {count}

   ## Key Features

   {List key capabilities added}

   ## Agent Approvals

   All 14 agents reviewed and approved this feature:

   1. ✅ Peter (Product Management) - [summary or N/A]
   2. ✅ Tucker (QA/Testing) - [summary or N/A]
   3. ✅ Samantha (Security) - [summary or N/A]
   4. ✅ Dexter (UX Design) - [summary or N/A]
   5. ✅ Engrid (Software Engineering) - [summary or N/A]
   6. ✅ Larry (Logging/Observability) - [summary or N/A]
   7. ✅ Thomas (Documentation) - [summary or N/A]
   8. ✅ Axel (API Design) - [summary or N/A]
   9. ✅ Maya (Mobile Development) - [summary or N/A]
   10. ✅ Isabel (Infrastructure) - [summary or N/A]
   11. ✅ Buck (Data Engineering) - [summary or N/A]
   12. ✅ Ana (Analytics) - [summary or N/A]
   13. ✅ Chuck (CI/CD) - [summary or N/A]
   14. ✅ Casey (Customer Success) - [summary or N/A]

   ## Documentation

   - [Architecture](./documentation/ARCHITECTURE.md)
   - [API Reference](./documentation/API.md)
   - [User Guide](./documentation/USER_GUIDE.md)
   - [Security](./documentation/SECURITY.md)

   ## Quality Checklists

   All 14 agent checklists from development (applicable or N/A):

   1. [Peter's Product Checklist](./checklists/peter-product-checklist.md)
   2. [Tucker's QA Checklist](./checklists/tucker-qa-checklist.md)
   3. [Samantha's Security Checklist](./checklists/samantha-security-checklist.md)
   4. [Dexter's UX Checklist](./checklists/dexter-ux-checklist.md)
   5. [Engrid's Engineering Checklist](./checklists/engrid-engineering-checklist.md)
   6. [Larry's Logging Checklist](./checklists/larry-logging-checklist.md)
   7. [Thomas's Documentation Checklist](./checklists/thomas-docs-checklist.md)
   8. [Axel's API Design Checklist](./checklists/axel-api-checklist.md)
   9. [Maya's Mobile Checklist](./checklists/maya-mobile-checklist.md)
   10. [Isabel's Infrastructure Checklist](./checklists/isabel-infrastructure-checklist.md)
   11. [Buck's Data Engineering Checklist](./checklists/buck-data-checklist.md)
   12. [Ana's Analytics Checklist](./checklists/ana-analytics-checklist.md)
   13. [Chuck's CI/CD Checklist](./checklists/chuck-cicd-checklist.md)
   14. [Casey's Customer Success Checklist](./checklists/casey-customer-checklist.md)

   ## Related Changes

   - OpenSpec Change: `openspec/changes/{CHANGE_ID}/`
   - Updated Specs: [List specs that were modified]

   ## Testing

   {Summary of tests added}

   ## Future Improvements

   {List any non-blocking improvements for future iterations}
   ```

4. CREATE DOCUMENTATION FOLDER:

   Extract documentation from Thomas's work or create documentation:

   docs/features/{feature-name}/documentation/
   ├── ARCHITECTURE.md (system design, flow diagrams)
   ├── API.md (API reference if applicable)
   ├── USER_GUIDE.md (user-facing documentation)
   ├── SECURITY.md (security model and best practices)
   ├── SETUP.md (developer setup if applicable)
   └── TESTING.md (testing strategy and coverage)

   Each document should be comprehensive and reference the actual implementation.

5. CREATE CHECKLIST FOLDER (ALL 14 AGENTS REQUIRED):

   For EVERY agent (all 14), extract their checklist from
   openspec/changes/{CHANGE_ID}/agent-research.md and create individual files:

   docs/features/{feature-name}/checklists/{agent}-checklist.md

   Format for APPLICABLE reviews:
   ```markdown
   # {Agent Name} Quality Checklist

   **Feature**: {Feature Title}
   **Agent**: {Agent Name} ({Agent Role})
   **Review Status**: APPLICABLE
   **Status**: ✅ ALL ITEMS PASSED
   **Date**: {Date}

   ## Checklist Items

   ✅ 1. [Checklist item 1]
      - **Status**: PASSED
      - **Validation**: [How this was validated]
      - **Files**: [Relevant files]

   ✅ 2. [Checklist item 2]
      - **Status**: PASSED
      - **Validation**: [How this was validated]
      - **Files**: [Relevant files]

   [... all items ...]

   ## Summary

   **Total Items**: {count}
   **Passed**: {count}
   **Failed**: 0

   **Agent Approval**: ✅ APPROVED

   ## Notes

   {Any notes or observations from this agent's review}
   ```

   Format for N/A reviews:
   ```markdown
   # {Agent Name} Quality Checklist

   **Feature**: {Feature Title}
   **Agent**: {Agent Name} ({Agent Role})
   **Review Status**: NOT APPLICABLE
   **Status**: ✅ N/A - ACKNOWLEDGED
   **Date**: {Date}

   ## Review Determination

   This feature does not affect the {domain} domain.

   ## Checklist Items

   ✅ [N/A] Verified feature does not affect {domain}
      - **Status**: ACKNOWLEDGED
      - **Reasoning**: [Why this feature doesn't affect this domain]

   ✅ [N/A] No {domain} concerns or requirements
      - **Status**: ACKNOWLEDGED
      - **Impact**: None

   ## Summary

   **Review Status**: NOT APPLICABLE
   **Agent Approval**: ✅ N/A - APPROVED

   ## Notes

   Feature reviewed from {domain} perspective. No concerns or requirements
   identified. Agent explicitly acknowledges no impact to their domain.
   ```

   ALL 14 agents must have a checklist file:
   1. peter-product-checklist.md
   2. tucker-qa-checklist.md
   3. samantha-security-checklist.md
   4. dexter-ux-checklist.md
   5. engrid-engineering-checklist.md
   6. larry-logging-checklist.md
   7. thomas-docs-checklist.md
   8. axel-api-checklist.md
   9. maya-mobile-checklist.md
   10. isabel-infrastructure-checklist.md
   11. buck-data-checklist.md
   12. ana-analytics-checklist.md
   13. chuck-cicd-checklist.md
   14. casey-customer-checklist.md

6. COPY QUALITY VALIDATION:

   Copy openspec/changes/{CHANGE_ID}/quality-validation.md to:
   docs/features/{feature-name}/quality-validation.md

   This shows the full validation history and iterations.

7. CREATE IMPLEMENTATION SUMMARY:

   docs/features/{feature-name}/implementation-summary.md

   ```markdown
   # Implementation Summary: {Feature Title}

   ## Timeline

   - **Started**: {Date}
   - **Completed**: {Date}
   - **Duration**: {Duration}

   ## Implementation Phases

   ### Phase 1: Research & Planning
   - Initial proposal created
   - Peter researched competitors: [Key findings]
   - Requirements refined based on research
   - All agents created quality checklists
   - User approved final proposal

   ### Phase 2: Implementation
   - Total tasks: {count}
   - Tasks completed: {count}
   - Tests written: {count}
   - Files modified: {count}

   ### Phase 3: Quality Validation (Ralph Method)
   - Total iterations: {count}
   - Checklist items validated: {count}
   - Fixes applied: {count}
   - All agent checklists passed: ✅

   ## Key Files Modified

   {List key files that were changed}

   ## Tests Added

   {List tests that were added}

   ## Quality Metrics

   - **Test Coverage**: {percentage}
   - **Build Status**: ✅ Passing
   - **Lint Status**: ✅ Passing
   - **Type Check**: ✅ Passing
   - **Agent Approvals**: 8/8 ✅

   ## Commits

   {List key commits from this feature}

   ## Competitive Analysis (Peter's Research)

   {Summary of Peter's competitive research findings}

   ## Learnings

   {What we learned during implementation}

   ## Future Enhancements

   {Non-blocking improvements identified for future work}
   ```

8. UPDATE MAIN FEATURES INDEX:

   Create or update docs/features/README.md:

   ```markdown
   # PetForce Features

   This directory contains documentation for all production features that have
   passed through the PetForce autonomous development workflow.

   Each feature folder includes:
   - Complete documentation (Architecture, API, User Guide, Security)
   - Agent quality checklists showing all items passed
   - Quality validation history
   - Implementation summary

   ## Features

   - [{Feature Name}](./{feature-name}/) - {Brief description} ✅ Production Ready
   [... other features ...]

   ## Feature Status Legend

   - ✅ Production Ready - All agent checklists passed
   - 🚧 In Development - Implementation in progress
   - 📋 Planned - Proposal created, not yet implemented
   ```

COMPLETION CRITERIA:
✅ Feature folder created at docs/features/{feature-name}/
✅ README.md created with complete overview showing all 14 agent approvals
✅ documentation/ folder created with all Thomas's docs
✅ checklists/ folder created with ALL 14 agent checklists (applicable or N/A)
✅ All 14 checklist files exist (peter, tucker, samantha, dexter, engrid, larry, thomas, axel, maya, isabel, buck, ana, chuck, casey)
✅ quality-validation.md copied from OpenSpec change
✅ implementation-summary.md created
✅ docs/features/README.md updated with new feature entry
✅ All files are comprehensive and reference actual implementation

Output <promise>FEATURE FOLDER CREATED</promise> when done.

IMPORTANT:
- Make documentation comprehensive and useful for future reference
- Show all checklist items as ✅ PASSED (since validation passed)
- Include actual code references and file paths
- This is the permanent record of this feature - make it thorough
- Future developers should be able to understand the feature from this folder alone
" --completion-promise "FEATURE FOLDER CREATED" --max-iterations 30
```

After feature folder is created, tell the user:
```
✅ Feature documentation folder created!

📁 Permanent reference: docs/features/{feature-name}/

This folder contains:
- Complete documentation by Thomas
- All 14 agent checklists (applicable or N/A)
- Quality validation history showing all iterations
- Implementation summary with timeline and learnings

Future improvements, testing, and enhancements can reference this folder.
```

## Step 5: Summary & Archive Readiness

Present a final summary to the user:

```
## 🎉 Feature Development Complete!

### Change: {CHANGE_ID}

**Research Phase:**
✅ All 14 agents researched and created checklists
✅ Peter researched competitors and refined requirements
✅ User approved final refined proposal

**Implementation Status:**
✅ All {task_count} tasks completed
✅ Tests passing
✅ Build successful
✅ Code committed

**Quality Validation (Ralph Method):**
✅ ALL agent checklist items passed (or acknowledged as N/A)
✅ Total iterations: {N}
✅ Total fixes applied: {count}

**Agent Approvals (ALL 14 REQUIRED):**
1. ✅ Peter (Product Management) - [summary or N/A]
2. ✅ Tucker (QA/Testing) - [summary or N/A]
3. ✅ Samantha (Security) - [summary or N/A]
4. ✅ Dexter (UX Design) - [summary or N/A]
5. ✅ Engrid (Software Engineering) - [summary or N/A]
6. ✅ Larry (Logging/Observability) - [summary or N/A]
7. ✅ Thomas (Documentation) - [summary or N/A]
8. ✅ Axel (API Design) - [summary or N/A]
9. ✅ Maya (Mobile Development) - [summary or N/A]
10. ✅ Isabel (Infrastructure) - [summary or N/A]
11. ✅ Buck (Data Engineering) - [summary or N/A]
12. ✅ Ana (Analytics) - [summary or N/A]
13. ✅ Chuck (CI/CD) - [summary or N/A]
14. ✅ Casey (Customer Success) - [summary or N/A]

**Approval Summary:**
- Applicable Reviews: {count}
- N/A Reviews: {count}
- Total: 14/14 ✅

**Feature Documentation:**
✅ Permanent folder created at docs/features/{feature-name}/
✅ All documentation generated by Thomas
✅ All 14 agent checklists saved (applicable or N/A)
✅ Quality validation history preserved
✅ Implementation summary created

**Ready to Archive:** YES (all 14 checklists approved)

### Files Created/Modified:
- {list key files changed}

### Key Achievements:
- {Highlight Peter's competitive research findings}
- {Highlight quality improvements from agent checklists}
- {Note any innovative features added during research}

### Permanent Documentation:
📁 **docs/features/{feature-name}/** - Complete feature reference
   - README.md - Feature overview with all 14 agent approvals
   - documentation/ - All technical documentation (Thomas's work)
   - checklists/ - All 14 agent checklists (applicable or N/A)
   - quality-validation.md - Full validation history showing Ralph iterations
   - implementation-summary.md - Timeline, metrics, and learnings

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

📁 **Permanent Feature Documentation:**
- Feature Folder: docs/features/{feature-name}/ (complete reference for future improvements)
- All Documentation: docs/features/{feature-name}/documentation/ (Thomas's complete work)
- All 14 Agent Checklists: docs/features/{feature-name}/checklists/ (applicable or N/A)
```

## Error Handling

If any step fails:
- Document the failure clearly
- Show what was completed
- Show where it failed
- Provide next steps for the user

## Important Notes

- This workflow can take 45-90+ minutes for complex features
- **ALL 14 agents MUST review EVERY feature** - even if their conclusion is "N/A - Does not affect my domain"
- Multi-agent research phase ensures competitive, well-thought-out requirements with no blind spots
- Ralph-loop will iterate many times during validation - this is expected and desired
- Monitor progress by checking:
  - agent-research.md (all 14 agent research findings & checklists)
  - tasks.md (tasks will be marked [x])
  - quality-validation.md (all 14 agent checklist validations & iterations)
- You can always /cancel-ralph if needed
- Peter's competitive research is CRITICAL - don't skip it
- Quality validation keeps iterating until EVERY checklist passes (or is acknowledged as N/A) - no shortcuts
- A permanent feature folder is created at docs/features/{feature-name}/ with:
  - Complete documentation (Thomas's work)
  - All 14 agent checklists showing ✅ PASSED or ✅ N/A
  - Quality validation history with all Ralph iterations
  - Implementation summary with timeline and learnings
  - This serves as the permanent reference for future improvements and testing

## Philosophy

This implements the PetForce autonomous development philosophy:

1. **Research First** - Peter researches competitors and best practices BEFORE implementation, ensuring we build competitive features
2. **Agent Collaboration** - All agents create checklists upfront, providing clear quality targets
3. **OpenSpec** - Provides structure, planning, and requirements that evolve based on research
4. **Ralph Method** - Relentless iteration until EVERY agent checklist item passes, ensuring quality
5. **No Shortcuts** - Every checklist item must pass - we don't ship until quality gates are met
6. **Human Oversight** - You approve the final refined proposal before implementation starts
7. **Permanent Documentation** - Every feature gets a permanent folder with complete documentation and passing checklists, serving as a reference for future improvements and testing

### The Ralph Method

The Ralph method is applied in two phases:
- **Phase 1 (Implementation)**: Iterate until all tasks complete
- **Phase 2 (Validation)**: Iterate until all agent checklists pass

This ensures:
- Features are competitive (Peter's research)
- Features meet quality standards (Agent checklists)
- No shortcuts or skipped items
- Production-ready code
- Permanent documentation and quality records for future reference

You are the orchestrator - Claude is the autonomous implementer - Agents ensure quality - Documentation preserves knowledge.
