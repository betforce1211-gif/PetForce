#!/usr/bin/env node
/**
 * Test Real Error Scenarios
 * Simulates actual errors that would occur in production
 */
require('dotenv').config();

console.log('🧪 Testing Real Error Scenarios\n');
console.log('This will send realistic errors to Sentry...\n');

const sentryDSN = process.env.MONITORING_API_KEY;
const dsnMatch = sentryDSN.match(/^https?:\/\/([^@]+)@([^\/]+)\/(.+)$/);
const sentryKey = dsnMatch[1];
const sentryHost = dsnMatch[2];
const projectId = dsnMatch[3];

const url = `https://${sentryHost}/api/${projectId}/store/`;

// Simulate realistic errors
const errors = [
  {
    level: 'error',
    message: 'Database error querying schema',
    timestamp: Date.now() / 1000,
    environment: 'development',
    extra: {
      query: 'SELECT * FROM auth.users WHERE email = $1',
      error: 'relation "auth.users" does not exist',
      requestId: 'req_' + Date.now(),
    },
  },
  {
    level: 'error',
    message: 'Email rate limit exceeded',
    timestamp: Date.now() / 1000,
    environment: 'development',
    extra: {
      email: 'user@example.com',
      attemptCount: 5,
      waitTime: '60 minutes',
      requestId: 'req_' + (Date.now() + 1),
    },
  },
  {
    level: 'error',
    message: 'Login succeeded but no session in response',
    timestamp: Date.now() / 1000,
    environment: 'development',
    extra: {
      email: 'danielzeddr@gmail.com',
      responseStatus: 200,
      sessionPresent: false,
      requestId: 'req_' + (Date.now() + 2),
    },
  },
  {
    level: 'warn',
    message: 'User attempting login before email verification',
    timestamp: Date.now() / 1000,
    environment: 'development',
    extra: {
      email: 'danielzeddr@gmail.com',
      emailConfirmed: false,
      attemptCount: 3,
      requestId: 'req_' + (Date.now() + 3),
    },
  },
  {
    level: 'error',
    message: 'Household table not found during onboarding',
    timestamp: Date.now() / 1000,
    environment: 'development',
    extra: {
      table: 'households',
      operation: 'INSERT',
      userId: 'test-user-id',
      requestId: 'req_' + (Date.now() + 4),
    },
  },
];

console.log('📡 Sending 5 realistic error scenarios to Sentry...\n');

let sent = 0;
errors.forEach((payload, index) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const authHeader = `Sentry sentry_version=7, sentry_key=${sentryKey}, sentry_timestamp=${timestamp}`;

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Sentry-Auth': authHeader,
    },
    body: JSON.stringify(payload),
  })
  .then(response => {
    sent++;
    console.log(`${sent}. ${payload.message}`);
    console.log(`   ✅ Sent (${response.status})`);

    if (sent === errors.length) {
      console.log('\n✅ All errors sent to Sentry!');
      console.log('\n📊 Check your dashboard:');
      console.log('   https://betforce1211-gif.sentry.io/issues/');
      console.log('\n💡 You should see 5 new issues within 10 seconds!');
    }
  })
  .catch(error => {
    console.error(`   ❌ Failed: ${error.message}`);
  });
});
