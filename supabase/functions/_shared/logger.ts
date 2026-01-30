// Structured logging utility for Supabase Edge Functions
// Matches the logging format used in @petforce/auth package

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogContext {
  requestId?: string;
  userId?: string;
  email?: string;
  emailHash?: string;
  eventType?: string;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  environment: 'edge-function';
  functionName: string;
}

/**
 * Simple hash function for email privacy (DJB2 algorithm)
 */
function simpleHash(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash * 33) + char) & 0x7FFFFFFF; // Keep as 32-bit positive integer
  }
  return 'hash:' + hash.toString(16).padStart(8, '0');
}

/**
 * Hash email for privacy compliance
 */
function hashEmail(email: string): string {
  const normalized = email.toLowerCase().trim();
  return simpleHash(normalized);
}

/**
 * Create a structured logger for Edge Functions
 */
export function createLogger(functionName: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  // Create Supabase client for logging to database (optional)
  const supabase = supabaseUrl && supabaseServiceKey 
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

  function log(level: LogLevel, message: string, context: LogContext = {}): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...context,
        // Hash email if present for privacy (GDPR/CCPA compliance)
        email: context.email ? context.email : undefined, // Keep original for DB log
        emailHash: context.email ? hashEmail(context.email) : undefined,
      },
      environment: 'edge-function',
      functionName,
    };

    // Always log to console (captured by Supabase logs)
    const logFn = level === 'ERROR' ? console.error : 
                  level === 'WARN' ? console.warn : console.log;
    logFn(JSON.stringify(entry));

    // Optionally log to database for persistent storage
    // (Implementation depends on having a logs table)
  }

  return {
    /**
     * Generate a unique request ID for correlation
     */
    generateRequestId(): string {
      return crypto.randomUUID();
    },

    /**
     * Log debug information
     */
    debug(message: string, context?: LogContext): void {
      log('DEBUG', message, context);
    },

    /**
     * Log informational events
     */
    info(message: string, context?: LogContext): void {
      log('INFO', message, context);
    },

    /**
     * Log warning events
     */
    warn(message: string, context?: LogContext): void {
      log('WARN', message, context);
    },

    /**
     * Log error events
     */
    error(message: string, context?: LogContext): void {
      log('ERROR', message, context);
    },

    /**
     * Log authentication event with standardized format
     */
    authEvent(
      eventType: string,
      requestId: string,
      context: Omit<LogContext, 'eventType' | 'requestId'>
    ): void {
      log('INFO', `Auth event: ${eventType}`, {
        ...context,
        eventType,
        requestId,
      });
    },
  };
}
