# Casey Quick Start Guide

Get Casey up and running in 10 minutes.

## Prerequisites

- Access to customer usage data (via Larry's telemetry)
- Support ticket system access (manual or API)
- Peter's product management process in place

## Step 1: Install Casey (2 minutes)

```bash
# Copy Casey to your project
cp -r casey-customer-success-agent your-project/

# Copy Claude Code configuration
cp casey-customer-success-agent/CLAUDE.md your-project/
```

## Step 2: Configure Casey (3 minutes)

Edit `.casey.yml` for your environment:

```yaml
version: 1

customer_health:
  score_thresholds:
    green: 80     # Adjust based on your baseline
    yellow: 50
    red: 0

support_tickets:
  source: manual  # or "zendesk", "intercom", etc.
  analysis_frequency: weekly

reporting:
  weekly_report:
    day: friday
    time: "16:00"
    recipients: [peter]
```

## Step 3: First Health Score (2 minutes)

Calculate health for your first customer:

```bash
casey health score "Acme Corp"
```

Casey will prompt for:
- Login frequency (daily/weekly/monthly)
- Features used (list)
- Recent support tickets (count)
- NPS if available

Output:
```
🟢 Health Score: 85 (GREEN)

Engagement: 90 (High usage, 8/10 features adopted)
Sentiment: 80 (NPS: 9, responsive to outreach)
Growth: 85 (Added 3 seats last month)

Status: Healthy ✓
Next review: [Date]
```

## Step 4: Analyze Support Tickets (2 minutes)

Review last week's tickets:

```bash
casey analyze tickets --period week
```

Casey will:
1. Prompt you to categorize tickets (or load from API)
2. Identify top themes
3. Create escalations for patterns
4. Generate summary

## Step 5: Generate First Report (1 minute)

```bash
casey report weekly
```

This creates your first weekly report for Peter with:
- Customer health summary
- Top support ticket themes
- Recommended actions

The report is saved and can be sent to Peter via his intake process.

---

## Next Steps

### Week 1: Manual Baseline
- Calculate health scores for top 10-20 customers (by ARR)
- Manually review and categorize support tickets
- Send first weekly report to Peter
- Get feedback on scoring accuracy

### Week 2-3: Refine
- Adjust health score weights based on what predicts churn
- Automate ticket ingestion if API available
- Set up dashboard with Ana

### Month 2: Scale
- Expand to all customers
- Automated health score calculation
- Scheduled weekly reports
- Track outcomes of escalations

---

## Quick Reference

### Daily Tasks
```bash
# Check for new Red scores
casey health report --filter red

# Review overnight tickets
casey analyze tickets --since yesterday
```

### Weekly Tasks
```bash
# Full ticket analysis
casey analyze tickets --period week

# Generate report for Peter
casey report weekly

# Track feature adoption
casey report adoption
```

### Monthly Tasks
```bash
# Trend analysis
casey analyze tickets --period month

# NPS calculation
casey report nps

# Review health score accuracy
casey health validate
```

---

## Common Issues

**Q: Health scores seem too high/low**
A: Adjust thresholds in `.casey.yml`. Start with your current baseline, then refine.

**Q: Can't access usage data**
A: Work with Larry to get telemetry access. Start with manual data entry if needed.

**Q: Too many escalations to Peter**
A: Increase threshold for feature request escalations (e.g., 5+ tickets instead of 3)

**Q: Peter says insights aren't actionable**
A: Always include: customer count, ARR impact, specific quotes, and recommended next steps

---

**You're ready!** Casey will help you close the customer feedback loop.

For full documentation, see [CASEY.md](./CASEY.md).
