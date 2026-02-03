# PetForce API Design Guide

Comprehensive guide to designing, building, and maintaining production-quality APIs for PetForce.

## Axel's API Design Philosophy

**Core Principles:**

1. **Developer Experience First** - APIs are products for developers; optimize for their happiness
2. **Consistent & Predictable** - Consistency reduces cognitive load and bugs
3. **Well-Documented** - Code is temporary, good docs are forever
4. **Evolvable** - Design for change; versioning is not optional
5. **Secure by Default** - Security is not a feature; it's a requirement
6. **Performance-Aware** - Every millisecond matters at scale
7. **Observable** - You can't fix what you can't measure

---

## Quick Start

### Creating a New Endpoint

```typescript
// packages/api/src/routes/pets.ts
import { Router } from "express";
import { validateRequest, authenticate } from "../middleware";
import { createPetSchema } from "../schemas";

const router = Router();

/**
 * @openapi
 * /api/v1/pets:
 *   post:
 *     summary: Create a new pet
 *     tags: [Pets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePetRequest'
 *     responses:
 *       201:
 *         description: Pet created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pet'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post(
  "/pets",
  authenticate,
  validateRequest(createPetSchema),
  async (req, res) => {
    const pet = await createPet(req.body, req.user.id);

    res.status(201).json({
      success: true,
      data: pet,
    });
  },
);

export default router;
```

---

## Documentation Structure

### Core Guidelines

