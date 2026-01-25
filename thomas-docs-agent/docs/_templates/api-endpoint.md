# {{METHOD}} {{ENDPOINT}}

> {{Brief description of what this endpoint does}}

**Base URL**: `https://api.example.com/v1`

---

## Overview

| Property | Value |
|----------|-------|
| **Method** | `{{METHOD}}` |
| **Endpoint** | `{{ENDPOINT}}` |
| **Authentication** | Required / Optional / None |
| **Rate Limit** | 100 requests/minute |
| **Idempotent** | Yes / No |

---

## Description

Detailed description of what this endpoint does, when to use it, and any important context.

---

## Authentication

This endpoint requires authentication via Bearer token.

```bash
Authorization: Bearer YOUR_API_KEY
```

**Required scopes:** `read:resource`, `write:resource`

[📚 Learn about authentication →](../authentication.md)

---

## Request

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | The unique identifier of the resource |

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `include` | string | No | - | Related resources to include (comma-separated) |
| `page` | integer | No | `1` | Page number for pagination |
| `limit` | integer | No | `20` | Items per page (max 100) |
| `sort` | string | No | `created_at` | Field to sort by |
| `order` | string | No | `desc` | Sort order: `asc` or `desc` |

### Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes | Bearer token |
| `Content-Type` | Yes | `application/json` |
| `X-Request-ID` | No | Unique request identifier for tracing |
| `Accept-Language` | No | Preferred language for responses |

### Request Body

```json
{
  "name": "string (required)",
  "description": "string (optional)",
  "type": "string (required) - enum: ['type_a', 'type_b', 'type_c']",
  "settings": {
    "enabled": "boolean (optional, default: true)",
    "threshold": "integer (optional, range: 1-100)"
  },
  "tags": ["string"] 
}
```

#### Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Display name (1-100 characters) |
| `description` | string | No | Optional description (max 500 characters) |
| `type` | string | Yes | Resource type. Enum: `type_a`, `type_b`, `type_c` |
| `settings` | object | No | Configuration settings |
| `settings.enabled` | boolean | No | Whether enabled. Default: `true` |
| `settings.threshold` | integer | No | Threshold value (1-100) |
| `tags` | array | No | List of tags (max 10) |

---

## Response

### Success Response

**Status Code:** `200 OK` (or `201 Created` for creation endpoints)

```json
{
  "data": {
    "id": "res_abc123",
    "name": "Example Resource",
    "description": "An example resource",
    "type": "type_a",
    "settings": {
      "enabled": true,
      "threshold": 50
    },
    "tags": ["production", "important"],
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  },
  "meta": {
    "request_id": "req_xyz789"
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `data` | object | The resource object |
| `data.id` | string | Unique identifier (prefixed with `res_`) |
| `data.name` | string | Display name |
| `data.description` | string | Description |
| `data.type` | string | Resource type |
| `data.settings` | object | Configuration settings |
| `data.tags` | array | Assigned tags |
| `data.created_at` | string | ISO 8601 creation timestamp |
| `data.updated_at` | string | ISO 8601 last update timestamp |
| `meta.request_id` | string | Request ID for support |

### Paginated Response

For list endpoints:

```json
{
  "data": [
    { "id": "res_abc123", "name": "Resource 1", ... },
    { "id": "res_def456", "name": "Resource 2", ... }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_items": 45,
    "total_pages": 3,
    "has_next": true,
    "has_prev": false
  },
  "meta": {
    "request_id": "req_xyz789"
  }
}
```

---

## Error Responses

### Client Errors (4xx)

#### 400 Bad Request

Invalid request body or parameters.

```json
{
  "error": {
    "code": "validation_error",
    "message": "Validation failed",
    "details": [
      {
        "field": "name",
        "message": "Name is required"
      },
      {
        "field": "settings.threshold",
        "message": "Must be between 1 and 100"
      }
    ]
  },
  "meta": {
    "request_id": "req_xyz789"
  }
}
```

#### 401 Unauthorized

Missing or invalid authentication.

```json
{
  "error": {
    "code": "unauthorized",
    "message": "Invalid or expired API key"
  }
}
```

#### 403 Forbidden

Insufficient permissions.

```json
{
  "error": {
    "code": "forbidden",
    "message": "You don't have permission to perform this action"
  }
}
```

#### 404 Not Found

Resource doesn't exist.

```json
{
  "error": {
    "code": "not_found",
    "message": "Resource not found"
  }
}
```

#### 409 Conflict

Resource conflict (e.g., duplicate).

```json
{
  "error": {
    "code": "conflict",
    "message": "A resource with this name already exists"
  }
}
```

#### 429 Too Many Requests

Rate limit exceeded.

```json
{
  "error": {
    "code": "rate_limited",
    "message": "Rate limit exceeded. Retry after 60 seconds"
  }
}
```

**Headers included:**
- `X-RateLimit-Limit: 100`
- `X-RateLimit-Remaining: 0`
- `X-RateLimit-Reset: 1705320000`
- `Retry-After: 60`

### Server Errors (5xx)

#### 500 Internal Server Error

```json
{
  "error": {
    "code": "internal_error",
    "message": "An unexpected error occurred"
  },
  "meta": {
    "request_id": "req_xyz789"
  }
}
```

> **Note:** Include the `request_id` when contacting support.

---

## Examples

### cURL

```bash
curl -X {{METHOD}} "https://api.example.com/v1{{ENDPOINT}}" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Resource",
    "type": "type_a",
    "settings": {
      "enabled": true
    }
  }'
```

### JavaScript (fetch)

```javascript
const response = await fetch('https://api.example.com/v1{{ENDPOINT}}', {
  method: '{{METHOD}}',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'My Resource',
    type: 'type_a',
    settings: {
      enabled: true,
    },
  }),
});

const data = await response.json();
console.log(data);
```

### Python

```python
import requests

response = requests.{{method_lower}}(
    'https://api.example.com/v1{{ENDPOINT}}',
    headers={
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json',
    },
    json={
        'name': 'My Resource',
        'type': 'type_a',
        'settings': {
            'enabled': True,
        },
    },
)

data = response.json()
print(data)
```

### Node.js (SDK)

```javascript
const client = new ExampleClient({ apiKey: 'YOUR_API_KEY' });

const resource = await client.resources.create({
  name: 'My Resource',
  type: 'type_a',
  settings: {
    enabled: true,
  },
});

console.log(resource);
```

---

## Webhooks

This action triggers the following webhooks:

| Event | Description |
|-------|-------------|
| `resource.created` | Fired when a new resource is created |
| `resource.updated` | Fired when a resource is updated |

[📚 Learn about webhooks →](../webhooks.md)

---

## Rate Limits

| Plan | Limit |
|------|-------|
| Free | 10 requests/minute |
| Pro | 100 requests/minute |
| Enterprise | 1000 requests/minute |

[📚 Learn about rate limits →](../rate-limits.md)

---

## Changelog

| Date | Change |
|------|--------|
| 2024-01-15 | Added `tags` field |
| 2023-10-01 | Initial release |

---

## Related Endpoints

- [List Resources](./list-resources.md) - `GET /resources`
- [Get Resource](./get-resource.md) - `GET /resources/{id}`
- [Delete Resource](./delete-resource.md) - `DELETE /resources/{id}`
