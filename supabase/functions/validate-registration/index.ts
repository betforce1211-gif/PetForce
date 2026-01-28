// Supabase Edge Function for validating registration with server-side password policy
// Task #4: Server-Side Password Policy - Enforce password requirements
// Enhanced with comprehensive structured logging

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('validate-registration');

interface RequestBody {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

interface ValidationError {
  field: string;
  message: string;
}

serve(async (req) => {
  const requestId = logger.generateRequestId();
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, password, firstName, lastName }: RequestBody = await req.json();

    // Log registration attempt start
    logger.authEvent('registration_validation_started', requestId, {
      email,
      hasFirstName: !!firstName,
      hasLastName: !!lastName,
    });

    // Validate request
    const validationErrors: ValidationError[] = [];

    // Email validation
    if (!email || typeof email !== 'string') {
      validationErrors.push({
        field: 'email',
        message: 'Email is required',
      });
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        validationErrors.push({
          field: 'email',
          message: 'Invalid email address',
        });
      }
      if (email.length > 255) {
        validationErrors.push({
          field: 'email',
          message: 'Email is too long (max 255 characters)',
        });
      }
    }

    // Password validation - CRITICAL SECURITY REQUIREMENT
    if (!password || typeof password !== 'string') {
      validationErrors.push({
        field: 'password',
        message: 'Password is required',
      });
    } else {
      const passwordErrors = validatePassword(password);
      validationErrors.push(...passwordErrors);
    }

    // Optional field validation
    if (firstName && firstName.length > 100) {
      validationErrors.push({
        field: 'firstName',
        message: 'First name is too long (max 100 characters)',
      });
    }

    if (lastName && lastName.length > 100) {
      validationErrors.push({
        field: 'lastName',
        message: 'Last name is too long (max 100 characters)',
      });
    }

    // Return validation errors if any
    if (validationErrors.length > 0) {
      logger.authEvent('registration_validation_failed', requestId, {
        email,
        errorCount: validationErrors.length,
        errors: validationErrors.map(e => e.field),
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Registration validation failed',
            details: validationErrors,
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // All validation passed - proceed with registration
    logger.info('Validation passed, creating user', {
      requestId,
      email,
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password: password,
      email_confirm: false, // Require email confirmation
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    });

    if (error) {
      logger.authEvent('registration_failed', requestId, {
        email,
        errorCode: error.name || 'REGISTRATION_ERROR',
        errorMessage: error.message,
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: error.name || 'REGISTRATION_ERROR',
            message: error.message,
          },
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // CRITICAL: Log user created in auth.users
    // The database trigger should create the public.users record and log it
    logger.authEvent('registration_success_auth_users', requestId, {
      userId: data.user?.id,
      email,
      emailVerified: data.user?.email_confirmed_at !== null,
    });

    // Send confirmation email
    const { error: emailError } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email: email.toLowerCase(),
      options: {
        redirectTo: `${Deno.env.get('PUBLIC_SITE_URL') || 'http://localhost:3000'}/auth/verify`,
      },
    });

    if (emailError) {
      logger.error('Failed to send confirmation email', {
        requestId,
        userId: data.user?.id,
        email,
        errorMessage: emailError.message,
      });
      // User is created but email failed - still return success
    } else {
      logger.info('Confirmation email sent', {
        requestId,
        userId: data.user?.id,
        email,
      });
    }

    logger.authEvent('registration_completed', requestId, {
      userId: data.user?.id,
      email,
      confirmationEmailSent: !emailError,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Registration successful. Please check your email to verify your account before logging in.',
        confirmationRequired: true,
      }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    logger.error('Unexpected error in validate-registration', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

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

/**
 * Validate password against security requirements
 * Minimum 8 characters, at least one uppercase, one lowercase, one number
 */
function validatePassword(password: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (password.length < 8) {
    errors.push({
      field: 'password',
      message: 'Password must be at least 8 characters',
    });
  }

  if (password.length > 100) {
    errors.push({
      field: 'password',
      message: 'Password is too long (max 100 characters)',
    });
  }

  if (!/[A-Z]/.test(password)) {
    errors.push({
      field: 'password',
      message: 'Password must contain at least one uppercase letter',
    });
  }

  if (!/[a-z]/.test(password)) {
    errors.push({
      field: 'password',
      message: 'Password must contain at least one lowercase letter',
    });
  }

  if (!/[0-9]/.test(password)) {
    errors.push({
      field: 'password',
      message: 'Password must contain at least one number',
    });
  }

  return errors;
}
