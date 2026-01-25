# 💙 Casey: The Customer Success Agent

> *Happy customers build great products with us. Unhappy customers build them elsewhere.*

Casey is a comprehensive Customer Success agent powered by Claude Code. She monitors customer health, analyzes support patterns, and ensures the customer feedback loop flows back to product planning. When Casey spots a churn risk, your team knows before the customer churns.

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Customer Health Monitoring** | Green/Yellow/Red scoring based on engagement, sentiment, and growth |
| **Support Ticket Analysis** | Pattern detection, categorization, and product insight extraction |
| **Churn Risk Alerts** | Proactive identification of at-risk customers with retention recommendations |
| **Feature Adoption Tracking** | Monitor which features customers use and identify adoption gaps |
| **NPS/CSAT Measurement** | Track customer satisfaction with trend analysis |
| **Peter Integration** | Systematic customer insights fed to product planning |

## 📁 Package Contents

```
casey-customer-success-agent/
├── CASEY.md                              # Full customer success documentation
├── CLAUDE.md                             # Claude Code agent configuration
├── README.md                             # This file
├── QUICKSTART.md                         # 10-minute setup guide
├── .casey.yml                            # Casey configuration
└── templates/
    ├── health-score.md                   # Customer health score template
    ├── ticket-analysis.md                # Support ticket analysis template
    ├── check-in-playbook.md              # Customer check-in guide
    ├── churn-escalation.md               # Churn risk alert template
    ├── feature-adoption.md               # Feature adoption tracker
    └── weekly-report.md                  # Weekly report to Peter
```

## 🚀 Quick Start

### 1. Copy files to your repository

```bash
cp -r casey-customer-success-agent your-repo/
cp casey-customer-success-agent/CLAUDE.md your-repo/
```

### 2. Configure for your product

```yaml
# .casey.yml
customer_health:
  score_thresholds:
    green: 80    # Healthy
    yellow: 50   # At-risk
    red: 0       # Critical
```

### 3. Start monitoring

```bash
casey health score <customer-name>
casey analyze tickets --period week
casey report weekly
```

**[📖 Full Setup Guide →](./QUICKSTART.md)**

## 📊 Customer Health Scoring

Casey uses a weighted health score:

```
Health Score = Engagement (40%) + Sentiment (30%) + Growth (30%)
```

| Component | Measures | Data Sources |
|-----------|----------|--------------|
| **Engagement** | Login frequency, feature adoption, usage depth | Larry (telemetry) |
| **Sentiment** | NPS, support ticket tone, responsiveness | Surveys, support system |
| **Growth** | Expanding/stable/contracting usage | Usage data, plan changes |

### Score Bands
- 🟢 **80-100 (Green)**: Healthy, stable, engaged
- 🟡 **50-79 (Yellow)**: At-risk, needs attention
- 🔴 **0-49 (Red)**: Critical, immediate intervention required

## 🎫 Support Ticket Analysis

Casey categorizes tickets and routes them to the right agent:

| Category | Routes To | Purpose |
|----------|-----------|---------|
| Bug Reports | Tucker | Product defects needing fixes |
| Feature Requests | Peter | Customer-requested capabilities |
| Documentation Gaps | Thomas | Missing or unclear docs |
| Usability Issues | Peter + Dexter | UX improvements needed |
| Performance Issues | Engrid + Isabel | Speed/scale problems |
| Integration Questions | Axel | API and integration support |
| How-To Questions | Thomas | Onboarding or doc discoverability |

### Analysis Cadence
- **Weekly**: Top 10 themes, escalate patterns
- **Monthly**: Category trends, seasonal patterns
- **Quarterly**: Product gap analysis, competitive insights

## 🤖 Using with Claude Code

Once configured, Claude Code becomes Casey:

```
You: Analyze this week's support tickets

Casey: 🎫 Support Ticket Analysis: Week of Jan 15-19

VOLUME: 47 tickets (+12% vs last week)

TOP THEMES:
1. Bulk export requests (12 tickets, $450K ARR)
   → Feature Request → Escalating to Peter with RICE inputs

2. Search performance slow (8 tickets, $200K ARR)
   → Performance Issue → Escalating to Engrid + Isabel

3. CSV import confusion (6 tickets)
   → Documentation Gap → Escalating to Thomas

CHURN RISKS IDENTIFIED: 2 customers
→ Acme Corp (Red score, $50K ARR) - Generating alert...
→ TechStart (Yellow→Red, $25K ARR) - Generating alert...

Escalations created:
• Peter: FR-147 (Bulk export)
• Engrid: PERF-22 (Search performance)
• Thomas: DOC-89 (CSV import docs)
• Peter: CR-12 (Acme churn risk)
• Peter: CR-13 (TechStart churn risk)

Full analysis in weekly report (Friday).
```

## 🎯 Casey's Commands

### Health Monitoring
```bash
casey health score <customer>          # Calculate health score
casey health track <customer>          # Track over time
casey health report                    # All customers summary
```

### Ticket Analysis
```bash
casey analyze tickets --period week    # Weekly analysis
casey analyze tickets --period month   # Monthly trends
casey categorize ticket <id>           # Categorize single ticket
```

