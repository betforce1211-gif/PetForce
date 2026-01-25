# PetForce Documentation Skill

Expert knowledge and tools for creating, reviewing, and maintaining PetForce documentation.

## Documentation Templates

### Feature Documentation Template

Use this template for documenting new features:

```markdown
# {{FEATURE_NAME}}

> Brief one-sentence description of what this feature does and its key benefit.

**Last Updated**: {{DATE}}
**Version**: X.Y.Z+

---

## Overview

Describe what this feature is and the problem it solves. Focus on the value to the user.

- What does it do?
- Why would someone use it?
- What problem does it solve?

---

## Prerequisites

Before using this feature, ensure you have:

- [ ] **Requirement 1**: Description and how to verify
- [ ] **Requirement 2**: Description and how to verify
- [ ] **Required permission/role**: How to check or obtain

---

## How It Works

Provide a conceptual explanation of how the feature works.

---

## Getting Started

Follow these steps to start using {{FEATURE_NAME}}.

### Step 1: [First Action]

1. Navigate to **Location** > **Sub-location**
2. Click **Button Name**
3. Enter the required information

**Expected result**: What the user should see after completing this step.

---

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `option_name` | string | `"default"` | What this option controls |

---

## Examples

### Example 1: Basic Usage

**Scenario**: Describe the use case.

```javascript
// Code example with comments
const result = featureFunction({
  option: 'value'
});
```

---

## Best Practices

- **Do this**: Explanation of why
- **Avoid this**: Explanation of consequences

---

## Troubleshooting

### Issue: [Common Error or Problem]

**Symptoms**: What the user sees

**Cause**: Why this happens

**Solution**:
1. Step to fix
2. Step to verify

---

## Related Documentation

- [Related Feature](./related-feature.md)
- [API Reference](../reference/api/endpoint.md)

---

## FAQ

**Q: Frequently asked question?**

A: Clear, concise answer.
```

### PRD (Product Requirements Document) Template

```markdown
# PRD: {{FEATURE_NAME}}

| Field | Value |
|-------|-------|
| **Author** | [Your Name] |
| **Status** | 📝 Draft / 🔍 In Review / ✅ Approved |
| **Created** | {{DATE}} |
| **Target Release** | vX.Y.Z |
| **Priority** | P0-P3 |

---

## Executive Summary

2-3 sentences summarizing what we're building, for whom, and why it matters.

---

## Problem Statement

### Current State
Describe what exists today and its limitations.

### Pain Points
| Pain Point | Impact | Frequency | User Segment |
|------------|--------|-----------|--------------|
| [Problem] | High/Med/Low | Daily/Weekly | [Who] |

### Evidence
- **User Research**: Key findings
- **Support Tickets**: X tickets/month
- **Analytics**: Y% impact

---

## Goals & Success Metrics

### Objectives
| Objective | Key Result | Target |
|-----------|------------|--------|
| [Goal] | [Measurable outcome] | [Target] |

### Success Metrics
| Metric | Current | Target | How Measured |
|--------|---------|--------|--------------|
| Primary KPI | X | Y | [Method] |

---

## Proposed Solution

### User Stories
| ID | As a... | I want to... | So that... | Priority |
|----|---------|--------------|------------|----------|
| US-1 | [role] | [action] | [benefit] | Must Have |

### Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

### Out of Scope
| Item | Reason | Future Consideration |
|------|--------|---------------------|
| [Feature] | [Why not now] | v2.0 / TBD |

---

## Technical Considerations

### Dependencies
| Dependency | Type | Status | Owner |
|------------|------|--------|-------|
| [Service] | External | Available | [Team] |

### Security Considerations
| Consideration | Approach |
|---------------|----------|
| Authentication | [How] |
| Authorization | [How] |

---

## Timeline

| Milestone | Target Date | Status |
|-----------|-------------|--------|
| Design Complete | YYYY-MM-DD | ⏳ |
| Development Complete | YYYY-MM-DD | ⏳ |

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| [Risk] | High/Med/Low | High/Med/Low | [How to address] |
```

### ADR (Architecture Decision Record) Template

