# Structured Logging Guide

Complete guide to implementing structured logging in PetForce.

---

## What is Structured Logging?

Structured logging means logging data in a structured format (JSON) rather than plain text strings.

### ❌ Bad (Unstructured)

```typescript
console.log('User 123 created household "The Zeder House" in 150ms');
```

**Problems**:

- Hard to parse
- Hard to query
- Hard to aggregate
- No type safety

### ✅ Good (Structured)

```typescript
logger.info("Household created", {
  userId: "user-123",
  householdId: "household-456",
  householdName: "[REDACTED]",
  duration_ms: 150,
  timestamp: "2026-02-02T10:30:00Z",
});
```

**Benefits**:

- Machine-parseable
- Easy to query (`userId:user-123`)
- Easy to aggregate (`AVG(duration_ms)`)
- Type-safe

---

## Log Format Standard

All logs MUST follow this format:

```typescript
{
  // Required fields
  timestamp: string;      // ISO 8601
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  message: string;        // Human-readable description

  // Optional context
  correlationId?: string; // Request tracing
  userId?: string;        // User performing action
  householdId?: string;   // Household context
  event?: string;         // Business event name

  // Operation metadata
  duration_ms?: number;   // Operation duration
  statusCode?: number;    // HTTP status
  errorCode?: string;     // Application error code

  // Error details
  error?: string;         // Error message
  stack?: string;         // Stack trace
  errorCategory?: string; // Error classification

  // Additional context
  [key: string]: any;     // Other relevant data
}
```

---

## Logger Interface

### Basic Usage

```typescript
import { logger } from "@petforce/auth/utils/logger";

// Info level
logger.info("User logged in", { userId: "user-123" });

// Warning level
logger.warn("Rate limit approaching", {
  userId: "user-123",
  currentRate: 95,
  limit: 100,
});

// Error level
logger.error("Failed to create household", {
  userId: "user-123",
  error: error.message,
  stack: error.stack,
});

// Debug level (development only)
logger.debug("Processing input", {
  input: sanitizeForLogging(input),
});
```

### With Correlation ID

```typescript
// In API routes (Express)
app.use((req, res, next) => {
  req.correlationId = generateCorrelationId();
  res.setHeader("X-Correlation-ID", req.correlationId);
  next();
});

// In request handler
logger.info("API request received", {
  correlationId: req.correlationId,
  method: req.method,
  path: req.path,
  userId: req.user?.id,
});
```

### With Context Propagation

```typescript
// Create logger with persistent context
const contextLogger = logger.child({
  correlationId: req.correlationId,
  userId: req.user?.id,
  householdId: req.params.householdId,
});

// All logs include context automatically
contextLogger.info("Starting household update");
// Logs: { correlationId: '...', userId: '...', householdId: '...', message: '...' }

contextLogger.info("Household updated successfully");
// Logs: { correlationId: '...', userId: '...', householdId: '...', message: '...' }
```

---

## Correlation IDs

Correlation IDs trace requests across services and operations.

### Format

```typescript
// Format: req-{timestamp}-{random}
const correlationId = `req-${Date.now()}-${randomString(8)}`;
// Example: "req-1706802345678-a3f9c2b1"
```

### Implementation

```typescript
// middleware/correlation-id.ts
import { Request, Response, NextFunction } from "express";
import { randomBytes } from "crypto";

export function correlationIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Use existing correlation ID from header or generate new one
  req.correlationId =
    req.header("X-Correlation-ID") ||
    `req-${Date.now()}-${randomBytes(4).toString("hex")}`;

  // Set response header
  res.setHeader("X-Correlation-ID", req.correlationId);

  // Add to request logger
  req.logger = logger.child({ correlationId: req.correlationId });

  next();
}
```

### Usage

```typescript
// In route handler
app.post("/api/households/create", async (req, res) => {
  req.logger.info("Creating household", {
    userId: req.user.id,
    input: sanitizeForLogging(req.body),
  });

  try {
    const household = await createHousehold(req.body, req.logger);

    req.logger.info("Household created successfully", {
      householdId: household.id,
      duration_ms: Date.now() - startTime,
    });

    res.status(201).json(household);
  } catch (error) {
    req.logger.error("Household creation failed", {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({ error: "Internal server error" });
  }
});
```

### Querying by Correlation ID

```bash
# In DataDog
correlationId:req-1706802345678-a3f9c2b1

# In CloudWatch Insights
fields @timestamp, @message
| filter correlationId = "req-1706802345678-a3f9c2b1"
| sort @timestamp asc
```

---

## TypeScript Types

### Log Entry Types

