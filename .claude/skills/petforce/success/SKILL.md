# Customer Success Best Practices for PetForce

## Customer Health Scoring Framework

### Formula
```
Health Score = (Engagement × 0.4) + (Sentiment × 0.3) + (Growth × 0.3)
```

### Score Bands
- **Green (80-100)**: Healthy customers
- **Yellow (50-79)**: At-risk customers requiring attention
- **Red (0-49)**: Critical churn risk

### Engagement Score Components (0-100)

**Login Frequency (30% weight)**:
- Daily: 100
- 2-3x/week: 80
- Weekly: 60
- Bi-weekly: 40
- Monthly: 20
- Less than monthly: 0

**Feature Usage Breadth (40% weight)**:
- Using >75% of paid features: 100
- Using 50-75%: 75
- Using 25-50%: 50
- Using <25%: 25

**Core Feature Usage Depth (30% weight)**:
- Power user (top quartile): 100
- Regular user (median): 70
- Light user (bottom quartile): 30
- Barely using: 10

### Sentiment Score Components (0-100)

**NPS Score (50% weight)**:
- Promoter (9-10): 100
- Passive (7-8): 60
- Detractor (0-6): 20
- No NPS data: 50 (neutral)

**Support Ticket Sentiment (30% weight)**:
- Positive/Satisfied: 100
- Neutral: 60
- Frustrated: 30
- Angry: 0

**Response to Outreach (20% weight)**:
- Engaged/Responsive: 100
- Sometimes responds: 60
- Rarely responds: 30
- Unresponsive: 0

### Growth Score Components (0-100)

- **Expanding usage**: 100 (Added seats, upgraded plan, adopted new features)
- **Stable usage**: 60 (No change)
- **Contracting usage**: 20 (Reduced seats, downgraded, abandoned features)

## Escalation Rules

### Immediate (within 24 hours)
- Any Red score
- Yellow score + 20+ point drop in 30 days
- Customer requested cancellation
- Executive escalation

### Weekly Review
- All Yellow scores
- Green scores with declining trend
- Customers with 5+ support tickets in 30 days

### Routine Monitoring
- Green scores with stable/improving trend

## Support Ticket Categorization & Routing

### Categories

**1. Bug Reports → Tucker**
- Product not working as expected
- Error messages
- Data inconsistencies
- Urgency: Based on customer impact

**2. Feature Requests → Peter**
- Customer wants capability that doesn't exist
- Enhancement to existing feature
- Integration requests
- Priority: Based on # of requests + ARR

**3. Documentation Gaps → Thomas**
- "How do I...?" questions
- Confusion about feature purpose
- Missing docs for feature
- Action: Thomas updates docs

**4. Usability Issues → Peter + Dexter**
- Feature exists but confusing
- Workflow is cumbersome
- Design is unclear
- Action: Pattern analysis → UX improvements

**5. Performance Issues → Engrid + Isabel**
- Slow load times
- Timeouts
- System responsiveness
- Action: Performance investigation

**6. Integration Questions → Axel**
- API usage questions
- Integration setup
- Authentication issues
- Action: API docs or support

**7. How-To Questions → Thomas**
- Existing docs but customer didn't find/read
- Might indicate onboarding gap
- Action: Improve discoverability or onboarding

### Ticket Analysis Thresholds

**Escalation triggers**:
- 3+ tickets on same theme
- $50K+ ARR impact
- Any critical customer frustration

## Customer Impact Assessment Checklist

### Customer Health Analysis
- [ ] Customer health scores calculated (Green/Yellow/Red distribution)
- [ ] Affected customers identified by segment and ARR
- [ ] Health trends analyzed (improving/declining patterns)
- [ ] Churn risk signals identified and escalated

### Support Ticket Pattern Analysis
- [ ] Support ticket themes categorized (Bug, Feature, Doc Gap, Usability)
- [ ] Top patterns identified with ticket counts and ARR impact
- [ ] Root causes distinguished from symptoms
- [ ] Recommendations provided for each theme with owner assignment

### Data-Driven Insights
- [ ] Customer feedback backed with evidence (ticket counts, quotes, ARR)
- [ ] Feature adoption metrics provided (usage rates, engagement)
- [ ] NPS/CSAT data included where applicable
- [ ] Correlation validated (not assumed as causation)

### Escalation & Communication
- [ ] Escalations follow Peter's intake process
- [ ] RICE score inputs provided (Reach, Impact, Confidence)
- [ ] Context and recommendations included with escalations
- [ ] Follow-up tracking planned and documented

