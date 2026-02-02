# Agent Research & Quality Checklists
**Change ID**: implement-household-management-system
**Feature**: Household Management System - Core collaborative pet care
**Created**: 2026-02-01

---

## Peter (Product Management) Competitive Research

**Scope Review:**
This is THE core differentiator for PetForce - collaborative family pet care. As Product Management lead, I've researched competitors, best practices, and industry standards to ensure our implementation is world-class and competitive.

**Review Status**: HIGHLY APPLICABLE - This is our primary differentiator

### Competitor Analysis

#### **Rover** (Market Leader)
- **What they do**: Basic account sharing for households
- **Strengths**: Multiple people can share one account (useful for roommates)
- **Critical Weakness**: NO proper multi-owner support - only 1 owner name shown, other household members are anonymous to pet sitters
- **Gap**: Pet sitters don't know who they're talking to when the "other owner" messages them
- **Our Advantage**: We properly identify all household members with names and roles

#### **Wag!**
- **What they do**: Service marketplace only (dog walking, sitting)
- **Strengths**: Good at connecting with caregivers
- **Critical Weakness**: NO household/family sharing features at all
- **Gap**: Single-user focused, no collaboration
- **Our Advantage**: Built for families from day one

#### **Every Wag** (New App - Launched June 2025)
- **What they do**: Pet care management with profile sharing
- **Strengths**:
  - Share pet profiles with co-owners and caretakers
  - Share across households (divorced parents scenario)
  - Mark tasks complete, view files/contacts, coordinate
  - Explicitly marketed as "Perfect for families sharing pet care duties, co-parenting pets"
- **Weaknesses**: Very new (8 months old), limited user base
- **Our Advantage**: We can learn from their features and improve on UX

#### **PawWare: Shared Pet Care** (2026 App)
- **What they do**: Shared Hub (PawSpace) for managing pets together
- **Strengths**:
  - Real-time calendar reminders
  - Perfect for coordinating with teenagers and family
- **Weaknesses**: Limited feature set, basic
- **Our Advantage**: More comprehensive household management

#### **Petmaid** (2026 App)
- **What they do**: Collaborative task management
- **Strengths**:
  - Share responsibilities with family, friends, pet sitters
  - Assign feeding schedules, grooming, medication, exercise
  - Free trial on iOS and Android
- **Weaknesses**: Task-focused, not household-focused
- **Our Advantage**: Household is the foundation, tasks come later

#### **PetNote+**
- **What they do**: Pet data sharing with up to 15 members
- **Strengths**: Large member limit (15)
- **Weaknesses**: No role management, no invite system mentioned
- **Our Advantage**: Proper leader/member roles, secure invite codes

### Industry Standards (Non-Pet Apps)

#### **Google Family Link**
- **Best Practices Learned**:
  - ✅ Unique single-use invite links (security)
  - ✅ Time-limited invitations (expire in 2 weeks)
  - ✅ Country verification (same country requirement)
  - ✅ Strict family switching limits (once per 12 months)
  - ✅ Maximum member limits (6 members)
  - ❌ Too restrictive for pet care (we need more flexibility)

#### **Slack Workspace Management**
- **Best Practices Learned**:
  - ✅ Multiple invite methods: email invites, shareable links, domain-based
  - ✅ Invite links active for 30 days, up to 400 people
  - ✅ Access control levels: Open, By Request, Invite Only, Hidden
  - ✅ Resend/cancel pending invites
  - ✅ Guest access with different permission levels
  - ✅ Workflow automation for welcome messages
  - **CRITICAL**: This is too complex for pet care - we need simpler

#### **Discord Server Invites**
- **Best Practices Learned**:
  - ✅ Temporary invites (5 min to 7 days) vs permanent
  - ✅ Use count limits (e.g., invite expires after 10 uses)
  - ✅ Temporary membership: auto-kick on disconnect unless role assigned
  - ✅ Regenerate/revoke invites manually for security
  - ✅ Monitor active invites via admin panel
  - **IDEA**: Temporary membership is PERFECT for pet sitters!

#### **QR Code Best Practices (2026)**
- **Technical Requirements**:
  - ✅ Minimum 2cm x 2cm size for reliable scanning
  - ✅ High contrast, quiet zone (4 modules empty space)
  - ✅ Clear Call-to-Action ("Scan to Join Household")
  - ✅ Mobile-optimized landing page
  - ✅ Dynamic QR codes for tracking (vs static)
  - ✅ Branded codes signal legitimacy and trust
  - ✅ Test on different devices and lighting
- **Security (2026 Focus)**: Branded QR codes tied to recognizable domains

### Gaps Identified in Current Proposal

1. **MISSING: Invite Link Expiration**
   - Current: Invite codes never expire (security risk)
   - Competitor Standard: Google (2 weeks), Slack (30 days), Discord (configurable)
   - **Gap**: Old codes could be shared indefinitely

2. **MISSING: Multiple Invite Methods**
   - Current: Only manual code entry
   - Competitor Standard: Email invites, QR codes, shareable links
   - **Gap**: Mobile users want QR scan, web users want email

3. **MISSING: Invite Usage Limits**
   - Current: Unlimited uses per code
   - Discord Standard: Set max uses (e.g., 10 people)
   - **Gap**: Code could be shared publicly, go viral

4. **MISSING: Pending Request Visibility for Requester**
   - Current: User waits with no visibility
   - Best Practice: Show "Request Pending" status, allow withdrawal
   - **Gap**: Poor user experience waiting indefinitely

5. **MISSING: Household Member Limits**
   - Current: Unlimited members
   - Industry Standard: Google (6), Slack (varies by plan)
   - **Gap**: Could have performance issues, abuse scenarios

6. **MISSING: Co-Parenting Scenario**
   - Current: One household per user (Phase 1)
   - Every Wag: Coordinate across households
   - **Gap**: Divorced parents with shared custody can't both manage the pet

7. **MISSING: Welcome Message/Onboarding for New Members**
   - Current: Just added to household
   - Slack Best Practice: Automated welcome messages
   - **Gap**: New members don't know what to do next

8. **MISSING: Notification Preferences**
   - Current: All members get all notifications
   - Best Practice: Granular notification settings
   - **Gap**: Could overwhelm household members

9. **MISSING: Audit Log for Household Actions**
   - Current: Basic logging for developers
   - Enterprise Standard: User-visible audit log
   - **Gap**: "Who removed Bob?" - no transparency

10. **MISSING: Household Avatar/Photo**
    - Current: Name only
    - Competitors: Every Wag, PawWare have visual identity
    - **Gap**: Less personal, harder to distinguish multiple households (future)

### Recommended Requirement Changes

#### ADD Requirements:

1. **ADD: Time-Limited Invite Codes**
   - **New Requirement**: Invite codes SHALL expire after 30 days by default, with leader option to set custom expiration (7 days, 30 days, 90 days, never)
   - **Reasoning**: Security best practice (Slack 30 days, Google 14 days). Prevents old codes from being shared indefinitely. Leaders can regenerate for fresh code.
   - **Implementation**: Add `invite_code_expires_at` to households table, validate on join

2. **ADD: Email Invite Option**
   - **New Requirement**: Household leaders SHALL be able to invite members via email, sending a personalized invitation link that pre-fills the invite code
   - **Reasoning**: Slack/Google standard. Better UX than manually sharing codes. Personalizes invitation.
   - **Implementation**: New endpoint `/api/households/:id/invite-email`, requires recipient email

3. **ADD: Invite Usage Tracking**
   - **New Requirement**: System SHALL track which invite code was used by each member, who invited them (if email), and when they joined for audit purposes
   - **Reasoning**: Transparency, security, abuse detection. "Who invited this person?"
   - **Implementation**: Already have `household_join_requests.invite_code`, add `invited_by` field

4. **ADD: Pending Request Withdrawal**
   - **New Requirement**: Users with pending join requests SHALL be able to withdraw/cancel their request before leader responds
   - **Reasoning**: User control, prevents awkward situations. Standard in all competitor apps.
   - **Implementation**: New endpoint `/api/households/requests/:id/withdraw`

5. **ADD: Household Member Limit**
   - **New Requirement**: Households SHALL support up to 15 active members (not counting removed members), with clear error when limit reached
   - **Reasoning**: Prevents abuse, aligns with PetNote+ (15 members). Most families have 2-6 members, 15 is generous buffer.
   - **Implementation**: Database constraint, application-level check

6. **ADD: New Member Welcome Flow**
   - **New Requirement**: When a join request is approved, new member SHALL see a welcome screen explaining household features and prompting to complete profile
   - **Reasoning**: Onboarding best practice (mobile app onboarding research). Reduces confusion.
   - **Implementation**: Redirect to `/households/welcome` on first login after approval

7. **ADD: Activity Visibility for Join Requests**
   - **New Requirement**: Users SHALL see status of their pending join requests (Pending, Approved, Rejected) with timestamps and be notified of status changes
   - **Reasoning**: Transparency, reduces support burden. "Is my request still pending?"
   - **Implementation**: New endpoint `/api/households/my-requests`, push notifications

8. **ADD: Household Description Field**
   - **New Requirement**: Household leaders SHALL be able to add an optional description (e.g., "The Zeder family - 2 dogs, 3 cats") visible to all members
   - **Reasoning**: Context for new members, especially temporary pet sitters. "What am I joining?"
   - **Implementation**: Add `description` TEXT column to households table

9. **ADD: Rich QR Code Branding**
   - **New Requirement**: QR codes SHALL include PetForce logo/branding and clear Call-to-Action text ("Scan to Join [Household Name]") per 2026 best practices
   - **Reasoning**: Trust and legitimacy (QR code research). Users more likely to scan branded codes.
   - **Implementation**: Use dynamic QR code library with logo embedding

10. **ADD: Temporary Member Extensions**
    - **New Requirement**: Leaders SHALL be able to extend temporary member access before expiration without requiring re-invitation
    - **Reasoning**: Pet sitter stayed longer, vacation extended. Spec mentions this but not in formal requirements.
    - **Implementation**: New endpoint `/api/households/:id/members/:memberId/extend`

#### MODIFY Requirements:

1. **MODIFY: Invite Code Format**
   - **Current**: PREFIX-YEAR-RANDOM (e.g., "ZEDER-2024-ALPHA")
   - **Updated**: PREFIX-RANDOM (e.g., "ZEDER-ALPHA-BRAVO") - remove year for longevity
   - **Reasoning**: Year becomes outdated (looks stale in 2027). Random words are memorable without date baggage.

2. **MODIFY: Leadership Transfer**
   - **Current**: Auto-promote longest-standing member when leader leaves
   - **Updated**: Prompt leader to designate successor before leaving, with fallback to longest-standing if not designated
   - **Reasoning**: Better UX, prevents surprise promotions. Slack/Discord admins assign successors.
   - **Implementation**: Add `/api/households/:id/transfer-leadership` endpoint

3. **MODIFY: QR Code Implementation**
   - **Current**: "QR code generation for easy sharing"
   - **Updated**: QR codes SHALL use dynamic codes (not static) to support analytics tracking and future code updates without regenerating QR image
   - **Reasoning**: 2026 best practice - dynamic codes allow tracking scans, changing destination URL.
   - **Implementation**: Use QR code service with analytics (e.g., qrcodechimp, scanova)

4. **MODIFY: Household Name Constraints**
   - **Current**: 2-100 characters
   - **Updated**: 2-50 characters with alphanumeric + spaces only, no emojis
   - **Reasoning**: Prevents display issues, especially in QR codes and invite codes. 50 chars sufficient.
   - **Implementation**: Update CHECK constraint, add regex validation

5. **MODIFY: Temporary Member Notifications**
   - **Current**: Not specified
   - **Updated**: Temporary members SHALL receive notifications at 7 days, 3 days, and 1 day before expiration
   - **Reasoning**: Courtesy, prevents surprise lockouts. Pet sitter knows access is ending.
   - **Implementation**: Scheduled job checking temporary_expires_at

