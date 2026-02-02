# Proposal: Implement Household Management System

**Change ID**: `implement-household-management-system`
**Status**: Proposed
**Created**: 2026-02-01
**Product Philosophy Alignment**: This is THE core differentiator that embodies "pets are part of the family" - enabling entire families to collaborate on pet care

## Overview

Implement PetForce's foundational collaborative pet care feature: **Household Management**. This system enables families and caregivers to share responsibility for pet care by creating or joining households, managing members, and tracking who did what for which pets.

### The Vision

Think of a household as a physical house:
- **Example**: The "Zeder House" has 2 dogs, 3 cats, and 1 bird
- **Family Members**: Dad, Mom, and kids all have access
- **Temporary Members**: Pet sitters when on vacation, daycare workers when needed
- **Shared Visibility**: Everyone sees "Mom gave the cat its medicine," "Kids walked the dogs," "Dad cleaned the bird cage"

This is what separates PetForce from every competitor - **collaborative family pet care**.

## Problem Statement

Currently, after registration, users land on a dashboard with "coming soon" features. There's no way to:
- Share pet care responsibilities with family members
- Track who completed which pet care tasks
- Grant temporary access to pet sitters or caregivers
- See a unified view of all household pets
- Collaborate on pet health and care routines

**Impact**: Without households, PetForce is just another single-user pet tracker. With households, we become the platform families need to coordinate pet care together.

## Proposed Solution

Implement a complete household management system with:

1. **Post-Registration Household Setup**
   - After email verification, prompt users: "Create a household" or "Join a household"
   - Creating generates a unique invite code
   - Joining requires an invite code from household leader

2. **Household Leadership & Membership**
   - Household creator becomes the household leader
   - Leader approves/rejects join requests
   - Members can be permanent (family) or temporary (pet sitters)
   - Leader can remove members or transfer leadership

3. **Invite Code System**
   - Unique, shareable codes per household (e.g., "ZEDER-2024-ALPHA")
   - Codes can be regenerated for security
   - Time-limited codes for temporary access
   - QR code generation for easy sharing

4. **Household Profile**
   - Household name (e.g., "The Zeder House")
   - Member list with roles (Leader, Member, Temporary)
   - Pet count (displayed after pets are added in future features)
   - Settings (privacy, notifications)

5. **Member Management**
   - View pending join requests
   - Approve/reject requests with notifications
   - Remove members
   - Set member permissions (future: read-only, full access)
   - View member activity (who did what)

## Success Criteria

### User-Facing
- [ ] User can create a household immediately after registration
- [ ] User can join an existing household using an invite code
- [ ] Household leader can approve/reject join requests
- [ ] Leader can generate/regenerate invite codes
- [ ] All household members can view the member list
- [ ] Leader can remove members from the household
- [ ] Temporary members can be distinguished from permanent members
- [ ] Users see household name and member count on dashboard

### Technical
- [ ] Database-agnostic design (like user_registrations)
- [ ] All tests passing (unit, integration, E2E)
- [ ] Mobile-compatible (Maya will ensure this)
- [ ] Proper security (Samantha will validate)
- [ ] Analytics tracking (Ana will define events)
- [ ] Comprehensive documentation (Thomas will create)

### Product Philosophy Alignment
- [ ] **Simple**: Can create/join household in < 2 minutes
- [ ] **Family-First**: Terminology reflects family relationships
- [ ] **Reliable**: Invite codes work consistently across platforms
- [ ] **Accessible**: Works on mobile, web, with screen readers

## Out of Scope (Future Features)

The following are intentionally excluded from this initial implementation:
- Pet profiles (separate feature)
- Care task tracking (depends on households first)
- Activity feed (depends on task tracking)
- Permission levels beyond member/leader (future enhancement)
- Household settings customization (future)
- Multiple households per user (Phase 2)

## Dependencies

### Prerequisites
- ✅ User authentication system (completed)
- ✅ Database infrastructure (Supabase connected)
- ✅ Email verification flow (completed)

### Follows This Feature
- Pet profiles (requires household context)
- Care task creation (requires household & pets)
- Activity tracking (requires tasks)
- Medication reminders (requires pets & tasks)

## User Flows

### Flow 1: Create a Household (New User)
1. User registers and verifies email
2. Redirected to "/onboarding/household"
3. Sees: "Create a household" or "Join a household"
4. Clicks "Create a household"
5. Enters household name (e.g., "The Zeder House")
6. System generates invite code
7. Shows success: "Household created! Share code: ZEDER-2024-ALPHA"
8. Redirected to dashboard showing household info

### Flow 2: Join a Household (New User)
1. User registers and verifies email
2. Redirected to "/onboarding/household"
3. Clicks "Join a household"
4. Enters invite code from household leader
5. Submits request
6. Shows: "Request sent! Waiting for approval from household leader"
7. Receives notification when approved
8. Redirected to household dashboard

### Flow 3: Approve a Join Request (Household Leader)
1. Leader sees notification: "New join request from jane@example.com"
2. Opens household management page
3. Sees pending requests with member info
4. Clicks "Approve" or "Reject"
5. Approved member gets notification
6. Member appears in household member list

### Flow 4: Manage Members (Household Leader)
1. Leader navigates to household settings
2. Sees list of all members with roles
3. Can click "Remove" next to any member
4. Can regenerate invite code
5. Can set member as "Temporary" with expiration

## Technical Approach Summary

See `design.md` for detailed technical architecture. Key points:

1. **Database-Agnostic Design**: Custom tables, not provider-dependent
2. **Tables**: households, household_members, household_invites
3. **Security**: Row-level security policies, leader-only mutations
4. **API**: RESTful endpoints in packages/auth (household context)
5. **UI**: New `/households` route with React components
6. **Mobile**: React Native screens (Maya ensures parity)

## Risks & Mitigations

### Risk: Invite Code Collisions
- **Mitigation**: Use UUID-based codes with uniqueness constraint
- **Fallback**: Regenerate if collision detected (rare)

### Risk: Orphaned Households (Leader Leaves)
- **Mitigation**: Auto-promote longest-standing member to leader
- **Fallback**: Notify all members, allow voluntary leader election

### Risk: Spam Join Requests
- **Mitigation**: Rate limiting on join requests (5 per hour)
- **Mitigation**: Leader can regenerate code to invalidate old one

### Risk: Mobile/Web Inconsistency
- **Mitigation**: Maya reviews all UI/UX for mobile parity
- **Mitigation**: Shared API layer ensures consistent behavior

## Open Questions for Agent Research

These will be answered by agents during the research phase:

1. **Peter (Product)**: What do competitors do for household sharing? (Rover, Wag, Pawprint, etc.)
2. **Samantha (Security)**: Best practices for invite code security?
3. **Dexter (UX)**: Optimal onboarding flow for household setup?
4. **Maya (Mobile)**: Mobile-first considerations for QR code scanning?
5. **Ana (Analytics)**: What events should we track for household adoption?
6. **Axel (API)**: RESTful vs GraphQL for household relationships?
7. **Buck (Data)**: How to structure household data for future analytics?

## Approval Checklist

Before proceeding to implementation, ensure:
- [ ] All 14 agents have reviewed and created checklists
- [ ] Peter has researched competitors and refined requirements
- [ ] User has reviewed and approved final proposal
- [ ] Open questions are answered
- [ ] Design.md is comprehensive
- [ ] Tasks.md has clear, ordered implementation steps

---

**Next Steps**: Multi-agent research phase will now begin to:
1. Research competitors and best practices
2. Create quality checklists for all 14 agents
3. Refine requirements based on findings
4. Present final proposal for user approval
