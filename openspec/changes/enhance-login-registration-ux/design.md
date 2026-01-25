# Design: Authentication System

## Context

PetForce requires a secure, multi-platform authentication system to protect pet parents' data while providing a simple, trustworthy user experience. This is the foundation for all future features involving sensitive pet health information.

### Constraints
- Must work on web browsers, iOS devices, and Android devices
- Must support multiple authentication methods to meet diverse user preferences
- Must comply with security best practices (OWASP, app store requirements)
- Must provide seamless experience across platforms (consistent UX)
- Must be maintainable with shared code to reduce duplication

### Stakeholders
- Pet parents (end users) - Need simple, secure access
- Development team - Need maintainable, testable code
- Future features - Will depend on reliable auth state management

## Goals / Non-Goals

### Goals
- ✅ Multi-method authentication (email/password, magic links, OAuth, biometrics)
- ✅ Cross-platform support (web, iOS, Android)
- ✅ Secure token management with automatic refresh
- ✅ Comprehensive error handling and user feedback
- ✅ Code reuse through shared packages
- ✅ 80%+ test coverage
- ✅ Production-ready documentation

### Non-Goals
- ❌ Two-factor authentication (future enhancement)
- ❌ Enterprise SSO (SAML, LDAP) - not needed for initial launch
- ❌ Account linking (merging multiple auth methods) - future enhancement
- ❌ Admin user management UI - future feature
- ❌ Rate limiting implementation (handled by Supabase)

## Decisions

### Decision 1: Supabase for Authentication Backend
**What**: Use Supabase Auth instead of building custom auth backend

**Why**:
- Provides battle-tested auth infrastructure (OAuth, magic links, JWT tokens)
- Handles security best practices (password hashing, token refresh, rate limiting)
- Reduces development time and security risk
- Offers generous free tier for initial launch
- Includes admin dashboard for user management

**Alternatives Considered**:
- Firebase Auth - Good but more expensive at scale, vendor lock-in concerns
- Auth0 - Enterprise-focused, too expensive for startup phase
- Custom auth with Postgres - Too much security risk and development time
- AWS Cognito - Complex API, steep learning curve

### Decision 2: Monorepo with Shared Packages
**What**: Use npm workspaces to share code between web and mobile apps

**Why**:
- Eliminates code duplication for auth logic and UI components
- Ensures consistent behavior across platforms
- Simplifies version management and dependency updates
- Enables TypeScript type sharing
- Reduces testing burden (test once, use everywhere)

**Structure**:
```
packages/
  auth/       # Authentication logic (Supabase client, hooks, validation)
  ui/         # Shared UI components (future, currently platform-specific)
apps/
  web/        # Vite + React + Tailwind
  mobile/     # Expo + React Native
```

**Alternatives Considered**:
- Separate repos - Too much duplication, hard to keep in sync
- Single app (React Native Web) - Performance concerns, limited web capabilities

### Decision 3: Zustand for State Management
**What**: Use Zustand instead of Context API or Redux

**Why**:
- Lightweight (1KB) with minimal boilerplate
- Built-in persistence middleware for token storage
- TypeScript support with no extra configuration
- Simple API that's easy to test
- No provider wrapping required

**Alternatives Considered**:
- Context API - Re-render performance issues, complex patterns for persistence
- Redux/Redux Toolkit - Overkill for auth-only state, too much boilerplate
- Jotai/Recoil - Less mature, smaller ecosystem

### Decision 4: Framer Motion for Animations (Web)
**What**: Use Framer Motion for page transitions and UI animations

**Why**:
- Declarative API that's easy to understand
- Excellent TypeScript support
- Layout animations out of the box
- Small bundle size impact with tree shaking
- Adds polish to authentication flows

**Alternatives Considered**:
- CSS animations - Less flexible, harder to coordinate complex animations
- React Spring - More complex API, steeper learning curve
- GSAP - Requires commercial license for some uses

### Decision 5: Platform-Specific UI Components
**What**: Build separate UI components for web (Tailwind) and mobile (StyleSheet)

**Why**:
- Each platform has different design paradigms (web vs iOS vs Android)
- Tailwind doesn't work on React Native
- Native feel is important for mobile apps
- Shared logic (in `@petforce/auth`) is more valuable than shared UI

**Alternatives Considered**:
- React Native Web - Compromises web experience, larger bundle size
- Tamagui - New library, less mature, adds complexity
- NativeWind - Still experimental, limited production use

## Architecture

