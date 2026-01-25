# Larry Logging Agent - Quick Start Guide

Get proper logging set up in your application in 10 minutes.

## Prerequisites

- Node.js/TypeScript project
- Express or similar web framework (optional)

---

## Step 1: Add Configuration

### Copy the configuration file:

```bash
cp larry-logging-agent/.larry.yml your-repo/
```

### Customize for your project:

```yaml
# .larry.yml
version: 1

logging:
  level: 'info'           # Minimum level to log
  format: 'json'          # json for production, pretty for dev
  
redaction:
  fields:
    - password
    - token
    - apiKey
    - secret
    # Add any project-specific sensitive fields
```

---

## Step 2: Set Up the Logger

### Copy the logger template:

```bash
mkdir -p src/infrastructure/logging
cp larry-logging-agent/templates/logger.ts.template \
   src/infrastructure/logging/logger.ts
```

### Update the imports:

```typescript
// src/infrastructure/logging/logger.ts

// Update config import to match your project
import { config } from '@/config';  // Your config module
```

### Create a simple config if needed:

```typescript
// src/config/index.ts (if you don't have one)
export const config = {
  get: (key: string, defaultValue?: any) => {
    const envMap: Record<string, any> = {
      'logging.level': process.env.LOG_LEVEL || 'info',
      'logging.format': process.env.LOG_FORMAT || 'json',
      'service.name': process.env.SERVICE_NAME || 'my-service',
      'service.version': process.env.SERVICE_VERSION || '1.0.0',
      'env': process.env.NODE_ENV || 'development',
    };
    return envMap[key] ?? defaultValue;
  },
};
```

---

## Step 3: Add Request Logging (Express)

### Copy the middleware:

```bash
cp larry-logging-agent/templates/request-logging.middleware.ts.template \
   src/infrastructure/logging/request-logging.middleware.ts
```

### Add to your Express app:

```typescript
// src/app.ts
import express from 'express';
import { 
  requestLoggingMiddleware, 
  errorLoggingMiddleware 
} from './infrastructure/logging/request-logging.middleware';

const app = express();

// Add request logging (BEFORE routes)
app.use(requestLoggingMiddleware);

// Your routes
app.use('/api', routes);

// Add error logging (AFTER routes)
app.use(errorLoggingMiddleware);
```

---

## Step 4: Use the Logger

### Basic Usage

```typescript
import { logger } from '@/infrastructure/logging/logger';

// Simple logging
logger.info('Application started');

// With context
logger.info('User logged in', { 
  userId: user.id,
  method: 'password',
});

// Error logging
try {
  await processPayment(order);
} catch (error) {
  logger.error('Payment failed', {
    error: {
      name: error.name,
      message: error.message,
      code: error.code,
    },
    orderId: order.id,
    amount: order.total,
  });
  throw error;
}
```

### In Request Handlers

```typescript
// The request logger includes correlation IDs automatically
app.get('/users/:id', async (req, res) => {
  // Use req.log instead of logger
  req.log.info('Fetching user', { userId: req.params.id });
  
  const user = await userService.findById(req.params.id);
  
  if (!user) {
    req.log.warn('User not found', { userId: req.params.id });
    return res.status(404).json({ error: 'Not found' });
  }
  
  req.log.debug('User fetched successfully', { 
    userId: user.id,
    email: user.email, // Will be redacted if configured
  });
  
  res.json(user);
});
```

### Child Loggers

```typescript
// Create a child logger with service context
const paymentLogger = logger.child({ 
  module: 'payment-service',
  gateway: 'stripe',
});

paymentLogger.info('Processing payment', { orderId });
// Output includes: module: 'payment-service', gateway: 'stripe'
```

### Timing Operations

```typescript
// Async timing
const result = await logger.time(
  'database-query',
  async () => db.users.findMany(),
  { table: 'users' }
);

// Output: "database-query completed" with duration
```

---

## Step 5: Environment Configuration

### Development `.env`:

```bash
LOG_LEVEL=debug
LOG_FORMAT=pretty
SERVICE_NAME=my-service
SERVICE_VERSION=1.0.0
NODE_ENV=development
```

### Production `.env`:

```bash
LOG_LEVEL=info
LOG_FORMAT=json
SERVICE_NAME=my-service
SERVICE_VERSION=1.0.0
NODE_ENV=production
```

---

## Log Level Quick Reference

| Level | When to Use | Examples |
|-------|-------------|----------|
| `fatal` | System unusable | OOM, DB pool exhausted |
| `error` | Operation failed | Unhandled exception, API failure |
| `warn` | Unexpected but OK | Retry succeeded, deprecated API |
| `info` | Business events | Login, order placed, job done |
| `debug` | Diagnostics | Cache hit/miss, SQL queries |
| `trace` | Deep debugging | Loop iterations, raw data |

---

## Common Patterns

### Logging Errors Properly

```typescript
// ❌ Bad
catch (error) {
  logger.error('Failed');
  throw error;
}

// ✅ Good
catch (error) {
  logger.error('Payment processing failed', {
    error: {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack,
    },
    orderId,
    amount,
    customerId,
  });
  throw error;
}
```

### Logging External Calls

```typescript
// ✅ Log external API calls with timing
const start = Date.now();
try {
  const response = await fetch(externalApi);
  logger.info('External API call succeeded', {
    api: 'stripe',
    endpoint: '/charges',
    statusCode: response.status,
    duration: Date.now() - start,
  });
} catch (error) {
  logger.error('External API call failed', {
    api: 'stripe',
    endpoint: '/charges',
    duration: Date.now() - start,
    error: { name: error.name, message: error.message },
  });
  throw error;
}
```

### Business Event Logging

```typescript
// ✅ Log important business events
logger.info('Order placed', {
  event: 'order.created',
  orderId: order.id,
  customerId: order.customerId,
  itemCount: order.items.length,
  total: order.total,
  currency: order.currency,
});

logger.info('Payment processed', {
  event: 'payment.succeeded',
  orderId: order.id,
  paymentId: payment.id,
  amount: payment.amount,
  method: payment.method,
});
```

---

## Verify It's Working

### Check log output:

```bash
# Run your app
npm run dev

# You should see logs like:
{"timestamp":"2024-01-15T10:30:45.123Z","level":"INFO","message":"Application started","service":"my-service",...}
{"timestamp":"2024-01-15T10:30:46.456Z","level":"INFO","message":"Request received","method":"GET","path":"/api/users",...}
```

### Test redaction:

```typescript
logger.info('Test redaction', {
  password: 'secret123',
  apiKey: 'sk-12345',
  normalField: 'visible',
});

// Output should show:
// password: "[REDACTED]"
// apiKey: "[REDACTED]"
// normalField: "visible"
```

---

## Next Steps

1. 📖 Read the full [LARRY.md](./LARRY.md) documentation
2. 📊 Set up metrics collection
3. 🔔 Configure alerting
4. 📈 Create dashboards
5. 🔍 Add distributed tracing

---

## Troubleshooting

### Logs not appearing?
- Check `LOG_LEVEL` environment variable
- Ensure logger is imported correctly
- Check console output destination

### Sensitive data in logs?
- Add field to `redaction.fields` in `.larry.yml`
- Check nested objects are being redacted
- Review log statements for accidental exposure

### Missing request IDs?
- Ensure `requestLoggingMiddleware` is added before routes
- Check headers are being propagated to downstream services

---

*Larry: If it's not logged, it didn't happen.* 📊
