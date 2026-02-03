#!/usr/bin/env node
/**
 * Test the actual monitoring system (monitoring.ts)
 * This tests the real infrastructure Larry built
 */
require('dotenv').config();

console.log('🧪 Testing PetForce Monitoring System\n');
console.log('=' .repeat(60));

const backend = process.env.MONITORING_BACKEND;
const apiKey = process.env.MONITORING_API_KEY;

console.log('\n📋 Configuration:');
console.log(`   Backend: ${backend || 'NOT SET'}`);
console.log(`   API Key: ${apiKey ? apiKey.substring(0, 50) + '...' : 'NOT SET'}`);

if (!backend || backend === 'console') {
  console.log('\n❌ Monitoring not configured!');
  console.log('   Set MONITORING_BACKEND and MONITORING_API_KEY in .env');
  process.exit(1);
}

console.log('\n✅ Monitoring is configured!');
console.log('\n🚀 Testing the monitoring system...');

// Import and test the actual monitoring system
(async () => {
  try {
    // We need to import the monitoring system, but it's TypeScript
    // For this test, we'll use the logger which uses monitoring internally
    const { createMonitoringService } = await import('./packages/auth/src/utils/monitoring.ts');

    console.log('\n📦 Monitoring service created');

    const monitoring = createMonitoringService();

    // Test sending a log entry
    console.log('\n📝 Sending test log entry...');
    monitoring.sendLog({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message: 'Test error from monitoring system test',
      context: {
        test: true,
        feature: 'monitoring-system',
        requestId: 'test_' + Date.now(),
      },
    });

    // Test sending an error
    console.log('🚨 Sending test error...');
    const testError = new Error('Test error for Sentry integration');
    monitoring.sendError(testError, {
      test: true,
      source: 'test-monitoring-system.js',
    });

    // Test sending a metric
    console.log('📊 Sending test metric...');
    monitoring.sendMetric({
      event: 'test_metric',
      timestamp: Date.now(),
      metadata: {
        test: true,
        value: 42,
      },
    });

    console.log('\n✅ All test events sent to monitoring system!');
    console.log('\n📊 Check your Sentry dashboard:');
    console.log('   https://betforce1211-gif.sentry.io/issues/');
    console.log('\n   You should see:');
    console.log('   - "Test error from monitoring system test"');
    console.log('   - "Test error for Sentry integration"');
    console.log('\n💡 Events should appear within 5-10 seconds!');

    // Give fetch time to complete
    setTimeout(() => {
      console.log('\n✅ Test complete!');
      process.exit(0);
    }, 2000);

  } catch (error) {
    console.error('\n❌ Error testing monitoring system:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();

console.log('\n' + '='.repeat(60));