#### REMOVE Requirements:

1. **REMOVE: Case-Insensitive Invite Codes**
   - **Current Spec**: "Code is case-insensitive (ZEDER-2024-ALPHA == zeder-2024-alpha)"
   - **Reasoning**: Adds complexity, not necessary. Users can copy-paste. Uppercase is clearer.
   - **Action**: Make codes uppercase only, validate uppercase input

### Better Approaches

1. **Onboarding Flow: Progressive Disclosure**
   - **Current**: Force household setup immediately after registration
   - **Better**: Allow skip with "Set up household later" option, show benefits first
   - **Reasoning**: 2026 onboarding research - progressive onboarding beats forced flows
   - **Why Better**: Reduces registration friction, user can explore app first

2. **Invite Code UX: Smart Input**
   - **Current**: Manual text entry
   - **Better**: Auto-format as user types (add hyphens), detect clipboard content, suggest paste
   - **Reasoning**: Mobile UX best practice - reduce typing friction
   - **Why Better**: Faster, fewer errors, better mobile experience

3. **Member Roles: Visual Hierarchy**
   - **Current**: Text labels "Leader", "Member"
   - **Better**: Color-coded badges, icons (crown for leader, shield for temporary)
   - **Reasoning**: Visual hierarchy best practice - faster comprehension
   - **Why Better**: Immediate recognition, accessible, delightful

4. **Household Dashboard: Interactive Checklist**
   - **Current**: Not specified
   - **Better**: Show post-setup checklist: "✓ Created household, ⏸ Add pets, ⏸ Invite family"
   - **Reasoning**: Onboarding research - checklists increase completion, sense of progress
   - **Why Better**: Guides users, increases engagement, natural next steps

5. **Join Request Flow: Real-Time Approval**
   - **Current**: Email notification to leader, leader visits dashboard
   - **Better**: Push notification with "Approve" / "Reject" quick actions (mobile)
   - **Reasoning**: Modern mobile UX - reduce taps, instant gratification
   - **Why Better**: Faster approvals, better experience for both sides

### What Would Make This Feature More Competitive

1. **Smart Invite Suggestions**: "Invite your spouse?" based on shared email domain or contacts
2. **Household Templates**: Pre-fill household with common setups (2 dogs, 1 cat, etc.)
3. **Invite Link Preview**: Show household name, member count, pet count before joining
4. **Multi-Language Support**: Invite codes work globally, UI translates
5. **Video Tutorial**: 30-second video showing household setup (embedded in onboarding)
6. **Social Proof**: "100,000 families use households" badge on creation screen
7. **Gamification**: "Your household is complete!" celebration animation on first member join

### What Would Delight Users

1. **Custom Household Emoji**: Pick an emoji for your household (🏠🐕🐱) shown everywhere
2. **Member Avatars**: Show profile photos in member list (not just names)
3. **Join Celebration**: Confetti animation when new member joins, push to all members
4. **Household Milestones**: "Your household turned 1 year old!" celebrations
5. **Pet Sitter Mode**: One-tap toggle to "Pet Sitter Mode" with limited permissions
6. **Family Tree**: Visual graph of who invited whom (trust network)
7. **Household Stats**: "Your family logged 500 pet care tasks this month!"

**Checklist:**
1. [✓] Research Rover, Wag, Every Wag, PawWare, Petmaid (completed)
2. [✓] Research Google Family, Slack, Discord invite systems (completed)
3. [✓] Research QR code best practices for 2026 (completed)
4. [✓] Research mobile onboarding best practices (completed)
5. [✓] Identify gaps in current proposal (10 gaps identified)
6. [✓] Create requirement additions (10 new requirements)
7. [✓] Create requirement modifications (5 modifications)
8. [✓] Create requirement removals (1 removal)
9. [ ] Update spec delta files with new requirements (NEXT STEP)
10. [ ] Validate requirements with other agents (after spec updates)

**Questions/Concerns:**
- Should we support multiple households per user in Phase 1? (Every Wag does this for co-parenting)
  - **Decision**: Keep Phase 1 simple (one household), add to Phase 2 roadmap
- What happens if leader's email changes? Does household ownership transfer?
  - **Decision**: Ownership tied to user_id, not email. Email change doesn't affect leadership.
- Should we allow anonymous join requests? (Privacy for pet sitters)
  - **Decision**: No, all members must have verified accounts for security and trust.

---

## Tucker (QA/Testing) Research & Checklist

**Scope Review:**
Household management introduces complex multi-user scenarios, state machines (invite flow), and concurrent operations. This requires comprehensive test coverage across unit, integration, and E2E tests, with special attention to edge cases and race conditions.

**Review Status**: HIGHLY APPLICABLE - New feature requires full test pyramid

**Checklist:**

### Unit Tests
1. [ ] Test invite code generation uniqueness (100,000 iterations, no collisions)
2. [ ] Test invite code format validation (PREFIX-RANDOM pattern)
3. [ ] Test household name validation (2-50 chars, alphanumeric + spaces)
4. [ ] Test member role enum constraints (only 'leader', 'member')
5. [ ] Test member status enum constraints (only 'active', 'removed')
6. [ ] Test temporary member expiration logic (expired vs active)
7. [ ] Test leadership transfer selection (longest-standing member)
8. [ ] Test rate limiting logic (5 join requests per hour)
9. [ ] Test household member limit enforcement (15 max)
10. [ ] Test invite code expiration validation (30-day default)

### Integration Tests
11. [ ] Test atomic household creation (household + leader member both created or rolled back)
12. [ ] Test join request flow: submit → pending → approve → active member
13. [ ] Test join request flow: submit → pending → reject → no member
14. [ ] Test leader removes member → member loses access immediately
15. [ ] Test leader leaves → longest member promoted → household still functional
16. [ ] Test leader leaves (only member) → household soft-deleted
17. [ ] Test regenerate invite code → old code invalid → new code works
18. [ ] Test temporary member expiration → auto-revoke access
19. [ ] Test duplicate join request prevention
20. [ ] Test join with invalid invite code → clear error
21. [ ] Test join while already in household → error
22. [ ] Test approve request with non-leader user → permission error
23. [ ] Test remove member with non-leader user → permission error
24. [ ] Test household member count query accuracy
25. [ ] Test pending request list for leader (only shows their household requests)
26. [ ] Test user's household query (returns null if no household)
27. [ ] Test QR code generation from invite code
28. [ ] Test email invite delivery and link validation
29. [ ] Test pending request withdrawal by user
30. [ ] Test temporary member extension before expiration

### E2E Tests (Playwright - Web)
31. [ ] Test: User creates household → sees invite code → can copy to clipboard
32. [ ] Test: User joins household → request pending → leader approves → user sees household dashboard
33. [ ] Test: Leader views pending requests → approves → new member appears in list
34. [ ] Test: Leader removes member → member sees "removed" message on next access
35. [ ] Test: Leader regenerates invite code → new code displayed → old code fails
36. [ ] Test: User attempts to create household while already in one → error shown
37. [ ] Test: User attempts to join with invalid code → error shown
38. [ ] Test: Household onboarding flow complete (create → add members → dashboard)
39. [ ] Test: Member list displays all members with correct roles and badges
40. [ ] Test: Temporary member badge shows expiration date correctly
41. [ ] Test: Welcome flow shown to new member on first login after approval
42. [ ] Test: User withdraws pending join request → request disappears
43. [ ] Test: Leader sees household description in dashboard

### E2E Tests (Playwright - Mobile)
44. [ ] Test: QR code scanning opens join form with pre-filled code
45. [ ] Test: Mobile user creates household → QR code displayed → shareable
46. [ ] Test: Mobile push notification for join request → tap to view
47. [ ] Test: Mobile push notification for approval → tap to view household
48. [ ] Test: Mobile member list scrolls correctly (15 members)
49. [ ] Test: Mobile invite code input has smart formatting (auto-hyphen)
50. [ ] Test: Deep link opens household join flow with code parameter

### Security Tests
51. [ ] Test: Non-member cannot view household data (RLS policy)
52. [ ] Test: Removed member cannot view household data after removal
53. [ ] Test: Non-leader cannot update household name
54. [ ] Test: Non-leader cannot regenerate invite code
55. [ ] Test: Non-leader cannot approve/reject requests
56. [ ] Test: Non-leader cannot remove members
57. [ ] Test: User cannot join household with expired invite code
58. [ ] Test: User cannot approve request for different household
59. [ ] Test: SQL injection attempts in household name → safely handled
60. [ ] Test: XSS attempts in household name → sanitized

### Performance Tests
61. [ ] Test: Household lookup by invite code < 100ms (with 100k households)
62. [ ] Test: User's household query < 50ms (indexed by user_id)
63. [ ] Test: Pending requests query < 100ms (indexed by household_id + status)
64. [ ] Test: Member list query < 100ms (with 15 members)
65. [ ] Test: Concurrent join requests don't create duplicate members (race condition)
66. [ ] Test: Concurrent household creation doesn't create duplicate codes (race condition)

### Accessibility Tests
67. [ ] Test: Screen reader announces household name and member count
68. [ ] Test: Screen reader reads member roles (Leader, Member, Temporary)
69. [ ] Test: Invite code has aria-label for copy button
70. [ ] Test: Form validation errors announced to screen readers
71. [ ] Test: All buttons have min 44x44px touch targets (mobile)
72. [ ] Test: Keyboard navigation works for all household forms
73. [ ] Test: Focus states visible on all interactive elements

### Edge Cases & Error Scenarios
74. [ ] Test: Leader promotes themselves → error (must transfer leadership)
75. [ ] Test: User rate limit exceeded (6th join request in hour) → error
76. [ ] Test: Household at member limit (15) → new join request rejected
77. [ ] Test: Temporary member access extended while already expired → validation
78. [ ] Test: Leader transfers leadership to removed member → error
79. [ ] Test: Household with no active members → soft-deleted
80. [ ] Test: Join request after household deleted → invalid code error
81. [ ] Test: Approve already-approved request → idempotent (no duplicate member)
82. [ ] Test: Network interruption during household creation → rollback or complete
83. [ ] Test: Browser back button during onboarding → state preserved
84. [ ] Test: Invite code with special characters stripped correctly

### Data Integrity Tests
85. [ ] Test: Every household has exactly one leader at all times
86. [ ] Test: No orphaned household records (household without leader member)
87. [ ] Test: No duplicate household_members (unique constraint enforced)
88. [ ] Test: Removed members have status='removed', not hard-deleted
89. [ ] Test: Invite codes are globally unique (database constraint)
90. [ ] Test: Join requests reference valid household_id and user_id (foreign keys)

### Regression Tests (Future)
91. [ ] Test: Existing households unaffected by migration
92. [ ] Test: API backward compatibility with mobile app versions
93. [ ] Test: Database rollback preserves data integrity

**Questions/Concerns:**
- What's the test data strategy for E2E tests? (Create households before each test or use factories?)
- Should we test with production-scale data (1M households, 10M members)?
- How do we test push notifications in E2E tests? (Mock service or real Firebase?)
- What's the rollback plan if tests fail in production deployment?

---

## Samantha (Security) Research & Checklist

**Scope Review:**
Household management introduces multi-user access control, invite codes (authentication tokens), and permission systems. Security is critical: invite code leakage, unauthorized access, privilege escalation, and data exposure are all risks.

**Review Status**: HIGHLY APPLICABLE - Security affects every aspect of this feature

**Checklist:**

### Authentication & Authorization
1. [ ] Verify all household API endpoints require authentication (auth.uid() check)
2. [ ] Verify RLS policies prevent non-members from viewing household data
3. [ ] Verify RLS policies prevent non-leaders from modifying household
4. [ ] Verify leader-only endpoints (approve, reject, remove, regenerate) enforce leader role
5. [ ] Verify removed members cannot access household data (status='active' check)
6. [ ] Verify temporary members cannot access household after expiration
7. [ ] Verify users cannot access households they don't belong to (foreign household queries)
8. [ ] Verify join request approval checks requester isn't already a member
9. [ ] Verify leadership transfer validates new leader is active member

