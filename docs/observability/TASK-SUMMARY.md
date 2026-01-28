# Enhanced Observability - Task Summary

**Date**: 2026-01-25  
**Tasks**: #20, #21, #26 from 14-Agent Review  
**Status**: READY FOR IMPLEMENTATION  
**Agent**: Larry (Logging & Observability)

## Quick Links

- **Implementation Guide**: `/Users/danielzeddr/PetForce/docs/observability/IMPLEMENTATION-GUIDE.md`
- **Source Code**: `/Users/danielzeddr/PetForce/packages/observability/`
- **Review Doc**: `/Users/danielzeddr/PetForce/docs/reviews/login-process-complete-review.md` (lines 887-1090)

## What Was Built

### 1. Client-Side Event Logger (Task #20)
**File**: `packages/observability/src/client-logger.ts`

Tracks:
- Page views
- Button clicks
- Form submissions
- Navigation
- Client errors
- Performance metrics

Features:
- Automatic batching (10 logs or 5 seconds)
- Session tracking
- PII protection
- Auto-flush on page unload

**React Hooks**: `packages/observability/src/react-hooks.ts`
- `usePageView()` - Auto-log page views
- `useTrackedClick()` - Track clicks
- `useTrackedAPI()` - Wrap API calls
- `useFormTracking()` - Track forms
- And more...

### 2. Performance Monitor (Task #21)
**File**: `packages/observability/src/performance-monitor.ts`

Features:
- Start/end timing
- Async/sync operation measurement
- Statistics (min, max, avg, p50, p95, p99)
- HOC wrapper for functions
- TypeScript decorator support

Usage:
```typescript
await performanceMonitor.measure('api-call', async () => {
  return apiFunction();
});
```

### 3. Documentation (Task #26)
**Files Created**:
- `docs/observability/IMPLEMENTATION-GUIDE.md` - Complete setup guide
- `docs/observability/CLIENT-SIDE-LOGGING.md` - Client logging docs
- `docs/observability/TASK-SUMMARY.md` - This file
- Inline JSDoc in all source files

## Implementation Checklist

### Phase 1: Setup (30 minutes)
- [ ] Review implementation guide
- [ ] Install observability package: `pnpm install`
- [ ] Create backend endpoints (client-logs, performance-logs)
- [ ] Configure endpoint URLs

### Phase 2: Client-Side Logging (2-3 hours)
- [ ] Add `usePageView()` to all pages
- [ ] Add `useTrackedClick()` to key buttons
- [ ] Add `useFormTracking()` to forms
- [ ] Track password visibility toggle
- [ ] Track navigation events
- [ ] Test in development

### Phase 3: Performance Timing (1-2 hours)
- [ ] Wrap auth API calls with `performanceMonitor.measure()`
- [ ] Add `useTrackedAPI()` to React components
- [ ] Test timing in development
- [ ] Verify stats calculation

### Phase 4: Testing (1 hour)
- [ ] Test client logging in browser
- [ ] Test performance monitoring
- [ ] Verify batching works
- [ ] Check backend receives logs
- [ ] Validate PII redaction

### Phase 5: Deployment (30 minutes)
- [ ] Deploy Supabase functions
- [ ] Update environment variables
- [ ] Deploy to staging
- [ ] Verify logs in Datadog/Sentry
- [ ] Create dashboards

### Phase 6: Monitoring (ongoing)
- [ ] Set up alerts for errors
- [ ] Monitor performance metrics
- [ ] Review user interaction patterns
- [ ] Iterate and improve

## Priority Areas to Instrument

Based on 14-agent review, prioritize logging in these areas:

### High Priority
1. **Login/Registration Flow**
   - LoginPage component
   - RegisterPage component
   - EmailPasswordForm component
   - Password visibility toggle
   - Form validation errors

2. **Email Verification**
   - Resend confirmation button
   - Email verification page
   - Verification success/failure

3. **API Calls**
   - `loginWithPassword()`
   - `registerWithPassword()`
   - `resendConfirmationEmail()`
   - `resetPassword()`

### Medium Priority
4. **Navigation**
   - Route changes
   - Back button usage
   - External link clicks

5. **Error Boundaries**
   - Component mount failures
   - API call failures
   - Network errors

### Low Priority
6. **Performance**
   - Component render times
   - Bundle load times
   - Image load times

## Example Implementation

