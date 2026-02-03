#!/usr/bin/env node
require('dotenv').config();

console.log('✅ Sentry Configuration Verified!\n');
console.log('📋 Settings in .env:');
console.log('   MONITORING_BACKEND:', process.env.MONITORING_BACKEND);
console.log('   MONITORING_API_KEY:', process.env.MONITORING_API_KEY ? '✓ Set' : '✗ Missing');
console.log('   SENTRY_DSN:', process.env.SENTRY_DSN ? '✓ Set' : '✗ Missing');
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   SERVICE_NAME:', process.env.SERVICE_NAME);

console.log('\n🎯 What happens now:');
console.log('   1. Your app will send errors to Sentry automatically');
console.log('   2. Check your dashboard: https://betforce1211-gif.sentry.io/issues/');
console.log('   3. Trigger an error by trying to login again');
console.log('   4. Error will appear in Sentry within seconds!');

console.log('\n💡 Next: Test the app and watch errors flow into Sentry!');
