// Monitoring Service Integration
// Supports multiple monitoring backends (Datadog, Sentry, CloudWatch, Console)
/* global fetch */

import { LogEntry, LogLevel } from './logger';
import { AuthMetric } from './metrics';

export type MonitoringBackend = 'datadog' | 'sentry' | 'cloudwatch' | 'console';

export interface MonitoringConfig {
  backend: MonitoringBackend;
  apiKey?: string;
  environment?: string;
  service?: string;
}

/**
 * Abstract monitoring adapter interface
 */
interface MonitoringAdapter {
  sendLog(entry: LogEntry): void;
  sendMetric(metric: AuthMetric): void;
  sendError(error: Error, context?: Record<string, any>): void;
}

/**
 * Datadog monitoring adapter
 * Sends structured logs and metrics to Datadog
 */
class DatadogAdapter implements MonitoringAdapter {
  private apiKey: string;
  private environment: string;
  private service: string;

  constructor(config: MonitoringConfig) {
    if (!config.apiKey) {
      throw new Error('Datadog API key required');
    }
    this.apiKey = config.apiKey;
    this.environment = config.environment || 'production';
    this.service = config.service || 'petforce-auth';
  }

  sendLog(entry: LogEntry): void {
    // Send to Datadog Log Management API
    // https://docs.datadoghq.com/api/latest/logs/
    const payload = {
      ddsource: 'nodejs',
      ddtags: 'env:' + this.environment + ',service:' + this.service,
      hostname: this.getHostname(),
      message: entry.message,
      level: entry.level.toLowerCase(),
      timestamp: entry.timestamp,
      ...entry.context,
    };

    this.sendToDatadog('/v1/input', payload);
  }

  sendMetric(metric: AuthMetric): void {
    // Send to Datadog Metrics API
    // https://docs.datadoghq.com/api/latest/metrics/
    const payload = {
      series: [
        {
          metric: 'auth.' + metric.event,
          points: [[Math.floor(metric.timestamp / 1000), 1]],
          type: 'count',
          tags: [
            'env:' + this.environment,
            'service:' + this.service,
          ],
        },
      ],
    };

    this.sendToDatadog('/v1/series', payload);
  }

  sendError(error: Error, context?: Record<string, any>): void {
    const entry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR' as LogLevel,
      message: error.message,
      context: {
        ...context,
        stack: error.stack,
        errorName: error.name,
      },
    };
    this.sendLog(entry);
  }

  private sendToDatadog(endpoint: string, payload: any): void {
    const url = 'https://http-intake.logs.datadoghq.com' + endpoint;
    
    // Use fetch if available, otherwise skip in Node.js < 18
    if (typeof fetch !== 'undefined') {
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'DD-API-KEY': this.apiKey,
        },
        body: JSON.stringify(payload),
      }).catch((err) => {
        console.error('Failed to send to Datadog:', err);
      });
    }
  }

  private getHostname(): string {
    if (typeof process !== 'undefined' && process.env.HOSTNAME) {
      return process.env.HOSTNAME;
    }
    return 'unknown';
  }
}

/**
 * Sentry monitoring adapter
 * Sends errors and events to Sentry
 */
class SentryAdapter implements MonitoringAdapter {
  private sentryKey: string;
  private sentryHost: string;
  private projectId: string;
  private environment: string;

  constructor(config: MonitoringConfig) {
    if (!config.apiKey) {
      throw new Error('Sentry DSN required');
    }

    // Parse DSN: https://KEY@HOST/PROJECT_ID
    const dsnMatch = config.apiKey.match(/^https?:\/\/([^@]+)@([^\/]+)\/(.+)$/);
    if (!dsnMatch) {
      throw new Error('Invalid Sentry DSN format');
    }

    this.sentryKey = dsnMatch[1];
    this.sentryHost = dsnMatch[2];
    this.projectId = dsnMatch[3];
    this.environment = config.environment || 'production';
  }

  sendLog(entry: LogEntry): void {
    // Sentry focuses on errors, only send WARN and ERROR
    if (entry.level === 'ERROR' || entry.level === 'WARN') {
      const payload = {
        level: entry.level.toLowerCase(),
        message: entry.message,
        timestamp: new Date(entry.timestamp).getTime() / 1000,
        environment: this.environment,
        extra: entry.context,
      };
      this.sendToSentry(payload);
    }
  }

  sendMetric(_metric: AuthMetric): void {
    // Sentry doesn't have native metrics API
    // Store as breadcrumb for context
    // In production, use Sentry Performance Monitoring
  }

