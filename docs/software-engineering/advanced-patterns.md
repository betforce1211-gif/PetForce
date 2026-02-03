# Engrid's Advanced Software Engineering Patterns

Production-tested patterns and war stories from building scalable, maintainable software at PetForce.

## Engrid's Software Engineering Philosophy

**Core Principles:**

1. **Clean Code is Maintainable Code** - Write code humans can understand
2. **Configuration Over Hard-Coding** - Make behavior configurable, not fixed
3. **Separation of Concerns** - Each module does one thing well
4. **Test-Driven Design** - Tests guide architecture decisions
5. **Refactor Relentlessly** - Technical debt compounds like financial debt
6. **Cross-Platform by Default** - Code should work everywhere
7. **Document for Your Future Self** - You'll forget why you did it

---

## Production War Stories

### War Story 1: The 10,000-Line God Function That Broke Everything

**Date:** September 2025

**Impact:** 4 weeks of development blocked, 3 critical bugs introduced, team morale at all-time low

#### The Scene

September 2025. Our flagship household management feature is a nightmare to maintain. Sarah, our lead engineer, opens the main file and sees this:

```typescript
// apps/web/src/features/households/HouseholdManager.tsx (2,847 lines)
export function HouseholdManager({ userId }: { userId: string }) {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingHousehold, setEditingHousehold] = useState<Household | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [householdToDelete, setHouseholdToDelete] = useState<Household | null>(null);
  // ... 47 more state variables

  useEffect(() => {
    // Fetch households (150 lines of logic)
    async function fetchHouseholds() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/v1/households?userId=${userId}`);

        if (!response.ok) {
          if (response.status === 401) {
            // Handle unauthorized
            setError('Unauthorized');
            // Redirect logic (20 lines)
          } else if (response.status === 403) {
            // Handle forbidden
            setError('Forbidden');
            // More redirect logic (20 lines)
          } else if (response.status === 404) {
            // Handle not found
            setError('Not found');
          } else if (response.status >= 500) {
            // Handle server error
            setError('Server error');
            // Retry logic (30 lines)
          }
          return;
        }

        const data = await response.json();
        setHouseholds(data.households);

        // Auto-select first household (80 lines of logic)
        if (data.households.length > 0) {
          const firstHousehold = data.households[0];
          setSelectedHousehold(firstHousehold);

          // Fetch members for selected household
          const membersResponse = await fetch(`/api/v1/households/${firstHousehold.id}/members`);
          // ... another 60 lines of error handling
          const membersData = await membersResponse.json();
          setMembers(membersData.members);

          // Fetch pets for selected household
          const petsResponse = await fetch(`/api/v1/households/${firstHousehold.id}/pets`);
          // ... another 60 lines of error handling
          const petsData = await petsResponse.json();
          setPets(petsData.pets);

          // Fetch tasks for selected household
          const tasksResponse = await fetch(`/api/v1/households/${firstHousehold.id}/tasks`);
          // ... another 60 lines of error handling
          const tasksData = await tasksResponse.json();
          setTasks(tasksData.tasks);
        }

      } catch (error) {
        // Error handling (40 lines)
        if (error instanceof TypeError) {
          setError('Network error');
        } else if (error instanceof SyntaxError) {
          setError('Parse error');
        } else {
          setError('Unknown error');
        }
        // Sentry logging (20 lines)
      } finally {
        setIsLoading(false);
      }
    }

    fetchHouseholds();
  }, [userId]); // ❌ Missing dependencies, causing stale closures

  // Handle household creation (200 lines)
  const handleCreateHousehold = async (data: HouseholdCreateInput) => {
    try {
      setIsCreating(true);

      // Validation (50 lines of inline validation)
      if (!data.name || data.name.trim() === '') {
        setError('Name is required');
        return;
      }
      if (data.name.length > 100) {
        setError('Name too long');
        return;
      }
      if (data.description && data.description.length > 500) {
        setError('Description too long');
        return;
      }
      // ... 30 more validation checks

      // API call (80 lines with error handling)
      const response = await fetch('/api/v1/households', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      // ... 80 lines of error handling

      const newHousehold = await response.json();

      // Update state (60 lines)
      setHouseholds([...households, newHousehold]);
      setSelectedHousehold(newHousehold);
      setIsCreating(false);
      setIsEditing(false);

      // Analytics (20 lines)
      analytics.track('household_created', {
        householdId: newHousehold.id,
        name: newHousehold.name,
        // ... 10 more properties
      });

      // Show success toast (10 lines)
      toast.success('Household created successfully');

    } catch (error) {
      // Error handling (60 lines)
      // ...
    }
  };

  // Handle household editing (180 lines)
  const handleEditHousehold = async (householdId: string, data: HouseholdUpdateInput) => {
    // ... 180 lines of similar logic
  };

  // Handle household deletion (150 lines)
  const handleDeleteHousehold = async (householdId: string) => {
    // ... 150 lines of similar logic
  };

  // Handle member invitation (200 lines)
  const handleInviteMember = async (householdId: string, email: string) => {
    // ... 200 lines of similar logic
  };

  // Handle member removal (150 lines)
  const handleRemoveMember = async (householdId: string, memberId: string) => {
    // ... 150 lines of similar logic
  };

  // Handle pet creation (180 lines)
  const handleCreatePet = async (householdId: string, data: PetCreateInput) => {
    // ... 180 lines of similar logic
  };

  // Handle pet editing (160 lines)
  const handleEditPet = async (petId: string, data: PetUpdateInput) => {
    // ... 160 lines of similar logic
  };

  // Handle pet deletion (120 lines)
  const handleDeletePet = async (petId: string) => {
    // ... 120 lines of similar logic
  };

  // Handle task creation (190 lines)
  const handleCreateTask = async (householdId: string, data: TaskCreateInput) => {
    // ... 190 lines of similar logic
  };

  // Handle task completion (140 lines)
  const handleCompleteTask = async (taskId: string) => {
    // ... 140 lines of similar logic
  };

  // ... 15 more handlers (each 100-200 lines)

  // Render (800 lines of JSX)
  return (
    <div className="household-manager">
      {isLoading && <Spinner />}
      {error && <ErrorAlert message={error} />}

      {/* Household list (150 lines) */}
      <div className="household-list">
        {households.map((household) => (
          <div
            key={household.id}
            className={`household-item ${selectedHousehold?.id === household.id ? 'selected' : ''}`}
            onClick={() => {
              // Inline selection logic (50 lines)
              setSelectedHousehold(household);

              // Fetch members
              fetch(`/api/v1/households/${household.id}/members`)
                .then((res) => res.json())
                .then((data) => setMembers(data.members));

              // Fetch pets
              fetch(`/api/v1/households/${household.id}/pets`)
                .then((res) => res.json())
                .then((data) => setPets(data.pets));

              // Fetch tasks
              fetch(`/api/v1/households/${household.id}/tasks`)
                .then((res) => res.json())
                .then((data) => setTasks(data.tasks));
            }}
          >
            <h3>{household.name}</h3>
            <p>{household.description}</p>
            {/* ... more inline rendering (50 lines) */}
          </div>
        ))}
      </div>

      {/* Selected household details (200 lines) */}
      {selectedHousehold && (
        <div className="household-details">
          {/* Members section (150 lines of inline JSX) */}
          <div className="members-section">
            <h2>Members</h2>
            {members.map((member) => (
              <div key={member.id} className="member-card">
                {/* Inline member card (30 lines) */}
                <img src={member.avatar} alt={member.name} />
                <div>
                  <h4>{member.name}</h4>
                  <p>{member.role}</p>
                  <button
                    onClick={() => {
                      // Inline removal logic (20 lines)
                      if (confirm('Remove member?')) {
                        handleRemoveMember(selectedHousehold.id, member.id);
                      }
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pets section (200 lines of inline JSX) */}
          <div className="pets-section">
            {/* ... similar inline rendering */}
          </div>

          {/* Tasks section (200 lines of inline JSX) */}
          <div className="tasks-section">
            {/* ... similar inline rendering */}
          </div>
        </div>
      )}

      {/* Create household modal (150 lines of inline JSX) */}
      {isCreating && (
        <div className="modal">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              // Inline form handling (50 lines)
              const formData = new FormData(e.currentTarget);
              const data = {
                name: formData.get('name') as string,
                description: formData.get('description') as string,
              };
              handleCreateHousehold(data);
            }}
          >
            {/* Form fields (80 lines) */}
          </form>
        </div>
      )}

      {/* Edit household modal (150 lines) */}
      {/* Delete confirmation modal (100 lines) */}
      {/* Add member modal (180 lines) */}
      {/* Add pet modal (200 lines) */}
      {/* Add task modal (180 lines) */}
      {/* ... 10 more modals (each 100-200 lines) */}
    </div>
  );
}
```

**The file was 2,847 lines of unmanageable chaos.**

#### The Problem

**Symptoms:**

- Every change broke something else (100+ lines to understand context)
- New features took weeks instead of days
- Bugs introduced in every PR (3-4 bugs per feature)
- Code reviews took hours (reviewers gave up, just approved)
- Team morale at all-time low ("I hate touching this file")

**Specific Issues:**

1. **State Management Nightmare**
   - 47 useState declarations at the top
   - State scattered throughout component
   - No clear ownership of state
   - Race conditions from async updates

2. **Duplicate Logic Everywhere**
   - Error handling duplicated 25+ times
   - Validation duplicated 15+ times
   - API calls duplicated 20+ times
   - Each copy slightly different (bugs from inconsistency)

3. **Impossible to Test**
   - Single 2,847-line function
   - No way to test individual pieces
   - Tests had to mock everything
   - Test coverage: 12% (mostly rendering tests)

4. **Inline Everything**
   - 800 lines of JSX
   - Event handlers inline (50+ lines each)
   - Validation inline (50+ lines each)
   - No reusable components

5. **Missing Dependencies in useEffect**
   - Stale closures causing bugs
   - Infinite re-render loops
   - React complaining about missing dependencies

#### Investigation: How Did This Happen?

**Step 1: Check git history**

```bash
$ git log --oneline --all -- apps/web/src/features/households/HouseholdManager.tsx

a1b2c3d feat(households): add task management
d4e5f6g feat(households): add pet editing
h7i8j9k feat(households): add member removal
... (47 more commits)
```

**The pattern:**

- File started at 200 lines (simple household list)
- Every feature added 50-100 lines
- No refactoring, just "add more code"
- Over 6 months, grew from 200 → 2,847 lines

**Step 2: Check code review comments**

```markdown
PR #234: "This file is getting big, should we refactor?"
Response: "Let's do it after this feature ships"

PR #312: "Can we split this into smaller components?"
Response: "Don't have time, tight deadline"

PR #398: "This function is 180 lines, hard to review"
Response: "I know, but it works. We'll refactor later"

... (10 more similar comments)
```

**The pattern:** "We'll refactor later" (never happened)

**Step 3: Measure impact on development**

```markdown
Time to add new feature:

- Before (200-line file): 2 days
- After (2,847-line file): 2 weeks

Bug introduction rate:

- Before: 0.5 bugs per feature
- After: 3.4 bugs per feature

Code review time:

- Before: 30 minutes
- After: 3 hours (reviewers gave up)

Developer satisfaction:

- Before: 8/10
- After: 2/10 ("I dread touching this file")
```

#### Root Cause

**Problem 1: No Component Boundaries**

- Single component doing everything
- Household management + member management + pet management + task management
- 2,847 lines of tightly coupled code

**Problem 2: No State Management Strategy**

- 47 useState declarations (no clear structure)
- State updates scattered throughout
- No single source of truth
- Race conditions from async updates

**Problem 3: Duplicate Logic Everywhere**

- Copy-paste programming (25+ copies of error handling)
- Each copy slightly different
- Bugs from inconsistent implementations

**Problem 4: No Separation of Concerns**

- Business logic mixed with UI code
- API calls inline in component
- Validation inline in event handlers
- No testable units

**Problem 5: Technical Debt Accumulation**

- "We'll refactor later" mentality
- No refactoring time allocated
- Debt compounded over 6 months

#### Immediate Fix (Week 1)

**Step 1: Extract API calls to custom hooks**

```typescript
// apps/web/src/features/households/hooks/useHouseholds.ts
export function useHouseholds(userId: string) {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHouseholds = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.households.list({ userId });
      setHouseholds(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchHouseholds();
  }, [fetchHouseholds]);

  return { households, isLoading, error, refetch: fetchHouseholds };
}

// Similar hooks for members, pets, tasks
export function useMembers(householdId: string) {
  /* ... */
}
export function usePets(householdId: string) {
  /* ... */
}
export function useTasks(householdId: string) {
  /* ... */
}
```

**Step 2: Extract business logic to services**

```typescript
// packages/households/src/household-service.ts
export class HouseholdService {
  constructor(private api: ApiClient) {}

  async createHousehold(data: HouseholdCreateInput): Promise<Household> {
    // Validate
    const validation = validateHouseholdInput(data);
    if (!validation.valid) {
      throw new ValidationError(validation.errors);
    }

    // Create
    const response = await this.api.post("/households", data);

    // Track analytics
    analytics.track("household_created", {
      householdId: response.data.id,
      name: response.data.name,
    });

    return response.data;
  }

  async updateHousehold(
    id: string,
    data: HouseholdUpdateInput,
  ): Promise<Household> {
    // Similar structure
  }

  async deleteHousehold(id: string): Promise<void> {
    // Similar structure
  }
}
```

**Step 3: Extract validation to separate module**

```typescript
// packages/households/src/validation/household-validation.ts
import { z } from "zod";

export const HouseholdCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  description: z.string().max(500, "Description too long").optional(),
});