### Authentication Flow

```
User Action → useAuth Hook → Auth Service → Supabase → Auth Store → UI Update
```

**Web Flow**:
1. User submits login form
2. `useAuth` hook calls `loginWithPassword` from auth service
3. Auth service makes Supabase API call
4. On success, tokens stored in Zustand store (persisted to localStorage)
5. User state updated, triggers redirect to dashboard
6. Protected routes check `isAuthenticated` from store

**Mobile Flow**:
Same as web, but:
- Tokens persisted to SecureStore (encrypted on device)
- Biometric prompt triggered before API call
- Deep links handle OAuth callbacks

### Token Refresh Strategy

```typescript
// Automatic token refresh before expiration
const REFRESH_THRESHOLD = 60; // seconds

setInterval(async () => {
  const { expiresAt } = useAuthStore.getState();
  const timeUntilExpiry = expiresAt - Date.now();
  
  if (timeUntilExpiry < REFRESH_THRESHOLD * 1000) {
    await refreshSession();
  }
}, 30000); // Check every 30 seconds
```

### Error Handling Strategy

All authentication methods return consistent `AuthResult`:
```typescript
interface AuthResult {
  success: boolean;
  user?: User;
  tokens?: AuthTokens;
  error?: AuthError;
}
```

Errors are categorized:
- **User errors** - Invalid credentials, weak password (show to user)
- **Network errors** - Connection failed (show retry button)
- **Server errors** - 500 errors (log and show generic message)

## Risks / Trade-offs

### Risk 1: Supabase Vendor Lock-in
**Risk**: Supabase dependency makes migration difficult

**Mitigation**:
- Abstract Supabase client behind service layer
- Keep auth logic in shared package, easy to swap backend
- Supabase uses standard JWT tokens (portable)

**Trade-off**: Accept some lock-in for reduced development time and security risk

### Risk 2: Bundle Size (Web)
**Risk**: Framer Motion and other dependencies increase bundle size

**Mitigation**:
- Code splitting with React.lazy
- Tree shaking enabled in Vite
- Monitor bundle size with budget (<500KB goal)

**Trade-off**: Accept slight size increase for better UX

### Risk 3: Biometric Availability
**Risk**: Not all mobile devices support biometrics

**Mitigation**:
- Graceful fallback to password authentication
- Check `isBiometricAvailable()` before showing biometric option
- Clear messaging when biometrics not supported

**Trade-off**: Biometric auth is optional enhancement, not required feature

## Migration Plan

**Phase 1: Initial Launch** (Current)
- Deploy authentication system as-is
- Monitor error rates and user feedback
- Track auth method usage (which methods are popular)

**Phase 2: Enhancements** (Q2 2026)
- Add two-factor authentication
- Implement account linking (multiple auth methods per user)
- Add passwordless WebAuthn (passkeys)

**Phase 3: Enterprise** (Q3 2026)
- Add SAML/LDAP for enterprise customers
- Implement admin user management
- Add audit logging

### Rollback Plan
If critical issues arise:
1. Web: Vercel instant rollback to previous deployment
2. Mobile: Cannot rollback app stores immediately
   - Use Expo Updates for JavaScript-only fixes
   - Submit expedited app review for native fixes

## Performance Targets

- **Web**:
  - First Contentful Paint < 1.5s
  - Time to Interactive < 3s
  - Bundle size < 500KB (initial)
  
- **Mobile**:
  - App launch < 3s
  - Authentication response < 2s
  - 60fps animations

- **Backend**:
  - API response time < 200ms (p95)
  - Token refresh < 500ms
  - 99.9% uptime

## Security Considerations

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Token Storage
- Web: localStorage (accessible only to same origin)
- Mobile: SecureStore (encrypted, not backed up to cloud)
- Tokens refreshed before expiration
- Tokens cleared on logout

### OAuth Security
- State parameter validates OAuth callbacks
- PKCE flow for mobile apps
- Redirect URLs whitelisted in Supabase

### Input Validation
- Email format validation client-side and server-side
- Password strength validation client-side
- SQL injection protection (Supabase parameterized queries)
- XSS protection (React escapes by default)

## Open Questions

- ✅ Which authentication methods will users prefer? → Monitoring analytics after launch
- ✅ Do we need magic link expiration time configuration? → Using Supabase default (1 hour)
- ✅ Should biometric auth require password periodically? → Not for v1, consider for v2
- ✅ Do we need remember me option? → Not needed, sessions persist by default
