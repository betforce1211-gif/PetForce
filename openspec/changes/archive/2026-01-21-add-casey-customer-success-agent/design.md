# Design Document: Casey - Customer Success Agent

## Context

The PetForce team consists of 13 specialized AI agents covering the full software development lifecycle. Despite comprehensive coverage of product management (Peter), engineering (Engrid, Axel, Maya), data (Buck, Ana), infrastructure (Isabel, Chuck, Larry), and quality (Tucker, Samantha, Thomas), there is a critical gap in the **customer success and feedback loop**.

### Current State
- **Peter** gathers requirements from sales, customers, and support, but reactively
- **Ana** can build customer analytics dashboards, but lacks a consumer who interprets customer health
- **Larry** captures product usage telemetry, but no one systematically analyzes it for customer insights
- **Support tickets** are handled externally to the agent team, with ad-hoc escalation
- **Customer health** is not systematically monitored or reported

### Problem Statement
Without a dedicated customer success function:
1. Churn risks are discovered too late (reactive vs proactive)
2. Product feedback from actual usage is not systematically captured
3. Feature adoption is not tracked or optimized
4. Onboarding gaps are not identified and closed
5. Customer satisfaction (NPS, CSAT) is not measured or reported
6. Support ticket patterns don't inform product decisions

This gap creates a **broken feedback loop** where the team builds features but doesn't close the loop on whether those features solve customer problems effectively.

### Stakeholders
- **Primary**: Peter (consumes customer insights for product decisions)
- **Secondary**: Ana (provides data for Casey to analyze), Engrid (implements features based on feedback)
- **Tertiary**: All agents benefit from customer-driven prioritization

## Goals / Non-Goals

### Goals
1. **Close the customer feedback loop**: Ensure post-deployment customer experience systematically informs product planning
2. **Proactive churn prevention**: Identify at-risk customers before they churn
3. **Systematic insight generation**: Convert support tickets and usage data into actionable product insights
4. **Customer health visibility**: Provide clear, consistent customer health scoring to the team
5. **Onboarding optimization**: Track and improve customer onboarding and feature adoption
6. **Seamless integration**: Casey integrates cleanly with existing agents, especially Peter and Ana

### Non-Goals
1. **Not replacing human CS teams**: Casey augments, not replaces, human customer success managers
2. **Not a CRM**: Casey analyzes data from CRMs but doesn't replace them
3. **Not customer support**: Casey analyzes support tickets but doesn't resolve them
4. **Not sales**: Casey provides insights but doesn't close deals (Peter coordinates with sales)
5. **Not real-time incident response**: That's Larry's domain for technical incidents
6. **Not immediate automation**: MVP is manual/semi-automated; full automation comes later

## Decisions

### Decision 1: Casey's Primary Focus - Health Monitoring & Insight Generation
**What**: Casey focuses on two core capabilities:
1. Monitoring customer health (usage, engagement, satisfaction)
2. Synthesizing insights from support tickets and feedback

**Why**: These two capabilities have the highest ROI for closing the feedback loop. They're also feasible to implement with current data sources (Larry's telemetry, support ticket access).

**Alternatives Considered**:
- **Broader scope (include sales, onboarding automation)**: Rejected - too complex for MVP, overlaps with Peter's sales intake
- **Narrower scope (only support tickets)**: Rejected - misses the health monitoring opportunity
- **Focus on retention campaigns**: Rejected - that's marketing/sales, not core product feedback

**Trade-offs**:
- ✅ Pro: Clear, focused mandate that addresses the critical gap
- ✅ Pro: Achievable with existing data sources
- ⚠️ Con: Doesn't cover every CS function (intentional - start narrow, expand later)

### Decision 2: Integration Model - Casey as Peter's Primary Input Source
**What**: Casey is designed as a **specialized input source for Peter**, similar to how sales, customers, and support feed Peter today, but with systematic analysis.

**Why**: Peter already owns prioritization and product decisions. Casey's role is to provide Peter with **high-quality, analyzed customer insights** rather than duplicating Peter's decision-making authority.