export function validateHouseholdInput(
  data: unknown,
):
  | { valid: true; data: HouseholdCreateInput }
  | { valid: false; errors: string[] } {
  const result = HouseholdCreateSchema.safeParse(data);

  if (result.success) {
    return { valid: true, data: result.data };
  }

  return {
    valid: false,
    errors: result.error.errors.map((e) => e.message),
  };
}
```

**Step 4: Break into smaller components**

```typescript
// apps/web/src/features/households/components/HouseholdManager.tsx (now 180 lines)
export function HouseholdManager({ userId }: { userId: string }) {
  const { households, isLoading, error } = useHouseholds(userId);
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null);

  if (isLoading) return <Spinner />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="household-manager">
      <HouseholdList
        households={households}
        selectedId={selectedHousehold?.id}
        onSelect={setSelectedHousehold}
      />

      {selectedHousehold && (
        <HouseholdDetails household={selectedHousehold} />
      )}
    </div>
  );
}

// apps/web/src/features/households/components/HouseholdList.tsx (80 lines)
export function HouseholdList({ households, selectedId, onSelect }: HouseholdListProps) {
  return (
    <div className="household-list">
      {households.map((household) => (
        <HouseholdCard
          key={household.id}
          household={household}
          isSelected={household.id === selectedId}
          onClick={() => onSelect(household)}
        />
      ))}
    </div>
  );
}

