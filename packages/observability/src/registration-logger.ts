// Registration Flow Event Logger
// Comprehensive logging for registration with privacy protection and correlation
// Addresses P0 logging requirements for registration debugging

import { v4 as uuidv4 } from 'uuid';
import { clientLogger } from './client-logger';
import { performanceMonitor } from './performance-monitor';

/**
 * Privacy-safe email hashing for logging
 * Uses simple hash for browser compatibility
 */
export function hashEmail(email: string): string {
  try {
    const normalized = email.toLowerCase().trim();
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).substring(0, 16);
  } catch {
    return 'redacted';
  }
}

/**
 * Sanitize error message to remove PII
 */
export function sanitizeErrorMessage(message: string): string {
  // Remove email addresses
  let sanitized = message.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email]');
  
  // Remove tokens, session IDs (common patterns)
  sanitized = sanitized.replace(/[a-f0-9]{32,}/gi, '[token]');
  
  // Remove file paths
  sanitized = sanitized.replace(/\/[\w\-./]+/g, '[path]');
  
  return sanitized;
}

/**
 * Parse UTM parameters from URL
 */
function parseUTM(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(key => {
    const value = params.get(key);
    if (value) utm[key] = value;
  });
  
  return utm;
}

/**
 * Assess password strength
 */
function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  if (password.length < 8) return 'weak';
  
  let score = 0;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  
  if (score <= 2) return 'weak';
  if (score === 3) return 'medium';
  return 'strong';
}

/**
 * Registration event logger with correlation tracking
 */
class RegistrationLogger {
  private correlationId: string | null = null;
  private startTime: number = 0;
  private apiRequestTime: number = 0;
  private formSource: 'web' | 'mobile' = 'web';

  /**
   * Initialize registration flow tracking
   */
  startFlow(email: string, formSource: 'web' | 'mobile' = 'web'): string {
    this.correlationId = uuidv4();
    this.startTime = Date.now();
    this.formSource = formSource;

    const event = {
      event: 'registration.attempt.started',
      timestamp: this.startTime,
      email_hash: hashEmail(email),
      correlation_id: this.correlationId,
      form_source: formSource,
      context: {
        referrer: typeof document !== 'undefined' ? document.referrer : undefined,
        utm_params: parseUTM(),
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      },
    };

    clientLogger.log('INFO', 'form', 'Registration attempt started', {
      metadata: event,
    });

    performanceMonitor.start(`registration.flow.${this.correlationId}`);

    // Debug console log
    console.log('[Registration] Flow started', {
      correlation_id: this.correlationId,
      email_provided: !!email,
    });

    return this.correlationId;
  }

  /**
   * Log form validation success
   */
  validationSuccess(password: string, durationMs: number): void {
    if (!this.correlationId) return;

    const event = {
      event: 'registration.validation.success',
      correlation_id: this.correlationId,
      validation_duration_ms: durationMs,
      password_strength: getPasswordStrength(password),
    };

    clientLogger.log('INFO', 'form', 'Form validation successful', {
      metadata: event,
    });

    console.log('[Registration] Validation passed', {
      correlation_id: this.correlationId,
      duration_ms: durationMs,
    });
  }

  /**
   * Log API request sent
   */
  apiRequestSent(requestId: string): void {
    if (!this.correlationId) return;

    this.apiRequestTime = Date.now();
    const timeSinceStart = this.apiRequestTime - this.startTime;

    const event = {
      event: 'registration.api.request',
      correlation_id: this.correlationId,
      request_id: requestId,
      time_since_start_ms: timeSinceStart,
    };

    clientLogger.log('INFO', 'form', 'API request sent', {
      metadata: event,
    });

    performanceMonitor.start(`registration.api.${this.correlationId}`);

    console.log('[Registration] API request sent', {
      correlation_id: this.correlationId,
      request_id: requestId,
      time_since_start_ms: timeSinceStart,
    });
  }

  /**
   * Log API response received
   */
  apiResponseReceived(
    success: boolean,
    confirmationRequired: boolean,
    errorCode?: string
  ): void {
    if (!this.correlationId) return;

    const durationMs = performanceMonitor.end(`registration.api.${this.correlationId}`) || 0;

    const event = {
      event: 'registration.api.response',
      correlation_id: this.correlationId,
      status: success ? 'success' : 'error',
      duration_ms: durationMs,
      confirmation_required: confirmationRequired,
      error_code: errorCode,
    };

    clientLogger.log(success ? 'INFO' : 'ERROR', 'form', 'API response received', {
      metadata: event,
    });

    // Track performance metric
    performanceMonitor.performance('registration_api_call', durationMs, {
      success,
      error_code: errorCode,
    });

    console.log('[Registration] API response received', {
      correlation_id: this.correlationId,
      success,
      confirmation_required: confirmationRequired,
      duration_ms: durationMs,
    });
  }

