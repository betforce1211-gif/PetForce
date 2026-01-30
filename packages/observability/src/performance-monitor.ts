// Performance Timing Monitor
// Tracks API call latency and client-side performance
// Part of Task #21 from 14-agent review

export interface PerformanceMark {
  name: string;
  startTime: number;
  metadata?: Record<string, any>;
}

export interface PerformanceMeasurement {
  name: string;
  duration: number;
  startTime: number;
  endTime: number;
  metadata?: Record<string, any>;
}

export interface PerformanceStats {
  count: number;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
}

class PerformanceMonitor {
  private marks: Map<string, PerformanceMark> = new Map();
  private measurements: PerformanceMeasurement[] = [];
  private readonly MAX_MEASUREMENTS = 1000;
  private endpoint: string;
  private isDevelopment: boolean;

  constructor(endpoint: string = '/api/logs/performance') {
    this.endpoint = endpoint;
    this.isDevelopment = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';
  }

  /**
   * Start timing an operation
   */
  start(name: string, metadata?: Record<string, any>): void {
    const mark: PerformanceMark = {
      name,
      startTime: performance.now(),
      metadata,
    };

    this.marks.set(name, mark);

    if (this.isDevelopment) {
      console.log(`[PERF] Started: ${name}`, metadata);
    }
  }

  /**
   * End timing an operation
   */
  end(name: string, metadata?: Record<string, any>): number | null {
    const mark = this.marks.get(name);
    
    if (!mark) {
      console.warn(`[PERF] No start mark found for: ${name}`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - mark.startTime;

    const measurement: PerformanceMeasurement = {
      name,
      duration,
      startTime: mark.startTime,
      endTime,
      metadata: {
        ...mark.metadata,
        ...metadata,
      },
    };

    // Store measurement
    this.measurements.push(measurement);
    
    // Keep only recent measurements
    if (this.measurements.length > this.MAX_MEASUREMENTS) {
      this.measurements = this.measurements.slice(-this.MAX_MEASUREMENTS);
    }

    // Remove mark
    this.marks.delete(name);

    if (this.isDevelopment) {
      console.log(`[PERF] ${name}: ${duration.toFixed(2)}ms`, metadata);
    }

    // Send to backend
    this.sendMeasurement(measurement);

    return duration;
  }

  /**
   * Measure an async operation
   */
  async measure<T>(
    name: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.start(name, metadata);
    
    try {
      const result = await operation();
      this.end(name, { ...metadata, success: true });
      return result;
    } catch (error) {
      this.end(name, { 
        ...metadata, 
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Measure a synchronous operation
   */
  measureSync<T>(
    name: string,
    operation: () => T,
    metadata?: Record<string, any>
  ): T {
    this.start(name, metadata);
    
    try {
      const result = operation();
      this.end(name, { ...metadata, success: true });
      return result;
    } catch (error) {
      this.end(name, { 
        ...metadata, 
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get statistics for a metric
   */
  getStats(name: string): PerformanceStats | null {
    const measurements = this.measurements.filter(m => m.name === name);
    
    if (measurements.length === 0) return null;

    const durations = measurements.map(m => m.duration).sort((a, b) => a - b);
    const count = durations.length;

    const sum = durations.reduce((a, b) => a + b, 0);
    const avg = sum / count;

    const getPercentile = (p: number) => {
      const index = Math.ceil((p / 100) * count) - 1;
      return durations[Math.max(0, index)];
    };

    return {
      count,
      min: durations[0],
      max: durations[count - 1],
      avg: Math.round(avg * 100) / 100,
      p50: getPercentile(50),
      p95: getPercentile(95),
      p99: getPercentile(99),
    };
  }

  /**
   * Get all measurements for a metric
   */
  getMeasurements(name: string): PerformanceMeasurement[] {
    return this.measurements.filter(m => m.name === name);
  }

  /**
   * Get all unique metric names
   */
  getMetricNames(): string[] {
    return Array.from(new Set(this.measurements.map(m => m.name)));
  }

  /**
   * Clear all measurements
   */
  clear(): void {
    this.measurements = [];
    this.marks.clear();
  }

  /**
   * Send measurement to backend
   */
  private async sendMeasurement(measurement: PerformanceMeasurement): Promise<void> {
    if (typeof fetch === 'undefined') return;

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ measurement }),
      });
    } catch (error) {
      // Silently fail in production
      if (this.isDevelopment) {
        console.error('Failed to send performance measurement:', error);
      }
    }
  }

  /**
   * Log performance summary to console (development only)
   */
  logSummary(): void {
    if (!this.isDevelopment) return;

    console.group('Performance Summary');
    
    const names = this.getMetricNames();
    
    names.forEach(name => {
      const stats = this.getStats(name);
      if (stats) {
        console.log(`\n${name}:`);
        console.log(`  Count: ${stats.count}`);
        console.log(`  Min:   ${stats.min.toFixed(2)}ms`);
        console.log(`  Avg:   ${stats.avg.toFixed(2)}ms`);
        console.log(`  P50:   ${stats.p50.toFixed(2)}ms`);
        console.log(`  P95:   ${stats.p95.toFixed(2)}ms`);
        console.log(`  P99:   ${stats.p99.toFixed(2)}ms`);
        console.log(`  Max:   ${stats.max.toFixed(2)}ms`);
      }
    });
    
    console.groupEnd();
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export class for testing
export { PerformanceMonitor };

/**
 * HOC to wrap API functions with performance timing
 */
export function withPerformance<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  metricName: string
): T {
  return (async (...args: any[]) => {
    return performanceMonitor.measure(metricName, () => fn(...args));
  }) as T;
}

/**
 * Decorator to measure method performance (TypeScript)
 */
export function Measure(metricName?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const name = metricName || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      return performanceMonitor.measure(name, () => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}
