/**
 * Webhook System for Household Events
 * Allows external systems to subscribe to household events
 */

import { logger } from '../utils/logger';

export interface WebhookSubscription {
  id: string;
  household_id: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  active: boolean;
  created_at: Date;
}

export type WebhookEvent =
  | 'household.created'
  | 'household.updated'
  | 'household.deleted'
  | 'household.member.added'
  | 'household.member.removed'
  | 'household.member.role_changed'
  | 'household.join_request.created'
  | 'household.join_request.approved'
  | 'household.join_request.rejected'
  | 'household.invite_code.regenerated';

export interface WebhookPayload {
  event: WebhookEvent;
  household_id: string;
  data: unknown;
  timestamp: string;
  signature: string;  // HMAC-SHA256 signature
}

interface WebhookDeliveryResult {
  success: boolean;
  status_code?: number;
  error?: string;
  attempt: number;
  delivered_at: Date;
}

/**
 * Trigger webhook for household event
 */
export async function triggerWebhook(
  event: WebhookEvent,
  householdId: string,
  data: unknown
): Promise<void> {
  const correlationId = logger.generateRequestId();

  try {
    logger.info('Triggering webhooks', {
      event,
      householdId,
      correlationId,
    });

    // Get active subscriptions for this household + event
    const subscriptions = await getWebhookSubscriptions(householdId, event);

    if (subscriptions.length === 0) {
      logger.info('No webhook subscriptions found', { event, householdId });
      return;
    }

    // Send webhooks in parallel
    const results = await Promise.all(
      subscriptions.map(sub => sendWebhookWithRetry(sub, event, householdId, data))
    );

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    logger.info('Webhooks triggered', {
      event,
      householdId,
      total: subscriptions.length,
      successful,
      failed,
      correlationId,
    });
  } catch (error) {
    logger.error('Failed to trigger webhooks', {
      error,
      event,
      householdId,
      correlationId,
    });
  }
}

/**
 * Send webhook with exponential backoff retry
 */
async function sendWebhookWithRetry(
  subscription: WebhookSubscription,
  event: WebhookEvent,
  householdId: string,
  data: unknown,
  maxRetries = 3
): Promise<WebhookDeliveryResult> {
  const payload: WebhookPayload = {
    event,
    household_id: householdId,
    data,
    timestamp: new Date().toISOString(),
    signature: generateSignature(subscription.secret, data),
  };

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(subscription.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': payload.signature,
          'X-Webhook-Event': event,
          'User-Agent': 'PetForce-Webhooks/1.0',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        logger.info('Webhook delivered', {
          subscriptionId: subscription.id,
          event,
          attempt,
          statusCode: response.status,
        });

        return {
          success: true,
          status_code: response.status,
          attempt,
          delivered_at: new Date(),
        };
      }

      // Non-2xx response
      logger.warn('Webhook delivery failed', {
        subscriptionId: subscription.id,
        event,
        attempt,
        statusCode: response.status,
      });

      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        await sleep(delay);
      }
    } catch (error) {
      logger.error('Webhook request error', {
        subscriptionId: subscription.id,
        event,
        attempt,
        error,
      });

      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        await sleep(delay);
      }
    }
  }

  // All retries failed
  return {
    success: false,
    error: 'Max retries exceeded',
    attempt: maxRetries,
    delivered_at: new Date(),
  };
}

/**
 * Generate HMAC-SHA256 signature for webhook payload
 */
function generateSignature(secret: string, data: unknown): string {
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(data));
  return hmac.digest('hex');
}

/**
 * Verify webhook signature (for webhook receivers)
 */
export function verifyWebhookSignature(
  secret: string,
  data: unknown,
  signature: string
): boolean {
  const expectedSignature = generateSignature(secret, data);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Get webhook subscriptions for household + event
 */
async function getWebhookSubscriptions(
  householdId: string,
  event: WebhookEvent
): Promise<WebhookSubscription[]> {
  // TODO: Implement database query
  // For now, return empty array (no subscriptions)
  return [];

  /* Example implementation:
  const { data } = await supabase
    .from('webhook_subscriptions')
    .select('*')
    .eq('household_id', householdId)
    .eq('active', true)
    .contains('events', [event]);

  return data || [];
  */
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Example usage:
 *
 * // After creating household
 * await triggerWebhook('household.created', householdId, {
 *   name: household.name,
 *   leader_id: household.leader_id,
 * });
 *
 * // After approving join request
 * await triggerWebhook('household.join_request.approved', householdId, {
 *   user_id: request.user_id,
 *   approved_by: leaderId,
 * });
 */
