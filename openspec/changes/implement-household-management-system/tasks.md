# Tasks: Implement Household Management System

**Change ID**: `implement-household-management-system`

## Task Sequence

Tasks are ordered for incremental delivery with validation at each step. Each task should be committed separately.

---

### Phase 1: Database Foundation (Database-Agnostic Design)

- [ ] **Task 1.1**: Create database migration file `002_households_system.sql`
  - Create `households` table with columns, constraints, indexes
  - Create `household_members` table with role/status tracking
  - Create `household_join_requests` table for approval workflow
  - Add all necessary indexes for performance
  - Add table/column comments for documentation
  - **Validation**: Migration runs successfully, tables created
  - **Files**: `packages/auth/migrations/002_households_system.sql`

- [ ] **Task 1.2**: Add Row-Level Security policies to all household tables
  - Households: View own, create, update/delete (leader only)
  - Members: View household members, leader can modify
  - Join Requests: View own, leader can view/update household requests
  - **Validation**: Policies prevent unauthorized access
  - **Files**: `packages/auth/migrations/002_households_system.sql` (append)

- [ ] **Task 1.3**: Run migration and verify database setup
  - Execute migration against development database
  - Verify tables exist with correct schema
  - Verify indexes are created
  - Verify RLS policies are active
  - **Validation**: `SELECT * FROM households` works with RLS
  - **Files**: Migration applied to database

---

### Phase 2: API Layer (Backend Logic)

- [ ] **Task 2.1**: Create TypeScript types for household domain
  - Define `Household`, `HouseholdMember`, `JoinRequest` interfaces
  - Define `HouseholdErrorCode` enum
  - Define API request/response types
  - **Validation**: Types compile without errors
  - **Files**: `packages/auth/src/types/household.ts`

- [ ] **Task 2.2**: Implement invite code generation utility
  - Create `generateInviteCode(householdName: string)` function
  - Format: `PREFIX-YEAR-RANDOM` (e.g., "ZEDER-2024-ALPHA")
  - Ensure uniqueness check against database
  - Write unit tests for code generation
  - **Validation**: Tests pass, codes are unique and well-formatted
  - **Files**: `packages/auth/src/utils/invite-codes.ts`, `packages/auth/src/utils/__tests__/invite-codes.test.ts`

- [ ] **Task 2.3**: Implement household-api.ts core functions
  - `createHousehold(name: string)`: Create household + add leader as member
  - `getHousehold(userId: string)`: Get user's current household
  - `requestJoinHousehold(userId, inviteCode)`: Create join request
  - `respondToJoinRequest(requestId, action)`: Approve/reject (leader only)
  - `removeMember(householdId, memberId)`: Remove member (leader only)
  - `regenerateInviteCode(householdId)`: Generate new code (leader only)
  - `leaveHousehold(householdId, userId)`: Leave household (auto-promote if leader)
  - **Validation**: All functions work with proper error handling
  - **Files**: `packages/auth/src/api/household-api.ts`

