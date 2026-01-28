# API Design Specification Delta

## ADDED Requirements

### Requirement: Design Idempotency Support for APIs
The system SHALL support idempotency keys to prevent duplicate operations when requests are retried.

#### Scenario: Accept optional idempotency key
- **GIVEN** any mutation endpoint (POST, PUT, PATCH, DELETE)
- **WHEN** designing the API
- **THEN** the endpoint SHALL accept an optional `Idempotency-Key` header
- **AND** the header value SHALL be a valid UUID v4 format
- **AND** invalid formats SHALL return 400 Bad Request with clear error message
- **AND** the endpoint SHALL work without idempotency key (backward compatible)

#### Scenario: Prevent duplicate operations
- **GIVEN** a mutation request with an idempotency key
- **WHEN** the same key is used with the same request body
- **THEN** the API SHALL return the cached response from the first request
- **AND** the response SHALL include `X-Idempotent-Replayed: true` header
- **AND** no duplicate operation SHALL be performed
- **AND** the cached result SHALL be stored for 24 hours

#### Scenario: Detect idempotency conflicts
- **GIVEN** a mutation request with an idempotency key
- **WHEN** the same key is used with a different request body
- **THEN** the API SHALL return 409 Conflict
- **AND** the error SHALL include error code `idempotency_conflict`
- **AND** the error message SHALL clearly explain the conflict
- **AND** the error SHALL include the idempotency key in details

#### Scenario: Expire idempotency keys
- **GIVEN** an idempotency key that was used 24+ hours ago
- **WHEN** the same key is reused
- **THEN** the API SHALL process the request as new (not replayed)
- **AND** a new result SHALL be cached with fresh 24-hour TTL
- **AND** no conflict SHALL be raised for expired keys

#### Scenario: Namespace keys per endpoint
- **GIVEN** the same idempotency key used for different endpoints
- **WHEN** processing the requests
- **THEN** each endpoint SHALL maintain separate idempotency records
- **AND** keys SHALL be namespaced by endpoint path
- **AND** using the same key for `/auth/register` and `/auth/login` SHALL NOT conflict

#### Scenario: Handle storage failures gracefully
- **GIVEN** the idempotency storage layer (Redis) is unavailable
- **WHEN** processing a request with an idempotency key
- **THEN** the API SHALL log a warning about idempotency unavailable
- **AND** the API SHALL process the request normally (no idempotency protection)
- **AND** the API SHALL NOT fail the request due to storage unavailability
- **AND** monitoring SHALL alert on idempotency storage failures

### Requirement: Document Idempotency Patterns
The system SHALL provide clear documentation and examples for using idempotency keys.

#### Scenario: Document idempotency in OpenAPI spec
- **GIVEN** a mutation endpoint with idempotency support
- **WHEN** creating the OpenAPI specification
- **THEN** the `Idempotency-Key` header SHALL be documented as optional parameter
- **AND** the header description SHALL explain idempotency behavior
- **AND** the spec SHALL include 409 response for idempotency conflicts
- **AND** the spec SHALL document `X-Idempotent-Replayed` response header

#### Scenario: Provide code examples
- **GIVEN** API documentation for idempotency
- **WHEN** developers read the documentation
- **THEN** examples SHALL show how to generate UUID v4 idempotency keys
- **AND** examples SHALL demonstrate retry scenarios with same key
- **AND** examples SHALL show conflict handling (409 response)
- **AND** examples SHALL be provided for TypeScript and Swift (mobile)

### Requirement: Monitor Idempotency Effectiveness
The system SHALL track metrics to measure idempotency adoption and duplicate prevention.

#### Scenario: Track idempotency usage
- **GIVEN** mutation endpoints with idempotency support
- **WHEN** requests are processed
- **THEN** metrics SHALL track percentage of requests with idempotency keys
- **AND** metrics SHALL track number of duplicate requests prevented
- **AND** metrics SHALL track number of idempotency conflicts (409s)
- **AND** metrics SHALL track idempotency storage hit rate

#### Scenario: Alert on idempotency issues
- **GIVEN** idempotency storage layer
- **WHEN** storage failures occur
- **THEN** alerts SHALL notify engineering team within 5 minutes
- **AND** alerts SHALL include affected endpoints and error rate
- **AND** dashboards SHALL show idempotency health status

## MODIFIED Requirements

### Requirement: API Design SHALL provide API quality checklist

API Design SHALL provide a quality review checklist to ensure API design standards are met before features proceed through stage gates.

#### Scenario: Complete API Design quality checklist
- **GIVEN** a feature with API changes ready for review
- **WHEN** API Design evaluates the API
- **THEN** all checklist items SHALL be evaluated as Yes, No, or N/A
- **AND** "No" items SHALL be documented with recommendations
- **AND** N/A items SHALL include justification (e.g., "No API changes in this feature")
- **AND** checklist SHALL be signed, dated, and attached to release notes

**API Design Quality Checklist (v2.0)**:

1. **RESTful Principles**: API follows REST conventions (proper HTTP methods, status codes)
2. **Resource Naming**: Resource names are nouns, plural, lowercase, hyphen-separated
3. **Versioning Strategy**: API versioning strategy followed (/v1/, /v2/, etc.)
4. **Request Validation**: Request payloads validated, clear error messages for validation failures
5. **Response Format**: Consistent response format (JSON), proper content-type headers
6. **Error Handling**: Errors return proper HTTP status codes and structured error responses
7. **Pagination**: List endpoints support pagination (limit, offset or cursor-based)
8. **Filtering/Sorting**: List endpoints support filtering and sorting where appropriate
9. **Rate Limiting**: Rate limits documented, headers included (X-RateLimit-*)
10. **Authentication**: Authentication requirements documented and consistent
11. **Backwards Compatibility**: Changes are backwards compatible or breaking changes documented
12. **API Documentation**: OpenAPI/Swagger spec generated and up-to-date
13. **CORS Configuration**: CORS headers properly configured for allowed origins
14. **Idempotency Support**: Mutation endpoints support optional idempotency keys (Idempotency-Key header)

**Approval Options**:
- [ ] Approved
- [ ] Approved with Notes
- [ ] Concerns Raised (API design issues may cause integration problems)

**Notes**: _____________________________________________________________________________

**Reviewer**: Axel (API Design)
**Date**: _________________
**Checklist Version**: 2.0
**Signature**: _________________
