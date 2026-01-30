# PetForce API Design Skill

> API design patterns, standards, and templates for PetForce product APIs

## When to Use This Skill

Use this skill when:
- Designing new REST or GraphQL APIs
- Reviewing API endpoints for consistency and standards
- Creating OpenAPI specifications
- Designing webhook systems
- Planning API versioning strategies
- Defining error handling patterns
- Implementing authentication and rate limiting

## Core API Design Principles

### Resource-Oriented Design
- Resources are nouns, not verbs (e.g., `/users` not `/getUsers`)
- Use proper HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Maintain logical URL hierarchies (`/users/{id}/orders/{orderId}`)

### Error Handling Standards
- Return consistent error format across all endpoints
- Include error code, message, and request_id
- Provide field-level validation errors
- Use appropriate HTTP status codes (2xx, 4xx, 5xx)

### API Versioning
- Version from day one (e.g., `/v1/`)
- Use URL path versioning for clarity
- Support N-1 version minimum during deprecation
- Increment version only for breaking changes

## REST API Patterns

### Standard HTTP Methods
```
GET     → Read (safe, idempotent, cacheable)
POST    → Create (not idempotent)
PUT     → Replace entire resource (idempotent)
PATCH   → Partial update (idempotent)
DELETE  → Remove (idempotent)
```

### HTTP Status Codes
```
SUCCESS:
200 OK           → General success
201 Created      → Resource created (include Location header)
202 Accepted     → Async processing started
204 No Content   → Success, no response body

CLIENT ERROR:
400 Bad Request  → Malformed request
401 Unauthorized → Auth required/failed
403 Forbidden    → Not allowed
404 Not Found    → Doesn't exist
409 Conflict     → State conflict
422 Unprocessable→ Validation failed
429 Too Many     → Rate limited

SERVER ERROR:
500 Internal     → Unexpected error
502 Bad Gateway  → Upstream failed
503 Unavailable  → Temporarily down
```

### Standard Endpoint Structure
```
Collection Operations:
GET    /v1/resources              # List resources (paginated)
POST   /v1/resources              # Create resource

Single Resource Operations:
GET    /v1/resources/{id}         # Get single resource
PATCH  /v1/resources/{id}         # Update resource
DELETE /v1/resources/{id}         # Delete resource

Resource Actions:
POST   /v1/resources/{id}/action  # State transition or action
```

## Error Response Format

### Standard Error Structure
```json
{
  "error": {
    "code": "validation_error",
    "message": "Human readable message",
    "request_id": "req_abc123",
    "documentation_url": "https://docs.example.com/errors/validation_error"
  }
}
```

### Validation Error Structure
```json
{
  "error": {
    "code": "validation_error",
    "message": "Validation failed",
    "request_id": "req_abc123",
    "fields": [
      {
        "field": "email",
        "message": "Must be a valid email address",
        "code": "invalid_format"
      },
      {
        "field": "age",
        "message": "Must be at least 18",
        "code": "min_value"
      }
    ]
  }
}
```

### Error Code Catalog
```
AUTHENTICATION (401):
- unauthorized          → No/invalid credentials
- token_expired         → Token has expired
- invalid_api_key       → API key is invalid

AUTHORIZATION (403):
- forbidden             → Not allowed to access
- insufficient_scope    → Token lacks required scope

VALIDATION (422):
- validation_error      → General validation failure
- invalid_format        → Wrong format
- required_field        → Required field missing
- min_value / max_value → Range violations
- min_length / max_length → Length violations

CONFLICT (409):
- duplicate             → Resource already exists
- version_conflict      → Optimistic lock failed
- state_conflict        → Invalid state transition

RATE LIMITING (429):
- rate_limited          → Too many requests
- quota_exceeded        → API quota exceeded
```

## Pagination

### Cursor-Based (Recommended)
```
Request:  GET /users?limit=20&cursor=eyJpZCI6MTIzfQ

Response:
{
  "data": [...],
  "meta": {
    "has_more": true,
    "next_cursor": "eyJpZCI6MTQzfQ",
    "prev_cursor": "eyJpZCI6MTIzfQ"
  }
}

✅ Consistent with writes
✅ Performant at any depth
✅ Works with real-time data
```

### Offset-Based
```
Request:  GET /users?page=2&limit=20

Response:
{
  "data": [...],
  "meta": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}

✅ Easy to implement
✅ Jump to any page
❌ Inconsistent with concurrent writes
```

## Rate Limiting

### Required Headers
```
X-RateLimit-Limit: 1000        # Max requests in window
X-RateLimit-Remaining: 950     # Requests left
X-RateLimit-Reset: 1704067200  # Window reset (Unix timestamp)
Retry-After: 60                # Seconds until retry (on 429)
```

### Tiered Limits Example
```
Free:       100/hour,    burst: 10
Basic:      1,000/hour,  burst: 50
Pro:        10,000/hour, burst: 200
Enterprise: Custom,      burst: 500
```

## Authentication Methods

### API Keys (Server-to-Server)
```
Header: X-API-Key: sk_live_abc123xyz

Prefixes:
- sk_live_  → Production
- sk_test_  → Development
```

### Bearer Tokens (User Authentication)
```
Header: Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

JWT Structure:
{
  "sub": "user_123",
  "iat": 1704067200,
  "exp": 1704153600,
  "scope": "read write",
  "aud": "api.example.com"
}
```

## Webhook Design