```markdown
# ADR-{{NUMBER}}: {{TITLE}}

| Field | Value |
|-------|-------|
| **Status** | 📝 Proposed / ✅ Accepted / 🚫 Rejected |
| **Date** | {{DATE}} |
| **Decision Makers** | [Names] |

---

## Summary

One paragraph summary of the decision and why it matters.

---

## Context

### Problem Statement
What specific problem does this decision address?

### Requirements
**Functional Requirements:**
- Must support [capability]

**Non-Functional Requirements:**
- Performance: [requirements]
- Security: [requirements]

---

## Options Considered

### Option 1: [Name] ⭐ (Recommended)

**Pros:**
- Pro 1
- Pro 2

**Cons:**
- Con 1

**Estimated effort**: [T-shirt size]

---

### Option 2: [Name]

**Pros:**
- Pro 1

**Cons:**
- Con 1
- Con 2

**Why not chosen**: [Explanation]

---

## Decision

**We will [choose Option 1].**

### Rationale
We chose this option because:
1. [Primary reason]
2. [Secondary reason]

### Trade-offs Accepted
- [Trade-off]: We accept [downside] because [justification]

---

## Consequences

### Positive Consequences
- [Positive outcome 1]

### Negative Consequences
- [Negative outcome 1] → Mitigation: [How we'll address]

---

## Success Metrics

| Metric | Current | Target | Measurement Method |
|--------|---------|--------|-------------------|
| [Metric] | X | Y | [How measured] |
```

### Release Notes Template

```markdown
# Release Notes: v[X.Y.Z]

**Release Date**: YYYY-MM-DD

## Highlights

Brief summary of the most important changes (2-3 sentences).

## New Features

### [Feature Name]

Brief description of the feature and its value.

**How to use it:**
1. Step one
2. Step two

[Learn more →](link)

## Improvements

- **[Area]**: Description of improvement

## Bug Fixes

- Fixed issue where [description] ([#123](link))

## Breaking Changes

### [Change Description]

**What changed**: Explanation
**Why**: Reason
**Migration steps**:
1. Step one
2. Step two

## Known Issues

- [Issue description] - Workaround: [steps]
```

## Documentation Style Guide

### Voice & Tone

PetForce documentation follows these principles aligned with our product philosophy: "Pets are part of the family, so let's take care of them as simply as we can."

- **Simple Language** - Every pet parent should understand without technical knowledge
- **Family-First Tone** - Use "pet parent" not "owner"; write with compassion and warmth
- **Clear Over Comprehensive** - Better to explain one thing perfectly than everything poorly
- **Proactive Guidance** - Document prevention and best practices, not just troubleshooting

### Writing Standards

| Guideline | Do | Don't |
|-----------|-----|-------|
| **Active voice** | "Click the button" | "The button should be clicked" |
| **Present tense** | "The system saves your data" | "The system will save" |
| **Second person** | "You can configure..." | "Users can configure..." |
| **Direct** | "Enter your API key" | "You should enter your API key" |

### Sentence Structure

- **One idea per sentence**
- **Maximum 25 words per sentence** (aim for 15-20)
- **Use short paragraphs** (3-4 sentences max)
- **Lead with the action** in procedural steps

### Forbidden Phrases

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| "Simply" | Implies ease, may frustrate | Just state the action |
| "Obviously" | Condescending | Remove entirely |
| "Just" | Minimizes complexity | State directly |
| "Easy" | Subjective | Remove or explain |
| "Please" | Unnecessary in instructions | Direct imperative |
| "In order to" | Verbose | "To" |
| "Utilize" | Pretentious | "Use" |
| "Leverage" | Jargon | "Use" |

### Approved Terminology

| Use | Not This | Notes |
|-----|----------|-------|
| sign in | log in, login | "login" only as noun/adjective |
| set up | setup | "setup" only as noun/adjective |
| email | e-mail | No hyphen |
| API key | api key, API Key | Capitalize API, lowercase key |
| click | click on | Just "click" |
| select | choose, pick | For UI elements |
| enter | type, input | For text fields |
| ID | id, Id | Always uppercase |
| OK | Ok, okay | All caps |
| URL | url, Url | Always uppercase |

### Code Examples

- **Test all code examples** - They must work
- **Use realistic examples** - Avoid `foo`, `bar`, `test`
- **Include necessary context** - Imports, setup
- **Comment complex parts** - But don't over-comment
- **Show expected output** when helpful

### Images & Screenshots

- **Crop to relevant area** - Don't show entire screen
- **Highlight important elements** - Use arrows or boxes
- **Keep images current** - Update when UI changes
- **Add alt text** - Describe what the image shows

## Documentation Quality Checklist

### Structure & Organization
- [ ] Template used for consistent structure
- [ ] Clear headings and sections for scannability
- [ ] Logical flow from overview to details
- [ ] Related documentation linked appropriately

### Completeness
- [ ] Prerequisites clearly stated upfront
- [ ] Step-by-step instructions provided
- [ ] Expected outcomes described
- [ ] Troubleshooting section included
- [ ] Examples provided (code, screenshots, etc.)

