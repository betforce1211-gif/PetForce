# Household API Test Fixes - Remaining Work

## Current Status
- **18/44 tests passing** (41% pass rate)
- **26 tests failing** - all due to mock setup issues

## Root Cause
All failing tests use the old `mockTableQuery` pattern which doesn't work properly with the mock chain. The successful pattern is to create individual mock objects for each `from()` call.

## Pattern to Apply

### OLD (broken) pattern:
```typescript
mockTableQuery.single.mockResolvedValueOnce({
  data: { ...},
  error: null,
});
```

### NEW (working) pattern:
```typescript
const mockCalls = [
  {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: {...},
      error: null,
    }),
  },
  // ... more calls
];

let callIndex = 0;
mockSupabase.from.mockImplementation(() => mockCalls[callIndex++]);
```

### Special case - Double eq() calls:
For queries with TWO `.eq()` calls (like member count checks):
```typescript
{
  select: vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: Array(15),
        error: null,
      }),
    }),
  }),
},
```

## Remaining Test Groups to Fix

### 1. respondToJoinRequest() - 5 tests
- Lines 869-1030
- Patterns: select().single(), update().eq(), insert()

### 2. removeMember() - 5 tests
- Lines 1033-1166
- Patterns: select().single(), update().eq()

### 3. regenerateInviteCode() - 3 tests
- Lines 1172-1259
- Patterns: select().single(), select().single() (code check), update().eq()

### 4. leaveHousehold() - 5 tests
- Lines 1265-1479
- Patterns: select().single(), select().order(), update().eq() (multiple)

### 5. withdrawJoinRequest() - 4 tests
- Lines 1485-1571
- Patterns: select().single(), update().eq()

### 6. sendEmailInvite() - 3 tests
- Lines 1578-1660
- Patterns: select().single()

## Estimated Time
- ~2-3 hours to manually fix all remaining tests
- OR ~30 minutes to write automated script to fix them all

## Next Steps
1. Complete test fixes (priority)
2. Verify all 44 tests pass
3. Check coverage >80%
4. Commit fixes
5. Move to Phase 3 (Zustand store)
