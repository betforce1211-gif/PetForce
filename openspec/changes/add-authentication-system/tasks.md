# Implementation Tasks: Authentication System

## Overview

This document outlines the implementation tasks for adding a comprehensive authentication system to PetForce with email/password, magic links, Google SSO, Apple SSO, biometric authentication, and optional 2FA.

## Task Categories

Tasks are organized into phases for incremental delivery:
- **Phase 1**: Core Authentication (email/password, email verification, session management)
- **Phase 2**: Passwordless (magic links, rate limiting, account protection)
- **Phase 3**: SSO (Google and Apple OAuth)
- **Phase 4**: Enhanced Security (biometric authentication, optional 2FA)
- **Phase 5**: Polish & Production (monitoring, analytics, optimization)

---

## Phase 1: Core Authentication (Foundation)

### 1.1 Database Schema Setup
- [ ] Design and create `users` table (id, email, email_verified, hashed_password, created_at, etc.)
- [ ] Design and create `sessions` table (id, user_id, access_token_hash, refresh_token_hash, expires_at, etc.)
- [ ] Design and create `email_verifications` table (id, user_id, token_hash, expires_at, verified_at)
- [ ] Design and create `password_resets` table (id, user_id, token_hash, expires_at, used_at)
- [ ] Create database indexes for performance (email, tokens, user_id lookups)
- [ ] Set up database migrations with versioning
- [ ] Validate schema with Engrid and Isabel

### 1.2 Authentication Service Core
- [ ] Create authentication service module (TypeScript/Go)
- [ ] Implement password hashing with bcrypt (cost factor 12)
- [ ] Implement JWT token generation (access tokens, 15 min expiration)
- [ ] Implement refresh token generation (cryptographically random, 7 days)
- [ ] Implement token verification and validation logic
- [ ] Create user repository for database operations
- [ ] Create session repository for session management
- [ ] Write unit tests for token generation/validation (Tucker)
- [ ] Write unit tests for password hashing (Tucker)

