// Structured logging utility for authentication events
// Provides request ID tracking and correlation

import { metrics } from './metrics';
import { monitoring } from './monitoring';

// Simple UUID v4 generator (no external dependency needed)
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogContext {
  requestId?: string;
  userId?: string;
  email?: string;
  eventType?: string;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';
  }

  /**
   * Generate a unique request ID for correlation
   */
  generateRequestId(): string {
    return generateUUID();
  }

  /**
   * Hash email for privacy in logs
   * Browser-compatible simple hash for development
   * For production, use server-side SHA-256
   */
  private hashEmail(email: string): string {
    try {
      const normalized = email.toLowerCase().trim();
      // Simple hash for browser compatibility (development only)
      let hash = 0;
      for (let i = 0; i < normalized.length; i++) {
        const char = normalized.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      const hashStr = Math.abs(hash).toString(16).padStart(8, '0');
      return 'hash:' + hashStr;
    } catch {
      // Fallback if hashing fails - still protect PII
      return 'email:redacted';
    }
  }

  /**
   * Format and output log entry
   */
  private log(level: LogLevel, message: string, context: LogContext = {}): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...context,
        // Hash email if present for privacy (GDPR/CCPA compliance)
        email: context.email ? this.hashEmail(context.email) : undefined,
      },
    };

    // In development, log to console for immediate feedback
    if (this.isDevelopment) {
      const logFn = level === 'ERROR' ? console.error : level === 'WARN' ? console.warn : console.log;
      logFn('[' + entry.level + '] ' + entry.message, entry.context);
    }
    
    // In production, send to monitoring service (Datadog, Sentry, CloudWatch)
    // Also send in development for testing monitoring integration
    monitoring.sendLog(entry);
  }

  /**
   * Log debug information (disabled in production)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.log('DEBUG', message, context);
    }
  }

  /**
   * Log informational events
   */
  info(message: string, context?: LogContext): void {
    this.log('INFO', message, context);
  }

  /**
   * Log warning events
   */
  warn(message: string, context?: LogContext): void {
    this.log('WARN', message, context);
  }

  /**
   * Log error events
   */
  error(message: string, context?: LogContext): void {
    this.log('ERROR', message, context);
  }

  /**
   * Log authentication event with standardized format
   */
  authEvent(
    eventType: string,
    requestId: string,
    context: Omit<LogContext, 'eventType' | 'requestId'>
  ): void {
    this.info('Auth event: ' + eventType, {
      ...context,
      eventType,
      requestId,
    });

    // Also record metric for monitoring
    metrics.record(eventType, {
      requestId,
      ...context,
    });
  }

  /**
   * Log security event with standardized format
   * Used for tracking potential security threats and attack patterns
   */
  securityEvent(
    eventType: string,
    context: LogContext
  ): void {
    this.warn('Security event: ' + eventType, {
      ...context,
      eventType,
      securityAlert: true,
    });

    // Record security metric for monitoring
    metrics.record('security_' + eventType, context);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types
export type { Logger };
