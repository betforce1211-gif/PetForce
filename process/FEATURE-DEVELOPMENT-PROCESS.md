# Feature Development Process (FDP)

**Version**: 1.0
**Last Updated**: 2026-01-21
**Owner**: Peter (Product Management)

## Overview

The Feature Development Process (FDP) defines how Pet Force's 14 specialized agents collaborate to build features with consistent quality. Every feature progresses through defined stages with quality checklists ensuring nothing is missed.

## Goals

- **Consistency**: Every feature gets comprehensive review
- **Accountability**: Clear ownership for each quality aspect
- **Transparency**: Checklist results documented in release notes
- **Improvement**: Process evolves based on learnings
- **Quality**: Catch issues earlier, reduce production incidents

## Feature Lifecycle Stages

All features progress through 6 stages:

```
Requirements → Design → Implementation → Review → Deployment → Monitoring
```

### Stage 1: Requirements
**Owner**: Peter (Product Management)
**Gate**: Requirements checklist approved

**Activities**:
- Define problem with evidence
- Write user stories with acceptance criteria
- Calculate RICE score
- Identify dependencies and risks

**Deliverables**:
- PRD (Product Requirements Document)
- User stories
- RICE score
- ✅ Completed Requirements Checklist

### Stage 2: Design
**Owners**: Dexter (UI), Axel (API), Buck (Data), Isabel (Infrastructure) - depending on feature type
**Gate**: Design checklists approved

**Activities**:
- Create wireframes/mockups (UI features)
- Design API contracts (API features)
- Design data models (Data features)
- Plan infrastructure (Infrastructure features)

**Deliverables**:
- Design specifications
- Design tokens/specs for engineering
- ✅ Completed Design Checklist(s)

### Stage 3: Implementation
**Owners**: Engrid, Maya (mobile), Buck (data) - depending on feature type
**Gate**: Implementation complete, checklist submitted

**Activities**:
- Build the feature
- Write unit tests
- Add logging/instrumentation
- Handle errors gracefully

**Deliverables**:
- Working code
- Unit tests
- ✅ Completed Implementation Checklist(s)

### Stage 4: Review
**Owners**: Tucker (Testing), Samantha (Security), Thomas (Documentation) + Domain Experts
**Gate**: All review checklists approved (blocking checklists must pass)

**Activities**:
- Run comprehensive tests
- Security review
- Documentation review
- Domain expert review (UI, API, Data, etc.)

**Deliverables**:
- Test results with coverage
- Security review report
- Documentation
- ✅ Completed Review Checklists (Tucker, Samantha, Thomas, + domain)

### Stage 5: Deployment
**Owner**: Chuck (CI/CD)
**Gate**: Deployment checklist approved

**Activities**:
- Validate all quality gates passed
- Run CI/CD pipeline
- Deploy to staging
- Deploy to production (with approval)

**Deliverables**:
- Deployment to production
- ✅ Completed Deployment Checklist

### Stage 6: Monitoring
**Owners**: Larry (Observability), Casey (Customer Success), Ana (Analytics)
**Gate**: Monitoring configured, tracking active

**Activities**:
- Monitor metrics and errors
- Track feature adoption
- Measure success metrics
- Identify issues early

**Deliverables**:
- Dashboards and alerts
- Adoption tracking
- ✅ Completed Monitoring Checklist(s)

## Agent Participation Matrix

Not all agents participate in every feature. Participation depends on **feature type**:

### Feature Type: User-Facing UI
**Stages & Agents**:
- Requirements: Peter
- Design: Dexter (UI Design)
- Implementation: Engrid
- Review: Tucker, Samantha, Thomas, Dexter (design review)
- Deployment: Chuck
- Monitoring: Larry, Casey

### Feature Type: API/Backend
**Stages & Agents**:
- Requirements: Peter
- Design: Axel (API Design)
- Implementation: Engrid
- Review: Tucker, Samantha, Thomas, Axel (API review)
- Deployment: Chuck
- Monitoring: Larry

### Feature Type: Data Pipeline/Analytics
**Stages & Agents**:
- Requirements: Peter
- Design: Buck (Data Model)
- Implementation: Buck
- Review: Tucker, Samantha, Thomas, Ana (validation)
- Deployment: Chuck
- Monitoring: Larry, Ana

### Feature Type: Infrastructure
**Stages & Agents**:
- Requirements: Peter
- Design: Isabel (Infrastructure Design)
- Implementation: Isabel
- Review: Tucker, Samantha, Thomas, Isabel (infrastructure review)
- Deployment: Chuck
- Monitoring: Larry, Isabel

