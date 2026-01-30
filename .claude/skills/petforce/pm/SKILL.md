# Product Management Skills for PetForce

This skill provides Peter, the Product Manager agent, with templates, processes, and best practices for managing PetForce product requirements.

## Product Philosophy

**Core Principle**: "Pets are part of the family, so let's take care of them as simply as we can."

Every feature decision must pass these tests:
1. **Does this make pet care simpler?** Prioritize features that reduce complexity
2. **Would I trust this for my own family member?** Quality and reliability are non-negotiable
3. **Can every pet family use this?** Accessibility and affordability matter
4. **Does this prevent problems before they happen?** Proactive over reactive

When prioritizing features:
- **Pet Safety** is always P0 - no exceptions
- **Simplicity** beats feature richness - one reliable feature is better than ten complex ones
- **Family-First Design** - honor the bond between pets and their families
- **Prevention** over reaction - anticipate needs before they become emergencies

## PRD Template

Use this template when creating Product Requirements Documents:

```markdown
# Product Requirements Document: {{FEATURE_NAME}}

## Document Info

| Field | Value |
|-------|-------|
| **Document ID** | PRD-{{ID}} |
| **Author** | Peter (Product Manager) |
| **Status** | Draft / In Review / Approved |
| **Created** | {{DATE}} |
| **Target Release** | {{VERSION_OR_QUARTER}} |

## 1. Executive Summary

### 1.1 One-Liner
{{One sentence description of what we're building and why}}

### 1.2 Background
{{Brief context on why this is being considered now}}

## 2. Problem Statement

### 2.1 The Problem
{{Clear description of the problem we're solving}}

### 2.2 Who Has This Problem
| Segment | Description | Size |
|---------|-------------|------|
| {{User Segment}} | {{Description}} | {{Number}} |

### 2.3 Evidence

#### Quantitative Data
- {{Data point with source}}

#### Qualitative Data
> "{{Customer quote}}"
> — {{Customer Name}}, {{Company}}

### 2.4 Impact of Not Solving
{{What happens if we don't address this problem?}}

## 3. Goals & Success Metrics

### 3.1 Goals
| Priority | Goal | Rationale |
|----------|------|-----------|
| P0 | {{Primary goal}} | {{Why this matters}} |

### 3.2 Non-Goals (Explicitly Out of Scope)
| Non-Goal | Rationale |
|----------|-----------|
| {{What we're NOT doing}} | {{Why not}} |

### 3.3 Success Metrics

| Metric | Current | Target | Timeline | How Measured |
|--------|---------|--------|----------|--------------|
| {{Metric 1}} | {{Value}} | {{Value}} | {{When}} | {{Method}} |

## 4. User Stories

### 4.1 Primary User Story

AS A {{user type}}
I WANT TO {{action/capability}}
SO THAT {{benefit/value}}

#### Acceptance Criteria
- [ ] **Given** {{precondition}}, **When** {{action}}, **Then** {{result}}

#### Edge Cases
| Scenario | Expected Behavior |
|----------|-------------------|
| {{Edge case}} | {{Behavior}} |

## 5. Detailed Requirements

### 5.1 Functional Requirements

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-1 | {{Requirement}} | Must Have | {{Notes}} |

### 5.2 Non-Functional Requirements

| ID | Category | Requirement | Target |
|----|----------|-------------|--------|
| NFR-1 | Performance | {{Requirement}} | {{Target}} |

## 6. Technical Considerations

### 6.1 Architecture Impact
{{Describe any architectural changes needed}}

### 6.2 Security Considerations
- [ ] {{Security consideration}}

## 7. Launch Plan

### 7.1 Rollout Strategy
| Phase | Audience | Criteria | Duration |
|-------|----------|----------|----------|
| Phase 1: Internal | Internal team | {{Criteria}} | 1 week |

### 7.2 Documentation Needs
- [ ] User documentation (Owner: Thomas)
- [ ] API documentation (Owner: Thomas)
- [ ] Release notes (Owner: Thomas)

## 8. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation | Owner |
|------|------------|--------|------------|-------|
| {{Risk 1}} | High/Med/Low | High/Med/Low | {{Mitigation}} | {{Owner}} |

## 9. Open Questions

| Question | Owner | Due Date | Status |
|----------|-------|----------|--------|
| {{Question 1}} | @name | {{Date}} | Open |
```

## User Story Template

Use this template for individual user stories:

```markdown
# User Story: {{TITLE}}

## Story Info

| Field | Value |
|-------|-------|
| **Story ID** | US-{{ID}} |
| **Epic** | [EPIC-{{ID}}](link) |
| **Status** | Draft / Ready / In Progress / Done |
| **Priority** | P0 / P1 / P2 / P3 |
| **Points** | {{Estimate}} |

## User Story

AS A {{user type / persona}}
I WANT TO {{action / capability / goal}}
SO THAT {{benefit / value / outcome}}

## Acceptance Criteria

### Scenario 1: {{Happy Path Name}}
GIVEN {{precondition / initial state}}
  AND {{additional precondition}}
WHEN {{action taken by user}}
THEN {{expected outcome}}
  AND {{additional expected outcome}}

### Scenario 2: {{Error Path Name}}
GIVEN {{precondition}}
WHEN {{action that should fail}}
THEN {{error handling behavior}}
  AND {{user feedback}}

## Edge Cases

| # | Scenario | Input/Condition | Expected Behavior |
|---|----------|-----------------|-------------------|
| 1 | Empty input | User submits without data | Show validation error |
| 2 | Maximum values | {{Max condition}} | {{Behavior}} |

## Out of Scope

- ❌ {{Excluded item 1}} — Will be addressed in {{US-XXX}}

## Definition of Done

- [ ] Code complete and reviewed
- [ ] Unit tests written and passing
- [ ] Acceptance criteria verified by QA
- [ ] Documentation updated
- [ ] Ready for release
```

## Feature Request Intake Template

Use this for logging incoming feature requests:

```markdown
# Feature Request Intake Form

## Request Information

| Field | Value |
|-------|-------|
| **Request ID** | FR-{{ID}} |
| **Date Received** | {{DATE}} |
| **Source** | Sales / Customer / Support / Developer / CS / Internal |
| **Status** | New / Under Review / Prioritized / Declined / Shipped |

## Source Details

### If from Sales
| Field | Value |
|-------|-------|
| Deal Name | {{Deal}} |
| Deal Value | ${{Amount}} |
| Customer | {{Company Name}} |
| Requested Timeline | {{Date/Urgency}} |

### If from Customer
| Field | Value |
|-------|-------|
| Customer ID | {{ID}} |
| Company | {{Company Name}} |
| ARR | ${{Amount}} |

## Request Details

### Summary
{{One sentence summary of the request}}

### Problem Being Solved
{{What problem does this solve? Why does the requester need this?}}

### Impact if Not Addressed
{{What happens if we don't build this?}}

## Prioritization Inputs

### RICE Score Inputs

| Factor | Value | Notes |
|--------|-------|-------|
| **Reach** | {{Users/quarter}} | {{How calculated}} |
| **Impact** | {{0.25-3}} | {{Rationale}} |
| **Confidence** | {{50-100%}} | {{Data quality}} |
| **Effort** | {{Person-months}} | {{Rough estimate}} |
| **RICE Score** | {{Calculated}} | |

## Decision

### Recommendation
{{Accept / Decline / Defer / Needs More Info}}

### Rationale
{{Why this decision was made}}
```

## Roadmap Item Template

Use this for roadmap planning:

```markdown
# Roadmap Item: {{TITLE}}

## Overview

| Field | Value |
|-------|-------|
| **Item ID** | RM-{{ID}} |
| **Status** | Exploring / Planned / Committed / In Progress / Shipped |
| **Target Quarter** | Q{{X}} {{YEAR}} |
| **Priority** | P0 / P1 / P2 / P3 |

## Summary

### One-Liner
{{Single sentence describing this initiative}}

### Key Benefits
- 🎯 {{Benefit 1}}
- 🎯 {{Benefit 2}}

## Business Case

### Problem Statement
{{What problem are we solving?}}

### Impact Hypothesis
> If we build {{feature}}, then {{audience}} will {{behavior change}}, resulting in {{business outcome}}.

### Success Metrics
| Metric | Baseline | Target | Timeline |
|--------|----------|--------|----------|
| {{Metric}} | {{Value}} | {{Value}} | {{When}} |

## Key Milestones

| Milestone | Target Date | Status |
|-----------|-------------|--------|
| Discovery Complete | {{Date}} | ⏳ |
| PRD Approved | {{Date}} | ⏳ |
| Design Complete | {{Date}} | ⏳ |
| GA Launch | {{Date}} | ⏳ |
```

## Requirements Quality Checklist

Use this checklist to validate requirements quality:

