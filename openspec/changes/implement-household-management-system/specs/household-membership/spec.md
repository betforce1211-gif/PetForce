# Spec Delta: Household Membership

**Capability**: `household-membership`
**Change ID**: `implement-household-management-system`
**Affects Specs**: `product-management`, `software-engineering`, `security`, `ux-design`
**Updated**: 2026-02-01 (Peter's competitive research)

## Overview

This capability defines household membership management, including member roles, permissions, removal, and leadership transitions.

---

## ADDED Requirements

### Requirement: Household creators SHALL automatically become household leaders
The system SHALL automatically add the household creator as a member with role='leader' in an atomic transaction when a household is created, ensuring every household has exactly one leader from creation.

#### Scenario: User creates household and becomes leader

**Given** user creates household "The Zeder House"
**When** household creation completes
**Then**:
- User is automatically added to household_members table
- User role is set to 'leader'
- User status is 'active'
- User is NOT temporary (is_temporary = false)
- Joined_at timestamp is set to now

**Success Criteria**:
- Leader can access leader-only features
- Leader appears in member list with "Leader" badge
- No additional action required by user

#### Scenario: Household creation is atomic

**Given** user creates household "The Zeder House"
**When** household creation transaction runs
**Then**:
- Household row is inserted
- Leader membership row is inserted
- BOTH succeed or BOTH rollback (atomic transaction)

**Success Criteria**:
- No households exist without a leader
- No orphaned household records
- Database maintains referential integrity

---

### Requirement: Household leaders SHALL be able to remove members
The system SHALL allow household leaders to remove any member (except themselves) from the household by setting membership status to 'removed', revoking access while preserving audit history.

#### Scenario: Leader removes member successfully

**Given** leader manages household with members: Alice (leader), Bob (member), Carol (member)
**When** leader removes Bob
**Then**:
- Bob's membership status changes to 'removed'
- Bob no longer appears in member list
- Bob cannot access household data
- Bob receives notification: "You were removed from The Zeder House"
- Removal is logged with correlation ID

**Success Criteria**:
- Bob loses all household access immediately
- Bob's data is soft-deleted (status='removed'), not hard-deleted
- Audit trail exists for the removal

#### Scenario: Leader attempts to remove self

**Given** leader is Alice in "The Zeder House"
**When** Alice attempts to remove herself
**Then** an error is returned: "Leaders cannot remove themselves. Transfer leadership or leave household."

**Success Criteria**:
- Alice remains in household
- Alice remains leader
- Error explains correct action

#### Scenario: Non-leader attempts to remove member

**Given** Bob is a regular member in "The Zeder House"
**When** Bob attempts to remove Carol via API
**Then** an error is returned: "Only household leader can remove members"

**Success Criteria**:
- Carol remains in household
- Permission error is returned
- Attempt is logged for security

#### Scenario: Removed member attempts to access household

**Given** Bob was removed from household
**When** Bob tries to access household dashboard
**Then**:
- Bob sees: "You are no longer a member of this household"
- Bob is redirected to household onboarding
- Bob can create new household or join another

**Success Criteria**:
- No household data is accessible
- Clear error message
- Path to rejoin households

---

### Requirement: Households SHALL support temporary members with expiration
The system SHALL allow household leaders to add temporary members (pet sitters, daycare workers) with is_temporary=true and an expiration timestamp, automatically revoking access when the expiration date is reached.

#### Scenario: Leader adds temporary member with expiration

**Given** leader manages "The Zeder House"
**When** leader adds pet sitter Sarah as temporary member
**And** sets expiration to 7 days from now
**Then**:
- Sarah is added with is_temporary=true
- Sarah's temporary_expires_at is set to 7 days from now
- Sarah has full member access until expiration
- Sarah sees badge: "Temporary Access (Expires Feb 8)"

**Success Criteria**:
- Temporary member has access before expiration
- Temporary member is clearly marked in UI
- Expiration date is displayed

#### Scenario: Temporary member access expires

**Given** Sarah's temporary access expires on Feb 8
**When** current date becomes Feb 9
**Then**:
- Sarah's access is automatically revoked
- Sarah cannot access household
- Sarah sees: "Your temporary access has expired"
- Leader sees Sarah marked as "Expired" in member list

**Success Criteria**:
- Automatic expiration without manual action
- Clear communication to temporary member
- Leader can see expired members

#### Scenario: Leader extends temporary member access

**Given** Sarah's temporary access expires on Feb 8
**When** leader extends Sarah's access to Feb 15
**Then**:
- Sarah's temporary_expires_at is updated to Feb 15
- Sarah continues to have access
- Sarah sees updated expiration date

**Success Criteria**:
- Extension is seamless
- No re-invitation needed
- Expiration date updates immediately

#### Scenario: Temporary member receives expiration warnings

**Given** Sarah's temporary access expires on Feb 8
**When** current date is Feb 5 (3 days before expiration)
**Then**:
- Sarah receives notification: "Your temporary access expires in 3 days"
- Leader receives notification: "Sarah's temporary access expires in 3 days"

**Success Criteria**:
- Warnings sent at 7 days, 3 days, 1 day before expiration
- Both member and leader notified
- Notifications include extension option for leader

---

### Requirement: Leadership SHALL transfer when leader leaves household
The system SHALL allow leaders to designate a successor before leaving, with fallback to auto-promoting the longest-standing active member when the current leader leaves a household with other members, ensuring households always have exactly one leader.

#### Scenario: Leader designates successor and leaves

**Given** household has members: Alice (leader, joined Jan 1), Bob (member, joined Jan 5), Carol (member, joined Jan 10)
**When** Alice designates Bob as successor and leaves the household
**Then**:
- Alice's status changes to 'removed'
- Bob is promoted to leader (role='leader')
- Bob receives notification: "You are now the leader of The Zeder House"
- Carol remains a regular member
- Leadership transfer is logged

**Success Criteria**:
- Designated successor becomes leader
- Household always has exactly one leader
- Transfer is smooth (no downtime)
- All members are notified

#### Scenario: Leader leaves without designating successor

**Given** household has members: Alice (leader, joined Jan 1), Bob (member, joined Jan 5), Carol (member, joined Jan 10)
**When** Alice leaves without designating successor
**Then**:
- Alice's status changes to 'removed'
- Bob (longest-standing member) is automatically promoted to leader
- Bob receives notification: "You are now the leader of The Zeder House"
- Carol remains a regular member
- Leadership transfer is logged

**Success Criteria**:
- Household always has exactly one leader
- Promotion is automatic (no manual action)
- Longest-standing member is chosen
- All members are notified of leadership change

#### Scenario: Leader leaves household as only member

**Given** household has only Alice (leader)
**When** Alice leaves the household
**Then**:
- Household is soft-deleted (or marked inactive)
- Alice's membership status changes to 'removed'
- Household no longer appears in household list
- Future joins are prevented (code invalidated)

**Success Criteria**:
- No orphaned households
- Household is inactive but data preserved for audit
- Cannot join via old invite code

#### Scenario: Non-leader member leaves household

**Given** Bob is a regular member (not leader)
**When** Bob chooses to leave household
**Then**:
- Bob's membership status changes to 'removed'
- Bob loses household access
- No leadership change occurs
- Remaining members are not affected

**Success Criteria**:
- Member can self-remove
- No impact on other members
- Clean exit process

---

### Requirement: Member roles SHALL be limited to 'leader' or 'member'
The system SHALL enforce that household member roles can only be 'leader' or 'member' through database constraints, keeping the initial implementation simple with advanced permissions deferred to future enhancements.

#### Scenario: Member role validation

**Given** a household membership record
**When** role is set to any value other than 'leader' or 'member'
**Then** database constraint rejects the value

**Success Criteria**:
- Only 'leader' and 'member' roles are allowed
- Database enforces constraint
- Invalid roles cannot be inserted

#### Scenario: Leader role uniqueness

**Given** household "The Zeder House"
**When** querying household members
**Then** exactly ONE member has role='leader'

**Success Criteria**:
- Only one leader per household
- Application logic enforces uniqueness
- Database queries validate this constraint

---

### Requirement: Household members SHALL see all other members in their household
The system SHALL display all active household members (name, role, join date, temporary status) to all members of the household, providing transparency about who has access to household and pet data.

#### Scenario: Member views household member list

**Given** household has members: Alice (leader), Bob (member), Carol (temporary)
**When** Bob views the household member list
**Then** Bob sees:
- Alice - Leader badge - Joined Jan 1
- Bob - Member (self) - Joined Jan 5
- Carol - Temporary badge (Expires Feb 8) - Joined Jan 20

**Success Criteria**:
- All active members are visible
- Roles are clearly indicated
- Temporary members are marked
- Join dates are shown

#### Scenario: Removed members are not shown in member list

**Given** Dave was removed from household
**When** current members view member list
**Then** Dave does not appear in the list

**Success Criteria**:
- Only active members are visible
- Removed members are hidden
- Historical data preserved in database for audit

---

### Requirement: New members SHALL see a welcome screen on first login after approval
The system SHALL display a welcome screen to new members explaining household features and prompting them to complete their profile, following onboarding best practices for engagement.

#### Scenario: New member sees welcome screen

**Given** Bob's join request was just approved
**When** Bob logs in for first time after approval
**Then**:
- Bob sees welcome screen: "Welcome to The Zeder House!"
- Screen explains household features (pets, tasks, collaboration)
- Screen prompts profile completion
- Screen shows household description

**Success Criteria**:
- Welcome screen shown exactly once (first login after approval)
- Reduces confusion for new members
- Increases engagement
- Can be dismissed/skipped

#### Scenario: Existing member does not see welcome screen

**Given** Bob has been a member for 5 days
**When** Bob logs in
**Then** Bob goes directly to household dashboard (no welcome screen)

**Success Criteria**:
- Welcome screen not shown repeatedly
- Only for first login after approval
- Flag tracked in member record

---

### Requirement: Household membership SHALL track who invited each member
The system SHALL record which user invited each member (via email invite or join request approval) for audit and trust purposes.

#### Scenario: Join request approval tracks approver

**Given** Bob submitted join request
**When** Alice (leader) approves Bob's request
**Then**:
- Bob's household_members.invited_by is set to Alice's user_id
- Audit log records Alice approved Bob
- Member list can show "Invited by Alice"

**Success Criteria**:
- Invited_by field populated on approval
- Visible to leaders (transparency)
- Supports trust network visualization (future)

#### Scenario: Email invite tracks sender

**Given** Alice sends email invite to carol@example.com
**When** Carol joins via email invite link
**Then**:
- Carol's household_members.invited_by is set to Alice's user_id
- Carol sees "You were invited by Alice"

**Success Criteria**:
- Email invites track sender
- Personal connection visible
- Reduces spam/abuse

---

## MODIFIED Requirements

### MODIFIED: Leadership transfer supports designated successor

**Original**: Auto-promote longest-standing member when leader leaves
**Updated**: Prompt leader to designate successor before leaving, with fallback to longest-standing if not designated
**Reasoning**: Better UX, prevents surprise promotions. Slack/Discord admins assign successors.

#### Scenario: Leader prompted to designate successor

**Given** Alice is leader and wants to leave household
**When** Alice clicks "Leave Household"
**Then**:
- UI shows: "Who should become the new leader?"
- Dropdown lists all active members
- Option to skip (auto-promotes longest-standing)
- Confirmation required

**Success Criteria**:
- Leader has choice
- Can delegate intentionally
- Fallback to auto-promotion if skipped

---

## REMOVED Requirements

None. This is a new capability.

---

## Cross-Capability Dependencies

- **Depends on**: `household-core` (this change) - Requires household entity
- **Depends on**: `user-authentication` (existing) - Requires authenticated users
- **Related to**: `household-invites` (this change) - Approved invites become members
- **Required by**: `care-tasks` (future) - Task assignments reference members
- **Required by**: `activity-feed` (future) - Activity log shows which member did what

---

## Validation Criteria

- [ ] Leader auto-added as member on household creation
- [ ] Leader can remove members (except self)
- [ ] Non-leader cannot remove members
- [ ] Temporary members auto-expire
- [ ] Temporary members receive expiration warnings (7, 3, 1 day)
- [ ] Leader can extend temporary member access
- [ ] Leader can designate successor before leaving
- [ ] Leader leaves → designated successor or longest member promoted
- [ ] Only 'leader' and 'member' roles allowed
- [ ] All members see full member list
- [ ] New members see welcome screen on first login
- [ ] Invited_by field tracks who invited each member
- [ ] All scenarios have passing tests
