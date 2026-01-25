<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# PetForce Team Roster

The PetForce team consists of 14 specialized AI agents covering the full software development lifecycle.

## Product & Planning
- **Peter** - Product Management (`peter-pm-agent/`)
- **Dexter** - UX/UI Design (`dexter-design-agent/`)

## Engineering
- **Engrid** - Software Engineering (`engrid-engineer-agent/`)
- **Axel** - API Design (`axel-api-agent/`)
- **Maya** - Mobile Development (`maya-mobile-agent/`)

## Data & Analytics
- **Buck** - Data Engineering (`buck-data-engineering-agent/`)
- **Ana** - Analytics & Visualization (`ana-analytics-agent/`)

## Customer Success
- **Casey** - Customer Success (`casey-customer-success-agent/`) ⭐ NEW

## Infrastructure & Operations
- **Isabel** - Infrastructure & DevOps (`isabel-infrastructure-agent/`)
- **Chuck** - CI/CD Guardian (`chuck-cicd-agent/`)
- **Larry** - Logging & Observability (`larry-logging-agent/`)

## Quality & Security
- **Tucker** - QA & Testing (`tucker-qa-agent/`)
- **Samantha** - Security (`samantha-security-agent/`)
- **Thomas** - Documentation (`thomas-docs-agent/`)

## Key Integrations

### Casey's Integration Points
- **Primary**: Peter (weekly reports, churn alerts, feature requests)
- **Secondary**: Ana (customer health dashboards), Larry (usage telemetry)
- **Tertiary**: Thomas (doc gaps), Tucker (customer bugs)

### Core Workflows
```
Customer Feedback Loop:
  Casey → Peter → Engrid/Maya/Axel → Chuck → Larry → Casey (closes loop)

Product Development:
  Peter → Dexter → Engrid/Maya/Axel → Tucker → Chuck → Production

Data Pipeline:
  Buck → Ana → Casey (customer insights)
```