# PII Protection & Redaction

Complete guide to protecting Personally Identifiable Information (PII) in logs.

---

## What is PII?

**Personally Identifiable Information (PII)** is any data that could identify a specific individual.

### PII Categories in PetForce

#### Direct Identifiers

- Full names
- Email addresses
- Phone numbers
- Physical addresses
- Social Security Numbers
- Government IDs

#### Quasi-Identifiers

- Household names (often contain family names)
- Pet names (sometimes contain owner names)
- Household descriptions
- User-generated content

#### Technical Identifiers

- IP addresses (partial redaction)
- Device IDs
- Session tokens
- Authentication tokens

#### Sensitive Data

- Passwords (never log!)
- API keys (never log!)
- Payment information
- Health information

---

## Why Redact PII?

### Legal Requirements

**GDPR (Europe)**:

- Data minimization principle
- Purpose limitation
- Right to be forgotten
- Data breach notification

**CCPA (California)**:

- Right to know
- Right to delete
- Right to opt-out
- Data sale disclosure

**Penalties**:

- GDPR: Up to €20M or 4% of revenue
- CCPA: Up to $7,500 per violation

### Security

- Logs are often accessible to many people
- Logs may be stored in third-party systems
- Logs may be retained longer than operational data
- Logs may be exposed in data breaches

### Trust

- Users trust us with their data
- Privacy-first approach builds confidence
- Transparency in data handling

---

## Redaction Strategy

### 1. Never Log These

```typescript
// ❌ NEVER LOG
-password -
  token -
  apiKey -
  secret -
  creditCard -
  ssn -
  authToken -
  sessionToken;
```

### 2. Always Redact These

```typescript
// ✅ ALWAYS REDACT
- email
- phone
- name (user names, household names, pet names)
- address
- ipAddress (anonymize to /24)
- userAgent (truncate identifying info)
```

### 3. Use Identifiers Instead

```typescript
// ❌ Bad
logger.info("User created household", {
  userName: "John Doe",
  email: "john@example.com",
  householdName: "The Doe Family",
});

// ✅ Good
logger.info("User created household", {
  userId: "user-123",
  householdId: "household-456",
  householdName: "[REDACTED]",
});
```

---

## Automatic Redaction

### Pino Logger Configuration

```typescript
// utils/logger.ts
import pino from "pino";

export const logger = pino({
  // Automatic field redaction
  redact: {
    paths: [
      // Authentication
      "password",
      "*.password",
      "token",
      "*.token",
      "apiKey",
      "*.apiKey",
      "secret",
      "*.secret",
      "authorization",
      "*.authorization",

      // Personal information
      "email",
      "*.email",
      "phone",
      "*.phone",
      "phoneNumber",
      "*.phoneNumber",
      "name",
      "*.name",
      "firstName",
      "*.firstName",
      "lastName",
      "*.lastName",
      "address",
      "*.address",

      // Household data
      "householdName",
      "*.householdName",
      "description",
      "*.description",

      // Headers
      "req.headers.authorization",
      "req.headers.cookie",
      'res.headers["set-cookie"]',
    ],
    // Remove field completely
    remove: true,
  },
});
```

### Custom Redaction Function

