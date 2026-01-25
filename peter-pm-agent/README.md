# 📋 Peter: The Product Manager

> *Every voice matters. Every requirement has context. Every feature serves a purpose.*

Peter is a comprehensive product management system powered by Claude Code. He transforms input from sales, customers, support, developers, and customer success into clear, prioritized, actionable requirements that drive product success.

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Multi-Source Intake** | Capture requests from sales, customers, support, devs, and CS |
| **RICE Prioritization** | Consistent, data-driven prioritization framework |
| **PRD Generation** | Comprehensive product requirements documents |
| **User Story Writing** | Clear stories with acceptance criteria and edge cases |
| **Roadmap Management** | Plan, track, and communicate product roadmap |
| **Stakeholder Communication** | Templates for every audience |
| **Request Tracking** | Never lose track of a request |

## 📁 Package Contents

```
peter-pm-agent/
├── PETER.md                     # Full Peter documentation
├── CLAUDE.md                    # Claude Code agent configuration
├── QUICKSTART.md                # 10-minute setup guide
├── .peter.yml                   # Peter configuration file
└── templates/
    ├── prd.md                   # Product Requirements Document
    ├── user-story.md            # User Story template
    ├── feature-request.md       # Feature request intake form
    └── roadmap-item.md          # Roadmap item template
```

## 🚀 Quick Start

### 1. Copy files to your repository

```bash
cp -r peter-pm-agent/templates your-repo/docs/product/
cp peter-pm-agent/.peter.yml your-repo/
cp peter-pm-agent/CLAUDE.md your-repo/
```

### 2. Configure for your project

```yaml
# .peter.yml
version: 1

inputs:
  sales:
    channel: '#sales-requests'
    sla_acknowledge: 24h

prioritization:
  framework: 'rice'
  thresholds:
    p1_high: 500
    p2_medium: 300
```

### 3. Start using Peter

```bash
peter intake sales "Acme Corp" "Need bulk export feature"
```

**[📖 Full Setup Guide →](./QUICKSTART.md)**

## 📥 Input Sources

Peter collects and processes requests from multiple sources:

| Source | What They Provide | SLA |
|--------|-------------------|-----|
| **Sales** | Deal requirements, competitive gaps | 24h ack |
| **Customers** | Feature requests, pain points | 48h ack |
| **Support** | Recurring issues, workaround requests | 7d review |
| **Developers** | Tech debt, performance, security | 72h ack |
| **Customer Success** | Churn risks, adoption blockers | 48h ack |

## 📊 Prioritization Framework

### RICE Scoring

```
RICE = (Reach × Impact × Confidence) / Effort
```

| Factor | Description | Scale |
|--------|-------------|-------|
| **Reach** | Users affected per quarter | Number |
| **Impact** | Effect on each user | 0.25 - 3 |
| **Confidence** | How sure are we | 50% - 100% |
| **Effort** | Person-months required | Number |

### Priority Thresholds

| Score | Priority | Action |
|-------|----------|--------|
| >800 | P0 | Drop everything |
| 500-800 | P1 | This quarter |
| 300-500 | P2 | Next quarter |
| 100-300 | P3 | Backlog |
| <100 | — | Decline with explanation |

## 📝 Documentation Templates

### PRD (Product Requirements Document)
- Problem statement with evidence
- Goals and success metrics
- User stories with acceptance criteria
- Technical considerations
- Launch plan and risks

### User Story
- Story in standard format
- Acceptance criteria (Given/When/Then)
- Edge cases
- Out of scope items
- Technical and design notes

### Feature Request
- Source details (sales deal, customer, ticket)
- Problem and use case
- RICE scoring inputs
- Decision and rationale
- Communication log

### Roadmap Item
- Strategic alignment
- Business case
- Scope (MVP and future phases)
- Milestones and resources
- Stakeholder communication plan

## 🤖 Using with Claude Code

Once configured, Claude Code becomes Peter:

