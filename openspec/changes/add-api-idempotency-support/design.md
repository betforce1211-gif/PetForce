# Design Document: API Idempotency Support

## Context

PetForce APIs need idempotency support to prevent duplicate operations when requests are retried due to network failures or user actions. This is critical for pet care data where duplicates can cause real-world problems (duplicate medication doses, duplicate appointments, duplicate account registrations).

**Current state**: No idempotency support - retries create duplicates
**Desired state**: Optional idempotency keys prevent duplicates while maintaining backward compatibility

**Stakeholders**:
- API consumers (web, mobile, third-party integrations)
- Pet families (benefit from reliable, duplicate-free operations)
- Customer support (reduced duplicate account/record tickets)

**Constraints**:
- Must be backward compatible (optional, not required)
- Must follow industry standards (HTTP Idempotency-Key header)
- Must be performant (sub-10ms overhead)
- Must work across distributed systems (shared cache layer)

## Goals / Non-Goals

**Goals**:
- Prevent duplicate mutations when requests are retried
- Follow industry-standard idempotency patterns (Stripe, Twilio, etc.)
- Provide clear error messages for idempotency conflicts
- Support automatic idempotency in SDKs
- Enable monitoring of duplicate prevention effectiveness

**Non-Goals**:
- Idempotency for read operations (GET is naturally idempotent)
- Forcing idempotency keys (must remain optional for backward compatibility)
- Complex distributed transaction coordination (use simple key-value store)
- Infinite idempotency key retention (24-hour TTL is sufficient)

## Decisions

### Decision 1: Header-based Idempotency Keys
**Choice**: Use HTTP header `Idempotency-Key: <uuid>` for idempotency keys

**Rationale**:
- Industry standard (Stripe, Twilio, GitHub, Shopify all use this pattern)
- Separates idempotency from business logic (not in request body)
- Works with all HTTP methods (POST, PUT, PATCH, DELETE)
- Easy to add to existing APIs without breaking changes

**Alternatives considered**:
- Query parameter `?idempotency_key=<uuid>` - Rejected: URLs get logged, cached, less secure
- Request body field - Rejected: Requires schema changes, harder to make universal
- Custom header name - Rejected: Prefer standard naming for developer familiarity

### Decision 2: Client-Generated UUID v4 Keys
**Choice**: Clients generate UUID v4 idempotency keys, server validates format

**Rationale**:
- Clients can generate keys before network round-trip (offline support)
- UUID v4 has sufficient entropy to prevent collisions (2^122 possible values)
- No server round-trip needed to obtain idempotency key
- Standard format (RFC 4122) with validation libraries available

**Validation rules**:
```
FORMAT: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
REQUIRED: Lowercase hex characters
INVALID: Empty, non-UUID format, version other than 4
ERROR: 400 Bad Request with clear error message
```

**Alternatives considered**:
- Server-generated keys - Rejected: Requires extra round-trip, complicates offline scenarios
- Timestamp-based keys - Rejected: Clock skew issues, not universally unique
- Hash of request body - Rejected: Doesn't work for non-deterministic requests (timestamps, random IDs)

### Decision 3: 24-Hour TTL with Redis Storage
**Choice**: Store idempotency results in Redis with 24-hour TTL

**Storage schema**:
```typescript
interface IdempotencyRecord {
  key: string;              // UUID v4 idempotency key
  requestHash: string;      // SHA-256 hash of request body
  responseStatus: number;   // HTTP status code
  responseBody: string;     // JSON response body
  createdAt: number;        // Unix timestamp
  ttl: number;              // 86400 seconds (24 hours)
}

// Redis key format: idempotency:{endpoint}:{key}
// Example: idempotency:auth/register:550e8400-e29b-41d4-a716-446655440000
```

**Rationale**:
- 24 hours covers reasonable retry windows (network outages, delayed retries)
- Redis provides native TTL with automatic expiration (no cleanup jobs needed)
- Hash of request body allows conflict detection (same key, different request)
- Fast lookups (sub-millisecond) won't impact API performance

**Alternatives considered**:
- PostgreSQL storage - Rejected: Slower, requires manual cleanup, overkill for temporary data
- 7-day TTL - Rejected: Unnecessary storage overhead for rare long-retry scenarios
- In-memory cache only - Rejected: Lost on restarts, not shared across instances

### Decision 4: Conflict Detection with 409 Response
**Choice**: Return `409 Conflict` if idempotency key reused with different request body

**Behavior**:
```typescript
// Scenario 1: Exact duplicate (same key, same request hash)
Request 1: POST /auth/register + Idempotency-Key: abc123 + {email: "user@example.com"}
Response 1: 201 Created {userId: "123"}

Request 2: POST /auth/register + Idempotency-Key: abc123 + {email: "user@example.com"}
Response 2: 201 Created {userId: "123"} + X-Idempotent-Replayed: true
// Returns cached result, no duplicate created

// Scenario 2: Conflict (same key, different request)
Request 1: POST /auth/register + Idempotency-Key: abc123 + {email: "user1@example.com"}
Response 1: 201 Created {userId: "123"}

Request 2: POST /auth/register + Idempotency-Key: abc123 + {email: "user2@example.com"}
Response 2: 409 Conflict {
  error: {
    code: "idempotency_conflict",
    message: "Idempotency key already used with different request body",
    details: {
      idempotencyKey: "abc123",
      originalRequestHash: "sha256:...",
      conflictingRequestHash: "sha256:..."
    }
  }
}
```

**Rationale**:
- Prevents accidental key reuse with different operations
- 409 is semantically correct (conflict with existing resource)
- Clear error message guides developers to fix the issue
- Hash comparison is fast and secure

