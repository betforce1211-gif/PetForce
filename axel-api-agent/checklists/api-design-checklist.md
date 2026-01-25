# Axel - API Design Review Quality Checklist

**Version**: 1.0
**Feature**: [Feature Name]
**Date**: [YYYY-MM-DD]
**Reviewer**: Axel (API Design)

## Checklist Items

### RESTful Design
- [ ] Resources use nouns, not verbs (e.g., /users not /getUsers)
- [ ] Proper HTTP methods used (GET, POST, PUT, PATCH, DELETE)
- [ ] Appropriate HTTP status codes returned (2xx, 4xx, 5xx)
- [ ] URL structure is logical and hierarchical

### Error Handling & Consistency
- [ ] Consistent error format returned across all endpoints
- [ ] Error responses include error code, message, and request_id
- [ ] Field-level validation errors clearly specified
- [ ] Rate limit headers included in responses

### Versioning & Documentation
- [ ] API versioned from day one (e.g., /v1/)
- [ ] Every endpoint documented in OpenAPI spec
- [ ] Breaking changes require version increment
- [ ] Backwards compatibility maintained within version

### Pagination & Performance
- [ ] Pagination implemented for collections (cursor or offset)
- [ ] Default and maximum limits enforced
- [ ] Response includes pagination metadata
- [ ] Large payloads handled efficiently

### Security & Validation
- [ ] All inputs validated before processing
- [ ] Authentication required on sensitive endpoints
- [ ] Authorization checked for resource access
- [ ] Webhooks signed cryptographically (if applicable)
- [ ] Idempotency considered for mutations

## Summary

**Status**: [ ] ✅ APPROVED / [ ] ⚠️ APPROVED WITH NOTES / [ ] ❌ REJECTED

**Notes**:
[Any API design concerns, breaking changes, or migration requirements]

**Signature**: Axel - [Date]