### Clarity & Accessibility
- [ ] Written for the reader (not the writer)
- [ ] Jargon explained or avoided
- [ ] Active voice used when clearer than passive
- [ ] No condescending language ("simply", "obviously", "just")
- [ ] Terminology used consistently

### Code Examples & Validation
- [ ] Code examples tested and verified working
- [ ] Syntax highlighting applied
- [ ] Copy-paste ready examples provided
- [ ] Error cases shown alongside success cases

### Links & References
- [ ] All links validated and working
- [ ] Internal links point to correct sections
- [ ] External references are stable URLs
- [ ] No broken links present

### Maintenance & Freshness
- [ ] Document date/version included
- [ ] Ownership/contact information provided
- [ ] Review schedule established
- [ ] "Why" explained (purpose and context)

## Documentation Review Process

### Review Checklist for Thomas

```markdown
## Documentation Review: [Doc Title]

**Reviewer**: Thomas
**Date**: YYYY-MM-DD

### Accuracy
- [ ] Information is technically correct
- [ ] Code examples work as written
- [ ] Steps produce expected results
- [ ] No outdated information

### Completeness
- [ ] All required sections present
- [ ] Prerequisites clearly stated
- [ ] Edge cases addressed
- [ ] Related docs linked

### Clarity
- [ ] Purpose is clear from the start
- [ ] No unexplained jargon
- [ ] Steps are unambiguous
- [ ] Examples illustrate concepts

### Style
- [ ] Follows style guide
- [ ] Consistent terminology
- [ ] Appropriate formatting
- [ ] Professional tone

### Verdict
- [ ] Approved
- [ ] Approved with minor changes
- [ ] Requires revision
```

## Response Templates

### On Creating Documentation

```
📝 Created: [path/to/document.md]

Template includes these sections to complete:
  □ Overview - What and why
  □ Prerequisites - What users need first
  □ Steps - How to do it
  □ Examples - Show it in action
  □ Troubleshooting - Common issues
  □ Related docs - Where to learn more

Tips for this document type:
  • [Specific tip 1]
  • [Specific tip 2]

Run 'thomas review [path]' when ready for feedback!
```

### On Review Complete - Passing

```
✅ Documentation Review Complete!

[Document Title] is ready for publication:
  • Structure: ✓ Clear and logical
  • Completeness: ✓ All sections filled
  • Code examples: ✓ Tested and working
  • Links: ✓ All valid
  • Style: ✓ Follows guidelines

Great documentation helps users succeed!
```

### On Review Complete - Needs Work

```
📝 Documentation Review: Improvements needed

Found [N] items to address:

1. **[Issue Type]** (Line [X])
   [Description of issue]
   Suggestion: [How to fix]

2. **[Issue Type]** (Line [Y])
   [Description of issue]
   Suggestion: [How to fix]

Priority fixes:
  🔴 [Critical issues]
  🟡 [Important issues]
  🟢 [Nice to have]

Run 'thomas review [path]' after updates.
Happy to help with any questions!
```

## Documentation Structure Standards

### Recommended Directory Structure

```
docs/
├── getting-started/
│   ├── introduction.md
│   ├── quick-start.md
│   └── installation.md
│
├── guides/
│   ├── features/
│   ├── integrations/
│   └── advanced/
│
├── reference/
│   ├── api/
│   ├── configuration.md
│   ├── cli.md
│   └── glossary.md
│
├── troubleshooting/
│   ├── common-issues.md
│   ├── error-messages.md
│   └── faq.md
│
├── releases/
│   ├── changelog.md
│   └── version-notes/
│
└── internal/
    ├── runbooks/
    ├── architecture/
    └── requirements/
```

## Best Practices

### When to Create Documentation

- **New features**: Create feature docs BEFORE launch
- **API changes**: Update API docs with the code change
- **Bug fixes**: Update troubleshooting guides if pattern emerges
- **Breaking changes**: Document migration steps clearly

### Documentation Maintenance

- **Review quarterly**: Check for outdated content
- **Update on release**: Keep version references current
- **Link validation**: Check monthly for broken links
- **User feedback**: Incorporate support questions into docs

### Writing for Pet Families

Remember PetForce serves pet parents who may not be technical:

- **Explain benefits in family terms**: "Track your dog's medications so you never miss a dose"
- **Use compassionate language**: Especially for health/end-of-life features
- **Prioritize safety**: Clear warnings for anything affecting pet health
- **Simplify complexity**: Complex features need extra-clear docs
