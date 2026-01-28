# Email Engagement Tracking Specification

**Task**: #22 (MEDIUM PRIORITY)  
**Agent**: Ana (Analytics)  
**Collaborator**: Peter (Product Management)  
**Status**: SPEC READY FOR REVIEW  
**Created**: 2026-01-25

## Executive Summary

Add UTM parameters and tracking pixels to confirmation emails to measure email delivery effectiveness. This will help us distinguish between "email not delivered" vs "user ignored email" and optimize email copy/timing.

## Problem Statement

**Current State**: We know when confirmation emails are sent, but not:
- Did the email arrive in the inbox (vs spam)?
- Did the user open the email?
- Did the user click the confirmation link?
- How long between email sent and link clicked?

**Business Impact**: 
- 30% of users drop off between registration and confirmation
- We don't know if this is an email delivery issue or UX issue
- Can't A/B test email copy without engagement metrics

**User Impact**: 
- Pet parents may think registration failed if email goes to spam
- No data to optimize the email experience

## Success Criteria

### Quantitative Metrics
- Track email open rate (industry benchmark: 20-30% for transactional emails)
- Track link click rate (industry benchmark: 15-25%)
- Track time from sent → opened → clicked
- Identify spam filter issues (sent but not opened)

### Qualitative Goals
- Distinguish delivery issues from user behavior issues
- Enable A/B testing of email subject lines and body copy
- Provide data to optimize email send timing

## Technical Approach

### 1. UTM Parameter Tracking (Click Tracking)

**Implementation**: Add UTM parameters to confirmation links

**Current Link**:
```
https://petforce.app/auth/verify?token=abc123&type=signup
```

**Enhanced Link**:
```
https://petforce.app/auth/verify?token=abc123&type=signup&utm_source=email&utm_medium=confirmation&utm_campaign=registration&utm_content=primary_button&utm_term=v1
```

**UTM Parameter Definitions**:
- `utm_source=email` - Traffic source (always "email")
- `utm_medium=confirmation` - Medium type (confirmation, password_reset, magic_link)
- `utm_campaign=registration` - Campaign (registration, re_engagement)
- `utm_content=primary_button` - Variant (primary_button, text_link, footer_link)
- `utm_term=v1` - Email version (for A/B testing)

**Tracking Logic**:
```typescript
// In /auth/verify page
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  
  if (params.has('utm_source') && params.get('utm_source') === 'email') {
    metrics.record('email_link_clicked', {
      token: params.get('token'),
      medium: params.get('utm_medium'),
      campaign: params.get('utm_campaign'),
      content: params.get('utm_content'),
      version: params.get('utm_term'),
      timestamp: Date.now(),
    });
  }
}, []);
```

### 2. Email Open Tracking (Optional - Privacy Considerations)

**Implementation Options**:

**Option A: Tracking Pixel (Most Common)**
```html
<!-- Embedded in email HTML -->
<img src="https://petforce.app/api/track/email/open?id=email_abc123" 
     width="1" height="1" style="display:none" />
```

**Option B: No Open Tracking (Privacy-First Approach)**
- Only track link clicks (more privacy-friendly)
- Infer "opened" from "clicked" (user must open to click)
- Avoid email tracking pixel privacy concerns

**Recommendation**: Start with Option B (clicks only)
- More privacy-friendly (aligns with PetForce values)
- Apple Mail Privacy Protection blocks pixels anyway
- Click data is sufficient for our needs

### 3. Data Schema

**New Metrics Events**:
```typescript
// Event: email_link_clicked
{
  event: 'email_link_clicked',
  timestamp: 1706198400000,
  userId: 'user_123',
  metadata: {
    emailType: 'confirmation', // confirmation | password_reset | magic_link
    campaign: 'registration',
    content: 'primary_button',
    version: 'v1',
    timeSinceEmailSent: 180000, // 3 minutes in ms
  }
}

// Event: email_confirmation_completed
{
  event: 'email_confirmation_completed',
  timestamp: 1706198410000,
  userId: 'user_123',
  metadata: {
    emailType: 'confirmation',
    timeSinceEmailSent: 190000, // 3m 10s
    timeSinceEmailClicked: 10000, // 10s
    campaign: 'registration',
    version: 'v1',
  }
}
```

**Database Enhancement** (Optional):
```sql
-- Add UTM tracking to auth_rate_limits or create new table
CREATE TABLE email_engagement (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  email_type VARCHAR(50) NOT NULL, -- confirmation, password_reset, magic_link
  email_sent_at TIMESTAMP NOT NULL,
  link_clicked_at TIMESTAMP,
  confirmation_completed_at TIMESTAMP,
  utm_campaign VARCHAR(100),
  utm_content VARCHAR(100),
  utm_term VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for analytics queries
CREATE INDEX idx_email_engagement_sent_at ON email_engagement(email_sent_at);
CREATE INDEX idx_email_engagement_type ON email_engagement(email_type);
```