  /**
   * Log navigation attempt (CRITICAL for debugging P0 issue)
   */
  navigationAttempted(
    targetUrl: string,
    email: string,
    conditions: {
      result_success: boolean;
      confirmation_required: boolean;
      navigate_function_exists: boolean;
    }
  ): void {
    if (!this.correlationId) return;

    const event = {
      event: 'registration.navigation.attempted',
      correlation_id: this.correlationId,
      target_url: targetUrl,
      email_included: !!email,
      conditions_met: conditions,
      current_url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    clientLogger.log('INFO', 'navigation', 'Navigation attempted', {
      metadata: event,
    });

    console.log('[Registration] Navigation attempt', {
      correlation_id: this.correlationId,
      target_url: targetUrl,
      should_navigate: conditions.result_success && conditions.confirmation_required,
      conditions,
    });
  }

  /**
   * Log navigation result (CRITICAL for debugging P0 issue)
   */
  navigationResult(success: boolean, error?: Error): void {
    if (!this.correlationId) return;

    const timeSinceApiResponse = Date.now() - this.apiRequestTime;

    const event = {
      event: 'registration.navigation.result',
      correlation_id: this.correlationId,
      status: success ? 'success' : 'failed',
      time_since_api_response_ms: timeSinceApiResponse,
      error: error ? {
        name: error.name,
        message: sanitizeErrorMessage(error.message),
        stack: error.stack,
      } : undefined,
      final_url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    clientLogger.log(success ? 'INFO' : 'ERROR', 'navigation', 'Navigation result', {
      metadata: event,
    });

    console.log('[Registration] Navigation result', {
      correlation_id: this.correlationId,
      success,
      current_url: typeof window !== 'undefined' ? window.location.href : undefined,
      expected_url: '/auth/verify-pending',
    });
  }

  /**
   * Log registration flow completion
   */
  flowCompleted(success: boolean): void {
    if (!this.correlationId) return;

    const totalDuration = performanceMonitor.end(`registration.flow.${this.correlationId}`) || 0;

    const event = {
      event: 'registration.flow.completed',
      correlation_id: this.correlationId,
      total_duration_ms: totalDuration,
      final_page: typeof window !== 'undefined' ? window.location.pathname : undefined,
      success,
    };

    clientLogger.log('INFO', 'form', 'Registration flow completed', {
      metadata: event,
    });

    // Track overall performance
    performanceMonitor.performance('registration_total_flow', totalDuration, { success });

    console.log('[Registration] Flow completed', {
      correlation_id: this.correlationId,
      success,
      total_duration_ms: totalDuration,
    });

    // Reset state
    this.correlationId = null;
    this.startTime = 0;
    this.apiRequestTime = 0;
  }

  /**
   * Log error in registration flow
   */
  error(
    errorType: 'validation' | 'api' | 'navigation' | 'unknown',
    error: Error | string,
    recoveryAction?: string
  ): void {
    if (!this.correlationId) return;

    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'string' ? undefined : error.stack;

    const event = {
      event: 'registration.error',
      correlation_id: this.correlationId,
      error_type: errorType,
      error_code: typeof error === 'object' && 'code' in error ? error.code : 'UNKNOWN',
      error_message: sanitizeErrorMessage(errorMessage),
      stack_trace: errorStack,
      recovery_action: recoveryAction,
      timestamp: Date.now(),
    };

    clientLogger.log('ERROR', 'error', `Registration error: ${errorType}`, {
      metadata: event,
    });

    console.error('[Registration] Error occurred', {
      correlation_id: this.correlationId,
      error_type: errorType,
      error_message: sanitizeErrorMessage(errorMessage),
    });
  }

  /**
   * Log performance timing metrics
   */
  performanceTiming(metrics: {
    button_disable_latency_ms?: number;
    api_response_time_ms?: number;
    total_flow_duration_ms?: number;
    navigation_latency_ms?: number;
  }): void {
    if (!this.correlationId) return;

    const event = {
      event: 'registration.performance.timing',
      correlation_id: this.correlationId,
      metrics,
    };

    clientLogger.log('INFO', 'performance', 'Performance timing', {
      metadata: event,
    });

    // Check for performance issues
    if (metrics.button_disable_latency_ms && metrics.button_disable_latency_ms > 100) {
      console.warn('[Registration] Button disable latency exceeded 100ms', metrics);
    }
    if (metrics.api_response_time_ms && metrics.api_response_time_ms > 5000) {
      console.warn('[Registration] API response time exceeded 5s', metrics);
    }
  }

  /**
   * Log double-submit attempt (security)
   */
  doubleSubmitAttempted(timeBetweenClicksMs: number, prevented: boolean): void {
    if (!this.correlationId) return;

    const event = {
      event: 'registration.security.double_submit_attempted',
      correlation_id: this.correlationId,
      time_between_clicks_ms: timeBetweenClicksMs,
      prevented,
    };

    clientLogger.log('WARN', 'user_interaction', 'Double submit attempted', {
      metadata: event,
    });

    console.warn('[Registration] Double-submit detected', {
      correlation_id: this.correlationId,
      prevented,
      time_between_clicks_ms: timeBetweenClicksMs,
    });
  }

  /**
   * Log accessibility announcement
   */
  accessibilityAnnouncement(text: string, ariaLive: 'polite' | 'assertive'): void {
    if (!this.correlationId) return;

    const event = {
      event: 'registration.accessibility.announcement',
      correlation_id: this.correlationId,
      announcement_text: text,
      aria_live_region: ariaLive,
      timestamp: Date.now(),
    };

    clientLogger.log('INFO', 'user_interaction', 'Accessibility announcement', {
      metadata: event,
    });
  }

  /**
   * Get current correlation ID
   */
  getCorrelationId(): string | null {
    return this.correlationId;
  }
}

// Export singleton
export const registrationLogger = new RegistrationLogger();