### Escalations
```bash
casey escalate churn <customer>        # Alert Peter to churn risk
casey escalate feature "<name>"        # Feature request with context
casey escalate bug <ticket-id>         # Route to Tucker
```

### Reporting
```bash
casey report weekly                    # Weekly report to Peter
casey report nps                       # NPS analysis
casey report adoption "<feature>"      # Feature adoption
```

### Customer Outreach
```bash
casey check-in <customer>              # Generate check-in playbook
casey announce "<feature>" --segment   # Draft announcement
```

## 🤝 Integration with Other Agents

| Agent | Integration |
|-------|-------------|
| **Peter** | Primary - Weekly reports, feature requests, churn alerts |
| **Ana** | Customer health dashboards, usage metrics |
| **Larry** | Usage telemetry, feature adoption data |
| **Thomas** | Documentation gaps from support tickets |
| **Tucker** | Customer-reported bugs with impact context |

## 📋 Configuration

Casey uses `.casey.yml`:

```yaml
version: 1

customer_health:
  score_thresholds:
    green: 80
    yellow: 50
    red: 0

  escalation_rules:
    immediate:
      - red_score
      - yellow_drop_20_points
      - cancellation_request
    weekly_review:
      - all_yellow_scores
      - green_declining_trend

support_tickets:
  analysis_frequency: weekly
  top_themes_count: 10
  escalation_threshold:
    ticket_count: 3
    arr_impact: 50000

reporting:
  weekly_report:
    day: friday
    recipients: [peter]
  monthly_summary:
    day: last_friday
    recipients: [peter, team]

integrations:
  peter:
    intake_command: "peter intake customer-success"
  ana:
    dashboard_refresh: daily
  larry:
    telemetry_access: read_only
```

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [CASEY.md](./CASEY.md) | Complete customer success documentation |
| [CLAUDE.md](./CLAUDE.md) | Claude Code configuration |
| [QUICKSTART.md](./QUICKSTART.md) | 10-minute setup guide |

## 📋 Templates

| Template | Use For |
|----------|---------|
| `health-score.md` | Calculating customer health scores |
| `ticket-analysis.md` | Weekly ticket analysis |
| `check-in-playbook.md` | Personalized customer check-ins |
| `churn-escalation.md` | Alerting Peter to churn risks |
| `feature-adoption.md` | Tracking feature rollout success |
| `weekly-report.md` | Weekly report to Peter |

## 🎓 Best Practices

### DO
✅ Calculate health scores at least weekly
✅ Escalate Red scores within 24 hours
✅ Provide Peter with RICE inputs for feature requests
✅ Track outcomes of your escalations
✅ Distinguish between symptoms (ticket volume) and root causes (product gaps)
✅ Protect customer privacy - no PII in logs
✅ Close the loop with customers when issues are resolved

### DON'T
❌ Make product decisions (that's Peter's role)
❌ Promise customers features without Peter's approval
❌ Escalate without context and recommendations
❌ Ignore declining trends in Green customers
❌ Route tickets without categorization
❌ Skip the weekly report to Peter
❌ Use anecdotes instead of data

## 📊 Success Metrics

Track Casey's effectiveness:

- **Week 2**: First weekly customer health report delivered to Peter
- **Month 1**: 3+ actionable product insights from support tickets
- **Month 1**: Customer health dashboard live in Ana's system
- **Month 2**: NPS/CSAT tracking established
- **Month 3**: Measurable reduction in unplanned churn

### KPIs to Monitor
- Customer health score (average and distribution)
- Churn rate (monthly)
- NPS (quarterly)
- Support tickets per customer (monthly average)
- Feature adoption rate (% customers using new features within 60 days)
- Time to intervention (hours between Red score and action)

## 🔄 Workflow

```
┌─────────────┐
│  Monitor    │  Daily: Check health scores
│  Health     │  Weekly: Analyze tickets
└──────┬──────┘  Monthly: Trend analysis
       │
       ▼
┌─────────────┐
│  Identify   │  Red scores → Immediate alert
│  Risks      │  Yellow scores → Weekly review
└──────┬──────┘  Patterns → Feature requests
       │
       ▼
┌─────────────┐
│  Escalate   │  Churn risks → Peter (24h)
│  to Peter   │  Features → Peter (weekly)
└──────┬──────┘  Bugs → Tucker (ad-hoc)
       │
       ▼
┌─────────────┐
│  Track &    │  Did retention work?
│  Learn      │  Did feature adoption improve?
└─────────────┘  Refine health scoring
```

## 🆘 Troubleshooting

**Health scores seem inaccurate?**
- Review data sources (Larry's telemetry accessible?)
- Check if NPS/CSAT data is current
- Validate calculation weights in `.casey.yml`

**Too many Yellow/Red alerts?**
- Adjust thresholds in `.casey.yml`
- Segment by plan tier (different thresholds for different tiers)
- Focus on high-ARR customers first

**Peter says insights aren't actionable?**
- Ensure you're providing RICE inputs
- Include specific customer quotes
- Recommend next steps, don't just report problems
- Track which types of escalations Peter acts on

---

<p align="center">
  <strong>Casey: Your Customer Success Partner</strong><br>
  <em>Closing the feedback loop, one customer at a time.</em>
</p>

---

*Happy customers build great products with us. Unhappy customers build them elsewhere.* 💙
