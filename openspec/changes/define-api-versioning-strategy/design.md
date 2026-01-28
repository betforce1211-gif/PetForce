# Design Document: API Versioning Strategy

## Context

PetForce is in early development with a growing API surface. As the platform matures, we'll need to evolve APIs to support new features, improve performance, and address design issues. Without a formal versioning strategy, we risk breaking existing integrations or accumulating technical debt from fear of making necessary changes.

**Current state**: No versioning strategy - all APIs are unversioned
**Desired state**: Clear versioning policy enabling safe API evolution

**Stakeholders**:
- API consumers (web app, mobile apps, future third-party integrations)
- Pet families (indirectly - rely on stable integrations)
- Engineering team (need clear guidelines for API evolution)
- Customer success (need migration support process)

**Constraints**:
- Must support gradual adoption (can't force all clients to migrate immediately)
- Must maintain backward compatibility during transition periods
- Must be simple to understand and implement
- Must follow industry best practices for developer familiarity

## Goals / Non-Goals

**Goals**:
- Enable API evolution without breaking existing clients
- Provide clear migration paths for breaking changes
- Establish consistent versioning across all PetForce APIs
- Build developer trust through predictable versioning
- Support multiple API versions concurrently during migration periods

**Non-Goals**:
- Support infinite versions simultaneously (n-1 policy is sufficient)
- Micro-versioning every small change (only major breaking changes)
- Client-specific API versions (one version serves all clients)
- Content negotiation versioning (URL-based is simpler)

## Decisions

### Decision 1: URL Path Versioning
**Choice**: Version APIs using URL path prefix: `/v1/`, `/v2/`, `/v3/`

**Example**:
```
Current (unversioned): /auth/register
Future (versioned):    /v1/auth/register
                       /v2/auth/register
```

**Rationale**:
- **Industry standard**: Stripe, Twilio, GitHub, Shopify all use URL path versioning
- **Developer familiarity**: Most API consumers expect URL-based versions
- **Cache-friendly**: Different URLs = separate cache entries (no header-based cache confusion)
- **Simple routing**: API gateway can route by URL prefix easily
- **Explicit**: Version is visible in every request (good for debugging)

**Alternatives considered**:
- **Header versioning** (`Accept: application/vnd.petforce.v1+json`)
  - Rejected: More complex, harder to debug, not cache-friendly, less common
- **Query parameter** (`/auth/register?version=1`)
  - Rejected: URLs get cached/logged, easy to forget, not RESTful
- **Subdomain** (`v1.api.petforce.com`)
  - Rejected: DNS/certificate complexity, harder to manage

### Decision 2: Major Version Increments Only
**Choice**: Use major version numbers only (v1, v2, v3), not semantic versioning (v1.2.3)

**Rationale**:
- **Simplicity**: Easier for developers to understand and remember
- **Breaking changes only**: Only increment version for breaking changes
- **Non-breaking changes**: Add to current version without incrementing
- **Industry pattern**: Most REST APIs use major versions only

**When to increment version**:
```
INCREMENT (v1 → v2):
- Removing fields from responses
- Changing field types (string → number)
- Removing endpoints
- Changing error response format
- Changing authentication requirements
- Renaming fields or resources

DON'T INCREMENT (stay on v1):
- Adding new endpoints
- Adding new optional fields to requests
- Adding new fields to responses
- Adding new enum values
- Improving error messages
- Performance improvements
- Bug fixes
```

**Alternatives considered**:
- **Full semantic versioning** (v1.2.3)
  - Rejected: Overkill for REST APIs, confusing (which minor version to use?)
- **Date-based versioning** (2026-01-25)
  - Rejected: Hard to compare versions, unclear what changed
- **No versioning**
  - Rejected: Can't evolve API without breaking clients

### Decision 3: Deprecation Policy with 6-Month Minimum
**Choice**: Old versions must be supported for minimum 6 months after new version release

**Deprecation timeline**:
```
Day 0:   Release v2, announce v1 deprecation with sunset date
         - v1 still works normally
         - v1 returns Deprecation and Sunset headers
         - Migration guide published

Month 1-5: Active migration period
           - Monitor v1 usage metrics
           - Support customers migrating to v2
           - Proactive outreach to heavy v1 users

Month 6:   Earliest possible sunset date
           - Can extend if significant v1 usage remains
           - Final warning announcements

Sunset:    v1 endpoints return 410 Gone
           - Clear error message with migration guide link
           - Redirect customers to v2 documentation
```

**Required sunset headers**:
```http
Deprecation: true
Sunset: Sat, 25 Jul 2026 00:00:00 GMT
Link: </v2/auth/register>; rel="successor-version"
```

**Rationale**:
- **6 months**: Industry standard minimum (Stripe uses 6-12 months)
- **Predictable**: Developers can plan migrations with confidence
- **Flexible**: Can extend if needed, but never shorten
- **Clear communication**: Headers + announcements + docs = no surprises

**Alternatives considered**:
- **3-month deprecation**
  - Rejected: Too short for enterprise customers with change management processes
- **12-month minimum**
  - Rejected: Too long, slows down API evolution, maintenance burden
- **Immediate breaking changes**
  - Rejected: Destroys developer trust, breaks integrations

### Decision 4: n-1 Version Support Policy
**Choice**: Support current version (n) and one previous version (n-1) simultaneously

**Example**:
```
Scenario: We're releasing v3

Supported versions:
- v3 (current) - Full support, recommended for all new integrations
- v2 (previous) - Supported but deprecated, sunset in 6 months
- v1 (old) - Sunset, returns 410 Gone

Version lifecycle:
v1 release    → v1 is current
v2 release    → v2 is current, v1 is deprecated (6 months to migrate)
v2 + 6 months → v1 sunset (410 Gone)
v3 release    → v3 is current, v2 is deprecated (6 months to migrate)
v3 + 6 months → v2 sunset (410 Gone)
```

**Rationale**:
- **Balance**: Supports migrations without maintaining too many versions
- **Predictable**: Developers know old versions will eventually sunset
- **Manageable**: Engineering team maintains max 2 versions at once
- **Upgrade incentive**: Encourages staying current

**Alternatives considered**:
- **Support all versions forever**
  - Rejected: Unsustainable maintenance burden, security risks
- **Only support current version**
  - Rejected: Doesn't allow migration time, breaks trust
- **Support n-2 (3 versions)**
  - Rejected: More complexity than needed for early-stage product

### Decision 5: Breaking Change = New Version Always
**Choice**: Any breaking change requires a new major version, no exceptions

**Breaking change examples**:
```typescript
// BREAKING: Removing field
v1: { id: string, email: string, name: string }
v2: { id: string, email: string }  // name removed

// BREAKING: Changing type
v1: { age: string }  // "25"
v2: { age: number }  // 25

// BREAKING: Renaming field
v1: { firstName: string }
v2: { first_name: string }  // different name

// BREAKING: Required field
v1: { email?: string }  // optional
v2: { email: string }   // required

// NOT BREAKING: Adding field
v1: { id: string, email: string }
v1: { id: string, email: string, name?: string }  // new optional field

// NOT BREAKING: New endpoint
v1: GET /users
v1: GET /users/{id}  // new endpoint added
```

**Rationale**:
- **Developer trust**: Clients never break unexpectedly within a version
- **Clear contracts**: Version number communicates compatibility guarantee
- **Safe evolution**: Encourages thoughtful API design changes

**Alternatives considered**:
- **Allow minor breaking changes within versions**
  - Rejected: Defeats purpose of versioning, breaks trust
- **Use feature flags for breaking changes**
  - Rejected: Too complex, harder to reason about behavior

## Risks / Trade-offs

### Risk 1: Version Sprawl
**Risk**: Too many versions become maintenance nightmare

**Mitigation**:
- n-1 support policy limits active versions to 2
- Strict 6-month minimum (not indefinite) sunset timeline
- Proactive customer outreach during deprecation period
- Monitor version usage metrics and accelerate sunsets if usage is low
- Automated testing across supported versions

**Trade-off**: Version maintenance burden vs. backward compatibility guarantees

### Risk 2: Slow Adoption of New Versions
**Risk**: Customers stay on old versions, delaying sunsets

**Mitigation**:
- Make v2 clearly better (performance, features, DX improvements)
- Provide comprehensive migration guides with code examples
- Offer migration support from customer success team
- Track and report migration progress internally
- Highlight new version benefits in announcements

**Trade-off**: Customer convenience vs. API evolution velocity

### Risk 3: Documentation Maintenance
**Risk**: Multiple version docs become out of sync or confusing

**Mitigation**:
- Automated doc generation from OpenAPI specs
- Clear version selector in documentation UI
- Highlight current version prominently
- Archive old version docs after sunset (read-only)
- Single source of truth (OpenAPI spec) for each version

**Trade-off**: Documentation complexity vs. multi-version support

### Risk 4: Incomplete Migration Tracking
**Risk**: Don't know which customers are on which versions

**Mitigation**:
- Log API version in every request
- Dashboard showing version usage by customer
- Automated alerts when heavily-used versions near sunset
- API key → version mapping for proactive outreach
- Include version in customer success dashboards

**Trade-off**: Monitoring overhead vs. migration visibility

## Migration Plan

### Phase 1: Establish Strategy (This Change)
1. Complete this design document
2. Review and approve versioning strategy
3. Document standards in API Design spec
4. Create migration guide template

### Phase 2: Baseline Current APIs
1. Designate all current endpoints as v1
2. Add `/v1/` prefix to all endpoints
3. Maintain unversioned aliases temporarily (backward compat)
4. Update SDKs to use `/v1/` endpoints
5. Update all documentation

### Phase 3: Infrastructure Setup
1. Configure API gateway for version-based routing
2. Set up per-version OpenAPI specs
3. Implement version usage tracking
4. Create version migration dashboard

### Phase 4: Documentation
1. Create comprehensive versioning documentation
2. Publish migration guide template
3. Document breaking vs. non-breaking changes
4. Create version selection guide for developers

### Phase 5: Future Version Releases
1. Follow versioning strategy for all breaking changes
2. Announce deprecations with 6-month notice
3. Provide migration guides for each version
4. Monitor and support migrations
5. Sunset old versions per policy

### Rollback Plan
- Versioning is a policy, not code - can adjust policy based on feedback
- If `/v1/` adoption is slow, extend unversioned alias period
- Can extend sunset timelines if needed (never shorten)
- Strategy is flexible - can evolve based on learnings

## Open Questions

1. **Should we version the entire API or per-resource?**
   - Example: `/v1/auth/register` + `/v2/pets/create` (mixed versions)
   - Decision: Entire API versioned together (simpler, more predictable)
   - Rationale: Mixed versions are confusing, hard to document

2. **How to handle backward-incompatible security fixes?**
   - Example: Critical security fix that changes API behavior
   - Decision: Security fixes can break compatibility within a version (with loud announcement)
   - Rationale: Security > backward compatibility in emergency situations
   - Mitigation: Extremely rare, well-communicated, expedited migration support

3. **Should we support API version negotiation?**
   - Example: Client requests `/auth/register`, server returns latest compatible version
   - Decision: No - explicit versions only
   - Rationale: Keeps behavior predictable and debuggable

4. **How to version webhooks?**
   - Example: Webhook payloads need versioning too
   - Decision: Defer to future webhook design (not in scope for v1)
   - Owner: Axel (API Design) when webhook design occurs

5. **Should SDKs support multiple versions?**
   - Example: TypeScript SDK can target v1 or v2
   - Decision: SDKs target one version at a time, release new SDK for new API version
   - Rationale: Simpler SDK code, clear upgrade path

---

**Document Owner**: Axel (API Design)
**Reviewers**: Engrid (implementation), Thomas (documentation), Peter (business impact)
**Status**: Draft - Ready for Review
**Last Updated**: 2026-01-25
