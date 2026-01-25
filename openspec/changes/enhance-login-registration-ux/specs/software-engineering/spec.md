# Capability: Software Engineering (Modifications)

## MODIFIED Requirements

### Requirement: Write Maintainable, Tested Code

All code MUST be maintainable, well-tested, and follow best practices (existing requirement - adding authentication implementation scenarios).

#### Scenario: Implement shared authentication package

**Given** Engrid is implementing the shared auth package
**When** they extend `@petforce/auth`
**Then** the package exports all auth functions (login, register, sendMagicLink, OAuth, biometrics)
**And** the package exports React hooks for common auth operations
**And** the package exports TypeScript types for all auth data structures
**And** the package exports validation utilities (email, password strength)
**And** the package works in both React (web) and React Native (mobile)
**And** all functions have unit tests with 90%+ coverage
**And** all exports are documented with JSDoc comments

#### Scenario: Implement web authentication UI components

**Given** Engrid is building the web app authentication UI
**When** they create components
**Then** components are built with React and TypeScript
**And** components use the shared `@petforce/auth` package for logic
**And** components are styled with Tailwind CSS
**And** components follow the design system (colors, spacing, typography)
**And** components are accessible (WCAG AA compliant)
**And** components have prop types defined with TypeScript
**And** components have unit tests (React Testing Library)
**And** components handle loading and error states
**And** components are organized in a logical folder structure

## ADDED Requirements

### Requirement: Implement Authentication Flows

Web and mobile apps MUST implement all authentication flows with proper error handling and user feedback.

#### Scenario: Implement email/password registration

**Given** Engrid is implementing registration
**When** they build the register flow
**Then** the flow validates email format in real-time
**And** the flow checks if email already exists (on blur)
**And** the flow shows helpful message if email exists
**And** the flow validates password strength in real-time
**And** the flow validates that passwords match
**And** the flow submits form data to `supabase.auth.signUp()`
**And** the flow handles success (show "check your email" screen)
**And** the flow handles errors (display user-friendly messages)
**And** the flow tracks analytics event: `registration_started` and `registration_completed`
**And** the implementation has integration tests covering the full flow

#### Scenario: Implement magic link authentication

**Given** Engrid is implementing magic link auth
**When** they build the magic link flow
**Then** the flow sends magic link via `supabase.auth.signInWithOtp()`
**And** the flow shows "check your email" screen with animation
**And** the flow provides a resend link button (with 60-second cooldown)
**And** the flow handles the magic link callback (web route or mobile deep link)
**And** the flow extracts token from URL and verifies with `supabase.auth.verifyOtp()`
**And** the flow establishes session on successful verification
**And** the flow redirects to dashboard
**And** the flow handles expired or invalid tokens gracefully
**And** the implementation has integration tests

#### Scenario: Implement OAuth authentication (Google)

**Given** Engrid is implementing Google SSO
**When** they build the OAuth flow
**Then** the flow initiates OAuth with `supabase.auth.signInWithOAuth({ provider: 'google' })`
**And** the flow redirects to Google's consent screen
**And** the flow handles the OAuth callback (web route or mobile deep link)
**And** the flow extracts tokens from callback URL
**And** the flow establishes session with received tokens
**And** the flow redirects to dashboard
**And** the flow handles OAuth errors (user cancelled, provider unavailable)
**And** the flow works on web, iOS, and Android
**And** the implementation has integration tests with mocked OAuth

#### Scenario: Implement biometric authentication enrollment

