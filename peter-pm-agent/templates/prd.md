# Product Requirements Document: {{FEATURE_NAME}}

## Document Info

| Field | Value |
|-------|-------|
| **Document ID** | PRD-{{ID}} |
| **Author** | Peter (Product Manager) |
| **Status** | Draft / In Review / Approved |
| **Created** | {{DATE}} |
| **Last Updated** | {{DATE}} |
| **Target Release** | {{VERSION_OR_QUARTER}} |
| **Epic Link** | [EPIC-{{ID}}](link) |

## Reviewers & Approvers

| Role | Name | Status |
|------|------|--------|
| Engineering Lead | @name | ⏳ Pending |
| Design Lead | @name | ⏳ Pending |
| QA Lead | @name | ⏳ Pending |
| Stakeholder | @name | ⏳ Pending |

---

## 1. Executive Summary

### 1.1 One-Liner
{{One sentence description of what we're building and why}}

### 1.2 Background
{{Brief context on why this is being considered now}}

### 1.3 Recommendation
{{What you're recommending we do}}

---

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
- {{Data point with source}}

#### Qualitative Data
> "{{Customer quote}}"
> — {{Customer Name}}, {{Company}}

> "{{Customer quote}}"
> — {{Customer Name}}, {{Company}}

#### Support Ticket Analysis
- {{X}} tickets in last {{period}} mentioning {{issue}}
- Average resolution time: {{time}}
- Customer effort score: {{score}}

### 2.4 Impact of Not Solving
{{What happens if we don't address this problem?}}

---

## 3. Goals & Success Metrics

### 3.1 Goals
| Priority | Goal | Rationale |
|----------|------|-----------|
| P0 | {{Primary goal}} | {{Why this matters}} |
| P1 | {{Secondary goal}} | {{Why this matters}} |
| P1 | {{Secondary goal}} | {{Why this matters}} |

### 3.2 Non-Goals (Explicitly Out of Scope)
| Non-Goal | Rationale |
|----------|-----------|
| {{What we're NOT doing}} | {{Why not}} |
| {{What we're NOT doing}} | {{Why not}} |

### 3.3 Success Metrics

| Metric | Current | Target | Timeline | How Measured |
|--------|---------|--------|----------|--------------|
| {{Metric 1}} | {{Value}} | {{Value}} | {{When}} | {{Method}} |
| {{Metric 2}} | {{Value}} | {{Value}} | {{When}} | {{Method}} |
| {{Metric 3}} | {{Value}} | {{Value}} | {{When}} | {{Method}} |

### 3.4 Leading Indicators
{{What early signals will tell us if we're on track?}}

- {{Indicator 1}}
- {{Indicator 2}}

---

## 4. User Stories

### 4.1 Primary User Story

```
AS A {{user type}}
I WANT TO {{action/capability}}
SO THAT {{benefit/value}}
```

#### Acceptance Criteria
- [ ] **Given** {{precondition}}, **When** {{action}}, **Then** {{result}}
- [ ] **Given** {{precondition}}, **When** {{action}}, **Then** {{result}}
- [ ] **Given** {{precondition}}, **When** {{action}}, **Then** {{result}}

#### Edge Cases
| Scenario | Expected Behavior |
|----------|-------------------|
| {{Edge case}} | {{Behavior}} |
| {{Edge case}} | {{Behavior}} |

### 4.2 Secondary User Stories

<details>
<summary>Story 2: {{Title}}</summary>

```
AS A {{user type}}
I WANT TO {{action}}
SO THAT {{benefit}}
```

**Acceptance Criteria:**
- [ ] {{Criterion}}
- [ ] {{Criterion}}

</details>

<details>
<summary>Story 3: {{Title}}</summary>

```
AS A {{user type}}
I WANT TO {{action}}
SO THAT {{benefit}}
```

**Acceptance Criteria:**
- [ ] {{Criterion}}
- [ ] {{Criterion}}

</details>

### 4.3 Admin/Internal Stories

<details>
<summary>Admin Story: {{Title}}</summary>

```
AS AN {{admin/internal user}}
I WANT TO {{action}}
SO THAT {{benefit}}
```

**Acceptance Criteria:**
- [ ] {{Criterion}}

</details>

---

## 5. Detailed Requirements

### 5.1 Functional Requirements

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-1 | {{Requirement}} | Must Have | {{Notes}} |
| FR-2 | {{Requirement}} | Must Have | {{Notes}} |
| FR-3 | {{Requirement}} | Should Have | {{Notes}} |
| FR-4 | {{Requirement}} | Could Have | {{Notes}} |

### 5.2 Non-Functional Requirements

| ID | Category | Requirement | Target |
|----|----------|-------------|--------|
| NFR-1 | Performance | {{Requirement}} | {{Target}} |
| NFR-2 | Scalability | {{Requirement}} | {{Target}} |
| NFR-3 | Security | {{Requirement}} | {{Target}} |
| NFR-4 | Accessibility | {{Requirement}} | {{Target}} |
| NFR-5 | Reliability | {{Requirement}} | {{Target}} |

### 5.3 Constraints
- {{Technical constraint}}
- {{Business constraint}}
- {{Timeline constraint}}

---

## 6. User Experience

### 6.1 User Flow

```
[Start] → [Step 1] → [Step 2] → [Decision Point]
                                      ↓
                          [Yes] → [Step 3] → [End]
                          [No]  → [Alt Path] → [End]
```

### 6.2 Key Screens/States

| Screen | Purpose | Link to Mockup |
|--------|---------|----------------|
| {{Screen 1}} | {{Purpose}} | [Figma](link) |
| {{Screen 2}} | {{Purpose}} | [Figma](link) |

### 6.3 UX Requirements
- {{UX requirement 1}}
- {{UX requirement 2}}
- {{UX requirement 3}}

### 6.4 Copy/Content Requirements
| Location | Copy | Notes |
|----------|------|-------|
| {{Location}} | "{{Copy}}" | {{Notes}} |

### 6.5 Empty States & Error States
| State | Design | Copy |
|-------|--------|------|
| Empty state | [Link] | "{{Copy}}" |
| Error state | [Link] | "{{Copy}}" |
| Loading state | [Link] | — |

---

## 7. Technical Considerations

### 7.1 Architecture Impact
{{Describe any architectural changes needed}}

### 7.2 API Requirements

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/{{resource}}` | GET | {{Purpose}} |
| `/api/v1/{{resource}}` | POST | {{Purpose}} |

### 7.3 Data Model Changes
```
{{Entity}}
├── {{field}}: {{type}}
├── {{field}}: {{type}}
└── {{field}}: {{type}}
```

### 7.4 Third-Party Dependencies
| Service | Purpose | Risk |
|---------|---------|------|
| {{Service}} | {{Purpose}} | {{Risk level}} |

### 7.5 Security Considerations
- [ ] {{Security consideration}}
- [ ] {{Security consideration}}

### 7.6 Performance Considerations
- Expected load: {{requests/second}}
- Response time target: {{ms}}
- Data volume: {{estimate}}

---

## 8. Launch Plan

### 8.1 Rollout Strategy

| Phase | Audience | Criteria | Duration |
|-------|----------|----------|----------|
| Phase 1: Internal | Internal team | {{Criteria}} | 1 week |
| Phase 2: Beta | {{X}}% of users | {{Criteria}} | 2 weeks |
| Phase 3: GA | All users | {{Criteria}} | — |

### 8.2 Feature Flags
| Flag | Purpose | Default |
|------|---------|---------|
| `{{flag_name}}` | {{Purpose}} | Off |

### 8.3 Rollback Plan
{{What's our plan if things go wrong?}}

### 8.4 Documentation Needs
- [ ] User documentation (Owner: Thomas)
- [ ] API documentation (Owner: Thomas)
- [ ] Internal runbook (Owner: Thomas)
- [ ] Release notes (Owner: Thomas)
- [ ] Help center article (Owner: Support)

### 8.5 Training Requirements
| Audience | Training Type | Owner |
|----------|---------------|-------|
| Support | {{Type}} | {{Owner}} |
| Sales | {{Type}} | {{Owner}} |
| CS | {{Type}} | {{Owner}} |

### 8.6 Success Monitoring
{{How will we monitor success post-launch?}}

---

## 9. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation | Owner |
|------|------------|--------|------------|-------|
| {{Risk 1}} | High/Med/Low | High/Med/Low | {{Mitigation}} | {{Owner}} |
| {{Risk 2}} | High/Med/Low | High/Med/Low | {{Mitigation}} | {{Owner}} |
| {{Risk 3}} | High/Med/Low | High/Med/Low | {{Mitigation}} | {{Owner}} |

---

## 10. Timeline & Milestones

| Milestone | Target Date | Status |
|-----------|-------------|--------|
| PRD Approved | {{Date}} | ⏳ |
| Design Complete | {{Date}} | ⏳ |
| Development Start | {{Date}} | ⏳ |
| Development Complete | {{Date}} | ⏳ |
| QA Complete | {{Date}} | ⏳ |
| Beta Launch | {{Date}} | ⏳ |
| GA Launch | {{Date}} | ⏳ |

---

## 11. Open Questions

| Question | Owner | Due Date | Status |
|----------|-------|----------|--------|
| {{Question 1}} | @name | {{Date}} | Open |
| {{Question 2}} | @name | {{Date}} | Open |

---

## 12. Appendix

### A. Customer Research Summary
{{Link to research document or summary}}

### B. Competitive Analysis
| Competitor | How They Handle This | Notes |
|------------|---------------------|-------|
| {{Competitor 1}} | {{Approach}} | {{Notes}} |
| {{Competitor 2}} | {{Approach}} | {{Notes}} |

### C. Related Documents
- [Epic Link](url)
- [Design File](url)
- [Technical Design](url)
- [Previous PRD](url)

### D. Change Log
| Date | Author | Change |
|------|--------|--------|
| {{Date}} | Peter | Initial draft |

---

*Generated by Peter - Product Manager Agent*
