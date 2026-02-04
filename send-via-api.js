#!/usr/bin/env node
/**
 * Send error directly via Sentry API using auth token
 * Bypasses DSN and uses your auth token instead
 */
require('dotenv').config();

const authToken = process.env.SENTRY_AUTH_TOKEN;
const projectId = '4510824667938816';
const orgSlug = 'betforce1211-gif';

console.log('🔑 Using Sentry Auth Token to send error...\n');

const errorPayload = {
  event_id: crypto.randomUUID().replace(/-/g, ''),
  timestamp: Date.now() / 1000,
  platform: 'javascript',
  level: 'error',
  exception: {
    values: [
      {
        type: 'Error',
        value: 'This is your first error!',
        stacktrace: {
          frames: [
            {
              filename: 'sentry-test.html',
              function: 'throwError',
              lineno: 114,
            },
          ],
        },
      },
    ],
  },
  environment: 'development',
  tags: {
    source: 'api-test',
  },
};

const url = `https://sentry.io/api/0/projects/${orgSlug}/javascript-react/events/`;

console.log('📡 Sending to:', url);
console.log('🔑 Using auth token:', authToken.substring(0, 20) + '...\n');

fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`,
  },
  body: JSON.stringify(errorPayload),
})
  .then(async (response) => {
    console.log('📡 Response status:', response.status, response.statusText);

    if (response.ok) {
      const data = await response.json();
      console.log('\n✅ SUCCESS! Error sent to Sentry!');
      console.log('Event ID:', data.id);
      console.log('\n📊 Check your dashboard:');
      console.log('   https://betforce1211-gif.sentry.io/issues/');
    } else {
      const error = await response.text();
      console.log('\n❌ Failed:', error);
    }
  })
  .catch((error) => {
    console.error('\n❌ Error:', error.message);
  });
