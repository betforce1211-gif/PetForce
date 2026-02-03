/**
 * Push Notification Utilities
 *
 * Handles push notification registration, receiving, and handling for household features.
 *
 * Features:
 * - Push notification registration (Expo Notifications)
 * - Permission handling
 * - Notification listeners
 * - Tap-to-navigate functionality
 * - Household-specific notifications
 *
 * Notification Types:
 * - household_join_request: New join request received (leader)
 * - household_join_approved: Join request approved (requester)
 * - household_join_rejected: Join request rejected (requester)
 * - household_member_added: New member joined (all members)
 * - household_member_removed: Member removed (all members)
 * - household_leadership_transferred: Leadership changed (all members)
 *
 * Dependencies:
 * - expo-notifications
 * - expo-device
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import type { NavigationContainerRef } from '@react-navigation/native';

export interface PushNotificationData {
  type: string;
  householdId?: string;
  requestId?: string;
  userId?: string;
  [key: string]: any;
}

/**
 * Configure notification handler
 *
 * Determines how notifications are displayed when app is in foreground.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications
 *
 * @returns Push token if successful, null otherwise
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Check if running on physical device
  if (!Device.isDevice) {
    console.warn('Push notifications only work on physical devices');
    return null;
  }

  try {
    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permission if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Push notification permission not granted');
      return null;
    }

    // Get Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '51f67da2-0a44-4a9d-b5b0-3b2f52b1a4c6', // Replace with your Expo project ID
    });

    const pushToken = tokenData.data;

    // Configure Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('household', {
        name: 'Household Notifications',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2D9B87',
        sound: 'default',
      });
    }

    console.log('Push token registered:', pushToken);
    return pushToken;
  } catch (error) {
    console.error('Failed to register for push notifications', error);
    Alert.alert(
      'Notification Error',
      'Failed to register for push notifications. Some features may not work.'
    );
    return null;
  }
}

/**
 * Handle notification tap
 *
 * Navigates to appropriate screen based on notification data.
 *
 * @param notification - Notification object
 * @param navigation - React Navigation ref
 */
export function handleNotificationTap(
  notification: Notifications.Notification,
  navigation: NavigationContainerRef<any> | null
) {
  if (!navigation) {
    console.warn('Navigation not ready for notification tap');
    return;
  }

  const data = notification.request.content.data as PushNotificationData;

  if (!data || !data.type) {
    console.warn('Notification missing data or type');
    return;
  }

  try {
    switch (data.type) {
      case 'household_join_request':
        // Navigate to household dashboard (leader sees pending requests)
        navigation.navigate('HouseholdDashboard', {
          showPendingRequests: true,
        });
        break;

      case 'household_join_approved':
      case 'household_join_rejected':
        // Navigate to household dashboard or onboarding
        if (data.type === 'household_join_approved') {
          navigation.navigate('HouseholdDashboard');
        } else {
          navigation.navigate('HouseholdOnboarding');
        }
        break;

      case 'household_member_added':
      case 'household_member_removed':
      case 'household_leadership_transferred':
        // Navigate to household dashboard
        navigation.navigate('HouseholdDashboard');
        break;

      default:
        console.warn('Unknown notification type', data.type);
    }
  } catch (error) {
    console.error('Failed to handle notification tap', error);
  }
}

/**
 * Set up notification listeners
 *
 * @param navigation - React Navigation ref
 * @returns Cleanup function
 */
export function setupNotificationListeners(
  navigation: NavigationContainerRef<any> | null
): () => void {
  // Handle notifications received while app is in foreground
  const notificationListener = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('Notification received:', notification);
      // Notification is displayed automatically by setNotificationHandler
    }
  );

  // Handle notification tap (user tapped notification)
  const responseListener = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      console.log('Notification tapped:', response);
      handleNotificationTap(response.notification, navigation);
    }
  );

  // Return cleanup function
  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}

/**
 * Schedule local notification (for testing)
 *
 * @param title - Notification title
 * @param body - Notification body
 * @param data - Notification data
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: PushNotificationData
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.HIGH,
      categoryIdentifier: 'household',
    },
    trigger: {
      seconds: 1,
    },
  });
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications() {
  await Notifications.dismissAllNotificationsAsync();
}

/**
 * Get notification permission status
 *
 * @returns Permission status
 */
export async function getNotificationPermissionStatus(): Promise<string> {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

/**
 * Open notification settings (iOS only)
 */
export async function openNotificationSettings() {
  if (Platform.OS === 'ios') {
    await Notifications.requestPermissionsAsync();
  } else {
    Alert.alert(
      'Notification Settings',
      'Please enable notifications in your device settings.'
    );
  }
}
