// Authentication Metrics Collection
// Tracks registration funnel and confirmation rates

export interface AuthMetric {
  event: string;
  timestamp: number;
  userId?: string;
  email?: string;
  metadata?: Record<string, any>;
}

export interface MetricsSummary {
  registrationStarted: number;
  registrationCompleted: number;
  emailConfirmed: number;
  loginAttempts: number;
  loginSuccesses: number;
  loginRejectedUnconfirmed: number;
  confirmationRatePercent: number;
  loginSuccessRatePercent: number;
  avgTimeToConfirmMinutes: number | null;
}

class MetricsCollector {
  private metrics: AuthMetric[] = [];
  private readonly MAX_METRICS = 10000; // Keep last 10k events in memory
  private metricsListeners: Array<(summary: MetricsSummary) => void> = [];

  /**
   * Record an authentication metric
   */
  record(event: string, metadata?: Record<string, any>): void {
    const metric: AuthMetric = {
      event,
      timestamp: Date.now(),
      userId: metadata?.userId,
      email: metadata?.email,
      metadata,
    };

    this.metrics.push(metric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Notify listeners
    this.notifyListeners();

    // In production, send to monitoring service
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'development') {
      this.sendToMonitoringService(metric);
    }
  }

  /**
   * Get metrics summary for a time period
   */
  getSummary(periodMs: number = 24 * 60 * 60 * 1000): MetricsSummary {
    const now = Date.now();
    const cutoff = now - periodMs;
    const recentMetrics = this.metrics.filter((m) => m.timestamp >= cutoff);

    const registrationStarted = recentMetrics.filter(
      (m) => m.event === 'registration_attempt_started'
    ).length;

    const registrationCompleted = recentMetrics.filter(
      (m) => m.event === 'registration_completed'
    ).length;

    const emailConfirmed = recentMetrics.filter(
      (m) => m.event === 'email_confirmed'
    ).length;

    const loginAttempts = recentMetrics.filter(
      (m) => m.event === 'login_attempt_started'
    ).length;

    const loginSuccesses = recentMetrics.filter(
      (m) => m.event === 'login_completed'
    ).length;

    const loginRejectedUnconfirmed = recentMetrics.filter(
      (m) => m.event === 'login_rejected_unconfirmed'
    ).length;

    const confirmationRate = registrationCompleted > 0
      ? (emailConfirmed / registrationCompleted) * 100
      : 0;

    const loginSuccessRate = loginAttempts > 0
      ? (loginSuccesses / loginAttempts) * 100
      : 0;

    // Calculate average time to confirm
    let avgTimeToConfirm: number | null = null;
    const confirmTimes: number[] = [];

    recentMetrics
      .filter((m) => m.event === 'email_confirmed' && m.userId)
      .forEach((confirmMetric) => {
        const registrationMetric = recentMetrics.find(
          (m) =>
            m.event === 'registration_completed' &&
            m.userId === confirmMetric.userId
        );

        if (registrationMetric) {
          const timeDiff = confirmMetric.timestamp - registrationMetric.timestamp;
          confirmTimes.push(timeDiff);
        }
      });

    if (confirmTimes.length > 0) {
      const avgMs = confirmTimes.reduce((a, b) => a + b, 0) / confirmTimes.length;
      avgTimeToConfirm = avgMs / (1000 * 60); // Convert to minutes
    }

    return {
      registrationStarted,
      registrationCompleted,
      emailConfirmed,
      loginAttempts,
      loginSuccesses,
      loginRejectedUnconfirmed,
      confirmationRatePercent: Math.round(confirmationRate * 100) / 100,
      loginSuccessRatePercent: Math.round(loginSuccessRate * 100) / 100,
      avgTimeToConfirmMinutes: avgTimeToConfirm
        ? Math.round(avgTimeToConfirm * 100) / 100
        : null,
    };
  }

  /**
   * Subscribe to metrics updates
   */
  subscribe(listener: (summary: MetricsSummary) => void): () => void {
    this.metricsListeners.push(listener);

    // Return unsubscribe function
    return () => {
      this.metricsListeners = this.metricsListeners.filter((l) => l !== listener);
    };
  }

  /**
   * Get all metrics for a time period
   */
  getMetrics(periodMs: number = 24 * 60 * 60 * 1000): AuthMetric[] {
    const cutoff = Date.now() - periodMs;
    return this.metrics.filter((m) => m.timestamp >= cutoff);
  }

  /**
   * Check if metrics indicate issues
   */
  checkAlerts(): Array<{ level: 'warning' | 'critical'; message: string }> {
    const alerts: Array<{ level: 'warning' | 'critical'; message: string }> = [];
    const summary = this.getSummary(60 * 60 * 1000); // Last hour

    // Alert: Low confirmation rate
    if (summary.registrationCompleted > 10 && summary.confirmationRatePercent < 70) {
      alerts.push({
        level: summary.confirmationRatePercent < 50 ? 'critical' : 'warning',
        message: `Low email confirmation rate: ${summary.confirmationRatePercent}% (last hour)`,
      });
    }

    // Alert: High unconfirmed login attempts
    if (summary.loginAttempts > 10 && summary.loginRejectedUnconfirmed > 5) {
      const rejectedPercent = (summary.loginRejectedUnconfirmed / summary.loginAttempts) * 100;
      if (rejectedPercent > 20) {
        alerts.push({
          level: 'warning',
          message: `High unconfirmed login attempts: ${summary.loginRejectedUnconfirmed} (${Math.round(rejectedPercent)}% of logins)`,
        });
      }
    }

    // Alert: Slow email confirmation
    if (summary.avgTimeToConfirmMinutes && summary.avgTimeToConfirmMinutes > 60) {
      alerts.push({
        level: 'warning',
        message: `Slow email confirmation: Average ${Math.round(summary.avgTimeToConfirmMinutes)} minutes`,
      });
    }

    // Alert: Low login success rate
    if (summary.loginAttempts > 10 && summary.loginSuccessRatePercent < 70) {
      alerts.push({
        level: summary.loginSuccessRatePercent < 50 ? 'critical' : 'warning',
        message: `Low login success rate: ${summary.loginSuccessRatePercent}%`,
      });
    }

    return alerts;
  }

  private notifyListeners(): void {
    const summary = this.getSummary();
    this.metricsListeners.forEach((listener) => listener(summary));
  }

  private sendToMonitoringService(metric: AuthMetric): void {
    // In production, send to Datadog, Sentry, CloudWatch, etc.
    // For now, just log to console in production format
    console.log(JSON.stringify({
      service: 'auth',
      metric: metric.event,
      timestamp: metric.timestamp,
      ...metric.metadata,
    }));
  }
}

// Export singleton instance
export const metrics = new MetricsCollector();