1. [**REST API Principles**](#rest-api-principles) - RESTful design best practices
2. [**URL Design**](#url-design) - Resource naming and structure
3. [**HTTP Methods**](#http-methods) - Proper use of GET, POST, PUT, DELETE, PATCH
4. [**Request/Response Patterns**](#request-response-patterns) - Standard formats
5. [**Error Handling**](#error-handling) - Consistent error responses
6. [**Versioning**](#versioning) - API versioning strategies
7. [**Authentication & Authorization**](#authentication-authorization) - Securing APIs
8. [**Pagination**](#pagination) - Handling large result sets
9. [**Rate Limiting**](#rate-limiting) - Protecting API resources
10. [**Documentation**](#documentation) - OpenAPI/Swagger

---

## REST API Principles

### Resource-Oriented Design

APIs should be designed around resources (nouns), not actions (verbs).

✅ **Good:**

```
GET    /api/v1/pets          # List pets
POST   /api/v1/pets          # Create pet
GET    /api/v1/pets/123      # Get specific pet
PUT    /api/v1/pets/123      # Update pet (full)
PATCH  /api/v1/pets/123      # Update pet (partial)
DELETE /api/v1/pets/123      # Delete pet
```

❌ **Bad:**

```
POST   /api/v1/getPets
POST   /api/v1/createPet
POST   /api/v1/updatePet
POST   /api/v1/deletePet
```

### Resource Relationships

Express relationships through URL structure:

```
GET /api/v1/households/123/members        # Members of household 123
GET /api/v1/households/123/pets           # Pets in household 123
GET /api/v1/pets/456/medical-records      # Medical records for pet 456
```

---

## URL Design

### Naming Conventions

1. **Use lowercase** - `/api/v1/pets`, not `/api/v1/Pets`
2. **Use hyphens** - `/medical-records`, not `/medicalRecords` or `/medical_records`
3. **Plural resource names** - `/pets`, not `/pet`
4. **No trailing slashes** - `/pets`, not `/pets/`
5. **Keep URLs short** - Avoid deeply nested paths

### URL Structure

```
https://api.petforce.com/v1/households/123/pets
└─────┬─────────────┘  └┬┘ └──────┬──────┘ └─┬─┘
    Domain           Version  Resource    Resource
```

**Best Practices:**

- **Max 3 levels deep**: `/resource/id/sub-resource`
- **Version in URL**: `/v1/`, `/v2/` (not query param)
- **No file extensions**: `/pets`, not `/pets.json`

---

## HTTP Methods

### GET - Retrieve Resources

- **Purpose**: Retrieve data, never modify
- **Idempotent**: Yes (multiple calls = same result)
- **Cached**: Yes (by default)

```typescript
// List resources
GET /api/v1/pets
Response: 200 OK
{
  "success": true,
  "data": [
    { "id": "pet_123", "name": "Fluffy" },
    { "id": "pet_456", "name": "Rex" }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 47,
    "totalPages": 3
  }
}

// Get single resource
GET /api/v1/pets/pet_123
Response: 200 OK
{
  "success": true,
  "data": { "id": "pet_123", "name": "Fluffy", "type": "cat" }
}
```

### POST - Create Resources

- **Purpose**: Create new resource
- **Idempotent**: No (each call creates new resource)
- **Response**: 201 Created with `Location` header

```typescript
POST /api/v1/pets
Body: { "name": "Fluffy", "type": "cat" }

Response: 201 Created
Location: /api/v1/pets/pet_789
{
  "success": true,
  "data": {
    "id": "pet_789",
    "name": "Fluffy",
    "type": "cat",
    "createdAt": "2026-01-28T10:30:00Z"
  }
}
```

### PUT - Full Update

- **Purpose**: Replace entire resource
- **Idempotent**: Yes
- **Requires**: All fields (missing fields = deleted)

```typescript
PUT /api/v1/pets/pet_123
Body: {
  "name": "Fluffy",
  "type": "cat",
  "breed": "Persian",
  "age": 3
}

Response: 200 OK
{
  "success": true,
  "data": { /* updated pet */ }
}
```

### PATCH - Partial Update

- **Purpose**: Update specific fields
- **Idempotent**: Yes
- **Flexible**: Only include fields to update

```typescript
PATCH /api/v1/pets/pet_123
Body: { "age": 4 }

Response: 200 OK
{
  "success": true,
  "data": { "id": "pet_123", "age": 4, /* other fields unchanged */ }
}
```

### DELETE - Remove Resources

- **Purpose**: Delete resource
- **Idempotent**: Yes (deleting twice = same result)
- **Response**: 204 No Content (no body) or 200 OK (with body)

```typescript
DELETE /api/v1/pets/pet_123

Response: 204 No Content
// OR
Response: 200 OK
{
  "success": true,
  "message": "Pet deleted successfully"
}
```

---

## Request/Response Patterns

### Standard Response Format

```typescript
// Success response
{
  "success": true,
  "data": { /* resource or list */ },
  "meta"?: { /* optional metadata */ }
}

// Error response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  }
}
```

### HTTP Status Codes

| Code | Meaning               | Use Case                             |
| ---- | --------------------- | ------------------------------------ |
| 200  | OK                    | Successful GET, PUT, PATCH, DELETE   |
| 201  | Created               | Successful POST (resource created)   |
| 204  | No Content            | Successful DELETE (no response body) |
| 400  | Bad Request           | Invalid request body/params          |
| 401  | Unauthorized          | Missing or invalid authentication    |
| 403  | Forbidden             | Authenticated but no permission      |
| 404  | Not Found             | Resource doesn't exist               |
| 409  | Conflict              | Resource conflict (duplicate, etc.)  |
| 422  | Unprocessable Entity  | Validation failed                    |
| 429  | Too Many Requests     | Rate limit exceeded                  |
| 500  | Internal Server Error | Server error (generic)               |
| 503  | Service Unavailable   | Service down or overloaded           |

---

## Error Handling

### Consistent Error Format

```typescript
interface ApiError {
  success: false;
  error: {
    code: string; // Machine-readable error code
    message: string; // Human-readable message
    details?: Array<{
      // Field-specific errors
      field: string;
      message: string;
    }>;
    requestId?: string; // For support/debugging
    timestamp?: string; // When error occurred
  };
}
```

### Example Error Responses

**Validation Error (422):**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      },
      {
        "field": "password",
        "message": "Password must be at least 8 characters"
      }
    ],
    "requestId": "req_abc123"
  }
}
```

**Authorization Error (403):**

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to access this household",
    "requestId": "req_xyz789"
  }
}
```

**Not Found (404):**

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Pet with ID 'pet_123' not found",
    "requestId": "req_def456"
  }
}
```

---

## Versioning

### URL-Based Versioning (Recommended)

```
https://api.petforce.com/v1/pets
https://api.petforce.com/v2/pets
```

**Pros:**

- Clear and explicit
- Easy to route
- Cacheable

**Cons:**

- URL changes between versions

### When to Version

1. **Breaking changes** - Field removal, type changes, required fields
2. **Major behavior changes** - Different logic/algorithms
3. **Security updates** - If they break compatibility

**Don't version for:**

- Adding optional fields
- New endpoints
- Bug fixes
- Performance improvements

---

## Authentication & Authorization

### Bearer Token (JWT)

```typescript
// Request
GET /api/v1/pets
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Middleware
async function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token'
      }
    });
  }
}
```

### Resource-Based Authorization

```typescript
// Check if user has access to household
async function authorizeHousehold(req, res, next) {
  const { householdId } = req.params;
  const userId = req.user.id;

  const isMember = await checkHouseholdMembership(householdId, userId);

  if (!isMember) {
    return res.status(403).json({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "You are not a member of this household",
      },
    });
  }

  next();
}

