# Capability: Security

## ADDED Requirements

### Requirement: Review Code for Security Vulnerabilities
The system SHALL review all code for security vulnerabilities including injection attacks, authentication issues, and data exposure.

#### Scenario: Review code for common vulnerabilities
- **GIVEN** a pull request with code changes
- **WHEN** conducting security review
- **THEN** review SHALL check for SQL injection vulnerabilities (verify parameterized queries)
- **AND** review SHALL check for XSS vulnerabilities (verify output encoding)
- **AND** review SHALL check for authentication bypass
- **AND** review SHALL check for authorization flaws
- **AND** review SHALL check for sensitive data exposure
- **AND** review SHALL check for insecure dependencies

#### Scenario: Verify input validation
- **GIVEN** code accepting user input
- **WHEN** reviewing input handling
- **THEN** ALL user input SHALL be validated
- **AND** validation SHALL use allowlists, not denylists
- **AND** validation SHALL occur server-side (not just client-side)
- **AND** validation errors SHALL not leak sensitive information

#### Scenario: Check for hardcoded secrets
- **GIVEN** code being committed
- **WHEN** reviewing for secrets
- **THEN** code SHALL NOT contain API keys
- **AND** code SHALL NOT contain passwords
- **AND** code SHALL NOT contain tokens
- **AND** code SHALL use environment variables or secret managers
- **AND** commit history SHALL be scanned for accidentally committed secrets

### Requirement: Enforce Secure Coding Practices
The system SHALL ensure code follows secure coding standards including encryption, authentication, and least privilege.

#### Scenario: Verify encryption usage
- **GIVEN** code handling sensitive data
- **WHEN** reviewing encryption
- **THEN** data at rest SHALL be encrypted
- **AND** data in transit SHALL use TLS 1.2 or higher
- **AND** encryption SHALL use approved algorithms (AES-256, RSA-2048+)
- **AND** encryption keys SHALL be managed securely (key rotation, access control)

#### Scenario: Verify authentication implementation
- **GIVEN** API endpoints or protected resources
- **WHEN** reviewing authentication
- **THEN** authentication SHALL be required on ALL protected endpoints
- **AND** authentication SHALL use industry-standard protocols (OAuth 2.0, JWT)
- **AND** passwords SHALL be hashed with bcrypt or Argon2
- **AND** sessions SHALL have appropriate timeouts

#### Scenario: Verify authorization checks
- **GIVEN** code performing actions on behalf of users
- **WHEN** reviewing authorization
- **THEN** authorization SHALL be checked on EVERY request
- **AND** authorization SHALL follow least privilege principle
- **AND** authorization SHALL prevent horizontal privilege escalation
- **AND** authorization SHALL prevent vertical privilege escalation

### Requirement: Audit Security Configurations
The system SHALL audit infrastructure and application configurations for security misconfigurations.

#### Scenario: Review cloud security configuration
- **GIVEN** cloud infrastructure resources
- **WHEN** auditing configuration
- **THEN** S3 buckets SHALL NOT be publicly accessible (unless explicitly intended)
- **AND** security groups SHALL follow least privilege
- **AND** IAM roles SHALL have minimum required permissions
- **AND** encryption SHALL be enabled on all data stores
- **AND** logging SHALL be enabled for audit trails

#### Scenario: Review application security configuration
- **GIVEN** application deployment configuration
- **WHEN** auditing settings
- **THEN** debug mode SHALL be disabled in production
- **AND** error messages SHALL NOT leak sensitive information
- **AND** CORS SHALL be configured restrictively
- **AND** security headers SHALL be set (CSP, HSTS, X-Frame-Options)

### Requirement: Ensure Compliance with Security Standards
The system SHALL ensure compliance with relevant security standards and regulations.