```typescript
// utils/redaction.ts

export interface RedactionOptions {
  replaceWith?: string;
  preserveLength?: boolean;
  maskCharacter?: string;
}

const DEFAULT_OPTIONS: RedactionOptions = {
  replaceWith: "[REDACTED]",
  preserveLength: false,
  maskCharacter: "*",
};

/**
 * Redact PII from objects for safe logging
 */
export function sanitizeForLogging<T extends Record<string, any>>(
  data: T,
  options: RedactionOptions = DEFAULT_OPTIONS,
): T {
  const { replaceWith, preserveLength, maskCharacter } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  // Deep clone to avoid mutating original
  const sanitized = JSON.parse(JSON.stringify(data));

  // Fields that should always be redacted
  const PII_FIELDS = new Set([
    "email",
    "phone",
    "phoneNumber",
    "name",
    "firstName",
    "lastName",
    "fullName",
    "householdName",
    "petName",
    "address",
    "street",
    "city",
    "state",
    "zip",
    "zipCode",
    "description",
    "bio",
    "notes",
  ]);

  // Fields that should never be logged
  const NEVER_LOG_FIELDS = new Set([
    "password",
    "token",
    "apiKey",
    "secret",
    "accessToken",
    "refreshToken",
    "authToken",
    "sessionToken",
    "creditCard",
    "ssn",
    "socialSecurity",
  ]);

  function redactValue(value: string): string {
    if (preserveLength) {
      return maskCharacter!.repeat(Math.min(value.length, 20));
    }
    return replaceWith!;
  }

  function processObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(processObject);
    }

    if (typeof obj === "object") {
      const processed: any = {};

      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();

        // Never log these fields - remove completely
        if (NEVER_LOG_FIELDS.has(lowerKey)) {
          continue;
        }

        // Redact PII fields
        if (PII_FIELDS.has(lowerKey)) {
          if (typeof value === "string") {
            processed[key] = redactValue(value);
          } else {
            processed[key] = replaceWith;
          }
        } else if (typeof value === "object") {
          processed[key] = processObject(value);
        } else {
          processed[key] = value;
        }
      }

      return processed;
    }

    return obj;
  }

  return processObject(sanitized);
}

/**
 * Redact email addresses
 */
export function redactEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "[REDACTED]";

  // Show first letter and domain
  return `${local[0]}***@${domain}`;
  // Example: "j***@example.com"
}

/**
 * Redact phone numbers
 */
export function redactPhone(phone: string): string {
  // Remove all non-numeric characters
  const digits = phone.replace(/\D/g, "");

  // Show last 4 digits only
  if (digits.length >= 4) {
    return `***-***-${digits.slice(-4)}`;
  }

  return "[REDACTED]";
}

/**
 * Anonymize IP address to /24 subnet
 */
export function anonymizeIP(ip: string): string {
  const parts = ip.split(".");
  if (parts.length === 4) {
    // IPv4: Keep first 3 octets
    return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  }

  // IPv6: Keep first 48 bits
  if (ip.includes(":")) {
    const segments = ip.split(":");
    return `${segments.slice(0, 3).join(":")}::`;
  }

  return "[REDACTED]";
}

/**
 * Truncate user agent to remove identifying info
 */
export function anonymizeUserAgent(userAgent: string): string {
  // Extract browser and OS only
  const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/[\d.]+/);
  const osMatch = userAgent.match(/(Windows|Mac|Linux|iOS|Android)[\s\d._]*/);

  const browser = browserMatch ? browserMatch[0] : "Unknown";
  const os = osMatch ? osMatch[0].split(/[\s\d]/)[0] : "Unknown";

  return `${browser} on ${os}`;
}
```

---

## Usage Examples

### Basic Usage

```typescript
import { sanitizeForLogging } from "@petforce/auth/utils/redaction";

const input = {
  name: "John Doe",
  email: "john@example.com",
  phone: "+1-555-123-4567",
  householdName: "The Doe Family",
  userId: "user-123", // Not PII - will not be redacted
};

logger.info("Creating household", {
  userId: input.userId,
  input: sanitizeForLogging(input),
});

// Logged output:
// {
//   userId: 'user-123',
//   input: {
//     name: '[REDACTED]',
//     email: '[REDACTED]',
//     phone: '[REDACTED]',
//     householdName: '[REDACTED]',
//     userId: 'user-123',
//   }
// }
```

### With Length Preservation

```typescript
const input = {
  name: "John",
  email: "john@example.com",
};

const redacted = sanitizeForLogging(input, {
  preserveLength: true,
  maskCharacter: "*",
});

// Output:
// {
//   name: '****',
//   email: '****************',
// }
```

### Specific Field Redaction

```typescript
import { redactEmail, redactPhone } from "@petforce/auth/utils/redaction";

logger.info("User login attempt", {
  userId: "user-123",
  email: redactEmail("john.doe@example.com"), // "j***@example.com"
  phone: redactPhone("+1-555-123-4567"), // "***-***-4567"
});
```

### Request Logging

```typescript
// middleware/request-logger.ts
import {
  anonymizeIP,
  anonymizeUserAgent,
} from "@petforce/auth/utils/redaction";

app.use((req, res, next) => {
  req.logger.info("Request received", {
    method: req.method,
    path: req.path,
    ip: anonymizeIP(req.ip), // "192.168.1.0"
    userAgent: anonymizeUserAgent(req.headers["user-agent"]), // "Chrome/120.0 on Mac"
    userId: req.user?.id,
  });

  next();
});
```

---

## Testing Redaction