```
You: We got a request from sales for bulk export for the Acme deal

Peter: 📥 Sales Request Logged

Deal: Acme Corp ($250K ARR)
Request: Bulk export functionality
Logged: Just now
ID: SR-147

📊 Initial Assessment:
• Similar requests: 12 in last 90 days
• Combined ARR impact: $1.2M
• Strategic alignment: High (enterprise feature)

📅 Next Steps:
• Technical feasibility review: This week
• Prioritization decision: Friday
• Response to sales: Within 48 hours

I'll keep the sales team updated on progress.
```

```
You: Create a PRD for the bulk export feature

Peter: 📋 PRD Created: Bulk Export Enhancement

I've drafted a comprehensive PRD including:

✅ Problem Statement
  • 47 enterprise accounts need bulk data export
  • Current limit of 1000 rows is blocking compliance workflows
  • 23% of enterprise ARR affected

✅ Success Metrics
  • 80% of exports complete in <5 minutes
  • 50% reduction in export-related support tickets
  • 30% feature adoption within 60 days

✅ User Stories (5)
  • Primary: Export filtered data with custom fields
  • Secondary: Schedule recurring exports
  • Admin: Monitor export queue

📎 Document: docs/product/prds/bulk-export.md

Ready for engineering and design review. Who should I add as reviewers?
```

## 📋 Peter's Commands

### Request Intake
```bash
peter intake new                              # Start intake wizard
peter intake sales "Deal" "Request"           # Log sales request
peter intake customer "ID" "Feedback"         # Log customer feedback
peter intake support "Pattern"                # Log support pattern
peter intake dev "Suggestion"                 # Log dev suggestion
```

### Documentation
```bash
peter create prd "Feature Name"               # Create PRD
peter create story "Title"                    # Create user story
peter create epic "Epic Name"                 # Create epic
```

### Prioritization
```bash
peter score rice "Feature"                    # Calculate RICE score
peter prioritize backlog                      # Review backlog
peter compare "Feature A" "Feature B"         # Compare features
```

### Roadmap
```bash
peter roadmap view                            # View roadmap
peter roadmap add "Feature" "Q2"              # Add to roadmap
peter roadmap report                          # Generate report
```

### Communication
```bash
peter communicate update "sales"              # Generate update
peter communicate status                      # Status report
```

## 📈 Metrics Tracked

### Process Metrics
| Metric | Target | Description |
|--------|--------|-------------|
| Intake to Decision | 14 days | Time to prioritization |
| Decision to Ship | 90 days | Time to release |
| Resolution Rate | 70% | Requests addressed |

### Product Metrics
| Metric | Target | Description |
|--------|--------|-------------|
| Feature Adoption | 30% | Users using new features |
| Feature NPS | 40+ | Satisfaction score |
| Time to Value | 7 days | Signup to activation |

## 🤝 Integration with Other Agents

| Agent | Integration |
|-------|-------------|
| **Thomas** | Auto-notifies when PRD approved for documentation |
| **Tucker** | Auto-generates test plan from requirements |
| **Chuck** | Creates release when feature complete |

```
Peter (requirements) → Thomas (docs) → Tucker (tests) → Chuck (deploy)
```

## 🔧 Configuration

Peter uses `.peter.yml` for configuration:

```yaml
version: 1

inputs:
  sales:
    sla_acknowledge: 24h
    sla_decision: 14d
  customers:
    sla_acknowledge: 48h
    
prioritization:
  framework: 'rice'
  thresholds:
    p1_high: 500
    
documentation:
  templates:
    prd: 'templates/prd.md'
    user_story: 'templates/user-story.md'
    
communication:
  update_frequency: 'weekly'
```

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [PETER.md](./PETER.md) | Complete Peter documentation |
| [CLAUDE.md](./CLAUDE.md) | Claude Code configuration |
| [QUICKSTART.md](./QUICKSTART.md) | 10-minute setup guide |

## 📋 Templates

| Template | Use For |
|----------|---------|
| `prd.md` | Product Requirements Documents |
| `user-story.md` | User stories with acceptance criteria |
| `feature-request.md` | Intake form for new requests |
| `roadmap-item.md` | Roadmap planning items |

---

<p align="center">
  <strong>Peter: Your Product Manager</strong><br>
  <em>Turning chaos into clarity, one requirement at a time.</em>
</p>

---

*Every voice matters. Every requirement has context. Every feature serves a purpose.* 📋
