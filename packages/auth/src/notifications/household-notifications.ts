/**
 * Household Push Notifications
 *
 * Push notification service for household management events.
 * Supports join requests, approvals, rejections, removals, and expiration warnings.
 */

import { logger } from '../utils/logger';

export interface PushNotification {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

/**
 * Send push notification when a user requests to join a household.
 *
 * Sent to the household leader to notify them of the pending request.
 *
 * @param leaderId - ID of the household leader
 * @param requesterName - Name of the user requesting to join
 * @param householdName - Name of the household
 */
export async function sendJoinRequestNotification(
  leaderId: string,
  requesterName: string,
  householdName: string
): Promise<void> {
  const notification: PushNotification = {
    userId: leaderId,
    title: 'New Join Request',
    body: `${requesterName} wants to join ${householdName}`,
    data: {
      type: 'join_request',
      action: 'view_requests',
    },
  };

  await sendPushNotification(notification);

  logger.info('Join request notification sent', {
    leaderId,
    requesterName,
    householdName,
    correlationId: logger.generateRequestId(),
  });
}

/**
 * Send push notification when a join request is approved.
 *
 * Sent to the user whose request was approved.
 *
 * @param userId - ID of the user whose request was approved
 * @param householdName - Name of the household they joined
 */
export async function sendApprovalNotification(
  userId: string,
  householdName: string
): Promise<void> {
  const notification: PushNotification = {
    userId,
    title: 'Request Approved!',
    body: `You've been approved to join ${householdName}`,
    data: {
      type: 'request_approved',
      action: 'view_household',
    },
  };

  await sendPushNotification(notification);

  logger.info('Approval notification sent', {
    userId,
    householdName,
    correlationId: logger.generateRequestId(),
  });
}

/**
 * Send push notification when a join request is rejected.
 *
 * Sent to the user whose request was rejected.
 *
 * @param userId - ID of the user whose request was rejected
 * @param householdName - Name of the household that rejected them
 */
export async function sendRejectionNotification(
  userId: string,
  householdName: string
): Promise<void> {
  const notification: PushNotification = {
    userId,
    title: 'Request Declined',
    body: `Your request to join ${householdName} was declined`,
    data: {
      type: 'request_rejected',
      action: 'view_onboarding',
    },
  };

  await sendPushNotification(notification);

  logger.info('Rejection notification sent', {
    userId,
    householdName,
    correlationId: logger.generateRequestId(),
  });
}

/**
 * Send push notification when a member is removed from a household.
 *
 * Sent to the removed member.
 *
 * @param userId - ID of the removed member
 * @param householdName - Name of the household they were removed from
 */
export async function sendRemovalNotification(
  userId: string,
  householdName: string
): Promise<void> {
  const notification: PushNotification = {
    userId,
    title: 'Removed from Household',
    body: `You were removed from ${householdName}`,
    data: {
      type: 'member_removed',
      action: 'view_onboarding',
    },
  };

  await sendPushNotification(notification);

  logger.info('Removal notification sent', {
    userId,
    householdName,
    correlationId: logger.generateRequestId(),
  });
}

/**
 * Send push notification warning about temporary access expiration.
 *
 * Sent to temporary members when their access is about to expire.
 *
 * @param userId - ID of the temporary member
 * @param householdName - Name of the household
 * @param daysRemaining - Number of days until expiration
 */
export async function sendExpirationWarningNotification(
  userId: string,
  householdName: string,
  daysRemaining: number
): Promise<void> {
  const notification: PushNotification = {
    userId,
    title: 'Temporary Access Expiring Soon',
    body: `Your access to ${householdName} expires in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}`,
    data: {
      type: 'expiration_warning',
      action: 'view_household',
      daysRemaining,
    },
  };

  await sendPushNotification(notification);

  logger.info('Expiration warning sent', {
    userId,
    householdName,
    daysRemaining,
    correlationId: logger.generateRequestId(),
  });
}

/**
 * Send push notification when leadership is transferred.
 *
 * Sent to the new leader.
 *
 * @param newLeaderId - ID of the new leader
 * @param householdName - Name of the household
 * @param previousLeaderName - Name of the previous leader
 */
export async function sendLeadershipTransferNotification(
  newLeaderId: string,
  householdName: string,
  previousLeaderName: string
): Promise<void> {
  const notification: PushNotification = {
    userId: newLeaderId,
    title: 'You\'re Now the Household Leader',
    body: `${previousLeaderName} transferred leadership of ${householdName} to you`,
    data: {
      type: 'leadership_transferred',
      action: 'view_household',
    },
  };

  await sendPushNotification(notification);

  logger.info('Leadership transfer notification sent', {
    newLeaderId,
    householdName,
    previousLeaderName,
    correlationId: logger.generateRequestId(),
  });
}

/**
 * Provider-agnostic push notification sender.
 *
 * This is a placeholder implementation. In production, this would:
 * 1. Get user's push token from database
 * 2. Send to push notification service (Expo Push Notifications, FCM, or APNS)
 * 3. Handle delivery receipts and failures
 * 4. Retry failed deliveries
 *
 * @param notification - Push notification to send
 */
async function sendPushNotification(notification: PushNotification): Promise<void> {
  // TODO: Integrate with Expo Push Notifications, FCM, or APNS
  // For now, log the notification
  logger.info('Push notification queued', {
    notification: {
      ...notification,
      userId: '[REDACTED]', // Don't log user IDs in production
    },
  });

  // In production, this would:
  // 1. Get user's push token from database:
  //    const { data: user } = await supabase
  //      .from('users')
  //      .select('push_token')
  //      .eq('id', notification.userId)
  //      .single();
  //
  // 2. Send to push notification service:
  //    if (user?.push_token) {
  //      await sendToExpo(user.push_token, notification);
  //    }
  //
  // 3. Handle delivery receipts:
  //    await trackDeliveryReceipt(notification.userId, receiptId);
}

/**
 * Batch send push notifications to multiple users.
 *
 * More efficient than sending individual notifications.
 *
 * @param notifications - Array of push notifications to send
 */
export async function sendBatchPushNotifications(
  notifications: PushNotification[]
): Promise<void> {
  logger.info('Batch push notifications queued', {
    count: notifications.length,
  });

  // Send notifications in parallel
  await Promise.all(notifications.map(sendPushNotification));
}