**Alternatives Considered**:
- **Casey makes product decisions**: Rejected - violates single responsibility, creates confusion with Peter
- **Casey reports directly to stakeholders**: Rejected - bypasses product process, creates alignment issues
- **Casey as peer to Peter**: Rejected - unclear boundaries, potential for conflict

**Trade-offs**:
- ✅ Pro: Clear boundaries (Casey analyzes, Peter decides)
- ✅ Pro: Leverages Peter's existing prioritization framework (RICE)
- ⚠️ Con: Requires strong Casey ↔ Peter integration (addressed in specs)

### Decision 3: Data Sources - Start with Larry + Manual Tickets, Automate Later
**What**:
- **Phase 1 (MVP)**: Casey manually reviews support tickets, uses Larry's existing telemetry dashboards
- **Phase 2**: Automated ticket ingestion and categorization
- **Phase 3**: CRM integration, predictive analytics

**Why**: Phased approach reduces risk and delivers value quickly. Manual analysis can start immediately without waiting for integrations.

**Alternatives Considered**:
- **Build full automation upfront**: Rejected - too slow, higher risk, delays value
- **Wait for perfect data**: Rejected - perfect is enemy of good, insights available now
- **Use external tools only**: Rejected - want Casey to be part of the agent team, not just a dashboard viewer

**Trade-offs**:
- ✅ Pro: Fast time to value (weeks, not months)
- ✅ Pro: Learn what Casey needs before building automation
- ⚠️ Con: Manual work required initially (acceptable trade-off)

### Decision 4: Customer Health Scoring - Simple Framework, Expand Over Time
**What**: Start with a simple health score based on:
1. **Engagement**: Usage frequency, feature adoption
2. **Sentiment**: Support ticket sentiment, NPS when available
3. **Growth**: Expansion signals or contraction signals

Score: Green (healthy), Yellow (at-risk), Red (critical)

**Why**: Simple framework is actionable immediately, can be refined based on what predicts churn.

**Alternatives Considered**:
- **Complex ML model**: Rejected for MVP - requires data scientists, historical data, longer timeline
- **Single metric (e.g., login frequency)**: Rejected - too simplistic, misses key signals
- **Enterprise health score platform**: Rejected - Casey should own this, not external tool

**Trade-offs**:
- ✅ Pro: Actionable immediately with available data
- ✅ Pro: Can iterate based on what works
- ⚠️ Con: Not predictive initially (phase 3 adds ML)

### Decision 5: Agent Personality - Empathetic, Data-Driven, Proactive
**What**: Casey's personality is:
- **Empathetic**: Advocates for customers, brings their voice to the team
- **Data-driven**: Backs insights with evidence, not anecdotes
- **Proactive**: Surfaces issues before they escalate
- **Collaborative**: Works with Peter, not around him

**Why**: Customer success requires empathy to interpret qualitative feedback, but also rigor to prioritize objectively.

**Trade-offs**:
- ✅ Pro: Balances customer advocacy with product discipline
- ✅ Pro: Fits team culture (all agents are data-driven)

## Architecture

### Component Diagram
```
┌─────────────────────────────────────────────────────────────────┐
│                         Casey Agent                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │ Health Monitor  │  │ Ticket Analyzer  │  │ Insight       │ │
│  │                 │  │                  │  │ Synthesizer   │ │
│  │ - Usage data    │  │ - Categorization │  │               │ │
│  │ - Engagement    │  │ - Trend detection│  │ - Pattern ID  │ │
│  │ - Scoring       │  │ - Escalation     │  │ - Action recs │ │
│  └────────┬────────┘  └────────┬─────────┘  └───────┬───────┘ │
│           │                    │                     │         │
│           └────────────────────┴─────────────────────┘         │
│                              │                                 │
└──────────────────────────────┼─────────────────────────────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
         ┌──────────┐   ┌──────────┐  ┌──────────┐
         │  Peter   │   │   Ana    │  │  Larry   │
         │ (Product)│   │(Dashboards)│ │(Telemetry)│
         └──────────┘   └──────────┘  └──────────┘
```