### Privacy & Compliance
- [ ] PII and sensitive customer data protected (not logged)
- [ ] Customer data handled per Samantha's standards
- [ ] Aggregated data used (not individual events)
- [ ] Customer quotes anonymized appropriately

### Outcome Tracking
- [ ] Weekly report to Peter delivered on schedule
- [ ] Loop closed with customers on escalated issues
- [ ] Outcomes of recommendations tracked
- [ ] Success criteria defined for retention efforts

## Ticket Analysis Schedule

### Weekly (Every Friday)
1. Review all tickets from the week
2. Categorize each ticket
3. Identify top 10 themes
4. Calculate ARR impact per theme
5. Create escalations for themes >3 tickets or >$50K ARR
6. Route individual bug reports to Tucker
7. Compile in weekly report to Peter

### Monthly (Last day of month)
1. Analyze category trends (increasing/decreasing)
2. Identify seasonal patterns
3. Correlate ticket volume with releases/changes
4. Calculate tickets per customer by segment
5. Report to Peter for roadmap planning

### Quarterly (End of quarter)
1. Product gap analysis (features customers need but don't have)
2. Onboarding effectiveness (tickets from new customers)
3. Documentation effectiveness (how-to ticket trends)
4. Competitive gap analysis (features competitors have)

## Feature Adoption Tracking

**Measurement period**: 60 days after launch
**Target adoption rate**: 30% of customers
**Monitoring frequency**: Weekly
**Low adoption threshold**: <20% triggers investigation

### Adoption Analysis Dimensions
- Total adoption percentage
- Adoption by customer health (Green/Yellow/Red)
- Time to first use
- Usage frequency after adoption
- Barriers to adoption (from support tickets)

## Weekly Report Structure

**Delivered**: Friday EOD
**Recipients**: Peter

### Required Sections
1. **Executive Summary**: Health score distribution and trends
2. **Immediate Action Required**: Red/Yellow customers with escalations
3. **Support Ticket Analysis**: Top 10 themes with recommendations
4. **Key Insights & Recommendations**: Data-driven product/docs/eng actions
5. **Feature Adoption Update**: Recently launched features performance
6. **Follow-Up on Previous Escalations**: Status and outcomes

## Privacy & Data Protection

### Never Log
- PII (Personal Identifiable Information)
- Passwords or credentials
- Financial information (credit cards, payment details)
- API keys or tokens
- Personal email addresses (use company domain only)

### Always Anonymize
- Customer quotes in public documents
- Individual event data (use aggregated metrics)
- Sensitive business information

### Compliance Frameworks
- GDPR compliance for EU customers
- SOC 2 standards for data handling
- Data retention: 365 days max

## Integration Protocols

### With Peter (Product Management)
- **Frequency**: Weekly sync + ad-hoc escalations
- **Format**: Use `peter intake customer-success "<insight>"`
- **Timing**: Weekly report by Friday EOD, churn alerts within 24 hours
- **Data**: Health summary, ticket themes with ARR, feature requests with RICE inputs

### With Ana (Analytics)
- **Frequency**: Monthly dashboard review
- **Protocol**: Casey defines metrics, Ana implements
- **Data needed**: Login frequency, feature adoption, session metrics, error rates by customer

### With Larry (Logging/Observability)
- **Frequency**: Continuous read-only access
- **Data needed**: Usage telemetry, feature patterns, aggregated error logs

### With Thomas (Documentation)
- **Frequency**: Ad-hoc
- **Protocol**: Casey identifies doc gaps, provides examples, Thomas updates, Casey validates

### With Tucker (QA)
- **Frequency**: Ad-hoc
- **Protocol**: Casey escalates bugs with impact (count + ARR) and repro steps, Tucker triages within 24 hours

## Customer Check-In Playbook

### When to Check In
- Yellow score + no contact in 30 days
- New feature launch relevant to customer
- Declining engagement trend
- Post-support ticket resolution
- Quarterly business review

### Check-In Components
1. **Personalization data**: Recent activity, feature usage, support tickets
2. **Talking points**: Primary topic based on health factors
3. **Objectives**: Primary goal (understand issues) + Secondary (discover opportunities)
4. **Post check-in**: Log insights, update health score, escalate if needed, schedule follow-up

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Average Health Score | >75 | Weekly |
| Churn Risk (Red+Yellow) | <25% | Weekly |
| Support Tickets/Customer | <2/month | Weekly |
| NPS | >50 | Quarterly |
| Feature Adoption (30 days) | >30% | Per feature |
| Response Time to Red Alerts | <24 hours | Per incident |
| Weekly Report On-Time | 100% | Weekly |
