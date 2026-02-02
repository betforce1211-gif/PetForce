# API Versioning Strategy

## Overview

PetForce Household API uses URL-based versioning to ensure backward compatibility while enabling continuous improvement.

**Current Version**: v1
**Versioning Scheme**: Semantic Versioning (SemVer)
**Deprecation Policy**: 12 months minimum notice

---

## Approach

### URL-Based Versioning

All API endpoints include version in the URL path:

```
https://api.petforce.app/v1/households
https://api.petforce.app/v2/households
```

**Why URL-based?**
- ✅ Clear and explicit
- ✅ Easy to cache (different URLs = different cache keys)
- ✅ Simple to route
- ✅ No custom headers required

**Alternatives considered**:
- Header-based (`Accept: application/vnd.petforce.v1+json`) - Rejected: harder to cache
- Query parameter (`/households?version=1`) - Rejected: ugly URLs

---

## Version Lifecycle

### 1. Active (Current)
- **Status**: Fully supported
- **Updates**: Bug fixes, security patches, minor enhancements
- **Deprecation**: Not planned

**Current**: v1 (2026-01-15 - present)

### 2. Supported (Previous)
- **Status**: Maintained but not actively developed
- **Updates**: Critical bug fixes, security patches only
- **Deprecation**: Announced with 12 months notice

**None yet** (v1 is first version)

### 3. Deprecated (Sunset)
- **Status**: Will be removed
- **Updates**: None (emergency security only)
- **Timeline**: 12 months from deprecation announcement

**None yet**

### 4. Removed (End of Life)
- **Status**: No longer available
- **Updates**: None
- **Action**: Clients must upgrade

**None yet**

---

## Versioning Rules

### Major Version (v1 → v2)

**Triggers**:
- Breaking changes to request/response format
- Endpoint removal or significant restructuring
- Authentication changes
- Database schema breaking changes

**Example**:
```typescript
// v1
POST /v1/households
{
  "name": "The Smith House"
}

// v2 (breaking: requires additional field)
POST /v2/households
{
  "name": "The Smith House",
  "type": "family"  // NEW REQUIRED FIELD
}
```

### Minor Version (v1.1 → v1.2)

**Triggers**:
- New endpoints
- New optional fields in requests
- New fields in responses
- Non-breaking enhancements

**Example**:
```typescript
// v1.0
GET /v1/households/me
{
  "id": "123",
  "name": "The Smith House"
}

// v1.1 (non-breaking: new optional field)
GET /v1/households/me
{
  "id": "123",
  "name": "The Smith House",
  "qr_code_url": "https://..."  // NEW FIELD
}
```

**Backward Compatible**: Old clients ignore new fields

### Patch Version (v1.1.0 → v1.1.1)

**Triggers**:
- Bug fixes
- Security patches
- Performance improvements
- Documentation updates

**Example**: Fix response time from 450ms to 290ms (no API changes)

---

## Current Version

### v1.0.0 (2026-01-15)

**Status**: ✅ Active

**Endpoints**:
```
POST   /v1/households                   Create household
GET    /v1/households/me                Get user's household
POST   /v1/households/join              Join household
GET    /v1/households/me/members        List members
POST   /v1/households/me/approve        Approve join request
POST   /v1/households/me/remove         Remove member
POST   /v1/households/me/regenerate     Regenerate invite code
```

**Authentication**: JWT bearer token

**Rate Limits**:
- Join requests: 5/hour
- Create household: 5/day
- Code regeneration: 10/day

---

## Future Versions

### v2.0.0 (Planned Q2 2026)

**Status**: 📋 Planned

**New Features**:
- GraphQL API alongside REST
- WebSocket support for real-time updates
- Webhook subscriptions
- Advanced analytics
- Multi-household support

**Breaking Changes**:
- None planned (fully backward compatible)
- v1 will remain available

**Migration Path**:
- v1 continues working
- Gradual rollout of v2 features
- 12 months dual support

---

## Deprecation Process

### Step 1: Announcement (Month 0)
- Blog post + email to all API users
- Update documentation with deprecation notice
- Add `X-API-Deprecation` header to responses

