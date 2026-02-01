// PetForce Observability Package
// Comprehensive logging, monitoring, and performance tracking

export * from './client-logger';
export * from './performance-monitor';

// Re-export auth logging utilities for convenience
// TODO: Re-enable once @petforce/auth exports these modules correctly
// export { logger, type LogLevel, type LogContext, type LogEntry } from '@petforce/auth/utils/logger';
// export { metrics, type AuthMetric, type MetricsSummary } from '@petforce/auth/utils/metrics';
// export { monitoring, createMonitoringService, type MonitoringBackend, type MonitoringConfig } from '@petforce/auth/utils/monitoring';