### Data Flow
1. **Input Sources** → Casey:
   - Support tickets (manual review → automated ingestion)
   - Usage telemetry (from Larry)
   - Customer satisfaction surveys (NPS, CSAT)
   - Feature adoption metrics (from Ana)

2. **Casey Processing**:
   - Categorizes and prioritizes support tickets
   - Calculates customer health scores
   - Identifies trends and patterns
   - Synthesizes insights with recommendations

3. **Casey Outputs** → Peter:
   - Weekly customer health report
   - Feature request escalations with context (usage data, # of tickets)
   - Churn risk alerts
   - Onboarding improvement recommendations

4. **Casey Outputs** → Ana:
   - Requirements for customer health dashboards
   - Metrics definitions
   - Reporting requirements

### Integration Points

#### Casey ↔ Peter (Primary Integration)
**Frequency**: Weekly sync + ad-hoc escalations
**Data**:
- Customer health summary
- Top support ticket themes
- Feature requests with prioritization context
- Churn risk alerts

**Protocol**:
- Casey uses Peter's intake process (`peter intake customer-success "<insight>"`)
- Casey provides RICE inputs (Reach, Impact, Confidence) based on customer data
- Peter makes final prioritization decisions

#### Casey ↔ Ana
**Frequency**: Monthly dashboard review
**Data**:
- Customer health metric definitions
- Dashboard requirements
- Cohort definitions

**Protocol**:
- Casey defines metrics, Ana implements dashboards
- Casey validates dashboard accuracy
- Ana includes customer metrics in team dashboard

#### Casey ↔ Larry
**Frequency**: Continuous (Casey reads Larry's data)
**Data**:
- Usage patterns
- Feature adoption rates
- Error rates by customer

**Protocol**:
- Casey queries Larry's metrics
- Casey does not modify Larry's logs
- Casey may request new metrics from Larry

#### Casey ↔ Thomas
**Frequency**: Ad-hoc
**Data**:
- Customer documentation gaps
- Onboarding content improvements

**Protocol**:
- Casey identifies doc gaps from support tickets
- Thomas updates documentation
- Casey validates with customers

## Customer Health Scoring Framework

### Metrics
```
Health Score = Engagement (40%) + Sentiment (30%) + Growth (30%)

Engagement (0-100):
  - Login frequency (30%)
  - Feature usage breadth (40%)
  - Core feature usage depth (30%)

Sentiment (0-100):
  - NPS score if available (50%)
  - Support ticket sentiment (30%)
  - Response to outreach (20%)

Growth (0-100):
  - Expanding usage (seats, features) = +50
  - Stable usage = 0
  - Contracting usage = -50
  - Then normalize to 0-100

Overall Score:
  - 80-100: Green (Healthy)
  - 50-79: Yellow (At-risk)
  - 0-49: Red (Critical)
```

### Escalation Thresholds
- **Red score**: Immediate alert to Peter + recommended action
- **Yellow score + declining trend**: Weekly review
- **Green score**: Routine monitoring

## Support Ticket Analysis Taxonomy

### Categories
1. **Bug Reports**: Route to Tucker for triage
2. **Feature Requests**: Route to Peter with context (# of requests, customer ARR)
3. **Documentation Gaps**: Route to Thomas
4. **Usability Issues**: Synthesize patterns, route to Peter + Dexter
5. **Performance Issues**: Route to Engrid + Isabel
6. **Integration Questions**: Route to Axel
7. **How-To Questions**: May indicate doc gap or onboarding issue

### Analysis
- **Weekly**: Top 10 ticket themes
- **Monthly**: Trend analysis (increasing/decreasing categories)
- **Quarterly**: Product gap analysis (features customers need but don't have)

## Risks / Trade-offs

### Risk 1: Data Privacy and Compliance
**Risk**: Customer data (usage, tickets) contains PII and must be handled properly

**Mitigation**:
- Samantha reviews all data handling procedures
- Casey follows same data protection standards as Larry
- Anonymize/aggregate data where possible
- Document compliance (GDPR, SOC2) in Casey's spec

**Trade-off**: May limit some analyses to protect privacy (acceptable)

### Risk 2: Overlap with Peter
**Risk**: Unclear boundaries could lead to Casey and Peter duplicating work or disagreeing

**Mitigation**:
- Clear mandate: Casey **analyzes**, Peter **decides**
- Casey uses Peter's intake process
- Weekly sync to align
- Document boundaries explicitly in both agents' specs

**Trade-off**: Requires disciplined communication (worth it for clarity)

### Risk 3: Manual Effort in MVP
**Risk**: Manual ticket review and health scoring could be time-consuming

**Mitigation**:
- Start with highest-value customers (e.g., top 20% by ARR)
- Automate incrementally as patterns emerge
- Define what "good enough" looks like for MVP

**Trade-off**: Less comprehensive initially, but faster to value

### Risk 4: Dependency on External Systems
**Risk**: Support ticket system, CRM may not have APIs or may change

**Mitigation**:
- Design Casey to be data-source agnostic
- Start with manual data access, add integrations later
- Use standard formats (CSV, JSON) for flexibility

**Trade-off**: Less real-time initially (acceptable for MVP)

## Migration Plan

### Phase 1: MVP (Weeks 1-4)
**Goal**: Casey operational with manual processes

**Deliverables**:
- Casey agent fully documented
- Manual support ticket review process
- Customer health scoring (manual calculation)
- Weekly report to Peter
- Integration with Ana for basic dashboard

**Success Criteria**:
- Casey delivers first customer health report
- At least 3 actionable insights to Peter in first month
- Customer health dashboard live in Ana's system

### Phase 2: Semi-Automated (Months 2-3)
**Goal**: Reduce manual effort, increase scale

**Deliverables**:
- Automated ticket ingestion (if API available)
- Automated health score calculation
- Scheduled reports (weekly to Peter, monthly to team)
- Trend analysis over time

**Success Criteria**:
- Casey handles 2x customers with same effort
- Predictive insights (not just reactive)
- Ticket categorization accuracy >80%

### Phase 3: Fully Automated (Months 4-6)
**Goal**: Predictive, proactive customer success

**Deliverables**:
- Churn prediction model (ML-based)
- Automated outreach triggers
- CRM integration for 360° view
- Real-time health score updates

**Success Criteria**:
- Measurable reduction in churn
- Proactive interventions preventing escalations
- Casey operating with minimal manual intervention

## Open Questions

1. **Support Ticket Access**: Do we have API access to the support system, or will Casey need to work with exports/manual access initially?
   - **Answer needed from**: Operations/IT team
   - **Impact**: Determines automation timeline

2. **Customer Data Privacy**: Are there specific compliance requirements (GDPR, HIPAA) that affect what Casey can analyze?
   - **Answer needed from**: Samantha (Security), Legal
   - **Impact**: May restrict certain analyses

3. **NPS/CSAT Infrastructure**: Do we currently collect NPS/CSAT? If not, should Casey implement this?
   - **Answer needed from**: Peter, Operations
   - **Impact**: Affects sentiment scoring

4. **CRM Integration**: Which CRM system is used, and what's the integration path?
   - **Answer needed from**: Sales/Marketing
   - **Impact**: Affects Phase 3 planning

5. **Customer Definition**: For B2B, is the customer the account or individual users? How do we handle multi-user accounts?
   - **Answer needed from**: Peter
   - **Impact**: Affects health scoring granularity

## Appendix

### Comparable Patterns
Other software teams solve this with:
- **Gainsight, ChurnZero**: Enterprise CS platforms (Casey is lightweight, integrated alternative)
- **Dedicated CS team + tools**: Casey augments this, doesn't replace
- **Product-led growth motions**: Casey enables this by tracking product-qualified leads (PQL)

### Success Stories
Teams with strong customer success feedback loops see:
- 25-50% reduction in churn (source: Gainsight benchmark data)
- 10-30% increase in expansion revenue (existing customers buy more)
- Faster product-market fit iterations (tighter feedback loops)

### References
- Peter's current intake process: `peter-pm-agent/CLAUDE.md`
- Ana's dashboard capabilities: `ana-analytics-agent/ANA.md`
- Larry's telemetry: `larry-logging-agent/CLAUDE.md`
- Team collaboration patterns: `/AGENTS.md`
