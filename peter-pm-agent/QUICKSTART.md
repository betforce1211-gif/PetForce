# Peter Product Manager - Quick Start Guide

Get Peter up and running in your organization in 10 minutes.

## Prerequisites

- A place to store documents (repo, Notion, Confluence)
- Slack or similar for communication channels
- Optional: Jira or similar for tracking

---

## Step 1: Add Configuration Files

### Copy these files to your repository:

```
your-repo/
├── .peter.yml                   # Peter configuration
├── CLAUDE.md                    # Claude Code agent config
└── docs/
    └── product/
        └── templates/
            ├── prd.md
            ├── user-story.md
            ├── feature-request.md
            └── roadmap-item.md
```

### Quick copy commands:

```bash
# Create directories
mkdir -p docs/product/templates
mkdir -p docs/product/prds
mkdir -p docs/product/stories
mkdir -p docs/product/requests

# Copy from this package
cp peter-pm-agent/.peter.yml .
cp peter-pm-agent/CLAUDE.md .
cp peter-pm-agent/templates/* docs/product/templates/
```

---

## Step 2: Configure for Your Organization

### Update `.peter.yml`

```yaml
# .peter.yml - Minimum required changes

version: 1

# Configure your input channels
inputs:
  sales:
    channels:
      - type: slack
        channel: '#your-sales-requests-channel'
    sla_acknowledge: 24h
    sla_decision: 14d

  customers:
    sources:
      - type: email
        address: 'your-feedback@company.com'
    sla_acknowledge: 48h

  support:
    system: 'zendesk'  # or 'intercom', 'freshdesk'
    pattern_threshold: 5

# Set your prioritization thresholds
prioritization:
  framework: 'rice'
  thresholds:
    p0_critical: 800
    p1_high: 500
    p2_medium: 300
    p3_low: 100

# Configure your output locations
documentation:
  output:
    prds: 'docs/product/prds/'
    stories: 'docs/product/stories/'
    requests: 'docs/product/requests/'
```

### Key Configuration Decisions

| Setting | Question | Default |
|---------|----------|---------|
| `sla_acknowledge` | How fast should requests be acknowledged? | 24-48h |
| `sla_decision` | How fast should prioritization happen? | 14 days |
| `pattern_threshold` | How many similar tickets = a pattern? | 5 |
| `p1_high threshold` | What RICE score = high priority? | 500 |

---

## Step 3: Set Up Input Channels

### Slack Channels (Recommended)

Create these channels:
- `#product-requests` - Incoming feature requests
- `#product-updates` - Peter's status updates
- `#product-team` - Internal product discussions

### Email Forwarding (Optional)

Set up email forwarding for:
- `feedback@company.com` → Product team
- `product-requests@company.com` → Tracking system

### Support Integration

If using Zendesk/Intercom:
1. Create a tag or view for "feature-requests"
2. Configure Peter to monitor that view/tag

---

## Step 4: Create Your First Documents

### Test the Templates

```bash
# Create a test PRD
cp docs/product/templates/prd.md docs/product/prds/test-feature.md

# Create a test user story
cp docs/product/templates/user-story.md docs/product/stories/test-story.md
```

### Fill in a Real Request

Try logging a real request you've received:

```markdown
# Feature Request Intake Form

## Request Information

| Field | Value |
|-------|-------|
| **Request ID** | FR-001 |
| **Date Received** | [Today's Date] |
| **Source** | Sales |
| **Submitted By** | [Sales Rep Name] |
| **Status** | New |

## Source Details

### From Sales
| Field | Value |
|-------|-------|
| Deal Name | Acme Corp |
| Deal Value | $100,000 |
| Customer | Acme Corporation |
| Requested Feature | Bulk export with custom fields |
...
```

---

## Step 5: Activate Peter in Claude Code

Copy `CLAUDE.md` to your project root to activate Peter as your Claude Code agent.

Then you can interact with Peter:

```
You: Log a new sales request for the Acme deal

Peter: 📥 Let me capture that request.

What feature are they requesting?
```

```
You: They need bulk export functionality to export more than 1000 rows

Peter: 📥 Sales Request Logged

Deal: Acme Corp
Request: Bulk export - ability to export more than 1000 rows
ID: SR-001

📊 Initial Assessment:
• I'll check for similar requests
• Will assess technical feasibility
• Prioritization decision by [date]

What's the deal value and timeline pressure?
```

---

## Step 6: Establish Your Workflow

