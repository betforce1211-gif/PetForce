# ADR 0003: Application-Level Rate Limiting

**Status**: Accepted
**Date**: 2026-01-25
**Deciders**: Samantha, Engrid, Isabel

## Context

Need to prevent abuse (spam join requests, DoS attacks).
Options:
1. Application-level rate limiting (in-memory + database)
2. API Gateway rate limiting (AWS, Nginx)
3. Hybrid approach

## Decision

Implement application-level rate limiting with database-backed counters.

## Rationale

**Pros**:
- ✅ Fine-grained control (per-user, per-household, per-IP)
- ✅ Portable across infrastructure
- ✅ No additional infrastructure cost
- ✅ Easy to test locally
- ✅ Flexible rate limit policies
- ✅ Can customize error messages

**Cons**:
- ❌ Additional database queries
- ❌ Not as fast as CDN-level limiting
- ❌ Requires careful implementation

## Consequences

### Positive
- Rate limits enforced in API functions
- Counters stored in database (window: 1 hour)
- Easy to adjust limits per operation
- Can implement complex policies (burst limits, gradual throttling)
- Full visibility into rate limit usage

### Negative
- Every rate-limited operation adds DB query
- Potential bottleneck under extreme load
- Need to manage counter cleanup

## Implementation Details

### Rate Limit Configuration
```typescript
const RATE_LIMITS = {
  join_request: { limit: 5, window: 3600 },      // 5 per hour
  create_household: { limit: 5, window: 86400 }, // 5 per day
  regenerate_code: { limit: 10, window: 86400 }, // 10 per day
  remove_member: { limit: 20, window: 86400 },   // 20 per day
  validate_code: { limit: 100, window: 3600 },   // 100 per hour
};
```

### Storage Schema
```sql
CREATE TABLE rate_limit_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,           -- e.g., "join_request:user:123"
  count INTEGER NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(key, window_start)
);

CREATE INDEX idx_rate_limit_key ON rate_limit_counters(key);
CREATE INDEX idx_rate_limit_window ON rate_limit_counters(window_start);
```

### Usage Pattern
```typescript
const rateLimitKey = `join_request:user:${userId}`;
const isAllowed = await checkRateLimit(rateLimitKey, RATE_LIMITS.join_request);

if (!isAllowed) {
  return { error: 'Rate limit exceeded', code: 429 };
}
```

## Performance Considerations

### Query Optimization
- Index on rate_limit_counters(key)
- Periodic cleanup of old counters (cron job)
- Consider Redis for high-traffic scenarios

### Scaling Strategy
- **0-1000 users**: Database counters sufficient
- **1000-10000 users**: Add Redis cache layer
- **10000+ users**: Consider CDN-level rate limiting

## Alternatives Considered

### Alternative 1: API Gateway Rate Limiting
- Use AWS API Gateway or Nginx
- Verdict: Rejected - less flexible, vendor lock-in

### Alternative 2: Redis-based Rate Limiting
- Use Redis INCR with TTL
- Verdict: Deferred - start with DB, migrate if needed

### Alternative 3: No Rate Limiting
- Trust users
- Verdict: Rejected - security risk

## Future Enhancements

### Phase 2 (If needed)
- Migrate to Redis for better performance
- Implement sliding window algorithm
- Add rate limit dashboard for monitoring

### Phase 3 (If needed)
- Implement distributed rate limiting across regions
- Add machine learning for anomaly detection
- Progressive throttling (slow down instead of block)

## Migration Path

If performance becomes an issue:

```typescript
// Phase 1: Database (current)
await checkRateLimit(key, limit); // ~10ms

// Phase 2: Redis (future)
await redisClient.incr(key); // ~1ms

// Phase 3: In-memory + Redis (ultimate)
const cached = memoryCache.get(key);
if (!cached) {
  cached = await redisClient.get(key);
  memoryCache.set(key, cached, 60);
}
```

## Security Implications

### Attack Vectors Mitigated
- ✅ Brute force attacks (code guessing)
- ✅ DoS attacks (spam requests)
- ✅ Resource exhaustion
- ✅ Account enumeration (validation endpoint)

### Monitoring
- Log all rate limit violations
- Alert on sustained violations (potential attack)
- Track legitimate users hitting limits (UX issue)

## References

- OWASP Rate Limiting Best Practices
- Redis Rate Limiting Patterns
- AWS API Gateway Rate Limiting

## Review Schedule

- **Next Review**: 2026-04-01
- **Review Trigger**: If query latency exceeds 50ms or traffic exceeds 1000 req/min
