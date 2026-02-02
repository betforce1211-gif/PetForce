# Spec Delta: Household Invites

**Capability**: `household-invites`
**Change ID**: `implement-household-management-system`
**Affects Specs**: `product-management`, `software-engineering`, `security`, `ux-design`, `mobile-development`
**Updated**: 2026-02-01 (Peter's competitive research)

## Overview

This capability defines the household invite system, including invite code generation, join requests, approval workflow, email invites, and QR code sharing.

---

## ADDED Requirements

### Requirement: Households SHALL have unique, shareable invite codes
The system SHALL generate a unique invite code for each household in the format PREFIX-RANDOM (e.g., "ZEDER-ALPHA-BRAVO") that can be shared to allow family members and caregivers to join without exposing internal database identifiers.

#### Scenario: Invite code is generated on household creation

**Given** user creates household "The Zeder House"
**When** household creation completes
**Then**:
- An invite code is automatically generated
- Format: PREFIX-RANDOM (e.g., "ZEDER-ALPHA-BRAVO")
- Code is unique across all households
- Code is stored in households.invite_code column
- Code expires 30 days from creation (default)
- Code is shown to household creator/leader

**Success Criteria**:
- Code follows expected format (no year)
- Code is unique (database constraint enforced)
- Code is memorable and shareable
- Leader can copy code to clipboard
- Expiration date is visible to leader

#### Scenario: Invite code generation handles household names with special characters

**Given** user creates household "O'Brien's Pet House!"
**When** invite code is generated
**Then**:
- Prefix is extracted from alphanumeric characters: "OBRIENS"
- Code is formatted as "OBRIENS-ALPHA-BRAVO"

**Success Criteria**:
- Special characters are removed
- Code remains readable
- No invalid characters in code

#### Scenario: Invite code generation handles short household names

**Given** user creates household "XY"
**When** invite code is generated
**Then**:
- Prefix defaults to "HOUSE" (minimum length)
- Code is formatted as "HOUSE-ALPHA-BRAVO"

**Success Criteria**:
- Short names don't break code generation
- Default prefix is used when needed
- Code is still unique

---

### Requirement: Users SHALL be able to request to join households using invite codes
The system SHALL allow authenticated users without a household to submit an invite code, creating a pending join request that notifies the household leader for approval or rejection.

#### Scenario: User submits valid invite code

**Given** household "The Zeder House" has invite code "ZEDER-ALPHA-BRAVO"
**And** user Bob has no household
**When** Bob submits invite code "ZEDER-ALPHA-BRAVO"
**Then**:
- A join request is created in household_join_requests table
- Request status is 'pending'
- Bob sees message: "Request sent! Waiting for approval from household leader"
- Household leader receives notification: "Bob (bob@example.com) wants to join your household"
- Bob sees household description in confirmation

**Success Criteria**:
- Join request is created
- Both user and leader are notified
- User cannot access household until approved
- Request appears in leader's pending requests

#### Scenario: User submits invalid invite code

**Given** no household has invite code "INVALID-CODE"
**When** user submits invite code "INVALID-CODE"
**Then**:
- Error is returned: "Invalid invite code. Please check and try again."
- No join request is created
- User remains on join form

**Success Criteria**:
- Clear error message
- No security information leaked
- User can retry with correct code

#### Scenario: User submits expired invite code

**Given** household invite code expired on Feb 1
**When** user submits code on Feb 5
**Then**:
- Error is returned: "This invite code has expired. Please ask the household leader for a new code."
- No join request is created

**Success Criteria**:
- Expired codes are rejected
- Clear error message
- User knows to request new code

#### Scenario: User already in household attempts to join another

**Given** user Alice is already in household "The Zeder House"
**When** Alice attempts to join household "The Smith House" using invite code
**Then**:
- Error is returned: "You already belong to a household. Leave your current household first."

**Success Criteria**:
- Cannot belong to multiple households (Phase 1 limitation)
- Clear error message explains constraint
- User must leave current household first

#### Scenario: User attempts to join same household twice

**Given** user Bob has pending join request for "The Zeder House"
**When** Bob submits the same invite code again
**Then**:
- Error is returned: "You already have a pending request for this household"

**Success Criteria**:
- Prevents duplicate requests
- Clear error message
- Original request remains pending

---

### Requirement: Household leaders SHALL be able to approve or reject join requests
The system SHALL allow household leaders to review pending join requests and either approve (adding user as active member) or reject (marking request as rejected) with notifications sent to the requesting user.

#### Scenario: Leader approves join request

**Given** Bob has pending join request for "The Zeder House"
**When** leader Alice approves Bob's request
**Then**:
- Bob is added to household_members with role='member'
- Bob's invited_by field is set to Alice's user_id
- Join request status changes to 'approved'
- Request's responded_at timestamp is set
- Request's responded_by is set to Alice's user_id
- Bob receives notification: "You've been approved to join The Zeder House!"
- Bob can now access household dashboard
- Bob sees welcome screen on first login

**Success Criteria**:
- Bob becomes active household member
- Bob has full member access
- Approval is logged for audit
- Both leader and new member are notified

#### Scenario: Leader rejects join request

**Given** Bob has pending join request for "The Zeder House"
**When** leader Alice rejects Bob's request
**Then**:
- Join request status changes to 'rejected'
- Request's responded_at timestamp is set
- Request's responded_by is set to Alice's user_id
- Bob is NOT added to household_members
- Bob receives notification: "Your request to join The Zeder House was declined"
- Bob can create own household or try another invite code

**Success Criteria**:
- Bob does not gain household access
- Rejection is logged
- Bob is notified
- Bob can take alternative action

#### Scenario: Non-leader attempts to approve join request

**Given** Carol is a regular member (not leader) in "The Zeder House"
**When** Carol attempts to approve a join request via API
**Then**:
- Error is returned: "Only household leader can approve join requests"
- Request status remains 'pending'

**Success Criteria**:
- Only leader can approve/reject
- Permission error is returned
- Attempt is logged

#### Scenario: Leader approves multiple requests in batch

**Given** household has 3 pending join requests
**When** leader approves all 3 requests
**Then**:
- All 3 users are added as members
- All 3 requests are marked 'approved'
- All 3 users receive notifications

**Success Criteria**:
- Batch approval is efficient
- All operations succeed or all rollback
- No partial state

---

### Requirement: Join requests SHALL be rate-limited to prevent spam
The system SHALL enforce a rate limit of 5 join requests per hour per user to prevent abuse and spam, returning a clear error message when the limit is exceeded.

#### Scenario: User submits join requests within rate limit

**Given** user Bob submits 3 join requests in one hour
**When** requests are validated
**Then** all 3 requests are accepted

**Success Criteria**:
- Normal usage is not blocked
- Rate limit allows reasonable activity

#### Scenario: User exceeds join request rate limit

**Given** user Bob submits 6 join requests in one hour
**When** 6th request is submitted
**Then**:
- Error is returned: "Too many join requests. Please try again later."
- 6th request is not created

**Success Criteria**:
- Rate limit is enforced (5 requests per hour)
- Clear error message
- Limit resets after 1 hour

---

### Requirement: Invite codes SHALL support QR code generation for mobile sharing
The system SHALL generate scannable QR codes containing household invite codes for mobile users, using dynamic QR codes with PetForce branding and clear call-to-action per 2026 best practices.

#### Scenario: Leader generates branded QR code from invite code

**Given** leader has household with invite code "ZEDER-ALPHA-BRAVO"
**When** leader clicks "Share via QR Code"
**Then**:
- QR code is generated containing invite code
- QR code includes PetForce logo/branding
- QR code includes text: "Scan to Join The Zeder House"
- QR code is displayed on screen
- User can save QR code image
- User can share QR code via messaging apps
- QR code is dynamic (supports analytics tracking)

**Success Criteria**:
- QR code is scannable
- QR code contains invite code in machine-readable format
- Works on iOS and Android
- Branded for trust (2026 best practice)
- Minimum 2cm x 2cm size
- High contrast, 4-module quiet zone

#### Scenario: User scans QR code to join household

**Given** leader shares QR code containing "ZEDER-ALPHA-BRAVO"
**When** new user scans QR code with mobile app
**Then**:
- App extracts invite code from QR data
- Join form is pre-filled with code
- Household name and description are shown
- User clicks "Submit" to send join request

**Success Criteria**:
- QR scanning works reliably
- Code extraction is accurate
- One-click join after scan
- Context provided before joining

#### Scenario: Web users see invite code text (no QR needed)

**Given** leader is on web browser
**When** leader views invite code
**Then**:
- Invite code is displayed as text
- "Copy to clipboard" button is available
- QR code generation is optional
- QR code can be downloaded as image

**Success Criteria**:
- Web users can copy/paste code
- QR code is bonus feature, not required
- Both options available

---

### Requirement: Old invite codes SHALL be invalidated when regenerated
The system SHALL immediately invalidate the previous invite code when a household leader generates a new code, preventing the old code from being used to join the household and enhancing security.

#### Scenario: Leader regenerates invite code

**Given** household has invite code "ZEDER-ALPHA-BRAVO"
**When** leader regenerates invite code
**Then**:
- New code is generated (e.g., "ZEDER-CHARLIE-DELTA")
- Old code "ZEDER-ALPHA-BRAVO" is replaced in database
- Old code cannot be used to join household
- New code can be used to join household
- New code has fresh expiration date

**Success Criteria**:
- Only one active code per household at a time
- Old code is immediately invalidated
- New code works for joining

#### Scenario: User attempts to join with old invite code

**Given** household invite code was regenerated from "ZEDER-ALPHA-BRAVO" to "ZEDER-CHARLIE-DELTA"
**When** user submits old code "ZEDER-ALPHA-BRAVO"
**Then**:
- Error is returned: "Invalid invite code. This code may have been regenerated. Contact household leader for new code."

**Success Criteria**:
- Old code is rejected
- Error message hints at regeneration
- User knows to get new code

---

### Requirement: Pending join requests SHALL persist until responded to
The system SHALL maintain join requests in 'pending' status indefinitely until the household leader approves or rejects them, without automatic expiration, ensuring no requests are lost due to delayed response.

#### Scenario: Join request remains pending for days

**Given** Bob submitted join request on Feb 1
**When** current date is Feb 5 and leader hasn't responded
**Then**:
- Request still appears in leader's pending requests
- Request status is still 'pending'
- Bob can see request is still awaiting approval

**Success Criteria**:
- No automatic expiration
- Request persists until action taken
- Both parties can see pending state

#### Scenario: Leader views old pending requests

**Given** household has pending requests from 30 days ago
**When** leader views pending requests
**Then**:
- All pending requests are shown (sorted by requested_at desc)
- Oldest requests appear first
- Leader can approve/reject any request

**Success Criteria**:
- No loss of requests
- Easy to find old requests
- Can act on requests regardless of age

---

### Requirement: Users SHALL be able to withdraw pending join requests
The system SHALL allow users with pending join requests to cancel/withdraw their request before the household leader responds, providing user control and preventing awkward situations.

#### Scenario: User withdraws pending join request

**Given** Bob has pending join request for "The Zeder House"
**When** Bob clicks "Withdraw Request"
**Then**:
- Join request status changes to 'withdrawn'
- Request disappears from leader's pending requests
- Bob sees: "Request withdrawn. You can join another household or create your own."
- Leader does not receive notification (silent withdrawal)

**Success Criteria**:
- User can withdraw anytime before response
- Request removed from leader's queue
- User can submit new request if desired

#### Scenario: User cannot withdraw responded request

**Given** Bob's join request was approved
**When** Bob attempts to withdraw
**Then**:
- Error is returned: "Cannot withdraw approved request. You are already a member."

**Success Criteria**:
- Can only withdraw pending requests
- Cannot withdraw approved/rejected requests

---

### Requirement: Users SHALL be able to view status of their join requests
The system SHALL display the status of all join requests submitted by a user (pending, approved, rejected) with timestamps, providing transparency and reducing support burden.

#### Scenario: User views their pending requests

**Given** Bob submitted join request on Feb 1
**When** Bob navigates to "My Join Requests"
**Then** Bob sees:
- Household name: "The Zeder House"
- Status: "Pending"
- Requested at: "Feb 1, 2024 at 3:45pm"
- "Withdraw Request" button

**Success Criteria**:
- All user's requests visible
- Status clearly displayed
- Timestamps shown
- Action buttons available

#### Scenario: User receives notification on status change

**Given** Bob has pending join request
**When** leader approves Bob's request
**Then**:
- Bob receives push notification: "You've been approved to join The Zeder House!"
- Request status changes to "Approved" in UI
- Notification includes deep link to household dashboard

**Success Criteria**:
- Real-time notification on status change
- Push notification on mobile
- Email notification as backup

---

### Requirement: Household leaders SHALL be able to send email invites
The system SHALL allow household leaders to invite members via email, sending a personalized invitation link that pre-fills the invite code and tracks who invited them.

#### Scenario: Leader sends email invite

**Given** Alice is household leader
**When** Alice sends email invite to bob@example.com
**Then**:
- Email is sent to bob@example.com
- Email subject: "Alice invited you to join The Zeder House on PetForce"
- Email contains personalized message
- Email contains invite link with embedded code
- Email contains household description
- Invite is tracked with invited_by=Alice

**Success Criteria**:
- Email delivered successfully
- Link pre-fills invite code
- Personalized for recipient
- Tracks inviter

#### Scenario: User clicks email invite link

**Given** Bob receives email invite from Alice
**When** Bob clicks invite link in email
**Then**:
- Bob is directed to join form
- Invite code is pre-filled
- Household name and description are shown
- "Join The Zeder House" button displayed
- One-click to join (no manual code entry)

**Success Criteria**:
- Frictionless join experience
- No manual typing required
- Context provided before joining

#### Scenario: Email invite is rate-limited

**Given** Alice is household leader
**When** Alice sends 21 email invites in one hour
**Then**:
- Error is returned: "Too many email invites. Please try again later."
- 21st invite is not sent

**Success Criteria**:
- Rate limit prevents spam (20 per hour)
- Clear error message
- Legitimate use not blocked

---

## MODIFIED Requirements

### MODIFIED: Invite code format excludes year

**Original**: PREFIX-YEAR-RANDOM (e.g., "ZEDER-2024-ALPHA")
**Updated**: PREFIX-RANDOM (e.g., "ZEDER-ALPHA-BRAVO")
**Reasoning**: Year becomes outdated and looks stale. Random words are memorable without date baggage.

#### Scenario: Invite code uses two random words

**Given** user creates household "The Zeder House"
**When** invite code is generated
**Then** code follows format "ZEDER-ALPHA-BRAVO" (two random memorable words)

**Success Criteria**:
- No year in code
- Two random words
- Words from phonetic alphabet or similar memorable list

---

### MODIFIED: QR codes use dynamic codes with analytics

**Original**: Static QR codes
**Updated**: Dynamic QR codes that support analytics tracking and future code updates without regenerating QR image
**Reasoning**: 2026 best practice - dynamic codes allow tracking scans, changing destination URL

#### Scenario: QR code tracks scan analytics

**Given** leader generates QR code
**When** 3 users scan the QR code
**Then**:
- Analytics show 3 scans
- Leader can see scan count in dashboard
- Scan timestamps and locations tracked (optional)

**Success Criteria**:
- Dynamic QR code service used
- Scan analytics available
- Can update destination without new QR

---

## REMOVED Requirements

### REMOVED: Case-insensitive invite codes

**Original**: Codes are case-insensitive (ZEDER-ALPHA == zeder-alpha)
**Reasoning**: Adds complexity, not necessary. UI auto-capitalizes input. Uppercase is clearer.
**Action**: Make codes uppercase only, validate uppercase input, auto-capitalize in UI

---

## Cross-Capability Dependencies

- **Depends on**: `household-core` (this change) - Requires household and invite code
- **Depends on**: `user-authentication` (existing) - Requires authenticated users
- **Related to**: `household-membership` (this change) - Approved requests become members
- **Enhances**: `mobile-development` (existing) - QR code scanning for mobile users

---

## Validation Criteria

- [ ] Invite codes are unique and follow PREFIX-RANDOM format (no year)
- [ ] Invite codes are uppercase only
- [ ] Invite codes expire after configured period (default 30 days)
- [ ] Users can request to join with valid code
- [ ] Invalid codes are rejected with clear errors
- [ ] Expired codes are rejected with clear errors
- [ ] Leader can approve/reject requests
- [ ] Only leader can approve/reject (permission check)
- [ ] Join requests are rate-limited (5 per hour)
- [ ] QR codes can be generated and scanned
- [ ] QR codes are branded with PetForce logo
- [ ] QR codes are dynamic (support analytics)
- [ ] QR codes follow 2026 best practices (size, contrast, quiet zone)
- [ ] Old codes are invalidated on regeneration
- [ ] Pending requests persist until responded to
- [ ] Users can withdraw pending requests
- [ ] Users can view status of their requests
- [ ] Email invites can be sent with personalized links
- [ ] Email invites are rate-limited (20 per hour)
- [ ] Invited_by field tracks inviter
- [ ] All scenarios have passing tests
