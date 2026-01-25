# Samantha Security Agent - Quick Start Guide

Secure your application in 10 minutes.

## Prerequisites

- Node.js/Express application
- TypeScript (recommended)

---

## Step 1: Install Dependencies

```bash
# Core security packages
npm install helmet express-rate-limit cors

# Authentication
npm install jose bcrypt zod

# Input sanitization
npm install isomorphic-dompurify

# MFA (optional)
npm install otplib qrcode
```

---

## Step 2: Set Up Security Middleware

### Copy the templates:

```bash
mkdir -p src/security
cp samantha-security-agent/templates/*.template src/security/
# Rename files
mv src/security/security-middleware.ts.template src/security/security-middleware.ts
mv src/security/auth-utils.ts.template src/security/auth-utils.ts
```

### Apply to your Express app:

```typescript
// src/app.ts
import express from 'express';
import { applySecurity } from './security/security-middleware';

const app = express();

// Apply all security middleware
applySecurity(app, {
  trustProxy: process.env.NODE_ENV === 'production',
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  },
});

// Your routes here
app.use('/api', routes);

export default app;
```

---

## Step 3: Set Up Authentication

### Password Hashing

```typescript
import { hashPassword, verifyPassword } from './security/auth-utils';

// When user registers
async function register(email: string, password: string) {
  // Validate password strength
  const validation = validatePassword(password);
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '));
  }
  
  // Hash password
  const { hash, salt } = await hashPassword(password);
  
  // Store user with hashed password
  await db.users.create({
    email,
    passwordHash: hash,
    passwordSalt: salt,
  });
}

// When user logs in
async function login(email: string, password: string) {
  const user = await db.users.findByEmail(email);
  if (!user) {
    throw new AuthError('Invalid credentials', 'INVALID_CREDENTIALS');
  }
  
  const valid = await verifyPassword(
    password,
    user.passwordHash,
    user.passwordSalt
  );
  
  if (!valid) {
    throw new AuthError('Invalid credentials', 'INVALID_CREDENTIALS');
  }
  
  return user;
}
```

### JWT Tokens

```typescript
import { generateTokenPair, verifyToken } from './security/auth-utils';

// After successful login
async function handleLogin(user: User) {
  const tokens = await generateTokenPair({
    id: user.id,
    email: user.email,
    roles: user.roles,
  });
  
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn,
  };
}

// Middleware to verify tokens
async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const payload = await verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

---

## Step 4: Add Rate Limiting

```typescript
import { rateLimiters, createRateLimiter } from './security/security-middleware';

// Apply to auth routes
app.use('/api/auth', rateLimiters.auth);

// Custom rate limiter for specific routes
const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: 'Too many requests',
});

app.use('/api', apiLimiter);
```

---

## Step 5: Environment Variables

Create a `.env` file:

```bash
# Environment
NODE_ENV=development

# JWT (use a strong random string, 32+ characters)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ISSUER=https://your-app.com
JWT_AUDIENCE=https://your-app.com

# Session (use a strong random string)
SESSION_SECRET=your-session-secret-change-this

# CORS
CORS_ORIGINS=http://localhost:3000,https://your-app.com

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/db
```

⚠️ **Never commit `.env` to version control!**

---

## Step 6: Add Security Headers Check

Verify your headers are working:

```bash
curl -I https://your-app.com/api/health
```

You should see:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
```

---

## Security Checklist

### Authentication
- [ ] Passwords hashed with bcrypt/Argon2id
- [ ] Minimum 12 character passwords
- [ ] Rate limiting on login (5 attempts/15 min)
- [ ] JWTs expire in 15 minutes
- [ ] Refresh tokens stored server-side

### Authorization
- [ ] Auth middleware on all protected routes
- [ ] Permissions checked on every request
- [ ] Ownership verified for user resources

### Data
- [ ] HTTPS in production
- [ ] Sensitive data encrypted
- [ ] Secrets in environment variables
- [ ] PII not logged

### Headers
- [ ] Helmet.js configured
- [ ] CORS properly configured
- [ ] CSP configured

---

## Common Patterns

### Protecting Routes

```typescript
// Public route
app.get('/api/public', (req, res) => {
  res.json({ message: 'Public' });
});

// Protected route (requires auth)
app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// Admin only route
app.get('/api/admin', authMiddleware, requireRole('admin'), (req, res) => {
  res.json({ admin: true });
});
```

### Input Validation

```typescript
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  name: z.string().min(1).max(100),
});

app.post('/api/users', async (req, res) => {
  // Validate input
  const result = createUserSchema.safeParse(req.body);
  
  if (!result.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: result.error.errors,
    });
  }
  
  // Use validated data
  const user = await createUser(result.data);
  res.json(user);
});
```

### Error Handling (Don't Leak Info)

```typescript
// ❌ Bad - leaks internal details
app.use((err, req, res, next) => {
  res.status(500).json({
    error: err.message,
    stack: err.stack,
  });
});

// ✅ Good - generic message in production
app.use((err, req, res, next) => {
  console.error(err); // Log internally
  
  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message,
    requestId: req.id,
  });
});
```

---

## Testing Security

### Test rate limiting:

```bash
# Should fail after 5 rapid requests
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
```

### Test CORS:

```bash
# Should be blocked (wrong origin)
curl -H "Origin: http://evil.com" \
  -I http://localhost:3000/api/data
```

### Test XSS prevention:

```bash
# Should be sanitized
curl -X POST http://localhost:3000/api/comments \
  -H "Content-Type: application/json" \
  -d '{"text":"<script>alert(1)</script>"}'
```

---

## Next Steps

1. 📖 Read the full [SAMANTHA.md](./SAMANTHA.md) documentation
2. 🔍 Run a security audit (`samantha audit --full`)
3. 🔐 Enable MFA for admin accounts
4. 📋 Set up compliance reporting
5. 🚨 Configure security alerting

---

## Troubleshooting

### "CORS error"
- Check `CORS_ORIGINS` includes your frontend URL
- Verify protocol (http vs https)

### "JWT invalid"
- Check `JWT_SECRET` is set and matches
- Verify token hasn't expired
- Check issuer and audience match

### "Rate limit too strict"
- Adjust `windowMs` and `max` in config
- Consider per-user vs per-IP limiting

### "CSP blocking resources"
- Add trusted sources to CSP directives
- Check browser console for blocked URLs

---

*Samantha: Security is not a product, but a process.* 🔒