```markdown
# Requirements Quality Checklist

**Feature**: [Feature Name]
**Date**: [YYYY-MM-DD]
**Reviewer**: Peter

## Problem Definition
- [ ] Problem is clearly defined with supporting evidence
- [ ] User pain points are documented with examples
- [ ] Impact of not solving is quantified

## Success Criteria
- [ ] Success metrics are identified and measurable
- [ ] Target values for metrics are defined
- [ ] Measurement method is documented

## User Stories
- [ ] User stories written in "As a... I want... So that..." format
- [ ] Acceptance criteria defined for each story
- [ ] Edge cases and error scenarios identified

## Prioritization
- [ ] RICE score calculated (Reach, Impact, Confidence, Effort)
- [ ] Priority justified relative to other backlog items

## Dependencies & Risks
- [ ] Technical dependencies identified
- [ ] Key risks assessed with mitigation strategies

## Stakeholder Alignment
- [ ] Relevant stakeholders consulted
- [ ] Design/technical feasibility validated
- [ ] Go/no-go decision documented

## Status
**Status**: [ ] ✅ APPROVED / [ ] ⚠️ APPROVED WITH NOTES / [ ] ❌ REJECTED
```

## RICE Scoring Framework

RICE helps prioritize features objectively:

```
RICE Score = (Reach × Impact × Confidence) / Effort

REACH (# of users/customers affected per quarter)
  • All users = Total user count
  • Segment = Users in that segment

IMPACT (effect on each user reached)
  • 3 = Massive (game-changer)
  • 2 = High (significant improvement)
  • 1 = Medium (noticeable improvement)
  • 0.5 = Low (minor improvement)
  • 0.25 = Minimal (barely noticeable)

CONFIDENCE (how sure are we?)
  • 100% = High confidence (data-backed)
  • 80% = Medium confidence (some data)
  • 50% = Low confidence (gut feel)

EFFORT (person-months to complete)
  • Engineering time + Design time + QA time
  • Include all phases: spec, build, test, release

Interpretation:
• Score > 500: High priority candidate
• Score 200-500: Medium priority
• Score < 200: Lower priority
```

## Priority Factors

When evaluating requests, consider:

| Factor | Weight | Description |
|--------|--------|-------------|
| Strategic Alignment | 25% | Fits company direction |
| Customer Impact | 25% | Solves real problems |
| Revenue Impact | 20% | Drives growth/retention |
| Effort Required | 15% | Time and resources |
| Risk | 10% | Technical/market risk |
| Dependencies | 5% | Blocking/blocked by |

## Communication Templates

### Acknowledging New Requests

```
📥 Request Received

I've logged your request for [brief description].

📋 Details Captured:
• Source: [Source]
• Request: [Summary]
• ID: [Request-ID]

📅 What's Next:
• Review: By [date]
• Decision: By [date]
• You'll hear from me: [date]
```

### Declining Requests

```
📋 Decision on Your Request: [Request]

After careful review, we've decided not to pursue this at this time.

🔍 Why:
[Clear, specific reason]

🔄 Alternatives:
[If applicable, suggest workarounds or existing features]

📅 Future Consideration:
[When/if this might be reconsidered]
```

### Feature Shipped Notification

```
🚀 Your Feature Request is Live!

Remember when you asked for [feature]? It's shipped!

✨ What's New:
• [Capability 1]
• [Capability 2]

📚 Get Started:
• Documentation: [Link]

🙏 Thank You:
Your feedback directly shaped this feature. Keep it coming!
```

## Writing Quality Guidelines

### Good User Stories
- Specific user type (not "user")
- Clear action (not vague)
- Measurable benefit
- Testable acceptance criteria
- Identified edge cases

### Good PRDs
- Problem clearly stated with evidence
- Success metrics defined upfront
- Scope explicitly bounded
- Technical considerations included
- Risks acknowledged with mitigations

### Good Communication
- Lead with the decision/news
- Provide clear rationale
- Include next steps
- Offer path for follow-up

## Integration with Other Agents

### Peter → Thomas (Documentation)
When Peter completes a PRD, Thomas creates feature documentation

### Peter → Tucker (QA)
When Peter finalizes requirements, Tucker creates test plans

### Peter → Chuck (CI/CD)
When feature is ready for release, Chuck handles deployment

## Input Sources

Peter synthesizes input from:
- **Sales**: Deal requirements, competitive gaps, revenue impact
- **Customers**: Feature requests, pain points, use cases
- **Support**: Recurring issues, user confusion patterns
- **Developers**: Technical debt, performance opportunities
- **Customer Success**: Adoption blockers, churn risks, expansion opportunities

## Feature Lifecycle

```
INTAKE → DISCOVERY → DEFINITION → PRIORITIZATION →
DESIGN → DEVELOPMENT → TESTING → DOCUMENTATION →
RELEASE → FOLLOW-UP
```

Each stage has clear owners and acceptance criteria documented in the agent's PETER.md file.