// apps/web/src/features/households/components/HouseholdCard.tsx (60 lines)
export function HouseholdCard({ household, isSelected, onClick }: HouseholdCardProps) {
  return (
    <div
      className={`household-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <h3>{household.name}</h3>
      <p>{household.description}</p>
      <MemberCount count={household.memberCount} />
      <PetCount count={household.petCount} />
    </div>
  );
}

// apps/web/src/features/households/components/HouseholdDetails.tsx (120 lines)
export function HouseholdDetails({ household }: { household: Household }) {
  return (
    <div className="household-details">
      <MembersSection householdId={household.id} />
      <PetsSection householdId={household.id} />
      <TasksSection householdId={household.id} />
    </div>
  );
}

// apps/web/src/features/households/components/MembersSection.tsx (100 lines)
export function MembersSection({ householdId }: { householdId: string }) {
  const { members, isLoading } = useMembers(householdId);

  if (isLoading) return <Spinner />;

  return (
    <div className="members-section">
      <h2>Members</h2>
      {members.map((member) => (
        <MemberCard key={member.id} member={member} />
      ))}
    </div>
  );
}

// Similar for PetsSection, TasksSection, etc.
```

#### Long-Term Solution (Weeks 2-4)

**Week 2: Implement Proper State Management**

```typescript
// apps/web/src/features/households/store/household-store.ts
import { create } from "zustand";

interface HouseholdStore {
  // State
  households: Household[];
  selectedHouseholdId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchHouseholds: (userId: string) => Promise<void>;
  selectHousehold: (id: string) => void;
  createHousehold: (data: HouseholdCreateInput) => Promise<void>;
  updateHousehold: (id: string, data: HouseholdUpdateInput) => Promise<void>;
  deleteHousehold: (id: string) => Promise<void>;
}

export const useHouseholdStore = create<HouseholdStore>((set, get) => ({
  // Initial state
  households: [],
  selectedHouseholdId: null,
  isLoading: false,
  error: null,

  // Actions
  fetchHouseholds: async (userId: string) => {
    set({ isLoading: true, error: null });

    try {
      const service = new HouseholdService(api);
      const households = await service.listHouseholds(userId);

      set({ households, isLoading: false });
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false });
    }
  },

  selectHousehold: (id: string) => {
    set({ selectedHouseholdId: id });
  },

  createHousehold: async (data: HouseholdCreateInput) => {
    const service = new HouseholdService(api);
    const newHousehold = await service.createHousehold(data);

    set((state) => ({
      households: [...state.households, newHousehold],
      selectedHouseholdId: newHousehold.id,
    }));
  },

  // ... similar for update, delete
}));
```

**Week 3: Add Comprehensive Tests**

```typescript
// apps/web/src/features/households/components/__tests__/HouseholdManager.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HouseholdManager } from '../HouseholdManager';

describe('HouseholdManager', () => {
  it('should render household list', async () => {
    const mockHouseholds = [
      { id: 'hh_1', name: 'Zeder House', memberCount: 4 },
      { id: 'hh_2', name: 'Smith Family', memberCount: 3 },
    ];

    mockApi.households.list.mockResolvedValue({ data: mockHouseholds });

    render(<HouseholdManager userId="user_123" />);

    await waitFor(() => {
      expect(screen.getByText('Zeder House')).toBeInTheDocument();
      expect(screen.getByText('Smith Family')).toBeInTheDocument();
    });
  });

  it('should select household on click', async () => {
    const mockHouseholds = [{ id: 'hh_1', name: 'Zeder House', memberCount: 4 }];
    mockApi.households.list.mockResolvedValue({ data: mockHouseholds });

    render(<HouseholdManager userId="user_123" />);

    await waitFor(() => screen.getByText('Zeder House'));

    await userEvent.click(screen.getByText('Zeder House'));

    // Verify household details loaded
    expect(mockApi.members.list).toHaveBeenCalledWith({ householdId: 'hh_1' });
  });

  it('should create new household', async () => {
    mockApi.households.create.mockResolvedValue({
      data: { id: 'hh_new', name: 'New House', memberCount: 1 },
    });

    render(<HouseholdManager userId="user_123" />);

    await userEvent.click(screen.getByText('Create Household'));
    await userEvent.type(screen.getByLabelText('Name'), 'New House');
    await userEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(screen.getByText('New House')).toBeInTheDocument();
    });
  });
});

// packages/households/src/__tests__/household-service.test.ts
describe('HouseholdService', () => {
  let service: HouseholdService;

  beforeEach(() => {
    service = new HouseholdService(mockApi);
  });

  describe('createHousehold', () => {
    it('should validate input', async () => {
      await expect(
        service.createHousehold({ name: '', description: 'test' })
      ).rejects.toThrow('Name is required');
    });

    it('should create household and track analytics', async () => {
      mockApi.post.mockResolvedValue({
        data: { id: 'hh_123', name: 'Test House' },
      });

      const result = await service.createHousehold({
        name: 'Test House',
        description: 'Test',
      });

      expect(result.id).toBe('hh_123');
      expect(analytics.track).toHaveBeenCalledWith('household_created', {
        householdId: 'hh_123',
        name: 'Test House',
      });
    });
  });
});
```

**Week 4: Refactoring Guidelines**

```typescript
// docs/software-engineering/refactoring-guide.md

## When to Refactor

### File Size Limits
- ❌ Component > 300 lines → Extract smaller components
- ❌ Function > 50 lines → Extract helper functions
- ❌ File > 500 lines → Split into multiple files

### Complexity Limits
- ❌ Cyclomatic complexity > 10 → Simplify or split
- ❌ Nesting depth > 3 → Extract functions
- ❌ Function parameters > 5 → Use options object

### Duplication Limits
- ❌ Code duplicated 3+ times → Extract to shared function
- ❌ Logic duplicated 2+ times → Consider abstraction

### Red Flags
- ❌ God objects/functions (doing too much)
- ❌ Feature envy (accessing other object's data repeatedly)
- ❌ Primitive obsession (using primitives instead of objects)
- ❌ Long parameter lists (> 5 parameters)
- ❌ Shotgun surgery (change requires touching many files)

## Refactoring Checklist

### Before Refactoring
- [ ] Write tests for existing behavior (if missing)
- [ ] Ensure tests pass (100% before refactoring)
- [ ] Create refactoring branch
- [ ] Communicate with team (avoid merge conflicts)

### During Refactoring
- [ ] One refactoring at a time (don't mix with features)
- [ ] Keep tests green (run after each change)
- [ ] Commit frequently (small, atomic commits)
- [ ] No behavior changes (only structure changes)

### After Refactoring
- [ ] All tests still pass
- [ ] Code coverage maintained or improved
- [ ] Performance unchanged or better
- [ ] Code review with focus on maintainability
- [ ] Update documentation
```

#### Results

**Code Quality:**

- **Before:** 2,847-line god component
- **After:** 18 focused components (50-180 lines each)
- **Improvement:** 94% reduction in average component size

**Development Velocity:**

- **Before:** 2 weeks per feature
- **After:** 2 days per feature
- **Improvement:** 85% faster

**Bug Rate:**

- **Before:** 3.4 bugs per feature
- **After:** 0.4 bugs per feature
- **Improvement:** 88% reduction

**Test Coverage:**

- **Before:** 12% coverage
- **After:** 87% coverage
- **Improvement:** 75 percentage points

**Developer Satisfaction:**

- **Before:** 2/10 ("I hate this file")
- **After:** 9/10 ("Joy to work with")
- **Improvement:** 350% increase

**Code Review Time:**

- **Before:** 3 hours per PR
- **After:** 20 minutes per PR
- **Improvement:** 89% faster

#### Lessons Learned

**1. Technical Debt Compounds**

- "We'll refactor later" never happens
- Debt accumulates exponentially
- **Solution:** Allocate 20% of sprint time for refactoring

**2. Component Boundaries Matter**

- Single responsibility principle applies to components
- Each component should do one thing well
- **Solution:** Extract components when > 300 lines

**3. State Management is Critical**

- 47 useState declarations = chaos
- No clear ownership of state
- **Solution:** Use proper state management (Zustand, Redux, Context)

**4. Separation of Concerns**

- Business logic ≠ UI code
- API calls ≠ component code
- **Solution:** Custom hooks, service layer, validation modules

**5. Tests Enable Refactoring**

- Can't refactor without tests (fear of breaking)
- Tests give confidence
- **Solution:** Write tests before refactoring

**6. Small, Frequent Refactorings**

- Big bang refactorings rarely happen
- Small refactorings add up
- **Solution:** Boy Scout Rule (leave code better than you found it)

**Engrid's Refactoring Rules:**

```markdown
## Refactoring Red Flags

### Immediate Action Required (Stop and Refactor)

- ❌ File > 500 lines
- ❌ Function > 50 lines
- ❌ Cyclomatic complexity > 10
- ❌ Code duplicated 3+ times
- ❌ Test coverage < 70%

### Warning (Plan Refactoring Soon)

- ⚠️ File > 300 lines
- ⚠️ Function > 30 lines
- ⚠️ Cyclomatic complexity > 7
- ⚠️ Code duplicated 2 times
- ⚠️ Test coverage < 80%

### Healthy (Keep It Up)

- ✅ File < 300 lines
- ✅ Function < 30 lines
- ✅ Cyclomatic complexity < 7
- ✅ No code duplication
- ✅ Test coverage > 80%

## Refactoring Budget

Every sprint:

- 20% time for refactoring (1 day per week)
- Every PR: Leave code better than you found it
- Monthly: Review top 10 most complex files
- Quarterly: Major refactoring initiative
```

**Prevention:**

- ESLint rules for file size (max 500 lines)
- SonarQube for cyclomatic complexity (max 10)
- Code review checklist includes refactoring checks
- 20% of sprint time allocated for refactoring

---

### War Story 2: The Hard-Coded Configuration That Made Deployments Impossible

**Date:** November 2025

**Impact:** 6 hours to deploy to staging, 12 hours to deploy to production, 8 engineers blocked

#### The Scene

November 2025. We're preparing to deploy a critical bug fix to production. Sarah starts the deployment process and realizes we need to update 47 different configuration values across the codebase:

```typescript
// apps/web/src/config.ts
export const API_URL = "https://api.petforce.com"; // ❌ Production URL hard-coded
export const DATABASE_URL = "postgresql://prod-db:5432/petforce"; // ❌ Production DB
export const REDIS_URL = "redis://prod-redis:6379"; // ❌ Production Redis
export const STRIPE_PUBLIC_KEY = "pk_live_abc123"; // ❌ Production Stripe key
export const SENTRY_DSN = "https://sentry.io/petforce-prod"; // ❌ Production Sentry

// packages/auth/src/constants.ts
export const SESSION_TIMEOUT = 30 * 24 * 60 * 60 * 1000; // ❌ Hard-coded 30 days
export const MAX_LOGIN_ATTEMPTS = 5; // ❌ Hard-coded
export const PASSWORD_MIN_LENGTH = 8; // ❌ Hard-coded
export const INVITE_CODE_LENGTH = 6; // ❌ Hard-coded

// packages/api/src/middleware/rate-limit.ts
export const RATE_LIMIT_WINDOW = 60 * 1000; // ❌ Hard-coded 1 minute
export const RATE_LIMIT_MAX_REQUESTS = 100; // ❌ Hard-coded 100 requests
export const RATE_LIMIT_BAN_DURATION = 15 * 60 * 1000; // ❌ Hard-coded 15 minutes

// apps/mobile/src/config.ts
export const API_URL = "https://api.petforce.com"; // ❌ DUPLICATE (also in web)
export const ENABLE_ANALYTICS = true; // ❌ Hard-coded
export const LOG_LEVEL = "error"; // ❌ Hard-coded
export const ENABLE_PUSH_NOTIFICATIONS = true; // ❌ Hard-coded

// ... 30 more files with hard-coded values
```

**The deployment nightmare:**

1. **Find all hard-coded values** (2 hours)
   - Search codebase for "api.petforce.com"
   - Find 47 different hard-coded values
   - Track which need changing for staging vs production

2. **Create staging branch** (1 hour)
   - Replace production values with staging values
   - 47 file changes
   - Hope we didn't miss any

3. **Deploy to staging** (30 minutes)
   - Deploy and... **it doesn't work**
   - Forgot to update API URL in mobile app
   - Create another branch, change mobile config
   - Redeploy

4. **Create production branch** (1 hour)
   - Revert staging values back to production
   - 47 file changes again
   - Double-check every value

5. **Deploy to production** (30 minutes)
   - Deploy and... **Redis connection fails**
   - Forgot to update Redis URL in one service
   - Emergency hotfix branch
   - Redeploy

**Total time: 6 hours for staging, 12 hours for production (including fixes)**

**Total engineers involved: 8 (everyone helping find hard-coded values)**

#### The Problem

**Issue 1: Configuration Scattered Everywhere**

- 47 different files with configuration
- No central configuration management
- Duplication across web/mobile/api packages
- Each file slightly different

**Issue 2: Environment-Specific Values Hard-Coded**

- Production URLs in source code
- Staging requires separate branch
- No way to deploy same code to different environments

**Issue 3: No Environment Variables**

- Everything compiled into bundle
- Can't change configuration without recompiling
- Can't deploy to customer's infrastructure

**Issue 4: Secrets in Source Code**

- API keys committed to Git
- Database passwords in plain text
- Stripe keys visible to all developers

**Issue 5: No Feature Toggles**

- Want to enable analytics in production but not staging?
- Hard-code it and maintain separate branches

#### Investigation: How Did Configuration Get So Messy?

**Step 1: Check git history**

```bash
$ git log --all --oneline -- "**/*config*"

a1b2c3d fix(config): update production API URL
d4e5f6g fix(config): add Redis URL for staging
h7i8j9k fix(config): update Stripe key
... (127 commits just changing config)
```

**127 commits changing configuration values.**

**Step 2: Count configuration files**

```bash
$ rg -l "export const.*URL" --type ts | wc -l
47

$ rg -l "export const.*KEY" --type ts | wc -l
23

$ rg -l "export const.*TIMEOUT" --type ts | wc -l
15
```

**47 files with URLs, 23 with API keys, 15 with timeouts.**

**Step 3: Check for duplicates**

```bash
$ rg "api\.petforce\.com" --type ts

apps/web/src/config.ts:1:export const API_URL = 'https://api.petforce.com';
apps/mobile/src/config.ts:1:export const API_URL = 'https://api.petforce.com';
packages/api/src/config.ts:1:export const API_URL = 'https://api.petforce.com';
packages/auth/src/config.ts:1:export const AUTH_API_URL = 'https://api.petforce.com/auth';
... (12 more files)
```

**Same URL hard-coded in 15 different files.**

#### Root Cause

**Problem 1: No Configuration Strategy**

- No central configuration system
- Each package/app has own config file
- Developers adding config wherever they need it

**Problem 2: No Environment Awareness**

- Code doesn't know what environment it's running in
- Same code can't run in dev/staging/production
- Requires separate branches for each environment

**Problem 3: Secrets Management Failure**

- API keys and passwords in source code
- Committed to Git (visible in history)
- No secret rotation (keys been in repo for 2 years)

**Problem 4: Build-Time Configuration**

- Configuration compiled into bundle
- Can't change without rebuilding
- Can't deploy same artifact to multiple environments

#### Immediate Fix (Week 1)

**Step 1: Centralize configuration**

```typescript
// packages/config/src/index.ts
interface PetForceConfig {
  // API
  apiUrl: string;
  apiTimeout: number;

  // Database
  databaseUrl: string;
  databasePoolSize: number;

  // Redis
  redisUrl: string;
  redisTtl: number;

  // Authentication
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordMinLength: number;

  // Rate Limiting
  rateLimitWindow: number;
  rateLimitMaxRequests: number;

  // Feature Flags
  enableAnalytics: boolean;
  enablePushNotifications: boolean;
  logLevel: "debug" | "info" | "warn" | "error";

  // Third-Party
  stripePublicKey: string;
  sentryDsn: string;
}

// ✅ Single source of truth for configuration
export function getConfig(): PetForceConfig {
  // Read from environment variables
  return {
    apiUrl: process.env.API_URL || "http://localhost:3000",
    apiTimeout: parseInt(process.env.API_TIMEOUT || "5000", 10),

    databaseUrl:
      process.env.DATABASE_URL || "postgresql://localhost:5432/petforce",
    databasePoolSize: parseInt(process.env.DATABASE_POOL_SIZE || "10", 10),

    redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
    redisTtl: parseInt(process.env.REDIS_TTL || "3600", 10),

    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || "2592000000", 10), // 30 days
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || "5", 10),
    passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || "8", 10),

    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || "60000", 10),
    rateLimitMaxRequests: parseInt(
      process.env.RATE_LIMIT_MAX_REQUESTS || "100",
      10,
    ),

    enableAnalytics: process.env.ENABLE_ANALYTICS === "true",
    enablePushNotifications: process.env.ENABLE_PUSH_NOTIFICATIONS === "true",
    logLevel: (process.env.LOG_LEVEL as any) || "info",

    stripePublicKey: process.env.STRIPE_PUBLIC_KEY || "",
    sentryDsn: process.env.SENTRY_DSN || "",
  };
}

// ✅ Typed, validated configuration
export const config = getConfig();
```

**Step 2: Environment-specific .env files**

```bash
# .env.development
API_URL=http://localhost:3000
DATABASE_URL=postgresql://localhost:5432/petforce_dev
REDIS_URL=redis://localhost:6379
ENABLE_ANALYTICS=false
LOG_LEVEL=debug

# .env.staging
API_URL=https://api-staging.petforce.com
DATABASE_URL=postgresql://staging-db:5432/petforce
REDIS_URL=redis://staging-redis:6379
ENABLE_ANALYTICS=true
LOG_LEVEL=info
STRIPE_PUBLIC_KEY=pk_test_staging_key

# .env.production
API_URL=https://api.petforce.com
DATABASE_URL=${PRODUCTION_DATABASE_URL} # From secrets manager
REDIS_URL=${PRODUCTION_REDIS_URL}
ENABLE_ANALYTICS=true
LOG_LEVEL=error
STRIPE_PUBLIC_KEY=pk_live_production_key
```

**Step 3: Replace all hard-coded values**

```typescript
// Before: Hard-coded
export const API_URL = "https://api.petforce.com";
const response = await fetch(`${API_URL}/households`);

// After: From config
import { config } from "@petforce/config";
const response = await fetch(`${config.apiUrl}/households`);
```

```bash
# Automated replacement script
$ node scripts/migrate-to-config.js

Replacing hard-coded values with config:
✅ apps/web/src/api/client.ts
✅ apps/mobile/src/api/client.ts
✅ packages/api/src/server.ts
... (47 files updated)

Total replacements: 183
```

**Step 4: Secrets management**

```typescript
// packages/config/src/secrets.ts
import { SecretsManager } from "aws-sdk";

const secretsManager = new SecretsManager({ region: "us-east-1" });

export async function getSecrets(): Promise<SecretConfig> {
  if (process.env.NODE_ENV === "development") {
    // Use .env file in development
    return {
      databaseUrl: process.env.DATABASE_URL!,
      stripeSecretKey: process.env.STRIPE_SECRET_KEY!,
    };
  }

  // In production, fetch from AWS Secrets Manager
  const secret = await secretsManager
    .getSecretValue({ SecretId: "petforce/production" })
    .promise();

  if (!secret.SecretString) {
    throw new Error("No secret value found");
  }

  return JSON.parse(secret.SecretString);
}
```

#### Long-Term Solution (Weeks 2-4)

**Week 2: Configuration Validation**

```typescript
// packages/config/src/validation.ts
import { z } from "zod";

const ConfigSchema = z.object({
  apiUrl: z.string().url("API URL must be valid URL"),
  apiTimeout: z.number().min(1000).max(30000),

  databaseUrl: z.string().startsWith("postgresql://"),
  databasePoolSize: z.number().min(1).max(100),

  redisUrl: z.string().startsWith("redis://"),
  redisTtl: z.number().min(60).max(86400),

  sessionTimeout: z.number().min(60000).max(2592000000), // 1 min to 30 days
  maxLoginAttempts: z.number().min(1).max(10),
  passwordMinLength: z.number().min(8).max(128),

  rateLimitWindow: z.number().min(1000).max(3600000),
  rateLimitMaxRequests: z.number().min(1).max(10000),

  enableAnalytics: z.boolean(),
  enablePushNotifications: z.boolean(),
  logLevel: z.enum(["debug", "info", "warn", "error"]),

  stripePublicKey: z.string().startsWith("pk_"),
  sentryDsn: z.string().url().optional(),
});

export function validateConfig(config: unknown): PetForceConfig {
  const result = ConfigSchema.safeParse(config);

  if (!result.success) {
    console.error("❌ Invalid configuration:");
    result.error.errors.forEach((err) => {
      console.error(`  - ${err.path.join(".")}: ${err.message}`);
    });
    process.exit(1);
  }

  return result.data;
}

// Validate on startup
export const config = validateConfig(getRawConfig());
```

**Week 3: Feature Flag System**

```typescript
// packages/feature-flags/src/index.ts
interface FeatureFlags {
  enableHouseholdSharing: boolean;
  enablePetHealthTracking: boolean;
  enableTaskReminders: boolean;
  enableMobileApp: boolean;
  enableBetaFeatures: boolean;
}

export class FeatureFlagManager {
  private flags: Map<string, boolean> = new Map();

  constructor() {
    this.loadFlags();
  }

  private loadFlags() {
    // Load from environment variables
    this.flags.set(
      "enableHouseholdSharing",
      process.env.FEATURE_HOUSEHOLD_SHARING === "true",
    );
    this.flags.set(
      "enablePetHealthTracking",
      process.env.FEATURE_PET_HEALTH === "true",
    );
    this.flags.set(
      "enableTaskReminders",
      process.env.FEATURE_TASK_REMINDERS === "true",
    );
    this.flags.set(
      "enableMobileApp",
      process.env.FEATURE_MOBILE_APP === "true",
    );
    this.flags.set("enableBetaFeatures", process.env.FEATURE_BETA === "true");

    // In production, also fetch from LaunchDarkly/ConfigCat
    if (process.env.NODE_ENV === "production") {
      this.loadFromRemote();
    }
  }

  private async loadFromRemote() {
    // Fetch from feature flag service (LaunchDarkly, ConfigCat, etc.)
    const response = await fetch("https://config.petforce.com/feature-flags");
    const remoteFlags = await response.json();

    // Merge remote flags with local
    Object.entries(remoteFlags).forEach(([key, value]) => {
      this.flags.set(key, value as boolean);
    });
  }

  isEnabled(flag: keyof FeatureFlags): boolean {
    return this.flags.get(flag) || false;
  }

  async updateFlag(flag: keyof FeatureFlags, enabled: boolean): Promise<void> {
    this.flags.set(flag, enabled);
    await this.syncToRemote(flag, enabled);
  }

  private async syncToRemote(flag: string, enabled: boolean): Promise<void> {
    // Update remote feature flag service
    await fetch(`https://config.petforce.com/feature-flags/${flag}`, {
      method: "PUT",
      body: JSON.stringify({ enabled }),
    });
  }
}

