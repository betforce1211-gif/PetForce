#!/usr/bin/env node
/**
 * Send First Error to Sentry
 * Uses official Sentry SDK to send the exact error Sentry expects
 */
require('dotenv').config();
const Sentry = require('@sentry/node');

console.log('🚀 Sending your first error to Sentry...\n');

// Initialize Sentry with your DSN
Sentry.init({
  dsn: process.env.MONITORING_API_KEY || process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: 1.0,
});

console.log('✅ Sentry SDK initialized\n');
console.log('💥 Throwing error: "This is your first error!"\n');

try {
  // This is the exact error that Sentry expects
  throw new Error('This is your first error!');
} catch (error) {
  // Capture the error with Sentry
  Sentry.captureException(error);

  console.log('📡 Error captured and sent to Sentry!');
  console.log(`   Error: ${error.message}`);
}

// Flush events and wait for them to be sent
Sentry.close(2000).then(() => {
  console.log('\n✅ SUCCESS! Your first error has been sent!\n');
  console.log('📊 Check your Sentry dashboard:');
  console.log('   https://betforce1211-gif.sentry.io/issues/\n');
  console.log('   You should see: "This is your first error!"\n');
  console.log('🎉 Sentry onboarding complete!\n');
  console.log('💡 Now all errors from your app will be tracked automatically!');
});
