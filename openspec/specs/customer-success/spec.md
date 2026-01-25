# customer-success Specification

## Purpose
TBD - created by archiving change add-casey-customer-success-agent. Update Purpose after archive.
## Requirements
### Requirement: Customer Health Monitoring
The system SHALL provide systematic customer health monitoring to identify at-risk customers and track engagement trends.

#### Scenario: Calculate customer health score
- **GIVEN** a customer with usage data, support ticket history, and engagement metrics
- **WHEN** Casey calculates the health score
- **THEN** the score SHALL be a value between 0-100
- **AND** the score SHALL include engagement (40%), sentiment (30%), and growth (30%) components
- **AND** the customer SHALL be categorized as Green (80-100), Yellow (50-79), or Red (0-49)

#### Scenario: Identify at-risk customer
- **GIVEN** a customer with a Red health score (0-49) OR a Yellow score with declining trend
- **WHEN** Casey identifies the at-risk status
- **THEN** Casey SHALL escalate to Peter with customer context, risk factors, and recommended actions
- **AND** the escalation SHALL include ARR at risk, root cause analysis, and timeline for intervention

#### Scenario: Track health score trends
- **GIVEN** a customer's health scores calculated over multiple time periods
- **WHEN** Casey analyzes the trend
- **THEN** Casey SHALL identify improving, stable, or declining patterns
- **AND** Casey SHALL flag declining patterns for proactive outreach

### Requirement: Support Ticket Analysis
The system SHALL analyze support ticket patterns to identify product gaps, usability issues, and documentation needs.

#### Scenario: Categorize support tickets
- **GIVEN** a support ticket with description, customer information, and category
- **WHEN** Casey categorizes the ticket
- **THEN** the ticket SHALL be assigned to one of: Bug Report, Feature Request, Documentation Gap, Usability Issue, Performance Issue, Integration Question, or How-To Question
- **AND** the category SHALL inform routing (e.g., Bug → Tucker, Feature Request → Peter)

#### Scenario: Identify ticket themes
- **GIVEN** support tickets from a time period (e.g., week, month)
- **WHEN** Casey analyzes ticket themes
- **THEN** Casey SHALL identify the top themes by frequency
- **AND** Casey SHALL quantify impact (number of tickets, affected customers, total ARR)
- **AND** Casey SHALL provide this analysis to Peter weekly

#### Scenario: Escalate recurring issue as product gap
- **GIVEN** a feature request appearing in 3+ support tickets OR affecting customers with >$100K combined ARR
- **WHEN** Casey identifies the pattern
- **THEN** Casey SHALL escalate to Peter as a feature request
- **AND** Casey SHALL provide context: number of requests, customer names, ARR impact, and representative quotes
- **AND** Casey SHALL suggest RICE score inputs based on customer data

### Requirement: Customer Insight Synthesis
The system SHALL synthesize insights from customer data, support tickets, and usage patterns to inform product decisions.

#### Scenario: Generate weekly customer health report
- **GIVEN** the current week's customer data
- **WHEN** Casey generates the weekly report for Peter
- **THEN** the report SHALL include: health score distribution (Green/Yellow/Red count), at-risk customers requiring action, top support ticket themes, and key insights with recommendations
- **AND** the report SHALL be delivered by end-of-week

#### Scenario: Identify feature adoption gap
- **GIVEN** a newly released feature with low adoption (<20% of active customers after 30 days)
- **WHEN** Casey analyzes adoption
- **THEN** Casey SHALL identify the gap
- **AND** Casey SHALL investigate potential causes (documentation, usability, awareness)
- **AND** Casey SHALL recommend interventions to Thomas (docs), Dexter (UX), or Peter (positioning)

#### Scenario: Track onboarding effectiveness
- **GIVEN** new customers in their first 30 days
- **WHEN** Casey tracks onboarding progress
- **THEN** Casey SHALL measure: time to first value, feature activation rate, and support ticket frequency
- **AND** Casey SHALL identify onboarding drop-off points
- **AND** Casey SHALL recommend onboarding improvements to Peter and Thomas

### Requirement: Customer Communication Coordination
The system SHALL coordinate customer communications including health check-ins, feature announcements, and proactive outreach.

#### Scenario: Trigger proactive customer check-in
- **GIVEN** a customer with Yellow health score AND no recent contact in 30 days
- **WHEN** Casey identifies the check-in opportunity
- **THEN** Casey SHALL draft a personalized check-in message addressing specific engagement concerns
- **AND** Casey SHALL provide talking points based on customer's usage patterns and recent support tickets

