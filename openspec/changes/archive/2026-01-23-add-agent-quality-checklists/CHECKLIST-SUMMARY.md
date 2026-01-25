# Agent Quality Checklists Summary

This document provides a quick reference of all agent quality checklists created for the PetForce feature development process.

## Checklist Overview

| Agent | Checklist Items | Blocking | Key Focus Areas |
|-------|----------------|----------|-----------------|
| Product Management (Paula) | 12 | ✅ Yes | Requirements clarity, user value, simplicity alignment |
| Security (Sam) | 17 | ✅ Yes | Authentication, encryption, vulnerability prevention |
| QA Testing (Quinn) | 15 | ✅ Yes | Test coverage, E2E tests, accessibility |
| Software Engineering (Sierra) | 14 | ⚠️ N/A | Code quality, architecture, error handling |
| CI/CD (Devon) | 14 | ✅ Yes | Build success, deployment readiness, rollback plans |
| UX Design (Dexter) | 14 | ❌ No | Accessibility, responsive design, usability |
| Documentation (Thomas) | 12 | ❌ No | User docs, API docs, troubleshooting guides |
| Infrastructure (Isabel) | 12 | ⚠️ N/A | Scalability, disaster recovery, cost optimization |
| API Design (Alex) | 13 | ⚠️ N/A | RESTful principles, versioning, backwards compatibility |
| Logging & Observability (Luna) | 12 | ❌ No | Structured logging, alerting, dashboards |
| Analytics (Carlos) | 13 | ❌ No | Event tracking, conversion funnels, privacy compliance |
| Data Engineering (Dante) | 14 | ⚠️ N/A | Data schema, ETL pipelines, data quality |
| Mobile Development (Morgan) | 14 | ⚠️ N/A | Platform coverage, offline support, performance |
| Customer Success (Casey) | 13 | ❌ No | Documentation, training, customer communication |
| Feature Dev Process (Felix) | 14 | ✅ Yes | Cross-functional coordination, stage gates, sign-offs |

**Legend**:
- ✅ Yes = Blocking (must approve before release)
- ❌ No = Non-blocking (may ship with documented gaps/debt)
- ⚠️ N/A = Conditional (blocking if applicable to feature)

## Blocking Agents (Must Approve)

These 5 agents provide blocking checklists that MUST be approved before a feature can proceed to production:

1. **Product Management** - Ensures requirements are clear and aligned with user value
2. **Security** - Prevents security vulnerabilities from reaching production
3. **QA Testing** - Ensures adequate test coverage and quality standards
4. **CI/CD** - Verifies deployment readiness and operational safety
5. **Feature Development Process** - Coordinates all stage gates and cross-functional sign-offs

## Non-Blocking Agents (May Ship with Debt)

These 6 agents provide non-blocking checklists that allow shipping with documented gaps:

1. **UX Design** - Documents UX concerns, improvements recommended
2. **Documentation** - Tracks documentation debt for post-launch completion
3. **Logging & Observability** - Tracks monitoring gaps, improved post-launch
4. **Analytics** - Documents tracking gaps, analytics improved iteratively
5. **Customer Success** - Allows shipping with support readiness gaps documented

## Conditional Agents (Context-Dependent)

These 4 agents apply only when the feature touches their domain:

1. **Software Engineering** - Applies to all code changes
2. **Infrastructure** - Applies when infrastructure changes required
3. **API Design** - Applies when API changes introduced
4. **Data Engineering** - Applies when data pipelines or storage affected
5. **Mobile Development** - Applies when mobile app changes made

## Checklist Format

All checklists follow the same format:

```
### Requirement: [Agent] SHALL provide [type] quality checklist

#### Scenario: Complete [Agent] quality checklist
- **GIVEN** a feature ready for review
- **WHEN** [Agent] evaluates the feature
- **THEN** all checklist items SHALL be evaluated as Yes, No, or N/A
- **AND** "No" items SHALL be documented
- **AND** N/A items SHALL include justification
- **AND** checklist SHALL be signed, dated, and attached to release notes

**[Agent] Quality Checklist (v1.0)**:

1. [Checklist item 1]
2. [Checklist item 2]
...
[10+ total items]

**Approval Options**:
- [ ] Approved
- [ ] Approved with Notes/Debt
- [ ] Blocked/Concerns Raised

**Notes**: _____________________

**Reviewer**: [Agent Name]
**Date**: _________________
**Checklist Version**: 1.0
**Signature**: _________________
```

