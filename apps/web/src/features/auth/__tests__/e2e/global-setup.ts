/**
 * Playwright Global Setup for E2E Tests
 * Mocks Supabase API when running in CI without real credentials
 */

async function globalSetup() {
  // Check if we're using the mock URL or real credentials
  const isMockUrl = process.env.VITE_SUPABASE_URL === 'https://test.supabase.co';
  const hasCredentials = process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY && !isMockUrl;

  if (!hasCredentials || isMockUrl) {
    console.log('⚠️  Using mocked Supabase URL - E2E tests will use mocked API responses');
  } else {
    console.log('✓ Supabase credentials found - E2E tests will use real API');
  }

  // No async cleanup needed
  return undefined;
}

export default globalSetup;