### Request Intake Workflow

```
1. Request Received
   └── Peter acknowledges within SLA

2. Initial Assessment
   └── Peter checks for similar requests
   └── Peter assesses strategic fit

3. Prioritization
   └── Peter calculates RICE score
   └── Peter slots into priority tier

4. Communication
   └── Peter notifies requester of decision
   └── Peter updates roadmap if accepted
```

### Weekly Rhythm

| Day | Activity |
|-----|----------|
| Monday | Review new requests from weekend |
| Wednesday | Prioritization review meeting |
| Friday | Stakeholder update sent |

---

## Using Peter Daily

### Log a Sales Request

```
peter intake sales "Acme Corp ($100K)" "Need bulk export feature"
```

Peter will:
1. ✅ Log the request with deal context
2. ✅ Check for similar requests
3. ✅ Set timeline for decision
4. ✅ Acknowledge to sales team

### Score a Feature

```
peter score rice "Bulk Export"
```

Peter will guide you through:
1. **Reach**: How many users affected?
2. **Impact**: How significant is the effect?
3. **Confidence**: How sure are we?
4. **Effort**: How long to build?

### Create a PRD

```
peter create prd "Bulk Export Enhancement"
```

Peter will generate a PRD with:
- Problem statement section
- Goals and success metrics
- User stories template
- Technical considerations
- Launch plan outline

### View the Roadmap

```
peter roadmap view
```

Peter shows:
- Committed items (this quarter)
- Planned items (next quarter)
- Exploring (under research)

---

## Communication Templates

### Acknowledging Requests

When a request comes in, send:

```
📥 Request Received

Thanks for submitting this request. I've logged it and will 
evaluate it against our current priorities.

📋 What's Next:
• Review: By [date]
• Decision: By [date]
• You'll hear from me: [date]

Questions? Just reply to this message.
```

### Communicating Decisions

When you've prioritized:

```
📋 Decision on Your Request: [Feature]

After reviewing [X] similar requests and assessing strategic 
fit, I've prioritized this for [Quarter/Timeline].

📊 Why:
• [X] customers have requested this
• Aligns with our [strategic goal]
• Estimated [Y] weeks to build

📅 Timeline:
• Design: [Date range]
• Development: [Date range]  
• Expected release: [Date]

I'll keep you updated on progress.
```

---

## Prioritization Cheat Sheet

### RICE Quick Reference

| Factor | Question | Scale |
|--------|----------|-------|
| **Reach** | Users per quarter? | Count |
| **Impact** | How much does it help? | 0.25-3 |
| **Confidence** | How sure? | 50-100% |
| **Effort** | Person-months? | Number |

### Impact Scale

| Score | Meaning | Example |
|-------|---------|---------|
| 3 | Massive | Game-changing, huge value |
| 2 | High | Significant improvement |
| 1 | Medium | Noticeable improvement |
| 0.5 | Low | Minor improvement |
| 0.25 | Minimal | Barely noticeable |

### Priority Actions

| Priority | RICE Score | What to Do |
|----------|------------|------------|
| P0 | >800 | Interrupt current work |
| P1 | 500-800 | Plan for this quarter |
| P2 | 300-500 | Plan for next quarter |
| P3 | 100-300 | Add to backlog |
| Decline | <100 | Explain and close |

---

## Troubleshooting

### Too Many Requests?
- Batch similar requests together
- Create request intake office hours
- Use async communication

### Prioritization Debates?
- Always come back to RICE score
- Get data to increase confidence
- Make decision criteria transparent

### Stakeholders Unhappy?
- Close the loop on every request
- Explain the "why" behind decisions
- Show the trade-offs clearly

---

## Integration with Other Agents

### With Thomas (Documentation)

When a PRD is approved:
```
peter notify thomas "PRD-123 approved, ready for documentation"
```

### With Tucker (QA)

When requirements are finalized:
```
peter notify tucker "US-456 ready for test plan creation"
```

### With Chuck (CI/CD)

When feature is complete:
```
peter notify chuck "Feature X ready for release preparation"
```

---

## Next Steps

1. 📖 Read the full [PETER.md](./PETER.md) documentation
2. 📋 Customize the templates for your organization
3. 🔧 Configure your input channels
4. 🚀 Start logging your first requests
5. 📊 Establish your prioritization rhythm

---

*Peter: Every voice matters. Every requirement has context. Every feature serves a purpose.* 📋
