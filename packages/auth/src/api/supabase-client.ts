import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase client singleton
let supabaseClient: SupabaseClient | null = null;

/**
 * Get client key with automatic detection and fallback to legacy keys
 */
function getClientKey(options: {
  publishableKey?: string;
  anonKey?: string;
}): string {
  // Prefer new publishable key
  if (options.publishableKey?.startsWith('sb_publishable_')) {
    return options.publishableKey;
  }

  // Fallback to legacy anon key with warning
  if (options.anonKey) {
    console.warn(
      '[DEPRECATED] Using legacy SUPABASE_ANON_KEY. ' +
      'Please migrate to SUPABASE_PUBLISHABLE_KEY. ' +
      'Legacy keys will be removed by Supabase in late 2026. ' +
      'See documentation for migration guide.'
    );
    return options.anonKey;
  }

  throw new Error(
    'No valid Supabase key found. ' +
    'Please provide SUPABASE_PUBLISHABLE_KEY (recommended) or SUPABASE_ANON_KEY (deprecated).'
  );
}

/**
 * Get server key with automatic detection and fallback to legacy keys
 */
function getServerKey(options: {
  secretKey?: string;
  serviceRoleKey?: string;
}): string {
  // Prefer new secret key
  if (options.secretKey?.startsWith('sb_secret_')) {
    return options.secretKey;
  }

  // Fallback to legacy service role key with warning
  if (options.serviceRoleKey) {
    console.warn(
      '[DEPRECATED] Using legacy SUPABASE_SERVICE_ROLE_KEY. ' +
      'Please migrate to SUPABASE_SECRET_KEY. ' +
      'Legacy keys will be removed by Supabase in late 2026. ' +
      'See documentation for migration guide.'
    );
    return options.serviceRoleKey;
  }

  throw new Error(
    'No valid Supabase secret key found. ' +
    'Please provide SUPABASE_SECRET_KEY (recommended) or SUPABASE_SERVICE_ROLE_KEY (deprecated).'
  );
}

export function createSupabaseClient(
  supabaseUrl: string,
  publishableKey?: string,
  legacyAnonKey?: string
): SupabaseClient {
  if (!supabaseClient) {
    const key = getClientKey({ publishableKey, anonKey: legacyAnonKey });

    supabaseClient = createClient(supabaseUrl, key, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }

  return supabaseClient;
}

/**
 * Create admin client for server-side operations with RLS bypass
 * WARNING: Only use in server-side code, never in browser
 */
export function createSupabaseAdminClient(
  supabaseUrl: string,
  secretKey?: string,
  legacyServiceRoleKey?: string
): SupabaseClient {
  // Prevent usage in browser
  if (typeof window !== 'undefined') {
    throw new Error(
      'CRITICAL SECURITY ERROR: Cannot use secret key in browser. ' +
      'Secret keys must only be used in server-side code (Node.js, Edge Functions). ' +
      'Use createSupabaseClient with publishable key for client-side operations.'
    );
  }

  const key = getServerKey({ secretKey, serviceRoleKey: legacyServiceRoleKey });

  return createClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    throw new Error(
      'Supabase client not initialized. Call createSupabaseClient first.'
    );
  }

  return supabaseClient;
}

// For testing: reset the singleton
export function resetSupabaseClient(): void {
  supabaseClient = null;
}
