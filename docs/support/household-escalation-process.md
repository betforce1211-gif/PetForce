# Household Management Escalation Process

**Last Updated**: 2026-02-02
**For**: Customer Success Team

This document defines when and how to escalate household management issues to specialized teams.

---

## Escalation Overview

Not all household issues can be resolved by Customer Success. Some require:
- **Engineering expertise** (technical/data issues)
- **Trust & Safety review** (abuse/security concerns)
- **Product Management input** (feature gaps/policy decisions)
- **Legal review** (compliance/liability concerns)

This guide helps you identify when to escalate and to whom.

---

## Escalation Matrix

| Issue Type | Severity | Escalate To | Response Time | Resolution Time |
|-----------|----------|-------------|---------------|-----------------|
| Data integrity (multiple leaders, orphaned households) | P0 | Engineering | 1 hour | 4-8 hours |
| Security vulnerability | P0 | Engineering + Security | 30 min | Immediate |
| Abuse/harassment reports | P1 | Trust & Safety | 2 hours | 24-48 hours |
| Leader vs. member disputes | P2 | Customer Success Manager | 4 hours | 3-5 days |
| Feature requests with urgency | P2 | Product Management | 1-2 days | Varies |
| Rate limit issues (legitimate high-volume) | P2 | Engineering | 4 hours | 1-2 days |
| Capacity increase requests | P3 | Customer Success Manager | 2 days | 3-5 days |

---

## Engineering Escalations

### When to Escalate

Escalate to Engineering when you encounter:

#### P0 (Critical) - Escalate Immediately
- **Data integrity issues**
  - Multiple leaders in one household
  - No leader in household with active members
  - Orphaned households (no associated members)
  - Leadership transfer failures
  - Duplicate member entries

- **Security vulnerabilities**
  - XSS or injection attempts succeeding
  - Session invalidation not working
  - Unauthorized access to household data
  - Rate limiting bypass

- **System failures**
  - Invite code generation failures
  - Database connection errors
  - API timeouts (>30 seconds)
  - Household creation failures (>5% error rate)

#### P1 (High) - Escalate Within 4 Hours
- **Feature malfunctions**
  - Member removal not updating status
  - Join request approval not adding member
  - Invite code regeneration not invalidating old codes

- **Performance issues**
  - Household dashboard loading >10 seconds
  - Member list not loading for households >10 members
  - Repeated timeout errors

#### P2 (Medium) - Escalate Within 1 Day
- **Edge cases**
  - Rate limit cache inconsistencies
  - Invite code uniqueness collisions
  - Concurrent operation conflicts

- **Enhancement requests**
  - Legitimate need for custom rate limits
  - Performance optimization requests
  - Database indexing improvements

### How to Escalate to Engineering

1. **Create a support ticket** with tag `[ENG-ESCALATION]`
2. **Include required information**:
   - **User ID(s)**: Affected user account IDs
   - **Household ID(s)**: Affected household(s)
   - **Timestamp**: When the issue occurred (with timezone)
   - **Error messages**: Exact error text or codes
   - **Steps to reproduce**: What the user did before the issue
   - **Expected behavior**: What should have happened
   - **Actual behavior**: What actually happened
   - **Impact**: How many users affected
   - **Screenshots**: If available (with PII redacted)

3. **Notify on Slack**:
   - **P0 issues**: Tag `@engineering-oncall` in `#incidents`
   - **P1 issues**: Post in `#engineering-support` with ticket link
   - **P2 issues**: Post in `#engineering-support` (no tag needed)

4. **Set expectations with customer**:
   - P0: "This is a critical issue. Our engineering team is investigating and you'll hear from us within 1-2 hours."
   - P1: "We've escalated this to our engineering team. Expect an update within 4-8 hours."
   - P2: "We've filed a technical report. We'll update you within 24 hours with our findings."

### Engineering Response SLAs

| Priority | Acknowledgment | Investigation | Resolution | Communication |
|----------|---------------|---------------|------------|---------------|
| P0 | 30 min | 1 hour | 4-8 hours | Hourly updates |
| P1 | 2 hours | 4 hours | 1-3 days | Daily updates |
| P2 | 4 hours | 1 day | 1-2 weeks | Weekly updates |

---

## Trust & Safety Escalations

### When to Escalate

Escalate to Trust & Safety when you encounter:

#### Immediate Escalation (Within 1 Hour)
- **Active abuse/harassment**
  - Household leader removing members as punishment or retaliation
  - Coordinated harassment through household features
  - Threats of violence in household communications
  - Child safety concerns

