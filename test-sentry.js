#!/usr/bin/env node
/**
 * Test Sentry Integration
 * Sends a test error to verify Sentry is receiving events
 */
require('dotenv').config();

console.log('🧪 Testing Sentry Integration\n');
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
console.log('\n🚀 Testing error capture...');

// Simulate the monitoring system sending an error
const testError = {
  timestamp: new Date().toISOString(),
  level: 'error',
  message: 'Test error from PetForce - Sentry integration working!',
  environment: process.env.NODE_ENV || 'development',
  extra: {
    test: true,
    requestId: 'test_' + Date.now(),
    feature: 'monitoring-setup',
  }
};

// Use fetch to send to Sentry (same way our monitoring.ts does it)
if (typeof fetch === 'undefined') {
  // Node.js < 18 doesn't have fetch, use https
  const https = require('https');
  const url = new URL(sentryDSN);

  const payload = JSON.stringify(testError);

  const options = {
    hostname: url.hostname,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': payload.length,
    }
  };

  const req = https.request(options, (res) => {
    console.log(`\n📡 Sent test error to Sentry`);
    console.log(`   Status: ${res.statusCode}`);

    if (res.statusCode === 200 || res.statusCode === 202) {
      console.log('\n✅ SUCCESS! Sentry received the test error!');
      console.log('\n📊 Check your Sentry dashboard:');
      console.log('   https://betforce1211-gif.sentry.io/issues/');
      console.log('\n   You should see: "Test error from PetForce - Sentry integration working!"');
      console.log('\n💡 From now on, ALL errors will appear in your Sentry dashboard!');
    } else {
      console.log('\n⚠️  Unexpected status code. Check Sentry dashboard to verify.');
    }
  });

  req.on('error', (error) => {
    console.error('\n❌ Error sending to Sentry:', error.message);
  });

  req.write(payload);
  req.end();
} else {
  // Node.js >= 18 with fetch
  fetch(sentryDSN, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(testError),
  })
  .then(response => {
    console.log(`\n📡 Sent test error to Sentry`);
    console.log(`   Status: ${response.status}`);

    if (response.ok) {
      console.log('\n✅ SUCCESS! Sentry received the test error!');
      console.log('\n📊 Check your Sentry dashboard:');
      console.log('   https://betforce1211-gif.sentry.io/issues/');
      console.log('\n   You should see: "Test error from PetForce - Sentry integration working!"');
      console.log('\n💡 From now on, ALL errors will appear in your Sentry dashboard!');
    }
  })
  .catch(error => {
    console.error('\n❌ Error sending to Sentry:', error.message);
  });
}

console.log('\n' + '='.repeat(60));
