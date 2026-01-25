## MODIFIED Requirements

### Requirement: Email/Password Authentication
The system SHALL provide email and password authentication for pet parents to securely access their accounts with proper email confirmation handling.

#### Scenario: Successful registration with email confirmation
- **WHEN** a pet parent registers with email and password
- **THEN** the system SHALL create a user record in the database
- **AND** the user SHALL be marked as "unconfirmed" initially
- **AND** the system SHALL send a verification email
- **AND** the system SHALL log the registration event with request ID
- **AND** the system SHALL return success with confirmation_required: true

#### Scenario: User in database but unconfirmed
- **WHEN** querying for a user who registered but hasn't confirmed email
- **THEN** the user SHALL exist in the auth.users table
- **AND** the user SHALL have email_confirmed_at = NULL
- **AND** the system SHALL be able to query the user by ID
- **AND** the system SHALL track the user's confirmation state

#### Scenario: Login attempt before email confirmation
- **WHEN** a user tries to login before confirming their email
- **THEN** the system SHALL reject the login attempt
- **AND** return error code "EMAIL_NOT_CONFIRMED"
- **AND** provide a clear message: "Please verify your email address"
- **AND** log the failed login attempt with reason
- **AND** include a "resend_verification_url" in the error response

#### Scenario: Resend verification email
- **WHEN** a user requests to resend the verification email
- **THEN** the system SHALL check if the user exists and is unconfirmed
- **AND** send a new verification email if valid
- **AND** log the resend event with request ID
- **AND** return success with time until next resend allowed

## ADDED Requirements

### Requirement: Email Confirmation State Tracking
The system SHALL track and expose email confirmation state throughout the authentication flow.

#### Scenario: Check confirmation status
- **WHEN** checking if a user's email is confirmed
- **THEN** the system SHALL query the email_confirmed_at field
- **AND** return confirmation_status: "confirmed" | "pending" | "expired"
- **AND** include confirmed_at timestamp if confirmed
- **AND** include time_since_registration duration

#### Scenario: Log confirmation state transitions
- **WHEN** a user's confirmation state changes
- **THEN** the system SHALL log the state transition
- **AND** include previous state, new state, and timestamp
- **AND** include user ID and email for correlation
- **AND** emit metrics for monitoring

### Requirement: Registration Logging
The system SHALL log all registration events with structured data for observability.

#### Scenario: Log registration attempt
- **WHEN** a registration request is received
- **THEN** the system SHALL log at INFO level
- **AND** include request_id, email (hashed), timestamp
- **AND** include client metadata (user agent, IP)
- **AND** log before calling Supabase API

#### Scenario: Log registration result
- **WHEN** registration completes (success or failure)
- **THEN** the system SHALL log the result
- **AND** include request_id for correlation
- **AND** include success: boolean
- **AND** include user_id if successful
- **AND** include error_code if failed
- **AND** include confirmation_email_sent: boolean
