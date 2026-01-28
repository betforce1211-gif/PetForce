# Enhanced Observability - Visual Summary

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PETFORCE APPLICATION                         │
│                                                                      │
│  ┌──────────────────┐         ┌──────────────────┐                 │
│  │   Web App        │         │   Mobile App     │                 │
│  │   (React)        │         │   (React Native) │                 │
│  └────────┬─────────┘         └────────┬─────────┘                 │
│           │                            │                            │
│           └────────────┬───────────────┘                            │
│                        │                                            │
│                        ▼                                            │
│           ┌────────────────────────┐                                │
│           │  @petforce/observability │                              │
│           │                        │                                │
│           │  • client-logger.ts    │                                │
│           │  • performance-monitor │                                │
│           │  • react-hooks.ts      │                                │
│           └────────┬───────────────┘                                │
│                    │                                                │
└────────────────────┼────────────────────────────────────────────────┘
                     │
                     │ Batched Logs (10 or 5s)
                     │
                     ▼
        ┌────────────────────────┐
        │  Backend Endpoints     │
        │                        │
        │  /api/logs/client      │
        │  /api/logs/performance │
        └────────┬───────────────┘
                 │
                 │ Structured JSON
                 │
                 ▼
    ┌────────────────────────────┐
    │  Monitoring Service        │
    │                            │
    │  • Datadog (recommended)   │
    │  • Sentry (errors)         │
    │  • CloudWatch (AWS)        │
    └────────┬───────────────────┘
             │
             ▼
   ┌─────────────────────┐
   │  Dashboards & Alerts │
   │                      │
   │  • Page views        │
   │  • Error rates       │
   │  • API latency       │
   │  • User flows        │
   └──────────────────────┘
```

## Event Flow Diagram

```
User Action → Client Logger → Batch Queue → Backend → Monitoring Service
                                                              ↓
                                                         Dashboards
                                                         Alerts
                                                         Analytics
```

### Example: Login Flow

```
1. User lands on LoginPage
   → usePageView('LoginPage')
   → Log: { category: 'page_view', message: 'Page view: LoginPage' }

2. User clicks "Show Password"
   → clientLogger.interaction('toggle_password', 'EmailPasswordForm')
   → Log: { category: 'user_interaction', action: 'toggle_password' }

3. User clicks "Login"
   → useTrackedClick('login-button')
   → Log: { category: 'user_interaction', action: 'click' }

4. API call starts
   → performanceMonitor.start('auth.login')
   → Timestamp recorded

5. API call completes
   → performanceMonitor.end('auth.login')
   → Log: { category: 'performance', duration: 245 }

6. Form submission
   → useFormTracking().onSubmit()
   → Log: { category: 'form', action: 'submit' }

7. Batch sent to backend (5 logs)
   → POST /api/logs/client
   → Backend forwards to Datadog

8. Dashboard updated
   → Login success rate: 95.2%
   → Average latency: 245ms (p95: 450ms)
```

## What Gets Logged

### Client-Side Events

```
┌─────────────────────────────────────────────────────────────┐
│ Event Type          │ Example                   │ Priority  │
├─────────────────────┼──────────────────────────┼───────────┤
│ Page View           │ LoginPage loaded          │ High      │
│ Button Click        │ Submit button clicked     │ High      │
│ Form Submit         │ Registration completed    │ High      │
│ Form Error          │ Password validation fail  │ High      │
│ Navigation          │ /login → /register        │ Medium    │
│ Interaction         │ Password visibility toggle│ Medium    │
│ Client Error        │ Network request failed    │ Critical  │
│ Performance         │ API call took 245ms       │ Medium    │
└─────────────────────────────────────────────────────────────┘
```

### Performance Metrics

```
┌────────────────────────────────────────────────────────────┐
│ Metric             │ Measurement        │ Target          │
├────────────────────┼────────────────────┼─────────────────┤
│ auth.login         │ p50: 200ms         │ < 300ms         │
│                    │ p95: 450ms         │ < 500ms         │
│                    │ p99: 850ms         │ < 1000ms        │
│                    │                    │                 │
│ auth.register      │ p50: 300ms         │ < 400ms         │
│                    │ p95: 600ms         │ < 800ms         │
│                    │                    │                 │
│ page.load          │ p50: 800ms         │ < 1000ms        │
│                    │ p95: 1500ms        │ < 2000ms        │
└────────────────────────────────────────────────────────────┘
```

## Implementation Phases

```
Phase 1: Setup (30 min)
├─ Install package
├─ Create backend endpoints
└─ Configure URLs

Phase 2: Client Logging (2-3 hours)
├─ Add usePageView() to pages
├─ Add useTrackedClick() to buttons
├─ Add useFormTracking() to forms
└─ Track interactions