```typescript
// types/logging.ts

export type LogLevel = "ERROR" | "WARN" | "INFO" | "DEBUG";

export interface BaseLogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  correlationId?: string;
  userId?: string;
  householdId?: string;
}

export interface ErrorLogEntry extends BaseLogEntry {
  level: "ERROR";
  error: string;
  stack?: string;
  errorCode?: string;
  errorCategory: "database" | "validation" | "auth" | "network" | "internal";
  retryable: boolean;
}

export interface BusinessEventLogEntry extends BaseLogEntry {
  level: "INFO";
  event: string; // e.g., 'household.created'
  duration_ms?: number;
  metadata?: Record<string, any>;
}

export interface PerformanceLogEntry extends BaseLogEntry {
  level: "INFO" | "WARN";
  operation: string;
  duration_ms: number;
  threshold_ms: number;
  exceeded: boolean;
}

export interface AuditLogEntry extends BaseLogEntry {
  level: "INFO";
  action: string; // e.g., 'household.member.removed'
  actor: string; // userId
  target?: string; // affected resource ID
  before?: any; // state before action
  after?: any; // state after action
}
```

### Logger Interface

```typescript
// utils/logger.ts

export interface Logger {
  info(message: string, context?: Record<string, any>): void;
  warn(message: string, context?: Record<string, any>): void;
  error(message: string, context?: Record<string, any>): void;
  debug(message: string, context?: Record<string, any>): void;

  child(context: Record<string, any>): Logger;
}

// Implementation using pino (high-performance logger)
import pino from "pino";

const baseLogger = pino({
  level: process.env.LOG_LEVEL || "info",
  formatters: {
    level: (label) => ({ level: label.toUpperCase() }),
  },
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
  redact: {
    paths: [
      "password",
      "token",
      "secret",
      "apiKey",
      "*.password",
      "*.token",
      "*.secret",
      "*.email", // Redact all email fields
      "*.phone", // Redact all phone fields
      "*.name", // Redact all name fields
    ],
    remove: true,
  },
});

export const logger: Logger = {
  info: (message, context) => baseLogger.info(context, message),
  warn: (message, context) => baseLogger.warn(context, message),
  error: (message, context) => baseLogger.error(context, message),
  debug: (message, context) => baseLogger.debug(context, message),
  child: (context) => {
    const childLogger = baseLogger.child(context);
    return {
      info: (message, ctx) => childLogger.info(ctx, message),
      warn: (message, ctx) => childLogger.warn(ctx, message),
      error: (message, ctx) => childLogger.error(ctx, message),
      debug: (message, ctx) => childLogger.debug(ctx, message),
      child: (ctx) => logger.child({ ...context, ...ctx }),
    };
  },
};
```

---

## Context Propagation

Context propagation ensures logs include relevant context throughout the request lifecycle.

### Async Context Tracking

```typescript
// Use AsyncLocalStorage for automatic context propagation
import { AsyncLocalStorage } from "async_hooks";

interface LogContext {
  correlationId: string;
  userId?: string;
  householdId?: string;
}

const logContext = new AsyncLocalStorage<LogContext>();

export function runWithContext<T>(context: LogContext, fn: () => T): T {
  return logContext.run(context, fn);
}

export function getLogContext(): LogContext | undefined {
  return logContext.getStore();
}

// Enhanced logger that automatically includes context
export const contextAwareLogger: Logger = {
  info: (message, context) => {
    const asyncContext = getLogContext();
    logger.info(message, { ...asyncContext, ...context });
  },
  warn: (message, context) => {
    const asyncContext = getLogContext();
    logger.warn(message, { ...asyncContext, ...context });
  },
  error: (message, context) => {
    const asyncContext = getLogContext();
    logger.error(message, { ...asyncContext, ...context });
  },
  debug: (message, context) => {
    const asyncContext = getLogContext();
    logger.debug(message, { ...asyncContext, ...context });
  },
  child: (context) => {
    const asyncContext = getLogContext();
    return logger.child({ ...asyncContext, ...context });
  },
};
```

### Usage with Async Context

```typescript
// In middleware
app.use((req, res, next) => {
  const context: LogContext = {
    correlationId: req.correlationId,
    userId: req.user?.id,
  };

  runWithContext(context, () => next());
});

// In any function (context auto-included)
async function createHousehold(input: CreateHouseholdInput) {
  // No need to pass correlationId manually
  contextAwareLogger.info('Creating household', {
    input: sanitizeForLogging(input),
  });
  // Logs: { correlationId: 'req-...', userId: 'user-...', message: '...', input: {...} }

  const household = await db.insert(...);

  contextAwareLogger.info('Household created', {
    householdId: household.id,
  });
  // Logs: { correlationId: 'req-...', userId: 'user-...', householdId: 'household-...', message: '...' }

  return household;
}
```

---

## Log Levels Deep Dive

### ERROR - System Failures

**When to use**:

- Exceptions thrown
- Operation failed
- Data corruption detected
- External service failures
- Security violations

**Example**:

```typescript
logger.error("Database connection failed", {
  errorCategory: "database",
  errorCode: "ECONNREFUSED",
  error: error.message,
  stack: error.stack,
  retryable: true,
  host: process.env.DB_HOST,
});
```