### Webhook Payload Structure
```json
{
  "id": "evt_abc123",
  "type": "order.completed",
  "api_version": "2024-01-01",
  "created_at": "2024-01-15T10:30:00Z",
  "data": {
    "object": {
      "id": "ord_xyz789",
      "status": "completed",
      ...
    },
    "previous_attributes": {
      "status": "pending"
    }
  }
}
```

### Required Headers
```
Content-Type: application/json
X-Webhook-Signature: sha256=abc123...
X-Webhook-Timestamp: 1704067200
X-Webhook-ID: wh_evt_123
```

### Signature Verification
```
timestamp = current_unix_time()
payload = timestamp + "." + body
signature = HMAC-SHA256(payload, secret)
```

### Retry Policy
```
Attempt 1: Immediate
Attempt 2: 5 minutes
Attempt 3: 30 minutes
Attempt 4: 2 hours
Attempt 5: 24 hours
```

### Event Naming Convention
```
Resource.Action format:
- user.created
- user.updated
- user.deleted
- order.created
- order.completed
- order.cancelled
- payment.succeeded
- payment.failed
```

## API Design Checklist

### RESTful Design
- [ ] Resources use nouns, not verbs
- [ ] Proper HTTP methods used
- [ ] Appropriate HTTP status codes returned
- [ ] URL structure is logical and hierarchical

### Error Handling
- [ ] Consistent error format across all endpoints
- [ ] Errors include code, message, and request_id
- [ ] Field-level validation errors specified
- [ ] Rate limit headers included

### Versioning & Documentation
- [ ] API versioned from day one (/v1/)
- [ ] Every endpoint documented in OpenAPI spec
- [ ] Breaking changes require version increment
- [ ] Backwards compatibility maintained

### Pagination & Performance
- [ ] Pagination implemented for collections
- [ ] Default and maximum limits enforced
- [ ] Response includes pagination metadata
- [ ] Large payloads handled efficiently

### Security & Validation
- [ ] All inputs validated
- [ ] Authentication required on sensitive endpoints
- [ ] Authorization checked for resource access
- [ ] Webhooks signed cryptographically
- [ ] Idempotency considered for mutations

## OpenAPI Specification Template

See `axel-api-agent/templates/openapi.yaml.template` for complete OpenAPI 3.1 specification template including:
- Standard endpoints (GET, POST, PATCH, DELETE)
- Pagination parameters
- Error schemas
- Authentication schemes
- Rate limiting headers
- Validation error format

## Webhook Payload Template

See `axel-api-agent/templates/webhook-payload.json.template` for webhook design including:
- Payload structure
- Signature verification
- Event types
- Retry policy
- Code examples

## API Versioning Strategy

### When to Increment Version
```
INCREMENT for:
• Removing fields
• Changing field types
• Removing endpoints
• Changing error formats

DON'T INCREMENT for:
• Adding new endpoints
• Adding optional fields
• Adding enum values
```

### Deprecation Process
```
1. Announce deprecation 90+ days in advance
2. Add Sunset header to deprecated version
3. Email API consumers with migration guide
4. Support N-1 version during transition
5. Sunset old version after notice period
```

## GraphQL Patterns

### Schema Design Best Practices
- Types: PascalCase (User, OrderItem)
- Fields: camelCase (firstName, createdAt)
- Enums: SCREAMING_SNAKE (PENDING, IN_PROGRESS)
- Inputs: PascalCase + Input suffix
- Payloads: PascalCase + Payload suffix

### Mutation Payloads
```graphql
type CreateOrderPayload {
  order: Order
  errors: [UserError!]!
}

type UserError {
  field: String
  message: String!
  code: String!
}
```

### Relay-Style Pagination
```graphql
type OrderConnection {
  edges: [OrderEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
```

## Tools & Commands

### OpenAPI Generation
```bash
axel openapi generate --output api.yaml
axel openapi validate api.yaml
```

### SDK Generation
```bash
axel sdk generate --spec api.yaml --lang typescript --output sdk/
```

### Breaking Change Detection
```bash
axel diff api-v1.yaml api-v2.yaml
```

### Security Audit
```bash
axel security audit --spec api.yaml
```

## Integration Points

### With Backend Engineering
- Provide OpenAPI spec as implementation contract
- Define validation rules and error handling
- Specify authentication and authorization requirements

### With Mobile Development
- Design cursor pagination for offline stability
- Support sparse fieldsets for bandwidth optimization
- Provide batch operations to reduce requests

### With Security
- Define authentication methods and flows
- Specify authorization rules per endpoint
- Design webhook signature verification
- Plan audit logging requirements

### With Documentation
- OpenAPI spec as source of truth
- Generate interactive API docs (Redoc/Swagger UI)
- Provide code examples in multiple languages
- Maintain changelog and migration guides

### With CI/CD
- Contract tests against OpenAPI spec
- Automated breaking change detection
- SDK generation on release
- API versioning automation

## Product Philosophy

**Core Principle**: "Pets are part of the family, so let's take care of them as simply as we can."

For API design, this means:
1. **Simple, intuitive endpoints** - Developers shouldn't need a PhD to integrate. Resource-oriented design makes it obvious.
2. **Privacy-first architecture** - Family data (pet health, home addresses, vet records) must be protected with proper auth, rate limits, and audit logs.
3. **Prevent misuse proactively** - Validation, idempotency, and clear error messages prevent developers from accidentally corrupting pet records.
4. **Developer empathy** - Great docs, consistent patterns, and backwards compatibility mean developers can focus on serving pet families, not fighting our API.
