# PetForce API Documentation

Comprehensive REST API documentation for PetForce platform.

## API Overview

**Base URL:** `https://api.petforce.app/v1`

**Current Version:** v1  
**Protocol:** HTTPS only  
**Format:** JSON  
**Authentication:** JWT Bearer tokens

---

## Axel's API Design Principles

1. **RESTful** - Follow REST conventions for predictable APIs
2. **Consistent** - Same patterns across all endpoints
3. **Versioned** - Explicit versioning for backward compatibility
4. **Secure** - Authentication and authorization on all endpoints
5. **Documented** - Every endpoint fully documented with examples
6. **Tested** - Integration tests for all endpoints
7. **Performant** - Optimized queries, caching, pagination

---

## Quick Start

### Authentication

All API requests require authentication via JWT token:

```bash
curl https://api.petforce.app/v1/households \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Your Token

```typescript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: "user@example.com",
  password: "password123",
});

const token = data.session?.access_token;
```

### Make Your First Request

```typescript
const response = await fetch("https://api.petforce.app/v1/households", {
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});

const households = await response.json();
```

---

## API Reference

### Base Endpoints

| Endpoint             | Description        |
| -------------------- | ------------------ |
| `GET /health`        | Health check       |
| `GET /health/ready`  | Readiness check    |
| `POST /auth/signup`  | Create new account |
| `POST /auth/login`   | Authenticate user  |
| `POST /auth/logout`  | End session        |
| `POST /auth/refresh` | Refresh token      |

### Household Endpoints

| Method   | Endpoint                                  | Description            | Auth           |
| -------- | ----------------------------------------- | ---------------------- | -------------- |
| `POST`   | `/households`                             | Create household       | ✅ Required    |
| `GET`    | `/households`                             | List user's households | ✅ Required    |
| `GET`    | `/households/:id`                         | Get household details  | ✅ Required    |
| `PATCH`  | `/households/:id`                         | Update household       | ✅ Leader only |
| `DELETE` | `/households/:id`                         | Delete household       | ✅ Leader only |
| `POST`   | `/households/:id/regenerate-code`         | Regenerate invite code | ✅ Leader only |
| `POST`   | `/households/:id/join`                    | Request to join        | ✅ Required    |
| `GET`    | `/households/:id/members`                 | List members           | ✅ Member      |
| `POST`   | `/households/:id/members/:userId/approve` | Approve join request   | ✅ Leader only |
| `POST`   | `/households/:id/members/:userId/reject`  | Reject join request    | ✅ Leader only |
| `DELETE` | `/households/:id/members/:userId`         | Remove member          | ✅ Leader only |
| `POST`   | `/households/:id/transfer-leadership`     | Transfer leadership    | ✅ Leader only |
| `GET`    | `/households/:id/requests`                | List pending requests  | ✅ Leader only |

---

## RESTful Design Standards

### HTTP Methods

- **GET** - Retrieve resource(s)
- **POST** - Create new resource
- **PATCH** - Update resource (partial)
- **PUT** - Replace resource (full)
- **DELETE** - Remove resource

### Resource Naming

✅ **Good:**

- `/households` (plural, lowercase)
- `/households/:id/members` (nested resources)
- `/households/:id/join-requests` (kebab-case for multi-word)

❌ **Bad:**

- `/Household` (uppercase)
- `/getHouseholds` (verb in URL)
- `/households/:id/GetMembers` (mixed case, verb)

### Status Codes

| Code  | Meaning               | Usage                                   |
| ----- | --------------------- | --------------------------------------- |
| `200` | OK                    | Successful GET, PATCH, DELETE           |
| `201` | Created               | Successful POST                         |
| `204` | No Content            | Successful DELETE with no body          |
| `400` | Bad Request           | Invalid input/validation error          |
| `401` | Unauthorized          | Missing or invalid auth token           |
| `403` | Forbidden             | Valid auth but insufficient permissions |
| `404` | Not Found             | Resource doesn't exist                  |
| `409` | Conflict              | Resource conflict (duplicate)           |
| `422` | Unprocessable Entity  | Semantic validation error               |
| `429` | Too Many Requests     | Rate limit exceeded                     |
| `500` | Internal Server Error | Unexpected server error                 |
| `503` | Service Unavailable   | Temporary unavailability                |

---

## Authentication

### JWT Bearer Tokens

All endpoints (except `/health` and `/auth/*`) require authentication:

```http
GET /households HTTP/1.1
Host: api.petforce.app
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Structure

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "authenticated",
  "iat": 1706802345,
  "exp": 1706805945
}
```

### Token Expiration

- **Access Token**: 1 hour
- **Refresh Token**: 30 days

### Refreshing Tokens

```typescript
const { data, error } = await supabase.auth.refreshSession();
const newToken = data.session?.access_token;
```

---

## Error Handling

### Error Response Format

All errors follow consistent structure:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Household name is required",
    "details": {
      "field": "name",
      "constraint": "required"
    },
    "timestamp": "2026-02-02T10:30:00Z",
    "path": "/households",
    "requestId": "req-abc123"
  }
}
```

### Error Codes

| Code                  | HTTP Status | Description              |
| --------------------- | ----------- | ------------------------ |
| `VALIDATION_ERROR`    | 400         | Input validation failed  |
| `UNAUTHORIZED`        | 401         | Authentication required  |
| `FORBIDDEN`           | 403         | Insufficient permissions |
| `NOT_FOUND`           | 404         | Resource not found       |
| `CONFLICT`            | 409         | Resource already exists  |
| `RATE_LIMIT_EXCEEDED` | 429         | Too many requests        |
| `INTERNAL_ERROR`      | 500         | Server error             |

### Field Validation Errors

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "fields": {
        "name": "Name is required",
        "description": "Description must be less than 500 characters"
      }
    }
  }
}
```

---

## Versioning

### URL Versioning

Version is included in URL path:

```
https://api.petforce.app/v1/households
https://api.petforce.app/v2/households (future)
```

### Version Lifecycle

1. **Active** - Current recommended version
2. **Deprecated** - Still supported but will be removed
3. **Sunset** - No longer supported

### Deprecation Policy

- **6 months notice** before deprecation
- **12 months support** for deprecated versions
- Deprecation headers in responses:

```http
Deprecation: true
Sunset: Sat, 31 Dec 2026 23:59:59 GMT
Link: <https://api.petforce.app/v2/households>; rel="successor-version"
```

---

## Rate Limiting

### Limits

| Tier          | Requests/Minute | Requests/Hour | Requests/Day |
| ------------- | --------------- | ------------- | ------------ |
| Anonymous     | 10              | 100           | 1,000        |
| Authenticated | 100             | 1,000         | 10,000       |
| Premium       | 500             | 5,000         | 50,000       |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706802400
```

### Rate Limit Response

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please try again in 42 seconds.",
    "details": {
      "limit": 100,
      "remaining": 0,
      "resetAt": "2026-02-02T10:30:00Z"
    }
  }
}
```

---

## Pagination

### Request

```http
GET /households?page=2&limit=20
```

### Query Parameters

- `page` - Page number (1-indexed, default: 1)
- `limit` - Items per page (default: 20, max: 100)

### Response

```json
{
  "data": [
    { "id": "household-1", "name": "The Smith Family" },
    { "id": "household-2", "name": "The Jones House" }
  ],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 157,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPreviousPage": true
  },
  "links": {
    "self": "/households?page=2&limit=20",
    "first": "/households?page=1&limit=20",
    "previous": "/households?page=1&limit=20",
    "next": "/households?page=3&limit=20",
    "last": "/households?page=8&limit=20"
  }
}
```

---

## Filtering & Sorting

### Filtering

```http
GET /households?role=leader
GET /households?status=active
GET /households?memberCount[gte]=3
```

### Supported Operators

- `[eq]` - Equals (default)
- `[ne]` - Not equals
- `[gt]` - Greater than
- `[gte]` - Greater than or equal
- `[lt]` - Less than
- `[lte]` - Less than or equal
- `[in]` - In array
- `[like]` - Pattern match

### Sorting

```http
GET /households?sort=createdAt:desc
GET /households?sort=name:asc,createdAt:desc
```

---

## Request/Response Examples

### Create Household

**Request:**

```http
POST /households HTTP/1.1
Host: api.petforce.app
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "name": "The Smith Family",
  "description": "Our household with 2 dogs and 1 cat"
}
```

**Response (201):**

```json
{
  "id": "household-uuid",
  "name": "The Smith Family",
  "description": "Our household with 2 dogs and 1 cat",
  "inviteCode": "SMITH-ALPHA-BRAVO",
  "inviteCodeExpiresAt": "2026-03-04T10:30:00Z",
  "leaderId": "user-uuid",
  "memberCount": 1,
  "createdAt": "2026-02-02T10:30:00Z",
  "updatedAt": "2026-02-02T10:30:00Z"
}
```

### Get Household

**Request:**

```http
GET /households/household-uuid HTTP/1.1
Authorization: Bearer YOUR_TOKEN
```

**Response (200):**

```json
{
  "id": "household-uuid",
  "name": "The Smith Family",
  "description": "Our household with 2 dogs and 1 cat",
  "inviteCode": "SMITH-ALPHA-BRAVO",
  "inviteCodeExpiresAt": "2026-03-04T10:30:00Z",
  "leaderId": "user-uuid",
  "leader": {
    "id": "user-uuid",
    "email": "john@example.com",
    "fullName": "John Smith"
  },
  "memberCount": 3,
  "members": [
    {
      "id": "member-1",
      "userId": "user-uuid",
      "role": "leader",
      "joinedAt": "2026-02-02T10:30:00Z"
    }
  ],
  "createdAt": "2026-02-02T10:30:00Z",
  "updatedAt": "2026-02-02T10:30:00Z"
}
```

### Update Household

**Request:**

```http
PATCH /households/household-uuid HTTP/1.1
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "name": "The Smith-Jones Family",
  "description": "Updated description"
}
```

**Response (200):**

```json
{
  "id": "household-uuid",
  "name": "The Smith-Jones Family",
  "description": "Updated description",
  "updatedAt": "2026-02-02T11:00:00Z"
}
```

### Join Household

**Request:**

```http
POST /households/household-uuid/join HTTP/1.1
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "inviteCode": "SMITH-ALPHA-BRAVO"
}
```

**Response (201):**

```json
{
  "request": {
    "id": "request-uuid",
    "householdId": "household-uuid",
    "userId": "user-uuid",
    "status": "pending",
    "createdAt": "2026-02-02T10:35:00Z"
  },
  "message": "Join request submitted. Awaiting leader approval."
}
```

---

## Data Types

### Household

```typescript
interface Household {
  id: string; // UUID
  name: string; // 1-100 characters
  description: string | null; // 0-500 characters
  inviteCode: string; // XXX-XXX-XXX format
  inviteCodeExpiresAt: string; // ISO 8601 timestamp
  leaderId: string; // User UUID
  memberCount: number; // Integer
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}
```

### Member

```typescript
interface Member {
  id: string; // UUID
  userId: string; // User UUID
  householdId: string; // Household UUID
  role: "leader" | "member"; // Role
  status: "active" | "removed"; // Status
  joinedAt: string; // ISO 8601 timestamp
}
```

### Join Request

```typescript
interface JoinRequest {
  id: string; // UUID
  householdId: string; // Household UUID
  userId: string; // User UUID
  status: "pending" | "approved" | "rejected";
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}
```

---

## Security Best Practices

### API Key Security

- **Never** commit API keys to version control
- **Always** use environment variables
- **Rotate** keys regularly (every 90 days)
- **Use different keys** for different environments

### HTTPS Only

All API requests must use HTTPS. HTTP requests are automatically redirected.

### Input Validation

All inputs are validated:

- Type checking
- Length limits
- Format validation
- SQL injection prevention
- XSS prevention

### Rate Limiting

Prevents abuse and DDoS attacks. See [Rate Limiting](#rate-limiting) section.

---

## Client Examples

### TypeScript

```typescript
// api/household-client.ts
export class HouseholdClient {
  private baseURL = "https://api.petforce.app/v1";
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error.message);
    }

    return response.json();
  }

  async createHousehold(data: { name: string; description?: string }) {
    return this.request<Household>("/households", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getHouseholds() {
    return this.request<{ data: Household[] }>("/households");
  }

  async getHousehold(id: string) {
    return this.request<Household>(`/households/${id}`);
  }

  async updateHousehold(id: string, data: Partial<Household>) {
    return this.request<Household>(`/households/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteHousehold(id: string) {
    return this.request<void>(`/households/${id}`, {
      method: "DELETE",
    });
  }

  async joinHousehold(id: string, inviteCode: string) {
    return this.request<{ request: JoinRequest }>(`/households/${id}/join`, {
      method: "POST",
      body: JSON.stringify({ inviteCode }),
    });
  }
}

// Usage
const client = new HouseholdClient(token);
const household = await client.createHousehold({
  name: "The Smith Family",
  description: "Our family household",
});
```

### cURL

```bash
# Create household
curl -X POST https://api.petforce.app/v1/households \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "The Smith Family",
    "description": "Our family household"
  }'

# Get households
curl https://api.petforce.app/v1/households \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get specific household
curl https://api.petforce.app/v1/households/household-uuid \
  -H "Authorization: Bearer YOUR_TOKEN"

# Update household
curl -X PATCH https://api.petforce.app/v1/households/household-uuid \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name"
  }'

# Delete household
curl -X DELETE https://api.petforce.app/v1/households/household-uuid \
  -H "Authorization: Bearer YOUR_TOKEN"

# Join household
curl -X POST https://api.petforce.app/v1/households/household-uuid/join \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "inviteCode": "SMITH-ALPHA-BRAVO"
  }'
```

---

## Testing the API

### Using Postman

1. Import OpenAPI spec: `docs/api/openapi.yaml`
2. Set environment variable: `token`
3. Run collection tests

### Using HTTPie

```bash
# Install
pip install httpie

# Authenticate
http POST https://api.petforce.app/v1/auth/login \
  email=user@example.com \
  password=password123

# Use token
export TOKEN="your-jwt-token"

# Create household
http POST https://api.petforce.app/v1/households \
  Authorization:"Bearer $TOKEN" \
  name="The Smith Family"
```

---

## API Changelog

### v1.0.0 (2026-02-01)

**Added:**

- Initial API release
- Household CRUD operations
- Household member management
- Join request flow
- Authentication endpoints

---

## Support

### Getting Help

- **API Issues**: [GitHub Issues](https://github.com/betforce1211-gif/PetForce/issues)
- **API Questions**: [GitHub Discussions](https://github.com/betforce1211-gif/PetForce/discussions)
- **Documentation**: Check `/docs/api/` folder

### Reporting Bugs

Include:

- Endpoint URL
- Request payload
- Response received
- Expected response
- Request ID (from error response)

---

## Related Documentation

- [OpenAPI Specification](./openapi.yaml)
- [Authentication Guide](./authentication.md)
- [Error Handling Guide](./error-handling.md)
- [Architecture Documentation](../ARCHITECTURE.md)

---

Built with ❤️ by Axel (API Design Agent)

**Well-designed APIs are a joy to use. Consistency is king.**