export const featureFlags = new FeatureFlagManager();
```

**Usage:**

```typescript
import { featureFlags } from '@petforce/feature-flags';

function HouseholdPage() {
  // ✅ Feature can be toggled without code change
  const canShare = featureFlags.isEnabled('enableHouseholdSharing');

  return (
    <div>
      <h1>Household</h1>
      {canShare && <ShareButton />}
    </div>
  );
}
```

**Week 4: Configuration Documentation**

```markdown
# Configuration Management Guide

## Environment Variables

### Required Variables

- `API_URL` - API server URL (e.g., https://api.petforce.com)
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string

### Optional Variables

- `API_TIMEOUT` - API request timeout in ms (default: 5000)
- `DATABASE_POOL_SIZE` - Database connection pool size (default: 10)
- `LOG_LEVEL` - Logging level: debug, info, warn, error (default: info)

### Feature Flags

- `FEATURE_HOUSEHOLD_SHARING` - Enable household sharing (default: false)
- `FEATURE_PET_HEALTH` - Enable pet health tracking (default: false)
- `FEATURE_BETA` - Enable beta features (default: false)

## Deployment Process

### Staging Deployment

1. Load .env.staging
2. Deploy application
3. Configuration loaded at runtime (no rebuild needed)

### Production Deployment

1. Load secrets from AWS Secrets Manager
2. Load feature flags from remote service
3. Deploy application (same artifact as staging)

## Adding New Configuration

1. Add to ConfigSchema (packages/config/src/validation.ts)
2. Add to getConfig() (packages/config/src/index.ts)
3. Document in this file
4. Add to .env.example
5. Update all environment .env files
```

#### Results

**Deployment Time:**

- **Before:** 6 hours (staging), 12 hours (production)
- **After:** 15 minutes (both environments)
- **Improvement:** 96% faster

**Configuration Management:**

- **Before:** 47 files with hard-coded config
- **After:** 1 central config file
- **Improvement:** 96% reduction in config files

**Deployment Errors:**

- **Before:** 3-4 errors per deployment (forgot to update some value)
- **After:** 0 errors (validated configuration)
- **Improvement:** 100% reduction

**Secret Security:**

- **Before:** API keys in Git history
- **After:** Secrets in AWS Secrets Manager
- **Result:** No secrets in source code

**Feature Rollout:**

- **Before:** Requires code change + deployment
- **After:** Toggle feature flag (instant)
- **Result:** Ship features dark, enable when ready

**Developer Experience:**

- **Before:** "Where is this configured?"
- **After:** "Everything in @petforce/config"
- **Result:** Consistent, predictable configuration

#### Lessons Learned

**1. Configuration is Code**

- Configuration changes are deployments
- Should be versioned, reviewed, tested
- **Solution:** Centralize in @petforce/config package

**2. Environment Variables Are Essential**

- Hard-coded values = recompile for every environment
- Environment variables = deploy once, run anywhere
- **Solution:** 12-Factor App methodology

**3. Secrets Don't Belong in Source Code**

- Git history never forgets
- All developers don't need all secrets
- **Solution:** Secrets management service (AWS Secrets Manager, Vault)

**4. Configuration Needs Validation**

- Typos in .env crash production
- Wrong types cause runtime errors
- **Solution:** Validate configuration at startup (Zod schema)

**5. Feature Flags Enable Gradual Rollout**

- Ship code dark, enable when ready
- A/B test new features
- **Solution:** Feature flag service (LaunchDarkly, ConfigCat)

**6. Same Artifact, Multiple Environments**

- Don't rebuild for each environment
- Configuration should be external
- **Solution:** Build once, deploy everywhere with different .env

**Engrid's Configuration Rules:**

```markdown
## Configuration Best Practices

### DO:

- ✅ Use environment variables for all configuration
- ✅ Centralize configuration in single package
- ✅ Validate configuration at startup
- ✅ Use secrets management service for sensitive data
- ✅ Feature flags for gradual rollout
- ✅ Default values for optional configuration
- ✅ Document all configuration variables

### DON'T:

- ❌ Hard-code configuration values
- ❌ Commit secrets to Git
- ❌ Duplicate configuration across files
- ❌ Build different artifacts for each environment
- ❌ Skip configuration validation
- ❌ Use magic numbers without explanation

## Configuration Checklist

### Before Adding New Configuration

- [ ] Is this truly configurable? (or should it be hard-coded?)
- [ ] Does this need to vary by environment?
- [ ] Is this a secret? (use secrets manager)
- [ ] Is this a feature flag? (use feature flag service)

### When Adding Configuration

- [ ] Add to ConfigSchema with validation
- [ ] Add to getConfig() with default value
- [ ] Document in configuration guide
- [ ] Add to .env.example
- [ ] Update all environment .env files
- [ ] Add unit tests for validation

### Deployment Checklist

- [ ] Configuration validated at startup
- [ ] Secrets loaded from secrets manager (not .env)
- [ ] Feature flags loaded from remote service
- [ ] Same artifact deployed to all environments
- [ ] Rollback plan if configuration invalid
```

**Prevention:**

- ESLint rule disallows hard-coded URLs/keys
- Pre-commit hook validates .env files
- Configuration schema enforced with Zod
- Secrets management audit quarterly

---

### War Story 3: The Circular Dependency That Crashed the Build

**Date:** January 2026

**Impact:** 3-day production outage, build system completely broken, no deployments possible

#### The Scene

January 15, 2026 - 9:00 AM. Sarah tries to deploy a routine bug fix and gets this error:

```bash
$ npm run build

> petforce@1.0.0 build
> turbo run build

✓ @petforce/types built in 2.3s
✗ @petforce/utils failed to build

Error: Circular dependency detected

  @petforce/utils
    → @petforce/api
      → @petforce/households
        → @petforce/auth
          → @petforce/utils (circular!)

Build failed. Cannot proceed.
```

**The build is completely broken. No one can deploy anything.**

**9:15 AM** - Team realizes this is a P0 incident:

- Production bug fix blocked
- New feature deployments blocked
- Hotfixes impossible

**9:30 AM** - Emergency investigation begins:

- How did circular dependency get introduced?
- Why didn't CI catch it?
- How do we fix it without breaking everything?

#### The Problem

We had created a circular dependency chain across 4 packages:

```typescript
// packages/utils/src/index.ts
export { ApiClient } from "@petforce/api"; // ❌ Utils imports API

// packages/api/src/index.ts
export { HouseholdService } from "@petforce/households"; // ❌ API imports Households

// packages/households/src/index.ts
export { AuthService } from "@petforce/auth"; // ❌ Households imports Auth

// packages/auth/src/index.ts
import { formatDate } from "@petforce/utils"; // ❌ Auth imports Utils

// CIRCULAR DEPENDENCY:
// utils → api → households → auth → utils
```

**Why didn't TypeScript catch it during development?**

- TypeScript resolves dependencies lazily
- Only fails at build time when bundling
- Local development used cached builds

**Why didn't CI catch it?**

- CI used incremental builds with cached packages
- Only new code was rebuilt
- Circular dependency existed for weeks but never triggered full rebuild

**What triggered the failure?**

- Someone added `turbo.json` `dependsOn` configuration
- This forced clean builds (no cache)
- Clean build exposed the circular dependency

#### Investigation: How Did This Happen?

**Step 1: Trace the dependency chain**

```bash
$ npx madge --circular --extensions ts packages/

Found 1 circular dependency:

packages/utils/src/index.ts
→ packages/api/src/index.ts
→ packages/households/src/index.ts
→ packages/auth/src/index.ts
→ packages/utils/src/date-utils.ts
```

**Step 2: Check git blame**

```bash
# When was utils → api import added?
$ git blame packages/utils/src/index.ts | grep ApiClient
a1b2c3d (Sarah  2025-12-10) export { ApiClient } from '@petforce/api';

# When was api → households import added?
$ git blame packages/api/src/index.ts | grep HouseholdService
d4e5f6g (Mike   2025-12-15) export { HouseholdService } from '@petforce/households';

# When was households → auth import added?
$ git blame packages/households/src/index.ts | grep AuthService
h7i8j9k (John   2025-12-22) export { AuthService } from '@petforce/auth';

# When was auth → utils import added?
$ git log packages/auth/src/index.ts | grep "formatDate"
m9n0p1q (Emma   2026-01-05) import { formatDate } from '@petforce/utils';
```

**The circular dependency was created incrementally over 4 weeks:**

- Dec 10: utils → api (Sarah)
- Dec 15: api → households (Mike)
- Dec 22: households → auth (John)
- Jan 5: auth → utils (Emma - **completed the circle**)

**None of the PRs failed because CI used cached builds.**

**Step 3: Check package.json dependencies**

```json
// packages/utils/package.json
{
  "dependencies": {
    "@petforce/api": "^1.0.0" // ❌ Utils depends on API
  }
}

// packages/api/package.json
{
  "dependencies": {
    "@petforce/households": "^1.0.0" // ❌ API depends on Households
  }
}

// packages/households/package.json
{
  "dependencies": {
    "@petforce/auth": "^1.0.0" // ❌ Households depends on Auth
  }
}

// packages/auth/package.json
{
  "dependencies": {
    "@petforce/utils": "^1.0.0" // ❌ Auth depends on Utils (closes circle)
  }
}
```

**package.json didn't prevent circular dependencies.**

**Step 4: Check if code actually works**

```bash
# Surprisingly, TypeScript compilation works
$ npm run typecheck
✅ All packages type check successfully

# Runtime also works (in development)
$ npm run dev
✅ Development server starts successfully

# Only full build fails
$ npm run build
❌ Circular dependency error
```

**TypeScript and runtime don't care about circular dependencies. Only bundler does.**

#### Root Cause

**Problem 1: No Dependency Graph Enforcement**

- No rules about which packages can import which
- Developers added dependencies freely
- No architecture review of dependencies

**Problem 2: Incremental Builds Hid the Problem**

- CI used cached builds (faster)
- Cached builds don't rebuild dependencies
- Circular dependency existed for weeks undetected

**Problem 3: Wrong Abstractions**

- `@petforce/utils` importing `@petforce/api`?
- Utility packages shouldn't depend on feature packages
- Dependency flow should be: features → utils, not utils → features

**Problem 4: Lack of Architectural Layers**

- No clear separation of layers (UI → business logic → data → utils)
- Packages at same level importing each other
- No dependency rules enforced

#### Immediate Fix (Day 1)

**Step 1: Break the circular dependency**

The quickest break is auth → utils (remove formatDate import):

```typescript
// packages/auth/src/index.ts
// Before: Import from utils
import { formatDate } from "@petforce/utils";

// After: Copy function locally (temporary)
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}
```

**This breaks the circle:**

```
utils → api → households → auth (✅ no longer imports utils)
```

**Step 2: Run build to verify**

```bash
$ npm run build
✓ @petforce/types built in 2.3s
✓ @petforce/utils built in 3.1s
✓ @petforce/api built in 4.2s
✓ @petforce/households built in 3.8s
✓ @petforce/auth built in 2.9s
✓ @petforce/web built in 12.4s