## Usage Instructions

### When to Use Checklists

Checklists should be completed at the appropriate stage gate:

- **Discovery (Stage Gate 1)**: Product Management
- **Design (Stage Gate 2)**: UX Design, API Design, Mobile Development (if applicable)
- **Development (Stage Gate 3)**: Software Engineering, Data Engineering (if applicable)
- **Testing (Stage Gate 4)**: QA Testing, Security, Infrastructure, Logging & Observability, Analytics
- **Deployment (Stage Gate 5)**: CI/CD, Documentation, Customer Success
- **Final Review**: Feature Development Process (coordinates all checklists)

### How to Complete a Checklist

1. **Evaluate each item**: Mark as Yes, No, or N/A
2. **Document "No" items**:
   - Blocking checklists: Create remediation plan
   - Non-blocking checklists: Create tracking issue, document as debt
3. **Justify N/A items**: Explain why item doesn't apply (e.g., "No API changes in this feature")
4. **Sign and date**: Add reviewer name, date, and signature
5. **Attach to release notes**: Include completed checklist with release documentation

### Approval Options Explained

- **Approved**: All items Yes or justified N/A, no concerns
- **Approved with Notes/Debt**: Some "No" items documented, acceptable for non-blocking checklists
- **Blocked/Concerns Raised**: Critical issues prevent approval (blocking checklists only)

## Versioning

All checklists are currently at **version 1.0**. When checklist items are added, removed, or modified, increment the version number and document changes.

## Example: Completed Checklist

```markdown
### Requirement: Security SHALL provide security review checklist

**Security Quality Checklist (v1.0)**:

1. **Authentication Required**: ✅ Yes - All endpoints require JWT auth
2. **Authorization Checks**: ✅ Yes - Row-level security enforced
3. **Input Validation**: ✅ Yes - Zod schemas validate all inputs
4. **SQL Injection Prevention**: ✅ Yes - Parameterized queries used
5. **XSS Prevention**: ✅ Yes - Output sanitized, CSP configured
6. **CSRF Protection**: ✅ Yes - CSRF tokens on state-changing operations
7. **Secrets Management**: ✅ Yes - All secrets in environment variables
8. **HTTPS Only**: ✅ Yes - HSTS headers configured
9. **Data Encryption**: ✅ Yes - PII encrypted at rest (AES-256)
10. **Rate Limiting**: ✅ Yes - Rate limiting on authentication endpoints
11. **Security Headers**: ✅ Yes - All OWASP recommended headers set
12. **Dependency Scanning**: ✅ Yes - No high/critical vulnerabilities
13. **Secrets in Logs**: ✅ Yes - Secrets scrubbed from logs
14. **File Upload Security**: N/A - No file uploads in this feature
15. **API Keys Rotation**: N/A - No new API keys introduced
16. **Penetration Testing**: ❌ No - Scheduled for post-launch (Issue #234)
17. **Security Audit Log**: ✅ Yes - All sensitive operations logged

**Approval Options**:
- [x] Approved with Notes

**Notes**: Penetration testing will be conducted within 2 weeks post-launch. All critical security controls in place.

**Reviewer**: Sam (Security)
**Date**: 2026-01-22
**Checklist Version**: 1.0
**Signature**: Sam Rodriguez
```

## Continuous Improvement

These checklists are living documents. After each feature launch:

1. **Retrospective review**: Did checklists catch important issues?
2. **Gap analysis**: Were there production issues not covered by checklists?
3. **Propose updates**: Submit changes to improve checklist effectiveness
4. **Version increment**: Update checklist version when items change

## Related Documentation

- `/openspec/changes/add-agent-quality-checklists/proposal.md` - Full proposal
- `/openspec/changes/add-agent-quality-checklists/design.md` - Design decisions
- `/openspec/changes/add-agent-quality-checklists/tasks.md` - Implementation tasks
- `/openspec/AGENTS.md` - Agent roles and responsibilities
- `/docs/FEATURE-DEVELOPMENT-PROCESS.md` - Stage gate process (if exists)