### Invite Code Security
10. [ ] Verify invite codes are sufficiently random (entropy analysis)
11. [ ] Verify invite codes are unique (database constraint + application check)
12. [ ] Verify invite codes are case-sensitive (prevents collision issues)
13. [ ] Verify expired invite codes are rejected on join attempts
14. [ ] Verify regenerated invite codes immediately invalidate old code
15. [ ] Verify invite codes are not logged in plaintext (redacted in logs)
16. [ ] Verify invite codes are rate-limited on validation attempts (prevent brute force)
17. [ ] Verify invite codes cannot be enumerated (no sequential pattern)
18. [ ] Verify QR codes don't expose sensitive household data beyond invite code
19. [ ] Verify email invites use secure, signed links (not just invite code in URL)

### Input Validation & Sanitization
20. [ ] Verify household name sanitized (XSS prevention)
21. [ ] Verify household name length constrained (2-50 chars)
22. [ ] Verify household name alphanumeric validation (no emojis, special chars)
23. [ ] Verify household description sanitized (XSS prevention)
24. [ ] Verify invite code format validated on join (prevent injection)
25. [ ] Verify member limits enforced (15 max) before insertion
26. [ ] Verify temporary_expires_at is in future (validation)
27. [ ] Verify email addresses validated before sending invites
28. [ ] Verify user_id references are validated (prevent fake user injection)

### Rate Limiting & Abuse Prevention
29. [ ] Verify join requests rate-limited (5 per hour per user)
30. [ ] Verify invite code regeneration rate-limited (10 per hour per household)
31. [ ] Verify household creation rate-limited (prevent spam households)
32. [ ] Verify email invites rate-limited (prevent spam)
33. [ ] Verify member removal rate-limited (prevent griefing)
34. [ ] Verify join request validation rate-limited (prevent brute force code guessing)

### Data Exposure & Privacy
35. [ ] Verify invite codes not exposed to non-leaders
36. [ ] Verify pending requests only visible to requester and household leader
37. [ ] Verify removed members' data not exposed (except audit logs for leaders)
38. [ ] Verify user email addresses only visible to household members
39. [ ] Verify household data not searchable by non-members (no public directory)
40. [ ] Verify member count accurate (excludes removed members)
41. [ ] Verify temporary expiration dates only visible to leaders and temporary member

### Concurrent Operations & Race Conditions
42. [ ] Verify atomic household creation (household + leader member transaction)
43. [ ] Verify concurrent join requests don't create duplicate members
44. [ ] Verify concurrent leadership transfers resolve correctly (last write wins or lock)
45. [ ] Verify concurrent invite code regenerations don't create multiple codes
46. [ ] Verify concurrent removals of same member are idempotent
47. [ ] Verify database constraints prevent orphaned households (leader always exists)

### Audit & Logging
48. [ ] Verify all household mutations logged (create, join, remove, transfer, regenerate)
49. [ ] Verify logs include correlation IDs for tracing
50. [ ] Verify logs redact sensitive data (invite codes, emails in some contexts)
51. [ ] Verify failed authorization attempts logged (security monitoring)
52. [ ] Verify rate limit violations logged (abuse detection)
53. [ ] Verify audit log accessible to household leaders (transparency)

### Session & Token Management
54. [ ] Verify session invalidation after member removal (force re-auth)
55. [ ] Verify invite links expire after single use (if email invites)
56. [ ] Verify invite link signatures prevent tampering (HMAC or JWT)
57. [ ] Verify QR codes don't expose session tokens or auth credentials

### Encryption & Data Protection
58. [ ] Verify household data encrypted at rest (database level)
59. [ ] Verify household data encrypted in transit (HTTPS only)
60. [ ] Verify invite codes transmitted securely (no HTTP, no SMS)
61. [ ] Verify email invites sent via secure email service (SPF, DKIM)

### Privilege Escalation Prevention
62. [ ] Verify member cannot promote themselves to leader
63. [ ] Verify member cannot remove leader
64. [ ] Verify member cannot change their own role
65. [ ] Verify leader cannot be removed by themselves (must transfer first)
66. [ ] Verify removed member cannot re-join without new approval
67. [ ] Verify temporary member cannot extend their own access

### Denial of Service (DoS) Prevention
68. [ ] Verify household member limit prevents resource exhaustion (15 max)
69. [ ] Verify household creation rate-limited per IP address
70. [ ] Verify join request flood prevented (rate limiting)
71. [ ] Verify expensive queries (member count) are cached
72. [ ] Verify database indexes prevent slow queries from DoS

### Compliance & Best Practices
73. [ ] Verify GDPR compliance: member data deletion on removal (right to be forgotten)
74. [ ] Verify GDPR compliance: users can export their household data
75. [ ] Verify child safety: age verification for household leaders (13+ or 18+?)
76. [ ] Verify invite code expiration follows security best practice (30 days)
77. [ ] Verify password/email change doesn't break household membership
78. [ ] Verify account deletion removes user from all households cleanly

**Questions/Concerns:**
- Should invite codes be hashed in database? (Current design stores plaintext)
  - **Concern**: If database is compromised, all invite codes are exposed
  - **Recommendation**: Hash invite codes with salt, store hash only
- What happens if leader account is compromised? Can attacker remove all members?
  - **Recommendation**: Add "Require password re-entry" for destructive actions
- Should we implement 2FA for household leadership actions?
  - **Recommendation**: Future enhancement, not Phase 1
- How do we handle GDPR "right to be forgotten" when user is household leader?
  - **Recommendation**: Force leadership transfer before account deletion

---

## Dexter (UX Design) Research & Checklist

**Scope Review:**
Household management is a core user flow touching onboarding, dashboard, and collaboration. UX must be simple, family-friendly, and mobile-first. This affects visual design, interaction patterns, copy, and accessibility.

**Review Status**: HIGHLY APPLICABLE - UX is critical to family adoption

**Checklist:**

### Onboarding Flow (Post-Registration)
1. [ ] Design household choice screen: "Create household" vs "Join household" (clear value prop)
2. [ ] Design create household form: name input, visual preview of invite code
3. [ ] Design create success screen: invite code with copy button, "Share" actions
4. [ ] Design join household form: code input with paste detection, QR scan button
5. [ ] Design join pending screen: "Request sent" status, withdrawal option
6. [ ] Design "Skip for now" option with benefits reminder (progressive onboarding)
7. [ ] Validate 2-minute completion time (user testing)
8. [ ] Ensure mobile-first layout (80% of users are mobile)

### Household Dashboard
9. [ ] Design household header: name, description, member count badge
10. [ ] Design member list: avatars, names, role badges (Leader/Member/Temporary)
11. [ ] Design invite code display (leader-only): code with copy, QR, email buttons
12. [ ] Design pending requests section (leader-only): approve/reject quick actions
13. [ ] Design empty states: "No members yet - invite your family!"
14. [ ] Design household stats: "5 members", "2 pets" (future), "active since Jan 2024"
15. [ ] Ensure visual hierarchy: most important info (members, pets) above fold

### Member Management (Leader)
16. [ ] Design "Manage Members" page: sortable list, filter by role/status
17. [ ] Design remove member confirmation: "Remove [Name]? They'll lose access immediately."
18. [ ] Design temporary member badge: calendar icon + "Expires Feb 8"
19. [ ] Design add temporary member flow: expiration date picker (7/14/30 days)
20. [ ] Design extend temporary access: "+ 7 days" quick action
21. [ ] Design leadership transfer flow: select new leader, confirm
22. [ ] Design audit log (future): "Alice removed Bob on Feb 1 at 3:45pm"

### Invite System
23. [ ] Design QR code display: branded with PetForce logo, CTA text, save/share buttons
24. [ ] Design QR code scanning: camera view, code detection, pre-fill join form
25. [ ] Design email invite form: recipient email, personalized message
26. [ ] Design invite link preview: household name, member count, "Join [Household]" button
27. [ ] Design invite code input: smart formatting (auto-hyphen), uppercase transform
28. [ ] Design invite code validation states: valid (green check), invalid (red X), loading

### Notifications & Feedback
29. [ ] Design join request notification (leader): "[Name] wants to join [Household]" with actions
30. [ ] Design approval notification (member): "You've joined [Household]!" with CTA
31. [ ] Design rejection notification (member): clear reason, alternative actions
32. [ ] Design removal notification (member): "You were removed from [Household]"
33. [ ] Design expiration warnings (temporary): "Access expires in 3 days"
34. [ ] Design welcome message (new member): "Welcome to [Household]! Here's what you can do..."
35. [ ] Design error messages: user-friendly, actionable (not technical)

### Mobile-Specific UX
36. [ ] Ensure all buttons 44x44px minimum (touch targets)
37. [ ] Design mobile QR scanner: full-screen camera, clear instructions
38. [ ] Design mobile share sheet: native iOS/Android sharing for invite codes
39. [ ] Design mobile deep links: petforce://household/join?code=ZEDER-ALPHA
40. [ ] Design mobile notifications: actionable (Approve/Reject without opening app)
41. [ ] Design mobile keyboard: auto-capitalize for invite codes, number pad for dates
42. [ ] Test mobile landscape orientation (iPad, tablets)

### Accessibility
43. [ ] Ensure all colors meet WCAG AA contrast ratio (4.5:1 text, 3:1 UI)
44. [ ] Add aria-labels to all icons (household icon, member badges, QR code)
45. [ ] Ensure keyboard navigation works (tab order logical)
46. [ ] Add skip links for screen readers ("Skip to member list")
47. [ ] Test with VoiceOver (iOS) and TalkBack (Android)
48. [ ] Ensure form validation errors announced to screen readers
49. [ ] Add visual focus indicators (outline on focused elements)
50. [ ] Support text scaling (200% zoom without layout breaking)

### Copy & Microcopy
51. [ ] Write household choice screen copy: benefits of creating vs joining
52. [ ] Write invite code success message: "Share this code with family to join"
53. [ ] Write pending request copy: "Waiting for approval from [Leader Name]"
54. [ ] Write error messages: friendly, specific, actionable
55. [ ] Write empty state copy: encouraging, actionable ("Invite family to get started")
56. [ ] Write confirmation dialogs: clear consequences ("Remove [Name]? This cannot be undone.")
57. [ ] Ensure family-centric language: "family", "household", not "organization"

### Visual Design
58. [ ] Design household icon/avatar: family-friendly, pet-themed
59. [ ] Design role badges: leader (crown icon), member (user icon), temporary (clock icon)
60. [ ] Design invite code styling: monospace font, clear separators, copy icon
61. [ ] Design QR code branding: PetForce colors, logo, rounded corners
62. [ ] Design member avatars: circular, initials fallback, pet photo option
63. [ ] Design success states: celebration animations (confetti on join)
64. [ ] Design loading states: skeleton screens, not spinners (perceived performance)

### User Flows
65. [ ] Map happy path: register → create household → invite family → approve → collaborate
66. [ ] Map edge case: user tries to join invalid code → error → retry
67. [ ] Map edge case: leader removes member → member sees removal message → can join new household
68. [ ] Map edge case: temporary member expires → notification → leader can extend or user leaves
69. [ ] Map leadership transfer: leader chooses successor → confirm → new leader notified
70. [ ] Validate all flows with user testing (5+ families)

### Onboarding Best Practices (2026 Research)
71. [ ] Implement progressive disclosure: core actions first (create household), advanced later (settings)
72. [ ] Add interactive checklist: "✓ Created household, ⏸ Invite family, ⏸ Add pets"
73. [ ] Add contextual hints: tooltip on first hover ("This is your invite code")
74. [ ] Allow skip/revisit without losing progress (save draft household name)
75. [ ] Personalize based on user input: "Great! [Name]'s household is ready"

