# Advanced Testing Strategies

This document covers advanced testing patterns, strategies, and techniques for complex scenarios.

## Table of Contents

- [Testing Strategies by Feature Type](#testing-strategies-by-feature-type)
- [Chaos Engineering](#chaos-engineering)
- [Property-Based Testing](#property-based-testing)
- [Snapshot Testing](#snapshot-testing)
- [Testing Microservices](#testing-microservices)
- [Testing Real-Time Features](#testing-real-time-features)
- [Testing Mobile Apps](#testing-mobile-apps)
- [Security Testing](#security-testing)
- [Accessibility Testing](#accessibility-testing)
- [Database Testing](#database-testing)
- [API Testing Strategies](#api-testing-strategies)
- [Test Automation Patterns](#test-automation-patterns)
- [Handling Test Data at Scale](#handling-test-data-at-scale)

## Testing Strategies by Feature Type

### Authentication & Authorization

**Critical Paths**:

- Registration flow
- Login/logout
- Password reset
- Email verification
- Session management
- Role-based access control (RBAC)

**Test Strategy**:

```typescript
describe("Authentication Security", () => {
  describe("Registration", () => {
    it("should hash passwords before storage", async () => {
      const password = "MySecurePassword123!";
      await register("test@example.com", password);

      const user = await db.query.users.findFirst({
        where: eq(users.email, "test@example.com"),
      });

      // Password should be hashed (bcrypt starts with $2b$)
      expect(user.password_hash).toMatch(/^\$2b\$/);
      expect(user.password_hash).not.toBe(password);
    });

    it("should prevent SQL injection in email field", async () => {
      const maliciousEmail = "admin'; DROP TABLE users; --";

      await expect(register(maliciousEmail, "password")).rejects.toThrow(
        "Invalid email format",
      );

      // Verify users table still exists
      const users = await db.query.users.findMany();
      expect(users).toBeDefined();
    });

    it("should rate limit registration attempts", async () => {
      const attempts = Array(10)
        .fill(null)
        .map((_, i) => register(`test${i}@example.com`, "password"));

      await Promise.allSettled(attempts);

      // 11th attempt should be rate limited
      await expect(register("test11@example.com", "password")).rejects.toThrow(
        "Too many registration attempts",
      );
    });
  });

  describe("Session Management", () => {
    it("should invalidate sessions on logout", async () => {
      const { session } = await login("test@example.com", "password");

      await logout(session.token);

      await expect(makeAuthenticatedRequest(session.token)).rejects.toThrow(
        "Invalid session",
      );
    });

    it("should expire sessions after inactivity", async () => {
      const { session } = await login("test@example.com", "password");

      // Fast-forward time by 31 days
      vi.setSystemTime(Date.now() + 31 * 24 * 60 * 60 * 1000);

      await expect(makeAuthenticatedRequest(session.token)).rejects.toThrow(
        "Session expired",
      );
    });
  });

  describe("Authorization", () => {
    it("should prevent access to other households", async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const household = await createHousehold(user1.id);

      await expect(accessHousehold(household.id, user2.id)).rejects.toThrow(
        "Access denied",
      );
    });

    it("should enforce household leader permissions", async () => {
      const leader = await createTestUser();
      const member = await createTestUser();
      const household = await createHousehold(leader.id);

      await addMember(household.id, member.id);

      // Member cannot delete household
      await expect(deleteHousehold(household.id, member.id)).rejects.toThrow(
        "Only household leader can delete",
      );

      // Leader can delete
      await expect(
        deleteHousehold(household.id, leader.id),
      ).resolves.toBeDefined();
    });
  });
});
```

### Real-Time Features (WebSocket, Server-Sent Events)

**Test Strategy**:

```typescript
describe("Real-Time Updates", () => {
  it("should broadcast task completion to all household members", async () => {
    const household = await createTestHousehold();
    const [member1, member2] = await Promise.all([
      createWebSocketClient(household.member1.token),
      createWebSocketClient(household.member2.token),
    ]);

    const member1Updates = [];
    const member2Updates = [];

    member1.on("task_completed", (data) => member1Updates.push(data));
    member2.on("task_completed", (data) => member2Updates.push(data));

    // Member 1 completes a task
    await completeTask(household.task.id, household.member1.id);

    // Wait for WebSocket messages
    await wait(100);

    // Both members should receive update
    expect(member1Updates).toHaveLength(1);
    expect(member2Updates).toHaveLength(1);
    expect(member1Updates[0].task_id).toBe(household.task.id);
    expect(member2Updates[0].task_id).toBe(household.task.id);
  });

  it("should handle WebSocket reconnection gracefully", async () => {
    const household = await createTestHousehold();
    const client = await createWebSocketClient(household.member1.token);

    const updates = [];
    client.on("task_completed", (data) => updates.push(data));

    // Complete task while connected
    await completeTask(household.task1.id, household.member1.id);
    await wait(100);
    expect(updates).toHaveLength(1);

    // Simulate connection drop
    client.disconnect();

    // Complete task while disconnected
    await completeTask(household.task2.id, household.member1.id);

    // Reconnect
    await client.reconnect();
    await wait(100);

    // Should receive missed update after reconnection
    expect(updates).toHaveLength(2);
    expect(updates[1].task_id).toBe(household.task2.id);
  });
});
```

### File Uploads

**Test Strategy**:

```typescript
describe("File Upload", () => {
  it("should upload pet photo", async () => {
    const pet = await createTestPet();
    const photoFile = createTestImage(1024, 768); // Create test image

    const result = await uploadPetPhoto(pet.id, photoFile);

    expect(result.url).toMatch(/^https:\/\/storage/);
    expect(result.size).toBe(photoFile.size);

    // Verify file accessible
    const response = await fetch(result.url);
    expect(response.ok).toBe(true);
  });

  it("should reject files exceeding size limit", async () => {
    const pet = await createTestPet();
    const largeFile = createTestImage(5000, 5000); // 10MB+

    await expect(uploadPetPhoto(pet.id, largeFile)).rejects.toThrow(
      "File size exceeds 5MB limit",
    );
  });

  it("should reject non-image files", async () => {
    const pet = await createTestPet();
    const pdfFile = new File(["content"], "doc.pdf", {
      type: "application/pdf",
    });

    await expect(uploadPetPhoto(pet.id, pdfFile)).rejects.toThrow(
      "Only image files allowed",
    );
  });

  it("should sanitize file names", async () => {
    const pet = await createTestPet();
    const file = new File(["content"], "../../../etc/passwd.jpg", {
      type: "image/jpeg",
    });

    const result = await uploadPetPhoto(pet.id, file);

    // File name should be sanitized
    expect(result.url).not.toContain("..");
    expect(result.url).not.toContain("/etc/passwd");
  });
});
```

### Payment Processing

**Test Strategy**:

```typescript
describe("Payment Processing", () => {
  it("should process successful payment", async () => {
    const user = await createTestUser();
    const paymentMethod = createTestPaymentMethod();

    const result = await processPayment({
      userId: user.id,
      amount: 999, // $9.99
      paymentMethod,
    });

    expect(result.status).toBe("succeeded");
    expect(result.amount).toBe(999);

    // Verify subscription activated
    const subscription = await getSubscription(user.id);
    expect(subscription.status).toBe("active");
  });

  it("should handle declined payment", async () => {
    const user = await createTestUser();
    const declinedCard = createTestPaymentMethod({ decline: true });

    await expect(
      processPayment({
        userId: user.id,
        amount: 999,
        paymentMethod: declinedCard,
      }),
    ).rejects.toThrow("Payment declined");

    // Verify subscription not activated
    const subscription = await getSubscription(user.id);
    expect(subscription).toBeNull();
  });

  it("should ensure idempotency for duplicate requests", async () => {
    const user = await createTestUser();
    const paymentMethod = createTestPaymentMethod();
    const idempotencyKey = "unique-key-123";

    const payment1 = await processPayment({
      userId: user.id,
      amount: 999,
      paymentMethod,
      idempotencyKey,
    });

    // Same request with same idempotency key
    const payment2 = await processPayment({
      userId: user.id,
      amount: 999,
      paymentMethod,
      idempotencyKey,
    });

    // Should return same payment ID
    expect(payment1.id).toBe(payment2.id);

    // User should only be charged once
    const charges = await getCharges(user.id);
    expect(charges).toHaveLength(1);
  });
});
```

## Chaos Engineering

Test system resilience by introducing failures.

### Fault Injection

**Library**: `fault` (custom fault injection library)

```typescript
import { injectFault } from "../test-utils/fault-injection";

describe("Chaos Engineering", () => {
  it("should handle database connection loss", async () => {
    const household = await createTestHousehold();

    // Inject database failure
    injectFault("database", {
      type: "disconnect",
      probability: 1.0,
      duration: 5000, // 5 seconds
    });

    // App should queue operations
    const promise = createTask(household.id, { name: "Feed dog" });

    // Wait for reconnection
    await wait(6000);

    // Operation should complete after reconnection
    const task = await promise;
    expect(task.name).toBe("Feed dog");
  });

  it("should degrade gracefully when storage unavailable", async () => {
    const pet = await createTestPet();

    // Inject storage failure
    injectFault("storage", {
      type: "unavailable",
      probability: 1.0,
    });

    // Photo upload should fail gracefully
    const result = await uploadPetPhoto(pet.id, createTestImage());

    expect(result.error).toBe("Storage temporarily unavailable");
    expect(result.fallbackUrl).toBeDefined(); // Should use default image
  });

  it("should handle network latency", async () => {
    // Inject network delay
    injectFault("network", {
      type: "latency",
      delay: 3000, // 3 second delay
    });

    const startTime = Date.now();
    const households = await fetchHouseholds();
    const endTime = Date.now();

    // Request should complete despite latency
    expect(households).toBeDefined();
    expect(endTime - startTime).toBeGreaterThan(3000);

    // UI should show loading state
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });
});
```

### Resilience Patterns

```typescript
describe("Resilience Patterns", () => {
  it("should implement circuit breaker for external API", async () => {
    // Simulate external API failures
    const failingApi = mockExternalApi({ failureRate: 1.0 });

    // First 5 requests should fail and trip circuit breaker
    for (let i = 0; i < 5; i++) {
      await expect(callExternalApi()).rejects.toThrow();
    }

    // Circuit breaker should be open (fast-fail)
    const startTime = Date.now();
    await expect(callExternalApi()).rejects.toThrow("Circuit breaker open");
    const duration = Date.now() - startTime;

    // Should fail fast (not wait for timeout)
    expect(duration).toBeLessThan(100);

    // Reset API to succeed
    failingApi.setSuccessRate(1.0);

    // Wait for circuit breaker timeout (30 seconds)
    vi.setSystemTime(Date.now() + 30000);

    // Circuit breaker should allow retry
    const result = await callExternalApi();
    expect(result).toBeDefined();
  });

  it("should implement retry with exponential backoff", async () => {
    let attemptCount = 0;
    const flakeyApi = vi.fn(() => {
      attemptCount++;
      if (attemptCount < 3) {
        throw new Error("Temporary failure");
      }
      return { data: "success" };
    });

    const result = await retryWithBackoff(flakeyApi, {
      maxRetries: 3,
      initialDelay: 100,
      maxDelay: 1000,
      factor: 2,
    });

    expect(result.data).toBe("success");
    expect(attemptCount).toBe(3);

    // Verify exponential backoff delays: 100ms, 200ms
    // (actual timing verification would need precise timing mocks)
  });
});
```

## Property-Based Testing

Test properties that should hold for all inputs.

**Library**: `fast-check`

```typescript
import fc from "fast-check";

describe("Property-Based Testing", () => {
  it("invite code should always be valid format", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }), // Any household name
        (householdName) => {
          const code = generateInviteCode(householdName);

          // Property: Code should always match format
          expect(code).toMatch(/^[A-Z]{5}-[A-Z]{5}-[A-Z]{5}$/);

          // Property: Code should be parseable
          const parts = code.split("-");
          expect(parts).toHaveLength(3);
          parts.forEach((part) => {
            expect(part).toHaveLength(5);
            expect(part).toMatch(/^[A-Z]+$/);
          });
        },
      ),
    );
  });

  it("health score should be between 0 and 100", () => {
    fc.assert(
      fc.property(
        fc.record({
          lastActive: fc.integer({ min: 0, max: 365 }),
          tasksCompleted: fc.integer({ min: 0, max: 1000 }),
          engagementScore: fc.integer({ min: 0, max: 100 }),
        }),
        (userData) => {
          const score = calculateHealthScore(userData);

          // Property: Score should always be in valid range
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(100);
        },
      ),
    );
  });

  it("invite code generation should be reversible", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (householdName) => {
          const code = generateInviteCode(householdName);
          const parsed = parseInviteCode(code);

          // Property: First part should match household name
          expect(parsed.householdPrefix).toBe(
            sanitizeHouseholdName(householdName).substring(0, 5).toUpperCase(),
          );
        },
      ),
    );
  });
});
```

## Snapshot Testing

Capture component/output snapshots for regression testing.

```typescript
describe('Component Snapshots', () => {
  it('should match household card snapshot', () => {
    const household = {
      id: 'household-1',
      name: 'Zeder House',
      memberCount: 3,
      petCount: 5,
    };

    const { container } = render(<HouseholdCard household={household} />);

    expect(container).toMatchSnapshot();
  });

  it('should match error state snapshot', () => {
    const { container } = render(
      <ErrorBoundary error="Something went wrong" />
    );

    expect(container).toMatchSnapshot();
  });

  it('should match API response snapshot', async () => {
    const response = await fetchHouseholds();

    // Snapshot API response structure
    expect(response).toMatchSnapshot({
      households: expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          created_at: expect.any(String),
        }),
      ]),
    });
  });
});
```

**When to Update Snapshots**:

- Intentional UI changes
- API contract changes
- After reviewing diff carefully

**Update Command**:

```bash
npm test -- -u  # Update all snapshots
npm test -- --testNamePattern="household card" -u  # Update specific test
```

## Testing Microservices

### Contract Testing with Pact

**Consumer Test** (Web App):

```typescript
import { PactV3 } from "@pact-foundation/pact";

describe("Household Service Contract", () => {
  const provider = new PactV3({
    consumer: "PetForce Web",
    provider: "Household Service",
  });

  it("should get household by ID", () => {
    provider
      .given("household exists")
      .uponReceiving("a request for household")
      .withRequest({
        method: "GET",
        path: "/api/v1/households/household-1",
        headers: {
          Authorization: "Bearer token",
        },
      })
      .willRespondWith({
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: {
          id: "household-1",
          name: like("Zeder House"),
          leader_id: like("user-1"),
          created_at: iso8601DateTime(),
        },
      });

    return provider.executeTest(async (mockServer) => {
      const client = new HouseholdClient(mockServer.url);
      const household = await client.getHousehold("household-1");

      expect(household.name).toBe("Zeder House");
    });
  });
});
```

**Provider Verification** (Household Service):

```typescript
import { Verifier } from "@pact-foundation/pact";

describe("Household Service Provider", () => {
  it("should satisfy all consumer contracts", () => {
    return new Verifier({
      provider: "Household Service",
      providerBaseUrl: "http://localhost:4000",
      pactUrls: [
        "./pacts/petforce-web-household-service.json",
        "./pacts/petforce-mobile-household-service.json",
      ],
      stateHandlers: {
        "household exists": async () => {
          // Set up test data
          await createTestHousehold({
            id: "household-1",
            name: "Zeder House",
          });
        },
      },
    }).verifyProvider();
  });
});
```

### Service Integration Testing

```typescript
describe("Microservice Integration", () => {
  it("should create household and send notification", async () => {
    // Start services in containers
    const services = await startTestServices([
      "household-service",
      "notification-service",
    ]);

    // Create household
    const household = await services.household.createHousehold({
      name: "Zeder House",
      userId: "user-1",
    });

    // Verify notification sent
    await wait(1000); // Allow time for async notification

    const notifications =
      await services.notification.getNotifications("user-1");
    expect(notifications).toContainEqual(
      expect.objectContaining({
        type: "household_created",
        household_id: household.id,
      }),
    );

    // Cleanup
    await services.stop();
  });
});
```

## Testing Real-Time Features

### WebSocket Testing

```typescript
describe("WebSocket Communication", () => {
  let wss: WebSocketServer;
  let client: WebSocket;

  beforeEach(() => {
    wss = new WebSocketServer({ port: 8080 });
    client = new WebSocket("ws://localhost:8080");
  });

  afterEach(() => {
    client.close();
    wss.close();
  });

  it("should receive real-time task updates", (done) => {
    client.on("open", () => {
      client.send(
        JSON.stringify({
          type: "subscribe",
          channel: "household:household-1",
        }),
      );
    });

    client.on("message", (data) => {
      const message = JSON.parse(data.toString());

      if (message.type === "task_completed") {
        expect(message.task_id).toBe("task-1");
        done();
      }
    });

    // Simulate task completion
    setTimeout(() => {
      wss.clients.forEach((client) => {
        client.send(
          JSON.stringify({
            type: "task_completed",
            task_id: "task-1",
          }),
        );
      });
    }, 100);
  });
});
```

### Server-Sent Events Testing

```typescript
describe("Server-Sent Events", () => {
  it("should receive server events", async () => {
    const events: string[] = [];

    const eventSource = new EventSource("http://localhost:3000/api/events");

    eventSource.onmessage = (event) => {
      events.push(event.data);
    };

    // Trigger server event
    await triggerServerEvent({ type: "task_completed" });

    // Wait for event
    await waitFor(() => {
      expect(events).toContain("task_completed");
    });

    eventSource.close();
  });
});
```

## Testing Mobile Apps

### React Native Testing

```typescript
import { render, fireEvent, waitFor } from '@testing-library/react-native';

describe('HouseholdScreen', () => {
  it('should display household details', () => {
    const household = {
      id: 'household-1',
      name: 'Zeder House',
      memberCount: 3,
    };

    const { getByText } = render(<HouseholdScreen household={household} />);

    expect(getByText('Zeder House')).toBeTruthy();
    expect(getByText('3 members')).toBeTruthy();
  });

  it('should navigate to create task screen', async () => {
    const navigation = { navigate: vi.fn() };
    const { getByText } = render(<HouseholdScreen navigation={navigation} />);

    fireEvent.press(getByText('Add Task'));

    await waitFor(() => {
      expect(navigation.navigate).toHaveBeenCalledWith('CreateTask');
    });
  });
});
```

### Detox E2E Testing

```typescript
describe("Mobile App E2E", () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it("should complete registration flow", async () => {
    await element(by.id("email-input")).typeText("tucker@petforce.app");
    await element(by.id("password-input")).typeText("SecureP@ss123");
    await element(by.id("register-button")).tap();

    await waitFor(element(by.text("Check your email")))
      .toBeVisible()
      .withTimeout(5000);
  });

  it("should create household", async () => {
    // Assume logged in
    await element(by.id("create-household-button")).tap();
    await element(by.id("household-name-input")).typeText("Tucker's House");
    await element(by.id("submit-button")).tap();

    await waitFor(element(by.text("Tucker's House")))
      .toBeVisible()
      .withTimeout(5000);
  });
});
```

## Security Testing

### OWASP Top 10 Tests

```typescript
describe('Security Tests', () => {
  describe('A1: Injection', () => {
    it('should prevent SQL injection', async () => {
      const maliciousInput = "'; DROP TABLE users; --";

      await expect(
        searchHouseholds(maliciousInput)
      ).resolves.not.toThrow();

      // Verify table still exists
      const users = await db.query.users.findMany();
      expect(users).toBeDefined();
    });

    it('should prevent NoSQL injection', async () => {
      const maliciousQuery = { $gt: '' }; // MongoDB injection

      await expect(
        findUser(maliciousQuery)
      ).rejects.toThrow('Invalid query');
    });
  });

  describe('A2: Broken Authentication', () => {
    it('should enforce strong passwords', async () => {
      await expect(
        register('test@example.com', '123')
      ).rejects.toThrow('Password must be at least 8 characters');

      await expect(
        register('test@example.com', 'password')
      ).rejects.toThrow('Password must contain uppercase, lowercase, and number');
    });

    it('should lock account after failed attempts', async () => {
      const email = 'test@example.com';

      // 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await expect(login(email, 'wrong')).rejects.toThrow();
      }

      // 6th attempt should be locked
      await expect(
        login(email, 'correct-password')
      ).rejects.toThrow('Account locked due to too many failed attempts');
    });
  });

  describe('A3: Sensitive Data Exposure', () => {
    it('should not expose passwords in API responses', async () => {
      const user = await register('test@example.com', 'SecureP@ss123');

      expect(user.password).toBeUndefined();
      expect(user.password_hash).toBeUndefined();
    });

    it('should redact sensitive data in logs', async () => {
      const logSpy = vi.spyOn(logger, 'info');

      await login('test@example.com', 'SecureP@ss123');

      const logCalls = logSpy.mock.calls.flat().join(' ');
      expect(logCalls).not.toContain('SecureP@ss123');
      expect(logCalls).toContain('[REDACTED]');
    });
  });

  describe('A5: Broken Access Control', () => {
    it('should enforce household access control', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const household = await createHousehold(user1.id);

      await expect(
        getHousehold(household.id, user2.id)
      ).rejects.toThrow('Access denied');
    });
  });

  describe('A7: Cross-Site Scripting (XSS)', () => {
    it('should sanitize user input', () => {
      const maliciousName = '<script>alert("XSS")</script>';
      const sanitized = sanitizeHouseholdName(maliciousName);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
    });

    it('should escape HTML in rendered output', () => {
      const household = { name: '<img src=x onerror=alert(1)>' };
      const { container } = render(<HouseholdCard household={household} />);

      // HTML should be escaped, not executed
      expect(container.innerHTML).not.toContain('<img src=x');
      expect(container.innerHTML).toContain('&lt;img');
    });
  });
});
```

### Penetration Testing

```typescript
describe("Penetration Tests", () => {
  it("should prevent brute force attacks", async () => {
    const email = "test@example.com";
    const attempts = 100;

    const startTime = Date.now();

    for (let i = 0; i < attempts; i++) {
      try {
        await login(email, `password${i}`);
      } catch (error) {
        // Expected to fail
      }
    }

    const duration = Date.now() - startTime;

    // Rate limiting should slow down attempts
    // 100 attempts should take at least 10 seconds (100ms per attempt)
    expect(duration).toBeGreaterThan(10000);
  });

  it("should prevent timing attacks on password comparison", async () => {
    const user = await register("test@example.com", "SecureP@ss123");

    // Measure time for wrong password
    const wrongStart = Date.now();
    try {
      await login("test@example.com", "wrong");
    } catch {}
    const wrongDuration = Date.now() - wrongStart;

    // Measure time for partially correct password
    const partialStart = Date.now();
    try {
      await login("test@example.com", "SecureP@ss");
    } catch {}
    const partialDuration = Date.now() - partialStart;

    // Timing should be constant (not reveal password length)
    const difference = Math.abs(wrongDuration - partialDuration);
    expect(difference).toBeLessThan(50); // Less than 50ms difference
  });
});
```

## Accessibility Testing

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Accessibility', () => {
  it('should have no a11y violations', async () => {
    const { container } = render(<HouseholdDashboard />);

    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it('should be keyboard navigable', () => {
    render(<HouseholdForm />);

    const nameInput = screen.getByLabelText('Household Name');
    const submitButton = screen.getByRole('button', { name: /create/i });

    // Tab navigation
    nameInput.focus();
    expect(nameInput).toHaveFocus();

    userEvent.tab();
    expect(submitButton).toHaveFocus();

    // Enter key should submit
    userEvent.keyboard('{Enter}');
    expect(mockSubmit).toHaveBeenCalled();
  });

  it('should have proper ARIA labels', () => {
    render(<HouseholdCard household={mockHousehold} />);

    expect(screen.getByRole('button', { name: /edit household/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete household/i })).toBeInTheDocument();
  });

  it('should announce dynamic content to screen readers', async () => {
    render(<TaskList />);

    const announcement = screen.getByRole('status', { hidden: true });

    // Complete a task
    await userEvent.click(screen.getByRole('button', { name: /complete/i }));

    // Screen reader announcement
    expect(announcement).toHaveTextContent('Task completed successfully');
  });
});
```

## Database Testing

```typescript
describe("Database Tests", () => {
  describe("Transaction Handling", () => {
    it("should rollback on error", async () => {
      await expect(async () => {
        await db.transaction(async (tx) => {
          await tx.insert(households).values({ name: "Test House" });
          throw new Error("Simulated error");
        });
      }).rejects.toThrow();

      // Household should not exist (rolled back)
      const households = await db.query.households.findMany();
      expect(households).toHaveLength(0);
    });

    it("should commit on success", async () => {
      await db.transaction(async (tx) => {
        await tx.insert(households).values({ name: "Test House" });
        await tx.insert(pets).values({ name: "Max", household_id: "test" });
      });

      // Both records should exist
      const allHouseholds = await db.query.households.findMany();
      const allPets = await db.query.pets.findMany();

      expect(allHouseholds).toHaveLength(1);
      expect(allPets).toHaveLength(1);
    });
  });

  describe("Constraint Enforcement", () => {
    it("should enforce unique constraints", async () => {
      await createHousehold({ name: "Zeder House", userId: "user-1" });

      await expect(
        createHousehold({ name: "Zeder House", userId: "user-1" }),
      ).rejects.toThrow(/unique constraint/i);
    });

    it("should enforce foreign key constraints", async () => {
      await expect(
        db.insert(pets).values({
          name: "Max",
          household_id: "non-existent-id",
        }),
      ).rejects.toThrow(/foreign key constraint/i);
    });
  });

  describe("Query Performance", () => {
    it("should use indexes for common queries", async () => {
      // Populate database with test data
      await seedLargeDataset();

      const explainResult = await db.execute(sql`
        EXPLAIN ANALYZE
        SELECT * FROM households WHERE leader_id = 'user-1'
      `);

      // Verify index is used (not sequential scan)
      expect(explainResult).toContain("Index Scan");
      expect(explainResult).not.toContain("Seq Scan");
    });
  });
});
```

## API Testing Strategies

```typescript
describe("API Testing", () => {
  describe("Request Validation", () => {
    it("should validate request body schema", async () => {
      const response = await request(app)
        .post("/api/v1/households")
        .send({ invalid: "data" }) // Missing required fields
        .expect(400);

      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: "name",
          message: "Name is required",
        }),
      );
    });

    it("should enforce content-type header", async () => {
      await request(app)
        .post("/api/v1/households")
        .set("Content-Type", "text/plain")
        .send("invalid")
        .expect(415); // Unsupported Media Type
    });
  });

  describe("Response Format", () => {
    it("should return consistent error format", async () => {
      const response = await request(app)
        .get("/api/v1/households/invalid-id")
        .expect(404);

      expect(response.body).toMatchObject({
        error: {
          code: "HOUSEHOLD_NOT_FOUND",
          message: expect.any(String),
          details: expect.any(Object),
        },
      });
    });

    it("should include request ID in response", async () => {
      const response = await request(app).get("/api/v1/households").expect(200);

      expect(response.headers["x-request-id"]).toMatch(/^[a-f0-9-]{36}$/);
    });
  });

  describe("Rate Limiting", () => {
    it("should enforce rate limits", async () => {
      // Make 100 requests rapidly
      const requests = Array(100)
        .fill(null)
        .map(() => request(app).get("/api/v1/households"));

      const responses = await Promise.all(requests);

      // Some should be rate limited
      const rateLimited = responses.filter((r) => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });
});
```

## Test Automation Patterns

### Page Object Pattern

```typescript
class HouseholdPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto("/households");
  }

  async createHousehold(name: string) {
    await this.page.click('[data-testid="create-button"]');
    await this.page.fill('[data-testid="name-input"]', name);
    await this.page.click('[data-testid="submit-button"]');
  }

  async getHouseholdNames() {
    const elements = await this.page.$$('[data-testid="household-name"]');
    return Promise.all(elements.map((el) => el.textContent()));
  }

  async deleteHousehold(name: string) {
    await this.page.click(
      `[data-household="${name}"] [data-testid="delete-button"]`,
    );
    await this.page.click('[data-testid="confirm-delete"]');
  }
}

// Usage in tests
it("should manage households", async ({ page }) => {
  const householdPage = new HouseholdPage(page);

  await householdPage.navigate();
  await householdPage.createHousehold("Zeder House");

  const names = await householdPage.getHouseholdNames();
  expect(names).toContain("Zeder House");
});
```

### Builder Pattern for Test Data

```typescript
class HouseholdBuilder {
  private household = {
    name: "Test House",
    leader_id: "user-1",
    members: [],
    pets: [],
  };

  withName(name: string) {
    this.household.name = name;
    return this;
  }

  withLeader(leaderId: string) {
    this.household.leader_id = leaderId;
    return this;
  }

  withMembers(count: number) {
    this.household.members = Array(count)
      .fill(null)
      .map((_, i) => ({
        id: `member-${i}`,
        name: `Member ${i}`,
      }));
    return this;
  }

  withPets(count: number) {
    this.household.pets = Array(count)
      .fill(null)
      .map((_, i) => ({
        id: `pet-${i}`,
        name: `Pet ${i}`,
      }));
    return this;
  }

  async build() {
    return await createHousehold(this.household);
  }
}

// Usage
const household = await new HouseholdBuilder()
  .withName("Zeder House")
  .withMembers(3)
  .withPets(5)
  .build();
```

## Handling Test Data at Scale

### Data Cleanup Strategies

```typescript
describe("Data Cleanup", () => {
  afterEach(async () => {
    // Strategy 1: Delete specific test data
    await db.delete(households).where(like(households.name, "Test%"));
  });

  afterAll(async () => {
    // Strategy 2: Truncate tables
    await db.execute(sql`TRUNCATE households, pets CASCADE`);
  });

  it("uses strategy 3: separate test database", async () => {
    // Each test gets a fresh database
    const testDb = await createTestDatabase();

    // Run test with testDb
    await testDb.insert(households).values({ name: "Test House" });

    // Cleanup: Drop test database
    await testDb.destroy();
  });
});
```

### Parallel Test Execution

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    // Run tests in parallel
    threads: true,
    maxThreads: 4,

    // Isolate tests
    isolate: true,

    // Separate database per worker
    setupFiles: ["./test/setup-per-worker.ts"],
  },
});

// test/setup-per-worker.ts
import { beforeAll, afterAll } from "vitest";

let workerDb: Database;

beforeAll(async () => {
  // Each worker gets its own database
  const workerId = process.env.VITEST_WORKER_ID;
  workerDb = await createTestDatabase(`test_db_${workerId}`);
});

afterAll(async () => {
  await workerDb.destroy();
});
```

---

**Tucker's Wisdom**: "Advanced testing isn't about more tests—it's about smarter tests that catch the bugs production would expose."