### 1.3 Registration Endpoint
- [ ] Create POST /auth/register endpoint (email, password)
- [ ] Implement email format validation
- [ ] Implement email duplication check with real-time feedback
- [ ] Implement password complexity validation (8+ chars, mixed case, number)
- [ ] Hash password before storage
- [ ] Create user record in database
- [ ] Generate email verification token
- [ ] Return success response (don't auto-login)
- [ ] Write integration tests for registration flow (Tucker)
- [ ] Validate with Axel (API design review)

### 1.4 Email Verification System
- [ ] Design email verification email template (Thomas, Dexter)
- [ ] Set up email service integration (Resend/SendGrid/AWS SES)
- [ ] Configure email DNS (SPF, DKIM, DMARC) with Isabel
- [ ] Create POST /auth/verify/send endpoint (resend verification)
- [ ] Create GET /auth/verify/:token endpoint
- [ ] Implement verification token generation (32 bytes, random)
- [ ] Implement verification token validation (expiration, single-use)
- [ ] Mark user email as verified in database
- [ ] Send welcome email after successful verification
- [ ] Implement rate limiting for verification resends (5 per day)
- [ ] Write integration tests for email verification flow (Tucker)

### 1.5 Login Endpoint
- [ ] Create POST /auth/login endpoint (email, password)
- [ ] Implement email lookup (timing-safe)
- [ ] Implement password verification (timing-safe comparison)
- [ ] Implement failed login attempt tracking
- [ ] Implement account lockout after 5 failed attempts (15 min lock)
- [ ] Generate access and refresh tokens on successful login
- [ ] Create session record in database
- [ ] Return tokens and user info
- [ ] Write integration tests for login flow (Tucker)
- [ ] Write security tests for brute force protection (Samantha, Tucker)

### 1.6 Session Management Endpoints
- [ ] Create POST /auth/refresh endpoint (refresh token rotation)
- [ ] Create POST /auth/logout endpoint (session invalidation)
- [ ] Create GET /auth/me endpoint (current user info)
- [ ] Implement access token validation middleware
- [ ] Implement refresh token rotation logic
- [ ] Write integration tests for session management (Tucker)

### 1.7 Password Management Endpoints
- [ ] Create POST /auth/password/forgot endpoint
- [ ] Create POST /auth/password/reset endpoint
- [ ] Create POST /auth/password/change endpoint (authenticated)
- [ ] Design password reset email template (Thomas, Dexter)
- [ ] Design password changed confirmation email template (Thomas, Dexter)
- [ ] Implement password reset token generation (32 bytes, 1 hour expiration)
- [ ] Implement password reset flow (token validation, password update)
- [ ] Invalidate all sessions on password change (security)
- [ ] Implement rate limiting for password reset (3 per hour per email)
- [ ] Write integration tests for password management (Tucker)

### 1.8 Authentication UI - Registration
- [ ] Design registration screen mockups (Dexter)
- [ ] Implement registration form UI (email, password inputs)
- [ ] Implement real-time email validation
- [ ] Implement password strength indicator
- [ ] Implement password show/hide toggle
- [ ] Implement error message display
- [ ] Implement "Check your email" success screen
- [ ] Ensure WCAG AA compliance (Dexter)
- [ ] Test on multiple screen sizes (Tucker, Dexter)

### 1.9 Authentication UI - Login
- [ ] Design login screen mockups (Dexter)
- [ ] Implement login form UI (email, password inputs)
- [ ] Implement "Forgot password?" link
- [ ] Implement error message display (wrong credentials, unverified email, locked account)
- [ ] Implement loading states during API calls
- [ ] Test keyboard navigation and accessibility (Tucker, Dexter)

### 1.10 Authentication UI - Email Verification
- [ ] Design email verification templates (HTML email) (Dexter, Thomas)
- [ ] Implement email verification screen ("Check your email")
- [ ] Implement resend verification button with countdown
- [ ] Implement verification success redirect to onboarding/dashboard
- [ ] Implement verification error handling (expired, invalid token)

### 1.11 Authentication UI - Password Reset
- [ ] Design password reset email template (Dexter, Thomas)
- [ ] Implement "Forgot password" screen (email input)
- [ ] Implement password reset form (new password, confirm password)
- [ ] Implement password strength indicator
- [ ] Implement reset success flow (auto-login, redirect)

### 1.12 Security Review - Phase 1
- [ ] Review password hashing implementation (Samantha)
- [ ] Review JWT token security (Samantha)
- [ ] Review session management (Samantha)
- [ ] Review rate limiting implementation (Samantha)
- [ ] Review email template security (no XSS) (Samantha)
- [ ] Penetration testing for Phase 1 endpoints (Samantha, Tucker)
- [ ] Address all security findings before proceeding

### 1.13 Testing - Phase 1
- [ ] Write unit tests for all authentication functions (Tucker)
- [ ] Write integration tests for all endpoints (Tucker)
- [ ] Write E2E tests for registration flow (Tucker)
- [ ] Write E2E tests for login flow (Tucker)
- [ ] Write E2E tests for password reset flow (Tucker)
- [ ] Achieve 90%+ test coverage (Tucker)

### 1.14 Documentation - Phase 1
- [ ] Document API endpoints (OpenAPI spec) (Axel, Thomas)
- [ ] Write authentication integration guide for developers (Thomas)
- [ ] Write user-facing documentation (how to register, verify email, reset password) (Thomas)
- [ ] Create troubleshooting guide for common issues (Thomas)

---

## Phase 2: Passwordless Authentication & Protection

### 2.1 Magic Link Authentication
- [ ] Design magic link database schema (magic_links table)
- [ ] Create POST /auth/magic-link/send endpoint
- [ ] Create GET /auth/magic-link/verify/:token endpoint
- [ ] Design magic link email template (Dexter, Thomas)
- [ ] Implement magic link token generation (32 bytes, 15 min expiration)
- [ ] Implement magic link verification (single-use, expiration check)
- [ ] Create or update user account on magic link verification
- [ ] Implement rate limiting (3 per 15 min per email)
- [ ] Write integration tests for magic link flow (Tucker)
- [ ] Validate with Samantha (security review)

### 2.2 Magic Link UI
- [ ] Design magic link flow mockups (Dexter)
- [ ] Implement "Sign in with magic link" button on login screen
- [ ] Implement magic link request screen (email input only)
- [ ] Implement "Check your email" confirmation screen
- [ ] Implement magic link verification success flow
- [ ] Implement magic link error handling (expired, invalid)

### 2.3 Rate Limiting Infrastructure
- [ ] Set up Redis for rate limiting (Isabel)
- [ ] Implement rate limiting middleware (per IP, per email, per user)
- [ ] Apply rate limiting to all authentication endpoints
- [ ] Implement 429 response with retry-after header
- [ ] Write tests for rate limiting (Tucker)
- [ ] Monitor rate limiting effectiveness (Larry)

### 2.4 Account Lockout System
- [ ] Implement failed login attempt tracking (in-memory or database)
- [ ] Implement account lockout after 5 failed attempts
- [ ] Implement 15-minute lockout duration
- [ ] Design account locked email template (Dexter, Thomas)
- [ ] Send account locked notification email
- [ ] Implement unlock via email verification link
- [ ] Write tests for account lockout (Tucker)

### 2.5 Security Review - Phase 2
- [ ] Review magic link security (Samantha)
- [ ] Review rate limiting implementation (Samantha)
- [ ] Review account lockout logic (Samantha)
- [ ] Test for bypasses and vulnerabilities (Samantha, Tucker)

### 2.6 Testing - Phase 2
- [ ] Write integration tests for magic link flow (Tucker)
- [ ] Write tests for rate limiting (Tucker)
- [ ] Write tests for account lockout (Tucker)
- [ ] Write E2E tests for magic link authentication (Tucker)

### 2.7 Documentation - Phase 2
- [ ] Document magic link API endpoints (Thomas)
- [ ] Document rate limiting behavior (Thomas)
- [ ] Update user documentation with magic link instructions (Thomas)

---

## Phase 3: SSO (Google & Apple)

### 3.1 OAuth Infrastructure Setup
- [ ] Register Google OAuth application (get client ID, client secret) (Isabel)
- [ ] Register Apple Sign In (get client ID, team ID, key ID) (Isabel)
- [ ] Store OAuth secrets in secrets manager (Isabel)
- [ ] Design oauth_connections database table
- [ ] Create OAuth connection repository

### 3.2 Google OAuth Implementation
- [ ] Create GET /auth/google endpoint (redirect to Google)
- [ ] Create GET /auth/google/callback endpoint
- [ ] Implement state parameter generation (CSRF protection)
- [ ] Implement authorization code exchange
- [ ] Implement ID token verification
- [ ] Extract user info (email, name, picture)
- [ ] Create or find user by Google email
- [ ] Save OAuth connection in database
- [ ] Create session and return tokens
- [ ] Write integration tests for Google OAuth (Tucker)

### 3.3 Apple OAuth Implementation
- [ ] Create GET /auth/apple endpoint (redirect to Apple)
- [ ] Create GET /auth/apple/callback endpoint
- [ ] Implement state parameter generation
- [ ] Implement authorization code exchange
- [ ] Implement ID token verification with Apple public keys
- [ ] Support "Hide My Email" feature
- [ ] Extract user info (email, name)
- [ ] Create or find user by Apple ID
- [ ] Save OAuth connection in database
- [ ] Create session and return tokens
- [ ] Write integration tests for Apple OAuth (Tucker)

### 3.4 OAuth UI - Web
- [ ] Design OAuth buttons (follow Google and Apple brand guidelines) (Dexter)
- [ ] Implement "Sign in with Google" button
- [ ] Implement "Sign in with Apple" button
- [ ] Implement OAuth loading states
- [ ] Implement OAuth error handling
- [ ] Handle OAuth callback and redirect flow
- [ ] Test OAuth flow on web (Tucker)

### 3.5 OAuth UI - Mobile (iOS)
- [ ] Integrate GoogleSignIn SDK for iOS (Maya)
- [ ] Integrate AuthenticationServices for Apple Sign In (Maya)
- [ ] Implement PKCE for mobile OAuth flows (Maya)
- [ ] Implement deep link handling for OAuth callbacks (Maya)
- [ ] Test Google OAuth on iOS (Tucker, Maya)
- [ ] Test Apple Sign In on iOS (Tucker, Maya)

### 3.6 OAuth Account Management
- [ ] Create GET /auth/oauth/connections endpoint (list connected providers)
- [ ] Create DELETE /auth/oauth/connections/:provider endpoint (disconnect)
- [ ] Implement UI to manage OAuth connections in settings (Dexter)
- [ ] Ensure at least one auth method remains (prevent lockout)

### 3.7 Security Review - Phase 3
- [ ] Review OAuth implementation (Samantha)
- [ ] Review state parameter validation (Samantha)
- [ ] Review ID token verification (Samantha)
- [ ] Review OAuth secrets management (Samantha)
- [ ] Test for OAuth vulnerabilities (CSRF, token leakage) (Samantha, Tucker)

### 3.8 Testing - Phase 3
- [ ] Write integration tests for Google OAuth (Tucker)
- [ ] Write integration tests for Apple OAuth (Tucker)
- [ ] Write E2E tests for OAuth flows (Tucker)
- [ ] Test error scenarios (user cancels, provider errors) (Tucker)

### 3.9 Documentation - Phase 3
- [ ] Document OAuth API endpoints (Thomas)
- [ ] Document OAuth setup process for developers (Thomas)
- [ ] Update user documentation with SSO instructions (Thomas)

---

## Phase 4: Enhanced Security (Biometric & 2FA)

### 4.1 Biometric Authentication Infrastructure
- [ ] Design biometric_devices database table
- [ ] Create POST /auth/biometric/enroll endpoint
- [ ] Create POST /auth/biometric/authenticate endpoint
- [ ] Create GET /auth/biometric/devices endpoint
- [ ] Create DELETE /auth/biometric/devices/:deviceId endpoint
- [ ] Implement biometric enrollment logic (store device + public key)
- [ ] Implement biometric authentication (verify signature with public key)
- [ ] Write tests for biometric endpoints (Tucker)

### 4.2 Biometric Authentication - iOS/macOS
- [ ] Implement biometric availability check (LAContext) (Maya)
- [ ] Implement biometric enrollment prompt after first login (Maya)
- [ ] Implement public/private key pair generation (Maya)
- [ ] Send public key to backend during enrollment (Maya)
- [ ] Implement biometric prompt on login (Face ID / Touch ID) (Maya)
- [ ] Sign challenge with private key on successful biometric (Maya)
- [ ] Send signature to backend for verification (Maya)
- [ ] Implement fallback to password if biometric fails (Maya)
- [ ] Implement biometric management in settings (Maya, Dexter)
- [ ] Test on devices with Face ID (Tucker, Maya)
- [ ] Test on devices with Touch ID (Tucker, Maya)

### 4.3 Two-Factor Authentication (2FA)
- [ ] Design 2FA database schema (totp_secret, backup_codes in users table)
- [ ] Create POST /auth/2fa/enable endpoint
- [ ] Create POST /auth/2fa/verify endpoint (confirm setup)
- [ ] Create POST /auth/2fa/disable endpoint
- [ ] Create POST /auth/2fa/backup-codes/regenerate endpoint
- [ ] Implement TOTP secret generation
- [ ] Implement QR code generation for authenticator apps
- [ ] Implement TOTP code verification (±1 time period tolerance)
- [ ] Implement backup code generation (10 codes, bcrypt hashed)
- [ ] Implement backup code verification (mark as used)
- [ ] Modify login flow to require 2FA code if enabled
- [ ] Write tests for 2FA enrollment and verification (Tucker)

### 4.4 2FA UI
- [ ] Design 2FA setup flow mockups (Dexter)
- [ ] Implement 2FA setup screen in settings (show QR code, manual code)
- [ ] Implement 2FA verification input (6-digit code)
- [ ] Implement backup codes display and download
- [ ] Implement 2FA code input during login (if enabled)
- [ ] Implement 2FA disable confirmation
- [ ] Test 2FA flow with authenticator apps (Tucker)

### 4.5 Security Review - Phase 4
- [ ] Review biometric implementation (Samantha)
- [ ] Review 2FA implementation (Samantha)
- [ ] Review TOTP secret encryption (Samantha)
- [ ] Review backup code hashing (Samantha)
- [ ] Test biometric and 2FA security (Samantha, Tucker)

### 4.6 Testing - Phase 4
- [ ] Write integration tests for biometric authentication (Tucker)
- [ ] Write integration tests for 2FA (Tucker)
- [ ] Write E2E tests for biometric flow (Tucker, Maya)
- [ ] Write E2E tests for 2FA flow (Tucker)

### 4.7 Documentation - Phase 4
- [ ] Document biometric API endpoints (Thomas)
- [ ] Document 2FA API endpoints (Thomas)
- [ ] Write user guide for enabling 2FA (Thomas)
- [ ] Write user guide for using biometric authentication (Thomas)

---

## Phase 5: Polish & Production Readiness

### 5.1 Logging & Monitoring Setup
- [ ] Implement authentication event logging (Larry)
- [ ] Log successful logins (userId, method, IP, timestamp)
- [ ] Log failed login attempts (email, IP, reason)
- [ ] Log password changes, resets, 2FA changes
- [ ] Log OAuth connections, session terminations
- [ ] Ensure logs don't contain passwords or tokens (Samantha)
- [ ] Set up correlation IDs for request tracing (Larry)
- [ ] Set up log aggregation (DataDog, CloudWatch, etc.) (Larry)

### 5.2 Metrics & Analytics
- [ ] Track registration completion rate (Ana)
- [ ] Track login success rate by auth method (Ana)
- [ ] Track email delivery success rate (Ana)
- [ ] Track OAuth success rate by provider (Ana)
- [ ] Track magic link usage rate (Ana)
- [ ] Track 2FA enrollment rate (Ana)
- [ ] Track average session duration (Ana)
- [ ] Track account lockout frequency (Ana)
- [ ] Create authentication dashboard in analytics tool (Ana)

### 5.3 Alerting
- [ ] Set up alert for high failed login rate (>100/min) (Larry)
- [ ] Set up alert for account lockout spike (Larry)
- [ ] Set up alert for OAuth provider errors (>10%) (Larry)
- [ ] Set up alert for email delivery failure (>5%) (Larry)
- [ ] Set up alert for suspicious login patterns (Larry)
- [ ] Configure alert notifications (email, Slack, PagerDuty) (Larry)

### 5.4 Performance Optimization
- [ ] Optimize database queries (add indexes if missing) (Engrid, Isabel)
- [ ] Implement caching for user lookups (Redis, 5 min TTL) (Engrid)
- [ ] Optimize password hashing performance (balance security and speed) (Engrid)
- [ ] Optimize JWT generation and verification (Engrid)
- [ ] Load test authentication endpoints (target: 1000 concurrent logins) (Tucker, Isabel)
- [ ] Optimize email sending (queue, batch if needed) (Engrid, Isabel)

### 5.5 Security Hardening
- [ ] Run penetration testing on all auth endpoints (Samantha)
- [ ] Run OWASP ZAP scan (Samantha)
- [ ] Review secrets management (Samantha, Isabel)
- [ ] Review HTTPS/TLS configuration (Samantha, Isabel)
- [ ] Review CORS configuration (Samantha, Axel)
- [ ] Review security headers (CSP, HSTS, X-Frame-Options) (Samantha, Engrid)
- [ ] Address all security findings

### 5.6 Email Template Polish
- [ ] Finalize email templates with branding (Dexter, Thomas)
- [ ] Test emails in multiple email clients (Gmail, Outlook, Apple Mail) (Tucker)
- [ ] Ensure mobile-friendly email design (Dexter)
- [ ] Set up email preview testing (Litmus or Email on Acid) (Thomas)
- [ ] Implement email unsubscribe for marketing (not transactional) (Engrid, Thomas)

### 5.7 User Session Management UI
- [ ] Design active sessions screen (Dexter)
- [ ] Implement GET /auth/sessions endpoint
- [ ] Implement DELETE /auth/sessions/:sessionId endpoint
- [ ] Display all active sessions (device, location, last activity)
- [ ] Implement "Sign out" button for each session
- [ ] Implement "Sign out all other devices" button
- [ ] Test session management flow (Tucker)

### 5.8 Error Message Refinement
- [ ] Review all error messages for clarity (Dexter, Thomas)
- [ ] Ensure error messages are actionable (tell user what to do)
- [ ] Ensure error messages use family-friendly tone
- [ ] Ensure error messages don't leak sensitive info (Samantha)
- [ ] Test error scenarios comprehensively (Tucker)

### 5.9 Deployment Preparation
- [ ] Set up staging environment for authentication service (Isabel, Chuck)
- [ ] Configure environment variables for all environments (Isabel)
- [ ] Set up database migrations for production (Chuck, Isabel)
- [ ] Configure email service for production (Isabel)
- [ ] Set up OAuth apps for production (Google, Apple) (Isabel)
- [ ] Create deployment runbook (Chuck, Thomas)
- [ ] Create rollback plan (Chuck)

### 5.10 Customer Success Preparation
- [ ] Create onboarding materials for new users (Casey, Thomas)
- [ ] Create FAQ for authentication issues (Casey, Thomas)
- [ ] Train support team on authentication troubleshooting (Casey)
- [ ] Set up customer health tracking for auth issues (Casey)
- [ ] Create support macros for common auth problems (Casey)

### 5.11 Documentation Completion
- [ ] Complete API documentation (OpenAPI spec) (Thomas, Axel)
- [ ] Complete developer integration guide (Thomas)
- [ ] Complete user-facing help articles (Thomas)
- [ ] Create video tutorials for registration, login, 2FA setup (Thomas, optional)
- [ ] Create architecture diagrams for documentation (Thomas, Engrid)
- [ ] Review all documentation for accuracy (Thomas)

### 5.12 Final Testing
- [ ] Run full regression test suite (Tucker)
- [ ] Run performance tests under load (Tucker, Isabel)
- [ ] Run security tests (Samantha, Tucker)
- [ ] Run accessibility tests (WCAG AA) (Dexter, Tucker)
- [ ] Test on multiple browsers (Chrome, Firefox, Safari, Edge) (Tucker)
- [ ] Test on multiple devices (iOS, Android, desktop) (Tucker, Maya)
- [ ] User acceptance testing with beta users (Peter, Casey)

### 5.13 Feature Development Process Checklist
- [ ] Peter completes Requirements Checklist
- [ ] Dexter completes UI Design Checklist
- [ ] Axel completes API Design Checklist
- [ ] Engrid completes Implementation Checklist
- [ ] Maya completes Mobile Implementation Checklist (iOS/macOS)
- [ ] Tucker completes Testing Checklist
- [ ] Samantha completes Security Checklist
- [ ] Thomas completes Documentation Checklist
- [ ] Isabel completes Infrastructure Checklist
- [ ] Chuck completes Deployment Checklist
- [ ] Larry completes Monitoring/Observability Checklist
- [ ] Casey completes Customer Impact Checklist
- [ ] Attach all checklists to release notes

### 5.14 Release Preparation
- [ ] Create release notes with feature summary (Thomas)
- [ ] Include checklist summary in release notes (Thomas)
- [ ] Link to full checklists in release directory (Thomas)
- [ ] Prepare communication plan (announce to users) (Peter, Casey)
- [ ] Schedule deployment (Chuck)
- [ ] Notify team of deployment timeline (Peter)
- [ ] Prepare post-deployment monitoring plan (Larry)

---

## Dependencies

**Sequential Dependencies**:
- Phase 1 must complete before Phase 2 (core auth is foundation)
- Phase 3 (OAuth) can start after Phase 1 is stable
- Phase 4 (biometric, 2FA) can start after Phase 1 is stable
- Phase 5 (polish) requires Phase 1-4 to be feature-complete

**Parallel Opportunities**:
- Frontend and backend can be developed in parallel within each phase
- Email templates can be designed in parallel with backend implementation
- Documentation can be written as features are completed
- Testing can happen continuously alongside development

**External Dependencies**:
- Email service provider setup (Resend/SendGrid account)
- Google OAuth app registration (Google Cloud Console)
- Apple Sign In registration (Apple Developer account)
- Database provisioned and accessible
- Redis instance for rate limiting
- Secrets manager setup (AWS Secrets Manager, Vault)

---

## Validation Criteria

Each task is complete when:
- Code is written and passes linting
- Unit tests written and passing
- Integration tests written and passing (where applicable)
- Security review passed (Samantha sign-off)
- Code review completed (peer review)
- Documentation updated
- Deployed to staging and verified

---

## Success Metrics

**Feature Complete When**:
- All 5 authentication methods working (email/password, magic link, Google, Apple, biometric)
- Email verification required and functioning
- Email duplication check prevents duplicate accounts
- Forgot password flow works reliably
- Welcome email sends after verification
- 2FA available in settings (optional, not forced)
- All security checklists passed (Samantha)
- All testing checklists passed (Tucker)
- API documentation complete (Thomas)
- WCAG AA compliance verified (Dexter)
- All agent checklists complete for FDP

**Production Ready When**:
- 90%+ registration completion rate
- < 2 minute average registration time
- Zero P0/P1 security vulnerabilities
- 99.9% uptime for auth endpoints
- < 500ms p95 login latency
- Email delivery rate > 95%
- OAuth success rate > 95%
- All agents have signed off on checklists

---

**Tasks Owner**: Peter (Product Management) coordinates, all agents contribute
**Total Estimated Tasks**: 200+ individual tasks across 5 phases
**Critical Path**: Phase 1 → Phase 2 → Phase 5 (minimum viable authentication)
