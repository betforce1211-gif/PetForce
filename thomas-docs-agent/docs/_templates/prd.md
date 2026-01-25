# PRD: {{FEATURE_NAME}}

| Field | Value |
|-------|-------|
| **Author** | [Your Name] |
| **Status** | 📝 Draft / 🔍 In Review / ✅ Approved / 🚫 Rejected |
| **Created** | {{DATE}} |
| **Last Updated** | {{DATE}} |
| **Target Release** | vX.Y.Z |
| **Priority** | P0 (Critical) / P1 (High) / P2 (Medium) / P3 (Low) |
| **Epic/Initiative** | [Link to parent epic] |

---

## Executive Summary

*2-3 sentences summarizing what we're building, for whom, and why it matters.*

We are building [feature] to enable [target users] to [accomplish goal]. This addresses [problem/opportunity] and is expected to [impact/outcome].

---

## Problem Statement

### Current State

Describe what exists today and how users currently accomplish this task (or can't).

- Current workflow or process
- Existing tools or workarounds
- Technical limitations

### Pain Points

| Pain Point | Impact | Frequency | User Segment |
|------------|--------|-----------|--------------|
| [Specific problem] | High/Med/Low | Daily/Weekly/Monthly | [Who] |
| [Another problem] | High/Med/Low | Daily/Weekly/Monthly | [Who] |

### Evidence

*Data and research supporting this problem:*

- **User Research**: [Link to research] - Key finding
- **Support Tickets**: X tickets/month related to this
- **Analytics**: Y% of users abandon at this step
- **Customer Feedback**: Direct quotes or themes

### Impact of Not Solving

What happens if we don't build this?

- Business impact (revenue, churn, etc.)
- User impact
- Competitive risk

---

## Goals & Success Metrics

### Objectives

| Objective | Key Result | Target |
|-----------|------------|--------|
| [Objective 1] | [Measurable outcome] | [Specific target] |
| [Objective 2] | [Measurable outcome] | [Specific target] |

### Success Metrics

| Metric | Current | Target | How Measured |
|--------|---------|--------|--------------|
| Primary KPI | X | Y | [Method/tool] |
| Secondary KPI | X | Y | [Method/tool] |
| Leading indicator | X | Y | [Method/tool] |

### Non-Goals

Explicitly list what this project will NOT achieve:

- Will not solve [adjacent problem]
- Will not support [use case]
- Will not replace [existing solution]

---

## Proposed Solution

### Overview

High-level description of the solution. What are we building?

### User Stories

| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| US-1 | [role] | [action] | [benefit] | Must Have |
| US-2 | [role] | [action] | [benefit] | Must Have |
| US-3 | [role] | [action] | [benefit] | Should Have |
| US-4 | [role] | [action] | [benefit] | Could Have |
| US-5 | [role] | [action] | [benefit] | Won't Have (this release) |

### Acceptance Criteria

#### US-1: [Story Title]

```gherkin
Given [initial context]
When [action taken]
Then [expected outcome]
And [additional outcome]
```

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

#### US-2: [Story Title]

- [ ] Criterion 1
- [ ] Criterion 2

### Out of Scope

| Item | Reason | Future Consideration |
|------|--------|---------------------|
| [Feature/capability] | [Why not now] | vX.Y / Never / TBD |
| [Feature/capability] | [Why not now] | vX.Y / Never / TBD |

---

## User Experience

### User Flow

```
┌─────────────────┐
│   Entry Point   │
│  [How user gets │
│     here]       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Step 1       │
│  [User action]  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Step 2       │
│  [User action]  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Success      │
│   [Outcome]     │
└─────────────────┘
```

### Wireframes/Mockups

*Link to design files or embed images*

| Screen | Description | Link |
|--------|-------------|------|
| Main view | [Description] | [Figma/Link] |
| Detail view | [Description] | [Figma/Link] |
| Error state | [Description] | [Figma/Link] |

### Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| User has no data | Show empty state with CTA |
| User loses connection | Show offline message, queue action |
| User enters invalid input | Show inline validation error |
| Concurrent edits | Show conflict resolution UI |

---

## Technical Considerations

### Architecture Overview

*High-level technical approach*

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│ Client  │────▶│   API   │────▶│   DB    │
└─────────┘     └─────────┘     └─────────┘
```

### Dependencies

| Dependency | Type | Status | Owner |
|------------|------|--------|-------|
| [Service/API] | External | Available / In Progress | [Team] |
| [Library] | Internal | Available / Needs work | [Team] |
| [Feature X] | Internal | Must ship first | [Team] |

### Technical Constraints

- Must work with existing [system/architecture]
- Must support [scale/performance requirement]
- Must maintain backward compatibility with [API version]

### Security Considerations

| Consideration | Approach |
|---------------|----------|
| Authentication | [How users are authenticated] |
| Authorization | [How permissions are checked] |
| Data handling | [PII, encryption, retention] |
| Compliance | [GDPR, SOC2, etc.] |

### Performance Requirements

| Metric | Requirement | Rationale |
|--------|-------------|-----------|
| Response time | < 200ms p95 | User experience |
| Throughput | 1000 req/sec | Expected load |
| Availability | 99.9% | SLA requirement |

---

## Launch Plan

### Rollout Strategy

- [ ] **Phase 1: Internal Testing** - [Date]
  - Team dogfooding
  - Bug fixes and polish

- [ ] **Phase 2: Beta** - [Date]
  - X% of users or selected customers
  - Gather feedback, iterate

- [ ] **Phase 3: General Availability** - [Date]
  - 100% rollout
  - Full documentation and support

### Feature Flags

| Flag | Purpose | Default |
|------|---------|---------|
| `feature_x_enabled` | Main feature toggle | false |
| `feature_x_new_ui` | New UI variant | false |

### Documentation Requirements

- [ ] User documentation
- [ ] API documentation
- [ ] Changelog entry
- [ ] Release notes
- [ ] Support team training

### Support Readiness

- [ ] Support team briefed
- [ ] FAQ prepared
- [ ] Known issues documented
- [ ] Escalation path defined

---

## Timeline

| Milestone | Target Date | Dependencies | Status |
|-----------|-------------|--------------|--------|
| PRD Approved | YYYY-MM-DD | Stakeholder review | 🔄 |
| Design Complete | YYYY-MM-DD | PRD approval | ⏳ |
| Development Start | YYYY-MM-DD | Design complete | ⏳ |
| Development Complete | YYYY-MM-DD | - | ⏳ |
| QA Complete | YYYY-MM-DD | Dev complete | ⏳ |
| Beta Launch | YYYY-MM-DD | QA complete | ⏳ |
| GA Launch | YYYY-MM-DD | Beta feedback | ⏳ |

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| [Risk description] | High/Med/Low | High/Med/Low | [How we'll address] |
| [Risk description] | High/Med/Low | High/Med/Low | [How we'll address] |

---

## Open Questions

| # | Question | Owner | Due Date | Answer |
|---|----------|-------|----------|--------|
| 1 | [Question] | [Name] | [Date] | [TBD/Answer] |
| 2 | [Question] | [Name] | [Date] | [TBD/Answer] |

---

## Stakeholders

| Role | Name | Responsibility |
|------|------|----------------|
| Product Owner | [Name] | Final decisions, prioritization |
| Engineering Lead | [Name] | Technical approach, estimation |
| Design Lead | [Name] | UX/UI design |
| QA Lead | [Name] | Test strategy |
| Customer Success | [Name] | User feedback, support readiness |

---

## Appendix

### Research & References

- [User Research Report](link)
- [Competitive Analysis](link)
- [Technical RFC](link)
- [Previous Discussions](link)

### Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | YYYY-MM-DD | [Name] | Initial draft |
| 0.2 | YYYY-MM-DD | [Name] | Added acceptance criteria |
| 1.0 | YYYY-MM-DD | [Name] | Approved version |

---

*Document Status: {{STATUS}}*
*Last Review: {{DATE}}*
