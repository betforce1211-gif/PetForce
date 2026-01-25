# PetForce Architecture

This document describes the high-level architecture and design decisions for the PetForce application.

## System Overview

PetForce is built as a monorepo containing:
- Web application (React + Vite)
- Mobile applications (React Native + Expo)
- Shared packages (authentication, UI components)

```
┌─────────────────────────────────────────┐
│         User Interfaces                 │
├──────────────┬──────────────────────────┤
│   Web App    │    Mobile Apps           │
│ (React+Vite) │ (React Native+Expo)      │
└──────┬───────┴──────────┬───────────────┘
       │                  │
       └────────┬─────────┘
                │
        ┌───────▼──────────┐
        │ Shared Packages  │
        ├──────────────────┤
        │  @petforce/auth  │
        │  @petforce/ui    │
        └───────┬──────────┘
                │
        ┌───────▼──────────┐
        │    Supabase      │
        ├──────────────────┤
        │  Authentication  │
        │  PostgreSQL DB   │
        │  Storage         │
        │  Real-time       │
        └──────────────────┘
```

## Architecture Principles

### 1. Code Reusability

- **Shared Packages**: Common logic in `packages/` folder
- **Cross-Platform**: Maximum code sharing between web and mobile
- **Component Library**: Reusable UI components

### 2. Type Safety

- **TypeScript Everywhere**: All code is TypeScript
- **Strict Mode**: Strict TypeScript configuration
- **Type-Safe APIs**: Full type coverage for API calls

### 3. Modularity

- **Feature-Based Structure**: Code organized by features
- **Dependency Injection**: Loose coupling between modules
- **Plugin Architecture**: Extensible design

### 4. Performance

- **Code Splitting**: Dynamic imports for lazy loading
- **Memoization**: React.memo and useMemo
- **Optimized Bundles**: Tree shaking and minification

### 5. Security

- **Secure by Default**: Security best practices
- **Input Validation**: All user input validated
- **HTTPS Only**: Encrypted connections
- **Token Rotation**: Automatic token refresh

## Detailed Architecture

### Frontend Architecture

#### Web Application

**Technology Stack:**
- React 18.2 for UI
- React Router 6.21 for navigation
- Tailwind CSS for styling
- Framer Motion for animations
- Vite for build tooling

**Structure:**
```
apps/web/src/
├── components/           # Reusable UI components
│   └── ui/              # Base components (Button, Input, Card)
├── features/            # Feature modules
│   └── auth/
│       ├── components/  # Feature-specific components
│       ├── pages/       # Page components
│       └── hooks/       # Custom hooks (future)
├── navigation/          # Routing configuration (future)
└── test/               # Testing utilities
```

**Design Patterns:**
- **Component Composition**: Small, composable components
- **Custom Hooks**: Reusable stateful logic
- **Render Props**: Flexible component APIs (where needed)
- **HOC**: Cross-cutting concerns (minimal use)

#### Mobile Application

**Technology Stack:**
- React Native for iOS/Android
- React Navigation for navigation
- Expo for development platform
- expo-local-authentication for biometrics

**Structure:**
```
apps/mobile/src/
├── components/          # Mobile UI components
│   └── ui/             # Base components
├── features/           # Feature modules
│   └── auth/
│       ├── components/ # Auth components
│       ├── screens/    # Screen components
│       └── navigation/ # Feature navigation
└── navigation/         # App navigation
```

**Platform-Specific Code:**
- Conditional imports for platform APIs
- StyleSheet for native styling
- Platform-specific components when needed

### Backend Architecture

**Supabase Services:**

```
┌──────────────────────────────────────┐
│         Supabase Backend             │
├──────────────────────────────────────┤
│                                      │
│  ┌────────────────────────────────┐ │
│  │      Authentication            │ │
│  ├────────────────────────────────┤ │
│  │ - Email/Password               │ │
│  │ - Magic Links                  │ │
│  │ - OAuth (Google, Apple)        │ │
│  │ - JWT Token Management         │ │
│  └────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐ │
│  │      PostgreSQL Database       │ │
│  ├────────────────────────────────┤ │
│  │ - User profiles                │ │
│  │ - Pet data (future)            │ │
│  │ - Health records (future)      │ │
│  └────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐ │
│  │      Storage                   │ │
│  ├────────────────────────────────┤ │
│  │ - Pet photos (future)          │ │
│  │ - Document uploads (future)    │ │
│  └────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐ │
│  │      Real-time                 │ │
│  ├────────────────────────────────┤ │
│  │ - Live updates (future)        │ │
│  │ - Notifications (future)       │ │
│  └────────────────────────────────┘ │
│                                      │
└──────────────────────────────────────┘
```

