# 🔌 Axel: The API Design Agent

> *Your API is your most important user interface. Design it like you mean it.*

Axel is a comprehensive API Design agent powered by Claude Code. He architects the interfaces that let systems communicate, ensuring data flows seamlessly in and out of your platform. When Axel designs an API, it's intuitive, consistent, secure, and a joy to integrate with.

## ✨ Features

| Feature | Description |
|---------|-------------|
| **REST API Design** | Resource-oriented architecture, proper HTTP semantics |
| **GraphQL Schemas** | Type-safe, efficient query language design |
| **OpenAPI Specs** | Machine-readable API contracts |
| **Authentication** | API keys, OAuth 2.0, JWT patterns |
| **Rate Limiting** | Tiered limits, headers, backoff strategies |
| **Webhooks** | Event-driven integrations with signatures |
| **Versioning** | Breaking change management |
| **SDK Generation** | Auto-generate client libraries |

## 📁 Package Contents

```
axel-api-agent/
├── AXEL.md                               # Full API design documentation
├── CLAUDE.md                             # Claude Code agent configuration
├── README.md                             # This file
├── QUICKSTART.md                         # 15-minute setup guide
├── .axel.yml                             # API configuration
└── templates/
    ├── openapi.yaml.template             # OpenAPI 3.1 template
    └── webhook-payload.json.template     # Webhook payload template
```

## 🚀 Quick Start

### 1. Define Your Resources
```yaml
# What are the core entities?
- Users
- Orders
- Products
- Payments
```

### 2. Design Endpoints
```
GET    /v1/users           # List
POST   /v1/users           # Create
GET    /v1/users/{id}      # Read
PATCH  /v1/users/{id}      # Update
DELETE /v1/users/{id}      # Delete
```

### 3. Generate OpenAPI Spec
```bash
axel openapi generate --output api.yaml
```

**[📖 Full Setup Guide →](./QUICKSTART.md)**

## 🎯 REST Design Principles

### Resources are Nouns

| ✅ Good | ❌ Bad |
|---------|--------|
| `GET /users` | `GET /getUsers` |
| `POST /orders` | `POST /createOrder` |
| `DELETE /users/123` | `POST /deleteUser` |

### HTTP Methods

| Method | Purpose | Idempotent |
|--------|---------|------------|
| GET | Read | Yes |
| POST | Create | No |
| PUT | Replace | Yes |
| PATCH | Update | Yes |
| DELETE | Remove | Yes |

### Status Codes

| Code | When to Use |
|------|-------------|
| 200 | Success with body |
| 201 | Created (POST) |
| 204 | Success, no body (DELETE) |
| 400 | Malformed request |
| 401 | Auth required |
| 403 | Not authorized |
| 404 | Not found |
| 422 | Validation failed |
| 429 | Rate limited |

## 📊 Error Format

```json
{
  "error": {
    "code": "validation_error",
    "message": "Validation failed",
    "request_id": "req_abc123",
    "fields": [
      {
        "field": "email",
        "message": "Must be a valid email",
        "code": "invalid_format"
      }
    ]
  }
}
```

## 📄 Pagination

### Cursor-Based (Recommended)
```
GET /users?limit=20&cursor=eyJpZCI6MTIzfQ

{
  "data": [...],
  "meta": {
    "has_more": true,
    "next_cursor": "eyJpZCI6MTQzfQ"
  }
}
```

## 🔐 Authentication

| Method | Use Case |
|--------|----------|
| API Key | Server-to-server |
| Bearer/JWT | User authentication |
| OAuth 2.0 | Third-party apps |

## 🪝 Webhooks

```json
{
  "id": "evt_abc123",
  "type": "order.completed",
  "created_at": "2024-01-15T10:30:00Z",
  "data": {
    "object": { ... }
  }
}
```

**Headers:**
```
X-Webhook-Signature: sha256=abc123...
X-Webhook-Timestamp: 1704067200
```

## 🤖 Using with Claude Code

```
You: Design an API for a task management system

Axel: 🔌 API Design: Task Management

Resources:
• Tasks
• Projects  
• Users
• Comments

Endpoints:

Tasks:
GET    /v1/tasks                    # List tasks
POST   /v1/tasks                    # Create task
GET    /v1/tasks/{id}               # Get task
PATCH  /v1/tasks/{id}               # Update task
DELETE /v1/tasks/{id}               # Delete task
POST   /v1/tasks/{id}/complete      # Mark complete

Filtering:
GET /v1/tasks?filter[status]=pending&filter[assignee]=user_123

Pagination:
Cursor-based with 20 items default, 100 max

Authentication:
Bearer token (JWT) for users
API key for integrations

Shall I generate the full OpenAPI spec?
```

## 🎯 Axel's Commands

```bash
# Generate OpenAPI spec
axel openapi generate --output api.yaml

# Validate spec
axel openapi validate api.yaml

# Check for breaking changes
axel diff v1.yaml v2.yaml

# Generate SDKs
axel sdk generate --lang typescript,python

# Generate documentation
axel docs generate --format redoc
```

## 🤝 Integration with Other Agents

| Agent | Integration |
|-------|-------------|
| **Engrid** | Implements endpoints per OpenAPI contract |
| **Maya** | Mobile-optimized pagination & payloads |
| **Samantha** | Security review, auth patterns |
| **Thomas** | API documentation & guides |
| **Chuck** | Contract testing in CI/CD |

## 📋 Configuration

Axel uses `.axel.yml`:

```yaml
version: 1

api:
  name: "my-api"
  version: "1.0.0"

versioning:
  strategy: url_path
  current_version: v1

rate_limiting:
  default:
    requests_per_window: 1000
    window_seconds: 3600

pagination:
  default_strategy: cursor
  limits:
    default: 20
    max: 100

webhooks:
  enabled: true
  events:
    - order.created
    - order.completed
    - payment.succeeded
```

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [AXEL.md](./AXEL.md) | Complete API design documentation |
| [CLAUDE.md](./CLAUDE.md) | Claude Code configuration |
| [QUICKSTART.md](./QUICKSTART.md) | 15-minute setup guide |

## 📋 Templates

| Template | Use For |
|----------|---------|
| `openapi.yaml.template` | OpenAPI 3.1 specification |
| `webhook-payload.json.template` | Webhook event payloads |

---

<p align="center">
  <strong>Axel: Your API Design Partner</strong><br>
  <em>Connecting systems, enabling growth.</em>
</p>

---

*Your API is your most important user interface. Design it like you mean it.* 🔌
