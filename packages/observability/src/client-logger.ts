// Client-Side Event Logging
// Tracks user interactions and errors in browser/mobile environments
// Part of Task #20 from 14-agent review

import { v4 as uuidv4 } from 'uuid';

export type ClientLogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
export type ClientEventCategory = 'page_view' | 'user_interaction' | 'form' | 'navigation' | 'error' | 'performance';

export interface ClientLogContext {
  sessionId?: string;
  userId?: string;
  screenName?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface ClientLogEntry {
  timestamp: string;
  level: ClientLogLevel;
  category: ClientEventCategory;
  message: string;
  context: ClientLogContext;
  userAgent?: string;
  platform?: string;
  viewport?: { width: number; height: number };
}

class ClientLogger {
  private sessionId: string;
  private batchQueue: ClientLogEntry[] = [];
  private readonly BATCH_SIZE = 10;
  private readonly BATCH_TIMEOUT = 5000; // 5 seconds
  private batchTimer: ReturnType<typeof setTimeout> | null = null;
  private endpoint: string;
  private isDevelopment: boolean;

  constructor(endpoint: string = '/api/logs/client') {
    this.sessionId = this.getOrCreateSessionId();
    this.endpoint = endpoint;
    this.isDevelopment = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';
    
    // Set up page unload handler to flush logs
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.flush());
    }
  }

  /**
   * Get or create persistent session ID
   */
  private getOrCreateSessionId(): string {
    if (typeof window === 'undefined') return uuidv4();
    
    const key = 'petforce_session_id';
    let sessionId = sessionStorage.getItem(key);
    
    if (!sessionId) {
      sessionId = uuidv4();
      sessionStorage.setItem(key, sessionId);
    }
    
    return sessionId;
  }

  /**
   * Get browser/device metadata
   */
  private getMetadata(): Partial<ClientLogEntry> {
    if (typeof window === 'undefined') {
      return {};
    }

    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };
  }

  /**
   * Log an event
   */
  private log(
    level: ClientLogLevel,
    category: ClientEventCategory,
    message: string,
    context: ClientLogContext = {}
  ): void {
    const entry: ClientLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      context: {
        ...context,
        sessionId: this.sessionId,
      },
      ...this.getMetadata(),
    };

    // In development, log to console
    if (this.isDevelopment) {
      const logFn = level === 'ERROR' ? console.error : level === 'WARN' ? console.warn : console.log;
      logFn(`[${entry.level}] [${entry.category}] ${entry.message}`, entry.context);
    }

    // Add to batch queue
    this.batchQueue.push(entry);

    // Send batch if size reached
    if (this.batchQueue.length >= this.BATCH_SIZE) {
      this.flush();
    } else {
      // Schedule batch send
      this.scheduleBatchSend();
    }
  }

  /**
   * Schedule batch send
   */
  private scheduleBatchSend(): void {
    if (this.batchTimer) return;

    this.batchTimer = setTimeout(() => {
      this.flush();
    }, this.BATCH_TIMEOUT);
  }

  /**
   * Flush batch queue
   */
  public flush(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    if (this.batchQueue.length === 0) return;

    const batch = [...this.batchQueue];
    this.batchQueue = [];

    // Send to backend
    this.sendBatch(batch);
  }

  /**
   * Send batch to backend
   */
  private async sendBatch(batch: ClientLogEntry[]): Promise<void> {
    if (typeof fetch === 'undefined') return;

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs: batch }),
        // Use keepalive for page unload
        keepalive: true,
      });
    } catch (error) {
      // Silently fail - don't disrupt user experience
      if (this.isDevelopment) {
        console.error('Failed to send client logs:', error);
      }
    }
  }

  /**
   * Track page view
   */
  pageView(screenName: string, metadata?: Record<string, any>): void {
    this.log('INFO', 'page_view', `Page view: ${screenName}`, {
      screenName,
      metadata,
    });
  }

  /**
   * Track button click
   */
  buttonClick(buttonName: string, context?: ClientLogContext): void {
    this.log('INFO', 'user_interaction', `Button clicked: ${buttonName}`, {
      ...context,
      action: 'click',
      component: buttonName,
    });
  }

  /**
   * Track form submission
   */
  formSubmit(formName: string, context?: ClientLogContext): void {
    this.log('INFO', 'form', `Form submitted: ${formName}`, {
      ...context,
      action: 'submit',
      component: formName,
    });
  }

  /**
   * Track form validation error
   */
  formError(formName: string, error: string, context?: ClientLogContext): void {
    this.log('WARN', 'form', `Form validation error: ${formName} - ${error}`, {
      ...context,
      action: 'validation_error',
      component: formName,
      metadata: { error },
    });
  }

  /**
   * Track navigation
   */
  navigate(from: string, to: string, metadata?: Record<string, any>): void {
    this.log('INFO', 'navigation', `Navigation: ${from} → ${to}`, {
      metadata: { from, to, ...metadata },
    });
  }

  /**
   * Track user interaction
   */
  interaction(action: string, component: string, metadata?: Record<string, any>): void {
    this.log('INFO', 'user_interaction', `User interaction: ${action}`, {
      action,
      component,
      metadata,
    });
  }

  /**
   * Track client-side error
   */
  error(message: string, error?: Error, context?: ClientLogContext): void {
    this.log('ERROR', 'error', message, {
      ...context,
      metadata: {
        ...context?.metadata,
        errorName: error?.name,
        errorMessage: error?.message,
        errorStack: error?.stack,
      },
    });
  }

  /**
   * Track performance metric
   */
  performance(metric: string, duration: number, metadata?: Record<string, any>): void {
    this.log('INFO', 'performance', `Performance: ${metric}`, {
      metadata: {
        ...metadata,
        duration,
        metric,
      },
    });
  }

  /**
   * Debug log (development only)
   */
  debug(message: string, context?: ClientLogContext): void {
    if (this.isDevelopment) {
      this.log('DEBUG', 'user_interaction', message, context);
    }
  }
}

// Export singleton instance
export const clientLogger = new ClientLogger();

// Export class for testing
export { ClientLogger };