### 4. Code Changes Required

#### File 1: `/supabase/functions/resend-confirmation/index.ts`
```typescript
// Line 114-120: Add UTM parameters to redirect URL
const { data, error } = await supabase.auth.admin.generateLink({
  type: 'signup',
  email: email,
  options: {
    redirectTo: buildTrackingUrl({
      baseUrl: `${Deno.env.get('PUBLIC_SITE_URL') || 'http://localhost:3000'}/auth/verify`,
      emailType: 'confirmation',
      campaign: 'registration',
      content: 'primary_button',
      version: 'v1',
    }),
  },
});

// Helper function
function buildTrackingUrl(params: {
  baseUrl: string;
  emailType: string;
  campaign: string;
  content: string;
  version: string;
}): string {
  const url = new URL(params.baseUrl);
  url.searchParams.set('utm_source', 'email');
  url.searchParams.set('utm_medium', params.emailType);
  url.searchParams.set('utm_campaign', params.campaign);
  url.searchParams.set('utm_content', params.content);
  url.searchParams.set('utm_term', params.version);
  return url.toString();
}
```

#### File 2: `/packages/auth/src/utils/metrics.ts`
```typescript
// Add new metric events
export const EMAIL_ENGAGEMENT_EVENTS = {
  LINK_CLICKED: 'email_link_clicked',
  CONFIRMATION_COMPLETED: 'email_confirmation_completed',
} as const;

// Add to MetricsCollector class
getEmailEngagementSummary(periodMs: number = 24 * 60 * 60 * 1000) {
  const now = Date.now();
  const cutoff = now - periodMs;
  const recentMetrics = this.metrics.filter((m) => m.timestamp >= cutoff);

  const emailsSent = recentMetrics.filter(
    (m) => m.event === 'confirmation_email_sent'
  ).length;

  const linksClicked = recentMetrics.filter(
    (m) => m.event === 'email_link_clicked'
  ).length;

  const confirmationsCompleted = recentMetrics.filter(
    (m) => m.event === 'email_confirmation_completed'
  ).length;

  return {
    emailsSent,
    linksClicked,
    confirmationsCompleted,
    clickRate: emailsSent > 0 ? (linksClicked / emailsSent) * 100 : 0,
    conversionRate: linksClicked > 0 ? (confirmationsCompleted / linksClicked) * 100 : 0,
    avgTimeToClick: this.calculateAvgTimeToClick(recentMetrics),
    avgTimeToComplete: this.calculateAvgTimeToComplete(recentMetrics),
  };
}
```

#### File 3: `/apps/web/src/features/auth/pages/VerifyEmailPage.tsx`
```typescript
// Add tracking on page load
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  
  if (params.has('utm_source') && params.get('utm_source') === 'email') {
    metrics.record('email_link_clicked', {
      emailType: params.get('utm_medium') || 'unknown',
      campaign: params.get('utm_campaign') || 'unknown',
      content: params.get('utm_content') || 'unknown',
      version: params.get('utm_term') || 'v1',
    });
  }
}, []);

// Track confirmation completion
const handleConfirmation = async (token: string) => {
  const params = new URLSearchParams(window.location.search);
  const startTime = Date.now();
  
  // ... existing confirmation logic ...
  
  if (success) {
    metrics.record('email_confirmation_completed', {
      emailType: params.get('utm_medium') || 'confirmation',
      campaign: params.get('utm_campaign') || 'registration',
      version: params.get('utm_term') || 'v1',
      duration: Date.now() - startTime,
    });
  }
};
```

## Dashboard Integration

These metrics will be visualized in Task #29 (Registration Funnel Dashboard):

**Email Engagement Card**:
```
┌─────────────────────────────────────────┐
│ Email Delivery Health                   │
├─────────────────────────────────────────┤
│ Sent: 1,000                             │
│ Clicked: 650 (65%) ✅                   │
│ Confirmed: 600 (92% of clicked) ✅      │
├─────────────────────────────────────────┤
│ Avg Time to Click: 8 min               │
│ Avg Time to Confirm: 12 min            │
└─────────────────────────────────────────┘
```

## Privacy & Compliance

### GDPR Compliance
- UTM parameters are first-party tracking (allowed)
- No third-party tracking pixels
- Data tied to user ID (covered by user consent)
- No tracking of non-registered users

