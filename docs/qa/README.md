# QA & Testing Guide

> **Tucker's QA Philosophy**: "Quality isn't tested in—it's built in. But comprehensive testing ensures it stays in."

This guide covers PetForce's comprehensive quality assurance and testing strategy, from unit tests to production monitoring.

## Table of Contents

- [Testing Philosophy](#testing-philosophy)
- [Testing Pyramid](#testing-pyramid)
- [Test Types](#test-types)
- [Testing Tools & Frameworks](#testing-tools--frameworks)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [E2E Testing](#e2e-testing)
- [Performance Testing](#performance-testing)
- [Visual Regression Testing](#visual-regression-testing)
- [Contract Testing](#contract-testing)
- [Mutation Testing](#mutation-testing)
- [Test Data Management](#test-data-management)
- [CI/CD Integration](#cicd-integration)
- [Quality Metrics](#quality-metrics)
- [Testing Best Practices](#testing-best-practices)

## Testing Philosophy

### Core Principles

1. **Test Early, Test Often**: Shift left—catch issues during development
2. **Fast Feedback**: Tests should run in seconds, not minutes
3. **Reliable**: Flaky tests are worse than no tests
4. **Maintainable**: Tests are code—apply same quality standards
5. **Comprehensive**: Cover happy paths, edge cases, and failure scenarios
6. **Production-like**: Test environments mirror production

### Quality Goals

- **Code Coverage**: 80%+ overall, 90%+ for critical paths
- **Test Execution Time**: Unit tests <5s, integration <30s, E2E <5min
- **Flaky Test Rate**: <1% across all test suites
- **Bug Escape Rate**: <5% of bugs reach production
- **Mean Time to Detect (MTTD)**: <5 minutes for critical issues

## Testing Pyramid

```
        /\
       /  \  E2E Tests (10%)
      /____\
     /      \
    / Integ. \ Integration Tests (20%)
   /  Tests   \
  /____________\
 /              \
/  Unit Tests    \ Unit Tests (70%)
/________________\
```

### Layer Breakdown

**Unit Tests (70%)**

- Focus: Individual functions, methods, components
- Speed: Milliseconds
- Isolation: Mock all dependencies
- Coverage: Business logic, utilities, pure functions

**Integration Tests (20%)**

- Focus: Component interactions, API contracts
- Speed: Seconds
- Isolation: Real dependencies, mocked external services
- Coverage: Database queries, API endpoints, service integration

**E2E Tests (10%)**

- Focus: Critical user journeys
- Speed: Minutes
- Isolation: Full application stack
- Coverage: Auth flow, household creation, pet management

## Test Types

### 1. Unit Tests

Test individual units of code in isolation.

**Framework**: Vitest
**Location**: `src/**/__tests__/*.test.ts`

```typescript
// Example: Testing a utility function
import { describe, it, expect } from "vitest";
import { generateInviteCode } from "../invite-codes";

describe("generateInviteCode", () => {
  it("should generate a valid invite code", () => {
    const code = generateInviteCode("Zeder House");

    expect(code).toMatch(/^[A-Z]{5}-[A-Z]{5}-[A-Z]{5}$/);
    expect(code.split("-")[0]).toBe("ZEDER");
  });

  it("should handle special characters in household name", () => {
    const code = generateInviteCode("O'Connor & Friends");

    expect(code).toMatch(/^[A-Z]{5}-[A-Z]{5}-[A-Z]{5}$/);
  });

  it("should generate unique codes for same household", () => {
    const code1 = generateInviteCode("Test House");
    const code2 = generateInviteCode("Test House");

    expect(code1).not.toBe(code2);
  });
});
```

**Best Practices**:

- One assertion per test (prefer multiple tests over multiple assertions)
- Test behavior, not implementation
- Use descriptive test names: `should [expected behavior] when [condition]`
- Arrange-Act-Assert pattern

### 2. Integration Tests

Test how components work together.

**Framework**: Vitest with test database
**Location**: `src/**/__tests__/integration/*.test.ts`

```typescript
// Example: Testing API endpoint with database
import { describe, it, expect, beforeEach } from "vitest";
import { createTestDatabase, cleanupDatabase } from "../test-utils";
import { createHousehold } from "../../api/household-api";

describe("Household API Integration", () => {
  beforeEach(async () => {
    await cleanupDatabase();
  });

  it("should create household and return invite code", async () => {
    const user = await createTestUser();

    const result = await createHousehold({
      name: "Zeder House",
      userId: user.id,
    });

    expect(result.household).toBeDefined();
    expect(result.household.name).toBe("Zeder House");
    expect(result.inviteCode).toMatch(/^[A-Z]{5}-[A-Z]{5}-[A-Z]{5}$/);

    // Verify database state
    const household = await db
      .select()
      .from(households)
      .where(eq(households.id, result.household.id))
      .limit(1);

    expect(household[0].leader_id).toBe(user.id);
  });

  it("should enforce household name uniqueness per user", async () => {
    const user = await createTestUser();

    await createHousehold({ name: "Zeder House", userId: user.id });

    await expect(
      createHousehold({ name: "Zeder House", userId: user.id }),
    ).rejects.toThrow("Household name already exists");
  });
});
```

**Best Practices**:

- Use test database with known state
- Clean up after each test
- Test actual database queries and constraints
- Verify side effects (database records, external API calls)

### 3. E2E Tests

Test complete user flows through the application.

**Framework**: Playwright
**Location**: `apps/web/tests/e2e/*.spec.ts`

```typescript
// Example: Testing registration flow
import { test, expect } from "@playwright/test";

test.describe("User Registration Flow", () => {
  test("should complete registration and create household", async ({
    page,
  }) => {
    // Navigate to app
    await page.goto("http://localhost:3000");

    // Fill registration form
    await page.fill('[data-testid="email-input"]', "tucker@petforce.app");
    await page.fill('[data-testid="password-input"]', "SecureP@ss123");
    await page.fill('[data-testid="name-input"]', "Tucker Tester");
    await page.click('[data-testid="register-button"]');

    // Wait for email verification page
    await expect(page).toHaveURL(/\/verify-email/);
    await expect(page.locator("text=Check your email")).toBeVisible();

    // Simulate email confirmation (test environment)
    await page.goto("http://localhost:3000/confirm-email?token=test-token");

    // Should redirect to household creation
    await expect(page).toHaveURL(/\/households\/create/);

    // Create household
    await page.fill('[data-testid="household-name"]', "Tucker's Test House");
    await page.click('[data-testid="create-household-button"]');

    // Verify household dashboard
    await expect(page).toHaveURL(/\/households\/[a-z0-9-]+/);
    await expect(page.locator("text=Tucker's Test House")).toBeVisible();

    // Verify invite code is displayed
    const inviteCode = await page
      .locator('[data-testid="invite-code"]')
      .textContent();
    expect(inviteCode).toMatch(/^[A-Z]{5}-[A-Z]{5}-[A-Z]{5}$/);
  });

  test("should show validation errors for invalid input", async ({ page }) => {
    await page.goto("http://localhost:3000");

    // Try to submit empty form
    await page.click('[data-testid="register-button"]');

    // Check validation errors
    await expect(page.locator("text=Email is required")).toBeVisible();
    await expect(page.locator("text=Password is required")).toBeVisible();

    // Try weak password
    await page.fill('[data-testid="email-input"]', "test@example.com");
    await page.fill('[data-testid="password-input"]', "123");
    await page.click('[data-testid="register-button"]');

    await expect(
      page.locator("text=Password must be at least 8 characters"),
    ).toBeVisible();
  });
});
```

**Best Practices**:

- Test critical user journeys only
- Use data-testid attributes for reliable selectors
- Run against local dev environment
- Keep tests independent—no shared state
- Use page objects for complex flows

### 4. Performance Testing

Ensure application meets performance SLAs.

**Framework**: k6 (load testing), Lighthouse (web performance)
**Location**: `tests/performance/*.js`

```javascript
// Example: k6 load test
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "2m", target: 100 }, // Ramp up to 100 users
    { duration: "5m", target: 100 }, // Stay at 100 users
    { duration: "2m", target: 200 }, // Ramp up to 200 users
    { duration: "5m", target: 200 }, // Stay at 200 users
    { duration: "2m", target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests under 500ms
    http_req_failed: ["rate<0.01"], // Less than 1% error rate
  },
};

export default function () {
  // Test household creation endpoint
  const payload = JSON.stringify({
    name: `Test House ${Date.now()}`,
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${__ENV.TEST_TOKEN}`,
    },
  };

  const res = http.post(
    "https://api.petforce.app/v1/households",
    payload,
    params,
  );

  check(res, {
    "status is 201": (r) => r.status === 201,
    "response has household": (r) => JSON.parse(r.body).household !== undefined,
    "response time OK": (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

**Performance Targets**:

- API Response Time: p95 < 500ms, p99 < 1s
- Page Load Time: LCP < 2.5s, FID < 100ms, CLS < 0.1
- Throughput: 1000 req/sec sustained
- Database Query Time: p95 < 100ms

### 5. Visual Regression Testing

Catch unintended visual changes.

**Framework**: Percy (visual regression), Playwright screenshots
**Location**: `apps/web/tests/visual/*.spec.ts`

```typescript
// Example: Visual regression test
import { test } from "@playwright/test";
import percySnapshot from "@percy/playwright";

test.describe("Visual Regression Tests", () => {
  test("household dashboard should match snapshot", async ({ page }) => {
    await page.goto("http://localhost:3000/households/test-id");

    // Wait for content to load
    await page.waitForSelector('[data-testid="household-dashboard"]');

    // Take Percy snapshot
    await percySnapshot(page, "Household Dashboard");
  });

  test("invite modal in all states", async ({ page }) => {
    await page.goto("http://localhost:3000/households/test-id");

    // Default state
    await page.click('[data-testid="invite-button"]');
    await percySnapshot(page, "Invite Modal - Default");

    // After copying code
    await page.click('[data-testid="copy-code-button"]');
    await percySnapshot(page, "Invite Modal - Copied");

    // QR code tab
    await page.click('[data-testid="qr-tab"]');
    await percySnapshot(page, "Invite Modal - QR Code");
  });
});
```

**Best Practices**:

- Snapshot critical UI states
- Test responsive breakpoints (mobile, tablet, desktop)
- Test dark mode if supported
- Exclude dynamic content (timestamps, random IDs)

### 6. Contract Testing

Ensure API contracts between services are maintained.

**Framework**: Pact
**Location**: `tests/contracts/*.pact.ts`

```typescript
// Example: API contract test (consumer side)
import { PactV3, MatchersV3 } from "@pact-foundation/pact";

const { like, eachLike, iso8601DateTime } = MatchersV3;

describe("Household API Contract", () => {
  const provider = new PactV3({
    consumer: "PetForce Web App",
    provider: "PetForce API",
  });

  it("should create household and return invite code", () => {
    provider
      .given("user is authenticated")
      .uponReceiving("a request to create household")
      .withRequest({
        method: "POST",
        path: "/v1/households",
        headers: {
          "Content-Type": "application/json",
          Authorization: like("Bearer token"),
        },
        body: {
          name: "Zeder House",
        },
      })
      .willRespondWith({
        status: 201,
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          household: {
            id: like("uuid"),
            name: "Zeder House",
            created_at: iso8601DateTime(),
          },
          inviteCode: like("ZEDER-ALPHA-BRAVO"),
        },
      });

    return provider.executeTest(async (mockServer) => {
      const api = new HouseholdAPI(mockServer.url);
      const result = await api.createHousehold({ name: "Zeder House" });

      expect(result.household.name).toBe("Zeder House");
      expect(result.inviteCode).toMatch(/^[A-Z]{5}-[A-Z]{5}-[A-Z]{5}$/);
    });
  });
});
```

**Benefits**:

- Catch breaking changes before deployment
- Document API contracts as executable specs
- Enable independent service deployment

### 7. Mutation Testing

Test the quality of your tests by introducing bugs.

**Framework**: Stryker
**Location**: `stryker.conf.json`

```json
{
  "$schema": "./node_modules/@stryker-mutator/core/schema/stryker-schema.json",
  "packageManager": "npm",
  "testRunner": "vitest",
  "coverageAnalysis": "perTest",
  "mutate": ["src/**/*.ts", "!src/**/*.test.ts", "!src/**/__tests__/**"],
  "thresholds": {
    "high": 80,
    "low": 60,
    "break": 50
  }
}
```

Run mutation testing:

```bash
npx stryker run
```

**Example Output**:

```
Mutation testing complete.
Killed: 125 (78%)
Survived: 28 (17%)
Timeout: 5 (3%)
No Coverage: 2 (1%)

Mutation Score: 78% (target: 80%)
```

**Surviving Mutants** indicate weak tests:

```typescript
// Original code
if (age >= 18) {
  return "adult";
}

// Mutant: Changed >= to >
if (age > 18) {
  return "adult";
}

// This mutant survived because no test checked age === 18
// Add test:
expect(categorize(18)).toBe("adult");
```

## Testing Tools & Frameworks

### Unit & Integration Testing

**Vitest** (primary test runner)

- Fast, Vite-native test runner
- Compatible with Jest API
- ES modules support
- Watch mode with HMR

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage

# Specific file
npm test -- auth-api.test.ts
```

### E2E Testing

**Playwright** (web E2E)

- Cross-browser testing (Chromium, Firefox, WebKit)
- Auto-wait for elements
- Network interception
- Video recording

```bash
# Run E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e -- --ui

# Debug mode
npm run test:e2e -- --debug

# Specific browser
npm run test:e2e -- --project=chromium
```

**Detox** (mobile E2E)

- React Native E2E testing
- Device/simulator automation
- Gray box testing

```bash
# Build app for testing
detox build --configuration ios.sim.debug

# Run tests
detox test --configuration ios.sim.debug

# Debug mode
detox test --configuration ios.sim.debug --loglevel trace
```

### Performance Testing

**k6** (load testing)

```bash
# Run load test
k6 run tests/performance/household-api.js

# With cloud results
k6 run --out cloud tests/performance/household-api.js
```

**Lighthouse** (web performance)

```bash
# Run Lighthouse audit
lighthouse http://localhost:3000 --output html --output-path ./reports/lighthouse.html
```

### Visual Regression

**Percy** (visual testing)

```bash
# Run visual tests
percy exec -- npm run test:e2e
```

**Chromatic** (Storybook visual testing)

```bash
# Run Chromatic
npx chromatic --project-token=<token>
```

## Test Data Management

### Test Data Strategy

1. **Fixtures**: Static test data for common scenarios
2. **Factories**: Generate test data programmatically
3. **Seeders**: Populate test database with realistic data
4. **Mocks**: Simulate external dependencies

### Test Fixtures

**Location**: `src/__tests__/fixtures/*.ts`

```typescript
// fixtures/households.ts
export const householdFixtures = {
  zederHouse: {
    id: "household-1",
    name: "Zeder House",
    leader_id: "user-1",
    created_at: "2026-01-01T00:00:00Z",
  },
  smithFamily: {
    id: "household-2",
    name: "Smith Family",
    leader_id: "user-2",
    created_at: "2026-01-02T00:00:00Z",
  },
};

export const userFixtures = {
  tucker: {
    id: "user-1",
    email: "tucker@petforce.app",
    name: "Tucker Tester",
    email_confirmed_at: "2026-01-01T00:00:00Z",
  },
};
```

### Test Factories

**Library**: Fishery
**Location**: `src/__tests__/factories/*.ts`

```typescript
// factories/household.factory.ts
import { Factory } from "fishery";
import { Household } from "../../types";

export const householdFactory = Factory.define<Household>(({ sequence }) => ({
  id: `household-${sequence}`,
  name: `Test House ${sequence}`,
  leader_id: `user-${sequence}`,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}));

// Usage in tests
const household = householdFactory.build();
const households = householdFactory.buildList(3);
const customHousehold = householdFactory.build({
  name: "Custom Name",
});
```

### Database Seeding

**Location**: `src/__tests__/seeds/*.ts`

```typescript
// seeds/development.seed.ts
import { db } from "../../database";
import { households, users, pets } from "../../database/schema";

export async function seedDevelopmentData() {
  // Create test users
  const [tucker] = await db
    .insert(users)
    .values([{ email: "tucker@petforce.app", name: "Tucker Tester" }])
    .returning();

  // Create test households
  const [zederHouse] = await db
    .insert(households)
    .values([{ name: "Zeder House", leader_id: tucker.id }])
    .returning();

  // Create test pets
  await db.insert(pets).values([
    { name: "Max", type: "dog", household_id: zederHouse.id },
    { name: "Luna", type: "cat", household_id: zederHouse.id },
  ]);
}
```

### Mocking External Services

**Library**: msw (Mock Service Worker)
**Location**: `src/__tests__/mocks/*.ts`

```typescript
// mocks/supabase.mock.ts
import { rest } from "msw";
import { setupServer } from "msw/node";

export const handlers = [
  // Mock Supabase auth endpoints
  rest.post("https://project.supabase.co/auth/v1/signup", (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        user: {
          id: "mock-user-id",
          email: req.body.email,
          email_confirmed_at: null,
        },
      }),
    );
  }),

  rest.post("https://project.supabase.co/auth/v1/token", (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        access_token: "mock-token",
        user: {
          id: "mock-user-id",
          email: "test@example.com",
        },
      }),
    );
  }),
];

export const server = setupServer(...handlers);
```

## CI/CD Integration

### GitHub Actions Workflow

**Location**: `.github/workflows/test.yml`

```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run migrations
        run: npm run db:migrate
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

      - name: Run integration tests
        run: npm test -- --run integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Build app
        run: npm run build

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/

  performance-tests:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3

      - name: Run k6 load test
        uses: grafana/k6-action@v0.3.0
        with:
          filename: tests/performance/household-api.js
        env:
          K6_CLOUD_TOKEN: ${{ secrets.K6_CLOUD_TOKEN }}
```

### Quality Gates

**Required for PR Merge**:

- ✅ All unit tests pass
- ✅ All integration tests pass
- ✅ Code coverage ≥ 80%
- ✅ No high-severity security vulnerabilities
- ✅ Performance budgets met

**Deployment Gates**:

- ✅ E2E tests pass
- ✅ Load tests within thresholds
- ✅ Visual regression approved

## Quality Metrics

### Coverage Metrics

**Track with Codecov**:

- Line Coverage: % of lines executed
- Branch Coverage: % of branches executed
- Function Coverage: % of functions called

**Targets**:

- Overall: 80%+
- Critical paths: 90%+
- New code: 85%+

### Test Health Metrics

**1. Flaky Test Rate**

```
Flaky Rate = (Flaky Test Runs / Total Test Runs) * 100
Target: <1%
```

**2. Test Execution Time**

```
Unit Tests: <5 seconds
Integration Tests: <30 seconds
E2E Tests: <5 minutes
```

**3. Build Success Rate**

```
Success Rate = (Successful Builds / Total Builds) * 100
Target: >95%
```

### Defect Metrics

**1. Bug Escape Rate**

```
Escape Rate = (Bugs Found in Prod / Total Bugs) * 100
Target: <5%
```

**2. Mean Time to Detect (MTTD)**

```
Average time from bug introduction to detection
Target: <5 minutes (via monitoring)
```

**3. Mean Time to Resolve (MTTR)**

```
Average time from bug detection to fix deployed
Target: <4 hours (critical), <1 day (high)
```

## Testing Best Practices

### 1. Write Tests First (TDD)

**Red-Green-Refactor Cycle**:

1. **Red**: Write failing test
2. **Green**: Write minimal code to pass
3. **Refactor**: Improve code quality

```typescript
// 1. Red: Write failing test
describe("calculateHealthScore", () => {
  it("should return 0 for inactive user", () => {
    const score = calculateHealthScore({ lastActive: 90 });
    expect(score).toBe(0);
  });
});

// 2. Green: Make it pass
function calculateHealthScore({ lastActive }: { lastActive: number }) {
  return lastActive > 30 ? 0 : 100;
}

// 3. Refactor: Improve implementation
function calculateHealthScore({ lastActive }: { lastActive: number }) {
  const INACTIVE_THRESHOLD = 30;
  return lastActive > INACTIVE_THRESHOLD ? 0 : 100;
}
```

### 2. Test Behavior, Not Implementation

**Bad** (tests implementation):

```typescript
it("should call setState with new value", () => {
  const setState = vi.fn();
  const { result } = renderHook(() => useState(0));

  // Testing implementation detail
  expect(setState).toHaveBeenCalledWith(1);
});
```

**Good** (tests behavior):

```typescript
it('should update count when button clicked', async () => {
  render(<Counter />);

  expect(screen.getByText('Count: 0')).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: /increment/i }));

  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
```

### 3. Keep Tests Independent

**Bad** (shared state):

```typescript
let user;

beforeAll(() => {
  user = createTestUser(); // Shared across tests
});

it("test 1", () => {
  // Modifies shared user
});

it("test 2", () => {
  // Depends on test 1's modifications
});
```

**Good** (isolated):

```typescript
it("test 1", () => {
  const user = createTestUser();
  // Test in isolation
});

it("test 2", () => {
  const user = createTestUser();
  // Independent test
});
```

### 4. Use Descriptive Test Names

**Bad**:

```typescript
it("works", () => {});
it("test 1", () => {});
it("handles error", () => {});
```

**Good**:

```typescript
it("should create household when valid name provided", () => {});
it("should reject duplicate household names for same user", () => {});
it("should log error when database connection fails", () => {});
```

### 5. Arrange-Act-Assert Pattern

```typescript
it("should calculate correct health score", () => {
  // Arrange: Set up test data
  const user = {
    lastActive: 5,
    tasksCompleted: 10,
    engagementScore: 85,
  };

  // Act: Execute the function
  const score = calculateHealthScore(user);

  // Assert: Verify the result
  expect(score).toBe(95);
});
```

### 6. Test Edge Cases

```typescript
describe("divideNumbers", () => {
  // Happy path
  it("should divide positive numbers", () => {
    expect(divideNumbers(10, 2)).toBe(5);
  });

  // Edge cases
  it("should handle division by zero", () => {
    expect(() => divideNumbers(10, 0)).toThrow("Division by zero");
  });

  it("should handle negative numbers", () => {
    expect(divideNumbers(-10, 2)).toBe(-5);
  });

  it("should handle decimal results", () => {
    expect(divideNumbers(5, 2)).toBe(2.5);
  });

  it("should handle very large numbers", () => {
    expect(divideNumbers(Number.MAX_SAFE_INTEGER, 2)).toBeDefined();
  });
});
```

### 7. Mock External Dependencies

```typescript
// Mock Supabase client
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: {
      signUp: vi.fn().mockResolvedValue({
        data: { user: { id: "mock-id" } },
        error: null,
      }),
    },
  })),
}));

// Test uses mocked client
it("should register user", async () => {
  const result = await register("test@example.com", "password");
  expect(result.user.id).toBe("mock-id");
});
```

### 8. Avoid Test Interdependence

**Bad**:

```typescript
describe("User Flow", () => {
  it("should register user", () => {
    globalUser = register(); // Sets global state
  });

  it("should login user", () => {
    login(globalUser); // Depends on previous test
  });
});
```

**Good**:

```typescript
describe("User Flow", () => {
  it("should register and login user", () => {
    const user = register();
    const session = login(user);
    expect(session).toBeDefined();
  });
});
```

### 9. Use Test Doubles Appropriately

**Stub**: Provides predetermined responses

```typescript
const stubDatabase = {
  getUser: () => ({ id: "1", name: "Test" }),
};
```

**Mock**: Verifies interactions

```typescript
const mockLogger = vi.fn();
someFunction();
expect(mockLogger).toHaveBeenCalledWith("Expected message");
```

**Spy**: Observes real object

```typescript
const spy = vi.spyOn(console, "log");
someFunction();
expect(spy).toHaveBeenCalled();
```

**Fake**: Working implementation (simplified)

```typescript
class FakeDatabase {
  private data = new Map();

  async get(id) {
    return this.data.get(id);
  }

  async set(id, value) {
    this.data.set(id, value);
  }
}
```

### 10. Maintain Tests Like Production Code

- **Code Review**: Review tests with same rigor as production code
- **Refactor**: Extract helpers, use factories, avoid duplication
- **Document**: Comment complex test setups
- **Performance**: Keep tests fast
- **Readability**: Clear, self-documenting tests

## Common Testing Patterns

### Pattern 1: Testing Async Code

```typescript
it("should fetch user data", async () => {
  const user = await fetchUser("user-1");
  expect(user.name).toBe("Tucker");
});

// Or with promises
it("should fetch user data", () => {
  return fetchUser("user-1").then((user) => {
    expect(user.name).toBe("Tucker");
  });
});
```

### Pattern 2: Testing Error Handling

```typescript
it("should throw error for invalid ID", async () => {
  await expect(fetchUser("invalid")).rejects.toThrow("User not found");
});

// Or with try-catch
it("should throw error for invalid ID", async () => {
  try {
    await fetchUser("invalid");
    fail("Should have thrown error");
  } catch (error) {
    expect(error.message).toBe("User not found");
  }
});
```

### Pattern 3: Testing React Components

```typescript
import { render, screen, userEvent } from '@testing-library/react';

it('should toggle dark mode', async () => {
  render(<ThemeToggle />);

  const toggle = screen.getByRole('button', { name: /theme/i });

  // Initially light mode
  expect(document.body).toHaveClass('light');

  // Click toggle
  await userEvent.click(toggle);

  // Now dark mode
  expect(document.body).toHaveClass('dark');
});
```

### Pattern 4: Testing Custom Hooks

```typescript
import { renderHook, act } from "@testing-library/react";

it("should manage form state", () => {
  const { result } = renderHook(() => useForm({ name: "" }));

  expect(result.current.values.name).toBe("");

  act(() => {
    result.current.handleChange({ target: { name: "name", value: "Tucker" } });
  });

  expect(result.current.values.name).toBe("Tucker");
});
```

### Pattern 5: Testing API Routes

```typescript
import request from "supertest";
import app from "../server";

it("should create household", async () => {
  const response = await request(app)
    .post("/api/v1/households")
    .set("Authorization", "Bearer token")
    .send({ name: "Zeder House" })
    .expect(201);

  expect(response.body.household.name).toBe("Zeder House");
});
```

## Debugging Tests

### Vitest Debug Mode

```bash
# Run with debugger
node --inspect-brk ./node_modules/vitest/vitest.mjs --run

# Then attach debugger in VS Code or Chrome DevTools
```

### Playwright Debug Mode

```bash
# Run with headed browser and inspector
npm run test:e2e -- --debug

# Or set environment variable
PWDEBUG=1 npm run test:e2e
```

### Common Issues

**1. Flaky Tests**

- Cause: Race conditions, timing issues, shared state
- Fix: Use proper waits, isolate tests, avoid global state

**2. Slow Tests**

- Cause: Too many E2E tests, inefficient setup
- Fix: Use test pyramid, optimize fixtures, parallelize

**3. False Positives**

- Cause: Weak assertions, testing wrong thing
- Fix: Assert specific behavior, use mutation testing

**4. False Negatives**

- Cause: Missing edge cases, insufficient coverage
- Fix: Add boundary tests, review coverage gaps

## Test Maintenance

### When Tests Fail

1. **Understand the failure**: Read error message and stack trace
2. **Reproduce locally**: Run failing test in isolation
3. **Debug**: Add logging, use debugger
4. **Fix root cause**: Update code or test
5. **Verify**: Ensure test passes consistently

### Updating Tests

**When to update**:

- Requirements change
- Bugs are fixed
- Code is refactored
- Tests are flaky

**How to update**:

1. Update test first (make it fail)
2. Update implementation
3. Verify test passes
4. Review related tests

### Removing Tests

**When to remove**:

- Feature removed
- Test duplicates coverage
- Test provides no value

**How to remove**:

1. Verify coverage maintained
2. Document reason for removal
3. Remove test file
4. Update test documentation

## Resources

### Documentation

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [k6 Documentation](https://k6.io/docs/)

### Books

- "Test Driven Development" by Kent Beck
- "Growing Object-Oriented Software, Guided by Tests" by Steve Freeman
- "The Art of Unit Testing" by Roy Osherove

### Articles

- [Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)
- [Static vs Unit vs Integration vs E2E Testing](https://kentcdodds.com/blog/static-vs-unit-vs-integration-vs-e2e-tests)

---

**Tucker's Testing Wisdom**: "Tests are not optional—they're the safety net that lets you move fast without breaking things. Write tests that give you confidence, not just coverage."
