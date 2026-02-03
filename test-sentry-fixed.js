#!/usr/bin/env node
/**
 * Test Sentry Integration (Fixed Version)
 * Uses proper DSN parsing and auth headers like monitoring.ts
 */
require('dotenv').config();

console.log('🧪 Testing Sentry Integration (Fixed)\n');
console.log('=' .repeat(60));

const sentryDSN = process.env.MONITORING_API_KEY || process.env.SENTRY_DSN;
const backend = process.env.MONITORING_BACKEND;

console.log('\n📋 Configuration:');
console.log(`   Backend: ${backend || 'NOT SET'}`);
console.log(`   DSN: ${sentryDSN ? sentryDSN.substring(0, 50) + '...' : 'NOT SET'}`);

if (!sentryDSN || backend !== 'sentry') {
  console.log('\n❌ Sentry not configured properly!');
  console.log('   Make sure .env has:');
  console.log('   MONITORING_BACKEND=sentry');
  console.log('   MONITORING_API_KEY=<your-dsn>');
  process.exit(1);
}

console.log('\n✅ Sentry is configured!');

// Parse DSN like monitoring.ts does: https://KEY@HOST/PROJECT_ID
const dsnMatch = sentryDSN.match(/^https?:\/\/([^@]+)@([^\/]+)\/(.+)$/);
if (!dsnMatch) {
  console.error('\n❌ Invalid Sentry DSN format!');
  process.exit(1);
}

const sentryKey = dsnMatch[1];
const sentryHost = dsnMatch[2];
const projectId = dsnMatch[3];

console.log('\n🔍 Parsed DSN:');
console.log(`   Host: ${sentryHost}`);
console.log(`   Project ID: ${projectId}`);
console.log(`   Key: ${sentryKey.substring(0, 10)}...`);

console.log('\n🚀 Testing error capture...');

const testPayload = {
  level: 'error',
  message: 'Test error from PetForce - Sentry integration working!',
  timestamp: Date.now() / 1000,
  environment: process.env.NODE_ENV || 'development',
  extra: {
    test: true,
    requestId: 'test_' + Date.now(),
    feature: 'monitoring-setup',
  },
};

// Build proper Sentry ingestion endpoint
const url = `https://${sentryHost}/api/${projectId}/store/`;

// Generate auth header
const timestamp = Math.floor(Date.now() / 1000);
const authHeader = `Sentry sentry_version=7, sentry_key=${sentryKey}, sentry_timestamp=${timestamp}`;

console.log(`\n📡 Sending to: ${url}`);
console.log(`   Auth: Sentry sentry_version=7, sentry_key=${sentryKey.substring(0, 10)}..., sentry_timestamp=${timestamp}`);

fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Sentry-Auth': authHeader,
  },
  body: JSON.stringify(testPayload),
})
.then(response => {
  console.log(`\n📡 Response received`);
  console.log(`   Status: ${response.status} ${response.statusText}`);

  if (response.ok || response.status === 200) {
    console.log('\n✅ SUCCESS! Sentry received the test error!');
    console.log('\n📊 Check your Sentry dashboard:');
    console.log('   https://betforce1211-gif.sentry.io/issues/');
    console.log('\n   You should see: "Test error from PetForce - Sentry integration working!"');
    console.log('\n💡 From now on, ALL errors will appear in your Sentry dashboard!');
    console.log('\n🎯 The monitoring system is working correctly!');
  } else {
    console.log('\n⚠️  Unexpected status code. Checking response...');
    return response.text().then(body => {
      console.log('   Response body:', body);
    });
  }
})
.catch(error => {
  console.error('\n❌ Error sending to Sentry:', error.message);
  console.error(error.stack);
})
.finally(() => {
  console.log('\n' + '='.repeat(60));
});