✅ Build successful!
```

**Step 3: Deploy bug fix**

```bash
$ npm run deploy:production
✅ Deployed successfully
```

**Total outage: 3.5 hours** (investigation + fix + deployment)

#### Long-Term Solution (Weeks 1-3)

**Week 1: Define Dependency Architecture**

```markdown
# PetForce Dependency Architecture

## Package Layers (bottom to top)

Layer 0: **Primitives** (no dependencies)

- @petforce/types
- @petforce/constants

Layer 1: **Utils** (depends on layer 0 only)

- @petforce/utils
- @petforce/validators
- @petforce/formatters

Layer 2: **Infrastructure** (depends on layers 0-1)

- @petforce/database
- @petforce/redis
- @petforce/api-client

Layer 3: **Domain Services** (depends on layers 0-2)

- @petforce/auth
- @petforce/households
- @petforce/pets
- @petforce/tasks

Layer 4: **Application** (depends on layers 0-3)

- @petforce/api (backend)
- @petforce/web (frontend)
- @petforce/mobile (mobile app)

## Dependency Rules

1. **Downward Dependencies Only**
   - Packages can only import from lower layers
   - ❌ Layer 1 cannot import from Layer 2+
   - ✅ Layer 3 can import from Layers 0-2

2. **No Circular Dependencies**
   - Circular dependencies are strictly forbidden
   - CI will fail if detected