**Given** Engrid is implementing biometric enrollment
**When** they build the enrollment flow
**Then** the flow checks if biometrics are available on the device
**And** the flow prompts user for enrollment after first successful login
**And** the flow generates biometric key pair using platform APIs
**And** the flow stores encrypted credentials in secure storage
**And** the flow stores enrollment state (enrolled, declined, not_asked)
**And** the flow handles user declining enrollment (don't ask again if checked)
**And** the implementation uses platform-specific code (iOS Keychain, Android Keystore)
**And** the implementation has unit tests

#### Scenario: Implement forgot password flow

**Given** Engrid is implementing password reset
**When** they build the forgot password flow
**Then** the flow sends password reset email via `supabase.auth.resetPasswordForEmail()`
**And** the flow shows "check your email" confirmation
**And** the flow handles the reset link callback (web route or mobile deep link)
**And** the flow shows reset password form with token validation
**And** the flow validates new password strength
**And** the flow updates password via `supabase.auth.updateUser()`
**And** the flow shows success message
**And** the flow redirects to login page
**And** the implementation has integration tests

### Requirement: Implement State Management

Authentication state MUST be managed consistently across the app with proper persistence.

#### Scenario: Implement Zustand auth store

**Given** Engrid is setting up state management
**When** they create the auth store
**Then** the store uses Zustand for state management
**And** the store has state: `user`, `tokens`, `isAuthenticated`, `isLoading`
**And** the store has actions: `setUser`, `setTokens`, `logout`, `refreshSession`
**And** the store persists state to secure storage (web: sessionStorage/memory, mobile: Keychain)
**And** the store hydrates on app launch
**And** the store clears state on logout
**And** the store is typed with TypeScript
**And** the store has unit tests

#### Scenario: Implement session refresh logic

**Given** Engrid is implementing session management
**When** they build the session refresh flow
**Then** the app checks if access token is expired before API calls
**And** the app automatically refreshes the access token using refresh token
**And** the app updates the auth store with new tokens
**And** the app retries the original API call with new access token
**And** the app redirects to login if refresh token is also expired
**And** the implementation handles concurrent refresh requests (don't refresh twice)
**And** the implementation has unit tests

### Requirement: Implement Form Validation

All authentication forms MUST have robust client-side validation with clear user feedback.

#### Scenario: Implement real-time email validation

**Given** Engrid is implementing email validation
**When** they create the email input component
**Then** the component validates email format on blur
**And** the component shows inline error message for invalid format
**And** the component checks if email exists (API call) on blur
**And** the component debounces the "email exists" check (500ms)
**And** the component shows helpful message if email already exists
**And** the component uses Zod schema for validation
**And** the validation is accessible (ARIA attributes for errors)

#### Scenario: Implement password strength indicator

**Given** Engrid is implementing password strength feedback
**When** they create the password strength component
**Then** the component calculates strength score (0-4) based on criteria
**And** the component updates in real-time as user types
**And** the component shows visual meter (progress bar with color coding)
**And** the component shows strength label (Weak, Fair, Good, Strong)
**And** the component shows requirements checklist (8+ chars, uppercase, lowercase, number)
**And** the component uses checkmarks to show met requirements
**And** the calculation function has unit tests
**And** the component has unit tests (React Testing Library)

### Requirement: Implement Routing and Navigation

Authentication flows MUST integrate seamlessly with app navigation and route protection.

#### Scenario: Implement route guards on web

**Given** Engrid is implementing routing
**When** they set up React Router
**Then** public routes (login, register, etc.) are accessible when logged out
**And** public routes redirect to dashboard if user is already authenticated
**And** protected routes (dashboard, settings, etc.) are only accessible when authenticated
**And** protected routes redirect to login if user is not authenticated
**And** the default route (/) redirects based on authentication state
**And** route transitions are smooth (no flash of wrong content)
**And** the implementation preserves intended destination (redirect after login)

#### Scenario: Implement navigation on mobile

**Given** Engrid/Maya is implementing mobile navigation
**When** they set up React Navigation
**Then** the app conditionally renders AuthNavigator or MainNavigator based on auth state
**And** the auth stack includes all auth screens (Welcome, Login, Register, etc.)
**And** the main stack includes all authenticated screens (Dashboard, Profile, etc.)
**And** the app switches stacks when auth state changes (no manual navigation)
**And** screen transitions feel native
**And** deep links are properly handled and navigate to correct screen

### Requirement: Implement Error Handling

All authentication flows MUST handle errors gracefully with user-friendly messages and recovery options.

#### Scenario: Map backend errors to user-friendly messages

**Given** Engrid is implementing error handling
**When** they handle API errors
**Then** they create a mapping of error codes to friendly messages:
  - `invalid_credentials` → "Email or password is incorrect. Please try again."
  - `email_not_confirmed` → "Please verify your email before logging in. Check your inbox."
  - `user_already_exists` → "An account with this email already exists. Try signing in instead."
  - `weak_password` → "This password is too weak. Please choose a stronger password."
  - `invalid_token` → "This link has expired or is invalid. Please request a new one."
  - `network_error` → "We couldn't connect to the server. Please check your internet connection."
  - `rate_limit_exceeded` → "Too many attempts. Please try again in a few minutes."
**And** they display errors inline where relevant (field-level errors)
**And** they display errors in alerts/modals for general errors
**And** they provide recovery actions (retry button, "Forgot password?" link)
**And** they log errors to error monitoring service (Sentry)

#### Scenario: Handle offline scenarios

**Given** a user is using the app without internet connection
**When** they attempt an authentication action
**Then** the app detects the network is unavailable
**And** the app shows a clear message: "No internet connection. Please check your network and try again."
**And** the app disables form submission until connection is restored
**And** the app retains form input so user doesn't lose data
**And** the app provides a "Retry" button
**And** on mobile, the app shows a persistent banner when offline

## Quality Checklist

When implementing or modifying this capability, ensure:

- [ ] All authentication flows are implemented and working
- [ ] All flows have proper error handling with user-friendly messages
- [ ] All flows have loading states
- [ ] All flows track analytics events
- [ ] Forms have real-time validation with clear error messages
- [ ] Password strength indicator updates in real-time
- [ ] Email exists check happens asynchronously without blocking
- [ ] Route guards work correctly on web
- [ ] Navigation stack switching works correctly on mobile
- [ ] Auth state is persisted securely
- [ ] Session refresh works automatically
- [ ] Logout clears all state and redirects to login
- [ ] All code is TypeScript with proper types
- [ ] All functions have JSDoc comments
- [ ] Unit tests cover 90%+ of code
- [ ] Integration tests cover all auth flows
- [ ] E2E tests cover critical paths
- [ ] Code is organized in logical folder structure
- [ ] No sensitive data is logged
- [ ] All API calls are properly error-handled

## Notes

These modifications extend the Software Engineering capability to include comprehensive authentication implementation requirements. The focus is on:
1. Shared code between web and mobile
2. Robust validation and error handling
3. Proper state management and persistence
4. High test coverage
5. User-friendly error messages
