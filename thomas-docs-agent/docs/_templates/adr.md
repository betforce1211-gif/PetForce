# ADR-{{NUMBER}}: {{TITLE}}

| Field | Value |
|-------|-------|
| **Status** | 📝 Proposed / 🔍 Under Review / ✅ Accepted / 🚫 Rejected / ⏸️ Deprecated / 🔄 Superseded |
| **Date** | {{DATE}} |
| **Decision Makers** | [Names] |
| **Consulted** | [Names/Teams] |
| **Informed** | [Names/Teams] |
| **Supersedes** | [ADR-XXX] (if applicable) |
| **Superseded By** | [ADR-XXX] (if applicable) |

---

## Summary

*One paragraph summary of the decision and why it matters.*

---

## Context

### Background

*What is the situation? What problem are we facing?*

Describe the current state and what led to this decision being needed. Include:
- Current architecture/approach
- Business or technical drivers
- Timeline pressures or constraints

### Problem Statement

*What specific problem does this decision address?*

We need to [accomplish something] because [reason]. Currently, [current state], which causes [problems/limitations].

### Requirements

*What must the solution achieve?*

**Functional Requirements:**
- Must support [capability]
- Must integrate with [system]
- Must handle [use case]

**Non-Functional Requirements:**
- Performance: [requirements]
- Scalability: [requirements]
- Security: [requirements]
- Maintainability: [requirements]

### Constraints

*What limitations must we work within?*

- Technical: [constraint]
- Business: [constraint]
- Time: [constraint]
- Budget: [constraint]
- Team: [constraint]

---

## Decision Drivers

*What factors are most important in making this decision?*

| Driver | Weight | Notes |
|--------|--------|-------|
| [Driver 1] | High | [Why this matters] |
| [Driver 2] | High | [Why this matters] |
| [Driver 3] | Medium | [Why this matters] |
| [Driver 4] | Low | [Nice to have] |

---

## Options Considered

### Option 1: [Name] ⭐ (Recommended)

**Description:**
Brief description of this option.

**How it works:**
```
┌─────────┐     ┌─────────┐     ┌─────────┐
│ Step 1  │ ──▶ │ Step 2  │ ──▶ │ Result  │
└─────────┘     └─────────┘     └─────────┘
```

**Pros:**
- Pro 1
- Pro 2
- Pro 3

**Cons:**
- Con 1
- Con 2

**Estimated effort:** [T-shirt size or time estimate]

**Risks:**
- Risk 1: [Description] → Mitigation: [How to address]

---

### Option 2: [Name]

**Description:**
Brief description of this option.

**Pros:**
- Pro 1
- Pro 2

**Cons:**
- Con 1
- Con 2
- Con 3

**Estimated effort:** [T-shirt size or time estimate]

**Why not chosen:**
[Clear explanation of why this option was rejected]

---

### Option 3: [Name]

**Description:**
Brief description of this option.

**Pros:**
- Pro 1

**Cons:**
- Con 1
- Con 2

**Estimated effort:** [T-shirt size or time estimate]

**Why not chosen:**
[Clear explanation of why this option was rejected]

---

## Options Comparison

| Criteria | Weight | Option 1 | Option 2 | Option 3 |
|----------|--------|----------|----------|----------|
| Performance | High | ✅ Good | ⚠️ Fair | ❌ Poor |
| Scalability | High | ✅ Good | ✅ Good | ⚠️ Fair |
| Complexity | Medium | ⚠️ Medium | ✅ Low | ❌ High |
| Cost | Medium | ⚠️ Medium | ✅ Low | ✅ Low |
| Team expertise | Low | ✅ High | ⚠️ Medium | ❌ Low |
| **Total Score** | | **Best** | Good | Poor |

---

## Decision

### The Decision

**We will [choose Option 1: Name].**

*One clear statement of what was decided.*

### Rationale

*Why was this option chosen?*

We chose this option because:
1. [Primary reason]
2. [Secondary reason]
3. [Tertiary reason]

This aligns with our goals of [goal 1] and [goal 2].

### Trade-offs Accepted

We accept these trade-offs:
- [Trade-off 1]: We accept [downside] because [justification]
- [Trade-off 2]: We accept [downside] because [justification]

---

## Consequences

### Positive Consequences

- [Positive outcome 1]
- [Positive outcome 2]
- [Positive outcome 3]

### Negative Consequences

- [Negative outcome 1] → Mitigation: [How we'll address]
- [Negative outcome 2] → Mitigation: [How we'll address]

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| [Risk 1] | Medium | High | [Mitigation plan] |
| [Risk 2] | Low | Medium | [Mitigation plan] |

---

## Implementation

### Action Items

| Task | Owner | Due Date | Status |
|------|-------|----------|--------|
| [Task 1] | [Name] | [Date] | ⏳ |
| [Task 2] | [Name] | [Date] | ⏳ |
| [Task 3] | [Name] | [Date] | ⏳ |

### Milestones

1. **Phase 1**: [Description] - [Date]
2. **Phase 2**: [Description] - [Date]
3. **Phase 3**: [Description] - [Date]

### Rollback Plan

If this decision proves problematic, we can:
1. [Rollback step 1]
2. [Rollback step 2]

Estimated rollback effort: [estimate]

---

## Validation

### Success Metrics

We will know this decision was successful when:

| Metric | Current | Target | Measurement Method |
|--------|---------|--------|-------------------|
| [Metric 1] | [X] | [Y] | [How measured] |
| [Metric 2] | [X] | [Y] | [How measured] |

### Review Points

- [ ] **30 days**: Initial review after implementation
- [ ] **90 days**: Effectiveness review
- [ ] **180 days**: Consider for deprecation/revision if needed

---

## Related Documents

- [PRD: Related Feature](link)
- [RFC: Technical Proposal](link)
- [ADR-XXX: Related Decision](link)
- [Ticket: Implementation](link)

---

## Notes & Discussion

*Space for additional context, discussion points, or meeting notes.*

### Meeting Notes - [Date]

**Attendees:** [Names]

**Key Points:**
- Point 1
- Point 2

**Decisions Made:**
- Decision 1
- Decision 2

---

## Changelog

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | YYYY-MM-DD | [Name] | Initial draft |
| 0.2 | YYYY-MM-DD | [Name] | Added Option 3 |
| 1.0 | YYYY-MM-DD | [Name] | Accepted |

---

*Template based on [MADR](https://adr.github.io/madr/) and [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions).*