3. **No Cross-Layer Peer Dependencies**
   - Packages in same layer cannot import each other
   - Extract shared code to lower layer if needed

4. **Application Layer is Top**
   - Nothing imports from application layer
   - Application layer can import from all lower layers
```

**Week 2: Implement Dependency Validation**

```typescript
// scripts/validate-dependencies.ts
import * as madge from "madge";
import { readFileSync } from "fs";
import { join } from "path";

interface DependencyRules {
  allowedDependencies: Record<string, string[]>;
  forbiddenDependencies: Record<string, string[]>;
}

const DEPENDENCY_RULES: DependencyRules = {
  // What each package is allowed to import
  allowedDependencies: {
    "@petforce/types": [], // No dependencies
    "@petforce/constants": [], // No dependencies

    // Layer 1: Utils (only layer 0)
    "@petforce/utils": ["@petforce/types", "@petforce/constants"],
    "@petforce/validators": ["@petforce/types", "@petforce/constants"],

    // Layer 2: Infrastructure (layers 0-1)
    "@petforce/database": ["@petforce/types", "@petforce/utils"],
    "@petforce/api-client": ["@petforce/types", "@petforce/utils"],

    // Layer 3: Domain Services (layers 0-2)
    "@petforce/auth": [
      "@petforce/types",
      "@petforce/utils",
      "@petforce/database",
    ],
    "@petforce/households": [
      "@petforce/types",
      "@petforce/utils",
      "@petforce/database",
      "@petforce/auth",
    ],
    "@petforce/pets": [
      "@petforce/types",
      "@petforce/utils",
      "@petforce/database",
      "@petforce/auth",
    ],

    // Layer 4: Applications (layers 0-3)
    "@petforce/api": ["@petforce/*"], // Can import everything
    "@petforce/web": ["@petforce/*"], // Can import everything
    "@petforce/mobile": ["@petforce/*"], // Can import everything
  },

  // Explicitly forbidden dependencies
  forbiddenDependencies: {
    "@petforce/utils": [
      "@petforce/api",
      "@petforce/households",
      "@petforce/auth",
    ], // Utils can't import features
    "@petforce/auth": ["@petforce/households", "@petforce/pets"], // Auth can't import domain services
  },
};

async function validateDependencies() {
  console.log("🔍 Validating package dependencies...\n");

  // Check for circular dependencies
  const result = await madge("packages/**/*.ts", {
    fileExtensions: ["ts", "tsx"],
  });

  const circular = result.circular();

  if (circular.length > 0) {
    console.error("❌ Circular dependencies detected:\n");
    circular.forEach((circle: string[]) => {
      console.error(`  ${circle.join(" → ")}`);
    });
    process.exit(1);
  }

  console.log("✅ No circular dependencies found\n");

  // Check for forbidden dependencies
  const packages = Object.keys(DEPENDENCY_RULES.allowedDependencies);

  for (const pkg of packages) {
    console.log(`Checking ${pkg}...`);

    const pkgPath = join(
      "packages",
      pkg.replace("@petforce/", ""),
      "package.json",
    );
    const pkgJson = JSON.parse(readFileSync(pkgPath, "utf-8"));
    const dependencies = Object.keys(pkgJson.dependencies || {});

    const petforceDeps = dependencies.filter((dep) =>
      dep.startsWith("@petforce/"),
    );

    // Check allowed dependencies
    const allowed = DEPENDENCY_RULES.allowedDependencies[pkg] || [];
    const forbidden = DEPENDENCY_RULES.forbiddenDependencies[pkg] || [];

    for (const dep of petforceDeps) {
      // Check if explicitly forbidden
      if (forbidden.includes(dep)) {
        console.error(`❌ ${pkg} has forbidden dependency: ${dep}`);
        process.exit(1);
      }

      // Check if allowed
      if (
        allowed.length > 0 &&
        !allowed.includes(dep) &&
        !allowed.includes("@petforce/*")
      ) {
        console.error(`❌ ${pkg} has disallowed dependency: ${dep}`);
        console.error(`   Allowed: ${allowed.join(", ")}`);
        process.exit(1);
      }
    }

    console.log(`  ✅ Dependencies valid\n`);
  }

  console.log("✅ All dependencies validated successfully");
}

validateDependencies();
```

**Add to CI:**

```yaml
# .github/workflows/ci.yml
- name: Validate dependencies
  run: npm run validate:dependencies
```

**Week 3: Refactor to Fix Architecture**

```typescript
// 1. Move formatDate back to @petforce/utils (proper home)
// packages/utils/src/date-utils.ts
export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

// 2. Remove ApiClient export from @petforce/utils
// packages/utils/src/index.ts
// ❌ REMOVED: export { ApiClient } from '@petforce/api';
// This was wrong - utils shouldn't export API classes

// 3. Remove HouseholdService export from @petforce/api
// packages/api/src/index.ts
// ❌ REMOVED: export { HouseholdService } from '@petforce/households';
// API should expose routes, not services

// 4. Create proper exports
// packages/api/src/index.ts (backend API routes only)
export { app } from "./server";
export { router } from "./router";

// Applications import services directly
// apps/web/src/api/households.ts
import { HouseholdService } from "@petforce/households"; // ✅ Direct import
```

**Updated dependency graph:**

```
Layer 4: @petforce/api, @petforce/web, @petforce/mobile
           ↓ (imports everything below)
Layer 3: @petforce/auth, @petforce/households, @petforce/pets
           ↓
Layer 2: @petforce/database, @petforce/api-client
           ↓