```typescript
// tests/redaction.test.ts
import { sanitizeForLogging, redactEmail, redactPhone } from "../redaction";

describe("PII Redaction", () => {
  describe("sanitizeForLogging", () => {
    it("should redact email addresses", () => {
      const input = { email: "test@example.com" };
      const result = sanitizeForLogging(input);
      expect(result.email).toBe("[REDACTED]");
    });

    it("should redact phone numbers", () => {
      const input = { phone: "+1-555-123-4567" };
      const result = sanitizeForLogging(input);
      expect(result.phone).toBe("[REDACTED]");
    });

    it("should redact nested objects", () => {
      const input = {
        user: {
          name: "John Doe",
          email: "john@example.com",
          id: "user-123",
        },
      };
      const result = sanitizeForLogging(input);
      expect(result.user.name).toBe("[REDACTED]");
      expect(result.user.email).toBe("[REDACTED]");
      expect(result.user.id).toBe("user-123"); // Not redacted
    });

    it("should remove password fields completely", () => {
      const input = {
        email: "test@example.com",
        password: "secret123",
      };
      const result = sanitizeForLogging(input);
      expect(result).not.toHaveProperty("password");
    });

    it("should handle arrays", () => {
      const input = {
        users: [
          { name: "John", id: "user-1" },
          { name: "Jane", id: "user-2" },
        ],
      };
      const result = sanitizeForLogging(input);
      expect(result.users[0].name).toBe("[REDACTED]");
      expect(result.users[1].name).toBe("[REDACTED]");
      expect(result.users[0].id).toBe("user-1");
      expect(result.users[1].id).toBe("user-2");
    });
  });

  describe("redactEmail", () => {
    it("should show first letter and domain", () => {
      expect(redactEmail("john@example.com")).toBe("j***@example.com");
      expect(redactEmail("a@test.org")).toBe("a***@test.org");
    });
  });

  describe("redactPhone", () => {
    it("should show last 4 digits only", () => {
      expect(redactPhone("+1-555-123-4567")).toBe("***-***-4567");
      expect(redactPhone("5551234567")).toBe("***-***-4567");
    });
  });
});
```

---

## Compliance Checklist

### GDPR Compliance

- [ ] PII is automatically redacted in logs
- [ ] Passwords and tokens are never logged
- [ ] User data is deleted from logs on user deletion request
- [ ] Log retention policies are documented
- [ ] Data access is logged for auditing
- [ ] DPO contact information is available
- [ ] Data processing agreements with third parties (DataDog, AWS)

### CCPA Compliance

- [ ] PII is identified and tracked
- [ ] Users can request data deletion
- [ ] Third-party data sharing is disclosed
- [ ] Opt-out mechanism is provided
- [ ] Privacy policy is up to date

### Security Best Practices

- [ ] No secrets in logs (enforced by linter)
- [ ] IP addresses are anonymized
- [ ] User agents are truncated
- [ ] Logs are encrypted in transit (TLS)
- [ ] Logs are encrypted at rest (S3/DataDog)
- [ ] Access to logs is restricted (IAM/RBAC)
- [ ] Log access is audited

---

## Linting Rules

### ESLint Plugin

```json
// .eslintrc.json
{
  "plugins": ["no-secrets"],
  "rules": {
    "no-secrets/no-secrets": "error"
  }
}
```

### Pre-commit Hook

```bash
#!/bin/sh
# .husky/pre-commit

# Check for common secrets
if git diff --cached | grep -E "(password|token|apiKey|secret)\s*[:=]"; then
  echo "❌ Potential secret found in commit!"
  echo "Please review and use environment variables instead."
  exit 1
fi
```

---

## Incident Response

### If PII is Logged

1. **Immediate Actions**:
   - Identify affected logs
   - Delete logs from hot storage
   - Purge logs from warm/cold storage
   - Notify security team

2. **Assessment**:
   - Determine scope (how much PII, how many users)
   - Identify who accessed logs
   - Determine if breach notification required

3. **Remediation**:
   - Fix logging code to prevent recurrence
   - Add tests to prevent regression
   - Update redaction rules
   - Review similar code paths

4. **Notification** (if required):
   - GDPR: Within 72 hours of discovery
   - CCPA: Within reasonable timeframe
   - Affected users: As required by law

---

## Best Practices

### DO ✅

- Use IDs instead of names/emails
- Automatically redact known PII fields
- Test redaction in unit tests
- Document what is PII
- Train developers on PII handling
- Use linters to prevent secrets
- Encrypt logs in transit and at rest
- Restrict log access
- Anonymize IP addresses
- Truncate user agents

### DON'T ❌

- Log entire request/response bodies
- Log user input without sanitization
- Assume field names will catch all PII
- Log authentication tokens
- Log payment information
- Log health information
- Store logs longer than necessary
- Share logs with unauthorized parties
- Log PII to debug console
- Forget to redact error messages

---

## Related Documentation

- [Structured Logging Guide](./structured-logging.md)
- [Business Event Logging](./business-events.md)
- [Audit Logging](./audit-logging.md)
- [Log Retention Policies](./retention.md)

---

## Resources

- [GDPR Official Text](https://gdpr-info.eu/)
- [CCPA Official Text](https://oag.ca.gov/privacy/ccpa)
- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- [DataDog PII Scrubbing](https://docs.datadoghq.com/sensitive_data_scanner/)

---

Built with ❤️ by Larry (Logging & Observability Agent)

**Privacy First**: Trust is earned through responsible data handling. Redact by default, log by necessity.