#### Scenario: Assess OWASP Top 10 compliance
- **GIVEN** application code and infrastructure
- **WHEN** reviewing OWASP Top 10
- **THEN** protection SHALL exist for injection attacks
- **AND** authentication SHALL be broken-proof
- **AND** sensitive data SHALL be protected
- **AND** XML external entities SHALL be disabled
- **AND** broken access control SHALL be prevented
- **AND** security misconfiguration SHALL be avoided
- **AND** XSS SHALL be prevented
- **AND** insecure deserialization SHALL be prevented
- **AND** components with known vulnerabilities SHALL be updated
- **AND** logging and monitoring SHALL be sufficient

#### Scenario: Generate compliance report
- **GIVEN** security requirements for a standard (SOC 2, GDPR, HIPAA)
- **WHEN** assessing compliance
- **THEN** compliance percentage SHALL be calculated
- **AND** gaps SHALL be identified with severity
- **AND** remediation steps SHALL be provided
- **AND** evidence SHALL be collected for auditors

### Requirement: Respond to Security Incidents
The system SHALL detect, alert, and provide guidance for security incidents.

#### Scenario: Detect security anomaly
- **GIVEN** application logs and security events
- **WHEN** monitoring for threats
- **THEN** suspicious patterns SHALL be detected (brute force, unusual access patterns)
- **AND** alerts SHALL trigger on critical security events
- **AND** alert SHALL include evidence and context
- **AND** immediate actions SHALL be recommended

#### Scenario: Provide incident response guidance
- **GIVEN** a confirmed security incident
- **WHEN** responding to incident
- **THEN** severity SHALL be assessed (critical, high, medium, low)
- **AND** containment steps SHALL be documented
- **AND** investigation steps SHALL be provided
- **AND** communication plan SHALL be outlined
- **AND** post-incident review SHALL be conducted

### Requirement: Define Security Requirements
The system SHALL define security requirements for new features and architectural changes.

#### Scenario: Review architecture for security
- **GIVEN** a proposed architecture change
- **WHEN** reviewing security implications
- **THEN** threat model SHALL be created
- **AND** attack surface SHALL be analyzed
- **AND** security controls SHALL be recommended
- **AND** risks SHALL be documented with mitigations

#### Scenario: Define security acceptance criteria
- **GIVEN** a new feature being planned
- **WHEN** defining security requirements
- **THEN** authentication requirements SHALL be specified
- **AND** authorization requirements SHALL be specified
- **AND** data protection requirements SHALL be specified
- **AND** security testing requirements SHALL be specified

### Requirement: Train Team on Secure Coding
The system SHALL provide security training and guidance to the engineering team.

#### Scenario: Provide secure coding patterns
- **GIVEN** common security vulnerabilities
- **WHEN** providing guidance to software-engineering
- **THEN** secure coding examples SHALL be provided
- **AND** insecure patterns SHALL be highlighted with explanations
- **AND** best practices SHALL be documented
- **AND** security code review checklist SHALL be maintained

#### Scenario: Conduct security awareness training
- **GIVEN** team members needing security training
- **WHEN** conducting training
- **THEN** OWASP Top 10 SHALL be covered
- **AND** secure SDLC practices SHALL be taught
- **AND** incident response procedures SHALL be explained
- **AND** real-world examples SHALL be used

### Requirement: Collaborate with CI/CD and Logging
The system SHALL integrate security checks in ci-cd pipelines and define security logging requirements for logging-observability.

#### Scenario: Integrate security scans in CI
- **GIVEN** ci-cd pipeline
- **WHEN** integrating security checks
- **THEN** dependency scanning SHALL run on every build
- **AND** SAST (static analysis) SHALL run on code changes
- **AND** container scanning SHALL run on images
- **AND** critical vulnerabilities SHALL block deployments

#### Scenario: Define security logging requirements
- **GIVEN** application logging setup
- **WHEN** working with logging-observability
- **THEN** security events SHALL be logged (authentication, authorization, access)
- **AND** log entries SHALL include user context
- **AND** logs SHALL NOT contain sensitive data
- **AND** security logs SHALL be monitored for anomalies
