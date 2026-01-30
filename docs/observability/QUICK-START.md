# Enhanced Observability - Quick Start

**Time to first log**: 10 minutes  
**Time to full implementation**: 5-7 hours  
**Agent**: Larry

## 10-Minute Quick Start

### Step 1: Install (2 minutes)

```bash
cd /Users/danielzeddr/PetForce
pnpm install
```

### Step 2: Add to One Page (5 minutes)

Edit `/Users/danielzeddr/PetForce/apps/web/src/features/auth/pages/LoginPage.tsx`:

```typescript
import { usePageView, useTrackedClick } from '@petforce/observability';

export function LoginPage() {
  // Add this line
  usePageView('LoginPage');
  
  // Add this line
  const handleForgotPassword = useTrackedClick('forgot-password');
  
  return (
    <div>
      {/* ... existing code ... */}
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

### Step 3: Test (3 minutes)

```bash
# Start dev server
pnpm dev

# Open browser to http://localhost:5173/auth/login
# Open browser console
# You should see:
# [INFO] [page_view] Page view: LoginPage
# Click "Forgot password?" button
# [INFO] [user_interaction] Button clicked: forgot-password
```

Congratulations! You have client-side logging working.

## 1-Hour Implementation (Core Features)

### Add to All Auth Pages (20 minutes)

Add `usePageView()` to:
- ✅ LoginPage.tsx
- ✅ RegisterPage.tsx
- ✅ ForgotPasswordPage.tsx
- ✅ DashboardPage.tsx

```typescript
import { usePageView } from '@petforce/observability';

export function YourPage() {
  usePageView('YourPageName');
  // ... rest of component
}
```

### Add Form Tracking (20 minutes)

Edit `EmailPasswordForm.tsx`:

```typescript
import { useFormTracking } from '@petforce/observability';

