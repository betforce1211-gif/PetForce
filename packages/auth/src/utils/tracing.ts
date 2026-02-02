/**
 * OpenTelemetry Distributed Tracing
 * Enables end-to-end request tracing across services
 */

import { trace, SpanStatusCode, context } from '@opentelemetry/api';
import { logger } from './logger';

const tracer = trace.getTracer('household-api', '1.0.0');

/**
 * Trace an API operation
 */
export async function traceOperation<T>(
  operationName: string,
  operation: () => Promise<T>,
  attributes: Record<string, unknown> = {}
): Promise<T> {
  const span = tracer.startSpan(operationName, {
    attributes: {
      'service.name': 'household-api',
      'operation.type': 'api',
      ...attributes,
    },
  });

  const ctx = trace.setSpan(context.active(), span);

  try {
    const result = await context.with(ctx, operation);

    span.setStatus({ code: SpanStatusCode.OK });
    span.end();

    return result;
  } catch (error) {
    span.recordException(error as Error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: (error as Error).message,
    });
    span.end();

    throw error;
  }
}

/**
 * Add trace context to logs
 */
export function getTraceContext() {
  const span = trace.getActiveSpan();
  if (!span) return {};

  const spanContext = span.spanContext();
  return {
    trace_id: spanContext.traceId,
    span_id: spanContext.spanId,
  };
}

/**
 * Create a child span for detailed tracing
 */
export function createSpan(
  name: string,
  attributes?: Record<string, unknown>
) {
  return tracer.startSpan(name, { attributes });
}

/**
 * Example usage in API functions:
 *
 * export async function createHousehold(data: HouseholdData) {
 *   return traceOperation('household.create', async () => {
 *     const span = createSpan('validate.input', { userId: data.userId });
 *     // ... validation logic
 *     span.end();
 *
 *     const dbSpan = createSpan('db.insert', { table: 'households' });
 *     // ... database insert
 *     dbSpan.end();
 *
 *     logger.info('Household created', { ...getTraceContext() });
 *     return household;
 *   }, {
 *     'household.name': data.name,
 *     'user.id': data.userId,
 *   });
 * }
 */
