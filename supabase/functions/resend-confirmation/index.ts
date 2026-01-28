// Supabase Edge Function for resending confirmation emails with rate limiting
// Task #1: Server-Side Rate Limiting - 3 requests per 15 minutes

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const RATE_LIMIT_WINDOW_MINUTES = 15;
const RATE_LIMIT_MAX_ATTEMPTS = 3;

interface RequestBody {
  email: string;
}

interface RateLimitRecord {
  id: string;
  email: string;
  operation: string;
  attempted_at: string;
  ip_address?: string;
  user_agent?: string;
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { email }: RequestBody = await req.json();

    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Email is required',
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate email format (basic check)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'INVALID_EMAIL',
            message: 'Invalid email address',
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize Supabase client (service role for admin operations)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get client info for logging
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Check rate limit
    const rateLimitCheck = await checkRateLimit(supabase, email, ipAddress, userAgent);
    
    if (!rateLimitCheck.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Too many requests. Please try again in ${rateLimitCheck.retryAfterMinutes} minutes.`,
            retryAfter: rateLimitCheck.retryAfterSeconds,
          },
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': rateLimitCheck.retryAfterSeconds.toString(),
            'X-RateLimit-Limit': RATE_LIMIT_MAX_ATTEMPTS.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitCheck.resetAt).toISOString(),
          },
        }
      );
    }

    // Record this attempt in rate limit table
    await recordRateLimitAttempt(supabase, email, ipAddress, userAgent);

    // Use Supabase Admin Auth to resend confirmation
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email: email,
      options: {
        redirectTo: `${Deno.env.get('PUBLIC_SITE_URL') || 'http://localhost:3000'}/auth/verify`,
      },
    });

    if (error) {
      // Log error (in production, send to monitoring service)
      console.error('Failed to resend confirmation email:', {
        email,
        error: error.message,
        code: error.name,
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'RESEND_FAILED',
            message: 'Failed to send confirmation email. Please try again later.',
          },
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Success
    console.log('Confirmation email resent successfully:', {
      email,
      ipAddress,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Confirmation email sent. Please check your inbox.',
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': RATE_LIMIT_MAX_ATTEMPTS.toString(),
          'X-RateLimit-Remaining': (RATE_LIMIT_MAX_ATTEMPTS - rateLimitCheck.currentCount - 1).toString(),
          'X-RateLimit-Reset': new Date(Date.now() + RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString(),
        },
      }
    );
  } catch (error) {
    console.error('Unexpected error in resend-confirmation function:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function checkRateLimit(
  supabase: any,
  email: string,
  ipAddress: string,
  userAgent: string
): Promise<{
  allowed: boolean;
  currentCount: number;
  retryAfterSeconds?: number;
  retryAfterMinutes?: number;
  resetAt?: number;
}> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);

  const { data, error } = await supabase
    .from('auth_rate_limits')
    .select('*')
    .eq('email', email.toLowerCase())
    .eq('operation', 'resend_confirmation')
    .gte('attempted_at', windowStart.toISOString())
    .order('attempted_at', { ascending: false });

  if (error) {
    console.error('Error checking rate limit:', error);
    return { allowed: true, currentCount: 0 };
  }

  const attempts = (data as RateLimitRecord[]) || [];
  const currentCount = attempts.length;

  if (currentCount >= RATE_LIMIT_MAX_ATTEMPTS) {
    const oldestAttempt = attempts[attempts.length - 1];
    const oldestAttemptTime = new Date(oldestAttempt.attempted_at).getTime();
    const resetAt = oldestAttemptTime + RATE_LIMIT_WINDOW_MINUTES * 60 * 1000;
    const retryAfterSeconds = Math.ceil((resetAt - Date.now()) / 1000);
    const retryAfterMinutes = Math.ceil(retryAfterSeconds / 60);

    return {
      allowed: false,
      currentCount,
      retryAfterSeconds,
      retryAfterMinutes,
      resetAt,
    };
  }

  return {
    allowed: true,
    currentCount,
  };
}

async function recordRateLimitAttempt(
  supabase: any,
  email: string,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  const { error } = await supabase.from('auth_rate_limits').insert({
    email: email.toLowerCase(),
    operation: 'resend_confirmation',
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  if (error) {
    console.error('Error recording rate limit attempt:', error);
  }
}