- **Account compromise**
  - Unauthorized leadership transfers
  - Suspicious household access patterns
  - Multiple failed login attempts followed by household changes

#### Same-Day Escalation (Within 4 Hours)
- **Suspected abuse patterns**
  - User creating >10 households per day (multiple days)
  - Excessive member removals (>20 per day, multiple days)
  - Invite code sharing/selling for profit
  - Bot-like behavior (automated household actions)

- **Policy violations**
  - Commercial use of household features (not intended use case)
  - Fake households or spam
  - Harassment reports between household members

#### Next-Day Escalation (Within 24 Hours)
- **Suspected terms of service violations**
  - Using household features for non-pet-care purposes
  - Creating households for competing services
  - Scraping or data harvesting

### How to Escalate to Trust & Safety

1. **Create a support ticket** with tag `[T&S-ESCALATION]`
2. **Include required information**:
   - **User ID(s)**: All involved users
   - **Household ID(s)**: Affected household(s)
   - **Pattern description**: What abuse pattern you observed
   - **Evidence**: Screenshots, logs, timestamps
   - **Severity assessment**: Immediate/Same-day/Next-day
   - **Reporter**: Who reported this (if from user report)
   - **Action taken**: What you've done so far (if any)

3. **Notify on Slack**:
   - **Immediate**: Tag `@trust-safety-oncall` in `#trust-safety`
   - **Same-day**: Post in `#trust-safety` with ticket link
   - **Next-day**: Post in `#trust-safety` (no urgent tag)

4. **Set expectations with customer**:
   - "We take abuse reports seriously. Our Trust & Safety team will review this within [timeframe]."
   - "For security reasons, I cannot share details about account actions, but we will investigate thoroughly."
   - "You may be contacted by our Trust & Safety team for additional information."

### Trust & Safety Response SLAs

| Priority | Acknowledgment | Investigation | Action | Communication |
|----------|---------------|---------------|--------|---------------|
| Immediate | 1 hour | 2-4 hours | 24 hours | Daily updates |
| Same-day | 4 hours | 1 day | 2-3 days | Every 2 days |
| Next-day | 24 hours | 2-3 days | 5-7 days | Weekly updates |

### Trust & Safety Actions

Possible actions Trust & Safety may take:
- **Account warning**: Email warning to user
- **Feature restriction**: Disable household features temporarily
- **Account suspension**: Temporary ban (3-30 days)
- **Account termination**: Permanent ban for severe violations
- **No action**: If investigation finds no policy violation

---

## Customer Success Manager Escalations

### When to Escalate

Escalate to CSM when you encounter:

#### Immediate CSM Review (Within 4 Hours)
- **Leader vs. member disputes**
  - Interpersonal conflicts affecting household use
  - Disagreements about household management
  - Custody or family disputes involving pet care

- **VIP customers**
  - Premium account holders with household issues
  - High-value customers (>$100/month revenue)
  - Influencers or press inquiries

#### Next-Day CSM Review (Within 24 Hours)
- **Capacity increase requests**
  - Households requesting >15 members
  - Business use cases (kennels, rescues, foster homes)
  - Multi-generational families with special needs

- **Policy questions**
  - Unclear situations not covered in documentation
  - Requests for policy exceptions
  - Complex edge cases

- **Feature gap reports**
  - User blocked by missing feature (workaround needed)
  - Competitive feature parity issues
  - Urgent feature requests with business justification

### How to Escalate to CSM

1. **Create a support ticket** with tag `[CSM-ESCALATION]`
2. **Include required information**:
   - **Customer value**: Account tier, revenue, tenure
   - **Issue summary**: Brief description of the situation
   - **Customer impact**: How this affects their use of PetForce
   - **Requested outcome**: What the customer wants
   - **Your recommendation**: What you think should happen
   - **Urgency justification**: Why this needs CSM attention

3. **Notify on Slack**:
   - **Immediate**: Tag `@csm-team` in `#customer-success`
   - **Next-day**: Post in `#customer-success` (no tag needed)

4. **Set expectations with customer**:
   - "I'm bringing this to our Customer Success Manager for review. They'll reach out within [timeframe]."
   - "Your situation requires a policy decision. Our team will review and get back to you."

### CSM Response SLAs

| Priority | Acknowledgment | Review | Decision | Communication |
|----------|---------------|--------|----------|---------------|
| Immediate | 4 hours | 1 day | 2-3 days | Daily updates |
| Next-day | 24 hours | 2-3 days | 5-7 days | Every 2-3 days |

---

## Product Management Escalations

### When to Escalate

Escalate to Product Management when you encounter:

- **Feature gap patterns** (multiple users requesting same feature)
- **Urgent feature requests** with strong business justification
- **Usability issues** affecting multiple users
- **Competitive intelligence** (users switching due to missing features)
- **Product feedback** with actionable insights

### How to Escalate to Product Management

1. **Create a product feedback ticket** with tag `[PM-FEEDBACK]`
2. **Include**:
   - **Feature request**: What users are asking for
   - **Use case**: Why they need it
   - **Frequency**: How many users have requested this
   - **Workaround**: Current alternative (if any)
   - **Competitive comparison**: Do competitors have this?
   - **Revenue impact**: Is this blocking sales or causing churn?

3. **Post in Slack**: `#product-feedback`

**Note**: Product escalations are not urgent. Typical review time is 1-2 weeks. PM will prioritize based on user impact and strategic fit.

---

## Legal Escalations

### When to Escalate

Escalate to Legal when you encounter:

- **Custody disputes** involving pet ownership or access
- **Restraining orders** or court orders related to household access
- **Data deletion requests** (GDPR, CCPA, right to be forgotten)
- **Subpoenas** or legal requests for household data
- **Terms of Service disputes** with legal implications

### How to Escalate to Legal

1. **Email**: legal@petforce.com with `[URGENT LEGAL MATTER]` in subject
2. **Include**:
   - **Type of legal issue**
   - **Parties involved**
   - **Relevant documents** (court orders, etc.)
   - **Immediate action needed** (if any)

3. **CC**: Your manager and legal@petforce.com

**Do not** discuss legal matters on Slack or in public channels.

---

## Escalation Best Practices

### Do's
- ✅ Escalate early if you're unsure - better safe than sorry
- ✅ Gather all relevant information before escalating
- ✅ Set clear expectations with customers about response times
- ✅ Follow up on escalations to ensure resolution
- ✅ Document the outcome in the support ticket
- ✅ Update the customer once the escalation is resolved

### Don'ts
- ❌ Escalate without attempting basic troubleshooting first
- ❌ Over-promise resolution times you can't control
- ❌ Share sensitive escalation details with customers
- ❌ Escalate the same issue to multiple teams simultaneously (unless instructed)
- ❌ Bypass the escalation process for non-urgent issues

---

## Post-Escalation

After an issue is escalated:

1. **Monitor the ticket** for updates from the escalated team
2. **Communicate with customer** as new information becomes available
3. **Follow up** if you don't receive an acknowledgment within the SLA time
4. **Close the loop** by updating the customer on the final resolution
5. **Document learnings** for future similar cases

---

## Escalation Templates

### Engineering Escalation Template

```
[ENG-ESCALATION] Household Leadership Transfer Failure

User ID: user_12345
Household ID: household_67890
Timestamp: 2026-02-02 14:35:00 UTC
Severity: P0

Issue: User left household but leadership did not transfer. Household now has no leader.

Steps to Reproduce:
1. User was household leader
2. User clicked "Leave Household"
3. Did not designate successor
4. System should have auto-promoted longest-standing member
5. Leadership transfer did not occur

Expected: Longest-standing member becomes leader
Actual: Household has no leader (leader_id is null)

Impact: 4 members cannot manage household settings

Error Messages: None (operation completed successfully)

Screenshots: Attached (household member list showing no leader badge)

Requesting: Emergency fix to assign leader and investigation into why auto-promotion failed
```

### Trust & Safety Escalation Template

```
[T&S-ESCALATION] Suspected Household Abuse Pattern

User ID: user_98765
Household ID: household_11111
Severity: Same-day

Pattern: User has created 15 households in 3 days, removed 45 members total

Evidence:
- 2026-02-02: Created 5 households, removed 20 members
- 2026-02-01: Created 5 households, removed 15 members
- 2026-01-31: Created 5 households, removed 10 members

Suspected Violation: Automated abuse or testing/gaming the system

Reporter: Internal monitoring alert

Action Taken: None yet (awaiting T&S review)

Requesting: Account review and potential restriction of household features
```

---

## Contact Information

- **Engineering Oncall**: Slack `@engineering-oncall` or eng-oncall@petforce.com
- **Trust & Safety**: trust-safety@petforce.com or Slack `#trust-safety`
- **Customer Success Manager**: Your assigned CSM or csm-team@petforce.com
- **Product Management**: product@petforce.com or Slack `#product-feedback`
- **Legal**: legal@petforce.com (email only, no Slack)

---

## Revision History

| Date | Change | Author |
|------|--------|--------|
| 2026-02-02 | Initial version | Customer Success Team |