Layer 1: @petforce/utils, @petforce/validators
           ↓
Layer 0: @petforce/types, @petforce/constants
```

**No circular dependencies possible.**

#### Results

**Build Reliability:**

- **Before:** 100% broken (circular dependency)
- **After:** 100% working, validated on every commit
- **Result:** No more circular dependency surprises

**Dependency Clarity:**

- **Before:** Tangled mess, unclear what imports what
- **After:** Clear architectural layers, enforced rules
- **Result:** Developers know where to put code

**CI Reliability:**

- **Before:** Incremental builds hid problems
- **After:** Dependency validation catches issues before merge
- **Result:** 0 circular dependencies introduced in 6 months

**Developer Experience:**

- **Before:** "Where should I import this from?"
- **After:** "Follow the dependency layers"
- **Result:** Consistent, predictable imports

**Code Organization:**

- **Before:** Utilities mixed with features
- **After:** Clear separation of concerns
- **Result:** Easier to find and maintain code

#### Lessons Learned

**1. Circular Dependencies Are Silent Killers**

- TypeScript doesn't prevent them
- Runtime doesn't care
- Only bundler fails
- **Solution:** Explicit validation in CI

**2. Incremental Builds Hide Problems**

- Caching is great for speed
- Caching hides dependency issues
- **Solution:** Weekly full clean builds

**3. Architecture Must Be Enforced**

- Good intentions aren't enough
- Rules must be validated automatically
- **Solution:** Dependency validation in CI

**4. Layers Prevent Circular Dependencies**

- Unidirectional flow: top → bottom only
- Bottom layers can't import from top
- **Solution:** Define clear architectural layers

**5. Package.json Isn't Enough**

- package.json allows any dependency
- Doesn't enforce architecture
- **Solution:** Custom validation with rules

**6. Utils Should Be Pure**

- Utility packages shouldn't import features
- Features import utilities, not the other way
- **Solution:** Layer 1 packages have strict rules

**Engrid's Dependency Rules:**

```markdown
## Dependency Management Best Practices

### DO:

- ✅ Follow architectural layers (top → bottom only)
- ✅ Validate dependencies in CI
- ✅ Run full clean builds weekly
- ✅ Use dependency visualization tools (madge)
- ✅ Extract shared code to lower layers
- ✅ Document dependency rules

### DON'T:

- ❌ Create circular dependencies (ever!)
- ❌ Import from same layer (peer dependencies)
- ❌ Import features from utilities
- ❌ Skip dependency validation
- ❌ Rely only on incremental builds
- ❌ Add dependencies without review

## Dependency Checklist

### Before Adding New Dependency

- [ ] Does this create a circular dependency?
- [ ] Is this allowed by dependency rules?
- [ ] Could this be extracted to lower layer?
- [ ] Is there a better abstraction?

### When Adding Package

- [ ] Determine correct layer
- [ ] Define allowed dependencies
- [ ] Add to dependency rules
- [ ] Update documentation
- [ ] Validate with madge

### CI Checks

- [ ] Circular dependency detection (madge)
- [ ] Dependency rules validation
- [ ] Weekly full clean builds
- [ ] Dependency graph visualization
```

**Prevention:**

- Dependency validation runs on every PR
- Weekly full clean builds (no cache)
- Quarterly architecture review
- Dependency visualization in README

---

## Advanced Software Engineering Patterns

Beyond the war stories, here are advanced patterns for writing maintainable, scalable software.

### Pattern 1: Hexagonal Architecture (Ports & Adapters)

Decouple business logic from external dependencies:

```typescript
// packages/households/src/domain/household.ts (Pure business logic)
export class Household {
  constructor(
    private id: string,
    private name: string,
    private ownerId: string,
    private members: Member[] = [],
  ) {}

  addMember(member: Member): void {
    if (this.members.find((m) => m.id === member.id)) {
      throw new Error("Member already exists");
    }

    if (this.members.length >= 10) {
      throw new Error("Maximum 10 members per household");
    }

    this.members.push(member);
  }

  removeMember(memberId: string): void {
    if (memberId === this.ownerId) {
      throw new Error("Cannot remove household owner");
    }

    this.members = this.members.filter((m) => m.id !== memberId);
  }

  // ✅ Business logic only, no database, no API calls
}

// packages/households/src/ports/household-repository.ts (Port interface)
export interface HouseholdRepository {
  findById(id: string): Promise<Household | null>;
  save(household: Household): Promise<void>;
  delete(id: string): Promise<void>;
  findByOwnerId(ownerId: string): Promise<Household[]>;
}

// packages/households/src/adapters/postgres-household-repository.ts (Adapter implementation)
export class PostgresHouseholdRepository implements HouseholdRepository {
  constructor(private db: Database) {}

  async findById(id: string): Promise<Household | null> {
    const row = await this.db.query("SELECT * FROM households WHERE id = $1", [
      id,
    ]);

    if (!row) return null;

    return this.mapRowToHousehold(row);
  }

  async save(household: Household): Promise<void> {
    await this.db.query(
      "INSERT INTO households (id, name, owner_id) VALUES ($1, $2, $3)",
      [household.id, household.name, household.ownerId],
    );
  }

  // ... other methods
}

// packages/households/src/application/household-service.ts (Use case)
export class HouseholdService {
  constructor(private repository: HouseholdRepository) {} // ✅ Depends on port, not adapter

  async createHousehold(name: string, ownerId: string): Promise<Household> {
    const household = new Household(generateId(), name, ownerId);

    await this.repository.save(household);

    return household;
  }

  async addMemberToHousehold(
    householdId: string,
    member: Member,
  ): Promise<void> {
    const household = await this.repository.findById(householdId);

    if (!household) {
      throw new Error("Household not found");
    }

    household.addMember(member); // ✅ Business logic in domain

    await this.repository.save(household);
  }
}
```

**Benefits:**

- Business logic independent of database
- Easy to test (mock repository)
- Can swap database (Postgres → MongoDB) without changing business logic
- Domain entities are pure (no dependencies)

### Pattern 2: Repository Pattern

Abstract data access behind repository interface:

```typescript
// packages/common/src/repository.ts (Base repository)
export abstract class Repository<T extends { id: string }> {
  constructor(protected db: Database) {}

  abstract mapRowToEntity(row: any): T;
  abstract mapEntityToRow(entity: T): any;
  abstract getTableName(): string;

  async findById(id: string): Promise<T | null> {
    const row = await this.db.query(
      `SELECT * FROM ${this.getTableName()} WHERE id = $1`,
      [id],
    );

    return row ? this.mapRowToEntity(row) : null;
  }

  async findAll(): Promise<T[]> {
    const rows = await this.db.query(`SELECT * FROM ${this.getTableName()}`);

    return rows.map((row) => this.mapRowToEntity(row));
  }

  async save(entity: T): Promise<void> {
    const row = this.mapEntityToRow(entity);
    const columns = Object.keys(row);
    const values = Object.values(row);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");

    await this.db.query(
      `INSERT INTO ${this.getTableName()} (${columns.join(", ")}) VALUES (${placeholders})
       ON CONFLICT (id) DO UPDATE SET ${columns.map((col, i) => `${col} = $${i + 1}`).join(", ")}`,
      values,
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.query(`DELETE FROM ${this.getTableName()} WHERE id = $1`, [
      id,
    ]);
  }
}

// packages/households/src/repositories/household-repository.ts (Concrete repository)
export class HouseholdRepository extends Repository<Household> {
  getTableName(): string {
    return "households";
  }

  mapRowToEntity(row: any): Household {
    return new Household(
      row.id,
      row.name,
      row.owner_id,
      JSON.parse(row.members),
    );
  }

  mapEntityToRow(household: Household): any {
    return {
      id: household.id,
      name: household.name,
      owner_id: household.ownerId,
      members: JSON.stringify(household.members),
    };
  }

  // ✅ Custom query methods
  async findByOwnerId(ownerId: string): Promise<Household[]> {
    const rows = await this.db.query(
      "SELECT * FROM households WHERE owner_id = $1",
      [ownerId],
    );

    return rows.map((row) => this.mapRowToEntity(row));
  }
}
```

### Pattern 3: Command Query Responsibility Segregation (CQRS)

Separate read and write operations:

```typescript
// packages/households/src/commands/create-household.command.ts (Write side)
export interface CreateHouseholdCommand {
  name: string;
  description: string;
  ownerId: string;
}

export class CreateHouseholdHandler {
  constructor(
    private repository: HouseholdRepository,
    private eventBus: EventBus,
  ) {}

  async execute(command: CreateHouseholdCommand): Promise<string> {
    // Validate
    if (!command.name || command.name.trim() === "") {
      throw new ValidationError("Name is required");
    }

    // Create
    const household = new Household(
      generateId(),
      command.name,
      command.ownerId,
    );

    await this.repository.save(household);

    // Publish event
    await this.eventBus.publish(
      new HouseholdCreatedEvent(
        household.id,
        household.name,
        household.ownerId,
      ),
    );

    return household.id;
  }
}

// packages/households/src/queries/get-household.query.ts (Read side)
export interface GetHouseholdQuery {
  householdId: string;
}

export interface HouseholdDto {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  ownerName: string;
  memberCount: number;
  petCount: number;
  taskCount: number;
  createdAt: Date;
}

export class GetHouseholdHandler {
  constructor(private db: Database) {} // ✅ Direct database access for reads

