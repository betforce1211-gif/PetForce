## ADDED Requirements

### Requirement: Registration Flow Testing
The system SHALL have comprehensive tests validating the complete registration and email confirmation flow.

#### Scenario: Test user creation in database
- **WHEN** running registration tests
- **THEN** tests SHALL verify user record exists in database after registration
- **AND** verify user has a valid user_id
- **AND** verify user email matches registration email
- **AND** verify user metadata (first_name, last_name) is stored correctly

#### Scenario: Test email confirmation state
- **WHEN** running registration tests
- **THEN** tests SHALL verify user is marked as unconfirmed initially
- **AND** verify email_confirmed_at is NULL after registration
- **AND** verify confirmation_sent_at is populated
- **AND** verify confirmation token is generated

#### Scenario: Test login before confirmation
- **WHEN** running authentication tests
- **THEN** tests SHALL verify login fails for unconfirmed users
- **AND** verify error code is "EMAIL_NOT_CONFIRMED"
- **AND** verify error message is user-friendly
- **AND** verify response includes resend_verification_url

#### Scenario: Test resend confirmation email
- **WHEN** running confirmation tests
- **THEN** tests SHALL verify resend endpoint works
- **AND** verify rate limiting (max 3 per hour)
- **AND** verify new confirmation token is generated
- **AND** verify old token is invalidated

#### Scenario: Test email confirmation flow
- **WHEN** running integration tests
- **THEN** tests SHALL verify clicking confirmation link marks user as confirmed
- **AND** verify email_confirmed_at is set to current timestamp
- **AND** verify user can login after confirmation
- **AND** verify confirmation token is invalidated after use

#### Scenario: Test full registration to login flow
- **WHEN** running end-to-end tests
- **THEN** tests SHALL verify complete flow: register → confirm email → login
- **AND** verify each step logs appropriate events
- **AND** verify metrics are emitted at each step
- **AND** verify user ends up authenticated with valid session

### Requirement: Database Persistence Validation
The system SHALL validate that all user data persists correctly to the database.

#### Scenario: Verify user queryable after registration
- **WHEN** testing user persistence
- **THEN** tests SHALL query user by ID immediately after registration
- **AND** verify user record is returned
- **AND** verify user can be queried by email
- **AND** verify user metadata matches registration data

#### Scenario: Verify state transitions persist
- **WHEN** testing state changes (unconfirmed → confirmed)
- **THEN** tests SHALL verify state persists after each transition
- **AND** verify timestamps are accurate
- **AND** verify queries reflect current state
- **AND** verify state cannot regress (confirmed → unconfirmed)

### Requirement: Logging Validation Testing
The system SHALL validate that all authentication events are logged correctly.

#### Scenario: Test registration logging
- **WHEN** testing registration flow
- **THEN** tests SHALL verify registration attempt is logged
- **AND** verify log includes request_id
- **AND** verify registration result is logged (success/failure)
- **AND** verify email sent event is logged
- **AND** verify all logs use same request_id

#### Scenario: Test log correlation
- **WHEN** testing logging system
- **THEN** tests SHALL verify request_id is generated
- **AND** verify request_id is included in all related logs
- **AND** verify logs can be queried by request_id
- **AND** verify log entries are in chronological order

#### Scenario: Test metrics emission
- **WHEN** testing authentication events
- **THEN** tests SHALL verify metrics are emitted
- **AND** verify metric names match specification
- **AND** verify metric values are accurate
- **AND** verify metric dimensions (tags) are included

### Requirement: Error Scenario Testing
The system SHALL have tests covering all error scenarios in the registration flow.

#### Scenario: Test duplicate email registration
- **WHEN** testing error handling
- **THEN** tests SHALL verify duplicate email returns appropriate error
- **AND** verify error code is "EMAIL_IN_USE"
- **AND** verify error is logged
- **AND** verify metric registration_failed is incremented with error_code tag

#### Scenario: Test weak password rejection
- **WHEN** testing password validation
- **THEN** tests SHALL verify weak passwords are rejected
- **AND** verify error code is "WEAK_PASSWORD"
- **AND** verify error message explains requirements
- **AND** verify registration_failed metric is emitted

#### Scenario: Test network failures
- **WHEN** testing resilience
- **THEN** tests SHALL simulate Supabase API failures
- **AND** verify appropriate error is returned
- **AND** verify error is logged with full context
- **AND** verify retry logic (if applicable)

### Requirement: Test Coverage Requirements
The system SHALL maintain minimum test coverage for authentication code.

#### Scenario: Minimum coverage thresholds
- **WHEN** running test suite
- **THEN** authentication module SHALL have >90% line coverage
- **AND** critical paths (register, login) SHALL have 100% branch coverage
- **AND** error handling SHALL have 100% coverage
- **AND** logging code SHALL have >85% coverage

#### Scenario: Integration test requirements
- **WHEN** validating test suite completeness
- **THEN** tests SHALL include at least 3 integration tests
- **AND** integration tests SHALL test full user journeys
- **AND** integration tests SHALL use real database (test instance)
- **AND** integration tests SHALL verify database state at each step
