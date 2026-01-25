# Capability: Documentation

## ADDED Requirements

### Requirement: Create and Maintain Technical Documentation
The system SHALL create clear, complete, and accurate documentation for features, APIs, and processes.

#### Scenario: Document new feature
- **GIVEN** a new feature being released
- **WHEN** creating documentation
- **THEN** documentation SHALL use standard template (overview, prerequisites, steps, examples, troubleshooting)
- **AND** documentation SHALL include working code examples
- **AND** documentation SHALL include screenshots or diagrams where helpful
- **AND** documentation SHALL explain why, not just how
- **AND** documentation SHALL link to related documentation

#### Scenario: Document API endpoint
- **GIVEN** a new API endpoint from api-design
- **WHEN** creating API documentation
- **THEN** OpenAPI specification SHALL be the source of truth
- **AND** documentation SHALL include description, parameters, responses
- **AND** documentation SHALL include authentication requirements
- **AND** documentation SHALL include code examples in multiple languages
- **AND** documentation SHALL include rate limits and error handling

#### Scenario: Create troubleshooting guide
- **GIVEN** common issues users encounter
- **WHEN** creating troubleshooting documentation
- **THEN** guide SHALL list symptoms clearly
- **AND** guide SHALL provide diagnostic steps
- **AND** guide SHALL provide solutions in order of likelihood
- **AND** guide SHALL include contact information if solutions don't work

### Requirement: Maintain Documentation Quality Standards
The system SHALL ensure documentation follows style guide, has working examples, and remains up-to-date.

#### Scenario: Review documentation for quality
- **GIVEN** documentation being created or updated
- **WHEN** reviewing quality
- **THEN** review SHALL verify structure is complete (all required sections present)
- **AND** review SHALL verify terminology consistency
- **AND** review SHALL verify code examples are tested and working
- **AND** review SHALL verify links are valid
- **AND** review SHALL check readability (sentence length, complexity)

#### Scenario: Enforce style guide
- **GIVEN** documentation being written
- **WHEN** checking against style guide
- **THEN** forbidden phrases SHALL be detected (e.g., "simply", "just", "obviously")
- **AND** passive voice SHALL be minimized
- **AND** sentence length SHALL not exceed 25 words
- **AND** headings SHALL follow hierarchy (H1, H2, H3)
- **AND** consistent terminology SHALL be used

#### Scenario: Test code examples
- **GIVEN** documentation containing code examples
- **WHEN** validating examples
- **THEN** examples SHALL be extracted and tested automatically
- **AND** examples SHALL use realistic data
- **AND** examples SHALL show both success and error cases
- **AND** outdated examples SHALL be flagged

### Requirement: Track Documentation Health
The system SHALL monitor documentation coverage, freshness, and link validity.

#### Scenario: Analyze documentation coverage
- **GIVEN** codebase with features and APIs
- **WHEN** analyzing coverage
- **THEN** coverage SHALL identify undocumented features
- **AND** coverage SHALL identify undocumented API endpoints
- **AND** coverage SHALL identify undocumented error codes
- **AND** coverage gaps SHALL be prioritized by importance

#### Scenario: Check documentation freshness
- **GIVEN** documentation last updated at specific dates
- **WHEN** checking freshness
- **THEN** documentation older than 6 months SHALL be flagged for review
- **AND** documentation for deprecated features SHALL be marked as outdated
- **AND** documentation SHALL be compared against latest code/APIs
- **AND** stale documentation SHALL be reported with recommendations

#### Scenario: Validate documentation links
- **GIVEN** documentation with internal and external links
- **WHEN** validating links
- **THEN** all internal links SHALL be verified
- **AND** all external links SHALL be checked
- **AND** broken links SHALL be reported with location
- **AND** redirect chains SHALL be identified

### Requirement: Create Release Notes
The system SHALL create clear, user-focused release notes for every release.

#### Scenario: Generate release notes from commits
- **GIVEN** commits since last release
- **WHEN** creating release notes
- **THEN** release notes SHALL be categorized (Features, Improvements, Bug Fixes, Breaking Changes)
- **AND** release notes SHALL use user-friendly language (not technical jargon)
- **AND** breaking changes SHALL be highlighted prominently
- **AND** migration guides SHALL be linked for breaking changes

#### Scenario: Document breaking changes
- **GIVEN** a release with breaking changes
- **WHEN** documenting the changes
- **THEN** breaking changes SHALL be listed first
- **AND** impact SHALL be explained clearly
- **AND** migration steps SHALL be provided
- **AND** before/after examples SHALL be shown

### Requirement: Manage Documentation Templates
The system SHALL maintain and provide documentation templates for consistency.

#### Scenario: Provide template for feature documentation
- **GIVEN** a new feature requiring documentation
- **WHEN** providing template
- **THEN** template SHALL include standard sections (Overview, Prerequisites, Configuration, Usage, Examples, Troubleshooting, FAQs)
- **AND** template SHALL include placeholder text explaining what to write
- **AND** template SHALL include examples of good documentation
- **AND** template SHALL be easy to customize

#### Scenario: Create template for runbook
- **GIVEN** operational procedures requiring documentation
- **WHEN** creating runbook template
- **THEN** template SHALL include Purpose, Prerequisites, Steps, Validation, Rollback
- **AND** template SHALL emphasize clarity for on-call engineers
- **AND** template SHALL include emergency contacts
- **AND** template SHALL be tested with sample incident

### Requirement: Support API Documentation
The system SHALL generate and maintain API documentation from OpenAPI specifications.

#### Scenario: Generate API docs from OpenAPI spec
- **GIVEN** OpenAPI specification from api-design
- **WHEN** generating API documentation
- **THEN** documentation SHALL be auto-generated from spec
- **AND** documentation SHALL include interactive API explorer
- **AND** documentation SHALL include authentication guide
- **AND** documentation SHALL include rate limit information
- **AND** documentation SHALL include error code reference

#### Scenario: Add prose documentation to API docs
- **GIVEN** auto-generated API documentation
- **WHEN** adding context
- **THEN** getting started guide SHALL be added
- **AND** common use cases SHALL be documented
- **AND** authentication flow SHALL be explained
- **AND** pagination and filtering SHALL be explained

### Requirement: Collaborate with All Agents
The system SHALL document outputs and processes from all other capabilities.

#### Scenario: Document deployment process from ci-cd
- **GIVEN** deployment pipeline from ci-cd
- **WHEN** creating documentation
- **THEN** documentation SHALL explain deployment workflow
- **AND** documentation SHALL include rollback procedures
- **AND** documentation SHALL document approval process
- **AND** documentation SHALL include troubleshooting for common deployment issues

#### Scenario: Document security procedures from security
- **GIVEN** security policies and procedures
- **WHEN** creating documentation
- **THEN** secure coding practices SHALL be documented
- **AND** incident response procedures SHALL be documented
- **AND** security review checklist SHALL be documented
- **AND** compliance requirements SHALL be documented

#### Scenario: Capture logging conventions from logging-observability
- **GIVEN** logging standards and practices
- **WHEN** documenting logging
- **THEN** log levels SHALL be explained
- **AND** structured logging format SHALL be documented
- **AND** correlation ID usage SHALL be explained
- **AND** PII redaction rules SHALL be documented
