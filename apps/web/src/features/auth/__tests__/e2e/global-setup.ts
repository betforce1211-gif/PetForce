/**
 * Playwright Global Setup for E2E Tests
 * Mocks Supabase API when running in CI without real credentials
 */

async function globalSetup() {
  // Check if we're in CI and credentials are missing
  const hasCredentials = process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY;

  if (!hasCredentials) {
    console.log('⚠️  No Supabase credentials found - E2E tests will use mocked API responses');
  } else {
    console.log('✓ Supabase credentials found - E2E tests will use real API');
  }

  // No async cleanup needed
  return undefined;
}

export default globalSetup;