export function EmailPasswordForm({ mode }: Props) {
  const { onSubmit, onError } = useFormTracking(`${mode}-form`);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await authenticate();
      onSubmit(); // Log success
    } catch (error) {
      onError(error.message); // Log error
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Add API Performance (20 minutes)

Edit `packages/auth/src/api/auth-api.ts`:

```typescript
import { performanceMonitor } from '@petforce/observability';

export async function loginWithPassword(credentials: LoginCredentials) {
  return performanceMonitor.measure('auth.login', async () => {
    // ... existing implementation
    return result;
  });
}

export async function registerWithPassword(credentials: RegisterCredentials) {
  return performanceMonitor.measure('auth.register', async () => {
    // ... existing implementation
    return result;
  });
}
```

Test in console:
```typescript
import { performanceMonitor } from '@petforce/observability';
performanceMonitor.logSummary();
// Shows: auth.login avg: 245ms, p95: 450ms
```

## 5-Hour Full Implementation

### Phase 1: Setup (30 min)
- [x] Install package
- [ ] Review implementation guide
- [ ] Create backend endpoints
- [ ] Configure endpoint URLs

### Phase 2: Client Logging (2 hours)
- [ ] Add to all pages (8 pages × 10 min)
- [ ] Add to all forms (4 forms × 15 min)
- [ ] Track key interactions (10 interactions × 5 min)

### Phase 3: Performance (1 hour)
- [ ] Wrap all API calls (8 calls × 5 min)
- [ ] Add hooks to components (4 components × 5 min)
- [ ] Test and validate (10 min)

### Phase 4: Backend (1 hour)
- [ ] Create client-logs function (20 min)
- [ ] Create performance-logs function (20 min)
- [ ] Deploy functions (10 min)
- [ ] Test endpoints (10 min)

### Phase 5: Monitoring (30 min)
- [ ] Create Datadog dashboard (15 min)
- [ ] Set up alerts (10 min)
- [ ] Test alerts (5 min)

## Key Files Reference

### Source Code (Already Created)
```
packages/observability/
├── src/
│   ├── client-logger.ts          ✅ Created
│   ├── performance-monitor.ts     ✅ Created
│   ├── react-hooks.ts             ✅ Created
│   └── index.ts                   ✅ Created
├── package.json                   ✅ Created
└── README.md                      ✅ Created
```

### Documentation (Already Created)
```
docs/observability/
├── IMPLEMENTATION-GUIDE.md        ✅ Created (comprehensive)
├── TASK-SUMMARY.md                ✅ Created (checklist)
├── VISUAL-SUMMARY.md              ✅ Created (diagrams)
├── CLIENT-SIDE-LOGGING.md         ✅ Created (reference)
└── QUICK-START.md                 ✅ This file
```

### Files to Create
```
supabase/functions/
├── client-logs/
│   └── index.ts                   ❌ To create
└── performance-logs/
    └── index.ts                   ❌ To create
```

### Files to Modify
```
apps/web/src/features/auth/
├── pages/
│   ├── LoginPage.tsx              ❌ Add usePageView()
│   ├── RegisterPage.tsx           ❌ Add usePageView()
│   ├── ForgotPasswordPage.tsx     ❌ Add usePageView()
│   └── DashboardPage.tsx          ❌ Add usePageView()
└── components/
    └── EmailPasswordForm.tsx      ❌ Add useFormTracking()

packages/auth/src/api/
└── auth-api.ts                    ❌ Add performanceMonitor.measure()
```

## Testing Checklist

### Development Testing
- [ ] Logs appear in browser console
- [ ] Network tab shows batch POST requests
- [ ] Performance stats show in console
- [ ] No errors in console
- [ ] PII is properly redacted

### Staging Testing
- [ ] Logs appear in Datadog
- [ ] Dashboard shows metrics
- [ ] Alerts trigger correctly
- [ ] Performance meets targets
- [ ] Error tracking works

### Production Validation
- [ ] Monitor for 24 hours
- [ ] Review error rates
- [ ] Check performance metrics
- [ ] Validate alert thresholds
- [ ] Iterate based on data

## Common Patterns

### Pattern 1: Simple Page
```typescript
import { usePageView } from '@petforce/observability';

export function SimplePage() {
  usePageView('SimplePage');
  return <div>Content</div>;
}
```

### Pattern 2: Page with Interactions
```typescript
import { usePageView, useTrackedClick } from '@petforce/observability';

export function InteractivePage() {
  usePageView('InteractivePage');
  const handleAction = useTrackedClick('action-button');
  
  return <button onClick={handleAction}>Action</button>;
}
```

### Pattern 3: Form
```typescript
import { useFormTracking } from '@petforce/observability';

export function MyForm() {
  const { onSubmit, onError } = useFormTracking('my-form');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await submit();
      onSubmit();
    } catch (error) {
      onError(error.message);
    }
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Pattern 4: API Wrapper
```typescript
import { performanceMonitor } from '@petforce/observability';

export async function myApiCall() {
  return performanceMonitor.measure('api.myCall', async () => {
    return await fetch('/api/endpoint');
  });
}
```

## Need Help?

### Documentation
- **Full Guide**: `docs/observability/IMPLEMENTATION-GUIDE.md`
- **Task List**: `docs/observability/TASK-SUMMARY.md`
- **Visuals**: `docs/observability/VISUAL-SUMMARY.md`
- **Package README**: `packages/observability/README.md`

### Agent Contact
- **Larry** - Logging & Observability Agent (always available)
- **Engrid** - Engineering implementation questions
- **Thomas** - Documentation updates

### Quick Questions
- "How do I log X?" → Check `packages/observability/README.md`
- "What's the API?" → Check `packages/observability/src/index.ts`
- "Where do logs go?" → Backend endpoint → Monitoring service
- "Is PII safe?" → Yes, automatic redaction

## Success Criteria

You're done when:
- [x] All source files created ✅
- [ ] LoginPage logs page views
- [ ] Forms track submissions
- [ ] API calls measure performance
- [ ] Backend endpoints deployed
- [ ] Logs appear in monitoring
- [ ] Dashboard created
- [ ] Alerts configured

## Next Steps

1. **Right now**: Do 10-minute quick start
2. **Today**: Complete 1-hour core features
3. **This week**: Full 5-hour implementation
4. **Next week**: Deploy to production
5. **Ongoing**: Monitor and iterate

---

**Ready to start?** Run the 10-minute quick start above! 🚀

**Questions?** See full documentation or contact Larry.

**Status**: Ready for implementation  
**Est. Time**: 5-7 hours total (or 10 min for quick win)