### Feature Type: Mobile
**Stages & Agents**:
- Requirements: Peter
- Design: Dexter (UI Design)
- Implementation: Maya
- Review: Tucker, Samantha, Thomas, Dexter (design review), Maya (platform review)
- Deployment: Chuck
- Monitoring: Larry, Casey

## Quality Checklists

Each agent has a checklist template stored in their directory:
```
[agent]-agent/checklists/[checklist-name].md
```

### Checklist Format

All checklists follow this structure:
- **Header**: Version, Feature name, Date, Reviewer
- **Checklist Items**: 5-10 items with [ ] checkboxes
- **Summary**: Status (APPROVED/APPROVED WITH NOTES/REJECTED), Notes, Signature

### Completing Checklists

1. Open appropriate checklist template for your domain
2. Fill in feature name, date, and your name
3. Review each item, marking:
   - `[x]` for Yes (requirement met)
   - `[ ]` for No (requirement not met - add note explaining remediation)
   - `[N/A]` for Not Applicable (add reason)
4. Write summary notes with any concerns
5. Select status: ✅ APPROVED, ⚠️ APPROVED WITH NOTES, or ❌ REJECTED
6. Sign and date
7. Save completed checklist to release directory (see Release Documentation)

## Stage Gates

### Blocking Checklists (Must Pass)

These checklists MUST be approved before proceeding:
- **Peter** (Requirements) - Blocks progression to Design
- **Tucker** (Testing) - Blocks progression to Deployment
- **Samantha** (Security) - Blocks progression to Deployment
- **Chuck** (Deployment) - Blocks deployment to production

Features SHALL NOT proceed if blocking checklists are rejected.

### Non-Blocking Checklists (Can Proceed with Notes)

These can proceed with "APPROVED WITH NOTES" if justified:
- **Thomas** (Documentation) - Can ship with doc debt if urgent
- **Larry** (Monitoring) - Can add alerts post-launch if needed
- **Casey** (Customer Success tracking) - Can be added after launch

Technical debt items SHALL be created for any deferred non-blocking items.

## Process Exemptions

### When to Request Exemption

- **Urgent production fixes** (severity 1 incidents)
- **Security patches** (critical vulnerabilities)
- **Time-sensitive business requirements** (with executive approval)

### Exemption Process

1. **Request**: Submit exemption request to Peter with:
   - Reason for urgency
   - Risk assessment
   - Proposed reduced checklist

2. **Review**: Peter evaluates:
   - Urgency and business impact
   - Risk vs. benefit
   - Minimum required checklists

3. **Approval**: Peter approves or denies
   - Minimum: Security (Samantha) + Testing (Tucker) checklists always required
   - Exemption documented in release notes
   - Technical debt items created for skipped checklists

4. **Tracking**: Exemptions tracked monthly
   - Frequent exemptions trigger process review
   - Technical debt prioritized for resolution

## Continuous Improvement

### Monthly Retrospective

**When**: Last Friday of each month
**Owner**: Peter
**Participants**: All agents

**Agenda**:
1. Review features shipped last month
2. Identify quality issues that checklists missed
3. Discuss checklist gaps and improvements
4. Propose checklist updates
5. Identify checklist items to remove (no longer relevant)
6. Track action items

### Updating Checklists

**Process**:
1. Anyone proposes checklist update via pull request
2. PR includes:
   - Rationale for change
   - Examples of what it would have caught
   - Updated checklist with version increment
3. Reviewed by checklist owner agent + Peter
4. Approved updates effective for next feature

**Version Tracking**:
- Checklists have version numbers (e.g., v1.0, v1.1)
- Completed checklists document which version was used
- Release notes reference checklist versions

## Metrics

Track these metrics to measure FDP effectiveness:

**Adoption**:
- % of features with complete checklists
- Average time to complete all checklists

**Quality**:
- Bugs caught pre-release by checklists
- Production incidents (should decrease)
- Security vulnerabilities caught pre-release

**Efficiency**:
- Time from requirements to deployment
- Blockers identified early vs. late

**Improvement**:
- Checklist updates per month
- Retrospective action items completed

## Quick Reference

### Starting a New Feature
1. Peter creates PRD and completes Requirements Checklist
2. Peter classifies feature type and identifies required agents
3. Peter initiates FDP tracking and notifies agents

### Progressing Through Stages
1. Complete current stage work
2. Complete your checklist
3. Submit for stage gate review
4. Address any "No" items or rejections
5. Get approval to proceed to next stage

### Completing a Feature
1. All checklists approved (or exemptions granted)
2. Checklists stored in release directory
3. Release notes include checklist summary
4. Feature deployed
5. Monitoring active

## Support

Questions about FDP? Contact:
- **Process**: Peter (Product Management)
- **Checklists**: Individual agent owners
- **Technical Issues**: Chuck (CI/CD)
- **Documentation**: Thomas (Documentation)
