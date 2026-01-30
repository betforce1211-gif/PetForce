# @petforce/observability

Comprehensive logging, monitoring, and performance tracking for PetForce applications.

**Status**: Ready for use  
**Version**: 1.0.0  
**Maintainer**: Larry (Logging & Observability Agent)

## Features

- **Client-Side Logging**: Track user interactions, page views, and errors
- **Performance Monitoring**: Measure API latency and component render times
- **React Hooks**: Easy integration with React components
- **Automatic Batching**: Minimize network overhead
- **PII Protection**: Automatic redaction of sensitive data
- **Session Tracking**: Anonymous session correlation
- **TypeScript Support**: Full type definitions included

## Installation

```bash
pnpm add @petforce/observability
```

## Quick Start

### Track Page Views

```typescript
import { usePageView } from '@petforce/observability';

function LoginPage() {
  usePageView('LoginPage');
  return <div>Login</div>;
}
```

### Track Button Clicks

```typescript
import { useTrackedClick } from '@petforce/observability';

function MyButton() {
  const handleClick = useTrackedClick('submit-button');
  
  return (
    <button onClick={handleClick}>
      Submit
    </button>
  );
}
```

### Track API Calls

```typescript
import { useTrackedAPI } from '@petforce/observability';

function useAuth() {
  const { loginWithPassword } = useAuthAPI();
  
  // Wrap with performance tracking
  const trackedLogin = useTrackedAPI(loginWithPassword, 'auth.login');
  
  return { login: trackedLogin };
}
```

### Track Form Submissions

```typescript
import { useFormTracking } from '@petforce/observability';

function MyForm() {
  const { onSubmit, onError } = useFormTracking('registration-form');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await submitForm();
      onSubmit();
    } catch (error) {
      onError(error.message);
    }
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

## API Reference

### Client Logger

```typescript
import { clientLogger } from '@petforce/observability';

// Page views
clientLogger.pageView('ScreenName', { metadata });

// Button clicks
clientLogger.buttonClick('button-name', { context });

// Form events
clientLogger.formSubmit('form-name');
clientLogger.formError('form-name', 'error message');

// Navigation
clientLogger.navigate('/from', '/to');

// Interactions
clientLogger.interaction('action', 'component', { metadata });

// Errors
clientLogger.error('Error message', error, { context });

// Performance
clientLogger.performance('metric-name', duration, { metadata });

// Flush logs immediately
clientLogger.flush();
```

### Performance Monitor

```typescript
import { performanceMonitor } from '@petforce/observability';

// Manual timing
performanceMonitor.start('operation-name');
await doSomething();
performanceMonitor.end('operation-name');

// Automatic timing
await performanceMonitor.measure('operation', async () => {
  return await doSomething();
});

// Get statistics
const stats = performanceMonitor.getStats('operation-name');
// { count, min, max, avg, p50, p95, p99 }

// View summary
performanceMonitor.logSummary();
```

### React Hooks

```typescript
import {
  usePageView,
  useTrackedClick,
  useTrackedAPI,
  useFormTracking,
  useNavigationTracking,
  useErrorTracking,
  useRenderPerformance,
  useInteractionTracking,
  useLogFlush,
} from '@petforce/observability';

// See examples above
```

## Configuration

### Client Logger Endpoint

```typescript
import { ClientLogger } from '@petforce/observability';

const logger = new ClientLogger('/api/logs/client');
```

### Performance Monitor Endpoint

```typescript
import { PerformanceMonitor } from '@petforce/observability';

const monitor = new PerformanceMonitor('/api/logs/performance');
```

### Environment Variables

```bash
# Set in your .env file
VITE_CLIENT_LOGS_ENDPOINT=https://your-api.com/logs/client
VITE_PERFORMANCE_LOGS_ENDPOINT=https://your-api.com/logs/performance
```

## Backend Integration

### Create Log Endpoint

```typescript
// Express example
app.post('/api/logs/client', (req, res) => {
  const { logs } = req.body;
  
  logs.forEach(log => {
    // Send to monitoring service
    monitoring.sendLog({
      ...log,
      source: 'client',
    });
  });
  
  res.json({ success: true });
});
```

### Supabase Function Example

```typescript
// supabase/functions/client-logs/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const { logs } = await req.json();
  
  logs.forEach(log => {
    console.log(JSON.stringify(log));
  });
  
  return new Response(JSON.stringify({ success: true }));
});
```

## Privacy & Security

### PII Protection

The logger automatically protects:
- Email addresses (hashed)
- Passwords (never logged)
- Tokens (never logged)
- Credit cards (never logged)
- Pet health data (never logged)

### Session Tracking

- Anonymous session IDs
- Stored in sessionStorage
- Cleared on browser close
- Not tied to user identity

### GDPR Compliance

- No personal data in logs
- Automatic PII redaction
- Clear data retention policies
- User data deletion support

## Performance

### Batching

Logs are batched to minimize network overhead:
- **Batch Size**: 10 logs
- **Batch Timeout**: 5 seconds
- **Auto-flush**: On page unload

### Overhead

Minimal impact on application performance:
- Logging: < 1ms per log
- Batching: Async, non-blocking
- Network: 1 request per 10 logs

## Monitoring Dashboards

### Datadog Example

```
Page Views: count(category:page_view)
Button Clicks: count(category:user_interaction action:click)
Form Submissions: count(category:form action:submit)
Client Errors: count(level:ERROR source:client)
```

### Key Metrics to Track

1. Page views by screen
2. Button click rates
3. Form submission rates
4. Form validation errors
5. Client-side errors
6. API call latency (p50, p95, p99)
7. Component render times

## Examples

See `/Users/danielzeddr/PetForce/docs/observability/` for:
- Complete implementation guide
- Client-side logging examples
- Performance monitoring examples
- Backend integration examples

## Testing

```typescript
import { clientLogger, performanceMonitor } from '@petforce/observability';

// Test client logger
clientLogger.pageView('TestPage');
clientLogger.buttonClick('test-button');
clientLogger.flush();

// Test performance monitor
performanceMonitor.start('test-op');
await someOperation();
const duration = performanceMonitor.end('test-op');
console.log(`Duration: ${duration}ms`);
```

## Troubleshooting

### Logs not appearing?

1. Check network tab for POST requests
2. Verify endpoint URL is correct
3. Check browser console for errors
4. Test with `clientLogger.flush()`

### Performance stats not working?

1. Ensure `start()` called before `end()`
2. Check operation name matches
3. Use `logSummary()` to debug

### High log volume?

1. Reduce debug logging
2. Increase batch size
3. Add sampling for high-frequency events

## Support

Questions? See:
- Implementation guide: `/docs/observability/IMPLEMENTATION-GUIDE.md`
- Task summary: `/docs/observability/TASK-SUMMARY.md`
- Contact Larry (Logging Agent)

## License

Internal use only - PetForce project

---

**Status**: Production ready  
**Last updated**: 2026-01-25  
**Version**: 1.0.0
