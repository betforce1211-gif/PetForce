# Capability: Analytics

## ADDED Requirements

### Requirement: Customer Health Dashboard
The system SHALL provide dashboards for monitoring customer health, engagement, and satisfaction metrics to support customer success operations.

#### Scenario: Display customer health score distribution
- **GIVEN** Casey has calculated health scores for all customers
- **WHEN** Ana creates the customer health dashboard
- **THEN** the dashboard SHALL display: total customer count, Green (healthy) count and percentage, Yellow (at-risk) count and percentage, Red (critical) count and percentage, and trend over time (week-over-week, month-over-month)
- **AND** the dashboard SHALL allow filtering by customer segment, plan tier, and ARR band

#### Scenario: Show customer engagement metrics
- **GIVEN** customer usage data from Larry's telemetry
- **WHEN** Ana displays engagement metrics
- **THEN** the dashboard SHALL show: login frequency distribution, feature adoption rate (% of customers using each feature), session duration average and distribution, and engagement trend over time
- **AND** metrics SHALL be aggregated at customer level (not user level) for B2B

#### Scenario: Visualize customer satisfaction trends
- **GIVEN** NPS and CSAT data collected over time
- **WHEN** Ana creates satisfaction visualizations
- **THEN** the dashboard SHALL display: NPS score over time with Promoter/Passive/Detractor breakdown, CSAT average over time, satisfaction by customer segment, and correlation between satisfaction and health scores
- **AND** visualizations SHALL use appropriate chart types (line charts for trends, donut charts for distribution)

### Requirement: Customer Success Metrics in Team Dashboard
The system SHALL integrate customer success metrics into the unified team dashboard for cross-functional visibility.

#### Scenario: Add customer health to team dashboard
- **GIVEN** Ana maintains a team dashboard with product and engineering metrics
- **WHEN** Ana adds customer success metrics
- **THEN** the team dashboard SHALL include: overall customer health distribution (Green/Yellow/Red %), NPS score (current and trend), active churn risk count (Red customers), top 3 customer issues from Casey, and week-over-week changes
- **AND** these metrics SHALL be visible to all agents for shared customer context
- **AND** the dashboard SHALL update daily

#### Scenario: Correlate product metrics with customer health
- **GIVEN** product metrics (feature adoption, usage) and customer health scores
- **WHEN** Ana analyzes correlation
- **THEN** the dashboard SHALL show: which features correlate with high customer health, which features correlate with low customer health, impact of new feature launches on customer health, and adoption rate vs health score correlation
- **AND** these insights SHALL inform product decisions

#### Scenario: Track customer success KPIs
- **GIVEN** customer success data over time
- **WHEN** Ana tracks KPIs
- **THEN** the dashboard SHALL monitor: churn rate (monthly), customer health score (average), NPS (current), support ticket volume (total and per customer), feature adoption rate (% customers using core features), and time-to-value (days from signup to activation)
- **AND** each KPI SHALL have a target/threshold and status (on-target, at-risk, critical)

### Requirement: Customer Cohort Analysis
The system SHALL support cohort analysis to understand customer behavior patterns over time and inform retention strategies.

#### Scenario: Analyze customer retention by cohort
- **GIVEN** customers grouped by signup month
- **WHEN** Ana creates retention cohort analysis
- **THEN** the visualization SHALL show retention rate by month for each cohort
- **AND** the analysis SHALL identify: best-performing cohorts (highest retention), worst-performing cohorts (lowest retention), and patterns correlating with retention (features used, onboarding completion, plan type)
- **AND** insights SHALL be shared with Casey for action

#### Scenario: Compare feature adoption across cohorts
- **GIVEN** multiple customer cohorts and feature usage data
- **WHEN** Ana analyzes feature adoption by cohort
- **THEN** the analysis SHALL show: adoption rate for each feature by cohort, time-to-adoption for each feature, and cohorts with low adoption of key features
- **AND** Casey SHALL use this to target feature education and onboarding improvements

#### Scenario: Identify expansion patterns
- **GIVEN** customers who expanded usage (added seats, upgraded plans, adopted more features)
- **WHEN** Ana analyzes expansion patterns
- **THEN** the analysis SHALL identify: common expansion triggers (features used before expansion), customer profile characteristics (size, industry, tenure), and average time-to-expansion by cohort
- **AND** Casey SHALL use these patterns to identify expansion opportunities in current customers