### LoginPage with Full Logging

```typescript
import { usePageView, useTrackedClick, useTrackedAPI } from '@petforce/observability';
import { useAuth } from '@petforce/auth';

export function LoginPage() {
  // Track page view
  usePageView('LoginPage');

  // Track API call performance
  const { loginWithPassword } = useAuth();
  const trackedLogin = useTrackedAPI(loginWithPassword, 'auth.login');

  // Track button clicks
  const handleForgotPassword = useTrackedClick('forgot-password-link');

  const handleLogin = async () => {
    try {
      await trackedLogin({ email, password });
      // Success logged automatically
    } catch (error) {
      // Error logged automatically
    }
  };

  return (
    <div>
      <form onSubmit={handleLogin}>
        {/* ... */}
      </form>
      <button onClick={handleForgotPassword}>
        Forgot password?
      </button>
    </div>
  );
}
```

### EmailPasswordForm with Logging

```typescript
import { useFormTracking, clientLogger } from '@petforce/observability';

export function EmailPasswordForm({ mode }: Props) {
  const { onSubmit, onError } = useFormTracking(`${mode}-form`);

  const handleTogglePassword = () => {
    clientLogger.interaction('toggle_password', 'EmailPasswordForm');
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await authenticate({ email, password });
      onSubmit();
    } catch (error) {
      onError(error.message);
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

## Verification

After implementation, verify:

1. **Client logs appear in console (dev mode)**
   ```
   [INFO] [page_view] Page view: LoginPage
   [INFO] [user_interaction] Button clicked: login-button
   ```

2. **Logs sent to backend**
   - Check network tab for POST requests
   - Verify batch size and timing

3. **Performance stats available**
   ```typescript
   performanceMonitor.logSummary();
   // Shows: auth.login avg: 245ms, p95: 450ms
   ```

4. **Monitoring service receives data**
   - Datadog: Logs → filter by `service:petforce-auth source:client`
   - Sentry: Errors → check session replay

## Time Investment

| Task | Setup | Implementation | Testing | Total |
|------|-------|----------------|---------|-------|
| Task #20 | 30m | 2-3h | 30m | 3-4h |
| Task #21 | 15m | 1-2h | 15m | 2-3h |
| Task #26 | Done | Done | Done | Done |
| **Total** | **45m** | **3-5h** | **45m** | **5-7h** |

## Success Criteria

Implementation is complete when:

- [x] All source files created and documented
- [ ] LoginPage logs page views
- [ ] EmailPasswordForm logs interactions
- [ ] All auth API calls measure performance
- [ ] Backend endpoints deployed
- [ ] Logs appear in monitoring service
- [ ] Dashboards created
- [ ] Alerts configured
- [ ] Team trained on new logging

## Files You'll Modify

### Web App
1. `apps/web/src/features/auth/pages/LoginPage.tsx`
2. `apps/web/src/features/auth/pages/RegisterPage.tsx`
3. `apps/web/src/features/auth/components/EmailPasswordForm.tsx`
4. `apps/web/src/features/auth/components/ResendConfirmationButton.tsx`

### Mobile App
5. `apps/mobile/src/features/auth/screens/LoginScreen.tsx`
6. `apps/mobile/src/features/auth/screens/RegisterScreen.tsx`

### Shared Packages
7. `packages/auth/src/api/auth-api.ts`

### Backend
8. `supabase/functions/client-logs/index.ts` (new)
9. `supabase/functions/performance-logs/index.ts` (new)

## Support & Questions

**Larry's Office Hours**: Always available for logging questions

Common questions:
- "How do I track custom events?" → Use `clientLogger.interaction()`
- "What if I need to log sensitive data?" → Don't. Use hashed IDs instead.
- "How do I view performance stats?" → `performanceMonitor.logSummary()`
- "Where do logs go?" → Configured monitoring service (Datadog/Sentry)

## Next Actions

1. **Now**: Review implementation guide
2. **Today**: Install package and test in development
3. **This week**: Implement client-side logging
4. **This week**: Add performance timing
5. **Next week**: Deploy to staging
6. **Next week**: Deploy to production
7. **Ongoing**: Monitor and iterate

---

**Mission**: Complete visibility into user experience and performance  
**Motto**: "If it's not logged, it didn't happen. If it's not structured, it can't be analyzed."  
**Status**: Ready to ship 🚀