**Alternatives considered**:
- Allow key reuse with different requests - Rejected: Defeats purpose of idempotency
- Return 400 Bad Request - Rejected: 409 is more semantically correct for conflicts
- Silently ignore and process new request - Rejected: Dangerous, could hide bugs

### Decision 5: Optional with Graceful Degradation
**Choice**: Idempotency keys are optional; endpoints work without them (backward compatible)

**Implementation**:
```typescript
// Middleware checks for Idempotency-Key header
async function idempotencyMiddleware(req, res, next) {
  const idempotencyKey = req.headers['idempotency-key'];

  // No key provided → process normally (backward compatible)
  if (!idempotencyKey) {
    return next();
  }

  // Key provided → check for cached result
  const cached = await redis.get(`idempotency:${endpoint}:${idempotencyKey}`);

  if (cached) {
    const record = JSON.parse(cached);
    const requestHash = hash(req.body);

    // Same request → return cached result
    if (record.requestHash === requestHash) {
      res.setHeader('X-Idempotent-Replayed', 'true');
      return res.status(record.responseStatus).json(record.responseBody);
    }

    // Different request → conflict
    return res.status(409).json({
      error: {
        code: 'idempotency_conflict',
        message: 'Idempotency key already used with different request',
      }
    });
  }

  // No cached result → process and cache
  next();
}
```

**Rationale**:
- Zero impact on existing API consumers
- Gradual adoption without migration required
- SDKs can add automatic idempotency key generation over time

## Risks / Trade-offs

### Risk 1: Redis Dependency
**Risk**: Adds Redis as a critical dependency for API reliability

**Mitigation**:
- Use Redis in high-availability mode (sentinel or cluster)
- Graceful degradation: If Redis is down, log warning and process request normally
- Monitor Redis health and alert on failures
- Consider eventual consistency: Temporary Redis outage = temporary loss of idempotency protection (acceptable)

**Trade-off**: Increased infrastructure complexity vs. improved API reliability

### Risk 2: Storage Costs
**Risk**: Storing every idempotent request could consume significant storage

**Mitigation**:
- 24-hour TTL limits storage to recent requests only
- Estimate: 1KB per request × 10K requests/day × 1 day = 10MB (negligible)
- Use Redis compression for response bodies
- Monitor storage usage and adjust TTL if needed

**Trade-off**: Minimal storage cost vs. strong idempotency guarantees

### Risk 3: Hash Collision False Positives
**Risk**: Different requests could theoretically produce same SHA-256 hash (collision)

**Mitigation**:
- SHA-256 collision probability is astronomically low (2^256)
- More likely to win the lottery 1000 times than see SHA-256 collision
- Include request metadata in hash (method, path, headers) to increase entropy

**Trade-off**: Theoretical risk vs. practical impossibility (acceptable)

### Risk 4: Key Reuse Across Endpoints
**Risk**: Same idempotency key used for different endpoints (e.g., register vs. login)

**Mitigation**:
- Namespace idempotency keys by endpoint: `idempotency:{endpoint}:{key}`
- Example: `idempotency:auth/register:abc123` vs. `idempotency:auth/login:abc123`
- Documentation clearly states keys are scoped per endpoint

**Trade-off**: Slightly more complex key structure vs. clear separation of concerns

## Migration Plan

### Phase 1: Design & Specification (This Change)
1. Complete this design document
2. Update API spec with idempotency requirements
3. Add idempotency to API Design quality checklist
4. Review and approve with Engrid, Maya, Thomas

### Phase 2: Infrastructure Setup
1. Provision Redis cluster for idempotency storage
2. Configure high-availability and monitoring
3. Test Redis performance and TTL behavior
4. Document Redis operations runbook

### Phase 3: Implementation
1. Create idempotency middleware for API gateway
2. Add idempotency support to auth/register endpoint (pilot)
3. Test thoroughly (unit, integration, load testing)
4. Deploy to staging and validate

### Phase 4: SDK & Documentation
1. Update TypeScript SDK with automatic idempotency key generation
2. Update Swift SDK (Maya) with idempotency support
3. Create developer documentation with examples
4. Publish migration guide

### Phase 5: Rollout
1. Deploy to production with monitoring
2. Measure adoption rate (% of requests with idempotency keys)
3. Monitor duplicate prevention effectiveness
4. Iterate based on feedback

### Rollback Plan
- Feature flag to disable idempotency checking
- Redis failure → log warning, process normally (graceful degradation)
- No database migrations required (Redis is ephemeral)
- SDK updates are backward compatible (keys are optional)

## Open Questions

1. **Should we enforce idempotency keys for critical operations?**
   - Example: Medication logging REQUIRES idempotency key for safety
   - Decision: Start optional, consider required for specific endpoints in future
   - Owner: Peter (Product Management) + Axel (API Design)

2. **Should we provide idempotency key generation in API responses?**
   - Example: Return `X-Idempotency-Key-Suggestion: <uuid>` for client convenience
   - Decision: Not in v1 - adds complexity, clients can generate easily
   - Revisit if customer feedback requests it

3. **How to handle idempotency for async operations?**
   - Example: Long-running job submissions
   - Decision: Not in scope for v1 - design when async patterns are introduced
   - Owner: Axel (API Design) + Engrid (Software Engineering)

4. **Should we expose idempotency metrics to API consumers?**
   - Example: Dashboard showing duplicate prevention rate
   - Decision: Internal metrics first, external dashboard in future if requested
   - Owner: Ana (Analytics) + Casey (Customer Success)

---

**Document Owner**: Axel (API Design)
**Reviewers**: Engrid (implementation), Maya (mobile SDK), Samantha (security), Thomas (documentation)
**Status**: Draft - Ready for Review
**Last Updated**: 2026-01-25
