# Design: Capability Specs for All Agents

## Context

PetForce has 14 specialized AI agents, each with comprehensive CLAUDE.md configuration files that define their:
- Identity and personality
- Core directives (Always Do / Never Do)
- Response templates
- Integration points with other agents
- Boundaries (responsibilities and limitations)

Currently, only 3 agents have formal capability specs:
- `analytics` (Ana) - 3 requirements
- `customer-success` (Casey) - 8 requirements
- `product-management` (Peter) - 1 requirement

The remaining 11 agents have detailed CLAUDE.md files but no OpenSpec capability specifications. This creates a gap where agent behaviors are documented but not formally specified with requirements and scenarios.

## Goals

**Primary Goals:**
- Create formal capability specs for all 11 remaining agents
- Extract requirements and scenarios from existing CLAUDE.md files
- Establish consistent specification structure across all agents
- Define clear integration points and boundaries

**Non-Goals:**
- Modify existing agent CLAUDE.md files
- Implement actual code or systems
- Change agent behaviors or capabilities
- Create new agents or modify agent assignments
- Define implementation details (that's for actual code)

## Key Decisions

### Decision 1: Capability Naming Convention

**Choice**: Use domain-focused names, not agent names
- `ux-design` (not `dexter`)
- `api-design` (not `axel`)
- `software-engineering` (not `engrid`)

**Why**: Capability specs represent domains/functions, not individual agents. This allows multiple agents to contribute to a capability if needed in the future.

**Alternatives Considered:**
- Agent-named specs (`dexter`, `axel`) - Rejected: Couples spec to agent identity rather than domain
- Generic numbered specs - Rejected: Not descriptive, hard to navigate

### Decision 2: Requirement Granularity

**Choice**: 3-8 high-level requirements per agent covering core responsibilities

**Why**:
- Matches existing pattern (Ana: 3, Casey: 8, Peter: 1)
- High-level requirements with detailed scenarios provide flexibility
- Avoids over-specification while capturing essential behaviors

**Alternatives Considered:**
- Very detailed (20+ requirements per agent) - Rejected: Too prescriptive, hard to maintain
- Very broad (1-2 requirements per agent) - Rejected: Not enough detail for validation

### Decision 3: Source of Truth

**Choice**: Extract requirements from CLAUDE.md "Core Directives" and "Boundaries" sections

**Why**:
- CLAUDE.md already defines what agents do and don't do
- Core Directives section lists explicit responsibilities
- Boundaries section clarifies scope
- Maintains consistency between agent config and spec

**Alternatives Considered:**
- Create specs from scratch - Rejected: Duplicates existing documentation effort
- Analyze code implementations - Rejected: No implementations exist yet
- Interview stakeholders - Rejected: Documentation already comprehensive

### Decision 4: Scenario Structure

**Choice**: Given/When/Then format with focus on agent actions and outputs

**Why**:
- Consistent with existing specs (customer-success, analytics)
- Clear preconditions, actions, and expected results
- Testable and verifiable
- Industry-standard BDD format

**Example:**
```markdown
#### Scenario: Design wireframe for new feature
- **GIVEN** a product requirement document with user stories
- **WHEN** Dexter creates a wireframe
- **THEN** the wireframe SHALL include layout, navigation, key interactions, and responsive breakpoints
- **AND** the design SHALL follow accessibility guidelines
```

### Decision 5: Integration Points

**Choice**: Reference other capabilities by name, document data flows

**Why**:
- Makes dependencies explicit
- Helps identify workflow gaps
- Supports future automation and orchestration

**Example:**
```markdown
### Requirement: Collaborate with Product Management
Dexter SHALL work with product-management to translate requirements into designs.

#### Scenario: Receive requirements from Peter
- **GIVEN** Peter has created a PRD
- **WHEN** Dexter receives design request
- **THEN** Dexter SHALL review requirements and ask clarifying questions
```

## Specification Structure

Each agent spec will follow this structure:

```markdown
# Capability: [Domain Name]

## ADDED Requirements

### Requirement: [Core Responsibility 1]
The system SHALL [capability description]...

#### Scenario: [Happy path]
- **GIVEN** [precondition]
- **WHEN** [action]
- **THEN** [expected result]
- **AND** [additional criteria]

#### Scenario: [Edge case]
...

### Requirement: [Core Responsibility 2]
...
```

### Content Mapping

For each agent, extract:

1. **Core Responsibilities** → Requirements
   - From CLAUDE.md "Always Do" section
   - From CLAUDE.md description and commands

2. **Key Workflows** → Scenarios
   - From CLAUDE.md "Response Templates"
   - From CLAUDE.md "Commands Reference"

3. **Integration Points** → Integration Requirements
   - From CLAUDE.md "Integration Points" section

4. **Boundaries** → Explicit exclusions in requirements
   - From CLAUDE.md "Boundaries" section

## Agent-to-Capability Mapping

| Agent | Capability Name | Core Focus | Requirements Count |
|-------|----------------|------------|-------------------|
| Dexter | `ux-design` | UX/UI design, wireframes, prototypes | 4-6 |
| Engrid | `software-engineering` | Code implementation, architecture | 5-7 |
| Axel | `api-design` | API design, OpenAPI specs, integration | 5-7 |
| Maya | `mobile-development` | iOS/Android app development | 5-7 |
| Buck | `data-engineering` | Data pipelines, ETL, warehousing | 4-6 |
| Isabel | `infrastructure` | Cloud infrastructure, DevOps | 5-7 |
| Chuck | `ci-cd` | CI/CD pipelines, deployment automation | 4-6 |
| Larry | `logging-observability` | Logging, monitoring, alerting | 5-7 |
| Tucker | `qa-testing` | Test strategy, automation, quality gates | 5-7 |
| Samantha | `security` | Security review, threat modeling, compliance | 6-8 |
| Thomas | `documentation` | Docs, guides, API docs, knowledge base | 4-6 |

## Example: UX Design Capability

To illustrate the approach, here's an example requirement structure for Dexter:

```markdown
# Capability: UX Design

## ADDED Requirements

### Requirement: Create User Interface Designs
The system SHALL create wireframes, mockups, and prototypes for user-facing features.

#### Scenario: Design new feature interface
- **GIVEN** a product requirement with user stories
- **WHEN** creating a design for the feature
- **THEN** the design SHALL include wireframes for all user flows
- **AND** the design SHALL specify responsive breakpoints
- **AND** the design SHALL follow accessibility guidelines (WCAG 2.1 AA)

#### Scenario: Iterate on design based on feedback
- **GIVEN** an existing design and stakeholder feedback
- **WHEN** revising the design
- **THEN** the revision SHALL address all feedback points
- **AND** a changelog SHALL document what changed and why

### Requirement: Design System Maintenance
The system SHALL maintain consistent design patterns through a design system.

#### Scenario: Define new component
- **GIVEN** a UI pattern used in multiple places
- **WHEN** creating a design system component
- **THEN** the component SHALL include usage guidelines
- **AND** the component SHALL define variants and states
- **AND** the component SHALL specify spacing, colors, and typography

### Requirement: Accessibility Compliance
The system SHALL ensure all designs meet accessibility standards.

#### Scenario: Review design for accessibility
- **GIVEN** a completed design
- **WHEN** conducting accessibility review
- **THEN** the review SHALL verify WCAG 2.1 AA compliance
- **AND** the review SHALL check color contrast ratios
- **AND** the review SHALL validate keyboard navigation support

### Requirement: Collaboration with Engineering
The system SHALL collaborate with software-engineering to ensure design feasibility.

#### Scenario: Provide design specifications to engineers
- **GIVEN** an approved design
- **WHEN** handing off to engineering
- **THEN** specifications SHALL include all measurements, colors, fonts
- **AND** specifications SHALL include interaction details and animations
- **AND** specifications SHALL be provided in developer-friendly format
```

## Risks and Mitigations

### Risk: Specs Diverge from CLAUDE.md Files

**Mitigation**:
- Source all requirements directly from CLAUDE.md
- Add cross-reference comments in specs pointing to CLAUDE.md sections
- Establish review process to keep them synchronized

### Risk: Over-Specification Restricts Implementation

**Mitigation**:
- Focus on "what" not "how"
- Use high-level requirements with flexible scenarios
- Allow multiple valid implementation approaches

### Risk: Inconsistent Granularity Across Specs

**Mitigation**:
- Define requirement count ranges per agent (4-8)
- Use template structure for all specs
- Review all specs together for consistency

### Risk: Missing Integration Points

**Mitigation**:
- Extract integration points directly from CLAUDE.md files
- Cross-reference agent workflows in AGENTS.md
- Validate integration requirements reference actual capabilities

## Validation Criteria

Each spec must:
- [ ] Have 3-8 ADDED requirements
- [ ] Have at least 1 scenario per requirement
- [ ] Use proper scenario format (`#### Scenario:` headers)
- [ ] Reference integration points by capability name
- [ ] Pass `openspec validate --strict --no-interactive`
- [ ] Be sourced from corresponding CLAUDE.md file
- [ ] Define clear boundaries (what's excluded)

## Migration Plan

**Phase 1: Spec Creation** (This change)
- Create 11 new capability spec deltas
- Validate all specs
- Archive change to create specs in `openspec/specs/`

**Phase 2: Integration Validation** (Future work)
- Review integration requirements across all specs
- Identify workflow gaps or conflicts
- Create change proposals to address gaps

**Phase 3: Implementation Guidance** (Future work)
- Use specs to guide actual implementations
- Iterate specs based on implementation learnings
- Maintain living documentation

## Open Questions

None - all necessary information exists in CLAUDE.md files.
