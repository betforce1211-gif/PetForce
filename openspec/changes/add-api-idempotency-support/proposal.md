# Change: Add API Idempotency Support

## Why

PetForce APIs currently lack idempotency support, which can lead to duplicate operations when network retries occur. This is particularly critical for pet-related data where duplicate registrations, duplicate appointments, or duplicate medication records could cause real-world problems for pet families.

Idempotency keys ensure that retrying the same request (due to network issues or user double-clicks) produces the same result without creating duplicates. This is a fundamental API reliability feature that aligns with our philosophy: "Pets are part of the family, so let's take care of them as simply as we can."

**Real-world scenarios**:
- User registers account, network fails, retries → duplicate accounts without idempotency
- User schedules vet appointment, network timeout, retries → double-booked appointments
- User logs medication dose, slow connection, clicks again → duplicate dose records (safety issue!)

## What Changes

- Add optional `Idempotency-Key` header support to all mutation endpoints (POST, PUT, PATCH, DELETE)
- Design idempotency storage strategy (key → result mapping with TTL)
- Define idempotency key format and validation rules
- Establish idempotency response behavior (return cached result for duplicate keys)
- Document idempotency patterns for API consumers
- Add idempotency validation to API quality checklist

**Key design decisions**:
1. Header-based (industry standard): `Idempotency-Key: <unique-uuid>`
2. Client-generated UUIDs (clients control uniqueness)
3. 24-hour TTL for stored results (balance storage vs. retry window)
4. Applies to mutation operations only (GET is naturally idempotent)
5. Returns original response with `409 Conflict` if key reused with different request body

## Impact

- **Affected specs**: `api-design`, `authentication`, (future: appointments, medications, health-records)
- **Affected code**:
  - `/packages/auth/src/api/auth-api.ts` - Add idempotency to register()
  - Future API middleware for centralized idempotency handling
  - Database/cache layer for idempotency key storage
- **Breaking changes**: None (idempotency keys are optional)
- **Migration required**: No (backward compatible enhancement)
- **Developer experience**: Improved reliability, prevents duplicate operations
- **Pet family impact**: Prevents duplicate accounts, duplicate records, improves trust in system

**Priority**: LOW (future-proofing, not currently blocking issues)
**Estimated effort**: 2-3 hours for design + documentation
