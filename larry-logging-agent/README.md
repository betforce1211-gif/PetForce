# 📊 Larry: The Logging & Observability Agent

> *If it's not logged, it didn't happen. If it's not structured, it can't be analyzed.*

Larry is a comprehensive logging and observability system powered by Claude Code. He ensures every application is properly instrumented, every log tells a story, and every issue can be traced back to its source.

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Structured Logging** | JSON format with consistent schemas |
| **Automatic Redaction** | Sensitive data never reaches logs |
| **Correlation IDs** | Trace requests across services |
| **Distributed Tracing** | W3C Trace Context support |
| **Metrics Collection** | RED metrics + business metrics |
| **Alerting** | Configurable alert rules |
| **Log Analysis** | Pattern recognition & anomaly detection |

## 📁 Package Contents

```
larry-logging-agent/
├── LARRY.md                              # Full logging documentation
├── CLAUDE.md                             # Claude Code agent configuration
├── QUICKSTART.md                         # 10-minute setup guide
├── .larry.yml                            # Larry configuration file
└── templates/
    ├── logger.ts.template                # Logger implementation
    └── request-logging.middleware.ts.template  # Request logging
```

## 🚀 Quick Start

### 1. Copy files to your repository

```bash
cp larry-logging-agent/.larry.yml your-repo/
cp larry-logging-agent/CLAUDE.md your-repo/
cp -r larry-logging-agent/templates your-repo/src/infrastructure/logging/
```

### 2. Configure for your project

```yaml
# .larry.yml
logging:
  level: 'info'
  format: 'json'
  
redaction:
  fields:
    - password
    - token
    - apiKey
```

### 3. Add logging to your app

```typescript
import { logger } from './infrastructure/logging/logger';
import { requestLoggingMiddleware } from './infrastructure/logging/middleware';

app.use(requestLoggingMiddleware);
```

**[📖 Full Setup Guide →](./QUICKSTART.md)**

## 📋 Log Levels

| Level | When to Use | Example |
|-------|-------------|---------|
| **FATAL** | System cannot continue | Database pool exhausted |
| **ERROR** | Operation failed | Payment processing failed |
| **WARN** | Unexpected but handled | Retry succeeded |
| **INFO** | Business events | User logged in |
| **DEBUG** | Diagnostic info | Cache hit/miss |
| **TRACE** | Detailed debugging | Loop iterations |

## 📝 Structured Log Format

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "INFO",
  "message": "User logged in successfully",
  "service": "auth-service",
  "environment": "production",
  "version": "2.3.1",
  "requestId": "req_abc123",
  "traceId": "trace_xyz789",
  "userId": "user_456",
  "duration": 234
}
```

## 🔒 Automatic Redaction

Larry automatically redacts sensitive fields:

```typescript
// Input
logger.info('User created', { 
  userId: '123', 
  password: 'secret123',
  apiKey: 'sk-12345' 
});

// Output
{
  "message": "User created",
  "userId": "123",
  "password": "[REDACTED]",
  "apiKey": "[REDACTED]"
}
```

### Redacted by Default
- `password`, `passwd`, `pwd`
- `token`, `accessToken`, `refreshToken`
- `apiKey`, `secretKey`
- `authorization`, `bearer`
- `creditCard`, `cardNumber`, `cvv`
- `ssn`, `socialSecurity`

## 🔗 Request Correlation

Every request gets correlation IDs:

```typescript
app.use(requestLoggingMiddleware);

app.get('/users/:id', (req, res) => {
  // Logger automatically includes requestId, traceId
  req.log.info('Fetching user', { userId: req.params.id });
  
  // Pass to downstream services
  await fetch(url, {
    headers: {
      'X-Request-Id': req.requestId,
      'X-Trace-Id': req.traceId,
    }
  });
});
```

## 📊 Metrics

Larry collects key metrics automatically:

### Request Metrics
- `http_requests_total` - Request count by method, path, status
- `http_request_duration_seconds` - Response time histogram

### Error Metrics
- `errors_total` - Error count by type and code

### Business Metrics
- Define your own with `business_` prefix

## 🚨 Alerting

Configure alerts in `.larry.yml`:

```yaml
alerting:
  rules:
    errorRate:
      threshold: 0.05  # 5%
      window: '5m'
      severity: 'critical'
      
    slowResponse:
      percentile: 95
      thresholdMs: 500
      severity: 'warning'
```

## 🤖 Using with Claude Code

```
You: Review the logging in our payment service

Larry: 📊 Log Analysis: Payment Service

✅ What's Working:
• Structured JSON logging
• Request correlation present
• Error logging with context

⚠️ Issues Found:

1. Line 45: Empty catch block
   ```typescript
   } catch (error) {
     throw error;  // ❌ Lost context!
   }
   ```
   
   Should be:
   ```typescript
   } catch (error) {
     logger.error('Payment failed', {
       error: serializeError(error),
       orderId,
       amount,
     });
     throw error;
   }
   ```

2. Line 78: Logging sensitive data
   `logger.info('Card processed', { cardNumber })`
   → Remove cardNumber or use last 4 digits only

Run 'larry instrument src/services/payment.ts' to fix.
```

## 📋 Larry's Commands

### Analysis
```bash
larry analyze levels           # Check log level usage
larry find unlogged-errors     # Find empty catch blocks
larry scan sensitive           # Find sensitive data in logs
larry analyze patterns         # Analyze log patterns
```

### Instrumentation
```bash
larry instrument "<file>"      # Add logging to file
larry add request-logging      # Add request middleware
larry add error-logging        # Add error middleware
```

### Configuration
```bash
larry check config             # Validate configuration
larry dashboard generate       # Generate Grafana dashboard
larry alert create "<n>" "<c>" # Create alert rule
```

## 🤝 Integration with Other Agents

| Agent | Integration |
|-------|-------------|
| **Engrid** | Adds logging to new code |
| **Tucker** | Uses logs to debug test failures |
| **Chuck** | Monitors logs during deployments |
| **Thomas** | Documents logging conventions |

## 🔧 Configuration

Larry uses `.larry.yml`:

```yaml
version: 1

logging:
  level: 'info'
  format: 'json'
  
redaction:
  fields:
    - password
    - token
    
tracing:
  enabled: true
  sampleRate: 0.1
  
metrics:
  enabled: true
  endpoint:
    path: '/metrics'
    
alerting:
  rules:
    errorRate:
      threshold: 0.05
```

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [LARRY.md](./LARRY.md) | Complete logging documentation |
| [CLAUDE.md](./CLAUDE.md) | Claude Code configuration |
| [QUICKSTART.md](./QUICKSTART.md) | 10-minute setup guide |

## 📋 Templates

| Template | Use For |
|----------|---------|
| `logger.ts.template` | Logger implementation |
| `request-logging.middleware.ts.template` | Request logging middleware |

---

<p align="center">
  <strong>Larry: Your Observability Partner</strong><br>
  <em>Making the invisible visible.</em>
</p>

---

*If it's not logged, it didn't happen. If it's not structured, it can't be analyzed.* 📊
