# Registration Analytics - Quick Reference Card

## The 8-Stage Funnel (Memorize This!)

| Stage | Event                                           | What It Tracks              | Target %              | Current % |
| ----- | ----------------------------------------------- | --------------------------- | --------------------- | --------- |
| 1     | `registration.page.viewed`                      | User lands on register page | 100% (base)           | ✓         |
| 2     | `registration.form.interaction`                 | User starts typing          | 85%                   | ?         |
| 3     | `registration.form.filled`                      | All fields complete         | 80% (95% of stage 2)  | ?         |
| 4     | `registration.submit.clicked`                   | User clicks submit          | 78% (98% of stage 3)  | ?         |
| 5     | `registration_completed` (server)               | API creates account         | 74% (95% of stage 4)  | ~92%      |
| 6     | `registration.navigation.result` (success=true) | Reached verify page         | 74% (100% of stage 5) | **0% 🔴** |
| 7     | `registration.verify_page.viewed`               | Viewed verify page          | 74% (100% of stage 6) | **0% 🔴** |
| 8     | `email_confirmed` (server)                      | Verified email              | 56% (75% of stage 7)  | **0% 🔴** |

**Overall Goal**: 56% of page viewers verify email within 24h

## Key Metrics Cheat Sheet

```
Primary Metric: Email Verification Rate
Formula: (stage 8 count / stage 5 count) × 100
Target: >75%
Current: ~0% (due to navigation bug)

Critical Bug Metric: Navigation Success Rate
Formula: (stage 6 count / stage 5 count) × 100
Target: 100%
Current: 0% (THE BUG!)

Secondary Metrics:
- API Success Rate: (stage 5 / stage 4) × 100, target >95%
- Error Rate: (errors / attempts) × 100, target <10%
- p95 API Response Time: target <3000ms
```

## Event Names (Copy-Paste Ready)

### Client Events (Engrid/Maya implement)

```typescript
"registration.page.viewed";
"registration.form.interaction";
"registration.form.filled";
"registration.submit.clicked";
"registration.navigation.attempted";
"registration.navigation.result";
"registration.verify_page.viewed";
"registration.performance";
"registration.error";
```

### Server Events (Already implemented in auth-api.ts)

```typescript
"registration_attempt_started";
"registration_completed";
"registration_failed";
"email_confirmed";
"login_attempt_started";
"login_completed";
"login_rejected_unconfirmed";
```

## correlation_id Pattern

```typescript
// Generate on form mount
const correlationId = crypto.randomUUID(); // or uuidv4()

// Include in ALL events
{
  event: 'registration.form.interaction',
  correlation_id: correlationId,
  timestamp: Date.now(),
  metadata: { /* event-specific */ }
}

// Pass to API
fetch('/api/auth/register', {
  headers: { 'X-Correlation-Id': correlationId }
})

// Store in sessionStorage
sessionStorage.setItem('registration_correlation_id', correlationId);

// Retrieve on verify-pending page
const correlationId = sessionStorage.getItem('registration_correlation_id');
```

## Performance Metrics to Track

```typescript
// Button disable latency (target: <100ms)
const clickTime = Date.now();
// ... disable button ...
const disableTime = Date.now();
const latency = disableTime - clickTime;

// API response time (target: <3000ms)
const requestTime = Date.now();
const response = await fetch('/api/auth/register', ...);
const responseTime = Date.now();
const apiTime = responseTime - requestTime;

// Total registration time (target: <5000ms)
const submitTime = Date.now();
// ... API call + navigation ...
const successTime = Date.now();
const totalTime = successTime - submitTime;

// Send all at once
metrics.record('registration.performance', {
  correlation_id: correlationId,
  button_disable_latency: latency,
  api_response_time: apiTime,
  total_registration_time: totalTime,
});
```

## Error Categorization

```typescript
type ErrorType = 'validation' | 'api' | 'navigation' | 'network' | 'unexpected';

// Validation errors (client-side)
{
  type: 'validation',
  code: 'PASSWORD_WEAK',
  field: 'password',
  recoverable: true,
}

// API errors (server response)
{
  type: 'api',
  code: 'EMAIL_EXISTS',
  field: 'email',
  recoverable: true, // User can use different email
}

// Navigation errors (THE BUG)
{
  type: 'navigation',
  code: 'NAVIGATION_BLOCKED',
  message: 'Failed to navigate to verify-pending',
  recoverable: false,
}

// Network errors
{
  type: 'network',
  code: 'NETWORK_TIMEOUT',
  recoverable: true, // User can retry
}
```

## Dashboard Color Codes

```typescript
// Status colors
✓ Healthy (≥75%):      #16A34A (green)
⚠ Warning (60-75%):    #EAB308 (yellow)
🔴 Critical (<60%):    #DC2626 (red)

// Chart colors
Primary line:          #2563EB (blue)
p50:                   #60A5FA (light blue)
p95:                   #2563EB (primary blue)
p99:                   #1E40AF (dark blue)
Target line:           #EAB308 (yellow, dashed)

// Error types
Navigation errors:     #DC2626 (red - critical)
API errors:            #EA580C (orange)
Validation errors:     #EAB308 (yellow)
Network errors:        #2563EB (blue)
```

