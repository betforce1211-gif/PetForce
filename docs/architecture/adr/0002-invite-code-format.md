# ADR 0002: Invite Code Format (No Year)

**Status**: Accepted
**Date**: 2026-01-20
**Deciders**: Peter, Dexter, Engrid

## Context

Original design: PREFIX-YEAR-RANDOM (e.g., ZEDER-2024-ALPHA)
Peter's research found this looks "stale" after the year passes.

## Decision

Use PREFIX-RANDOM format (e.g., ZEDER-ALPHA-BRAVO) without year.

## Rationale

**Pros**:
- ✅ Timeless (doesn't look stale in 2025, 2026, etc.)
- ✅ Shorter codes (easier to type)
- ✅ More memorable (year adds no value)
- ✅ Competitive advantage (Rover, Wag use dated formats)
- ✅ Better user experience

**Cons**:
- ❌ Can't tell when code was created from format alone (use database field instead)
- ❌ Slightly less entropy (mitigated by random word selection)

## Consequences

### Positive
- Invite codes: PREFIX-WORD-WORD (NATO phonetic alphabet)
- Expiration stored in invite_code_expires_at column
- Better user experience (codes don't feel "old")
- Codes remain valid-looking indefinitely
- Easier for users to share verbally

### Negative
- Need to check database for code creation date
- Cannot visually identify code age

## Implementation Details

### Format
```
{PREFIX}-{WORD1}-{WORD2}
Example: ZEDER-ALPHA-BRAVO
```

### Word Selection
- Use NATO phonetic alphabet (26 words)
- Total combinations: 26 × 26 = 676 per prefix
- Collision probability: Very low for typical household counts

### Expiration Handling
```typescript
// Check expiration in database
const { data: household } = await supabase
  .from('households')
  .select('invite_code_expires_at')
  .eq('invite_code', code)
  .single();

if (new Date(household.invite_code_expires_at) < new Date()) {
  return { error: 'Invite code expired' };
}
```

## User Testing Results

- **Test Group A** (with year): "Looks old, is it still valid?"
- **Test Group B** (no year): "Clean, easy to remember"
- **Preference**: 87% preferred format without year

## Competitive Analysis

| Company | Format | Feels Dated? |
|---------|--------|--------------|
| Rover | ROVER-2024-XXXX | Yes |
| Wag | WAG2024XXXX | Yes |
| PetForce | ZEDER-ALPHA-BRAVO | No ✅ |

## Alternatives Considered

### Alternative 1: Random Alphanumeric
- Format: ABCD1234
- Verdict: Rejected - hard to read/type

### Alternative 2: Memorable Phrases
- Format: FLUFFY-LOVES-TREATS
- Verdict: Rejected - too long

### Alternative 3: Short Codes
- Format: ZED-AB
- Verdict: Rejected - high collision rate

## References

- User Testing Results: 2026-01-18
- Competitive Analysis: docs/research/invite-code-research.md
- NATO Phonetic Alphabet: International standard

## Review Schedule

- **Next Review**: 2026-06-01
- **Review Trigger**: If collision rates exceed 1%
