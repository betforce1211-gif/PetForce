/**
 * Verification script for test infrastructure fix
 * Ensures .env.test is properly configured
 */

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

console.log('🔍 Test Infrastructure Verification');
console.log('====================================\n');

// Check if .env.test exists
const envTestPath = path.resolve(__dirname, '.env.test');
if (!fs.existsSync(envTestPath)) {
  console.error('❌ .env.test file not found!');
  process.exit(1);
}
console.log('✅ .env.test file exists');

// Load .env.test
dotenv.config({ path: envTestPath });

// Verify required variables
const checks = [
  {
    name: 'VITE_SUPABASE_URL',
    expected: 'https://test.supabase.co',
    value: process.env.VITE_SUPABASE_URL
  },
  {
    name: 'VITE_SUPABASE_ANON_KEY',
    expected: 'mock-anon-key-for-testing-only',
    value: process.env.VITE_SUPABASE_ANON_KEY
  },
  {
    name: 'NODE_ENV',
    expected: 'test',
    value: process.env.NODE_ENV
  }
];

let allPassed = true;

checks.forEach(check => {
  if (check.value === check.expected) {
    console.log(`✅ ${check.name}: ${check.value}`);
  } else {
    console.error(`❌ ${check.name}: Expected "${check.expected}", got "${check.value}"`);
    allPassed = false;
  }
});

console.log('\n====================================');

if (allPassed) {
  console.log('✅ All checks passed! Test infrastructure is ready.');
  console.log('\nNext steps:');
  console.log('1. Run tests: npx playwright test');
  console.log('2. Verify no rate limit errors');
  console.log('3. Check console for "Mock intercepted" messages');
  process.exit(0);
} else {
  console.error('❌ Some checks failed. Please review .env.test configuration.');
  process.exit(1);
}