// Usage
router.get(
  "/households/:householdId/pets",
  authenticate,
  authorizeHousehold,
  async (req, res) => {
    // User is authenticated AND authorized
  },
);
```

---

## Pagination

### Cursor-Based Pagination (Recommended for Scale)

```typescript
GET /api/v1/pets?limit=20&cursor=eyJpZCI6InBldF8xMjMifQ

Response:
{
  "success": true,
  "data": [ /* 20 pets */ ],
  "pagination": {
    "limit": 20,
    "hasMore": true,
    "nextCursor": "eyJpZCI6InBldF8xNDMifQ"
  }
}
```

### Offset-Based Pagination (Simpler)

```typescript
GET /api/v1/pets?page=2&pageSize=20

Response:
{
  "success": true,
  "data": [ /* 20 pets */ ],
  "pagination": {
    "page": 2,
    "pageSize": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## Rate Limiting

### Rate Limit Headers

```typescript
// Response headers
X-RateLimit-Limit: 1000        # Requests per window
X-RateLimit-Remaining: 847     # Remaining requests
X-RateLimit-Reset: 1643654400  # Unix timestamp when limit resets

// When exceeded (429)
Retry-After: 3600              # Seconds until can retry
```

### Rate Limit Tiers

| Tier          | Requests/Hour | Use Case           |
| ------------- | ------------- | ------------------ |
| Anonymous     | 60            | Public endpoints   |
| Authenticated | 1,000         | Regular users      |
| Premium       | 10,000        | Paid users         |
| Internal      | Unlimited     | Service-to-service |

---

## Documentation

### OpenAPI/Swagger

Generate interactive API documentation:

```yaml
# openapi.yaml
openapi: 3.0.0
info:
  title: PetForce API
  version: 1.0.0
  description: API for managing pets, households, and care tasks

servers:
  - url: https://api.petforce.com/v1
    description: Production
  - url: https://staging-api.petforce.com/v1
    description: Staging

paths:
  /pets:
    get:
      summary: List all pets
      operationId: listPets
      tags: [Pets]
      parameters:
        - in: query
          name: limit
          schema:
            type: integer
            default: 20
      responses:
        "200":
          description: Success
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/PetList"
```

---

## Best Practices Checklist

Before shipping any API endpoint:

### Design

- [ ] RESTful resource naming (nouns, not verbs)
- [ ] Proper HTTP methods (GET, POST, PUT, PATCH, DELETE)
- [ ] Clear URL structure (max 3 levels deep)
- [ ] Versioned endpoint (/v1/, /v2/)

### Security

- [ ] Authentication required (except public endpoints)
- [ ] Authorization checks (user has permission)
- [ ] Input validation (reject bad data early)
- [ ] Rate limiting (prevent abuse)

### Response Format

- [ ] Consistent response structure
- [ ] Proper HTTP status codes
- [ ] Descriptive error messages
- [ ] Request ID for debugging

### Documentation

- [ ] OpenAPI/Swagger spec
- [ ] Request/response examples
- [ ] Error codes documented
- [ ] Authentication requirements clear

### Performance

- [ ] Pagination for lists
- [ ] Appropriate cache headers
- [ ] Database query optimization
- [ ] Response time < 200ms (target)

### Observability

- [ ] Structured logging
- [ ] Request ID tracking
- [ ] Performance metrics
- [ ] Error rate monitoring

---

## Tools & Resources

### Development Tools

- **Postman** - API testing and documentation
- **Swagger UI** - Interactive API documentation
- **curl** - Command-line HTTP testing
- **httpie** - User-friendly HTTP CLI

### Validation

- **Zod** - TypeScript schema validation
- **Joi** - Node.js validation
- **JSON Schema** - Language-agnostic validation

### Testing

- **Vitest** - Unit and integration tests
- **Supertest** - HTTP endpoint testing
- **Mock Service Worker** - API mocking

---

## Related Documentation

- [Advanced API Patterns](./advanced-patterns.md) - Production patterns and war stories
- [API Security Guide](../security/api-security.md) - Security best practices
- [Performance Optimization](../performance/api-optimization.md) - Speed and scale

---

Built with ❤️ by Axel (API Design Agent)

**API design is not about technology. It's about empathy for developers.**
