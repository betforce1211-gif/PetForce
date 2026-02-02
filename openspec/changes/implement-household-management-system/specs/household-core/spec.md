# Spec Delta: Household Core

**Capability**: `household-core`
**Change ID**: `implement-household-management-system`
**Affects Specs**: `product-management`, `software-engineering`, `data-engineering`, `security`
**Updated**: 2026-02-01 (Peter's competitive research)

## Overview

This capability defines the core household entity and its management, including creation, retrieval, and leadership.

---

## ADDED Requirements

### Requirement: Users SHALL be able to create households after registration
The system SHALL allow authenticated users to create a new household by providing a household name and optional description, automatically assigning them as the household leader with a unique invite code generated for sharing.

#### Scenario: User creates household with valid name

**Given** a user is authenticated and has no household
**When** the user submits household name "The Zeder House"
**Then** a household is created with:
- Unique ID
- Name "The Zeder House"
- User as household leader
- Unique invite code generated (PREFIX-RANDOM format)
- Invite code expiration set to 30 days from now
- User automatically added as member with role='leader'

**Success Criteria**:
- Household exists in database
- User is leader
- Invite code is unique and shareable
- User can see household dashboard

#### Scenario: User creates household with invalid name

**Given** a user is authenticated
**When** the user submits household name "X" (too short)
**Then** an error is returned: "Household name must be 2-50 characters"

**Success Criteria**:
- No household is created
- User sees validation error
- Can retry with valid name

#### Scenario: User creates household with special characters

**Given** a user is authenticated
**When** the user submits household name "The 🐕 House!" (emoji and special char)
**Then** an error is returned: "Household name must contain only letters, numbers, and spaces"

**Success Criteria**:
- Emojis are rejected
- Special characters are rejected
- Only alphanumeric + spaces allowed

#### Scenario: User creates household with optional description

**Given** a user is authenticated and has no household
**When** the user submits household name "The Zeder House" and description "2 dogs, 3 cats"
**Then** a household is created with name and description visible to all members

**Success Criteria**:
- Household description is stored
- Description is visible to all household members
- Description is optional (can be empty)

#### Scenario: User attempts to create second household

**Given** a user already belongs to a household
**When** the user attempts to create another household
**Then** an error is returned: "You already belong to a household"

**Success Criteria**:
- No new household is created
- User remains in current household
- Error message explains limitation

---

### Requirement: Users SHALL be able to view their household details
The system SHALL display household information including name, description, member list, member roles, and invite code (for leaders only) with appropriate permissions enforced.

#### Scenario: User views household as member

**Given** a user belongs to household "The Zeder House"
**And** user is a regular member (not leader)
**When** user navigates to household dashboard
**Then** user sees:
- Household name: "The Zeder House"
- Household description (if set)
- Member count: 4 members
- Member list with names and roles
- Own role: "Member"
- No invite code (leader-only)
- No management actions (leader-only)

**Success Criteria**:
- Household data is displayed correctly
- Leader-only elements are hidden
- Member can see other members

#### Scenario: User views household as leader

**Given** a user belongs to household "The Zeder House"
**And** user is the household leader
**When** user navigates to household dashboard
**Then** user sees:
- All information members see (above)
- Household description (if set)
- Invite code: "ZEDER-ALPHA-BRAVO"
- Invite code expiration date
- "Regenerate Code" button
- "Manage Members" link
- "Pending Requests" link (if any)
- "Remove" button next to each member (except self)

**Success Criteria**:
- Leader sees all management options
- Invite code is displayed
- Can access leader-only features

#### Scenario: User with no household views household page

**Given** a user is authenticated but has no household
**When** user navigates to `/households`
**Then** user is redirected to `/onboarding/household`

**Success Criteria**:
- Redirect happens automatically
- User sees create/join options
- Cannot bypass onboarding

---

### Requirement: Household leaders SHALL be able to regenerate invite codes
The system SHALL allow household leaders to generate a new unique invite code for their household with configurable expiration, automatically invalidating the previous code to prevent unauthorized access.

#### Scenario: Leader regenerates invite code successfully

**Given** user is household leader
**And** current invite code is "ZEDER-ALPHA-BRAVO"
**When** leader clicks "Regenerate Invite Code"
**Then**:
- A new unique code is generated (e.g., "ZEDER-CHARLIE-DELTA")
- Old code "ZEDER-ALPHA-BRAVO" is invalidated
- New code is displayed to leader
- New code has 30-day expiration (default)
- Success message: "New invite code generated"

**Success Criteria**:
- Old code cannot be used to join
- New code can be used to join
- Code change is logged for audit

#### Scenario: Leader sets custom expiration on regeneration

**Given** user is household leader
**When** leader regenerates invite code with 7-day expiration
**Then** new code expires 7 days from generation

**Success Criteria**:
- Custom expiration periods supported (7, 30, 90 days, never)
- Expiration date visible to leader
- System enforces expiration on join attempts

#### Scenario: Non-leader attempts to regenerate code

**Given** user is a household member (not leader)
**When** user attempts to regenerate invite code via API
**Then** an error is returned: "Only household leader can regenerate invite code"

**Success Criteria**:
- Invite code is NOT changed
- Permission error is returned
- Attempt is logged

---

### Requirement: Households SHALL be uniquely identifiable by invite code
The system SHALL ensure each household has a globally unique invite code that can be used to identify and join the household without exposing internal database identifiers.

#### Scenario: Invite code lookup finds household

**Given** a household exists with invite code "ZEDER-ALPHA-BRAVO"
**When** a user submits invite code "ZEDER-ALPHA-BRAVO"
**Then** the system identifies the household "The Zeder House"

**Success Criteria**:
- Invite code lookup is fast (<100ms)
- Correct household is returned
- Code is uppercase only (case-sensitive for security)

#### Scenario: Invalid invite code lookup

**Given** no household has invite code "INVALID-CODE"
**When** a user submits invite code "INVALID-CODE"
**Then** an error is returned: "Invalid invite code"

**Success Criteria**:
- No household data is exposed
- Error is user-friendly
- No security information leaked

#### Scenario: Expired invite code lookup

**Given** household invite code expired on Feb 1
**When** user submits code on Feb 5
**Then** an error is returned: "This invite code has expired. Please ask the household leader for a new code."

**Success Criteria**:
- Expired codes are rejected
- Clear error message
- User knows to request new code

---

### Requirement: Household data SHALL be database-agnostic
The system SHALL store household data in custom tables using standard SQL with no provider-specific dependencies, following the pattern established in user_registrations for portability across database systems.

#### Scenario: Household data is portable across databases

**Given** household data is stored in custom tables
**When** database provider changes (e.g., Supabase → PostgreSQL → MySQL)
**Then** household data remains intact and accessible

**Success Criteria**:
- Uses standard SQL (no provider-specific features)
- Table schema is portable
- RLS policies use standard PostgreSQL (compatible with alternatives)
- No Supabase auth.users dependency (uses UUID reference)

#### Scenario: Household queries use database indexes

**Given** households table has indexes on invite_code and leader_id
**When** querying households by invite code
**Then** database uses the index for fast lookup

**Success Criteria**:
- Query plan shows index usage
- Lookup time < 100ms even with 100k households
- No full table scans

---

### Requirement: Invite codes SHALL expire after a configurable time period
The system SHALL generate invite codes with a default 30-day expiration, with household leaders able to set custom expiration periods (7 days, 30 days, 90 days, or never) for security purposes.

#### Scenario: Invite code expires after 30 days

**Given** household has invite code "ZEDER-ALPHA-BRAVO" created on Feb 1
**And** invite code has default 30-day expiration
**When** user attempts to join on March 5 (after expiration)
**Then** an error is returned: "This invite code has expired. Please ask the household leader for a new code."

**Success Criteria**:
- Expired codes are rejected
- Clear error message directs user to get new code
- Leader can regenerate code to create fresh one

#### Scenario: Leader sets never-expiring invite code

**Given** user is household leader
**When** leader regenerates invite code with "never" expiration
**Then** new code has no expiration date (invite_code_expires_at = NULL)

**Success Criteria**:
- Never-expiring option supported
- NULL expiration bypasses expiration check
- Leader can change to expiring code later

---

### Requirement: Households SHALL support a maximum of 15 active members
The system SHALL enforce a limit of 15 active members per household to prevent abuse and ensure performance, returning a clear error when the limit is reached.

#### Scenario: Household reaches member limit

**Given** household has 15 active members
**When** leader approves a 16th join request
**Then** an error is returned: "Household has reached maximum capacity (15 members)"

**Success Criteria**:
- Member limit enforced (15 active members)
- Removed members don't count toward limit
- Clear error message when limit reached

#### Scenario: Removed member doesn't count toward limit

**Given** household has 15 active members and 5 removed members
**When** querying member count
**Then** member count is 15 (removed members excluded)

**Success Criteria**:
- Only active members count toward limit
- Removed members don't block new additions
- Audit trail preserved for removed members

---

### Requirement: Household name SHALL be 2-50 characters, alphanumeric with spaces only
The system SHALL enforce household name constraints of 2-50 characters containing only letters, numbers, and spaces to prevent display issues and ensure compatibility across all platforms.

#### Scenario: Household name validation

**Given** a user creates a household
**When** the user submits name with emojis "The 🐕 House"
**Then** an error is returned: "Household name must contain only letters, numbers, and spaces"

**Success Criteria**:
- Emojis are rejected
- Special characters are rejected
- Alphanumeric + spaces only
- 2-50 character length enforced

---

### Requirement: Household description SHALL be optional with 200 character limit
The system SHALL allow household leaders to set an optional description (e.g., "The Zeder family - 2 dogs, 3 cats") visible to all members and displayed on join request preview.

#### Scenario: Leader adds household description

**Given** user is household leader
**When** leader sets description "The Zeder family - 2 dogs, 3 cats"
**Then** description is visible to all household members

**Success Criteria**:
- Description is optional (can be null)
- Description limited to 200 characters
- Visible to all members
- Can be updated by leader

#### Scenario: Join request shows household description

**Given** household has description "The Zeder family - 2 dogs, 3 cats"
**When** user submits join request
**Then** user sees description in pending request confirmation

**Success Criteria**:
- Description provides context before joining
- Helps users confirm correct household
- Visible in join flow

---

## MODIFIED Requirements

### MODIFIED: Invite code format changed from PREFIX-YEAR-RANDOM to PREFIX-RANDOM

**Original**: Invite codes formatted as PREFIX-YEAR-RANDOM (e.g., "ZEDER-2024-ALPHA")
**Updated**: Invite codes formatted as PREFIX-RANDOM (e.g., "ZEDER-ALPHA-BRAVO")
**Reasoning**: Year becomes outdated and looks stale. Random words are memorable without date baggage.

#### Scenario: Invite code generation without year

**Given** user creates household "The Zeder House"
**When** invite code is generated
**Then** code follows format PREFIX-RANDOM (e.g., "ZEDER-ALPHA-BRAVO")

**Success Criteria**:
- No year in code
- Two random memorable words
- Format: PREFIX-WORD1-WORD2

---

### MODIFIED: Invite codes are case-sensitive (uppercase only)

**Original**: Codes are case-insensitive (ZEDER-ALPHA == zeder-alpha)
**Updated**: Codes are uppercase only, case-sensitive
**Reasoning**: Simplifies implementation, prevents collision issues, clearer for users

#### Scenario: Lowercase invite code auto-capitalized in UI

**Given** household has invite code "ZEDER-ALPHA-BRAVO"
**When** user types "zeder-alpha-bravo" in join form
**Then** input is auto-capitalized to "ZEDER-ALPHA-BRAVO"

**Success Criteria**:
- Codes are stored and validated as uppercase
- UI auto-capitalizes input
- Copy-paste preserves uppercase
- Backend validates uppercase only

---

## REMOVED Requirements

### REMOVED: Case-insensitive invite codes

**Original Spec**: "Code is case-insensitive (ZEDER-2024-ALPHA == zeder-2024-alpha)"
**Reasoning**: Adds complexity, not necessary. Users can copy-paste. Uppercase is clearer.
**Action**: Make codes uppercase only, validate uppercase input, auto-capitalize in UI

---

## Cross-Capability Dependencies

- **Depends on**: `user-authentication` (existing) - Requires authenticated users
- **Required by**: `household-membership` (this change) - Core household needed for membership
- **Required by**: `household-invites` (this change) - Household needed for invite system
- **Required by**: `pet-profiles` (future) - Pets belong to households
- **Required by**: `care-tasks` (future) - Tasks are scoped to households

---

## Validation Criteria

- [ ] All scenarios have passing tests (unit + integration)
- [ ] Database migration creates households table with description and invite_code_expires_at fields
- [ ] Invite codes are unique across all households
- [ ] Invite codes follow PREFIX-RANDOM format (no year)
- [ ] Invite codes are uppercase only
- [ ] Invite codes expire after configured period (default 30 days)
- [ ] Household name validation (2-50 chars, alphanumeric + spaces)
- [ ] Household description optional (max 200 chars)
- [ ] Household member limit enforced (15 active members)
- [ ] Leader permissions are enforced
- [ ] Household data is queryable by user_id and invite_code
- [ ] No Supabase-specific dependencies in data model