  sendError(error: Error, context?: Record<string, any>): void {
    const payload = {
      level: 'error',
      message: error.message,
      timestamp: Date.now() / 1000,
      environment: this.environment,
      exception: {
        values: [
          {
            type: error.name,
            value: error.message,
            stacktrace: {
              frames: this.parseStackTrace(error.stack || ''),
            },
          },
        ],
      },
      extra: context,
    };
    this.sendToSentry(payload);
  }

  private sendToSentry(payload: any): void {
    if (typeof fetch !== 'undefined') {
      // Sentry ingestion endpoint
      const url = `https://${this.sentryHost}/api/${this.projectId}/store/`;

      // Generate auth header
      const timestamp = Math.floor(Date.now() / 1000);
      const authHeader = `Sentry sentry_version=7, sentry_key=${this.sentryKey}, sentry_timestamp=${timestamp}`;

      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sentry-Auth': authHeader,
        },
        body: JSON.stringify(payload),
      }).catch((err) => {
        console.error('Failed to send to Sentry:', err);
      });
    }
  }

  private parseStackTrace(stack: string): any[] {
    return stack.split('\n').map((line) => ({
      filename: line.trim(),
    }));
  }
}

/**
 * Console monitoring adapter
 * Fallback for development or when no monitoring service configured
 */
class ConsoleAdapter implements MonitoringAdapter {
  sendLog(entry: LogEntry): void {
    console.log(JSON.stringify(entry));
  }

  sendMetric(metric: AuthMetric): void {
    console.log(JSON.stringify({
      service: 'auth',
      metric: metric.event,
      timestamp: metric.timestamp,
      ...metric.metadata,
    }));
  }

  sendError(error: Error, context?: Record<string, any>): void {
    console.error(JSON.stringify({
      error: error.message,
      stack: error.stack,
      ...context,
    }));
  }
}

/**
 * Monitoring service factory
 */
class MonitoringService {
  private adapter: MonitoringAdapter;

  constructor(config?: MonitoringConfig) {
    this.adapter = this.createAdapter(config);
  }

  private createAdapter(config?: MonitoringConfig): MonitoringAdapter {
    if (!config || config.backend === 'console') {
      return new ConsoleAdapter();
    }

    switch (config.backend) {
      case 'datadog':
        return new DatadogAdapter(config);
      case 'sentry':
        return new SentryAdapter(config);
      case 'cloudwatch':
        // CloudWatch adapter would go here
        return new ConsoleAdapter();
      default:
        return new ConsoleAdapter();
    }
  }

  sendLog(entry: LogEntry): void {
    try {
      this.adapter.sendLog(entry);
    } catch (error) {
      console.error('Monitoring error:', error);
    }
  }

  sendMetric(metric: AuthMetric): void {
    try {
      this.adapter.sendMetric(metric);
    } catch (error) {
      console.error('Monitoring error:', error);
    }
  }

  sendError(error: Error, context?: Record<string, any>): void {
    try {
      this.adapter.sendError(error, context);
    } catch (error) {
      console.error('Monitoring error:', error);
    }
  }
}

/**
 * Initialize monitoring service from environment variables
 * Safe for both browser and server environments
 */
export function createMonitoringService(): MonitoringService {
  // Check if we're in a browser environment
  const isBrowser = typeof window !== 'undefined';

  // Safe access to process.env (only available in Node.js)
  const getEnv = (key: string, defaultValue: string = ''): string => {
    if (isBrowser) return defaultValue;
    return (typeof process !== 'undefined' && process.env?.[key]) || defaultValue;
  };

  // In browser, use hardcoded DSN; in Node, use env vars
  const backend = isBrowser
    ? 'sentry' as MonitoringBackend
    : (getEnv('MONITORING_BACKEND', 'console')) as MonitoringBackend;

  const apiKey = isBrowser
    ? 'https://48e223edad869076554be572bb836cc4@o4510824642052096.ingest.us.sentry.io/4510824680849408'
    : getEnv('MONITORING_API_KEY');

  const environment = isBrowser
    ? 'development'
    : getEnv('NODE_ENV', 'development');

  const service = isBrowser
    ? 'petforce-web'
    : getEnv('SERVICE_NAME', 'petforce-auth');

  return new MonitoringService({
    backend,
    apiKey,
    environment,
    service,
  });
}

// Export singleton
export const monitoring = createMonitoringService();