#### Scenario: Coordinate feature announcement
- **GIVEN** a new feature launch (from Peter/Chuck)
- **WHEN** Casey prepares customer communication
- **THEN** Casey SHALL identify which customers would benefit most (based on usage patterns, feature requests)
- **AND** Casey SHALL draft targeted announcements for different customer segments
- **AND** Casey SHALL work with Thomas to ensure supporting documentation is ready

#### Scenario: Escalate churn risk
- **GIVEN** a customer with Red health score OR cancellation signals (downgrade request, reduced usage >50%)
- **WHEN** Casey detects the churn risk
- **THEN** Casey SHALL immediately alert Peter and relevant stakeholders
- **AND** the alert SHALL include: customer name, ARR, churn risk factors, recommended retention actions, and timeline for intervention
- **AND** Casey SHALL track outcome of retention efforts

### Requirement: Customer Satisfaction Measurement
The system SHALL track and report customer satisfaction metrics including NPS and CSAT.

#### Scenario: Track NPS (Net Promoter Score)
- **GIVEN** NPS survey responses from customers
- **WHEN** Casey calculates the NPS
- **THEN** Casey SHALL categorize responses as Promoters (9-10), Passives (7-8), or Detractors (0-6)
- **AND** Casey SHALL calculate NPS = (% Promoters - % Detractors)
- **AND** Casey SHALL track NPS trends over time
- **AND** Casey SHALL investigate reasons behind Detractor responses

#### Scenario: Track CSAT (Customer Satisfaction Score)
- **GIVEN** CSAT survey responses after support interactions or feature use
- **WHEN** Casey analyzes CSAT
- **THEN** Casey SHALL calculate average satisfaction score
- **AND** Casey SHALL identify low-satisfaction patterns (specific features, workflows, or time periods)
- **AND** Casey SHALL escalate satisfaction issues to relevant agents (Peter for product, Thomas for docs, etc.)

#### Scenario: Correlate satisfaction with product usage
- **GIVEN** customer satisfaction scores and usage data
- **WHEN** Casey analyzes correlation
- **THEN** Casey SHALL identify which features or usage patterns correlate with high satisfaction
- **AND** Casey SHALL identify which features correlate with low satisfaction
- **AND** Casey SHALL provide these insights to Peter for roadmap prioritization

### Requirement: Integration with Peter (Product Management)
The system SHALL integrate seamlessly with Peter's product management workflow for customer feedback and prioritization.

#### Scenario: Escalate feature request with customer context
- **GIVEN** a feature request identified from multiple support tickets
- **WHEN** Casey escalates to Peter
- **THEN** Casey SHALL use Peter's intake process (`peter intake customer-success "<request>"`)
- **AND** Casey SHALL provide: feature description, number of requests, affected customers (names + total ARR), usage context showing need, and RICE score inputs (Reach, Impact, Confidence estimates)
- **AND** Peter SHALL acknowledge within 48 hours

#### Scenario: Provide customer health signals for prioritization
- **GIVEN** Peter is prioritizing features using RICE framework
- **WHEN** Peter requests customer impact data from Casey
- **THEN** Casey SHALL provide: affected customer count, total ARR impact, customer health distribution (how many are at-risk), and urgency level (immediate vs. planned)
- **AND** these inputs SHALL inform Peter's Impact and Reach scores

#### Scenario: Report weekly customer insights
- **GIVEN** the end of a week
- **WHEN** Casey prepares the weekly sync with Peter
- **THEN** Casey SHALL deliver: customer health summary (Green/Yellow/Red distribution), top 5 support ticket themes with impact, feature requests with customer context, churn risks requiring action, and recommended priorities for next week
- **AND** the report SHALL be delivered before weekly planning meeting

### Requirement: Integration with Ana (Analytics)
The system SHALL integrate with Ana to leverage customer analytics dashboards and contribute customer success metrics.

#### Scenario: Define customer health dashboard requirements
- **GIVEN** Casey needs customer health visibility
- **WHEN** Casey defines dashboard requirements for Ana
- **THEN** Casey SHALL specify: metrics to display (health scores, engagement, sentiment, growth), dimensions to slice by (segment, plan, tenure, ARR tier), and refresh frequency (daily for active monitoring)
- **AND** Ana SHALL implement the dashboard within 2 weeks