### WARN - Recoverable Issues

**When to use**:

- Degraded performance
- Fallback activated
- Approaching limits
- Deprecated features used
- Unusual patterns detected

**Example**:

```typescript
logger.warn("Falling back to cached data", {
  reason: "Database query timeout",
  householdId: household.id,
  cacheAge_seconds: 300,
});
```

### INFO - Business Events

**When to use**:

- State changes
- Key operations completed
- Business events
- Configuration changes
- User actions

**Example**:

```typescript
logger.info("Household member added", {
  event: "household.member.added",
  householdId: household.id,
  memberId: member.id,
  role: member.role,
  addedBy: req.user.id,
});
```

### DEBUG - Development Details

**When to use** (development only):

- Function entry/exit
- Variable values
- Detailed flow
- Troubleshooting

**Example**:

```typescript
logger.debug("Processing household input", {
  input: sanitizeForLogging(input),
  validationRules: rules,
});
```

**Important**: DEBUG logs should never run in production (performance impact).

---

## Performance Considerations

### 1. Lazy Evaluation

```typescript
// ❌ Bad - Always evaluates even if debug is disabled
logger.debug("Processing", { data: expensiveOperation() });

// ✅ Good - Only evaluates if debug enabled
if (logger.isDebugEnabled()) {
  logger.debug("Processing", { data: expensiveOperation() });
}
```

### 2. Sampling

```typescript
// Log only 10% of successful operations
if (Math.random() < 0.1) {
  logger.info("Operation completed", { duration_ms });
}

// Always log errors
if (error) {
  logger.error("Operation failed", { error: error.message });
}
```

### 3. Async Logging

```typescript
// Use async transports to avoid blocking
const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      destination: "./logs/app.log",
      async: true, // Non-blocking writes
    },
  },
});
```

### 4. Redaction Performance

```typescript
// ❌ Bad - Redacts entire object deeply
logger.info("Request", { body: sanitizeForLogging(req.body) });

// ✅ Good - Only redact specific fields
logger.info("Request", {
  bodySize: JSON.stringify(req.body).length,
  fieldCount: Object.keys(req.body).length,
  // Don't log full body
});
```

---

## Testing Structured Logs

### Unit Tests

```typescript
// tests/logging.test.ts
import { logger } from "@petforce/auth/utils/logger";

describe("Structured Logging", () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(logger, "info");
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it("should log household creation with correct structure", async () => {
    await createHousehold(input);

    expect(logSpy).toHaveBeenCalledWith(
      "Household created",
      expect.objectContaining({
        householdId: expect.any(String),
        userId: expect.any(String),
        event: "household.created",
        duration_ms: expect.any(Number),
      }),
    );
  });

  it("should include correlation ID in logs", async () => {
    const correlationId = "test-correlation-id";
    await runWithContext({ correlationId }, async () => {
      contextAwareLogger.info("Test message");
    });

    expect(logSpy).toHaveBeenCalledWith(
      "Test message",
      expect.objectContaining({
        correlationId: "test-correlation-id",
      }),
    );
  });
});
```

---

## Migration from Console.log

### Step 1: Find All console.log

```bash
# Find all console.log/warn/error
grep -r "console\." packages/auth/src --exclude-dir=node_modules
```

### Step 2: Replace with Structured Logs

```typescript
// Before
console.log("User created household:", household.id);

// After
logger.info("Household created", {
  householdId: household.id,
  userId: user.id,
});
```

### Step 3: Add Context

```typescript
// Before
console.error("Failed to create household", error);

// After
logger.error("Household creation failed", {
  error: error.message,
  stack: error.stack,
  errorCategory: categorizeError(error),
  userId: user.id,
  input: sanitizeForLogging(input),
});
```

### Step 4: Remove console.\* with Lint Rule

```json
// .eslintrc.json
{
  "rules": {
    "no-console": [
      "error",
      {
        "allow": [] // No console.* allowed
      }
    ]
  }
}
```

---

## Best Practices Checklist

- [ ] Use structured JSON format
- [ ] Include correlation IDs in all logs
- [ ] Redact PII automatically
- [ ] Categorize errors
- [ ] Log business events
- [ ] Include duration for operations
- [ ] Use appropriate log levels
- [ ] Test log output in unit tests
- [ ] Don't log sensitive data (passwords, tokens)
- [ ] Don't log entire request/response bodies
- [ ] Use child loggers for context propagation
- [ ] Sample high-volume logs
- [ ] Use async transports in production
- [ ] Set up log-based alerts
- [ ] Document event schemas

---

## Related Documentation

- [Business Event Logging](./business-events.md)
- [PII Protection](./pii-redaction.md)
- [Error Logging](./error-logging.md)
- [Performance Logging](./performance-logging.md)

---

Built with ❤️ by Larry (Logging & Observability Agent)
