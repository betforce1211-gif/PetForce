import { test, expect } from '@playwright/test';

/**
 * Performance Load Tests for Household Management System
 * Tucker (QA Agent) - Performance Testing
 *
 * Purpose: Validate system can handle expected load
 */

test.describe('Household API - Performance Tests', () => {
  test('API can handle 100 concurrent household list requests', async ({ page }) => {
    const startTime = Date.now();
    const requests: Promise<any>[] = [];

    // Simulate 100 concurrent users
    for (let i = 0; i < 100; i++) {
      const request = page.goto('/api/households/me', {
        waitUntil: 'networkidle',
      });
      requests.push(request);
    }

    // Wait for all requests to complete
    const responses = await Promise.allSettled(requests);
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Count successful responses
    const successful = responses.filter((r) => r.status === 'fulfilled').length;

    // Assertions
    expect(successful).toBeGreaterThan(95); // 95% success rate
    expect(duration).toBeLessThan(10000); // Complete within 10 seconds
  });

  test('Household creation handles concurrent requests', async ({ request }) => {
    const concurrentCreations = 50;
    const requests: Promise<any>[] = [];

    for (let i = 0; i < concurrentCreations; i++) {
      const req = request.post('/api/households', {
        data: {
          name: `Load Test Household ${i}`,
          description: `Performance test household ${i}`,
        },
      });
      requests.push(req);
    }

    const responses = await Promise.allSettled(requests);
    const successful = responses.filter(
      (r) => r.status === 'fulfilled' && r.value.ok()
    ).length;

    // At least 90% should succeed (accounting for rate limits)
    expect(successful).toBeGreaterThan(concurrentCreations * 0.9);
  });

  test('Join request processing under load', async ({ request }) => {
    const concurrentRequests = 100;
    const requests: Promise<any>[] = [];

    // Simulate many users trying to join households simultaneously
    for (let i = 0; i < concurrentRequests; i++) {
      const req = request.post('/api/households/test-household-id/join', {
        data: {},
      });
      requests.push(req);
    }

    const startTime = Date.now();
    const responses = await Promise.allSettled(requests);
    const duration = Date.now() - startTime;

    // Should handle load within reasonable time
    expect(duration).toBeLessThan(15000); // 15 seconds max

    // Should not crash (some may fail due to rate limits, that's ok)
    const errors = responses.filter(
      (r) => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.status() >= 500)
    );
    expect(errors.length).toBeLessThan(concurrentRequests * 0.1); // <10% server errors
  });

  test('Database connection pool handles concurrent queries', async ({ request }) => {
    // Test database connection pool under load
    const concurrentQueries = 200;
    const requests: Promise<any>[] = [];

    for (let i = 0; i < concurrentQueries; i++) {
      const req = request.get('/api/households/me');
      requests.push(req);
    }

    const responses = await Promise.allSettled(requests);
    const successful = responses.filter(
      (r) => r.status === 'fulfilled' && r.value.ok()
    ).length;

    // Should handle all requests (connection pooling should prevent failures)
    expect(successful).toBeGreaterThan(concurrentQueries * 0.95);
  });

  test('Response time stays under 1 second for simple queries', async ({ request }) => {
    const iterations = 50;
    const responseTimes: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      await request.get('/api/households/me');
      const responseTime = Date.now() - startTime;
      responseTimes.push(responseTime);
    }

    // Calculate P95 and P99 latencies
    const sorted = responseTimes.sort((a, b) => a - b);
    const p95 = sorted[Math.floor(iterations * 0.95)];
    const p99 = sorted[Math.floor(iterations * 0.99)];

    // Performance SLAs
    expect(p95).toBeLessThan(1000); // P95 < 1 second
    expect(p99).toBeLessThan(2000); // P99 < 2 seconds
  });

  test('Memory usage stays stable under load', async ({ request }) => {
    // Note: This is a simplified test. In production, use proper APM tools.

    const initialMemory = process.memoryUsage().heapUsed;
    const requests: Promise<any>[] = [];

    // Generate significant load
    for (let i = 0; i < 500; i++) {
      requests.push(request.get('/api/households/me'));
    }

    await Promise.allSettled(requests);

    // Force garbage collection (if available)
    if (global.gc) {
      global.gc();
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

    // Memory increase should be reasonable (<50MB for 500 requests)
    expect(memoryIncreaseMB).toBeLessThan(50);
  });
});

test.describe('Household API - Stress Tests', () => {
  test('System recovers gracefully from rate limit', async ({ request }) => {
    const requests: Promise<any>[] = [];

    // Intentionally exceed rate limit
    for (let i = 0; i < 1000; i++) {
      requests.push(request.get('/api/households/me'));
    }

    const responses = await Promise.allSettled(requests);

    // Should get mix of success and rate limit responses
    const rateLimited = responses.filter(
      (r) => r.status === 'fulfilled' && r.value.status() === 429
    ).length;

    expect(rateLimited).toBeGreaterThan(0); // Rate limiting is working

    // Wait a bit for rate limit to reset
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Should be able to make requests again
    const recoveryResponse = await request.get('/api/households/me');
    expect(recoveryResponse.ok()).toBeTruthy();
  });

  test('Database remains responsive under heavy write load', async ({ request }) => {
    const heavyWrites = 100;
    const requests: Promise<any>[] = [];

    // Create many households simultaneously
    for (let i = 0; i < heavyWrites; i++) {
      requests.push(
        request.post('/api/households', {
          data: {
            name: `Stress Test ${i}`,
            description: 'Database stress test',
          },
        })
      );
    }

    const startTime = Date.now();
    await Promise.allSettled(requests);
    const duration = Date.now() - startTime;

    // Even under stress, should complete within reasonable time
    expect(duration).toBeLessThan(30000); // 30 seconds

    // Verify database is still responsive
    const readResponse = await request.get('/api/households/me');
    expect(readResponse.ok()).toBeTruthy();
  });
});

test.describe('Household API - Endurance Tests', () => {
  test.skip('System maintains performance over extended period', async ({ request }) => {
    // Skip by default, run manually for endurance testing
    const duration = 5 * 60 * 1000; // 5 minutes
    const interval = 1000; // 1 request per second
    const startTime = Date.now();
    let requestCount = 0;
    let errorCount = 0;

    while (Date.now() - startTime < duration) {
      try {
        const response = await request.get('/api/households/me');
        if (!response.ok()) {
          errorCount++;
        }
        requestCount++;
      } catch (error) {
        errorCount++;
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    // Error rate should stay low
    const errorRate = errorCount / requestCount;
    expect(errorRate).toBeLessThan(0.01); // <1% error rate
  });
});
