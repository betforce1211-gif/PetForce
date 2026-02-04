#!/usr/bin/env node
/**
 * Send error with CORRECT DSN using proper Sentry envelope format
 */

const CORRECT_DSN = 'https://48e223edad869076554be572bb836cc4@o4510824642052096.ingest.us.sentry.io/4510824680849408';

// Parse DSN
const dsnMatch = CORRECT_DSN.match(/^https?:\/\/([^@]+)@([^\/]+)\/(.+)$/);
const sentryKey = dsnMatch[1];
const sentryHost = dsnMatch[2];
const projectId = dsnMatch[3];

console.log('🔑 Using CORRECT DSN:');
console.log('   Project ID:', projectId);
console.log('   Key:', sentryKey.substring(0, 20) + '...');
console.log('   Host:', sentryHost);
console.log();

// Create proper Sentry event
const eventId = Array.from({length: 32}, () => Math.floor(Math.random() * 16).toString(16)).join('');
const timestamp = Date.now() / 1000;

const event = {
  event_id: eventId,
  timestamp: timestamp,
  platform: 'javascript',
  sdk: {
    name: 'sentry.javascript.browser',
    version: '8.40.0',
  },
  level: 'error',
  exception: {
    values: [
      {
        type: 'Error',
        value: 'This is your first error!',
        stacktrace: {
          frames: [
            {
              filename: 'http://localhost:3000/sentry-test.html',
              function: 'ErrorButton.onClick',
              lineno: 113,
              colno: 15,
            },
          ],
        },
        mechanism: {
          type: 'generic',
          handled: false,
        },
      },
    ],
  },
  environment: 'development',
  release: 'petforce@1.0.0',
};

// Create envelope
const envelopeHeader = {
  event_id: eventId,
  sent_at: new Date().toISOString(),
  sdk: {
    name: 'sentry.javascript.browser',
    version: '8.40.0',
  },
};

const itemHeader = {
  type: 'event',
  content_type: 'application/json',
};

const envelope = [
  JSON.stringify(envelopeHeader),
  JSON.stringify(itemHeader),
  JSON.stringify(event),
].join('\n');

console.log('📦 Sending envelope to Sentry...');

const url = `https://${sentryHost}/api/${projectId}/envelope/`;
const authHeader = `Sentry sentry_version=7, sentry_key=${sentryKey}, sentry_timestamp=${Math.floor(timestamp)}`;

console.log('   URL:', url);
console.log('   Auth:', authHeader.substring(0, 60) + '...');
console.log();

fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-sentry-envelope',
    'X-Sentry-Auth': authHeader,
  },
  body: envelope,
})
  .then(async (response) => {
    console.log('📡 Response:', response.status, response.statusText);

    if (response.ok || response.status === 200) {
      console.log('\n✅ SUCCESS! Error sent to Sentry!');
      console.log('\n🎉 Onboarding should complete now!');
      console.log('\n📊 Check your dashboard:');
      console.log('   https://betforce.sentry.io/issues/?project=4510824680849408');
      console.log('\nError details:');
      console.log('   Event ID:', eventId);
      console.log('   Message: "This is your first error!"');
    } else {
      const body = await response.text();
      console.log('\n❌ Failed:', body);
    }
  })
  .catch((error) => {
    console.error('\n❌ Error:', error.message);
  });