- [ ] **Task 2.4**: Add comprehensive error handling for household operations
  - Handle `ALREADY_IN_HOUSEHOLD`, `INVALID_INVITE_CODE`, etc.
  - Return user-friendly error messages
  - Log errors with correlation IDs (Larry's logging patterns)
  - **Validation**: All error paths return proper error objects
  - **Files**: `packages/auth/src/api/household-api.ts`

- [ ] **Task 2.5**: Write unit tests for household-api.ts
  - Test household creation (includes leader as member)
  - Test join request flow (request → approve → member added)
  - Test rejection flow (request → reject → no member)
  - Test member removal (not leader)
  - Test leader removal (auto-promote longest member)
  - Test invite code regeneration
  - Test error cases (invalid codes, permissions, etc.)
  - **Validation**: All tests pass, >80% coverage
  - **Files**: `packages/auth/src/api/__tests__/household-api.test.ts`

---

### Phase 3: State Management (Client-Side)

- [ ] **Task 3.1**: Create Zustand household store
  - Define `useHouseholdStore` with state and actions
  - Actions: fetchHousehold, createHousehold, joinHousehold, etc.
  - Handle loading/error states
  - **Validation**: Store compiles and can be imported
  - **Files**: `packages/auth/src/stores/household-store.ts`

- [ ] **Task 3.2**: Write tests for household store
  - Test household creation flow
  - Test join request flow
  - Test member management (approve, remove)
  - Test error state handling
  - **Validation**: All store tests pass
  - **Files**: `packages/auth/src/stores/__tests__/household-store.test.ts`

---

### Phase 4: UI Components (Web)

- [ ] **Task 4.1**: Create HouseholdOnboarding page component
  - Post-registration prompt: "Create" or "Join" household
  - Route: `/onboarding/household`
  - Simple, clean UI with clear CTAs
  - **Validation**: Page renders with both options
  - **Files**: `apps/web/src/features/households/pages/HouseholdOnboardingPage.tsx`

- [ ] **Task 4.2**: Create CreateHouseholdForm component
  - Input for household name (validation: 2-100 chars)
  - Submit button creates household via API
  - Show success message with invite code
  - Copy invite code to clipboard button
  - **Validation**: Form creates household and displays invite code
  - **Files**: `apps/web/src/features/households/components/CreateHouseholdForm.tsx`

- [ ] **Task 4.3**: Create JoinHouseholdForm component
  - Input for invite code
  - Submit button sends join request via API
  - Show "Request sent! Waiting for approval" message
  - Handle invalid invite code errors
  - **Validation**: Form sends join request with proper error handling
  - **Files**: `apps/web/src/features/households/components/JoinHouseholdForm.tsx`

- [ ] **Task 4.4**: Create HouseholdDashboard component
  - Display household name, member count
  - Show invite code (leader only)
  - List all household members with roles
  - Link to member management (leader only)
  - **Validation**: Dashboard shows household info correctly
  - **Files**: `apps/web/src/features/households/pages/HouseholdDashboardPage.tsx`

- [ ] **Task 4.5**: Create MemberList component
  - Show all household members
  - Display role badges (leader/member)
  - Display temporary member indicators
  - "Remove" button for each member (leader only, not self)
  - **Validation**: Member list renders with proper permissions
  - **Files**: `apps/web/src/features/households/components/MemberList.tsx`

- [ ] **Task 4.6**: Create PendingRequests component (Leader Only)
  - Show pending join requests
  - Display requester email
  - "Approve" and "Reject" buttons
  - Update UI when request is processed
  - **Validation**: Leader can approve/reject requests
  - **Files**: `apps/web/src/features/households/components/PendingRequests.tsx`

- [ ] **Task 4.7**: Create HouseholdSettings page (Leader Only)
  - Regenerate invite code button
  - Leave household button (with confirmation)
  - Display current invite code
  - **Validation**: Leader can regenerate code and leave
  - **Files**: `apps/web/src/features/households/pages/HouseholdSettingsPage.tsx`

- [ ] **Task 4.8**: Add household routes to app routing
  - `/onboarding/household` → HouseholdOnboardingPage
  - `/households` → HouseholdDashboardPage (protected route)
  - `/households/settings` → HouseholdSettingsPage (leader only)
  - **Validation**: All routes accessible with proper protection
  - **Files**: `apps/web/src/App.tsx` or router config

- [ ] **Task 4.9**: Update DashboardPage to show household info
  - Display household name in header
  - Add "Household" card linking to `/households`
  - Show member count
  - **Validation**: Dashboard shows household context
  - **Files**: `apps/web/src/features/auth/pages/DashboardPage.tsx`

- [ ] **Task 4.10**: Update post-registration flow to redirect to household onboarding
  - After email verification, redirect to `/onboarding/household`
  - After household setup, redirect to `/dashboard`
  - **Validation**: New users land on household onboarding
  - **Files**: `apps/web/src/features/auth/components/EmailPasswordForm.tsx`, `apps/web/src/features/auth/pages/EmailVerificationPendingPage.tsx`

---

### Phase 5: Mobile Implementation (Maya's Domain)

- [ ] **Task 5.1**: Create React Native HouseholdOnboarding screen
  - Match web functionality (create/join choice)
  - Mobile-optimized layout with proper touch targets
  - **Validation**: Screen renders on iOS and Android
  - **Files**: `apps/mobile/src/features/households/screens/HouseholdOnboardingScreen.tsx`

- [ ] **Task 5.2**: Create React Native CreateHousehold screen
  - Household name input
  - Submit button
  - Success screen with invite code
  - QR code generation for sharing
  - **Validation**: Can create household and generate QR code
  - **Files**: `apps/mobile/src/features/households/screens/CreateHouseholdScreen.tsx`

- [ ] **Task 5.3**: Create React Native JoinHousehold screen
  - Invite code input
  - QR code scanner button
  - Submit join request
  - **Validation**: Can join via code or QR scan
  - **Files**: `apps/mobile/src/features/households/screens/JoinHouseholdScreen.tsx`

- [ ] **Task 5.4**: Create React Native HouseholdDashboard screen
  - Show household name, members
  - Leader can manage members
  - Mobile-optimized member list
  - **Validation**: Dashboard works on mobile
  - **Files**: `apps/mobile/src/features/households/screens/HouseholdDashboardScreen.tsx`

- [ ] **Task 5.5**: Add household navigation to mobile app
  - Add routes for household screens
  - Update bottom tab navigation (if applicable)
  - Deep link support: `petforce://household/join?code=...`
  - **Validation**: Navigation works, deep links work
  - **Files**: `apps/mobile/src/navigation/` (relevant files)

---

### Phase 6: Testing (Tucker's Domain)

- [ ] **Task 6.1**: Write integration tests for household creation flow
  - User creates household → household exists in DB
  - User is automatically added as leader member
  - Invite code is unique and valid
  - **Validation**: All integration tests pass
  - **Files**: `packages/auth/src/__tests__/integration/household-creation.test.ts`

- [ ] **Task 6.2**: Write integration tests for join household flow
  - User requests to join → request created
  - Leader approves → user added as member
  - Leader rejects → request marked rejected, no member
  - **Validation**: All join flow tests pass
  - **Files**: `packages/auth/src/__tests__/integration/household-join.test.ts`

- [ ] **Task 6.3**: Write integration tests for member management
  - Leader removes member → member status='removed'
  - Leader regenerates code → old code invalid, new code works
  - Leader leaves (with other members) → longest member promoted
  - Non-leader cannot remove members → permission error
  - **Validation**: All member management tests pass
  - **Files**: `packages/auth/src/__tests__/integration/household-members.test.ts`

- [ ] **Task 6.4**: Write E2E tests for web household onboarding
  - New user creates household → sees invite code
  - New user joins household → sees "waiting for approval"
  - Leader approves join → user sees household dashboard
  - **Validation**: E2E tests pass in Playwright
  - **Files**: `apps/web/src/features/households/__tests__/e2e/household-onboarding.spec.ts`

- [ ] **Task 6.5**: Write E2E tests for household management
  - Leader views pending requests → approves/rejects
  - Leader removes member → member no longer in list
  - Leader regenerates invite code → new code shown
  - Member tries to remove another member → permission denied
  - **Validation**: E2E tests pass
  - **Files**: `apps/web/src/features/households/__tests__/e2e/household-management.spec.ts`

- [ ] **Task 6.6**: Write accessibility tests for household UI
  - All forms have proper labels
  - Buttons have accessible names
  - Proper heading hierarchy
  - Keyboard navigation works
  - **Validation**: Accessibility tests pass
  - **Files**: `apps/web/src/features/households/__tests__/accessibility.test.tsx`

---

### Phase 7: Analytics & Logging (Ana & Larry)

- [ ] **Task 7.1**: Implement analytics events for household operations
  - `household_created` - track household creation
  - `household_join_requested` - track join requests
  - `household_join_approved` - track approvals
  - `household_member_removed` - track member removals
  - `household_invite_code_regenerated` - track code regeneration
  - **Validation**: Events fire correctly in development
  - **Files**: `packages/auth/src/api/household-api.ts` (add tracking calls)

- [ ] **Task 7.2**: Add structured logging to household operations
  - Log household creation with correlation IDs
  - Log join requests with anonymized invite codes
  - Log approvals/rejections with context
  - Log errors with proper error codes
  - **Validation**: Logs appear in console with correct structure
  - **Files**: `packages/auth/src/api/household-api.ts` (add logger calls)

---

### Phase 8: Documentation (Thomas's Domain)

- [ ] **Task 8.1**: Write API documentation for household endpoints
  - Document all endpoints with request/response examples
  - Include error codes and meanings
  - Add authentication requirements
  - **Validation**: Docs are comprehensive and accurate
  - **Files**: `docs/api/HOUSEHOLD_API.md`

- [ ] **Task 8.2**: Write user guide for household features
  - How to create a household
  - How to join a household
  - How to manage members (leader guide)
  - How to share invite codes
  - **Validation**: User guide is clear and helpful
  - **Files**: `docs/features/households/USER_GUIDE.md`

- [ ] **Task 8.3**: Write technical architecture documentation
  - Database schema explanation
  - Security model (RLS policies)
  - API design decisions
  - State management approach
  - **Validation**: Architecture is well documented
  - **Files**: `docs/features/households/ARCHITECTURE.md`

- [ ] **Task 8.4**: Create developer setup guide
  - How to run migrations locally
  - How to test household features
  - How to add new household functionality
  - **Validation**: New developer can follow guide
  - **Files**: `docs/features/households/DEVELOPER_GUIDE.md`

---

### Phase 9: Security Review (Samantha's Domain)

- [ ] **Task 9.1**: Security audit of household invite codes
  - Verify codes are unpredictable
  - Verify codes can be regenerated/invalidated
  - Verify rate limiting on join attempts
  - Check for timing attacks in code validation
  - **Validation**: No security vulnerabilities found
  - **Files**: Security audit report

- [ ] **Task 9.2**: Security audit of RLS policies
  - Verify users can only view their households
  - Verify only leaders can modify households
  - Verify users can't bypass permissions
  - Test with different user scenarios
  - **Validation**: RLS policies are secure
  - **Files**: Security audit report

- [ ] **Task 9.3**: Security audit of member management
  - Verify leader-only operations are protected
  - Verify users can't remove themselves from household via exploit
  - Verify auto-promotion logic is secure
  - Check for privilege escalation vulnerabilities
  - **Validation**: No security issues found
  - **Files**: Security audit report

---

### Phase 10: Final Integration & Polish

- [ ] **Task 10.1**: Run full test suite (all tests must pass)
  - Unit tests (packages/auth)
  - Integration tests (household flows)
  - E2E tests (web and mobile)
  - Accessibility tests
  - **Validation**: 0 failing tests, coverage >80%
  - **Files**: Test results

- [ ] **Task 10.2**: Verify mobile/web feature parity (Maya's checklist)
  - All web features work on mobile
  - Mobile has QR code scanning (web doesn't need it)
  - UI is mobile-optimized
  - Deep links work
  - **Validation**: Maya approves mobile implementation
  - **Files**: Mobile parity checklist

- [ ] **Task 10.3**: Performance testing for household operations
  - Test household lookup with 100+ members
  - Test join request processing under load
  - Verify database indexes are used
  - Check query performance
  - **Validation**: All operations < 200ms response time
  - **Files**: Performance test results

- [ ] **Task 10.4**: User acceptance testing
  - Test complete onboarding flow (create household)
  - Test complete onboarding flow (join household)
  - Test leader workflows (approve, remove, regenerate)
  - Test member workflows (view, leave)
  - **Validation**: All user flows work smoothly
  - **Files**: UAT checklist

- [ ] **Task 10.5**: Update main dashboard to highlight households
  - Household card is prominent
  - Shows household name and member count
  - Links to household management
  - Shows "Create/Join household" if no household yet
  - **Validation**: Dashboard emphasizes household feature
  - **Files**: `apps/web/src/features/auth/pages/DashboardPage.tsx`

---

## Task Dependencies

### Parallel Work (Can be done simultaneously)
- Phase 3 (State Management) can start after Phase 2 (API) is complete
- Phase 4 (Web UI) and Phase 5 (Mobile) can be done in parallel after Phase 3
- Phase 7 (Analytics/Logging) can be integrated during Phase 2-5
- Phase 8 (Documentation) can be written during Phase 4-6

### Sequential Work (Must be done in order)
- Phase 1 (Database) must complete before Phase 2 (API)
- Phase 2 (API) must complete before Phase 3 (State)
- Phase 3 (State) must complete before Phase 4/5 (UI)
- Phase 6 (Testing) happens throughout but final tests after Phase 4/5
- Phase 9 (Security) review happens after implementation is complete
- Phase 10 (Integration) is the final phase

---

## Validation Criteria for Completion

All tasks must meet these criteria before marking complete:

1. **Code Quality**: Passes linting, type checking, builds successfully
2. **Tests**: All related tests pass, coverage >80% for new code
3. **Documentation**: Code is well-commented, complex logic explained
4. **Commit**: Changes are committed with clear conventional commit message
5. **Functionality**: Feature works as designed, no known bugs
6. **Security**: No security vulnerabilities introduced
7. **Accessibility**: UI components are accessible (WCAG 2.1 AA)
8. **Mobile Parity**: Feature works on mobile if user-facing

---

**Total Tasks**: 62
**Estimated Completion**: Ready for agent review and implementation planning
