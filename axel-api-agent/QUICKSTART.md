# Axel API Design Agent - Quick Start Guide

Design a production-ready API in 15 minutes.

## Step 1: Identify Your Resources

List the core entities in your system:

```
Resources:
- Users (accounts, profiles)
- Orders (transactions)
- Products (catalog items)
- Payments (financial records)
```

**Axel's Rule:** Resources are **nouns**, not verbs.

---

## Step 2: Design Resource URLs

Map each resource to URL paths:

```
/v1/users
/v1/users/{id}
/v1/orders
/v1/orders/{id}
/v1/products
/v1/products/{id}
```

**Relationships:**
```
/v1/users/{id}/orders       # User's orders
/v1/orders/{id}/items       # Order's line items
```

---

## Step 3: Define HTTP Methods

For each resource, define CRUD operations:

```
Users:
GET    /v1/users           # List all users
POST   /v1/users           # Create user
GET    /v1/users/{id}      # Get single user
PATCH  /v1/users/{id}      # Update user
DELETE /v1/users/{id}      # Delete user

Orders:
GET    /v1/orders          # List orders
POST   /v1/orders          # Create order
GET    /v1/orders/{id}     # Get order
PATCH  /v1/orders/{id}     # Update order
DELETE /v1/orders/{id}     # Cancel order

Actions (use POST for non-CRUD):
POST   /v1/orders/{id}/submit    # Submit order
POST   /v1/orders/{id}/cancel    # Cancel order
POST   /v1/payments/{id}/refund  # Refund payment
```

---

## Step 4: Define Request/Response Schemas

### Create Request
```json
POST /v1/users
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "Jane Doe",
  "role": "customer"
}
```

### Success Response
```json
HTTP/1.1 201 Created
Location: /v1/users/usr_abc123

{
  "id": "usr_abc123",
  "email": "user@example.com",
  "name": "Jane Doe",
  "role": "customer",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### List Response (with pagination)
```json
GET /v1/users?limit=20

{
  "data": [
    { "id": "usr_abc123", "name": "Jane Doe", ... },
    { "id": "usr_def456", "name": "John Smith", ... }
  ],
  "meta": {
    "has_more": true,
    "next_cursor": "eyJpZCI6InVzcl9kZWY0NTYifQ"
  }
}
```

---

## Step 5: Define Error Responses

### Validation Error (422)
```json
{
  "error": {
    "code": "validation_error",
    "message": "Validation failed",
    "request_id": "req_xyz789",
    "fields": [
      {
        "field": "email",
        "message": "Must be a valid email address",
        "code": "invalid_format"
      }
    ]
  }
}
```

### Not Found (404)
```json
{
  "error": {
    "code": "not_found",
    "message": "User not found",
    "request_id": "req_xyz789"
  }
}
```

### Rate Limited (429)
```json
{
  "error": {
    "code": "rate_limited",
    "message": "Rate limit exceeded. Retry after 60 seconds.",
    "request_id": "req_xyz789"
  }
}
```

---

## Step 6: Add Authentication

### API Key (for server-to-server)
```
GET /v1/users
X-API-Key: sk_live_abc123xyz
```

### Bearer Token (for user auth)
```
GET /v1/users/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

---

## Step 7: Add Rate Limiting Headers

Include in every response:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1704067200
```

On 429 response, add:
```
Retry-After: 60
```

---

## Step 8: Create OpenAPI Spec

```yaml
openapi: 3.1.0
info:
  title: My API
  version: 1.0.0

servers:
  - url: https://api.example.com/v1

paths:
  /users:
    get:
      summary: List users
      operationId: listUsers
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
            maximum: 100
        - name: cursor
          in: query
          schema:
            type: string
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserList'
                
    post:
      summary: Create user
      operationId: createUser
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
      responses:
        '201':
          description: Created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'

  /users/{id}:
    get:
      summary: Get user
      operationId: getUser
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '404':
          $ref: '#/components/responses/NotFound'

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
        email:
          type: string
          format: email
        name:
          type: string
        role:
          type: string
          enum: [admin, customer]
        created_at:
          type: string
          format: date-time
          
    CreateUserRequest:
      type: object
      required:
        - email
        - name
      properties:
        email:
          type: string
          format: email
        name:
          type: string
        role:
          type: string
          enum: [admin, customer]
          default: customer
          
    UserList:
      type: object
      properties:
        data:
          type: array
          items:
            $ref: '#/components/schemas/User'
        meta:
          type: object
          properties:
            has_more:
              type: boolean
            next_cursor:
              type: string
              
    Error:
      type: object
      properties:
        error:
          type: object
          properties:
            code:
              type: string
            message:
              type: string
            request_id:
              type: string
              
  responses:
    NotFound:
      description: Resource not found
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
            
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key
    BearerAuth:
      type: http
      scheme: bearer

security:
  - ApiKeyAuth: []
  - BearerAuth: []
```

---

## Step 9: Design Webhooks (Optional)

### Webhook Events
```
user.created
user.updated
order.created
order.completed
payment.succeeded
payment.failed
```

### Webhook Payload
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
      "total": 99.99
    }
  }
}
```

### Webhook Security
```
X-Webhook-Signature: sha256=abc123...
X-Webhook-Timestamp: 1704067200
```

---

## Step 10: Document Everything

### Getting Started
- Authentication methods
- Base URL and versioning
- Rate limits

### Endpoints
- Request/response examples
- Error codes
- Pagination

### Webhooks
- Available events
- Signature verification
- Retry policy

---

## Quick Reference

### Status Codes
| Code | Use |
|------|-----|
| 200 | Success |
| 201 | Created |
| 204 | No content (DELETE) |
| 400 | Bad request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |
| 422 | Validation failed |
| 429 | Rate limited |
| 500 | Server error |

### Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| URLs | kebab-case | `/user-profiles` |
| JSON fields | snake_case | `created_at` |
| Query params | snake_case | `filter[user_id]` |

### Pagination
| Type | Best For |
|------|----------|
| Cursor | Public APIs, mobile |
| Offset | Admin tools, dashboards |

---

## Next Steps

1. 📖 Read the full [AXEL.md](./AXEL.md) documentation
2. ✅ Validate your OpenAPI spec
3. 🔒 Review security with Samantha
4. 📝 Generate documentation with Thomas
5. 🧪 Set up contract tests with Chuck
6. 📦 Generate SDKs for clients

---

*Axel: Your API is your most important user interface. Design it like you mean it.* 🔌