### Shared Packages

#### @petforce/auth

Authentication package shared between web and mobile.

**Responsibilities:**
- API functions for auth operations
- React hooks for auth state
- Zustand store for global state
- Token management
- Session persistence

**Structure:**
```
packages/auth/src/
├── api/                # API functions
│   ├── auth.ts        # Email/password auth
│   ├── magic-link.ts  # Magic link auth
│   ├── oauth.ts       # OAuth auth
│   └── biometrics.ts  # Biometric auth
├── hooks/             # React hooks
│   ├── useAuth.ts
│   ├── useOAuth.ts
│   ├── useMagicLink.ts
│   └── useBiometrics.ts
├── stores/            # State management
│   └── authStore.ts   # Zustand store
├── types/             # TypeScript types
│   └── auth.ts
└── utils/             # Utilities
    ├── storage.ts     # Token storage
    ├── validation.ts  # Input validation
    ├── logger.ts      # Structured logging
    └── metrics.ts     # Metrics collection
```

**Email Confirmation State Management:**

Users created via email/password registration go through these states:

```
┌─────────────┐
│ Registration│
│  Initiated  │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ User Created        │
│ email_confirmed: ❌ │  ← User exists in database but unconfirmed
│ confirmationRequired│
└──────┬──────────────┘
       │
       │  Verification email sent
       │
       ▼
┌─────────────────────┐
│ Pending Confirmation│
│ User checks email   │
└──────┬──────────────┘
       │
       │  User clicks link
       │
       ▼
┌─────────────────────┐
│ Email Confirmed     │
│ email_confirmed: ✅ │  ← User can now log in
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Login Allowed       │
└─────────────────────┘
```

**Key Implementation Details:**

1. **Registration returns confirmation state**:
   ```typescript
   {
     success: true,
     confirmationRequired: true, // ← Frontend knows to show email page
     message: "Please check your email to verify..."
   }
   ```

2. **Login checks email_confirmed_at**:
   ```typescript
   if (user.email_confirmed_at === null) {
     return {
       success: false,
       error: {
         code: 'EMAIL_NOT_CONFIRMED',
         message: 'Please verify your email...'
       }
     };
   }
   ```

3. **All state transitions are logged** with unique request IDs for tracing

4. **Metrics track confirmation funnel**:
   - Registration rate
   - Confirmation rate (% who click link)
   - Time to confirm (minutes)
   - Unconfirmed login attempts

**Platform Detection:**
```typescript
const isReactNative =
  typeof navigator !== 'undefined' &&
  navigator.product === 'ReactNative';

// Use platform-specific code
if (isReactNative) {
  // React Native implementation
} else {
  // Web implementation
}
```

#### @petforce/ui (Future)

Shared UI components and design tokens.

**Will Include:**
- Design tokens (colors, typography, spacing)
- Utility functions
- Shared constants
- Theme configuration

## State Management

### Local State

- **React State**: Component-level state with `useState`
- **Refs**: DOM references and mutable values with `useRef`
- **Context**: Limited use for theme/i18n

### Global State

- **Zustand**: Lightweight global state
  - Auth state (`useAuthStore`)
  - User preferences (future)
  - App settings (future)

**Auth Store Structure:**
```typescript
interface AuthState {
  // State
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setTokens: (tokens: AuthTokens | null) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}
```

### Server State (Future)

- **React Query**: Server state management
  - Caching
  - Background refetching
  - Optimistic updates

## Navigation

### Web (React Router)

```typescript
<Routes>
  <Route path="/" element={<Navigate to="/auth/welcome" />} />

  {/* Public routes */}
  <Route path="/auth/*" element={<AuthNavigator />} />

  {/* Protected routes */}
  <Route path="/dashboard" element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } />
</Routes>
```

### Mobile (React Navigation)

```typescript
<NavigationContainer>
  <Stack.Navigator>
    {isAuthenticated ? (
      <Stack.Screen name="App" component={AppNavigator} />
    ) : (
      <Stack.Screen name="Auth" component={AuthNavigator} />
    )}
  </Stack.Navigator>
</NavigationContainer>
```

