# Implementation Tasks

## 1. Investigation & Documentation
- [x] 1.1 Identify root cause (Supabase email confirmation setting)
- [x] 1.2 Document which agents failed their checklists
- [x] 1.3 Create comprehensive proposal with team accountability
- [x] 1.4 Review Supabase dashboard to confirm user state (requires manual dashboard access - skipped for automated implementation)

## 2. Add Centralized Logging Infrastructure (Larry's Responsibility)
- [x] 2.1 Create `packages/auth/src/utils/logger.ts` with structured logging
- [x] 2.2 Add log levels (DEBUG, INFO, WARN, ERROR)
- [x] 2.3 Add request ID tracking for correlation
- [x] 2.4 Add user context to all auth logs
- [x] 2.5 Configure log output (console for dev, service for prod)

## 3. Update Registration API with Logging
- [x] 3.1 Add logging at start of registration attempt
- [x] 3.2 Log Supabase signUp call with request ID
- [x] 3.3 Log email confirmation status in response
- [x] 3.4 Log user creation with confirmation state
- [x] 3.5 Add structured error logging with context
- [x] 3.6 Return confirmation state in API response

## 4. Add Email Confirmation Tracking
- [x] 4.1 Create helper to check if user is confirmed
- [x] 4.2 Add confirmation state to User type
- [x] 4.3 Log when confirmation email is sent
- [x] 4.4 Add endpoint to resend confirmation email
- [x] 4.5 Add endpoint to check confirmation status

## 5. Update Login Flow to Handle Unconfirmed Users
- [x] 5.1 Check confirmation status on login attempt
- [x] 5.2 Return clear error if user not confirmed
- [x] 5.3 Log unconfirmed login attempts
- [x] 5.4 Provide "resend email" option in error response

## 6. Add Comprehensive Tests (Tucker's Checklist)
- [x] 6.1 Test: Registration creates user in database
- [x] 6.2 Test: User is marked as unconfirmed after registration
- [x] 6.3 Test: Login fails for unconfirmed user with clear error
- [x] 6.4 Test: Resend confirmation email works
- [x] 6.5 Test: Login succeeds after email confirmation
- [x] 6.6 Test: Integration test for full flow (register → confirm → login)
- [x] 6.7 Test: Logging captures all registration events
- [x] 6.8 Test: Request IDs are consistent across log entries

## 7. Improve UX (Dexter's Requirements)
- [x] 7.1 Update registration success message to mention email
- [x] 7.2 Add "Check your email" page after registration
- [x] 7.3 Add "Resend verification email" button
- [x] 7.4 Show clear error when login attempted before confirmation
- [x] 7.5 Add link to resend email in login error
- [x] 7.6 Add confirmation status indicator

## 8. Add Monitoring & Alerts (Larry's Checklist)
- [x] 8.1 Create metrics for registration events
- [x] 8.2 Track confirmation rate (confirmed / registered)
- [x] 8.3 Track time-to-confirm distribution
- [x] 8.4 Set up alert: Registration success rate < 95%
- [x] 8.5 Set up alert: Confirmation rate < 70% (24hr window)
- [x] 8.6 Set up alert: Time-to-confirm p95 > 1 hour
- [x] 8.7 Create dashboard for registration funnel

## 9. Documentation Updates (Thomas's Responsibility)
- [x] 9.1 Document email confirmation flow in API.md
- [x] 9.2 Document logging structure and request IDs
- [x] 9.3 Document resend confirmation email endpoint
- [x] 9.4 Update ARCHITECTURE.md with confirmation state handling
- [x] 9.5 Add troubleshooting guide for "user not in database" issues

## 10. Create Agent Checklists for Future (Peter's Responsibility)
- [x] 10.1 Create Peter's checklist: Email confirmation flow requirements
- [x] 10.2 Create Tucker's checklist: Database persistence tests required
- [x] 10.3 Create Larry's checklist: Auth event logging requirements
- [x] 10.4 Create Engrid's checklist: State validation after API calls
- [x] 10.5 Add checklists to openspec/specs/*/spec.md files

## Validation Criteria

All tasks are complete when:
- ✅ All registration events are logged with request IDs
- ✅ User confirmation state is tracked and visible
- ✅ Login provides clear error for unconfirmed users
- ✅ Resend confirmation email works
- ✅ All tests pass (including new integration tests)
- ✅ Monitoring dashboard shows registration funnel
- ✅ Alerts are configured and tested
- ✅ Documentation is updated
- ✅ Agent checklists are created for future prevention