## Alert Thresholds

```
🔴 CRITICAL (Page immediately):
- Navigation success rate = 0% (AND registration count > 5)
- API error rate > 50%
- Total registrations = 0 (AND attempts > 10)

🟡 WARNING (Slack notification):
- Email verification rate < 60%
- p95 API response time > 5000ms
- p95 button latency > 100ms

ℹ️ INFO (Daily email):
- Registration volume unusual (spike or drop)
- New error codes appearing
- Verification rate trending down
```

## API Endpoint Usage

```bash
# Get 24h summary
GET /api/analytics/registration/summary?timeRange=24h&platform=all

# Get last hour for web only
GET /api/analytics/registration/summary?timeRange=1h&platform=web

# Batch send events
POST /api/analytics/events
{
  "events": [
    { "event": "registration.form.interaction", "correlation_id": "abc-123", ... },
    { "event": "registration.form.filled", "correlation_id": "abc-123", ... }
  ]
}
```

## Baseline vs Target Comparison

| Metric                  | Baseline (Before Fix) | Target (After Fix) | Success? |
| ----------------------- | --------------------- | ------------------ | -------- |
| Navigation Success Rate | 0%                    | 100%               | ❌ → ✅  |
| Verification Rate       | 0%                    | >75%               | ❌ → ✅  |
| API Success Rate        | ~95%                  | >95%               | ✅       |
| Error Rate              | ~13%                  | <10%               | ⚠ → ✅   |
| p95 API Time            | ~4800ms               | <3000ms            | ⚠ → ✅   |

## Testing Checklist

**Before P0 Fixes** (Tucker captures baseline):

- [ ] All 8 funnel events fire
- [ ] correlation_id links events
- [ ] Navigation failure tracked (should be 100%)
- [ ] Dashboard shows 0% navigation success
- [ ] Alert fires for navigation failure
- [ ] Export baseline-metrics.json

**After P0 Fixes** (Tucker validates):

- [ ] Navigation success = 100%
- [ ] Verify page views = API success count
- [ ] Verification rate >75%
- [ ] No navigation alerts
- [ ] Compare before/after metrics
- [ ] Export post-fix-metrics.json

## Common Debugging Commands

```bash
# Check if events are flowing
grep "registration" /var/log/analytics.log | tail -20

# Count events by type (last hour)
grep "registration" /var/log/analytics.log | grep "$(date -d '1 hour ago' '+%Y-%m-%d %H')" | cut -d'"' -f4 | sort | uniq -c

# Find correlation_id for failed navigation
grep "navigation.result.*success.*false" /var/log/analytics.log | jq .correlation_id

# Get all events for a correlation_id
grep "abc-123" /var/log/analytics.log | jq .

# Check dashboard API response time
time curl "http://localhost:3000/api/analytics/registration/summary?timeRange=24h"
```

## File Locations

```
Specs:
/proposals/registration-analytics/ANALYTICS-SPEC.md
/proposals/registration-analytics/dashboard-components-spec.md
/proposals/registration-analytics/IMPLEMENTATION-CHECKLIST.md

Code:
/packages/auth/src/utils/metrics.ts         (existing)
/packages/auth/src/utils/monitoring.ts      (existing)
/packages/auth/src/api/auth-api.ts          (existing - has server events)
/apps/web/src/features/auth/pages/AuthMetricsDashboard.tsx  (to update)

Baseline Data:
/proposals/registration-analytics/baseline-metrics-template.json
```

## One-Liner Tests

```bash
# Test form interaction tracking
# (Open browser console on /auth?mode=register)
console.log('Correlation ID:', sessionStorage.getItem('registration_correlation_id'));

# Test API call
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "X-Correlation-Id: test-123" \
  -d '{"email":"test@example.com","password":"Test1234!"}'

# Test dashboard load
curl http://localhost:3000/api/analytics/registration/summary?timeRange=1h | jq .
```

## Who Does What

| Agent      | Primary Responsibility | Deliverable                                   |
| ---------- | ---------------------- | --------------------------------------------- |
| **Ana**    | Specs, analysis        | This proposal, baseline report, impact report |
| **Engrid** | Web implementation     | Event tracking, dashboard, API endpoint       |
| **Maya**   | Mobile implementation  | Mobile event tracking                         |
| **Larry**  | Backend/alerts         | Metrics aggregation, alert engine             |
| **Tucker** | Testing/validation     | Baseline capture, fix validation              |
| **Peter**  | Product approval       | Sign-off on metrics and targets               |

## Quick Wins (Do These First!)

1. **Add correlation_id tracking** (30 min)
   - Generate UUID on form mount
   - Include in all events
   - Pass to API in header

2. **Track navigation failure** (1 hour)
   - Add `registration.navigation.attempted` event
   - Add `registration.navigation.result` event
   - Show on dashboard (will be 0% = proves bug)

3. **Add alert for navigation failure** (30 min)
   - If navigation_success_rate = 0% → critical alert
   - Sends to Slack #eng-alerts

4. **Capture baseline** (4 hours)
   - Let analytics run for 24h
   - Export baseline-metrics.json
   - Document current broken state

**Total time to prove bug: ~6 hours**

---

**Print this page and keep it at your desk!**