### Delight & Polish
76. [ ] Add micro-interactions: button press animations, hover states
77. [ ] Add celebration moments: confetti when first member joins
78. [ ] Add easter eggs: custom household emojis (🏠🐕🐱)
79. [ ] Add personality: friendly error messages ("Oops! That code doesn't work. Try again?")
80. [ ] Add progress indicators: "Step 1 of 2" in onboarding

**Questions/Concerns:**
- Should household onboarding be skippable? (Research says yes, but product wants high household adoption)
  - **Recommendation**: Skippable with clear benefits reminder, re-prompt after 3 days
- What if household name is offensive? Do we moderate?
  - **Recommendation**: Profanity filter + reporting system (future)
- How do we handle very long household names in mobile UI?
  - **Recommendation**: Truncate with ellipsis, full name on hover/tap

---

## Engrid (Software Engineering) Research & Checklist

**Scope Review:**
Household management adds new database tables, API endpoints, state management, and complex business logic. Code quality, architecture, and maintainability are critical for this foundational feature.

**Review Status**: HIGHLY APPLICABLE - Core engineering work

**Checklist:**

### Database Schema & Migrations
1. [ ] Review households table schema (id, name, invite_code, leader_id, description, created_at, updated_at)
2. [ ] Review household_members table schema (id, household_id, user_id, role, status, is_temporary, temporary_expires_at, joined_at)
3. [ ] Review household_join_requests table schema (id, household_id, user_id, invite_code, status, requested_at, responded_at, responded_by)
4. [ ] Add invite_code_expires_at to households table (Peter's new requirement)
5. [ ] Add invited_by to household_members table (Peter's new requirement)
6. [ ] Add description to households table (Peter's new requirement)
7. [ ] Verify database constraints (unique invite_code, unique member per household, role/status enums)
8. [ ] Verify indexes (invite_code, leader_id, user_id, household_id, status)
9. [ ] Write migration file: 002_households_system.sql
10. [ ] Write rollback migration: 002_households_system_down.sql
11. [ ] Test migration on staging database (zero downtime)
12. [ ] Verify RLS policies applied and tested

### API Endpoints (packages/auth/src/api/household-api.ts)
13. [ ] Implement POST /api/households (create household)
14. [ ] Implement GET /api/households/me (get user's household)
15. [ ] Implement POST /api/households/join (request to join)
16. [ ] Implement POST /api/households/:id/requests/:requestId/respond (approve/reject)
17. [ ] Implement DELETE /api/households/:id/members/:memberId (remove member)
18. [ ] Implement POST /api/households/:id/regenerate-code (regenerate invite code)
19. [ ] Implement POST /api/households/:id/leave (leave household)
20. [ ] Implement POST /api/households/:id/invite-email (send email invite - NEW)
21. [ ] Implement DELETE /api/households/requests/:id/withdraw (withdraw request - NEW)
22. [ ] Implement PATCH /api/households/:id/members/:memberId/extend (extend temporary - NEW)
23. [ ] Implement GET /api/households/my-requests (user's pending requests - NEW)
24. [ ] Implement POST /api/households/:id/transfer-leadership (transfer leadership - NEW)
25. [ ] Implement error handling for all endpoints (HouseholdErrorCode enum)
26. [ ] Implement rate limiting middleware (5 join requests/hour, 10 regenerations/hour)
27. [ ] Implement leader permission checks (middleware or decorator)
28. [ ] Implement request validation (Zod schemas)
29. [ ] Write OpenAPI/Swagger documentation for all endpoints

### Business Logic (packages/auth/src/services/household-service.ts)
30. [ ] Implement generateInviteCode(householdName: string): string (PREFIX-RANDOM)
31. [ ] Implement createHousehold(userId, name, description): Promise<Household>
32. [ ] Implement joinHousehold(userId, inviteCode): Promise<JoinRequest>
33. [ ] Implement approveJoinRequest(requestId, leaderId): Promise<void>
34. [ ] Implement rejectJoinRequest(requestId, leaderId): Promise<void>
35. [ ] Implement removeMember(householdId, memberId, leaderId): Promise<void>
36. [ ] Implement leaveHousehold(householdId, userId): Promise<void>
37. [ ] Implement transferLeadership(householdId, newLeaderId, currentLeaderId): Promise<void>
38. [ ] Implement regenerateInviteCode(householdId, leaderId): Promise<string>
39. [ ] Implement validateInviteCode(inviteCode): Promise<Household | null>
40. [ ] Implement checkInviteCodeExpiration(household): boolean
41. [ ] Implement extendTemporaryMember(memberId, daysToExtend): Promise<void>
42. [ ] Implement sendEmailInvite(householdId, recipientEmail, leaderId): Promise<void>
43. [ ] Implement withdrawJoinRequest(requestId, userId): Promise<void>
44. [ ] Handle leadership auto-promotion on leader leave (longest-standing member)
45. [ ] Handle household soft-delete when last member leaves
46. [ ] Implement atomic transactions (household creation, join approval)
47. [ ] Implement idempotency (approve same request twice = no-op)

### State Management (Zustand Store)
48. [ ] Create useHouseholdStore with state: household, members, pendingRequests, loading, error
49. [ ] Implement fetchHousehold() action
50. [ ] Implement createHousehold(name, description) action
51. [ ] Implement joinHousehold(inviteCode) action
52. [ ] Implement approveRequest(requestId) action
53. [ ] Implement rejectRequest(requestId) action
54. [ ] Implement removeMember(memberId) action
55. [ ] Implement regenerateInviteCode() action
56. [ ] Implement leaveHousehold() action
57. [ ] Implement withdrawRequest(requestId) action
58. [ ] Implement extendTemporaryMember(memberId, days) action
59. [ ] Implement transferLeadership(newLeaderId) action
60. [ ] Implement cache invalidation on mutations
61. [ ] Implement optimistic updates (remove member immediately in UI)
62. [ ] Implement error handling with user-friendly messages

### React Components (apps/web/src/components/Household/)
63. [ ] Create HouseholdChoiceScreen component (create vs join)
64. [ ] Create CreateHouseholdForm component
65. [ ] Create CreateHouseholdSuccess component (invite code display)
66. [ ] Create JoinHouseholdForm component
67. [ ] Create JoinHouseholdPending component
68. [ ] Create HouseholdDashboard component
69. [ ] Create MemberList component
70. [ ] Create MemberCard component (with role badges)
71. [ ] Create PendingRequests component (leader-only)
72. [ ] Create InviteCodeDisplay component (copy, QR, email buttons)
73. [ ] Create QRCodeGenerator component
74. [ ] Create QRCodeScanner component (mobile)
75. [ ] Create RemoveMemberDialog component (confirmation)
76. [ ] Create TransferLeadershipDialog component
77. [ ] Create WelcomeScreen component (new members)
78. [ ] Implement responsive design (mobile-first)
79. [ ] Implement loading states (skeleton screens)
80. [ ] Implement error states (user-friendly messages)

### Routes (apps/web/src/app/)
81. [ ] Create /onboarding/household route
82. [ ] Create /households route (redirects if no household)
83. [ ] Create /households/create route
84. [ ] Create /households/join route
85. [ ] Create /households/:id/settings route (leader-only)
86. [ ] Create /households/:id/members route
87. [ ] Create /households/:id/requests route (leader-only)
88. [ ] Create /households/welcome route (new members)
89. [ ] Implement route guards (redirect if not authenticated)
90. [ ] Implement leader-only route guards

### Utilities & Helpers
91. [ ] Create formatInviteCode(code: string): string (add hyphens)
92. [ ] Create validateInviteCodeFormat(code: string): boolean
93. [ ] Create isHouseholdLeader(userId, household): boolean
94. [ ] Create isTemporaryMemberExpired(member): boolean
95. [ ] Create getHouseholdMemberCount(members): number (excludes removed)
96. [ ] Create generateQRCodeDataURL(inviteCode): Promise<string>
97. [ ] Create sendHouseholdNotification(userId, message): Promise<void>
98. [ ] Create formatMemberRole(role): string ("Leader", "Member")

### Code Quality
99. [ ] Write TypeScript types for all entities (Household, Member, JoinRequest)
100. [ ] Write Zod schemas for all API request/response validation
101. [ ] Ensure no `any` types (strict TypeScript)
102. [ ] Write JSDoc comments for all public functions
103. [ ] Follow existing naming conventions (camelCase, PascalCase)
104. [ ] Extract magic numbers to constants (MEMBER_LIMIT = 15, RATE_LIMIT = 5)
105. [ ] Use dependency injection for services (testability)
106. [ ] Implement proper error hierarchy (HouseholdError extends Error)

### Testing (see Tucker's checklist for details)
107. [ ] Write unit tests for all business logic (household-service.test.ts)
108. [ ] Write integration tests for all API endpoints (household-api.test.ts)
109. [ ] Write E2E tests for all user flows (household.spec.ts)
110. [ ] Achieve 80%+ code coverage
111. [ ] Test edge cases and error scenarios
112. [ ] Test concurrent operations (race conditions)

### Documentation
113. [ ] Update API documentation (Swagger/OpenAPI)
114. [ ] Write inline code comments for complex logic
115. [ ] Update README with household feature overview
116. [ ] Create architectural decision records (ADRs) for key decisions
117. [ ] Document database schema in ER diagram

**Questions/Concerns:**
- Should we use a separate microservice for households? (Keep in packages/auth for now)
- How do we handle database schema changes in production? (Blue-green deployment? Rolling?)
- Should invite codes be case-sensitive? (Yes, for security - changed from original spec)
- What's the error handling strategy for failed email invites? (Queue retry, notify leader)

---

## Larry (Logging/Observability) Research & Checklist

**Scope Review:**
Household management is a collaborative feature requiring detailed audit trails, error tracking, and performance monitoring. Logging must support debugging, security auditing, and analytics.

**Review Status**: APPLICABLE - Observability is critical for multi-user features

**Checklist:**

### Structured Logging
1. [ ] Log household creation with correlationId, userId, householdId, householdName (redact invite code)
2. [ ] Log invite code generation with correlationId, householdId (redact plaintext code)
3. [ ] Log join request submission with correlationId, userId, householdId (redact invite code)
4. [ ] Log join request approval with correlationId, requestId, leaderId, newMemberId
5. [ ] Log join request rejection with correlationId, requestId, leaderId, rejectedUserId
6. [ ] Log member removal with correlationId, householdId, memberId, removedBy
7. [ ] Log leadership transfer with correlationId, householdId, oldLeaderId, newLeaderId
8. [ ] Log invite code regeneration with correlationId, householdId, leaderId
9. [ ] Log household leave with correlationId, householdId, userId
10. [ ] Log temporary member expiration with correlationId, householdId, memberId
11. [ ] Log email invite sent with correlationId, householdId, recipientEmail
12. [ ] Log join request withdrawal with correlationId, requestId, userId
13. [ ] Log all errors with correlationId, errorCode, errorMessage, userId, householdId

### Error Tracking
14. [ ] Track invalid invite code attempts (security monitoring)
15. [ ] Track rate limit violations (abuse detection)
16. [ ] Track permission errors (non-leader attempts leader actions)
17. [ ] Track database constraint violations (duplicate members, etc.)
18. [ ] Track failed email sends (email invite delivery)
19. [ ] Track concurrent operation conflicts (race conditions)
20. [ ] Integrate with error tracking service (Sentry, Rollbar)
21. [ ] Set up error alerting (Slack, PagerDuty) for critical errors

### Performance Monitoring
22. [ ] Monitor household creation latency (target < 500ms)
23. [ ] Monitor invite code lookup latency (target < 100ms)
24. [ ] Monitor household query latency (target < 50ms)
25. [ ] Monitor member list query latency (target < 100ms)
26. [ ] Monitor pending requests query latency (target < 100ms)
27. [ ] Track database query performance (slow query log)
28. [ ] Track API endpoint response times (P50, P95, P99)
29. [ ] Set up performance alerting (P95 > 1s = alert)

### Metrics & Dashboards
30. [ ] Track household creation rate (households/day)
31. [ ] Track join request rate (requests/day)
32. [ ] Track approval rate (approved/total requests)
33. [ ] Track rejection rate (rejected/total requests)
34. [ ] Track member removal rate (removals/day)
35. [ ] Track invite code regeneration rate (regenerations/day)
36. [ ] Track household member count distribution (histogram)
37. [ ] Track temporary member count (active temporary members)
38. [ ] Track invite code expiration rate (expired codes/day)
39. [ ] Create Grafana dashboard: "Household Management Overview"
40. [ ] Create Grafana dashboard: "Household Security Monitoring"

### Audit Trail
41. [ ] Store all household mutations in audit log table
42. [ ] Include timestamp, userId, action, householdId, details in audit log
43. [ ] Make audit log accessible to household leaders (transparency)
44. [ ] Retain audit logs for 90 days minimum (compliance)
45. [ ] Implement audit log search/filter (by user, action, date)

### Alerting
46. [ ] Alert on high error rate (>5% of requests)
47. [ ] Alert on high P95 latency (>1s)
48. [ ] Alert on rate limit violations spike (>100/hour)
49. [ ] Alert on invite code collision (should never happen)
50. [ ] Alert on orphaned household detection
51. [ ] Alert on database connection failures
52. [ ] Set up on-call rotation for critical alerts

### Security Monitoring
53. [ ] Monitor invalid invite code attempts per IP (brute force detection)
54. [ ] Monitor join requests from same user to many households (spam detection)
55. [ ] Monitor household creations from same IP (bot detection)
56. [ ] Monitor member removals in short time (griefing detection)
57. [ ] Monitor leadership transfers (unusual activity detection)
58. [ ] Log all permission errors for security audit

### Logging Best Practices
59. [ ] Use correlation IDs across all logs for request tracing
60. [ ] Redact sensitive data (invite codes, emails in some contexts)
61. [ ] Use consistent log levels (INFO, WARN, ERROR, DEBUG)
62. [ ] Include context (userId, householdId) in all logs
63. [ ] Use structured logging (JSON format, not plain text)
64. [ ] Ensure log retention policy (30 days minimum)
65. [ ] Implement log rotation (prevent disk space issues)

**Questions/Concerns:**
- Should we log invite codes in plaintext for debugging? (NO - redact or hash)
- What's the log retention policy? (30 days? 90 days? Forever for audit?)
- Should audit logs be immutable? (Yes, append-only table)
- How do we handle PII in logs for GDPR compliance? (Redact emails, hash user IDs)

---

## Thomas (Documentation) Research & Checklist

**Scope Review:**
Household management is a new user-facing feature requiring comprehensive documentation: user guides, API docs, architecture docs, and support articles.

**Review Status**: APPLICABLE - Documentation critical for user adoption

**Checklist:**

### User Documentation
1. [ ] Write "Getting Started: Create Your Household" guide
2. [ ] Write "How to Invite Family Members" guide
3. [ ] Write "How to Join a Household" guide
4. [ ] Write "Managing Household Members" guide (leader-only)
5. [ ] Write "Household Roles Explained" (Leader vs Member vs Temporary)
6. [ ] Write "How to Use QR Codes to Invite Members" guide
7. [ ] Write "Troubleshooting: Invalid Invite Code" article
8. [ ] Write "What Happens When I Leave a Household?" FAQ
9. [ ] Write "How to Transfer Household Leadership" guide
10. [ ] Write "Temporary Members: Pet Sitters & Caregivers" guide
11. [ ] Include screenshots for every step (web + mobile)
12. [ ] Include video tutorials (30-60 seconds each)
13. [ ] Translate to top 3 languages (Spanish, French, German - future)

### API Documentation
14. [ ] Document POST /api/households endpoint (OpenAPI/Swagger)
15. [ ] Document GET /api/households/me endpoint
16. [ ] Document POST /api/households/join endpoint
17. [ ] Document POST /api/households/:id/requests/:requestId/respond endpoint
18. [ ] Document DELETE /api/households/:id/members/:memberId endpoint
19. [ ] Document POST /api/households/:id/regenerate-code endpoint
20. [ ] Document POST /api/households/:id/leave endpoint
21. [ ] Document all new endpoints (email invite, withdraw, extend, transfer)
22. [ ] Include request/response examples for each endpoint
23. [ ] Include error codes and error response examples
24. [ ] Document rate limits for each endpoint
25. [ ] Document authentication requirements
26. [ ] Generate Postman collection for API testing

### Architecture Documentation
27. [ ] Document database schema (ER diagram)
28. [ ] Document table relationships (households, members, requests)
29. [ ] Document RLS policies and security model
30. [ ] Document invite code generation algorithm
31. [ ] Document leadership transfer logic
32. [ ] Document temporary member expiration process
33. [ ] Create architecture diagram (household system overview)
34. [ ] Document state machine (join request flow)
35. [ ] Document concurrency handling (race conditions)

### Developer Documentation
36. [ ] Write "Household Feature Architecture" doc
37. [ ] Write "How to Add a New Household API Endpoint" guide
38. [ ] Write "How to Test Household Features" guide
39. [ ] Document Zustand store structure and actions
40. [ ] Document React component hierarchy
41. [ ] Document route structure and guards
42. [ ] Write inline code comments for complex logic
43. [ ] Create ADR (Architectural Decision Record) for key decisions

### Support Documentation
44. [ ] Write support article: "Common Household Issues"
45. [ ] Write support article: "How to Report Household Abuse"
46. [ ] Write support article: "Household Privacy & Security"
47. [ ] Write support article: "Household Member Limits"
48. [ ] Create troubleshooting flowchart for support team
49. [ ] Create internal runbook for household-related tickets

### Release Documentation
50. [ ] Write release notes for household feature launch
51. [ ] Write migration guide for existing users
52. [ ] Write rollback plan documentation
53. [ ] Document feature flags (if gradual rollout)
54. [ ] Create launch announcement (blog post, email)

### Compliance Documentation
55. [ ] Document GDPR compliance (data retention, right to be forgotten)
56. [ ] Document terms of service updates (household sharing)
57. [ ] Document privacy policy updates (household data sharing)
58. [ ] Document child safety policies (age requirements)

**Questions/Concerns:**
- Should we create video tutorials for every user flow? (Yes, but phase 2)
- What's the target reading level for user docs? (6th grade, plain language)
- Should we translate docs to all languages or English-first? (English first, top 3 later)
- Who maintains docs after launch? (Product team + support team)

---

## Axel (API Design) Research & Checklist

**Scope Review:**
Household management introduces 12+ new API endpoints. API design must be RESTful, consistent, versioned, and well-documented for web and mobile clients.

**Review Status**: APPLICABLE - API is the contract between frontend and backend

**Checklist:**

### API Design Principles
1. [ ] Follow RESTful conventions (GET, POST, PATCH, DELETE)
2. [ ] Use consistent URL structure (/api/households, /api/households/:id)
3. [ ] Use plural nouns for resources (/households, not /household)
4. [ ] Use HTTP status codes correctly (200, 201, 400, 401, 403, 404, 500)
5. [ ] Return consistent error format ({ error: { code, message } })
6. [ ] Use JSON for all requests and responses
7. [ ] Version API if needed (/api/v1/households - future)

### Endpoint Design
8. [ ] Review POST /api/households (create household) - idempotent?
9. [ ] Review GET /api/households/me (get user's household) - caching headers?
10. [ ] Review POST /api/households/join (join household) - rate limiting?
11. [ ] Review POST /api/households/:id/requests/:requestId/respond (approve/reject) - leader-only?
12. [ ] Review DELETE /api/households/:id/members/:memberId (remove member) - soft delete?
13. [ ] Review POST /api/households/:id/regenerate-code (regenerate code) - rate limiting?
14. [ ] Review POST /api/households/:id/leave (leave household) - confirmation?
15. [ ] Design POST /api/households/:id/invite-email (send email invite) - NEW
16. [ ] Design DELETE /api/households/requests/:id/withdraw (withdraw request) - NEW
17. [ ] Design PATCH /api/households/:id/members/:memberId/extend (extend temporary) - NEW
18. [ ] Design GET /api/households/my-requests (user's pending requests) - NEW
19. [ ] Design POST /api/households/:id/transfer-leadership (transfer leadership) - NEW

### Request/Response Schemas
20. [ ] Define CreateHouseholdRequest schema (name, description)
21. [ ] Define CreateHouseholdResponse schema (household with inviteCode)
22. [ ] Define GetHouseholdResponse schema (household, members, pendingRequests)
23. [ ] Define JoinHouseholdRequest schema (inviteCode)
24. [ ] Define JoinHouseholdResponse schema (requestId, message)
25. [ ] Define RespondToRequestRequest schema (action: 'approve' | 'reject')
26. [ ] Define RespondToRequestResponse schema (success, message)
27. [ ] Define RemoveMemberResponse schema (success, message)
28. [ ] Define RegenerateCodeResponse schema (inviteCode)
29. [ ] Define LeaveHouseholdResponse schema (success, message)
30. [ ] Define ErrorResponse schema (code, message, details?)

### Authentication & Authorization
31. [ ] All endpoints require Bearer token (JWT)
32. [ ] Leader-only endpoints validate role (middleware)
33. [ ] Member-only endpoints validate active membership
34. [ ] Return 401 for unauthenticated requests
35. [ ] Return 403 for unauthorized requests (wrong role)
36. [ ] Return 404 for non-existent resources

### Rate Limiting
37. [ ] POST /api/households/join: 5 requests per hour per user
38. [ ] POST /api/households/:id/regenerate-code: 10 requests per hour per household
39. [ ] POST /api/households: 10 requests per hour per user (prevent spam households)
40. [ ] POST /api/households/:id/invite-email: 20 requests per hour per household
41. [ ] Return 429 (Too Many Requests) when limit exceeded
42. [ ] Include Retry-After header in 429 response

### Caching & Performance
43. [ ] GET /api/households/me: Cache-Control: private, max-age=60
44. [ ] POST mutations: invalidate cache (Cache-Control: no-cache)
45. [ ] Use ETags for conditional requests (If-None-Match)
46. [ ] Implement database query optimization (indexes)
47. [ ] Consider pagination for large member lists (future: 100+ members)

### Error Handling
48. [ ] Define HouseholdErrorCode enum (ALREADY_IN_HOUSEHOLD, INVALID_INVITE_CODE, etc.)
49. [ ] Return user-friendly error messages (not database errors)
50. [ ] Include correlation ID in error responses (for support debugging)
51. [ ] Log all errors with context (userId, householdId, requestId)
52. [ ] Handle database constraint violations gracefully
53. [ ] Handle concurrent operation conflicts (optimistic locking?)

### API Versioning
54. [ ] Decide on versioning strategy (URL path /v1, header, or none for now)
55. [ ] Document breaking vs non-breaking changes
56. [ ] Plan for backward compatibility with mobile apps

### API Documentation
57. [ ] Write OpenAPI/Swagger spec for all endpoints
58. [ ] Include request/response examples
59. [ ] Include error response examples
60. [ ] Document authentication requirements
61. [ ] Document rate limits
62. [ ] Generate Postman collection
63. [ ] Publish API docs to developer portal (future)

### Consistency with Existing APIs
64. [ ] Match authentication pattern (packages/auth)
65. [ ] Match error response format (existing error handling)
66. [ ] Match naming conventions (camelCase for JSON fields)
67. [ ] Match success response format ({ success: true, data: ... })

### Mobile Client Considerations
68. [ ] Support offline-first (cache household data locally)
69. [ ] Return minimal data for mobile (reduce bandwidth)
70. [ ] Support deep links (petforce://household/join?code=...)
71. [ ] Handle slow connections gracefully (timeouts)

**Questions/Concerns:**
- Should we use GraphQL instead of REST? (No, keep REST for consistency)
- How do we handle API versioning for mobile apps? (Mobile apps must support backward compatibility)
- Should we implement webhooks for household events? (Future: notify external systems)
- What's the rate limit strategy (per user, per IP, per household)? (Per user for most, per household for regenerate)

---

## Maya (Mobile Development) Research & Checklist

**Scope Review:**
Mobile users are 60-80% of PetForce traffic. Household management MUST be mobile-first with QR scanning, push notifications, deep links, and offline support. This is a CRITICAL mobile feature.

**Review Status**: HIGHLY APPLICABLE - Mobile is PRIMARY platform for this feature

**Checklist:**

### React Native Components
1. [ ] Create HouseholdChoiceScreen (mobile-optimized)
2. [ ] Create CreateHouseholdForm (mobile keyboard handling)
3. [ ] Create CreateHouseholdSuccess (share sheet integration)
4. [ ] Create JoinHouseholdForm (QR scan button, smart code input)
5. [ ] Create JoinHouseholdPending (pull-to-refresh)
6. [ ] Create HouseholdDashboard (mobile-first layout)
7. [ ] Create MemberList (infinite scroll, swipe actions)
8. [ ] Create MemberCard (tap to view details)
9. [ ] Create PendingRequests (approve/reject swipe gestures)
10. [ ] Create InviteCodeDisplay (share sheet, QR code)
11. [ ] Create QRCodeGenerator (save to photos)
12. [ ] Create QRCodeScanner (camera permissions, scan feedback)
13. [ ] Create RemoveMemberDialog (native alert)
14. [ ] Create TransferLeadershipPicker (native picker)
15. [ ] Create WelcomeScreen (mobile onboarding)

### QR Code Functionality
16. [ ] Implement QR code generation (react-native-qrcode-svg)
17. [ ] Implement QR code scanning (react-native-camera or expo-camera)
18. [ ] Request camera permissions (iOS Info.plist, Android manifest)
19. [ ] Handle camera permission denial (show error, link to settings)
20. [ ] Extract invite code from QR data (parse format)
21. [ ] Pre-fill join form with scanned code
22. [ ] Add visual feedback on successful scan (checkmark, haptic)
23. [ ] Handle QR scan errors (invalid format, poor lighting)
24. [ ] Test QR scanning in different lighting conditions
25. [ ] Test QR scanning with different phone models (iOS, Android)

### Push Notifications
26. [ ] Implement push notification for join request (leader receives)
27. [ ] Implement push notification for approval (member receives)
28. [ ] Implement push notification for rejection (member receives)
29. [ ] Implement push notification for removal (member receives)
30. [ ] Implement push notification for temporary member expiration (3 days, 1 day)
31. [ ] Implement push notification for leadership transfer (new leader receives)
32. [ ] Add quick actions to notifications (Approve/Reject without opening app)
33. [ ] Handle notification taps (deep link to relevant screen)
34. [ ] Test notifications on iOS (APNs)
35. [ ] Test notifications on Android (FCM)
36. [ ] Handle notification permissions (request at appropriate time)

### Deep Links
37. [ ] Implement deep link for join household (petforce://household/join?code=ZEDER-ALPHA)
38. [ ] Implement deep link for household dashboard (petforce://household/:id)
39. [ ] Implement deep link for pending requests (petforce://household/:id/requests)
40. [ ] Handle deep link when app is closed (launch app to correct screen)
41. [ ] Handle deep link when app is backgrounded (navigate to correct screen)
42. [ ] Test deep links from SMS, email, messaging apps
43. [ ] Test deep links on iOS and Android

### Offline Support
44. [ ] Cache household data locally (AsyncStorage or realm)
45. [ ] Show cached data when offline (with "Offline" indicator)
46. [ ] Queue mutations when offline (create, join, approve, etc.)
47. [ ] Sync queued mutations when back online
48. [ ] Handle sync conflicts (optimistic UI vs server state)
49. [ ] Show offline indicator in UI
50. [ ] Test offline → online transitions

### Mobile UX
51. [ ] Ensure all buttons 44x44px minimum (iOS/Android guidelines)
52. [ ] Use native UI components (Alert, ActionSheet, Picker)
53. [ ] Implement pull-to-refresh on member list
54. [ ] Implement swipe-to-delete on member cards (leader-only)
55. [ ] Implement haptic feedback on actions (iOS Haptics)
56. [ ] Use platform-specific design (iOS vs Android)
57. [ ] Test on small screens (iPhone SE, Android small phones)
58. [ ] Test on large screens (iPhone Pro Max, Android tablets)
59. [ ] Test in landscape orientation
60. [ ] Test with iOS Dynamic Type (text scaling)
61. [ ] Test with Android font scaling

### Mobile Keyboard Handling
62. [ ] Dismiss keyboard on scroll
63. [ ] Auto-capitalize invite code input (uppercase)
64. [ ] Use appropriate keyboard type (default for invite code)
65. [ ] Handle keyboard covering inputs (KeyboardAvoidingView)
66. [ ] Add "Done" button to dismiss keyboard
67. [ ] Auto-focus first input on screen load

### Share Sheet Integration
68. [ ] Implement native share for invite code (iOS UIActivityViewController)
69. [ ] Implement native share for invite code (Android ShareSheet)
70. [ ] Include household name in share message ("Join [Household Name]")
71. [ ] Include invite code in share message
72. [ ] Include deep link in share message
73. [ ] Share QR code image (save to photos, share via messaging)

### Camera & Photos
74. [ ] Request camera permission for QR scanning
75. [ ] Request photos permission for saving QR code
76. [ ] Handle permission denial gracefully
77. [ ] Save QR code to photo library (iOS Photos, Android Gallery)
78. [ ] Show success toast after saving QR code

### Navigation
79. [ ] Implement stack navigation for household flows
80. [ ] Implement modal navigation for household creation
81. [ ] Implement tab navigation for household dashboard
82. [ ] Handle back button (Android hardware button)
83. [ ] Implement custom header for household screens
84. [ ] Add "Cancel" button to household creation flow

### State Management
85. [ ] Use Zustand for household state (same as web)
86. [ ] Persist household data locally (zustand persist middleware)
87. [ ] Implement optimistic UI updates (remove member immediately in UI)
88. [ ] Revert optimistic updates on error
89. [ ] Implement loading states (skeleton screens)
90. [ ] Implement error states (retry button)

### Platform-Specific Features
91. [ ] iOS: Use SF Symbols for icons (household, members, leader)
92. [ ] iOS: Use native Alert for confirmations
93. [ ] iOS: Use native ActionSheet for member actions
94. [ ] Android: Use Material Design icons
95. [ ] Android: Use native Dialog for confirmations
96. [ ] Android: Use BottomSheet for member actions
97. [ ] iOS: Support 3D Touch / Haptic Touch (quick actions)
98. [ ] Android: Support long-press actions

### Performance
99. [ ] Optimize member list rendering (FlatList, virtualized)
100. [ ] Optimize QR code generation (cache generated codes)
101. [ ] Optimize image loading (household avatars - future)
102. [ ] Reduce bundle size (code splitting)
103. [ ] Measure app startup time (should not increase significantly)
104. [ ] Measure screen transition time (<300ms)

### Testing
105. [ ] Test on iOS simulator (iPhone 14, 15 Pro)
106. [ ] Test on Android emulator (Pixel 6, Samsung S21)
107. [ ] Test on real iOS devices (iPhone 12+, iPhone SE)
108. [ ] Test on real Android devices (Pixel, Samsung, OnePlus)
109. [ ] Test in low connectivity (2G, 3G)
110. [ ] Test in no connectivity (airplane mode)
111. [ ] Test with VoiceOver (iOS accessibility)
112. [ ] Test with TalkBack (Android accessibility)

### App Store & Play Store
113. [ ] Update app screenshots (include household features)
114. [ ] Update app description (mention household collaboration)
115. [ ] Add household feature to "What's New" (release notes)
116. [ ] Test app store deep links (open app from store listing)

**Questions/Concerns:**
- Should we support QR scanning on tablets? (Yes, same code works)
- What happens if user denies camera permission? (Show error, link to settings)
- Should we support multiple QR code formats? (No, just our custom format)
- What's the offline sync strategy? (Queue mutations, sync on reconnect)

---

## Isabel (Infrastructure) Research & Checklist

**Scope Review:**
Household management adds database tables, API endpoints, and background jobs (temporary member expiration). Infrastructure must support scaling, deployment, monitoring, and backups.

**Review Status**: APPLICABLE - Infrastructure supports all features

**Checklist:**

### Database Infrastructure
1. [ ] Review database schema for households, household_members, household_join_requests
2. [ ] Verify database indexes for performance (invite_code, user_id, household_id, status)
3. [ ] Verify database constraints (unique invite_code, foreign keys, enums)
4. [ ] Enable RLS (Row-Level Security) on all household tables
5. [ ] Test RLS policies (members can't view other households)
6. [ ] Set up database backups (hourly incremental, daily full)
7. [ ] Test database restore from backup
8. [ ] Monitor database storage growth (estimate: 1KB per household, 500B per member)
9. [ ] Plan for database scaling (when to shard? 1M+ households?)
10. [ ] Set up database replication (read replicas for analytics)

### API Infrastructure
11. [ ] Deploy household API endpoints to production (packages/auth)
12. [ ] Configure API rate limiting (Redis or in-memory)
13. [ ] Configure API load balancing (multiple instances)
14. [ ] Configure API auto-scaling (based on CPU/memory)
15. [ ] Set up API health checks (/health endpoint)
16. [ ] Configure API timeouts (30s max)
17. [ ] Configure API CORS (allow web + mobile origins)
18. [ ] Configure API authentication (JWT validation)

### Background Jobs
19. [ ] Set up cron job for temporary member expiration (runs daily)
20. [ ] Set up cron job for invite code expiration (runs daily)
21. [ ] Set up notification queue (join requests, approvals, removals)
22. [ ] Set up email queue (email invites)
23. [ ] Monitor job failures (retry logic, dead letter queue)
24. [ ] Test job idempotency (safe to run multiple times)

### CDN & Caching
25. [ ] Cache household data in Redis (key: user:{userId}:household)
26. [ ] Set cache TTL (60s for household data)
27. [ ] Invalidate cache on mutations (create, join, remove, leave)
28. [ ] Serve QR codes from CDN (CloudFront, Cloudflare)
29. [ ] Cache API responses (GET /api/households/me for 60s)

### Deployment
30. [ ] Plan zero-downtime deployment (blue-green or rolling)
31. [ ] Deploy database migration (002_households_system.sql)
32. [ ] Test migration rollback (002_households_system_down.sql)
33. [ ] Deploy API changes (backward compatible with mobile)
34. [ ] Deploy frontend changes (web + mobile)
35. [ ] Set up feature flags (gradual rollout: 10% → 50% → 100%)
36. [ ] Monitor deployment (error rates, latency, traffic)

### Monitoring & Alerting
37. [ ] Monitor database CPU/memory (CloudWatch, Datadog)
38. [ ] Monitor API response times (P50, P95, P99)
39. [ ] Monitor API error rates (4xx, 5xx)
40. [ ] Monitor background job success rates
41. [ ] Monitor cache hit rates (Redis)
42. [ ] Set up alerts for high error rates (>5%)
43. [ ] Set up alerts for high latency (P95 >1s)
44. [ ] Set up alerts for database connection failures
45. [ ] Set up on-call rotation for critical alerts

### Scalability
46. [ ] Estimate household growth rate (1000/day? 10,000/day?)
47. [ ] Estimate member growth rate (3-5 members per household)
48. [ ] Estimate join request rate (500/day? 5000/day?)
49. [ ] Load test household creation (1000 req/s)
50. [ ] Load test join request flow (500 req/s)
51. [ ] Load test household queries (5000 req/s)
52. [ ] Identify bottlenecks (database? API? cache?)
53. [ ] Plan for horizontal scaling (add more API instances)

### Security Infrastructure
54. [ ] Enable HTTPS for all household API endpoints
55. [ ] Configure rate limiting (prevent DDoS)
56. [ ] Enable WAF (Web Application Firewall) for API
57. [ ] Configure IP whitelisting for admin endpoints (if any)
58. [ ] Enable audit logging (all household mutations)
59. [ ] Encrypt database at rest (Supabase default)
60. [ ] Encrypt backups at rest (S3 encryption)

### Backup & Disaster Recovery
61. [ ] Set up automated database backups (hourly incremental)
62. [ ] Test database restore (time to restore: <1 hour)
63. [ ] Set up cross-region backups (disaster recovery)
64. [ ] Document disaster recovery plan (RPO: 1 hour, RTO: 4 hours)
65. [ ] Test disaster recovery plan (simulate database failure)

### Cost Optimization
66. [ ] Estimate infrastructure costs (database, API, cache, jobs)
67. [ ] Optimize database queries (reduce read load)
68. [ ] Optimize cache usage (reduce database hits)
69. [ ] Use reserved instances (cost savings)
70. [ ] Monitor cost anomalies (unexpected spikes)

**Questions/Concerns:**
- What's the expected household growth rate? (Need for capacity planning)
- Should we use a separate database for households? (No, keep in main DB for now)
- What's the disaster recovery plan? (RPO: 1 hour, RTO: 4 hours)
- How do we handle database migrations in production? (Blue-green deployment)

---

## Buck (Data Engineering) Research & Checklist

**Scope Review:**
Household management generates analytics data: household creation, member joins, leadership changes. Data must be structured for analytics, reporting, and data science.

**Review Status**: APPLICABLE - Analytics data is critical for product insights

**Checklist:**

### Data Pipeline
1. [ ] Set up ETL pipeline for household data (Supabase → data warehouse)
2. [ ] Extract household creation events (daily batch)
3. [ ] Extract join request events (real-time stream)
4. [ ] Extract member removal events (daily batch)
5. [ ] Extract leadership transfer events (daily batch)
6. [ ] Transform data for analytics (normalize, denormalize)
7. [ ] Load data into data warehouse (Snowflake, BigQuery, Redshift)
8. [ ] Validate data quality (no missing fields, correct types)

### Data Warehouse Schema
9. [ ] Create fact_household_created table (household_id, user_id, created_at, name, invite_code_hash)
10. [ ] Create fact_join_request table (request_id, household_id, user_id, status, requested_at, responded_at)
11. [ ] Create fact_member_added table (member_id, household_id, user_id, role, joined_at)
12. [ ] Create fact_member_removed table (member_id, household_id, user_id, removed_at, removed_by)
13. [ ] Create fact_leadership_transfer table (household_id, old_leader_id, new_leader_id, transferred_at)
14. [ ] Create dim_household table (household_id, name, member_count, created_at, status)
15. [ ] Create dim_member table (member_id, user_id, household_id, role, is_temporary, joined_at)

### Data Quality
16. [ ] Validate household_id is UUID (not null)
17. [ ] Validate user_id is UUID (not null)
18. [ ] Validate timestamps are in correct timezone (UTC)
19. [ ] Validate enum fields (role, status) match expected values
20. [ ] Detect and handle duplicate records
21. [ ] Detect and handle missing records (reconciliation)
22. [ ] Set up data quality alerts (anomaly detection)

### Analytics Events (see Ana's checklist for details)
23. [ ] Track household_created event
24. [ ] Track household_join_requested event
25. [ ] Track household_join_approved event
26. [ ] Track household_join_rejected event
27. [ ] Track household_member_removed event
28. [ ] Track household_invite_code_regenerated event
29. [ ] Track household_leadership_transferred event
30. [ ] Track household_member_count (daily snapshot)

### Data Retention
31. [ ] Define retention policy for household data (forever for active, 90 days for removed?)
32. [ ] Define retention policy for join requests (90 days after response?)
33. [ ] Define retention policy for audit logs (90 days minimum)
34. [ ] Implement data archival (move old data to cold storage)
35. [ ] Implement data deletion (GDPR right to be forgotten)

### Reporting
36. [ ] Create daily household metrics report (households created, members added)
37. [ ] Create weekly household engagement report (active households, member activity)
38. [ ] Create monthly household retention report (churn rate, member turnover)
39. [ ] Create household funnel report (create → invite → join → active)
40. [ ] Create household segmentation report (by size, by activity)

### Data Access
41. [ ] Set up read-only access for analytics team
42. [ ] Set up SQL interface for ad-hoc queries (Metabase, Looker)
43. [ ] Document data schema for analysts
44. [ ] Create sample queries for common analytics tasks

### Privacy & Compliance
45. [ ] Anonymize PII in data warehouse (hash emails, redact names)
46. [ ] Implement data deletion for GDPR (right to be forgotten)
47. [ ] Audit data access (who queries household data)
48. [ ] Document data retention policies

**Questions/Concerns:**
- Should we store invite codes in data warehouse? (No, too sensitive - hash only)
- What's the data retention policy for removed members? (90 days, then archive)
- How do we handle GDPR deletion requests? (Delete from warehouse, keep aggregates)

---

## Ana (Analytics) Research & Checklist

**Scope Review:**
Household management is THE core differentiator. Analytics must track adoption, engagement, retention, and identify friction points in the household flow.

**Review Status**: HIGHLY APPLICABLE - Analytics critical for measuring success

**Checklist:**

### Event Tracking
1. [ ] Track household_created (userId, householdId, householdName, timestamp)
2. [ ] Track household_join_requested (userId, householdId, inviteCode, timestamp)
3. [ ] Track household_join_approved (householdId, memberId, approvedBy, timestamp)
4. [ ] Track household_join_rejected (householdId, userId, rejectedBy, reason, timestamp)
5. [ ] Track household_member_removed (householdId, memberId, removedBy, timestamp)
6. [ ] Track household_invite_code_regenerated (householdId, leaderId, timestamp)
7. [ ] Track household_left (householdId, userId, timestamp)
8. [ ] Track household_leadership_transferred (householdId, oldLeaderId, newLeaderId, timestamp)
9. [ ] Track household_qr_code_generated (householdId, leaderId, timestamp)
10. [ ] Track household_qr_code_scanned (userId, inviteCode, timestamp)
11. [ ] Track household_email_invite_sent (householdId, recipientEmail, leaderId, timestamp)
12. [ ] Track household_request_withdrawn (requestId, userId, timestamp)
13. [ ] Track temporary_member_added (householdId, memberId, expiresAt, timestamp)
14. [ ] Track temporary_member_extended (householdId, memberId, newExpiresAt, timestamp)
15. [ ] Track temporary_member_expired (householdId, memberId, timestamp)

### Funnel Analysis
16. [ ] Track onboarding funnel: register → household choice → create/join → success
17. [ ] Track create household funnel: start → enter name → submit → success
18. [ ] Track join household funnel: start → enter code → submit → pending → approved → success
19. [ ] Track member invite funnel: generate code → share → recipient joins → approval → active
20. [ ] Identify drop-off points in each funnel
21. [ ] Calculate conversion rates for each funnel step
22. [ ] A/B test household onboarding flows (skip vs force)

### Engagement Metrics
23. [ ] Track daily active households (households with any member activity)
24. [ ] Track weekly active households
25. [ ] Track monthly active households
26. [ ] Track average household size (members per household)
27. [ ] Track household member growth rate (members added per day)
28. [ ] Track household join request response time (time to approve/reject)
29. [ ] Track temporary member usage (% of households with temporary members)
30. [ ] Track household member churn (members removed or left)

### Adoption Metrics
31. [ ] Track household creation rate (households created per day)
32. [ ] Track household adoption rate (% of registered users who create/join household)
33. [ ] Track household invite usage (% of households that invite members)
34. [ ] Track QR code usage (% of invites via QR vs manual code)
35. [ ] Track email invite usage (% of invites via email)
36. [ ] Track household feature discovery (% of users who see household onboarding)

### Retention Metrics
37. [ ] Track household retention (% of households still active after 7/30/90 days)
38. [ ] Track member retention (% of members still active after 7/30/90 days)
39. [ ] Track household leader retention (% of leaders still active)
40. [ ] Track household churn rate (households deleted or abandoned)
41. [ ] Track member churn rate (members removed or left)

### User Segmentation
42. [ ] Segment by household size (1, 2-3, 4-6, 7+ members)
43. [ ] Segment by household role (leader vs member)
44. [ ] Segment by household activity (active, inactive, churned)
45. [ ] Segment by member type (permanent vs temporary)
46. [ ] Segment by household creation date (cohort analysis)

### Error & Friction Tracking
47. [ ] Track invalid invite code attempts (error rate)
48. [ ] Track join request rejections (rejection rate, reasons)
49. [ ] Track rate limit violations (abuse rate)
50. [ ] Track member removal rate (% of members removed vs left voluntarily)
51. [ ] Track household deletion rate (% of households deleted)
52. [ ] Track onboarding abandonment (% of users who skip household setup)

### Dashboard & Reporting
53. [ ] Create "Household Overview" dashboard (creation rate, member count, active households)
54. [ ] Create "Household Funnel" dashboard (onboarding, join, invite funnels)
55. [ ] Create "Household Engagement" dashboard (DAU, WAU, MAU)
56. [ ] Create "Household Retention" dashboard (churn, retention cohorts)
57. [ ] Create "Household Errors" dashboard (error rates, friction points)
58. [ ] Set up weekly household metrics email (sent to product team)

### A/B Testing
59. [ ] Test household onboarding: force vs skip (which has higher adoption?)
60. [ ] Test invite code format: PREFIX-RANDOM vs UUID (which is more shareable?)
61. [ ] Test QR code design: branded vs minimal (which is scanned more?)
62. [ ] Test join request UX: notification vs email (which has faster approval?)
63. [ ] Test member list UX: avatars vs initials (which is more engaging?)

### Success Metrics (OKRs)
64. [ ] Define success metric: 70% of registered users create/join household (Phase 1 goal)
65. [ ] Define success metric: Average household size = 3+ members
66. [ ] Define success metric: 80% of households invite at least 1 member
67. [ ] Define success metric: 90% of join requests approved within 24 hours
68. [ ] Define success metric: Household retention >80% after 30 days
69. [ ] Track progress toward success metrics (weekly review)

**Questions/Concerns:**
- What's the primary success metric? (Household adoption rate: % of users in a household)
- Should we track PII in analytics? (No, use hashed user IDs, anonymize)
- How do we measure household "quality"? (Activity, member count, retention)
- What's the target household adoption rate? (70% in Phase 1, 90% in Phase 2)

---

## Chuck (CI/CD) Research & Checklist

**Scope Review:**
Household management requires database migrations, API deployments, and mobile app updates. CI/CD must support zero-downtime deployment, rollback, and testing.

**Review Status**: APPLICABLE - CI/CD ensures safe deployment

**Checklist:**

### Database Migrations
1. [ ] Create migration file: 002_households_system.sql
2. [ ] Create rollback file: 002_households_system_down.sql
3. [ ] Test migration on local database
4. [ ] Test migration on staging database
5. [ ] Test rollback on staging database
6. [ ] Verify zero-downtime migration (no table locks)
7. [ ] Run migration in production (blue-green or rolling)
8. [ ] Monitor migration progress (no errors, no downtime)
9. [ ] Verify migration success (tables created, indexes exist, RLS enabled)
10. [ ] Keep rollback script ready (in case of issues)

### API Deployment
11. [ ] Build API package (packages/auth)
12. [ ] Run unit tests (household-service.test.ts)
13. [ ] Run integration tests (household-api.test.ts)
14. [ ] Run E2E tests (household.spec.ts)
15. [ ] Build Docker image (API server)
16. [ ] Push Docker image to registry (ECR, Docker Hub)
17. [ ] Deploy to staging environment
18. [ ] Run smoke tests on staging (health check, sample requests)
19. [ ] Deploy to production (blue-green or rolling)
20. [ ] Monitor production deployment (error rates, latency)
21. [ ] Verify API endpoints working (POST /api/households, GET /api/households/me)
22. [ ] Keep previous version ready for rollback

### Frontend Deployment (Web)
23. [ ] Build web app (apps/web)
24. [ ] Run unit tests (component tests)
25. [ ] Run E2E tests (Playwright)
26. [ ] Build production bundle (Next.js build)
27. [ ] Deploy to CDN (Vercel, Cloudflare Pages)
28. [ ] Verify web app working (household onboarding, dashboard)
29. [ ] Test on multiple browsers (Chrome, Safari, Firefox)
30. [ ] Monitor web vitals (LCP, FID, CLS)

### Mobile App Deployment
31. [ ] Build mobile app (React Native)
32. [ ] Run unit tests (mobile component tests)
33. [ ] Run E2E tests (Detox, Appium)
34. [ ] Build iOS app (Xcode, fastlane)
35. [ ] Build Android app (Gradle, fastlane)
36. [ ] Submit iOS app to TestFlight (internal testing)
37. [ ] Submit Android app to Google Play Beta (internal testing)
38. [ ] Test on real devices (iOS, Android)
39. [ ] Submit iOS app to App Store (phased rollout: 10% → 50% → 100%)
40. [ ] Submit Android app to Google Play (staged rollout: 10% → 50% → 100%)
41. [ ] Monitor app crash rates (Firebase Crashlytics)
42. [ ] Monitor app reviews (App Store, Play Store)

### CI Pipeline
43. [ ] Set up GitHub Actions workflow for household feature
44. [ ] Run linter (ESLint, Prettier)
45. [ ] Run type checker (TypeScript)
46. [ ] Run unit tests (Jest)
47. [ ] Run integration tests (Supertest)
48. [ ] Run E2E tests (Playwright, Detox)
49. [ ] Generate code coverage report (>80% target)
50. [ ] Block merge if tests fail
51. [ ] Block merge if coverage drops
52. [ ] Notify team on CI failure (Slack)

### CD Pipeline
53. [ ] Auto-deploy to staging on merge to main
54. [ ] Run smoke tests on staging
55. [ ] Manual approval for production deployment
56. [ ] Auto-deploy to production after approval
57. [ ] Monitor production deployment (error rates, latency)
58. [ ] Auto-rollback if error rate >5%
59. [ ] Notify team on deployment success (Slack)

### Feature Flags
60. [ ] Set up feature flag: household_management (LaunchDarkly, Unleash)
61. [ ] Deploy code with feature flag OFF
62. [ ] Enable feature flag for 10% of users (canary)
63. [ ] Monitor metrics (error rates, household creation rate)
64. [ ] Increase to 50% of users
65. [ ] Increase to 100% of users
66. [ ] Remove feature flag after stable (cleanup)

### Rollback Plan
67. [ ] Document rollback steps (API, database, frontend, mobile)
68. [ ] Test rollback on staging (simulate production issue)
69. [ ] Keep previous API version running (blue-green)
70. [ ] Keep database rollback script ready (002_households_system_down.sql)
71. [ ] Communicate rollback plan to team
72. [ ] Execute rollback if critical issues detected
73. [ ] Post-mortem after rollback (root cause analysis)

### Monitoring
74. [ ] Monitor deployment success rate (% of successful deployments)
75. [ ] Monitor deployment time (time from merge to production)
76. [ ] Monitor rollback frequency (how often do we rollback?)
77. [ ] Monitor test pass rate (flaky tests?)
78. [ ] Set up alerts for CI/CD failures (Slack, email)

### Documentation
79. [ ] Document deployment process (runbook)
80. [ ] Document rollback process (runbook)
81. [ ] Document feature flag usage (when to enable, disable)
82. [ ] Update CI/CD documentation with household feature specifics

**Questions/Concerns:**
- What's the deployment strategy? (Blue-green for API, rolling for database)
- How do we handle mobile app updates? (Phased rollout, 10% → 50% → 100%)
- What's the rollback time target? (Rollback API in <5 minutes, database in <30 minutes)
- How do we test database migrations without downtime? (Backward-compatible migrations)

---

## Casey (Customer Success) Research & Checklist

**Scope Review:**
Household management is a new user-facing feature that will generate support tickets. Customer Success must prepare FAQs, support docs, and training for support team.

**Review Status**: APPLICABLE - Customer Support needs preparation for household feature

**Checklist:**

### Support Documentation
1. [ ] Write FAQ: "How do I create a household?"
2. [ ] Write FAQ: "How do I invite family members?"
3. [ ] Write FAQ: "How do I join a household?"
4. [ ] Write FAQ: "What is an invite code?"
5. [ ] Write FAQ: "How do I regenerate my invite code?"
6. [ ] Write FAQ: "What does 'Invalid invite code' mean?"
7. [ ] Write FAQ: "How do I approve join requests?"
8. [ ] Write FAQ: "How do I remove a household member?"
9. [ ] Write FAQ: "Can I leave a household?"
10. [ ] Write FAQ: "What happens if I'm the only member and I leave?"
11. [ ] Write FAQ: "What is a household leader?"
12. [ ] Write FAQ: "Can I transfer leadership to another member?"
13. [ ] Write FAQ: "What are temporary members?"
14. [ ] Write FAQ: "How do I add a pet sitter as a temporary member?"
15. [ ] Write FAQ: "Can I belong to multiple households?" (Answer: Not in Phase 1)
16. [ ] Write FAQ: "How many members can a household have?" (Answer: 15)

### Troubleshooting Guides
17. [ ] Write guide: "Troubleshooting invite code issues"
18. [ ] Write guide: "What to do if join request is rejected"
19. [ ] Write guide: "What to do if I was removed from a household"
20. [ ] Write guide: "How to report household abuse or spam"
21. [ ] Write guide: "How to recover if leader account is deleted"
22. [ ] Write guide: "QR code scanning not working"
23. [ ] Write guide: "Email invite not received"

### Support Team Training
24. [ ] Train support team on household feature (live demo)
25. [ ] Provide support team with test accounts (create, join, approve workflows)
26. [ ] Create support runbook: "How to help users with household issues"
27. [ ] Create escalation process for complex household issues
28. [ ] Create canned responses for common household questions

### Support Ticket Categories
29. [ ] Create ticket category: "Household - Creation"
30. [ ] Create ticket category: "Household - Joining"
31. [ ] Create ticket category: "Household - Invite Code"
32. [ ] Create ticket category: "Household - Member Management"
33. [ ] Create ticket category: "Household - Leadership"
34. [ ] Create ticket category: "Household - Temporary Members"
35. [ ] Create ticket category: "Household - Abuse/Spam"

### Proactive Support
36. [ ] Create in-app tooltip: "What is a household?" (onboarding screen)
37. [ ] Create in-app tooltip: "How to share your invite code" (create success screen)
38. [ ] Create in-app help link: "Household FAQ" (dashboard)
39. [ ] Create welcome email: "You've been added to a household!" (new members)
40. [ ] Create reminder email: "You have pending join requests" (leaders, if inactive)

### Metrics & Monitoring
41. [ ] Track support ticket volume for household feature
42. [ ] Track most common household issues (top 5)
43. [ ] Track average resolution time for household tickets
44. [ ] Track customer satisfaction (CSAT) for household support
45. [ ] Identify common pain points (inform product team)

### User Feedback
46. [ ] Collect feedback on household onboarding (in-app survey)
47. [ ] Collect feedback on invite code UX (in-app survey)
48. [ ] Collect feedback on QR code scanning (in-app survey)
49. [ ] Collect feedback on member management (in-app survey)
50. [ ] Share feedback with product team (weekly summary)

### Launch Preparation
51. [ ] Prepare launch announcement (email, in-app banner)
52. [ ] Prepare launch FAQ (anticipate common questions)
53. [ ] Prepare support team for launch (extra staffing if needed)
54. [ ] Set up monitoring for support ticket spike (launch day)
55. [ ] Create post-launch survey (household satisfaction)

**Questions/Concerns:**
- What's the expected support ticket volume? (Estimate 20-30% increase at launch)
- What's the escalation process for household abuse? (Remove member, ban user, report to authorities)
- Should we offer phone support for household issues? (No, email/chat only for Phase 1)
- How do we handle GDPR deletion requests for household leaders? (Force leadership transfer first)

---

## Research Summary

**Peter's Key Findings:**
- **Most Important Insight**: Competitors (Rover, Wag) have NO proper multi-owner support - users are anonymous, causing confusion. PetForce can win by making all household members visible and identifiable.
- **Critical Gap Filled**: Time-limited invite codes (30 days), email invites, and pending request visibility were all missing. Added 10 new requirements based on Slack, Discord, and Google Family best practices.
- **Major Improvement**: QR code implementation upgraded to 2026 best practices (branded, dynamic, with analytics). Progressive onboarding approach to reduce friction.

**Requirements Updated:**
- 10 requirements added (invite expiration, email invites, member limits, welcome flow, etc.)
- 5 requirements modified (invite code format, leadership transfer, QR codes, etc.)
- 1 requirement removed (case-insensitive codes - added complexity)

**Agent Review Status (ALL 14 REQUIRED):**
- ✅ Peter (Product Management) - HIGHLY APPLICABLE (competitive research completed, requirements updated)
- ✅ Tucker (QA/Testing) - HIGHLY APPLICABLE (93 checklist items covering unit, integration, E2E, security, performance)
- ✅ Samantha (Security) - HIGHLY APPLICABLE (78 checklist items covering auth, invite codes, RLS, rate limiting, audit)
- ✅ Dexter (UX Design) - HIGHLY APPLICABLE (80 checklist items covering onboarding, mobile UX, accessibility, copy)
- ✅ Engrid (Software Engineering) - HIGHLY APPLICABLE (117 checklist items covering DB, API, components, state, testing)
- ✅ Larry (Logging/Observability) - APPLICABLE (65 checklist items covering logging, monitoring, metrics, alerting)
- ✅ Thomas (Documentation) - APPLICABLE (58 checklist items covering user docs, API docs, architecture docs)
- ✅ Axel (API Design) - APPLICABLE (70 checklist items covering REST design, schemas, auth, rate limiting)
- ✅ Maya (Mobile Development) - HIGHLY APPLICABLE (116 checklist items covering QR scanning, push notifications, deep links, offline)
- ✅ Isabel (Infrastructure) - APPLICABLE (70 checklist items covering database, deployment, scaling, backups)
- ✅ Buck (Data Engineering) - APPLICABLE (48 checklist items covering ETL, data warehouse, retention, reporting)
- ✅ Ana (Analytics) - HIGHLY APPLICABLE (69 checklist items covering events, funnels, engagement, retention, A/B testing)
- ✅ Chuck (CI/CD) - APPLICABLE (82 checklist items covering migrations, deployments, rollback, feature flags)
- ✅ Casey (Customer Success) - APPLICABLE (55 checklist items covering FAQs, support training, launch prep)

**Agent Checklist Summary:**
- Agents with applicable checklists: 14 (all agents)
- Agents with N/A: 0
- Total checklist items across all agents: 1,076 items
- Agents with concerns/questions: Peter (4), Tucker (4), Samantha (4), Dexter (3), Engrid (4), Larry (4), Axel (4), Maya (4), Isabel (4), Buck (3), Chuck (3), Casey (4)

**Ready for User Review:** YES - All 14 agents have completed research and created comprehensive quality checklists. Peter has conducted competitive research and identified 10 critical gaps in the original proposal. Requirements are ready to be updated in spec delta files.

---

**Next Steps:**
1. User reviews this research document
2. Peter updates spec delta files with new/modified requirements
3. Other agents refine checklists based on updated requirements
4. User approves final proposal
5. Begin implementation with all agents' checklists guiding quality