Phase 3: Performance Timing (1-2 hours)
├─ Wrap API calls with measure()
├─ Add useTrackedAPI() hooks
└─ Test performance stats

Phase 4: Testing (1 hour)
├─ Verify logs in console
├─ Test batching
├─ Check backend receives logs
└─ Validate PII redaction

Phase 5: Deployment (30 min)
├─ Deploy Supabase functions
├─ Update env variables
├─ Deploy to staging
└─ Create dashboards

Phase 6: Monitoring (ongoing)
├─ Set up alerts
├─ Monitor metrics
└─ Iterate
```

## Priority Matrix

```
                   High Impact
                        ▲
                        │
   Form Validation  │  Login Flow  │  API Errors
   Client Errors    │  Page Views  │  Performance
                        │             Timing
   ─────────────────────┼─────────────────────────►
   Low Effort            │           High Effort
                        │
   Password Toggle  │  Navigation  │  Render
   Button Clicks    │  Tracking    │  Performance
                        │
                        ▼
                   Low Impact
```

### Priority 1 (Do First)
- Login/Register page views
- Form submission tracking
- API call performance
- Client error tracking

### Priority 2 (Do Next)
- Button click tracking
- Navigation tracking
- Form validation errors

### Priority 3 (Nice to Have)
- Password visibility toggle
- Component render times
- Resource loading times

## Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                  PETFORCE CLIENT OBSERVABILITY                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Total Events]  [Error Rate]  [Avg Latency]  [Active Sessions]│
│     12,543         0.8%          245ms           342            │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Page Views (Last Hour)                                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ LoginPage         ████████████████ 450                   │   │
│  │ RegisterPage      ██████████ 280                         │   │
│  │ DashboardPage     ████████ 220                           │   │
│  │ ForgotPassword    ██ 45                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  API Performance                │  Form Submission Rates        │
│  ┌─────────────────────────┐    │  ┌───────────────────────┐   │
│  │ auth.login              │    │  │ Login: 95.2%          │   │
│  │ p50: 200ms ✓            │    │  │ Register: 87.5%       │   │
│  │ p95: 450ms ✓            │    │  │ Password Reset: 92.0% │   │
│  │ p99: 850ms ✓            │    │  └───────────────────────┘   │
│  └─────────────────────────┘    │                              │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Recent Errors                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [ERROR] Failed to load user data (LoginPage)            │   │
│  │ [ERROR] Network timeout (DashboardPage)                 │   │
│  │ [WARN]  Form validation error (RegisterPage)            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Before & After

### Before (No Client Logging)
```
User reports: "I can't login"

What we know:
✗ Which page they're on
✗ What they clicked
✗ If form validation worked
✗ How long API call took
✗ What error occurred

Result: 30 minutes of debugging, multiple back-and-forth emails
```

### After (With Client Logging)
```
User reports: "I can't login"

What we know:
✓ They're on LoginPage
✓ They clicked "Login" button
✓ Form validation passed
✓ API call took 850ms (slower than p95)
✓ API returned 401 error
✓ They tried 3 times in 2 minutes

Result: 2 minutes to identify issue (incorrect password + slow API)
```

## Success Metrics

```
Week 1:  ████░░░░░░  40%  - Basic logging implemented
Week 2:  ████████░░  80%  - Performance timing added
Week 3:  ██████████ 100%  - Full observability achieved

Target Outcomes:
✓ 100% of user flows logged
✓ API latency < 500ms (p95)
✓ Error rate < 1%
✓ Mean time to resolution < 5 minutes
✓ Support ticket reduction 60-70%
```

## Quick Reference

### Common Tasks

```bash
# View logs in development
import { clientLogger } from '@petforce/observability';
clientLogger.flush(); // Send immediately

# Check performance stats
import { performanceMonitor } from '@petforce/observability';
performanceMonitor.logSummary();

# Debug specific operation
performanceMonitor.getStats('auth.login');
// { avg: 245, p95: 450, p99: 850 }
```

### Files to Edit

```
High Priority:
1. apps/web/src/features/auth/pages/LoginPage.tsx
2. apps/web/src/features/auth/components/EmailPasswordForm.tsx
3. packages/auth/src/api/auth-api.ts

Medium Priority:
4. apps/web/src/features/auth/pages/RegisterPage.tsx
5. apps/mobile/src/features/auth/screens/LoginScreen.tsx

Backend:
6. supabase/functions/client-logs/index.ts (new)
7. supabase/functions/performance-logs/index.ts (new)
```

---

**Visual guide created by**: Larry (Logging & Observability Agent)  
**Date**: 2026-01-25  
**Status**: Ready for implementation