### Privacy Best Practices
- ✅ No email open tracking pixels (privacy-friendly)
- ✅ Only track clicks on links user intentionally clicked
- ✅ UTM data deleted if user deletes account
- ✅ No sharing of tracking data with third parties

### Data Retention
- Email engagement metrics: 90 days
- Aggregated metrics (rates, averages): Indefinite
- User-level data: Deleted with account

## Testing Plan

### Unit Tests
```typescript
describe('Email Engagement Tracking', () => {
  it('should add UTM parameters to confirmation links', () => {
    const url = buildTrackingUrl({
      baseUrl: 'https://petforce.app/auth/verify',
      emailType: 'confirmation',
      campaign: 'registration',
      content: 'primary_button',
      version: 'v1',
    });
    
    expect(url).toContain('utm_source=email');
    expect(url).toContain('utm_medium=confirmation');
    expect(url).toContain('utm_campaign=registration');
  });

  it('should track email link clicks', () => {
    // Test that clicking email link records metric
  });

  it('should calculate click rate correctly', () => {
    // Test click rate calculation
  });
});
```

### Manual Testing
1. Register new user
2. Check confirmation email has UTM parameters
3. Click link from email
4. Verify metrics recorded in console/monitoring
5. Check dashboard shows engagement data

## Rollout Plan

### Phase 1: Implementation (Week 1)
- Add UTM parameters to confirmation emails
- Add tracking to verify page
- Add metrics calculation methods
- Unit tests

### Phase 2: Validation (Week 2)
- Deploy to staging
- Manual testing with real emails
- Verify metrics collection
- Check for tracking errors

### Phase 3: Launch (Week 3)
- Deploy to production
- Monitor for 7 days
- Validate data quality
- Document baseline metrics

### Phase 4: Optimization (Ongoing)
- A/B test email subject lines
- Test different email copy
- Optimize send timing
- Reduce time-to-click

## Success Metrics (30 Days Post-Launch)

### Adoption Metrics
- ✅ 100% of confirmation emails have UTM parameters
- ✅ Link click events tracked for >95% of confirmation completions
- ✅ No errors in tracking implementation

### Business Metrics
- Baseline click rate established (target: >60%)
- Baseline time-to-click measured (target: <10 min)
- Spam filter issues identified (sent but not clicked after 24h)

### Quality Metrics
- Zero privacy complaints
- Zero tracking errors in logs
- Dashboard shows accurate data

## Dependencies

### Internal Dependencies
- Peter (Product): Approve UTM parameter naming convention
- Larry (Logging): Confirm monitoring can handle new events
- Samantha (Security): Review privacy implications

### External Dependencies
- None (all first-party implementation)

## Risks & Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| UTM parameters break email links | HIGH | LOW | Test thoroughly; parameters are URL-safe |
| Tracking adds latency to page load | MEDIUM | LOW | Async tracking; non-blocking |
| Users disable UTM parameters | LOW | MEDIUM | Track "confirmed without UTM" separately |
| Privacy concerns from users | MEDIUM | LOW | No tracking pixels; transparent data policy |

## Future Enhancements

### Short-term (3 months)
- Add email engagement to Casey's customer health score
- Track re-engagement email effectiveness
- Compare confirmation rates by email provider (Gmail, Outlook, etc.)

### Long-term (6+ months)
- A/B test framework for email optimization
- Predictive model: "Will this user confirm based on engagement?"
- Email deliverability monitoring service integration

## Open Questions

1. Should we track engagement for password reset emails too?
   - **Recommendation**: Yes, use same UTM approach
2. Should we build email tracking pixel despite privacy concerns?
   - **Recommendation**: No, clicks are sufficient
3. Should we store engagement data in database or just metrics?
   - **Recommendation**: Start with metrics only, add DB if needed for per-user analysis

## Appendix

### UTM Parameter Reference
- [Google Analytics UTM Guide](https://support.google.com/analytics/answer/1033863)
- Industry standard for campaign tracking
- Compatible with all analytics platforms

### Email Engagement Benchmarks
- Transactional email open rate: 20-30%
- Transactional email click rate: 15-25%
- Email-to-confirmation rate: 70-85%

### Related Tasks
- Task #29: Registration Funnel Dashboard (visualizes this data)
- Task #6: Email engagement gaps (this task addresses Ana's checklist gap)

---

**Document Owner**: Ana (Analytics)  
**Reviewers**: Peter (Product), Larry (Logging), Samantha (Security)  
**Last Updated**: 2026-01-25  
**Status**: READY FOR PETER REVIEW