## Data Flow

### Authentication Flow

```
User Action (Login)
       ↓
Component (LoginPage)
       ↓
Hook (useAuth)
       ↓
API Function (loginWithPassword)
       ↓
Supabase API
       ↓
Store Update (setUser, setTokens)
       ↓
UI Update (redirect to dashboard)
```

### Form Submission Flow

```
User Input
       ↓
Controlled Component (Input value)
       ↓
Local Validation
       ↓
Form Submit Handler
       ↓
API Call with Loading State
       ↓
Success: Update State + Navigate
Error: Show Error Message
```

## Security Architecture

### Authentication

- **JWT Tokens**: Secure token-based auth
- **Token Refresh**: Automatic refresh before expiry
- **Secure Storage**:
  - Web: sessionStorage (with httpOnly cookies future)
  - Mobile: Keychain (iOS) / Keystore (Android)

### Authorization

- **Route Guards**: Protected routes check auth state
- **API Guards**: All API calls include auth headers
- **Role-Based**: (Future) Check user roles/permissions

### Data Validation

- **Input Validation**: Client-side + server-side
- **Type Safety**: TypeScript prevents type errors
- **Sanitization**: XSS prevention

### Security Best Practices

- HTTPS everywhere
- No sensitive data in localStorage (web)
- Secure password requirements
- Rate limiting (server-side)
- CORS configuration

## Testing Architecture

### Test Types

1. **Unit Tests**: Individual functions/components
2. **Integration Tests**: Feature flows
3. **E2E Tests**: Complete user journeys (future)

### Test Infrastructure

```
Test Pyramid (Target)
     /\
    /E2E\         10% - Critical paths
   /─────\
  / Integ.\       30% - Feature flows
 /─────────\
/   Unit    \     60% - Components & utils
─────────────
```

### Mocking Strategy

- Mock external APIs (Supabase)
- Mock navigation
- Mock platform APIs (biometrics)
- Use test fixtures for data

## Performance Considerations

### Web Optimization

- Code splitting by route
- Lazy loading components
- Image optimization
- Bundle size monitoring

### Mobile Optimization

- FlatList for long lists
- Image caching
- Background task optimization
- Memory management

### General Optimizations

- Memoization (React.memo, useMemo, useCallback)
- Debouncing user input
- Pagination for large datasets
- Optimistic UI updates

## Deployment Architecture

### Web Deployment

```
GitHub
  ↓ (push to main)
CI/CD Pipeline
  ↓ (build + test)
Vercel/Netlify
  ↓ (deploy)
Production
```

### Mobile Deployment

```
GitHub
  ↓ (push to main)
EAS Build
  ↓ (build)
App Store / Play Store
  ↓ (review + publish)
Production
```

## Monitoring & Analytics (Future)

### Error Tracking
- Sentry for error monitoring
- Custom error boundaries
- Automatic error reporting

### Analytics
- Mixpanel / Amplitude
- User behavior tracking
- Feature usage metrics

### Performance Monitoring
- Web Vitals
- Custom performance marks
- Bundle size tracking

## Future Architecture Improvements

### Short Term
- [ ] Add React Query for server state
- [ ] Implement error boundaries
- [ ] Add analytics integration
- [ ] Set up CI/CD pipelines

### Long Term
- [ ] Microservices architecture
- [ ] GraphQL API layer
- [ ] Edge functions for complex logic
- [ ] Real-time collaboration features

## Design Decisions

### Why Zustand over Redux?

- **Simpler API**: Less boilerplate
- **Better TypeScript**: Type inference
- **Smaller Bundle**: Lightweight
- **Good Enough**: Meets current needs

### Why Supabase over Custom Backend?

- **Faster Development**: Ready-to-use features
- **Cost Effective**: Free tier generous
- **Scalable**: Can upgrade as needed
- **Less Maintenance**: Managed service

### Why Monorepo?

- **Code Sharing**: DRY principles
- **Consistent Tooling**: Same build tools
- **Easier Refactoring**: Cross-package changes
- **Atomic Commits**: Related changes together

### Why TypeScript?

- **Type Safety**: Catch errors early
- **Better DX**: Autocomplete and IntelliSense
- **Self-Documenting**: Types as documentation
- **Refactoring**: Safe code changes

---

**Last Updated**: January 24, 2026
**Maintained by**: PetForce Development Team