```http
X-API-Deprecation: This API version is deprecated. Please migrate to v2 by 2027-01-01.
X-API-Sunset: 2027-01-01
```

### Step 2: Grace Period (Months 1-12)
- Continue full support for deprecated version
- Provide migration tools and guides
- Offer migration assistance

### Step 3: Sunset Warning (Months 10-12)
- Increased frequency of deprecation notices
- Email reminders to remaining users
- Track migration progress

### Step 4: Removal (Month 12+)
- Disable deprecated endpoints
- Return `410 Gone` status
- Redirect to migration guide

```http
HTTP/1.1 410 Gone
Content-Type: application/json

{
  "error": "This API version has been removed",
  "message": "Please migrate to v2",
  "migration_guide": "https://docs.petforce.app/migration/v1-to-v2",
  "sunset_date": "2027-01-01"
}
```

---

## Default Version Behavior

### No Version Specified

Request: `GET /households/me` (no version)
Behavior: Defaults to v1 (current stable)

```http
GET /households/me
→ Redirects to /v1/households/me
```

### Invalid Version

Request: `GET /v99/households/me`
Response: `404 Not Found`

```json
{
  "error": "Invalid API version",
  "message": "Version v99 does not exist",
  "available_versions": ["v1"],
  "documentation": "https://docs.petforce.app/api"
}
```

---

## Version Discovery

### OPTIONS Request

```http
OPTIONS /households
```

Response:
```http
HTTP/1.1 200 OK
X-API-Versions: v1
X-API-Current: v1
X-API-Latest: v1
X-API-Deprecated: none

{
  "versions": {
    "v1": {
      "status": "active",
      "released": "2026-01-15",
      "documentation": "https://docs.petforce.app/api/v1"
    }
  }
}
```

---

## Client Recommendations

### Best Practices

1. **Always specify version explicitly**
   ```typescript
   // Good
   fetch('https://api.petforce.app/v1/households/me')

   // Bad (relies on default)
   fetch('https://api.petforce.app/households/me')
   ```

2. **Monitor deprecation headers**
   ```typescript
   const response = await fetch('...');
   const deprecated = response.headers.get('X-API-Deprecation');
   if (deprecated) {
     console.warn('API version is deprecated:', deprecated);
     // Plan migration
   }
   ```

3. **Use client libraries**
   ```typescript
   // Client library handles versioning
   import { HouseholdClient } from '@petforce/household';
   const client = new HouseholdClient(apiKey, { version: 1 });
   ```

4. **Test against multiple versions**
   ```typescript
   // Test backward compatibility
   test('works with v1', () => { /* ... */ });
   test('works with v2', () => { /* ... */ });
   ```

---

## Monitoring

### Metrics to Track

- **Version adoption rate**
  - % of requests using each version
  - Migration velocity (deprecated → current)

- **Error rates by version**
  - Catch breaking changes quickly
  - Identify migration issues

- **Performance by version**
  - Compare latency across versions
  - Ensure new versions improve performance

### Dashboards

```
Version Distribution (Last 30 days)
- v1: 100%
- v2: 0%

Deprecated Version Usage
- None (v1 is current)

Migration Progress (when applicable)
- Not applicable
```

---

## Communication Channels

### Where We Announce Changes

1. **Developer Blog**: [blog.petforce.dev](https://blog.petforce.dev)
2. **API Status Page**: [status.petforce.app](https://status.petforce.app)
3. **Email**: Direct to registered API users
4. **Slack**: #api-announcements
5. **GitHub**: Release notes in repo
6. **Documentation**: Versioned docs site

---

## Support

- **Documentation**: [docs.petforce.app/api](https://docs.petforce.app/api)
- **Migration Guides**: [docs.petforce.app/migration](https://docs.petforce.app/migration)
- **API Status**: [status.petforce.app](https://status.petforce.app)
- **Support Email**: api-support@petforce.app
- **Slack Community**: #api-help

---

## References

- [Semantic Versioning 2.0.0](https://semver.org/)
- [REST API Versioning Best Practices](https://restfulapi.net/versioning/)
- [Stripe API Versioning](https://stripe.com/docs/api/versioning) (inspiration)

---

**Last Updated**: 2026-02-02
**Next Review**: 2026-06-01
