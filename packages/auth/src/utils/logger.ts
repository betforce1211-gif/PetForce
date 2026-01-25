// Structured logging utility for authentication events
// Provides request ID tracking and correlation

import { v4 as uuidv4 } from 'uuid';
import { metrics } from './metrics';

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
    return uuidv4();
  }

  /**
   * Hash email for privacy in logs
   */
  private hashEmail(email: string): string {
    // Simple hash for logging - in production, use proper hashing
    return `${email.substring(0, 3)}***@${email.split('@')[1]}`;
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
        // Hash email if present for privacy
        email: context.email ? this.hashEmail(context.email) : undefined,
      },
    };

    // In development, log to console
    // In production, this would send to logging service
    if (this.isDevelopment) {
      const logFn = level === 'ERROR' ? console.error : level === 'WARN' ? console.warn : console.log;
      logFn(`[${entry.level}] ${entry.message}`, entry.context);
    } else {
      // Production: Send to logging service (Sentry, Datadog, etc.)
      // For now, just use console
      console.log(JSON.stringify(entry));
    }
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
    this.info(`Auth event: ${eventType}`, {
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
}

// Export singleton instance
export const logger = new Logger();

// Export types
export type { Logger };
