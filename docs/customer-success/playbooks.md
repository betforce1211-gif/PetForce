# Customer Success Playbooks

**Owner**: Casey (Customer Success Agent)
**Last Updated**: 2026-02-03

This guide provides tactical playbooks for common customer success scenarios.

---

## Table of Contents

1. [Onboarding Playbook](#onboarding-playbook)
2. [Churn Prevention Playbook](#churn-prevention-playbook)
3. [Upsell & Expansion Playbook](#upsell--expansion-playbook)
4. [Win-Back Playbook](#win-back-playbook)
5. [Renewal Playbook](#renewal-playbook)
6. [Executive Business Review Playbook](#executive-business-review-playbook)

---

## Onboarding Playbook

### Goal

Get new customers to first value within 7 days.

### Success Criteria

- ✅ Household created
- ✅ At least 1 pet added
- ✅ At least 3 tasks completed
- ✅ At least 1 additional household member invited
- ✅ Mobile app installed (iOS or Android)

### Timeline & Touchpoints

**Day 0 (Registration)**:

- ✅ **Automated**: Welcome email with getting started guide
- ✅ **Automated**: In-app onboarding flow (household setup wizard)
- 📊 **Track**: Registration source (organic, referral, paid)

**Day 1**:

- ✅ **Automated**: Email if household not created
  - Subject: "Let's set up your household - it takes 2 minutes!"
  - Include: Video tutorial, link to support
- ✅ **Automated**: Email if household created but no pets added
  - Subject: "Add your first pet to get started"
  - Include: Benefits of tracking pet care, screenshot

**Day 3**:

- ✅ **Automated**: Email if no tasks completed
  - Subject: "3 easy tasks to try today"
  - Include: Task templates, quick start guide
- 📞 **Manual**: Call Enterprise customers (personal onboarding)

**Day 7**:

- ✅ **Automated**: Check-in email
  - Subject: "How's your first week with PetForce?"
  - Include: NPS survey, feature tips, support link
- 📊 **Track**: 7-day activation rate (% meeting success criteria)

**Day 14**:

- ✅ **Automated**: Feature discovery email
  - Subject: "5 features you might have missed"
  - Include: Recurring tasks, reminders, QR codes, photo uploads

**Day 30**:

- ✅ **Automated**: Relationship NPS survey
- 📊 **Track**: 30-day retention rate

### Onboarding Metrics

```sql
-- Onboarding funnel analysis
WITH signups AS (
  SELECT
    household_id,
    created_at AS signup_date
  FROM analytics.dim_households
  WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
),

milestones AS (
  SELECT
    s.household_id,
    s.signup_date,

    -- Milestone 1: Pet added
    MIN(p.created_at) AS first_pet_added_at,
    EXTRACT(EPOCH FROM (MIN(p.created_at) - s.signup_date)) / 3600 AS hours_to_first_pet,

    -- Milestone 2: First task completed
    MIN(t.completed_at) AS first_task_completed_at,
    EXTRACT(EPOCH FROM (MIN(t.completed_at) - s.signup_date)) / 3600 AS hours_to_first_task,

    -- Milestone 3: Member invited
    MIN(m.joined_at) AS first_member_invited_at,
    EXTRACT(EPOCH FROM (MIN(m.joined_at) - s.signup_date)) / 3600 AS hours_to_first_invite,

    -- Milestone 4: Mobile app installed
    MIN(ma.installed_at) AS mobile_app_installed_at,
    EXTRACT(EPOCH FROM (MIN(ma.installed_at) - s.signup_date)) / 3600 AS hours_to_mobile_install

  FROM signups s
  LEFT JOIN analytics.dim_pets p ON s.household_id = p.household_id
  LEFT JOIN analytics.fct_tasks t ON s.household_id = t.household_id
  LEFT JOIN analytics.dim_household_members m ON s.household_id = m.household_id AND m.user_id != p.owner_user_id
  LEFT JOIN analytics.fct_mobile_installs ma ON s.household_id = ma.household_id
  GROUP BY s.household_id, s.signup_date
)

SELECT
  COUNT(*) AS total_signups,
  COUNT(first_pet_added_at) AS completed_pet_milestone,
  COUNT(first_task_completed_at) AS completed_task_milestone,
  COUNT(first_member_invited_at) AS completed_invite_milestone,
  COUNT(mobile_app_installed_at) AS completed_mobile_milestone,

  -- Activation rate (all 4 milestones within 7 days)
  COUNT(*) FILTER (
    WHERE first_pet_added_at <= signup_date + INTERVAL '7 days'
      AND first_task_completed_at <= signup_date + INTERVAL '7 days'
      AND first_member_invited_at <= signup_date + INTERVAL '7 days'
      AND mobile_app_installed_at <= signup_date + INTERVAL '7 days'
  ) AS fully_activated,

  ROUND(
    100.0 * COUNT(*) FILTER (
      WHERE first_pet_added_at <= signup_date + INTERVAL '7 days'
        AND first_task_completed_at <= signup_date + INTERVAL '7 days'
        AND first_member_invited_at <= signup_date + INTERVAL '7 days'
        AND mobile_app_installed_at <= signup_date + INTERVAL '7 days'
    ) / COUNT(*),
    2
  ) AS activation_rate_pct,

  -- Time to value (median)
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY hours_to_first_task) AS median_hours_to_first_task

FROM milestones;
```

---

## Churn Prevention Playbook

### High-Risk Customer (Churn Risk 70+)

**Immediate Actions (within 24 hours)**:

1. **Review Account**
   - Check health score breakdown (which dimension is failing?)
   - Review support ticket history (unresolved issues?)
   - Check payment status (failed payments?)
   - Review usage trends (sudden drop?)

2. **Personal Outreach**

   **Email Template** (from Customer Success Manager):

   ```
   Subject: Quick check-in - how can we help?

   Hi [First Name],

   I'm [CSM Name], your Customer Success Manager at PetForce. I noticed you
   haven't been as active lately, and I wanted to reach out personally to see
   if everything is okay.

   I reviewed your account and saw that [specific observation, e.g., "you
   haven't logged in for 10 days" or "you had a support ticket about XYZ"].

   Can I help with anything? I'm here to make sure PetForce is working well
   for you and your household.

   A few things I can help with:
   - Free 30-minute onboarding session to ensure you're getting the most value
   - Troubleshooting any issues you're experiencing
   - Recommendations for features that might help your specific use case

   Would you be open to a quick 15-minute call this week?

   [Book a time]: [Calendly link]

   Or just reply to this email - I read every response personally.

   Best,
   [CSM Name]
   Customer Success Manager, PetForce
   ```

3. **Escalate If Needed**
   - Enterprise customers: Escalate to VP of Customer Success
   - High LTV customers: Escalate to CEO for personal outreach

**Follow-Up (Day 3)**:

- If no response: Send second email with win-back offer
- If declined call: Offer async support (Loom video walkthrough)

**Win-Back Offer**:

- Free users: 1 month Premium trial
- Premium users (downgraded): 2 months at 50% off
- Premium users (cancelled): Pause subscription for 1 month (keep data)

### Medium-Risk Customer (Churn Risk 40-69)

**Automated Email Campaign**:

**Day 1 Email**:

```
Subject: We miss you! Here's what's new at PetForce

Hi [First Name],

We noticed you haven't logged in to PetForce in a while. We've been making
some exciting improvements that you might have missed:

✨ New Features:
- [Feature 1]: [Benefit]
- [Feature 2]: [Benefit]
- [Feature 3]: [Benefit]

🎯 Quick Wins:
Here are 3 things you can do today to get back on track:
1. [Action 1] - takes 2 minutes
2. [Action 2] - takes 5 minutes
3. [Action 3] - takes 10 minutes

Need help? Our support team is standing by.

[Chat with support] | [Browse help docs]

Best,
The PetForce Team
```

**Day 3 Email**:

```
Subject: Are you stuck? Let us help

Hi [First Name],

I wanted to follow up on my last email. If you're not using PetForce because
you're facing a challenge, we're here to help!

Common issues we've solved:
- "I don't know where to start" → [Getting started guide]
- "It's too complicated" → [Quick video tutorial]
- "I can't get my family to use it" → [Tips for household adoption]

Which of these sounds familiar? Reply and let me know how I can help.

Or, book a free 15-minute support session:
[Book a session]

We're on your side,
[CSM Name]
```

**Day 7 Email**:

```
Subject: Before you go... can we fix this?

Hi [First Name],

I know we've been reaching out, and I don't want to spam you. But before you
decide PetForce isn't for you, I'd love to understand what we could have done
better.

Would you take 2 minutes to tell us why you stopped using PetForce?

[Take 2-minute survey]

Your feedback will directly influence our product roadmap, and we genuinely
appreciate your honesty.

If there's anything we can do to win you back, please let me know.

Thank you for giving PetForce a try,
[CSM Name]
```

### Low-Risk Customer (Churn Risk 20-39)

**Nurture Campaign** (monthly cadence):

- Educational content (tips, best practices)
- Feature announcements
- Community highlights (user stories)
- Seasonal campaigns (National Pet Day, etc.)

---

## Upsell & Expansion Playbook

### Free → Premium Conversion

**Trigger Conditions**:

1. **Usage Threshold** - 50+ tasks completed in 30 days
2. **Feature Request** - User tries Premium feature (hits paywall)
3. **Multi-Pet** - Household has 3+ pets
4. **Multi-Member** - Household has 3+ members
5. **Power User** - Daily active user for 30+ days

**Upsell Email Template**:

```
Subject: You're a PetForce power user! Here's 20% off Premium

Hi [First Name],

Wow! You've completed [X] tasks this month. You're clearly getting a lot of
value from PetForce, and we love seeing households like yours thrive.

Based on your usage, I think you'd really benefit from Premium features:

✨ Premium Features Made for You:
- Recurring Tasks: Set it and forget it (no more manually creating daily tasks)
- Advanced Reminders: Never miss a vet appointment or medication
- Photo Uploads: Document your pet's life with unlimited photos
- Calendar Sync: Integrate with Google Calendar / Apple Calendar
- Priority Support: Get help from our team within 2 hours

For households like yours, Premium typically saves 2-3 hours per week on pet
care coordination.

💰 Special Offer (just for you):
Try Premium for 30 days with 20% off your first 3 months.

[Claim your discount]

This offer expires in 7 days. No credit card required to start the trial.

Happy to answer any questions!

Best,
[CSM Name]
```

### Premium → Enterprise Conversion

**Trigger Conditions**:

1. **Large Household** - 5+ members
2. **High Usage** - 200+ tasks/month
3. **Feature Request** - Requests enterprise features (custom branding, API access)
4. **Business Use Case** - Pet daycare, veterinary clinic, animal shelter

**Enterprise Pitch**:

```
Subject: Is PetForce Premium limiting your household?

Hi [First Name],

I noticed your household has [X] members and you're completing [Y] tasks per
month. You're one of our most active Premium customers!

I wanted to let you know about PetForce Enterprise, which includes features
designed for large households and professional pet care providers:

🚀 Enterprise Features:
- Unlimited household members (Premium is capped at 10)
- Custom task templates and workflows
- Advanced analytics and reporting
- Dedicated account manager
- Priority phone support (< 1 hour response time)
- API access for integrations
- White-label branding (for businesses)

Would you be interested in a demo? I'd love to show you how other large
households are using Enterprise to streamline their pet care.

[Book a 30-minute demo]

Best,
[CSM Name]
Enterprise Sales, PetForce
```

---

## Win-Back Playbook

### Recently Churned (< 30 days)

**Immediate Win-Back Campaign**:

**Day 1 (Cancellation)**:

```
Subject: We're sorry to see you go

Hi [First Name],

We noticed you cancelled your PetForce subscription. We're sorry to see you go!

Before you leave, we'd love to understand what went wrong so we can improve:

[Take 2-minute exit survey]

And if there's anything we can do to win you back, please let us know.

Some things we can help with:
- Technical issues → Free troubleshooting session
- Cost concerns → Pause subscription (keep your data for 3 months)
- Missing features → Early access to upcoming features
- Need a break → Downgrade to Free (keep core features)

Your account will remain active until [end of billing cycle]. All your data
will be preserved for 90 days if you decide to come back.

We're here if you need us,
[CSM Name]
```

**Day 7**:

```
Subject: We made some changes based on your feedback

Hi [First Name],

Thank you for the feedback you provided in our exit survey. We've been
listening, and I wanted to update you on some changes we've made:

[Specific improvement based on their feedback]

If this addresses your concern, we'd love to have you back. Here's a special
win-back offer:

🎁 Win-Back Offer:
- 2 months free Premium
- Priority support for your first 30 days back
- Personal onboarding session to address any past frustrations

[Reactivate your account]

No hard sell here - just wanted you to know we heard you and we're working to
be better.

Best,
[CSM Name]
```

**Day 30**:

```
Subject: We miss you (and we think you might miss us too)

Hi [First Name],

It's been a month since you left PetForce. How have you been managing your
pet care without us?

We've made some great improvements recently, and I thought you might want to
know:

[List of new features since they left]

If you're considering coming back, your data is still safe (we keep it for 90
days). You can pick up right where you left off.

[Reactivate with 1 month free]

And if not, no worries - we wish you and your pets all the best.

Take care,
[CSM Name]
```

### Long-Term Churned (> 90 days)

**Quarterly Re-Engagement Campaign**:

- Focus on major feature releases
- Share user success stories
- Offer significant incentive (3 months free, major discount)

---

## Renewal Playbook

### 30 Days Before Renewal (Enterprise)

**Renewal Health Check**:

1. **Review Account Health**
   - Health score trend (last 90 days)
   - Feature adoption (are they using advanced features?)
   - Support ticket history (any unresolved issues?)
   - Usage trends (increasing or decreasing?)

2. **Proactive Outreach**

   ```
   Subject: Your PetForce renewal is coming up - let's ensure success

   Hi [Executive Sponsor],

   Your PetForce Enterprise contract renews in 30 days ([Renewal Date]). Before
   we send over the renewal paperwork, I wanted to check in on how things are
   going.

   📊 Quick Health Check:
   - Active households: [X] ([trend] since last quarter)
   - Tasks completed: [Y] ([trend] since last quarter)
   - Feature adoption: [Z]% of households using advanced features

   Based on these metrics, your team is [getting great value / underutilizing
   the platform / experiencing challenges].

   Would you be open to a 30-minute call to:
   - Review your success metrics
   - Address any outstanding concerns
   - Discuss your goals for the next 12 months
   - Explore opportunities to expand usage

   [Book renewal review call]

   Looking forward to another successful year together!

   Best,
   [CSM Name]
   ```

3. **Address Concerns Proactively**
   - If usage is down: Offer free training, feature adoption workshop
   - If support issues: Escalate to engineering, offer dedicated support
   - If budget concerns: Discuss downgrade options, payment plans

### Renewal At-Risk

**Red Flags**:

- Executive sponsor has changed (new person, unclear commitment)
- Usage down > 30% in last quarter
- Multiple unresolved critical issues
- Budget cuts announced
- Competitor mentioned in support tickets
- Contract discussions delayed/avoided

**At-Risk Renewal Strategy**:

1. **Executive Escalation**
   - Loop in VP of Customer Success or CEO
   - Request executive-to-executive conversation

2. **Value Reinforcement**
   - ROI analysis (time saved, efficiency gained)
   - Case study showing their success
   - Testimonial from their team

3. **Creative Solutions**
   - Multi-year discount (lock in lower rate)
   - Pilot new features (exclusive early access)
   - Flexible payment terms
   - Downgrade to lower tier (retain revenue)

---

## Executive Business Review Playbook

### Quarterly Business Review (QBR) for Enterprise

**Agenda**:

1. **Welcome & Agenda** (5 min)
2. **Success Metrics Review** (15 min)
3. **Wins & Challenges** (10 min)
4. **Roadmap Preview** (10 min)
5. **Strategic Planning** (15 min)
6. **Action Items & Next Steps** (5 min)

**QBR Deck Template**:

**Slide 1: Welcome**

```
[PetForce Logo]

Quarterly Business Review
[Customer Name]

[Date]
[CSM Name], Customer Success Manager
```

**Slide 2: Agenda**

```
Today's Agenda

1. Success Metrics Review
2. Wins & Challenges
3. Product Roadmap Preview
4. Strategic Planning for Q2
5. Action Items & Next Steps
```

**Slide 3: Success Metrics**

```
Your Success at a Glance

Active Households: [X] (+[Y]% QoQ)
Tasks Completed: [Z] (+[W]% QoQ)
Daily Active Users: [DAU]% (+[trend]%)

Feature Adoption:
✅ Recurring Tasks: [X]% of households
✅ Reminders: [Y]% of households
✅ Mobile App: [Z]% of users

Health Score: [Overall Score] ([Healthy/At-Risk/Critical])
```

**Slide 4: Wins This Quarter**

```
Celebrating Your Wins

✨ Milestone 1: [Specific achievement]
   → Impact: [Quantified benefit]

✨ Milestone 2: [Specific achievement]
   → Impact: [Quantified benefit]

✨ Milestone 3: [Specific achievement]
   → Impact: [Quantified benefit]

[Customer quote/testimonial if available]
```

**Slide 5: Challenges & Solutions**

```
Challenges We're Addressing Together

Challenge 1: [Specific issue]
└─ Action: [What we're doing to fix it]
└─ Timeline: [When it will be resolved]

Challenge 2: [Specific issue]
└─ Action: [What we're doing to fix it]
└─ Timeline: [When it will be resolved]
```

**Slide 6: Product Roadmap**

```
Coming Soon to PetForce

Q2 2026:
- [Feature 1]: [Description] - [Launch date]
- [Feature 2]: [Description] - [Launch date]

Q3 2026:
- [Feature 3]: [Description] - [Launch date]
- [Feature 4]: [Description] - [Launch date]

[Highlight features requested by this customer]
```

**Slide 7: Strategic Planning**

```
Your Goals for Next Quarter

Goal 1: [Customer's stated objective]
└─ How PetForce can help: [Our recommendation]

Goal 2: [Customer's stated objective]
└─ How PetForce can help: [Our recommendation]

Goal 3: [Customer's stated objective]
└─ How PetForce can help: [Our recommendation]
```

**Slide 8: Action Items**

```
Action Items & Next Steps

PetForce Commitments:
[ ] [Action 1] - Owner: [Name] - Due: [Date]
[ ] [Action 2] - Owner: [Name] - Due: [Date]

Customer Commitments:
[ ] [Action 1] - Owner: [Name] - Due: [Date]
[ ] [Action 2] - Owner: [Name] - Due: [Date]

Next QBR: [Date, 3 months out]
```

---

**Related Documentation**:

- [Customer Success Guide](./README.md)
- [Analytics Event Taxonomy](../analytics/event-taxonomy.md)
- [Analytics Dashboards](../analytics/dashboards.md)