#### Scenario: Validate dashboard accuracy
- **GIVEN** Ana has implemented a customer health dashboard
- **WHEN** Casey validates the dashboard
- **THEN** Casey SHALL verify metrics match expected calculations
- **AND** Casey SHALL test edge cases (new customers, churned customers, data gaps)
- **AND** Casey SHALL confirm with Ana before marking complete

#### Scenario: Contribute customer metrics to team dashboard
- **GIVEN** Ana maintains a team dashboard with product and engineering metrics
- **WHEN** Casey provides customer success metrics
- **THEN** Ana SHALL include: overall NPS, customer health distribution (Green/Yellow/Red %), churn rate, and top customer issues
- **AND** these metrics SHALL be visible to all agents for shared customer context

### Requirement: Integration with Other Agents
The system SHALL integrate appropriately with Larry (telemetry), Thomas (documentation), and Tucker (bugs) to close customer feedback loops.

#### Scenario: Request usage telemetry from Larry
- **GIVEN** Casey needs customer usage data for health scoring
- **WHEN** Casey queries Larry's telemetry
- **THEN** Casey SHALL access: login frequency, feature usage by customer, session duration, and error rates by customer
- **AND** Larry's data SHALL be read-only (Casey does not modify logs)
- **AND** if needed metrics don't exist, Casey SHALL request Larry to add them

#### Scenario: Escalate documentation gap to Thomas
- **GIVEN** support tickets indicating customer confusion about a feature (e.g., 5+ "how to" tickets on same topic)
- **WHEN** Casey identifies the documentation gap
- **THEN** Casey SHALL escalate to Thomas with: feature area, specific confusion points from tickets, and suggested documentation improvements
- **AND** Thomas SHALL acknowledge and update docs within 1 week
- **AND** Casey SHALL verify with customers that docs now address the gap

#### Scenario: Escalate customer-reported bug to Tucker
- **GIVEN** a support ticket categorized as Bug Report with reproduction steps
- **WHEN** Casey escalates to Tucker
- **THEN** Casey SHALL provide: bug description, customer impact (how many affected, ARR), reproduction steps from ticket, and priority recommendation (based on customer impact)
- **AND** Tucker SHALL triage within 24 hours
- **AND** Casey SHALL track bug resolution and notify affected customers when fixed


### Requirement: Customer Success SHALL provide customer impact checklist

Customer Success SHALL provide a quality review checklist to ensure customer impact is understood and support readiness is achieved before features proceed through stage gates.

#### Scenario: Complete Customer Success quality checklist
- **GIVEN** a feature ready for customer impact review
- **WHEN** Customer Success evaluates the feature
- **THEN** all checklist items SHALL be evaluated as Yes, No, or N/A
- **AND** "No" items SHALL be documented with customer support risks
- **AND** N/A items SHALL include justification for non-applicability
- **AND** checklist SHALL be signed, dated, and attached to release notes
- **AND** checklist is non-blocking (may ship with support gaps documented)

**Customer Success Quality Checklist (v1.0)**:

1. **Customer Communication**: Customer-facing announcement drafted (release notes, blog post, email)
2. **Support Documentation**: Help center articles created or updated for new feature
3. **FAQ Prepared**: Common questions anticipated and answers documented
4. **Support Team Training**: Support team trained on new feature functionality
5. **User Onboarding**: In-app onboarding or tooltips created for feature discovery
6. **Migration Path**: Existing users have clear migration/upgrade path (if feature changes behavior)
7. **Rollback Communication**: Plan for communicating rollback to customers (if needed)
8. **Feedback Mechanism**: Way for users to provide feedback on new feature (survey, feedback form)
9. **Success Metrics Communication**: How feature success will be measured and communicated to customers
10. **Breaking Changes**: Breaking changes clearly communicated with sufficient notice
11. **Customer Segmentation**: Identified which customer segments benefit most from feature
12. **Support Ticket Tagging**: New tags/categories created for feature-related support tickets
13. **Escalation Path**: Escalation path defined for critical issues with new feature

**Approval Options**:
- [ ] Approved (customer success ready)
- [ ] Approved with Gaps (documentation/training gaps, will address quickly post-launch)
- [ ] Support Unready (significant gaps, recommend delaying launch)

**Support Readiness Gaps**:
- [ ] Documentation incomplete (Issue #: ________)
- [ ] Support team not trained (Issue #: ________)
- [ ] Customer communication not drafted (Issue #: ________)

**Notes**: _____________________________________________________________________________

**Reviewer**: Casey (Customer Success)
**Date**: _________________
**Checklist Version**: 1.0
**Signature**: _________________
