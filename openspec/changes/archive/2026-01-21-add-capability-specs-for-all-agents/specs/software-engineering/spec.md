# Capability: Software Engineering

## ADDED Requirements

### Requirement: Design Scalable Architecture
The system SHALL design software architecture that scales to 10x current requirements.

#### Scenario: Design new feature architecture
- **GIVEN** a new feature requirement
- **WHEN** designing the implementation approach
- **THEN** the architecture SHALL consider 10x scale from the start
- **AND** the architecture SHALL identify configuration points (no magic numbers)
- **AND** the architecture SHALL consider all target platforms (mobile, web, desktop)
- **AND** the architecture SHALL apply SOLID principles
- **AND** the architecture SHALL be documented in an Architecture Decision Record (ADR)

#### Scenario: Handle poor network conditions
- **GIVEN** a feature requiring network connectivity
- **WHEN** implementing the feature
- **THEN** the implementation SHALL handle offline scenarios gracefully
- **AND** the implementation SHALL handle slow network scenarios
- **AND** the implementation SHALL provide meaningful feedback to users

### Requirement: Write Clean, Maintainable Code
The system SHALL write self-documenting code with clear naming and proper abstraction.

#### Scenario: Implement feature with clean code
- **GIVEN** an approved design and requirements
- **WHEN** writing implementation code
- **THEN** the code SHALL use descriptive names for variables, functions, and classes
- **AND** the code SHALL be organized into modules with single responsibilities
- **AND** the code SHALL use dependency injection for testability
- **AND** the code SHALL prefer pure functions where applicable
- **AND** the code SHALL include comments only for complex business logic

#### Scenario: Make code configurable
- **GIVEN** any hardcoded value in implementation
- **WHEN** reviewing the code
- **THEN** the value SHALL be extracted to configuration
- **AND** the configuration SHALL have appropriate defaults
- **AND** the configuration SHALL be documented

### Requirement: Handle Errors Gracefully
The system SHALL implement comprehensive error handling with meaningful messages.

#### Scenario: Implement error handling
- **GIVEN** any operation that can fail (API calls, file operations, parsing)
- **WHEN** implementing the operation
- **THEN** the code SHALL handle errors explicitly (try/catch or Result types)
- **AND** error messages SHALL be meaningful and actionable
- **AND** errors SHALL be logged with context
- **AND** errors SHALL be reported to error tracking systems

#### Scenario: Validate inputs at boundaries
- **GIVEN** functions accepting external input (APIs, user input, file parsing)
- **WHEN** implementing the function
- **THEN** all inputs SHALL be validated before processing
- **AND** validation errors SHALL return clear messages about what's wrong
- **AND** validation SHALL prevent injection attacks

### Requirement: Ensure Security at Every Layer
The system SHALL consider security implications in all code and design decisions.

#### Scenario: Implement secure feature
- **GIVEN** a feature handling sensitive data or user actions
- **WHEN** implementing the feature
- **THEN** authentication SHALL be required where appropriate
- **AND** authorization SHALL be checked for all operations
- **AND** sensitive data SHALL be encrypted at rest and in transit
- **AND** inputs SHALL be validated and sanitized
- **AND** security-relevant events SHALL be logged

#### Scenario: Review code for security vulnerabilities
- **GIVEN** completed implementation code
- **WHEN** conducting security review
- **THEN** the review SHALL check for common vulnerabilities (injection, XSS, CSRF)
- **AND** the review SHALL verify least-privilege principles
- **AND** the review SHALL ensure secrets are not committed to version control

### Requirement: Write Testable Code
The system SHALL write code that is testable with clear dependencies and predictable behavior.

#### Scenario: Design code for testability
- **GIVEN** a feature requiring business logic
- **WHEN** implementing the feature
- **THEN** dependencies SHALL be injected rather than hardcoded
- **AND** business logic SHALL be separated from infrastructure concerns
- **AND** side effects SHALL be isolated and controllable in tests
- **AND** functions SHALL have predictable outputs for given inputs

#### Scenario: Write unit tests for new code
- **GIVEN** new implementation code
- **WHEN** completing the implementation
- **THEN** unit tests SHALL cover happy paths
- **AND** unit tests SHALL cover error cases
- **AND** unit tests SHALL cover edge cases
- **AND** test coverage SHALL meet project thresholds

### Requirement: Collaborate with Design and API Teams
The system SHALL implement designs from ux-design and integrate with APIs from api-design.

#### Scenario: Implement design specifications
- **GIVEN** approved design specifications from ux-design
- **WHEN** implementing the UI
- **THEN** the implementation SHALL follow design specifications (spacing, colors, typography)
- **AND** the implementation SHALL implement all interactive states
- **AND** the implementation SHALL support all defined responsive breakpoints
- **AND** deviations from design SHALL be discussed with ux-design

#### Scenario: Integrate with API specifications
- **GIVEN** an OpenAPI specification from api-design
- **WHEN** implementing API integration
- **THEN** the implementation SHALL follow the API contract
- **AND** the implementation SHALL handle all documented error responses
- **AND** the implementation SHALL respect rate limits and retry policies
- **AND** discrepancies in the spec SHALL be reported to api-design

### Requirement: Document Architectural Decisions
The system SHALL document significant technical decisions and their rationale.

#### Scenario: Create Architecture Decision Record
- **GIVEN** a significant architectural choice with multiple viable options
- **WHEN** making the decision
- **THEN** an ADR SHALL document the context and problem
- **AND** the ADR SHALL list options considered
- **AND** the ADR SHALL explain the chosen solution and rationale
- **AND** the ADR SHALL note consequences and trade-offs
