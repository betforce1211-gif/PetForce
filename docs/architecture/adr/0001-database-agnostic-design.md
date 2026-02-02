# ADR 0001: Database-Agnostic Design

**Status**: Accepted
**Date**: 2026-01-15
**Deciders**: Engrid, Peter, Isabel

## Context

We need to design the household management system's data layer. We must decide whether to:
1. Use Supabase-specific features (auth.users FK, Supabase functions)
2. Use custom tables with standard SQL

## Decision

We will use custom tables with standard SQL (no Supabase-specific dependencies).

## Rationale

**Pros**:
- ✅ Portable across database providers (PostgreSQL, MySQL, etc.)
- ✅ No vendor lock-in (can migrate from Supabase if needed)
- ✅ Standard SQL is well-documented
- ✅ Easier to test locally without Supabase
- ✅ Future-proof for multi-cloud strategy

**Cons**:
- ❌ More code (can't use auth.users directly)
- ❌ Manual user_id management
- ❌ Miss some Supabase-specific optimizations

## Consequences

### Positive
- All household tables reference user_id as UUID (not FK to auth.users)
- RLS policies reference auth.uid() but don't depend on auth.users table
- Easier migration path to any PostgreSQL provider
- Follows pattern established in user_registrations table
- Can run full test suite without external dependencies

### Negative
- Need to maintain user_id synchronization manually
- Cannot leverage Supabase auth triggers directly
- Slightly more complex query patterns

## Implementation Details

### Table Design
```sql
CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leader_id UUID NOT NULL,  -- NOT a FK to auth.users
  name TEXT NOT NULL,
  ...
);
```

### RLS Policies
```sql
-- Can still use auth.uid() in policies
CREATE POLICY "Users can view their households"
  ON households
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_id = households.id
        AND user_id = auth.uid()
        AND status = 'active'
    )
  );
```

## Alternatives Considered

### Alternative 1: Full Supabase Integration
- Use `REFERENCES auth.users(id)` foreign keys
- Use Supabase auth triggers
- Verdict: Rejected due to vendor lock-in

### Alternative 2: Custom Auth System
- Build own auth system
- Verdict: Rejected - reinventing the wheel

## References

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- PetForce Technical Standards v2.1

## Review Schedule

- **Next Review**: 2026-07-01
- **Review Trigger**: If migrating away from Supabase
