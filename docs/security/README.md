# Security Guide

> **Samantha's Security Philosophy**: "Security isn't a feature—it's a fundamental design principle. Build it in from day one, not bolt it on later."

This guide covers PetForce's comprehensive security strategy, from secure architecture to incident response.

## Table of Contents

- [Security Principles](#security-principles)
- [Security Architecture](#security-architecture)
- [Authentication & Authorization](#authentication--authorization)
- [OWASP Top 10 Protection](#owasp-top-10-protection)
- [Secure Coding Practices](#secure-coding-practices)
- [Data Protection](#data-protection)
- [API Security](#api-security)
- [Infrastructure Security](#infrastructure-security)
- [Security Monitoring](#security-monitoring)
- [Incident Response](#incident-response)
- [Compliance & Privacy](#compliance--privacy)
- [Security Testing](#security-testing)
- [Security Checklists](#security-checklists)

## Security Principles

### Defense in Depth

Multiple layers of security controls:

1. **Perimeter Security**: Firewalls, WAF, DDoS protection
2. **Network Security**: VPC isolation, security groups, NACLs
3. **Application Security**: Input validation, output encoding, authentication
4. **Data Security**: Encryption at rest and in transit, tokenization
5. **Monitoring & Detection**: SIEM, IDS/IPS, anomaly detection
6. **Incident Response**: Runbooks, automated remediation, forensics

### Security by Default

- **Secure defaults**: New users have minimal permissions
- **Fail securely**: Errors don't expose sensitive information
- **Least privilege**: Grant minimum necessary permissions
- **Zero trust**: Verify every request, trust nothing

### Shift Left Security

- **Security in design**: Threat modeling during planning
- **Secure coding**: Static analysis during development
- **Security testing**: SAST/DAST in CI/CD pipeline
- **Pre-production scanning**: Vulnerability scanning before deployment

## Security Architecture

### Trust Boundaries

```
┌─────────────────────────────────────────────────────────┐
│  Internet (Untrusted)                                    │
└─────────────────┬───────────────────────────────────────┘
                  │
      ┌───────────▼────────────┐
      │   CDN / WAF            │  ← DDoS protection, rate limiting
      └───────────┬────────────┘
                  │
      ┌───────────▼────────────┐
      │   Load Balancer        │  ← TLS termination, health checks
      └───────────┬────────────┘
                  │
      ┌───────────▼────────────┐
      │   API Gateway          │  ← Authentication, authorization
      └───────────┬────────────┘
                  │
      ┌───────────▼────────────┐
      │   Application Tier     │  ← Business logic (trusted)
      └───────────┬────────────┘
                  │
      ┌───────────▼────────────┐
      │   Database Tier        │  ← Data at rest encryption
      └────────────────────────┘
```

### Security Zones

**DMZ (Demilitarized Zone)**:

- Public-facing web servers
- Load balancers
- WAF

**Application Zone**:

- Application servers
- API services
- Background workers

**Data Zone**:

- Databases
- Cache servers
- File storage

**Management Zone**:

- Bastion hosts
- Monitoring systems
- Logging infrastructure

## Authentication & Authorization

### Authentication Strategy

**Multi-Factor Authentication (MFA)**:

```typescript
interface AuthenticationResult {
  user: User;
  requiresMfa: boolean;
  mfaToken?: string;
}

async function authenticate(
  email: string,
  password: string,
): Promise<AuthenticationResult> {
  // Step 1: Verify password
  const user = await verifyPassword(email, password);
  if (!user) {
    throw new AuthError("Invalid credentials");
  }

  // Step 2: Check if MFA is required
  if (user.mfa_enabled) {
    const mfaToken = await generateMfaToken(user.id);
    return {
      user,
      requiresMfa: true,
      mfaToken,
    };
  }

  // Step 3: Create session
  const session = await createSession(user.id);
  return {
    user,
    requiresMfa: false,
  };
}

async function verifyMfa(
  userId: string,
  mfaToken: string,
  code: string,
): Promise<Session> {
  // Verify TOTP code
  const isValid = await verifyTotpCode(userId, code);
  if (!isValid) {
    throw new AuthError("Invalid MFA code");
  }

  // Create session after successful MFA
  return await createSession(userId);
}
```

**Password Security**:

```typescript
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12; // Cost factor (higher = more secure but slower)

async function hashPassword(password: string): Promise<string> {
  // Validate password strength
  if (!isStrongPassword(password)) {
    throw new Error("Password does not meet security requirements");
  }

  // Hash with bcrypt
  return await bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  // Use constant-time comparison to prevent timing attacks
  return await bcrypt.compare(password, hash);
}

function isStrongPassword(password: string): boolean {
  // At least 8 characters
  if (password.length < 8) return false;

  // Contains uppercase
  if (!/[A-Z]/.test(password)) return false;

  // Contains lowercase
  if (!/[a-z]/.test(password)) return false;

  // Contains number
  if (!/[0-9]/.test(password)) return false;

  // Contains special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false;

  // Not a common password
  if (isCommonPassword(password)) return false;

  return true;
}
```

**Session Management**:

```typescript
interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress: string;
  userAgent: string;
}

async function createSession(
  userId: string,
  ipAddress: string,
  userAgent: string,
): Promise<Session> {
  // Generate cryptographically secure token
  const token = await generateSecureToken();

  // Session expires after 24 hours of inactivity
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const session = await db
    .insert(sessions)
    .values({
      userId,
      token: await hashToken(token), // Store hashed token
      expiresAt,
      ipAddress,
      userAgent,
    })
    .returning();

  return {
    ...session[0],
    token, // Return plain token to user
  };
}

async function validateSession(token: string): Promise<User | null> {
  const hashedToken = await hashToken(token);

  const session = await db.query.sessions.findFirst({
    where: and(
      eq(sessions.token, hashedToken),
      gt(sessions.expiresAt, new Date()),
    ),
    with: { user: true },
  });

  if (!session) {
    return null;
  }

  // Extend session expiration on activity
  await db
    .update(sessions)
    .set({ expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) })
    .where(eq(sessions.id, session.id));

  return session.user;
}
```

### Authorization (RBAC)

**Role-Based Access Control**:

```typescript
enum Role {
  OWNER = "owner",
  ADMIN = "admin",
  MEMBER = "member",
  GUEST = "guest",
}

enum Permission {
  // Household permissions
  HOUSEHOLD_READ = "household:read",
  HOUSEHOLD_UPDATE = "household:update",
  HOUSEHOLD_DELETE = "household:delete",

  // Member permissions
  MEMBER_INVITE = "member:invite",
  MEMBER_REMOVE = "member:remove",
  MEMBER_UPDATE_ROLE = "member:update_role",

  // Pet permissions
  PET_CREATE = "pet:create",
  PET_READ = "pet:read",
  PET_UPDATE = "pet:update",
  PET_DELETE = "pet:delete",

  // Task permissions
  TASK_CREATE = "task:create",
  TASK_UPDATE = "task:update",
  TASK_DELETE = "task:delete",
  TASK_COMPLETE = "task:complete",
}

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.OWNER]: [
    // Owners can do everything
    ...Object.values(Permission),
  ],
  [Role.ADMIN]: [
    Permission.HOUSEHOLD_READ,
    Permission.HOUSEHOLD_UPDATE,
    Permission.MEMBER_INVITE,
    Permission.MEMBER_REMOVE,
    Permission.PET_CREATE,
    Permission.PET_READ,
    Permission.PET_UPDATE,
    Permission.PET_DELETE,
    Permission.TASK_CREATE,
    Permission.TASK_UPDATE,
    Permission.TASK_DELETE,
    Permission.TASK_COMPLETE,
  ],
  [Role.MEMBER]: [
    Permission.HOUSEHOLD_READ,
    Permission.PET_READ,
    Permission.TASK_CREATE,
    Permission.TASK_UPDATE,
    Permission.TASK_COMPLETE,
  ],
  [Role.GUEST]: [Permission.HOUSEHOLD_READ, Permission.PET_READ],
};

function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

function requirePermission(permission: Permission) {
  return async (req, res, next) => {
    const user = req.user; // From authentication middleware
    const householdId = req.params.householdId;

    // Get user's role in this household
    const membership = await db.query.householdMembers.findFirst({
      where: and(
        eq(householdMembers.userId, user.id),
        eq(householdMembers.householdId, householdId),
      ),
    });

    if (!membership) {
      return res.status(403).json({ error: "Not a member of this household" });
    }

    if (!hasPermission(membership.role, permission)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
}

// Usage in routes
router.delete(
  "/households/:householdId",
  authenticate,
  requirePermission(Permission.HOUSEHOLD_DELETE),
  async (req, res) => {
    // Only owners can reach here
    await deleteHousehold(req.params.householdId);
    res.status(204).send();
  },
);
```

## OWASP Top 10 Protection

### A01: Broken Access Control

**Vulnerability**: Users can access resources they shouldn't.

**Prevention**:

```typescript
// Bad: Direct object reference without authorization
router.get("/api/households/:id", async (req, res) => {
  const household = await getHousehold(req.params.id);
  res.json(household); // ❌ Anyone can access any household
});

// Good: Verify user has access
router.get("/api/households/:id", authenticate, async (req, res) => {
  const household = await getHousehold(req.params.id);

  // Check if user is a member
  const isMember = await isHouseholdMember(household.id, req.user.id);
  if (!isMember) {
    return res.status(403).json({ error: "Access denied" });
  }

  res.json(household); // ✅ Only members can access
});
```

### A02: Cryptographic Failures

**Vulnerability**: Sensitive data exposed due to weak encryption.

**Prevention**:

```typescript
import crypto from "crypto";

// Encrypt sensitive data at rest
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 bytes
const ALGORITHM = "aes-256-gcm";

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Return: iv:authTag:encrypted
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

function decrypt(encrypted: string): string {
  const [ivHex, authTagHex, encryptedData] = encrypted.split(":");

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

// Usage: Store encrypted payment info
const paymentInfo = {
  cardNumber: "4111111111111111",
  cvv: "123",
  expiry: "12/25",
};

const encrypted = encrypt(JSON.stringify(paymentInfo));
await db.insert(payments).values({
  userId: user.id,
  encryptedData: encrypted, // Store encrypted
});
```

**TLS Configuration**:

```typescript
// Enforce HTTPS in production
app.use((req, res, next) => {
  if (process.env.NODE_ENV === "production" && !req.secure) {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

// Set security headers
app.use((req, res, next) => {
  // HSTS: Force HTTPS for 1 year
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains",
  );

  // Prevent MIME sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // XSS protection
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Clickjacking protection
  res.setHeader("X-Frame-Options", "DENY");

  next();
});
```

### A03: Injection

**Vulnerability**: Untrusted data executed as code.

**Prevention**:

**SQL Injection**:

```typescript
// Bad: String concatenation
const userId = req.query.userId; // From user input
const query = `SELECT * FROM users WHERE id = '${userId}'`; // ❌ SQL injection
const users = await db.execute(query);

// Good: Parameterized queries
const userId = req.query.userId;
const users = await db.query.users.findMany({
  where: eq(users.id, userId), // ✅ Safe
});
```

**NoSQL Injection**:

```typescript
// Bad: Direct object use
const filter = req.body.filter; // { email: { $gt: '' } }
const users = await db.collection("users").find(filter); // ❌ NoSQL injection

// Good: Validate and sanitize
const filter = req.body.filter;
if (typeof filter.email !== "string") {
  throw new Error("Invalid filter");
}
const users = await db.collection("users").find({ email: filter.email }); // ✅ Safe
```

**Command Injection**:

```typescript
// Bad: Execute user input
const filename = req.query.filename;
exec(`cat ${filename}`, (err, stdout) => {
  // ❌ Command injection
  res.send(stdout);
});

// Good: Use libraries, validate input
const filename = req.query.filename;
// Validate filename (no path traversal)
if (!/^[a-zA-Z0-9_-]+\.(txt|pdf)$/.test(filename)) {
  throw new Error("Invalid filename");
}
// Use safe file operations
const content = await fs.readFile(`/safe/directory/${filename}`, "utf8");
res.send(content);
```

### A04: Insecure Design

**Vulnerability**: Security flaws in architecture.

**Prevention**:

**Threat Modeling**:

```typescript
// Example: Password reset flow threat model

// Threats identified:
// 1. Account takeover via token prediction
// 2. Token leakage via email interception
// 3. Token reuse after password change

// Mitigations:
async function initiatePasswordReset(email: string) {
  const user = await findUserByEmail(email);
  if (!user) {
    // Don't reveal if email exists (timing attack mitigation)
    await sleep(200);
    return { success: true };
  }

  // Generate cryptographically secure token (Mitigation #1)
  const token = crypto.randomBytes(32).toString("hex");

  // Hash token before storing (Mitigation #2)
  const hashedToken = await hashToken(token);

  // Store with expiration (30 minutes)
  await db.insert(passwordResets).values({
    userId: user.id,
    token: hashedToken,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  });

  // Send email with token
  await sendPasswordResetEmail(user.email, token);

  return { success: true };
}

async function resetPassword(token: string, newPassword: string) {
  const hashedToken = await hashToken(token);

  // Find valid reset token
  const reset = await db.query.passwordResets.findFirst({
    where: and(
      eq(passwordResets.token, hashedToken),
      gt(passwordResets.expiresAt, new Date()),
    ),
  });

  if (!reset) {
    throw new Error("Invalid or expired token");
  }

  // Update password
  const hashedPassword = await hashPassword(newPassword);
  await db
    .update(users)
    .set({ passwordHash: hashedPassword })
    .where(eq(users.id, reset.userId));

  // Invalidate all reset tokens for this user (Mitigation #3)
  await db
    .delete(passwordResets)
    .where(eq(passwordResets.userId, reset.userId));

  // Invalidate all sessions (force re-login)
  await db.delete(sessions).where(eq(sessions.userId, reset.userId));

  return { success: true };
}
```

### A05: Security Misconfiguration

**Vulnerability**: Insecure defaults, unnecessary features enabled.

**Prevention**:

```typescript
// Security configuration checklist

// 1. Disable unnecessary features
app.disable("x-powered-by"); // Don't reveal Express

// 2. Secure cookie settings
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    cookie: {
      httpOnly: true, // Prevent XSS access
      secure: true, // HTTPS only
      sameSite: "strict", // CSRF protection
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);

// 3. Content Security Policy
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://trusted-cdn.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://api.petforce.app",
      "frame-ancestors 'none'",
    ].join("; "),
  );
  next();
});

// 4. Rate limiting
import rateLimit from "express-rate-limit";

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: "Too many requests, please try again later",
});

app.use("/api/", apiLimiter);

// Stricter limits for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Only 5 login attempts per 15 minutes
  skipSuccessfulRequests: true,
});

app.use("/api/auth/login", authLimiter);

// 5. Helmet for security headers
import helmet from "helmet";
app.use(helmet());
```

### A06: Vulnerable and Outdated Components

**Vulnerability**: Using libraries with known vulnerabilities.

**Prevention**:

```bash
# Automated dependency scanning

# 1. npm audit (built-in)
npm audit
npm audit fix

# 2. Snyk (comprehensive)
npx snyk test
npx snyk monitor

# 3. Dependabot (GitHub)
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

**Package.json security**:

```json
{
  "scripts": {
    "preinstall": "npx npm-force-resolutions",
    "audit": "npm audit --audit-level=high",
    "audit:fix": "npm audit fix"
  },
  "resolutions": {
    "vulnerable-package": "^2.0.0"
  }
}
```

### A07: Identification and Authentication Failures

**Vulnerability**: Weak authentication mechanisms.

**Prevention**:

```typescript
// Account lockout after failed attempts
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

async function handleFailedLogin(email: string) {
  const user = await findUserByEmail(email);
  if (!user) return;

  // Increment failed attempts
  await db
    .update(users)
    .set({
      failedLoginAttempts: sql`${users.failedLoginAttempts} + 1`,
      lastFailedLogin: new Date(),
    })
    .where(eq(users.id, user.id));

  // Check if account should be locked
  const updatedUser = await findUserById(user.id);
  if (updatedUser.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
    await db
      .update(users)
      .set({
        lockedUntil: new Date(Date.now() + LOCKOUT_DURATION),
      })
      .where(eq(users.id, user.id));

    // Alert user and security team
    await sendAccountLockoutEmail(user.email);
    await alertSecurityTeam("Account locked", { userId: user.id });
  }
}

async function checkAccountLocked(user: User): Promise<boolean> {
  if (!user.lockedUntil) return false;

  if (new Date() < user.lockedUntil) {
    return true; // Still locked
  }

  // Unlock account
  await db
    .update(users)
    .set({
      lockedUntil: null,
      failedLoginAttempts: 0,
    })
    .where(eq(users.id, user.id));

  return false;
}
```

### A08: Software and Data Integrity Failures

**Vulnerability**: Compromised software supply chain.

**Prevention**:

```typescript
// Verify package integrity with checksums
// package-lock.json includes SHA-512 integrity hashes

// Subresource Integrity for CDN resources
<script
  src="https://cdn.example.com/library.js"
  integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
  crossorigin="anonymous"
></script>

// Code signing for deployments
// Sign release artifacts
const signature = crypto.sign('sha256', artifactBuffer, privateKey);

// Verify signature before deployment
const isValid = crypto.verify('sha256', artifactBuffer, publicKey, signature);
if (!isValid) {
  throw new Error('Invalid artifact signature - deployment aborted');
}
```

### A09: Security Logging and Monitoring Failures

**Vulnerability**: Unable to detect or respond to attacks.

**Prevention**:

```typescript
// Security event logging
enum SecurityEventType {
  LOGIN_SUCCESS = "login_success",
  LOGIN_FAILURE = "login_failure",
  PASSWORD_CHANGE = "password_change",
  PERMISSION_DENIED = "permission_denied",
  SUSPICIOUS_ACTIVITY = "suspicious_activity",
  DATA_ACCESS = "data_access",
}

interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  ipAddress: string;
  userAgent: string;
  resource?: string;
  metadata?: Record<string, any>;
}

async function logSecurityEvent(event: SecurityEvent) {
  await db.insert(securityLogs).values({
    type: event.type,
    userId: event.userId,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
    resource: event.resource,
    metadata: event.metadata,
    timestamp: new Date(),
  });

  // Alert on critical events
  if (isCriticalEvent(event)) {
    await alertSecurityTeam(event);
  }

  // Send to SIEM
  await sendToSiem(event);
}

// Usage
await logSecurityEvent({
  type: SecurityEventType.PERMISSION_DENIED,
  userId: req.user?.id,
  ipAddress: req.ip,
  userAgent: req.headers["user-agent"],
  resource: req.path,
  metadata: {
    requiredPermission: Permission.HOUSEHOLD_DELETE,
    userRole: membership.role,
  },
});
```

### A10: Server-Side Request Forgery (SSRF)

**Vulnerability**: Server fetches malicious URLs.

**Prevention**:

```typescript
// Validate and restrict URLs
import { URL } from "url";

const ALLOWED_HOSTS = ["api.petforce.app", "cdn.petforce.app"];
const BLOCKED_IPS = [
  "127.0.0.1",
  "0.0.0.0",
  "169.254.169.254", // AWS metadata endpoint
  "10.0.0.0/8", // Private network
  "172.16.0.0/12", // Private network
  "192.168.0.0/16", // Private network
];

async function fetchExternalResource(urlString: string) {
  // Parse and validate URL
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    throw new Error("Invalid URL");
  }

  // Only allow HTTPS
  if (url.protocol !== "https:") {
    throw new Error("Only HTTPS URLs allowed");
  }

  // Check allowed hosts
  if (!ALLOWED_HOSTS.includes(url.hostname)) {
    throw new Error("Host not allowed");
  }

  // Resolve DNS and check IP
  const addresses = await dns.resolve4(url.hostname);
  for (const address of addresses) {
    if (isBlockedIp(address, BLOCKED_IPS)) {
      throw new Error("IP address blocked");
    }
  }

  // Fetch with timeout
  const response = await fetch(urlString, {
    timeout: 5000,
    redirect: "manual", // Don't follow redirects
  });

  return response;
}
```

## Secure Coding Practices

### Input Validation

**Principle**: Never trust user input.

```typescript
import { z } from "zod";

// Define validation schemas
const CreateHouseholdSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name too long")
    .regex(/^[a-zA-Z0-9\s'-]+$/, "Invalid characters"),
  description: z.string().max(500, "Description too long").optional(),
});

// Validate all input
router.post("/api/households", async (req, res) => {
  try {
    const data = CreateHouseholdSchema.parse(req.body);

    // Data is now validated and typed
    const household = await createHousehold(data);
    res.json(household);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.errors,
      });
    }
    throw error;
  }
});
```

### Output Encoding

**Prevent XSS by encoding output**:

```typescript
import DOMPurify from 'isomorphic-dompurify';

// Sanitize HTML input
function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u'],
    ALLOWED_ATTR: [],
  });
}

// Escape for HTML context
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// Escape for JavaScript context
function escapeJs(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

// Usage in React (auto-escaping)
function HouseholdCard({ household }: { household: Household }) {
  return (
    <div>
      {/* React auto-escapes by default */}
      <h2>{household.name}</h2>

      {/* For HTML content, sanitize first */}
      <div dangerouslySetInnerHTML={{
        __html: sanitizeHtml(household.description)
      }} />
    </div>
  );
}
```

### Error Handling

**Don't leak sensitive information in errors**:

```typescript
// Bad: Exposes internal details
try {
  await db.insert(users).values(userData);
} catch (error) {
  res.status(500).json({ error: error.message }); // ❌ May expose SQL/internals
}

// Good: Generic error messages
try {
  await db.insert(users).values(userData);
} catch (error) {
  // Log detailed error for debugging
  logger.error("Failed to create user", {
    error,
    userData: redactSensitiveFields(userData),
  });

  // Return generic error to user
  res.status(500).json({
    error: "Failed to create user",
    code: "USER_CREATE_FAILED",
  }); // ✅ No sensitive info
}

// Redact sensitive fields from logs
function redactSensitiveFields(obj: any): any {
  const redacted = { ...obj };
  const sensitiveFields = ["password", "token", "ssn", "creditCard"];

  for (const field of sensitiveFields) {
    if (field in redacted) {
      redacted[field] = "[REDACTED]";
    }
  }

  return redacted;
}
```

### Secure Randomness

```typescript
import crypto from "crypto";

// Bad: Predictable
const token = Math.random().toString(36); // ❌ Not cryptographically secure

// Good: Cryptographically secure
const token = crypto.randomBytes(32).toString("hex"); // ✅ Secure

// Generate secure tokens
function generateSecureToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

// Generate secure IDs
function generateSecureId(): string {
  return crypto.randomUUID(); // v4 UUID
}
```

## Data Protection

### Data Classification

**Data Sensitivity Levels**:

1. **Public**: Can be freely shared
   - Marketing content
   - Public documentation

2. **Internal**: For internal use only
   - Business processes
   - Internal communications

3. **Confidential**: Limited access
   - User data
   - Pet information
   - Household details

4. **Restricted**: Highly sensitive
   - Passwords
   - Payment information
   - Social Security Numbers

### Encryption at Rest

```typescript
// Field-level encryption for sensitive data
interface EncryptedUser {
  id: string;
  email: string; // Plain text (searchable)
  encryptedSsn: string; // Encrypted
  encryptedPaymentInfo: string; // Encrypted
}

async function createUser(data: CreateUserDto) {
  return await db.insert(users).values({
    email: data.email,
    passwordHash: await hashPassword(data.password),
    encryptedSsn: encrypt(data.ssn), // Encrypt sensitive fields
    encryptedPaymentInfo: encrypt(JSON.stringify(data.paymentInfo)),
  });
}

async function getUser(id: string): Promise<User> {
  const encrypted = await db.query.users.findFirst({
    where: eq(users.id, id),
  });

  return {
    ...encrypted,
    ssn: decrypt(encrypted.encryptedSsn), // Decrypt for use
    paymentInfo: JSON.parse(decrypt(encrypted.encryptedPaymentInfo)),
  };
}
```

### Data Retention

```typescript
// Automated data retention and deletion
async function enforceDataRetention() {
  // Delete old sessions (> 30 days)
  await db
    .delete(sessions)
    .where(
      lt(sessions.expiresAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
    );

  // Delete old security logs (> 1 year)
  await db
    .delete(securityLogs)
    .where(
      lt(
        securityLogs.timestamp,
        new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      ),
    );

  // Anonymize deleted user data (GDPR right to be forgotten)
  await db
    .update(users)
    .set({
      email: "[DELETED]",
      name: "[DELETED]",
      encryptedSsn: null,
      encryptedPaymentInfo: null,
    })
    .where(
      and(
        eq(users.deleted, true),
        lt(users.deletedAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
      ),
    );
}

// Run daily
cron.schedule("0 0 * * *", enforceDataRetention);
```

### Personal Identifiable Information (PII) Protection

```typescript
// Mask PII in logs and responses
function maskPii(
  data: string,
  type: "email" | "phone" | "ssn" | "card",
): string {
  switch (type) {
    case "email":
      // john.doe@example.com → j***@example.com
      const [local, domain] = data.split("@");
      return `${local[0]}***@${domain}`;

    case "phone":
      // +1234567890 → +1***7890
      return `${data.slice(0, 2)}***${data.slice(-4)}`;

    case "ssn":
      // 123-45-6789 → ***-**-6789
      return `***-**-${data.slice(-4)}`;

    case "card":
      // 4111111111111111 → ****1111
      return `****${data.slice(-4)}`;

    default:
      return "[MASKED]";
  }
}

// Log without PII
logger.info("User login", {
  userId: user.id,
  email: maskPii(user.email, "email"),
  ipAddress: req.ip,
});
```

## API Security

### API Authentication

```typescript
// JWT-based API authentication
import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
}

function generateApiToken(user: User): string {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "1h",
    issuer: "petforce-api",
    audience: "petforce-clients",
  });
}

function verifyApiToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, process.env.JWT_SECRET, {
      issuer: "petforce-api",
      audience: "petforce-clients",
    }) as JwtPayload;
  } catch (error) {
    throw new AuthError("Invalid token");
  }
}

// API authentication middleware
async function authenticateApi(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing token" });
  }

  const token = authHeader.substring(7);
  try {
    const payload = verifyApiToken(token);
    req.user = await findUserById(payload.userId);
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
```

### API Rate Limiting

```typescript
// Advanced rate limiting with Redis
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
}

async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const key = `${config.keyPrefix}:${identifier}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Remove old entries
  await redis.zremrangebyscore(key, 0, windowStart);

  // Count requests in window
  const requestCount = await redis.zcard(key);

  if (requestCount >= config.maxRequests) {
    const oldestRequest = await redis.zrange(key, 0, 0, "WITHSCORES");
    const resetAt = new Date(parseInt(oldestRequest[1]) + config.windowMs);

    return {
      allowed: false,
      remaining: 0,
      resetAt,
    };
  }

  // Add current request
  await redis.zadd(key, now, `${now}-${crypto.randomUUID()}`);
  await redis.expire(key, Math.ceil(config.windowMs / 1000));

  return {
    allowed: true,
    remaining: config.maxRequests - requestCount - 1,
    resetAt: new Date(now + config.windowMs),
  };
}

// Rate limit middleware
function rateLimit(config: RateLimitConfig) {
  return async (req, res, next) => {
    const identifier = req.user?.id || req.ip;
    const result = await checkRateLimit(identifier, config);

    // Set rate limit headers
    res.setHeader("X-RateLimit-Limit", config.maxRequests);
    res.setHeader("X-RateLimit-Remaining", result.remaining);
    res.setHeader("X-RateLimit-Reset", result.resetAt.toISOString());

    if (!result.allowed) {
      return res.status(429).json({
        error: "Too many requests",
        retryAfter: result.resetAt,
      });
    }

    next();
  };
}

// Usage
app.use(
  "/api/",
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    keyPrefix: "api_limit",
  }),
);
```

### CORS Configuration

```typescript
import cors from "cors";

// Restrictive CORS policy
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      "https://petforce.app",
      "https://www.petforce.app",
      "https://admin.petforce.app",
    ];

    // Allow no origin for mobile apps
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // Allow cookies
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["X-Total-Count", "X-Page-Count"],
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));
```

## Infrastructure Security

### Container Security

```dockerfile
# Secure Dockerfile

# Use specific version (not latest)
FROM node:20.11.0-alpine3.19

# Run as non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY --chown=nodejs:nodejs package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application
COPY --chown=nodejs:nodejs . .

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start application
CMD ["node", "dist/server.js"]
```

### Secrets Management

```typescript
// Use AWS Secrets Manager or similar
import { SecretsManager } from "@aws-sdk/client-secrets-manager";

const secretsManager = new SecretsManager({
  region: process.env.AWS_REGION,
});

async function getSecret(secretName: string): Promise<string> {
  try {
    const response = await secretsManager.getSecretValue({
      SecretId: secretName,
    });

    return response.SecretString;
  } catch (error) {
    logger.error("Failed to retrieve secret", { secretName, error });
    throw error;
  }
}

// Load secrets on startup
async function loadSecrets() {
  const secrets = await getSecret("petforce/production");
  const parsed = JSON.parse(secrets);

  process.env.DATABASE_URL = parsed.DATABASE_URL;
  process.env.JWT_SECRET = parsed.JWT_SECRET;
  process.env.ENCRYPTION_KEY = parsed.ENCRYPTION_KEY;
}

// Never commit secrets
// .env (gitignored)
// Use environment-specific secret stores in production
```

## Security Monitoring

### Security Metrics

```typescript
// Track security metrics
interface SecurityMetrics {
  loginAttempts: number;
  failedLogins: number;
  accountLockouts: number;
  suspiciousActivities: number;
  permissionDenials: number;
}

async function getSecurityMetrics(
  startDate: Date,
  endDate: Date,
): Promise<SecurityMetrics> {
  const logs = await db.query.securityLogs.findMany({
    where: and(
      gte(securityLogs.timestamp, startDate),
      lte(securityLogs.timestamp, endDate),
    ),
  });

  return {
    loginAttempts: logs.filter(
      (l) =>
        l.type === SecurityEventType.LOGIN_SUCCESS ||
        l.type === SecurityEventType.LOGIN_FAILURE,
    ).length,
    failedLogins: logs.filter((l) => l.type === SecurityEventType.LOGIN_FAILURE)
      .length,
    accountLockouts: logs.filter((l) => l.type === "account_lockout").length,
    suspiciousActivities: logs.filter(
      (l) => l.type === SecurityEventType.SUSPICIOUS_ACTIVITY,
    ).length,
    permissionDenials: logs.filter(
      (l) => l.type === SecurityEventType.PERMISSION_DENIED,
    ).length,
  };
}
```

### Anomaly Detection

```typescript
// Detect unusual patterns
async function detectAnomalies(userId: string) {
  const recentLogins = await db.query.securityLogs.findMany({
    where: and(
      eq(securityLogs.userId, userId),
      eq(securityLogs.type, SecurityEventType.LOGIN_SUCCESS),
      gte(
        securityLogs.timestamp,
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      ),
    ),
    orderBy: [desc(securityLogs.timestamp)],
  });

  if (recentLogins.length < 2) return;

  const [latest, previous] = recentLogins;

  // Check for suspicious patterns
  const anomalies = [];

  // 1. Location change
  if (latest.ipAddress !== previous.ipAddress) {
    const distance = getGeoDistance(latest.ipAddress, previous.ipAddress);
    if (distance > 1000) {
      // More than 1000km
      anomalies.push({
        type: "impossible_travel",
        details: `Login from ${distance}km away in short time`,
      });
    }
  }

  // 2. New device
  if (latest.userAgent !== previous.userAgent) {
    anomalies.push({
      type: "new_device",
      details: "Login from new device",
    });
  }

  // 3. Multiple failures before success
  const recentFailures = await db.query.securityLogs.findMany({
    where: and(
      eq(securityLogs.userId, userId),
      eq(securityLogs.type, SecurityEventType.LOGIN_FAILURE),
      gte(
        securityLogs.timestamp,
        new Date(latest.timestamp.getTime() - 60 * 60 * 1000),
      ),
    ),
  });

  if (recentFailures.length >= 3) {
    anomalies.push({
      type: "brute_force_success",
      details: `${recentFailures.length} failures before success`,
    });
  }

  // Alert on anomalies
  if (anomalies.length > 0) {
    await alertSecurityTeam("Anomalies detected", {
      userId,
      anomalies,
    });

    // Optionally require re-authentication
    await requireReAuth(userId);
  }
}
```

## Incident Response

### Incident Response Plan

**Phases**:

1. **Preparation**: Security monitoring, incident response team
2. **Detection**: Identify security incidents
3. **Containment**: Limit damage
4. **Eradication**: Remove threat
5. **Recovery**: Restore normal operations
6. **Lessons Learned**: Post-incident review

### Incident Runbooks

```typescript
// Automated incident response
enum IncidentSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

interface SecurityIncident {
  id: string;
  type: string;
  severity: IncidentSeverity;
  affectedUsers: string[];
  description: string;
  detectedAt: Date;
}

async function handleSecurityIncident(incident: SecurityIncident) {
  // 1. Log incident
  await db.insert(securityIncidents).values(incident);

  // 2. Alert team
  await alertSecurityTeam("Security incident detected", incident);

  // 3. Automated containment based on severity
  switch (incident.severity) {
    case IncidentSeverity.CRITICAL:
      // Lock affected accounts immediately
      await lockAccounts(incident.affectedUsers);
      // Revoke all sessions
      await revokeSessions(incident.affectedUsers);
      // Page on-call engineer
      await pageOnCall(incident);
      break;

    case IncidentSeverity.HIGH:
      // Force password reset
      await forcePasswordReset(incident.affectedUsers);
      // Notify users
      await notifyUsers(incident.affectedUsers, incident);
      break;

    case IncidentSeverity.MEDIUM:
      // Require MFA verification
      await requireMfaVerification(incident.affectedUsers);
      break;

    case IncidentSeverity.LOW:
      // Monitor closely
      await increaseMonitoring(incident.affectedUsers);
      break;
  }

  // 4. Start investigation
  await startInvestigation(incident);
}

// Example: Detect and respond to credential stuffing
async function detectCredentialStuffing() {
  // Find IPs with many failed logins across different accounts
  const suspiciousIps = await db.execute(sql`
    SELECT ip_address, COUNT(DISTINCT user_id) as unique_users
    FROM security_logs
    WHERE type = ${SecurityEventType.LOGIN_FAILURE}
      AND timestamp > NOW() - INTERVAL '15 minutes'
    GROUP BY ip_address
    HAVING COUNT(DISTINCT user_id) > 10
  `);

  for (const { ip_address } of suspiciousIps) {
    // Block IP
    await blockIp(ip_address);

    // Create incident
    await handleSecurityIncident({
      id: crypto.randomUUID(),
      type: "credential_stuffing",
      severity: IncidentSeverity.HIGH,
      affectedUsers: [], // Investigation will determine
      description: `Credential stuffing attack from ${ip_address}`,
      detectedAt: new Date(),
    });
  }
}
```

## Compliance & Privacy

### GDPR Compliance

```typescript
// GDPR data export
async function exportUserData(userId: string): Promise<UserDataExport> {
  return {
    personalInfo: await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        email: true,
        name: true,
        createdAt: true,
      },
    }),
    households: await db.query.households.findMany({
      where: eq(households.leaderId, userId),
    }),
    pets: await db.query.pets.findMany({
      where: eq(pets.ownerId, userId),
    }),
    activityLog: await db.query.activityLogs.findMany({
      where: eq(activityLogs.userId, userId),
      orderBy: [desc(activityLogs.timestamp)],
    }),
  };
}

// GDPR data deletion (right to be forgotten)
async function deleteUserData(userId: string, reason: string) {
  await db.transaction(async (tx) => {
    // 1. Mark user as deleted
    await tx
      .update(users)
      .set({
        deleted: true,
        deletedAt: new Date(),
        deletionReason: reason,
      })
      .where(eq(users.id, userId));

    // 2. Anonymize user data (keep for analytics/legal)
    await tx
      .update(users)
      .set({
        email: `deleted-${userId}@petforce.app`,
        name: "[Deleted User]",
        encryptedSsn: null,
        encryptedPaymentInfo: null,
      })
      .where(eq(users.id, userId));

    // 3. Delete sensitive data immediately
    await tx.delete(sessions).where(eq(sessions.userId, userId));
    await tx.delete(passwordResets).where(eq(passwordResets.userId, userId));

    // 4. Cascade delete or anonymize related data
    await tx
      .update(activityLogs)
      .set({ userId: null, userName: "[Deleted]" })
      .where(eq(activityLogs.userId, userId));
  });

  // 5. Log deletion for compliance
  await db.insert(complianceLogs).values({
    type: "gdpr_deletion",
    userId,
    reason,
    timestamp: new Date(),
  });
}
```

## Security Testing

### Security Test Checklist

```typescript
// Automated security tests
describe("Security Tests", () => {
  describe("Authentication", () => {
    it("should reject weak passwords", async () => {
      await expect(register("test@example.com", "123456")).rejects.toThrow(
        "Password does not meet security requirements",
      );
    });

    it("should lock account after failed attempts", async () => {
      for (let i = 0; i < 5; i++) {
        await expect(login("test@example.com", "wrong")).rejects.toThrow();
      }

      await expect(login("test@example.com", "correct")).rejects.toThrow(
        "Account locked",
      );
    });
  });

  describe("Authorization", () => {
    it("should prevent unauthorized access", async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const household = await createHousehold(user1.id);

      await expect(getHousehold(household.id, user2.id)).rejects.toThrow(
        "Access denied",
      );
    });
  });

  describe("Input Validation", () => {
    it("should prevent SQL injection", async () => {
      await expect(
        searchUsers("'; DROP TABLE users; --"),
      ).resolves.not.toThrow();

      // Verify table still exists
      const users = await db.query.users.findMany();
      expect(users).toBeDefined();
    });

    it("should sanitize XSS attempts", () => {
      const malicious = '<script>alert("XSS")</script>';
      const sanitized = sanitizeHtml(malicious);

      expect(sanitized).not.toContain("<script>");
    });
  });
});
```

## Security Checklists

### Pre-Deployment Security Checklist

- [ ] All dependencies updated and vulnerabilities fixed
- [ ] Security headers configured (CSP, HSTS, X-Frame-Options)
- [ ] HTTPS enforced
- [ ] Rate limiting enabled
- [ ] Authentication and authorization implemented
- [ ] Input validation on all endpoints
- [ ] Output encoding to prevent XSS
- [ ] SQL injection prevention (parameterized queries)
- [ ] CSRF protection enabled
- [ ] Secrets not in code (use environment variables/secrets manager)
- [ ] Error messages don't expose sensitive info
- [ ] Security logging and monitoring configured
- [ ] Backup and disaster recovery plan in place
- [ ] Incident response plan documented
- [ ] Security testing passed (SAST, DAST, penetration test)

### Code Review Security Checklist

- [ ] No hardcoded secrets or credentials
- [ ] All user input validated
- [ ] Database queries use parameterized statements
- [ ] Sensitive data encrypted
- [ ] Authentication required for protected endpoints
- [ ] Authorization checks present
- [ ] Error handling doesn't leak info
- [ ] Logging doesn't include sensitive data
- [ ] File uploads validated and restricted
- [ ] Third-party libraries vetted and up-to-date

---

**Samantha's Security Wisdom**: "Security is not a one-time task—it's a continuous process. Every line of code is a potential vulnerability until proven otherwise."
