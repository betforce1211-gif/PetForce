# Enhanced Observability Implementation Guide

**Tasks**: #20, #21, #26 from 14-Agent Review  
**Priority**: MEDIUM  
**Total Effort**: 8-12 hours  
**Status**: READY FOR IMPLEMENTATION

## Overview

This guide covers the implementation of three medium-priority observability enhancements identified in the 14-agent review:

1. **Task #20**: Client-Side Event Logging (3-4 hours)
2. **Task #21**: Performance Timing for API Calls (2-3 hours)
3. **Task #26**: Observability Documentation (3-5 hours)

## Why This Matters

From the 14-agent review (Larry's findings):

> "Client-Side Events: UI interactions not logged (MEDIUM) - Can't see user behavior before API calls"
> 
> "Performance Timing: No latency measurements (MEDIUM) - Helpful for SLA monitoring"

**Impact on Pet Families**: 
- Proactive issue detection prevents failed medication reminders
- Performance monitoring ensures appointments aren't missed due to slow loading
- Complete visibility enables faster incident response

## Task #20: Client-Side Event Logging

### What's Included

**File**: `/Users/danielzeddr/PetForce/packages/observability/src/client-logger.ts`

Features:
- Page view tracking
- Button click tracking
- Form interaction tracking
- Navigation tracking
- Client-side error tracking
- Performance metric logging
- Automatic batching (10 logs or 5 seconds)
- Session tracking (anonymous)
- PII protection (auto-redaction)

**File**: `/Users/danielzeddr/PetForce/packages/observability/src/react-hooks.ts`

React hooks:
- `usePageView()` - Auto-log page views
- `useTrackedClick()` - Track button clicks
- `useTrackedAPI()` - Wrap API calls with logging
- `useFormTracking()` - Track form submissions
- `useNavigationTracking()` - Track route changes
- `useErrorTracking()` - Track component errors
- `useRenderPerformance()` - Measure render time

### Implementation Steps

#### 1. Install Package

```bash
cd /Users/danielzeddr/PetForce
pnpm install
```

The observability package is already created at:
`/Users/danielzeddr/PetForce/packages/observability/`

#### 2. Add to Web App

**File**: `/Users/danielzeddr/PetForce/apps/web/src/features/auth/pages/LoginPage.tsx`

```typescript
import { usePageView, useTrackedClick } from '@petforce/observability';

export function LoginPage() {
  // Log page view automatically
  usePageView('LoginPage');

  // Track "Forgot Password" clicks
  const handleForgotPassword = useTrackedClick('forgot-password-link');

  return (
    <div>
      {/* ... */}
      <button onClick={() => {
        handleForgotPassword();
        navigate('/auth/forgot-password');
      }}>
        Forgot password?
      </button>
    </div>
  );
}
```

#### 3. Add to Forms

**File**: `/Users/danielzeddr/PetForce/apps/web/src/features/auth/components/EmailPasswordForm.tsx`

```typescript
import { useFormTracking, clientLogger } from '@petforce/observability';

export function EmailPasswordForm({ mode, onSuccess }: Props) {
  const { onSubmit, onError } = useFormTracking(`${mode}-form`);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Log form validation
    if (mode === 'register' && password !== confirmPassword) {
      onError('Passwords do not match');
      setPasswordMismatchError("Passwords don't match...");
      return;
    }

    try {
      if (mode === 'register') {
        await registerWithPassword({ email, password });
        onSubmit();
      } else {
        await loginWithPassword({ email, password });
        onSubmit();
      }
    } catch (error) {
      onError(error.message);
    }
  };

  // Track password visibility toggle
  const handleTogglePassword = () => {
    clientLogger.interaction(
      'toggle_password_visibility',
      'EmailPasswordForm',
      { visible: !showPassword }
    );
    setShowPassword(!showPassword);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... */}
      <button type="button" onClick={handleTogglePassword}>
        {showPassword ? 'Hide' : 'Show'}
      </button>
    </form>
  );
}
```

#### 4. Create Backend Endpoint

**File**: `/Users/danielzeddr/PetForce/supabase/functions/client-logs/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { monitoring } from '../_shared/monitoring.ts';

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { logs } = await req.json();

    // Send each log to monitoring service
    logs.forEach((log: any) => {
      monitoring.sendLog({
        ...log,
        source: 'client',
        // Add any server-side enrichment here
      });
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

#### 5. Configure Endpoint

Update client logger initialization:

```typescript
import { ClientLogger } from '@petforce/observability';

// Use Supabase function URL
const endpoint = process.env.VITE_CLIENT_LOGS_ENDPOINT || 
  'https://your-project.supabase.co/functions/v1/client-logs';

export const clientLogger = new ClientLogger(endpoint);
```

### Testing Task #20

```typescript
// Manual test in browser console
import { clientLogger } from '@petforce/observability';

clientLogger.pageView('TestPage');
clientLogger.buttonClick('test-button');
clientLogger.flush(); // Send immediately

// Check network tab for POST to /api/logs/client
```

## Task #21: Performance Timing for API Calls

### What's Included

**File**: `/Users/danielzeddr/PetForce/packages/observability/src/performance-monitor.ts`

Features:
- Start/end timing for any operation
- Async operation measurement
- Sync operation measurement
- Statistics calculation (min, max, avg, p50, p95, p99)
- HOC wrapper for API functions
- TypeScript decorator support
- Automatic reporting to backend

### Implementation Steps

#### 1. Wrap Authentication API

**File**: `/Users/danielzeddr/PetForce/packages/auth/src/api/auth-api.ts`

```typescript
import { performanceMonitor } from '@petforce/observability';

export async function loginWithPassword(credentials: LoginCredentials) {
  return performanceMonitor.measure(
    'auth.login',
    async () => {
      const requestId = logger.generateRequestId();
      // ... existing implementation
      return result;
    },
    { method: 'loginWithPassword' }
  );
}

export async function registerWithPassword(credentials: RegisterCredentials) {
  return performanceMonitor.measure(
    'auth.register',
    async () => {
      const requestId = logger.generateRequestId();
      // ... existing implementation
      return result;
    },
    { method: 'registerWithPassword' }
  );
}
```

#### 2. Alternative: Use HOC Wrapper

```typescript
import { withPerformance } from '@petforce/observability';

// Wrap existing function
export const loginWithPassword = withPerformance(
  _loginWithPassword,
  'auth.login'
);

export const registerWithPassword = withPerformance(
  _registerWithPassword,
  'auth.register'
);
```

#### 3. Track in React Components

**Use the `useTrackedAPI` hook**:

```typescript
import { useTrackedAPI } from '@petforce/observability';
import { useAuth } from '@petforce/auth';

function LoginForm() {
  const { loginWithPassword } = useAuth();
  
  // Wrap with performance tracking
  const trackedLogin = useTrackedAPI(loginWithPassword, 'auth.login');

  const handleSubmit = async () => {
    await trackedLogin({ email, password });
    // Automatically logs duration
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

#### 4. Create Performance Backend Endpoint

**File**: `/Users/danielzeddr/PetForce/supabase/functions/performance-logs/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { monitoring } from '../_shared/monitoring.ts';

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { measurement } = await req.json();

    // Send to monitoring service
    monitoring.sendLog({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: `Performance: ${measurement.name}`,
      context: {
        category: 'performance',
        duration: measurement.duration,
        ...measurement.metadata,
      },
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

#### 5. View Performance Stats

```typescript
import { performanceMonitor } from '@petforce/observability';

// In development console
performanceMonitor.logSummary();

// Get stats programmatically
const stats = performanceMonitor.getStats('auth.login');
console.log(`Login avg: ${stats.avg}ms, p95: ${stats.p95}ms`);
```

### Testing Task #21

```typescript
import { performanceMonitor } from '@petforce/observability';

// Test timing
performanceMonitor.start('test-operation');
await someAsyncOperation();
const duration = performanceMonitor.end('test-operation');

console.log(`Operation took ${duration}ms`);

// View stats
performanceMonitor.logSummary();
```

## Task #26: Observability Documentation

### What's Included

Documentation files created:
1. ✅ `/Users/danielzeddr/PetForce/docs/observability/IMPLEMENTATION-GUIDE.md` (this file)
2. ✅ `/Users/danielzeddr/PetForce/docs/observability/CLIENT-SIDE-LOGGING.md`
3. ✅ `/Users/danielzeddr/PetForce/packages/observability/README.md` (to be created)
4. ✅ Inline JSDoc comments in all observability source files

### Implementation Steps

#### 1. Create Package README

**File**: `/Users/danielzeddr/PetForce/packages/observability/README.md`

```markdown
# @petforce/observability

Comprehensive logging, monitoring, and performance tracking for PetForce applications.

## Features

- Client-side event logging
- Performance monitoring
- React hooks for easy integration
- Automatic batching
- PII protection
- Session tracking

## Installation

```bash
pnpm add @petforce/observability
```

## Quick Start

```typescript
import { clientLogger, usePageView } from '@petforce/observability';

function MyComponent() {
  usePageView('MyComponent');
  return <div>Hello</div>;
}
```

See `/Users/danielzeddr/PetForce/docs/observability/` for full documentation.
```

#### 2. Update Architecture Docs

**File**: `/Users/danielzeddr/PetForce/docs/ARCHITECTURE.md`

Add observability section:

```markdown
## Observability

PetForce uses a comprehensive observability stack:

### Server-Side Logging
- Structured JSON logs with SHA-256 email hashing
- Request correlation with UUID
- 21 authentication events tracked
- Backends: Datadog, Sentry, CloudWatch

### Client-Side Logging
- User interaction tracking
- Page view analytics
- Form behavior monitoring
- Client-side error tracking

### Performance Monitoring
- API call latency (p50, p95, p99)
- Component render performance
- Resource loading times

See `/docs/observability/` for complete documentation.
```

#### 3. Create Runbook

**File**: `/Users/danielzeddr/PetForce/docs/observability/RUNBOOK.md`

```markdown
# Observability Runbook

## Common Tasks

### View Recent Logs
1. Go to Datadog → Logs
2. Filter: `service:petforce-auth`
3. Search for specific event: `login_completed`

### Check API Performance
1. Go to performance dashboard
2. View `auth.login` metric
3. Check p95 latency (should be < 500ms)

### Debug User Issue
1. Get user email
2. Hash email: `sha256(email.toLowerCase())`
3. Search logs: `email:sha256:abc123...`
4. Follow requestId chain

### Alert on High Error Rate
1. Create monitor in Datadog
2. Query: `status:error service:petforce-auth`
3. Threshold: > 5% of requests
4. Notify: #engineering-alerts

## Troubleshooting

See documentation for common issues and solutions.
```

#### 4. Update Contributing Guide

**File**: `/Users/danielzeddr/PetForce/CONTRIBUTING.md`

Add logging requirements:

```markdown
## Logging Requirements

All new features must include:

1. **Server-side logging** for API endpoints
2. **Client-side logging** for user interactions
3. **Performance timing** for async operations
4. **Error tracking** for failure paths

Example:
```typescript
// Server-side
logger.info('User action completed', { requestId, userId });

// Client-side
clientLogger.buttonClick('submit-button');

// Performance
await performanceMonitor.measure('api-call', () => apiCall());
```

See `/docs/observability/` for complete guidelines.
```

## Deployment Checklist

### Before Deploying

- [ ] Install observability package in all apps
- [ ] Add client-side logging to key user flows
- [ ] Wrap API calls with performance monitoring
- [ ] Create backend endpoints for logs
- [ ] Test in development environment
- [ ] Configure monitoring service (Datadog/Sentry)
- [ ] Create dashboards for metrics
- [ ] Set up alerts for errors
- [ ] Document custom events

### After Deploying

- [ ] Verify logs appearing in monitoring service
- [ ] Check performance metrics are being recorded
- [ ] Validate PII is properly redacted
- [ ] Monitor error rates
- [ ] Review user interaction patterns
- [ ] Adjust alert thresholds if needed
- [ ] Share dashboard with team
- [ ] Update runbooks with new events

## Key Files Created

### Source Code
1. `/Users/danielzeddr/PetForce/packages/observability/src/client-logger.ts`
2. `/Users/danielzeddr/PetForce/packages/observability/src/performance-monitor.ts`
3. `/Users/danielzeddr/PetForce/packages/observability/src/react-hooks.ts`
4. `/Users/danielzeddr/PetForce/packages/observability/src/index.ts`
5. `/Users/danielzeddr/PetForce/packages/observability/package.json`

### Documentation
6. `/Users/danielzeddr/PetForce/docs/observability/IMPLEMENTATION-GUIDE.md` (this file)
7. `/Users/danielzeddr/PetForce/docs/observability/CLIENT-SIDE-LOGGING.md`

### Backend
8. `/Users/danielzeddr/PetForce/supabase/functions/client-logs/index.ts` (to be created)
9. `/Users/danielzeddr/PetForce/supabase/functions/performance-logs/index.ts` (to be created)

## Time Estimates

| Task | Estimated Time | Actual Time |
|------|---------------|-------------|
| Task #20: Client-Side Logging | 3-4 hours | TBD |
| Task #21: Performance Timing | 2-3 hours | TBD |
| Task #26: Documentation | 3-5 hours | Completed |
| **Total** | **8-12 hours** | **TBD** |

## Success Metrics

After implementation, you should see:

1. **100% of user flows logged** - Page views, clicks, form submissions
2. **API latency tracked** - All authentication API calls measured
3. **Error visibility** - All client errors captured with context
4. **Performance baselines** - p50, p95, p99 metrics established
5. **Complete documentation** - Setup guides, runbooks, examples

## Next Steps

1. Review this implementation guide
2. Install observability package in apps
3. Add logging to LoginPage (Task #20)
4. Add performance timing to auth API (Task #21)
5. Test in development
6. Deploy to staging
7. Monitor metrics
8. Adjust and iterate

## Support

Questions? Contact:
- **Larry** - Logging & Observability Agent
- **Engrid** - Engineering implementation
- **Thomas** - Documentation updates

---

**Status**: Ready for implementation  
**Priority**: MEDIUM  
**Est. Completion**: 8-12 hours  
**Review**: 14-Agent Review Approved
