// Haptic Feedback Utilities - Cross-platform haptic feedback

import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Haptic feedback types for common UI interactions
 */
export const HapticFeedback = {
  /**
   * Light impact - for subtle interactions (toggle, check)
   */
  light: async () => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },

  /**
   * Medium impact - for standard interactions (button press)
   */
  medium: async () => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  },

  /**
   * Heavy impact - for significant interactions (delete, submit)
   */
  heavy: async () => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  },

  /**
   * Selection - for picker/slider changes
   */
  selection: async () => {
    if (Platform.OS === 'ios') {
      await Haptics.selectionAsync();
    }
  },

  /**
   * Success notification - for successful operations
   */
  success: async () => {
    if (Platform.OS === 'ios') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  },

  /**
   * Warning notification - for warning states
   */
  warning: async () => {
    if (Platform.OS === 'ios') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  },

  /**
   * Error notification - for error states
   */
  error: async () => {
    if (Platform.OS === 'ios') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  },
};

/**
 * Safe haptic feedback wrapper that catches errors
 */
export async function safeHaptic(hapticFn: () => Promise<void>): Promise<void> {
  try {
    await hapticFn();
  } catch (error) {
    // Silently fail - haptics are nice-to-have, not critical
    console.debug('Haptic feedback unavailable:', error);
  }
}