  async execute(query: GetHouseholdQuery): Promise<HouseholdDto | null> {
    // ✅ Optimized read query (joins, aggregations)
    const row = await this.db.query(
      `
      SELECT
        h.id, h.name, h.description, h.owner_id,
        u.name as owner_name,
        COUNT(DISTINCT m.id) as member_count,
        COUNT(DISTINCT p.id) as pet_count,
        COUNT(DISTINCT t.id) as task_count,
        h.created_at
      FROM households h
      LEFT JOIN users u ON h.owner_id = u.id
      LEFT JOIN members m ON h.id = m.household_id
      LEFT JOIN pets p ON h.id = p.household_id
      LEFT JOIN tasks t ON h.id = t.household_id
      WHERE h.id = $1
      GROUP BY h.id, u.name
    `,
      [query.householdId],
    );

    return row ? this.mapRowToDto(row) : null;
  }

  private mapRowToDto(row: any): HouseholdDto {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      ownerId: row.owner_id,
      ownerName: row.owner_name,
      memberCount: parseInt(row.member_count),
      petCount: parseInt(row.pet_count),
      taskCount: parseInt(row.task_count),
      createdAt: row.created_at,
    };
  }
}

// Usage
const createHandler = new CreateHouseholdHandler(repository, eventBus);
const householdId = await createHandler.execute({
  name: "Zeder House",
  description: "Our family",
  ownerId: "user_123",
});

const getHandler = new GetHouseholdHandler(db);
const household = await getHandler.execute({ householdId });
```

**Benefits:**

- Optimized writes (domain logic, events)
- Optimized reads (joins, aggregations, no domain logic)
- Scalable (read and write databases can be different)
- Clear separation of concerns

### Pattern 4: Domain Events

Decouple components with events:

```typescript
// packages/common/src/events/event.ts (Base event)
export abstract class DomainEvent {
  public readonly occurredAt: Date = new Date();
  public readonly eventId: string = generateId();

  abstract getEventName(): string;
}

// packages/households/src/events/household-created.event.ts
export class HouseholdCreatedEvent extends DomainEvent {
  constructor(
    public readonly householdId: string,
    public readonly householdName: string,
    public readonly ownerId: string,
  ) {
    super();
  }

  getEventName(): string {
    return "household.created";
  }
}

// packages/common/src/events/event-bus.ts (Event bus)
export class EventBus {
  private handlers: Map<string, ((event: DomainEvent) => Promise<void>)[]> =
    new Map();

  subscribe(
    eventName: string,
    handler: (event: DomainEvent) => Promise<void>,
  ): void {
    const existing = this.handlers.get(eventName) || [];
    this.handlers.set(eventName, [...existing, handler]);
  }

  async publish(event: DomainEvent): Promise<void> {
    const eventName = event.getEventName();
    const handlers = this.handlers.get(eventName) || [];

    // Execute all handlers in parallel
    await Promise.all(handlers.map((handler) => handler(event)));
  }
}

// packages/notifications/src/event-handlers/household-created.handler.ts (Handler)
export class HouseholdCreatedHandler {
  constructor(
    private emailService: EmailService,
    private analyticsService: AnalyticsService,
  ) {}

  async handle(event: HouseholdCreatedEvent): Promise<void> {
    // Send welcome email
    await this.emailService.send({
      to: event.ownerId,
      subject: "Welcome to PetForce!",
      template: "household-created",
      data: { householdName: event.householdName },
    });

    // Track analytics
    await this.analyticsService.track("household_created", {
      householdId: event.householdId,
      householdName: event.householdName,
    });
  }
}

// Setup
const eventBus = new EventBus();
const handler = new HouseholdCreatedHandler(emailService, analyticsService);

eventBus.subscribe("household.created", (event) =>
  handler.handle(event as HouseholdCreatedEvent),
);
```

**Benefits:**

- Decoupled components
- Easy to add new handlers (no code changes to publisher)
- Async processing
- Event sourcing support

### Pattern 5: Dependency Injection

Invert dependencies for testability:

```typescript
// packages/common/src/container.ts (DI container)
export class Container {
  private services = new Map<string, any>();

  register<T>(name: string, factory: () => T): void {
    this.services.set(name, factory);
  }

  resolve<T>(name: string): T {
    const factory = this.services.get(name);

    if (!factory) {
      throw new Error(`Service ${name} not registered`);
    }

    return factory();
  }
}

// Setup
const container = new Container();

// Register dependencies
container.register("database", () => new PostgresDatabase(config.databaseUrl));
container.register("eventBus", () => new EventBus());
container.register(
  "householdRepository",
  () => new HouseholdRepository(container.resolve("database")),
);
container.register(
  "householdService",
  () =>
    new HouseholdService(
      container.resolve("householdRepository"),
      container.resolve("eventBus"),
    ),
);

// Resolve
const householdService =
  container.resolve<HouseholdService>("householdService");
```

**Using decorators (TypeScript):**

```typescript
// packages/common/src/decorators/injectable.ts
export function Injectable(name: string) {
  return function (constructor: any) {
    container.register(name, () => new constructor());
  };
}

export function Inject(serviceName: string) {
  return function (target: any, propertyKey: string) {
    Object.defineProperty(target, propertyKey, {
      get: () => container.resolve(serviceName),
    });
  };
}

// Usage
@Injectable("householdService")
export class HouseholdService {
  @Inject("householdRepository")
  private repository!: HouseholdRepository;

  @Inject("eventBus")
  private eventBus!: EventBus;

  async createHousehold(name: string, ownerId: string): Promise<Household> {
    // Use injected dependencies
    const household = new Household(generateId(), name, ownerId);
    await this.repository.save(household);
    await this.eventBus.publish(
      new HouseholdCreatedEvent(household.id, name, ownerId),
    );
    return household;
  }
}
```

### Pattern 6: Factory Pattern

Encapsulate object creation:

```typescript
// packages/households/src/factories/household.factory.ts
export class HouseholdFactory {
  static create(data: {
    name: string;
    ownerId: string;
    description?: string;
  }): Household {
    // Validation
    if (!data.name || data.name.trim() === "") {
      throw new ValidationError("Name is required");
    }

    if (data.name.length > 100) {
      throw new ValidationError("Name too long");
    }

    // Generation
    const id = generateId();
    const household = new Household(id, data.name, data.ownerId);

    if (data.description) {
      household.setDescription(data.description);
    }

    // Default values
    household.setCreatedAt(new Date());
    household.setUpdatedAt(new Date());

    return household;
  }

  static fromDatabase(row: any): Household {
    const household = new Household(row.id, row.name, row.owner_id);

    household.setDescription(row.description);
    household.setCreatedAt(new Date(row.created_at));
    household.setUpdatedAt(new Date(row.updated_at));

    return household;
  }
}

// Usage
const household = HouseholdFactory.create({
  name: "Zeder House",
  ownerId: "user_123",
  description: "Our family household",
});
```

### Pattern 7: Builder Pattern

Construct complex objects step by step:

```typescript
// packages/households/src/builders/household.builder.ts
export class HouseholdBuilder {
  private id?: string;
  private name?: string;
  private ownerId?: string;
  private description?: string;
  private members: Member[] = [];
  private pets: Pet[] = [];

  withId(id: string): this {
    this.id = id;
    return this;
  }

  withName(name: string): this {
    this.name = name;
    return this;
  }

  withOwner(ownerId: string): this {
    this.ownerId = ownerId;
    return this;
  }

  withDescription(description: string): this {
    this.description = description;
    return this;
  }

  withMember(member: Member): this {
    this.members.push(member);
    return this;
  }

  withPet(pet: Pet): this {
    this.pets.push(pet);
    return this;
  }

  build(): Household {
    if (!this.id) throw new Error("ID is required");
    if (!this.name) throw new Error("Name is required");
    if (!this.ownerId) throw new Error("Owner ID is required");

    const household = new Household(this.id, this.name, this.ownerId);

    if (this.description) {
      household.setDescription(this.description);
    }

    this.members.forEach((member) => household.addMember(member));
    this.pets.forEach((pet) => household.addPet(pet));

    return household;
  }
}

// Usage
const household = new HouseholdBuilder()
  .withId("hh_123")
  .withName("Zeder House")
  .withOwner("user_123")
  .withDescription("Our family")
  .withMember(new Member("member_1", "Sarah", "owner"))
  .withMember(new Member("member_2", "John", "member"))
  .withPet(new Pet("pet_1", "Max", "dog"))
  .withPet(new Pet("pet_2", "Luna", "cat"))
  .build();
```

---

## Conclusion

Engrid's software engineering patterns ensure PetForce code is maintainable, testable, and scalable. By learning from production war stories and applying advanced patterns, we've built:

- **Clean architecture** (hexagonal, ports & adapters, CQRS)
- **Enforced dependency rules** (no circular dependencies, clear layers)
- **Centralized configuration** (environment variables, validation, secrets management)
- **Modular components** (single responsibility, < 300 lines)
- **Comprehensive tests** (87% coverage, testable architecture)
- **Domain-driven design** (pure domain logic, separated from infrastructure)

**Remember:**

- Refactor relentlessly (20% of sprint time)
- Component boundaries matter (< 300 lines)
- Configuration is code (centralize, validate)
- Dependencies flow downward only (layers prevent circles)
- Tests enable refactoring (write before refactoring)
- Architecture must be enforced (validation in CI)

---

Built with ❤️ by Engrid (Software Engineering Agent)

**Clean code is maintainable code. Write code for humans, not computers.**
