# Customer Success Guide

**Owner**: Casey (Customer Success Agent)
**Last Updated**: 2026-02-03

This guide provides comprehensive customer success practices for PetForce. Casey ensures our customers are healthy, engaged, and successful with our product.

---

## Table of Contents

1. [Customer Success Philosophy](#customer-success-philosophy)
2. [Customer Health Scoring](#customer-health-scoring)
3. [Support Ticket Analysis](#support-ticket-analysis)
4. [Churn Prevention](#churn-prevention)
5. [Feature Adoption](#feature-adoption)
6. [Customer Insights](#customer-insights)
7. [Escalation Procedures](#escalation-procedures)
8. [Customer Success Metrics](#customer-success-metrics)
9. [Customer Success Checklist](#customer-success-checklist)

---

## Customer Success Philosophy

### Core Principles

1. **Proactive, Not Reactive** - Identify and solve problems before customers complain
2. **Data-Driven Decisions** - Use metrics to identify at-risk customers
3. **Customer Lifecycle Focus** - Different strategies for onboarding, growth, retention
4. **Cross-Functional Collaboration** - Work with Product, Engineering, Sales
5. **Measure What Matters** - Focus on health scores, NPS, retention, expansion
6. **Automation + Human Touch** - Automate monitoring, personalize outreach
7. **Customer Obsession** - Every decision through the lens of customer success

### The Customer Success Flywheel

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   ┌───────────────┐                                    │
│   │  Onboarding   │ → Happy customers                  │
│   │  Excellence   │                                     │
│   └───────────────┘                                     │
│          │                                              │
│          ▼                                              │
│   ┌───────────────┐                                    │
│   │    Product    │ → Product improvements             │
│   │    Adoption   │                                     │
│   └───────────────┘                                     │
│          │                                              │
│          ▼                                              │
│   ┌───────────────┐                                    │
│   │  Expansion &  │ → More revenue                     │
│   │   Upsells     │                                     │
│   └───────────────┘                                     │
│          │                                              │
│          ▼                                              │
│   ┌───────────────┐                                    │
│   │   Advocacy &  │ → Referrals & testimonials         │
│   │   Referrals   │                                     │
│   └───────────────┘                                     │
│          │                                              │
│          └──────────────────────────────────────────────┘
│                    (Feeds back to Onboarding)
└─────────────────────────────────────────────────────────┘
```

---

## Customer Health Scoring

### The PetForce Health Score Model

**Health Score = Weighted average of 5 dimensions (0-100 scale)**:

1. **Product Usage** (40% weight) - Are they using the product?
2. **Feature Adoption** (20% weight) - Are they using advanced features?
3. **Support Health** (15% weight) - Are they having issues?
4. **Engagement** (15% weight) - Are they logging in regularly?
5. **Payment Health** (10% weight) - Are they paying on time?

### Product Usage Scoring

**Criteria**:

- Daily active users (DAU) as % of total household members
- Tasks completed per week
- Pets managed actively
- App opens per week

**Scoring Logic**:

```typescript
// src/analytics/health-score/product-usage.ts
interface UsageMetrics {
  totalMembers: number;
  dailyActiveUsers: number;
  tasksCompletedWeekly: number;
  petsManaged: number;
  appOpensWeekly: number;
}

function calculateProductUsageScore(metrics: UsageMetrics): number {
  // DAU ratio (50 points max)
  const dauRatio = metrics.dailyActiveUsers / metrics.totalMembers;
  const dauScore = Math.min(dauRatio * 100, 50);

  // Task completion (30 points max)
  // Healthy households complete 7-14 tasks/week
  const taskScore = Math.min((metrics.tasksCompletedWeekly / 14) * 30, 30);

  // Pets managed (10 points max)
  // At least 1 pet actively managed
  const petScore = metrics.petsManaged >= 1 ? 10 : 0;

  // App opens (10 points max)
  // Healthy usage: 14+ opens/week (2/day)
  const openScore = Math.min((metrics.appOpensWeekly / 14) * 10, 10);

  return dauScore + taskScore + petScore + openScore;
}

// Example usage
const score = calculateProductUsageScore({
  totalMembers: 4,
  dailyActiveUsers: 3, // 75% DAU
  tasksCompletedWeekly: 12,
  petsManaged: 2,
  appOpensWeekly: 20,
});
// Result: 37.5 + 25.7 + 10 + 10 = 83.2/100 (Healthy)
```

### Feature Adoption Scoring

**Criteria**:

- Premium features used (if applicable)
- Advanced features (recurring tasks, reminders, photo uploads)
- Integrations enabled (calendar sync, notifications)

**Scoring Logic**:

```typescript
interface FeatureAdoptionMetrics {
  isPremium: boolean;
  recurringTasksEnabled: boolean;
  remindersEnabled: boolean;
  photosUploaded: number;
  calendarSyncEnabled: boolean;
  notificationsEnabled: boolean;
}

function calculateFeatureAdoptionScore(
  metrics: FeatureAdoptionMetrics,
): number {
  let score = 0;

  // Premium plan (30 points)
  if (metrics.isPremium) {
    score += 30;
  }

  // Recurring tasks (25 points)
  if (metrics.recurringTasksEnabled) {
    score += 25;
  }

  // Reminders (20 points)
  if (metrics.remindersEnabled) {
    score += 20;
  }

  // Photo uploads (15 points)
  if (metrics.photosUploaded >= 5) {
    score += 15;
  } else if (metrics.photosUploaded >= 1) {
    score += 10;
  }

  // Calendar sync (5 points)
  if (metrics.calendarSyncEnabled) {
    score += 5;
  }

  // Notifications (5 points)
  if (metrics.notificationsEnabled) {
    score += 5;
  }

  return Math.min(score, 100);
}
```

### Support Health Scoring

**Criteria**:

- Number of support tickets in last 30 days
- Critical/blocker tickets
- Ticket resolution time
- Customer satisfaction (CSAT) ratings

**Scoring Logic**:

```typescript
interface SupportMetrics {
  ticketsLast30Days: number;
  criticalTickets: number;
  avgResolutionHours: number;
  csatScore: number; // 1-5 scale
}

function calculateSupportHealthScore(metrics: SupportMetrics): number {
  let score = 100;

  // Deduct points for tickets
  score -= Math.min(metrics.ticketsLast30Days * 10, 40); // Max -40

  // Deduct points for critical tickets
  score -= Math.min(metrics.criticalTickets * 20, 30); // Max -30

  // Deduct points for slow resolution
  if (metrics.avgResolutionHours > 48) {
    score -= 15;
  } else if (metrics.avgResolutionHours > 24) {
    score -= 10;
  }

  // Boost for high CSAT
  if (metrics.csatScore >= 4.5) {
    score += 15;
  } else if (metrics.csatScore >= 4.0) {
    score += 10;
  }

  return Math.max(Math.min(score, 100), 0);
}
```

### Engagement Scoring

**Criteria**:

- Login frequency (last 7/30/90 days)
- Time spent in app
- Features explored
- Community participation (if applicable)

**Scoring Logic**:

```typescript
interface EngagementMetrics {
  loginsLast7Days: number;
  loginsLast30Days: number;
  avgSessionMinutes: number;
  featuresUsedCount: number;
}

function calculateEngagementScore(metrics: EngagementMetrics): number {
  let score = 0;

  // Recent logins (40 points)
  if (metrics.loginsLast7Days >= 5) {
    score += 40;
  } else if (metrics.loginsLast7Days >= 3) {
    score += 30;
  } else if (metrics.loginsLast7Days >= 1) {
    score += 20;
  }

  // Monthly logins (30 points)
  if (metrics.loginsLast30Days >= 20) {
    score += 30;
  } else if (metrics.loginsLast30Days >= 10) {
    score += 20;
  } else if (metrics.loginsLast30Days >= 5) {
    score += 10;
  }

  // Session duration (20 points)
  if (metrics.avgSessionMinutes >= 10) {
    score += 20;
  } else if (metrics.avgSessionMinutes >= 5) {
    score += 15;
  } else if (metrics.avgSessionMinutes >= 2) {
    score += 10;
  }

  // Feature exploration (10 points)
  if (metrics.featuresUsedCount >= 10) {
    score += 10;
  } else if (metrics.featuresUsedCount >= 5) {
    score += 5;
  }

  return score;
}
```

### Payment Health Scoring

**Criteria**:

- Payment status (current, overdue, failed)
- Payment history
- Plan type (Free, Premium, Enterprise)

**Scoring Logic**:

```typescript
interface PaymentMetrics {
  status: "current" | "overdue" | "failed" | "cancelled";
  failedPaymentsLast3Months: number;
  planType: "Free" | "Premium" | "Enterprise";
  daysSinceLastPayment: number;
}

function calculatePaymentHealthScore(metrics: PaymentMetrics): number {
  // Free users get neutral score
  if (metrics.planType === "Free") {
    return 70;
  }

  let score = 100;

  // Payment status
  if (metrics.status === "current") {
    score = 100;
  } else if (metrics.status === "overdue") {
    score = 50;
  } else if (metrics.status === "failed") {
    score = 30;
  } else if (metrics.status === "cancelled") {
    score = 0;
  }

  // Failed payments history
  score -= Math.min(metrics.failedPaymentsLast3Months * 15, 40);

  // Days since last payment (should be ~30 for monthly)
  if (metrics.daysSinceLastPayment > 40 && metrics.status !== "cancelled") {
    score -= 20;
  }

  return Math.max(score, 0);
}
```

### Overall Health Score Calculation

```typescript
interface HealthScoreComponents {
  productUsage: number; // 0-100
  featureAdoption: number; // 0-100
  supportHealth: number; // 0-100
  engagement: number; // 0-100
  paymentHealth: number; // 0-100
}

function calculateOverallHealthScore(
  components: HealthScoreComponents,
): number {
  const weightedScore =
    components.productUsage * 0.4 +
    components.featureAdoption * 0.2 +
    components.supportHealth * 0.15 +
    components.engagement * 0.15 +
    components.paymentHealth * 0.1;

  return Math.round(weightedScore);
}

// Health Score Segments
function getHealthSegment(score: number): string {
  if (score >= 80) return "Healthy";
  if (score >= 60) return "At Risk";
  if (score >= 40) return "Unhealthy";
  return "Critical";
}
```

### Health Score Dashboard Query

```sql
-- SQL query to calculate health scores for all households
WITH product_usage AS (
  SELECT
    household_id,
    COUNT(DISTINCT user_id) / NULLIF(MAX(member_count), 0) AS dau_ratio,
    COUNT(*) FILTER (WHERE event_type = 'task_completion') AS tasks_completed,
    COUNT(DISTINCT pet_id) AS pets_managed,
    COUNT(*) FILTER (WHERE event_type = 'app_open') AS app_opens
  FROM analytics.fct_household_activity
  WHERE activity_date >= CURRENT_DATE - INTERVAL '7 days'
  GROUP BY household_id
),

feature_adoption AS (
  SELECT
    household_id,
    plan_type = 'Premium' OR plan_type = 'Enterprise' AS is_premium,
    recurring_tasks_enabled,
    reminders_enabled,
    photos_uploaded_count,
    calendar_sync_enabled,
    notifications_enabled
  FROM analytics.dim_households
),

support_health AS (
  SELECT
    household_id,
    COUNT(*) AS tickets_last_30_days,
    COUNT(*) FILTER (WHERE severity = 'Critical') AS critical_tickets,
    AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) AS avg_resolution_hours,
    AVG(csat_score) AS avg_csat
  FROM analytics.fct_support_tickets
  WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY household_id
),

engagement AS (
  SELECT
    household_id,
    COUNT(DISTINCT DATE(login_at)) FILTER (WHERE login_at >= CURRENT_DATE - INTERVAL '7 days') AS logins_last_7_days,
    COUNT(DISTINCT DATE(login_at)) FILTER (WHERE login_at >= CURRENT_DATE - INTERVAL '30 days') AS logins_last_30_days,
    AVG(session_duration_minutes) AS avg_session_minutes,
    COUNT(DISTINCT feature_name) AS features_used_count
  FROM analytics.fct_user_sessions
  WHERE login_at >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY household_id
),

payment_health AS (
  SELECT
    household_id,
    payment_status,
    COUNT(*) FILTER (WHERE payment_failed = TRUE) AS failed_payments_last_3_months,
    plan_type,
    CURRENT_DATE - MAX(payment_date) AS days_since_last_payment
  FROM analytics.dim_subscriptions
  WHERE payment_date >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY household_id, payment_status, plan_type
)

SELECT
  h.household_id,
  h.household_name,

  -- Component scores
  ROUND(
    LEAST(
      (COALESCE(pu.dau_ratio, 0) * 100 * 0.5) +
      (LEAST(COALESCE(pu.tasks_completed, 0) / 14.0, 1) * 30) +
      (CASE WHEN COALESCE(pu.pets_managed, 0) >= 1 THEN 10 ELSE 0 END) +
      (LEAST(COALESCE(pu.app_opens, 0) / 14.0, 1) * 10),
      100
    )
  ) AS product_usage_score,

  -- Overall health score (weighted average)
  ROUND(
    (product_usage_score * 0.4) +
    (feature_adoption_score * 0.2) +
    (support_health_score * 0.15) +
    (engagement_score * 0.15) +
    (payment_health_score * 0.1)
  ) AS overall_health_score,

  -- Health segment
  CASE
    WHEN overall_health_score >= 80 THEN 'Healthy'
    WHEN overall_health_score >= 60 THEN 'At Risk'
    WHEN overall_health_score >= 40 THEN 'Unhealthy'
    ELSE 'Critical'
  END AS health_segment

FROM analytics.dim_households h
LEFT JOIN product_usage pu ON h.household_id = pu.household_id
LEFT JOIN feature_adoption fa ON h.household_id = fa.household_id
LEFT JOIN support_health sh ON h.household_id = sh.household_id
LEFT JOIN engagement e ON h.household_id = e.household_id
LEFT JOIN payment_health ph ON h.household_id = ph.household_id
WHERE h.is_active = TRUE
ORDER BY overall_health_score ASC;
```

---

## Support Ticket Analysis

### Ticket Categorization

**Category Taxonomy**:

1. **Bug** - Something is broken
2. **Feature Request** - Customer wants new functionality
3. **How-To** - Customer needs help using the product
4. **Account/Billing** - Payment, subscription, account issues
5. **Performance** - Slow, laggy, unresponsive
6. **Data Issue** - Missing or incorrect data
7. **Integration** - Calendar sync, notifications, third-party integrations
8. **Mobile** - iOS/Android specific issues

### Ticket Priority Matrix

| Urgency | Impact | Priority | Response SLA | Resolution SLA |
| ------- | ------ | -------- | ------------ | -------------- |
| High    | High   | P0       | 1 hour       | 4 hours        |
| High    | Medium | P1       | 2 hours      | 8 hours        |
| Medium  | High   | P1       | 2 hours      | 8 hours        |
| Medium  | Medium | P2       | 4 hours      | 24 hours       |
| Low     | High   | P2       | 4 hours      | 24 hours       |
| Low     | Medium | P3       | 24 hours     | 48 hours       |
| Low     | Low    | P4       | 48 hours     | 5 days         |

**Impact**: How many users are affected?

- **High** - All users, or critical functionality broken
- **Medium** - Some users, or important feature degraded
- **Low** - Single user, or minor issue

**Urgency**: How quickly does this need to be fixed?

- **High** - Blocking customer's work, revenue impact
- **Medium** - Workaround exists, can wait hours
- **Low** - Nice to have, can wait days

### Weekly Ticket Report

```sql
-- Weekly support ticket analysis
WITH ticket_stats AS (
  SELECT
    DATE_TRUNC('week', created_at) AS week_start,
    category,
    priority,
    COUNT(*) AS ticket_count,
    AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) AS avg_resolution_hours,
    COUNT(*) FILTER (WHERE resolved_at IS NULL) AS unresolved_count,
    AVG(csat_score) AS avg_csat
  FROM analytics.fct_support_tickets
  WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY DATE_TRUNC('week', created_at), category, priority
)

SELECT
  week_start,
  category,
  priority,
  ticket_count,
  ROUND(avg_resolution_hours, 1) AS avg_resolution_hours,
  unresolved_count,
  ROUND(avg_csat, 2) AS avg_csat,

  -- Trend vs previous week
  LAG(ticket_count) OVER (PARTITION BY category, priority ORDER BY week_start) AS prev_week_count,
  ticket_count - LAG(ticket_count) OVER (PARTITION BY category, priority ORDER BY week_start) AS count_change

FROM ticket_stats
ORDER BY week_start DESC, ticket_count DESC;
```

### Top Issues Report

```sql
-- Identify top issues to escalate to Product/Engineering
SELECT
  issue_title,
  COUNT(*) AS occurrence_count,
  COUNT(DISTINCT household_id) AS affected_households,
  AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) AS avg_resolution_hours,
  AVG(csat_score) AS avg_csat,
  STRING_AGG(DISTINCT ticket_id::TEXT, ', ' ORDER BY created_at DESC) AS sample_ticket_ids
FROM analytics.fct_support_tickets
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
  AND category = 'Bug'
GROUP BY issue_title
HAVING COUNT(*) >= 5  -- At least 5 occurrences
ORDER BY occurrence_count DESC
LIMIT 20;
```

---

## Churn Prevention

### Churn Risk Indicators

**Early Warning Signs** (automated detection):

1. **Decreased Usage**
   - DAU dropped > 50% in last 2 weeks
   - No logins in 7+ days
   - Tasks completed dropped > 75%

2. **Support Issues**
   - 3+ support tickets in 30 days
   - Critical ticket unresolved > 48 hours
   - CSAT score < 3.0

3. **Payment Issues**
   - Failed payment
   - Downgraded from Premium to Free
   - Cancelled subscription but still active (end of billing cycle)

4. **Engagement Drop**
   - No new pets added in 60 days
   - No new household members invited in 60 days
   - No new features adopted in 90 days

### Churn Risk Scoring

```typescript
interface ChurnRiskFactors {
  healthScore: number;
  daysInactive: number;
  supportTicketsLast30Days: number;
  criticalTicketsUnresolved: number;
  failedPayments: number;
  hasDowngraded: boolean;
  hasCancelled: boolean;
}

function calculateChurnRiskScore(factors: ChurnRiskFactors): number {
  let riskScore = 0;

  // Health score (inverse relationship)
  if (factors.healthScore < 40) {
    riskScore += 40;
  } else if (factors.healthScore < 60) {
    riskScore += 25;
  } else if (factors.healthScore < 80) {
    riskScore += 10;
  }

  // Inactivity
  if (factors.daysInactive >= 14) {
    riskScore += 30;
  } else if (factors.daysInactive >= 7) {
    riskScore += 15;
  }

  // Support issues
  riskScore += Math.min(factors.supportTicketsLast30Days * 5, 15);
  riskScore += factors.criticalTicketsUnresolved * 10;

  // Payment issues
  riskScore += factors.failedPayments * 10;

  // Cancellation signals
  if (factors.hasCancelled) {
    riskScore += 50;
  } else if (factors.hasDowngraded) {
    riskScore += 25;
  }

  return Math.min(riskScore, 100);
}

function getChurnRiskSegment(riskScore: number): string {
  if (riskScore >= 70) return "High Risk";
  if (riskScore >= 40) return "Medium Risk";
  if (riskScore >= 20) return "Low Risk";
  return "Healthy";
}
```

### Churn Prevention Playbook

**High Risk (Score 70+)** - Immediate action required:

1. **Personal Outreach** (within 24 hours)
   - Email from Customer Success Manager
   - Optional: Phone call for Enterprise customers
   - Offer: Free onboarding session, dedicated support

2. **Win-Back Offer** (if applicable)
   - 1 month free Premium (for downgrades)
   - Pause subscription (for cancellations)
   - Feature preview (early access to requested features)

3. **Executive Escalation** (if needed)
   - Enterprise customers: Escalate to VP of Customer Success
   - High-value customers: Escalate to CEO for personalized outreach

**Medium Risk (Score 40-69)** - Proactive engagement:

1. **Automated Email Campaign**
   - Day 1: "We noticed you haven't logged in recently"
   - Day 3: "Here are features you might have missed"
   - Day 7: "Can we help? Book a free support session"

2. **Feature Recommendations**
   - Based on usage patterns, suggest underutilized features
   - Send targeted in-app notifications

3. **Success Check-In**
   - Quarterly email: "How are you doing with PetForce?"
   - Include NPS survey to gather feedback

**Low Risk (Score 20-39)** - Monitor and nurture:

1. **Educational Content**
   - Weekly tips and best practices
   - Feature release announcements
   - Community highlights

2. **Engagement Campaigns**
   - Challenges (e.g., "Complete 50 tasks this month")
   - Seasonal campaigns (e.g., "National Pet Day")

---

## Feature Adoption

### Adoption Funnel Analysis

**Key Features to Track**:

1. **Core Features** (baseline usage)
   - Create household
   - Add pet
   - Complete task
   - Invite household member

2. **Advanced Features** (power user indicators)
   - Recurring tasks
   - Reminders
   - Photo uploads
   - QR code sharing

3. **Premium Features** (upsell opportunities)
   - Calendar sync
   - Advanced analytics
   - Custom task templates
   - Priority support

### Adoption Rate Calculation

```sql
-- Feature adoption rates (last 30 days)
WITH household_base AS (
  SELECT
    household_id,
    created_at
  FROM analytics.dim_households
  WHERE is_active = TRUE
    AND created_at <= CURRENT_DATE - INTERVAL '30 days'  -- At least 30 days old
),

feature_usage AS (
  SELECT
    household_id,
    feature_name,
    MIN(first_used_at) AS first_used_at,
    COUNT(*) AS usage_count
  FROM analytics.fct_feature_usage
  WHERE first_used_at >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY household_id, feature_name
)

SELECT
  fu.feature_name,
  COUNT(DISTINCT hb.household_id) AS total_eligible_households,
  COUNT(DISTINCT fu.household_id) AS households_using_feature,
  ROUND(
    100.0 * COUNT(DISTINCT fu.household_id) / COUNT(DISTINCT hb.household_id),
    2
  ) AS adoption_rate_pct,

  -- Time to adoption (for those who adopted)
  ROUND(
    AVG(EXTRACT(EPOCH FROM (fu.first_used_at - hb.created_at)) / 86400),
    1
  ) AS avg_days_to_adopt

FROM household_base hb
LEFT JOIN feature_usage fu ON hb.household_id = fu.household_id
GROUP BY fu.feature_name
ORDER BY adoption_rate_pct DESC;
```

### Feature Adoption Cohorts

```sql
-- Track feature adoption by signup cohort
WITH cohorts AS (
  SELECT
    household_id,
    DATE_TRUNC('month', created_at) AS cohort_month
  FROM analytics.dim_households
),

adoption AS (
  SELECT
    c.cohort_month,
    f.feature_name,
    COUNT(DISTINCT c.household_id) AS cohort_size,
    COUNT(DISTINCT f.household_id) AS adopters,
    ROUND(100.0 * COUNT(DISTINCT f.household_id) / COUNT(DISTINCT c.household_id), 2) AS adoption_rate
  FROM cohorts c
  LEFT JOIN analytics.fct_feature_usage f ON c.household_id = f.household_id
  WHERE c.cohort_month >= CURRENT_DATE - INTERVAL '12 months'
  GROUP BY c.cohort_month, f.feature_name
)

SELECT * FROM adoption
ORDER BY cohort_month DESC, adoption_rate DESC;
```

---

## Customer Insights

### Net Promoter Score (NPS)

**NPS Survey Trigger Points**:

- After 30 days of usage (onboarding NPS)
- After support ticket resolution (transactional NPS)
- Quarterly (relationship NPS)
- Post-upgrade (Premium feature NPS)

**NPS Calculation**:

```sql
-- Calculate NPS for last 90 days
WITH nps_responses AS (
  SELECT
    household_id,
    nps_score,  -- 0-10 scale
    CASE
      WHEN nps_score >= 9 THEN 'Promoter'
      WHEN nps_score >= 7 THEN 'Passive'
      ELSE 'Detractor'
    END AS nps_category,
    nps_comment,
    survey_date
  FROM analytics.fct_nps_surveys
  WHERE survey_date >= CURRENT_DATE - INTERVAL '90 days'
)

SELECT
  COUNT(*) AS total_responses,
  COUNT(*) FILTER (WHERE nps_category = 'Promoter') AS promoters,
  COUNT(*) FILTER (WHERE nps_category = 'Passive') AS passives,
  COUNT(*) FILTER (WHERE nps_category = 'Detractor') AS detractors,

  -- NPS = % Promoters - % Detractors
  ROUND(
    (100.0 * COUNT(*) FILTER (WHERE nps_category = 'Promoter') / COUNT(*)) -
    (100.0 * COUNT(*) FILTER (WHERE nps_category = 'Detractor') / COUNT(*),
    1
  ) AS nps_score

FROM nps_responses;
```

**NPS Feedback Analysis** (text mining):

```sql
-- Common themes in NPS comments
SELECT
  nps_category,
  REGEXP_MATCHES(LOWER(nps_comment), '(easy|simple|intuitive|helpful|love)') AS positive_keywords,
  REGEXP_MATCHES(LOWER(nps_comment), '(difficult|confusing|slow|bug|missing)') AS negative_keywords,
  COUNT(*) AS mention_count
FROM analytics.fct_nps_surveys
WHERE survey_date >= CURRENT_DATE - INTERVAL '90 days'
  AND nps_comment IS NOT NULL
GROUP BY nps_category, positive_keywords, negative_keywords
ORDER BY mention_count DESC;
```

### Customer Segmentation

**Behavioral Segments**:

1. **Champions** (Health 80+, NPS 9-10)
   - High engagement, high satisfaction
   - **Action**: Solicit testimonials, referrals, case studies

2. **Loyalists** (Health 70+, NPS 7-8)
   - Consistent users, moderately satisfied
   - **Action**: Encourage advocacy, upsell Premium features

3. **At-Risk** (Health 40-60, NPS 5-6)
   - Declining usage, lukewarm satisfaction
   - **Action**: Proactive outreach, identify pain points

4. **Detractors** (Health <40, NPS 0-4)
   - Low engagement, dissatisfied
   - **Action**: Win-back campaign, executive escalation

```sql
-- Segment households by health score and NPS
WITH health_scores AS (
  SELECT
    household_id,
    health_score,
    CASE
      WHEN health_score >= 80 THEN 'Healthy'
      WHEN health_score >= 60 THEN 'At Risk'
      ELSE 'Unhealthy'
    END AS health_segment
  FROM analytics.fct_customer_health
  WHERE score_date = CURRENT_DATE
),

latest_nps AS (
  SELECT DISTINCT ON (household_id)
    household_id,
    nps_score,
    CASE
      WHEN nps_score >= 9 THEN 'Promoter'
      WHEN nps_score >= 7 THEN 'Passive'
      ELSE 'Detractor'
    END AS nps_category
  FROM analytics.fct_nps_surveys
  ORDER BY household_id, survey_date DESC
)

SELECT
  h.household_id,
  h.household_name,
  hs.health_score,
  hs.health_segment,
  COALESCE(n.nps_category, 'Unknown') AS nps_category,

  -- Behavioral segment
  CASE
    WHEN hs.health_score >= 80 AND n.nps_category = 'Promoter' THEN 'Champion'
    WHEN hs.health_score >= 70 AND n.nps_category IN ('Promoter', 'Passive') THEN 'Loyalist'
    WHEN hs.health_score BETWEEN 40 AND 60 THEN 'At-Risk'
    WHEN hs.health_score < 40 OR n.nps_category = 'Detractor' THEN 'Detractor'
    ELSE 'Undefined'
  END AS behavioral_segment

FROM analytics.dim_households h
JOIN health_scores hs ON h.household_id = hs.household_id
LEFT JOIN latest_nps n ON h.household_id = n.household_id
WHERE h.is_active = TRUE
ORDER BY hs.health_score ASC;
```

---

## Escalation Procedures

### When to Escalate to Product (Peter)

**Trigger Conditions**:

1. **Feature Request Pattern** (5+ requests in 30 days for same feature)
2. **Bug Pattern** (10+ tickets for same bug)
3. **Competitive Loss** (customer mentions competitor has feature we lack)
4. **High-Value Customer Feedback** (Enterprise customer requests feature)

**Escalation Template** (for Peter):

```markdown
# Feature Request Escalation: [Feature Name]

**Submitted by**: Casey (Customer Success)
**Date**: 2026-02-03
**Priority**: High

## Summary

[1-2 sentence summary of the feature request]

## Customer Evidence

- **Total Requests**: 12 households in last 30 days
- **Customer Segments**:
  - 5 Enterprise customers
  - 7 Premium customers
- **Revenue at Risk**: $5,000 MRR
- **Sample Tickets**: #1234, #1256, #1289

## Customer Quotes

> "I would pay double for this feature. My previous pet app had it and I miss it."
> — Sarah, Enterprise customer

> "This is the #1 reason I'm considering switching to [Competitor]."
> — Mike, Premium customer

## Competitive Analysis

- **Competitor A**: Has this feature (see screenshot)
- **Competitor B**: Announced this feature in roadmap
- **Competitor C**: Does not have this feature

## Recommended Action

[Your recommendation: Build, Partner, or Decline]

## Expected Impact

- **Retention**: Reduce churn risk for 12 at-risk customers
- **Upsell**: Potential to upsell 20 Free customers to Premium
- **NPS**: Likely +10 point boost for Enterprise segment
```

### When to Escalate to Engineering

**Trigger Conditions**:

1. **Critical Bug** (P0 - production down, data loss)
2. **Widespread Bug** (affecting 100+ households)
3. **Performance Degradation** (p95 latency > 2x baseline)
4. **Security Issue** (potential data breach, vulnerability)

**Escalation Template** (for Engrid/Samantha):

```markdown
# Engineering Escalation: [Issue Title]

**Submitted by**: Casey (Customer Success)
**Date**: 2026-02-03
**Severity**: P1 (High)

## Issue Description

[Detailed description of the issue]

## Impact

- **Affected Households**: 150 households
- **Affected Users**: 450 users
- **Revenue Impact**: $2,000 MRR at risk
- **First Reported**: 2026-02-02 10:30 AM UTC

## Reproduction Steps

1. [Step 1]
2. [Step 2]
3. [Expected behavior vs actual behavior]

## Error Messages / Screenshots

[Paste error logs, screenshots]

## Workaround

[If available, document workaround for customers]

## Sample Tickets

- #1234 (household_id: h_abc123)
- #1256 (household_id: h_def456)
- #1289 (household_id: h_ghi789)

## Urgency Justification

[Why this needs immediate attention vs can wait]
```

---

## Customer Success Metrics

### Key Performance Indicators (KPIs)

| Metric                            | Target | Current | Trend |
| --------------------------------- | ------ | ------- | ----- |
| **Retention**                     |        |         |       |
| Monthly Retention Rate            | 95%    | 93%     | ↓     |
| Annual Retention Rate             | 85%    | 82%     | ↓     |
| Churn Rate (Monthly)              | <5%    | 7%      | ↑     |
| **Health**                        |        |         |       |
| % Customers Healthy (80+ score)   | 70%    | 65%     | ↓     |
| % Customers At-Risk (60-79 score) | 20%    | 25%     | ↑     |
| % Customers Critical (<60 score)  | <10%   | 10%     | →     |
| **Satisfaction**                  |        |         |       |
| Net Promoter Score (NPS)          | 50+    | 45      | ↓     |
| Customer Satisfaction (CSAT)      | 4.5/5  | 4.2/5   | ↓     |
| **Support**                       |        |         |       |
| Avg First Response Time           | <2h    | 1.5h    | ✓     |
| Avg Resolution Time               | <24h   | 18h     | ✓     |
| % Tickets Resolved First Contact  | 70%    | 65%     | ↓     |
| **Engagement**                    |        |         |       |
| Daily Active Users (DAU)          | 60%    | 55%     | ↓     |
| Weekly Active Users (WAU)         | 80%    | 75%     | ↓     |
| **Expansion**                     |        |         |       |
| % Free → Premium Conversion       | 15%    | 12%     | ↓     |
| Net Revenue Retention (NRR)       | 110%   | 105%    | ↓     |

### Weekly Report

```sql
-- Customer Success Weekly Report
WITH weekly_metrics AS (
  SELECT
    DATE_TRUNC('week', metric_date) AS week_start,

    -- Retention
    COUNT(DISTINCT household_id) AS total_households,
    COUNT(DISTINCT household_id) FILTER (WHERE churned_this_week = TRUE) AS churned_households,
    ROUND(100.0 * COUNT(DISTINCT household_id) FILTER (WHERE churned_this_week = TRUE) / COUNT(DISTINCT household_id), 2) AS churn_rate,

    -- Health
    ROUND(100.0 * COUNT(*) FILTER (WHERE health_score >= 80) / COUNT(*), 2) AS pct_healthy,
    ROUND(100.0 * COUNT(*) FILTER (WHERE health_score BETWEEN 60 AND 79) / COUNT(*), 2) AS pct_at_risk,
    ROUND(100.0 * COUNT(*) FILTER (WHERE health_score < 60) / COUNT(*), 2) AS pct_critical,

    -- Support
    COUNT(DISTINCT ticket_id) AS total_tickets,
    AVG(first_response_hours) AS avg_first_response_hours,
    AVG(resolution_hours) AS avg_resolution_hours,

    -- NPS
    AVG(nps_score) AS avg_nps

  FROM analytics.fct_customer_health
  WHERE metric_date >= CURRENT_DATE - INTERVAL '12 weeks'
  GROUP BY DATE_TRUNC('week', metric_date)
)

SELECT
  week_start,
  total_households,
  churned_households,
  churn_rate,
  pct_healthy,
  pct_at_risk,
  pct_critical,
  total_tickets,
  ROUND(avg_first_response_hours, 1) AS avg_first_response_hours,
  ROUND(avg_resolution_hours, 1) AS avg_resolution_hours,
  ROUND(avg_nps, 1) AS avg_nps
FROM weekly_metrics
ORDER BY week_start DESC;
```

---

## Customer Success Checklist

Casey uses this checklist for every customer interaction:

### Daily Tasks

- [ ] Review health score dashboard (identify new at-risk customers)
- [ ] Respond to high-priority support tickets (P0, P1 within SLA)
- [ ] Review churn risk report (outreach to high-risk customers)
- [ ] Check NPS responses (respond to Detractors within 24h)
- [ ] Monitor product usage trends (DAU, WAU, feature adoption)

### Weekly Tasks

- [ ] Generate weekly metrics report (share with leadership)
- [ ] Review top support issues (escalate patterns to Product/Engineering)
- [ ] Conduct 5 customer check-in calls (focus on at-risk segment)
- [ ] Update customer success playbooks (based on learnings)
- [ ] Review and update health scoring model (tune weights)

### Monthly Tasks

- [ ] Conduct NPS survey campaign (relationship NPS)
- [ ] Generate customer segmentation report (Champions, Loyalists, At-Risk, Detractors)
- [ ] Review and update churn prevention playbook
- [ ] Analyze feature adoption trends (identify underutilized features)
- [ ] Conduct quarterly business reviews (Enterprise customers)

---

## Summary

**Customer Success Excellence Requires**:

1. **Proactive Monitoring** - Identify at-risk customers before they churn
2. **Data-Driven Decisions** - Use health scores, NPS, support data
3. **Cross-Functional Collaboration** - Escalate patterns to Product/Engineering
4. **Automated + Personal Touch** - Automate monitoring, personalize outreach
5. **Measure What Matters** - Track retention, health, satisfaction, expansion
6. **Continuous Improvement** - Update playbooks based on outcomes

**Casey's Motto**:

> "Every customer deserves a champion. Use data to find who needs help, then make it personal."

---

**Related Documentation**:

- [Analytics Event Taxonomy](../analytics/event-taxonomy.md)
- [Analytics Dashboards](../analytics/dashboards.md)
- [Data Quality Guide](../../data/dbt/docs/data-quality.md)
