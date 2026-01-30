// Auth Tab Control - Native tab interface for Sign In / Sign Up

import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';

export type AuthMode = 'login' | 'register';

export interface AuthTabControlProps {
  activeMode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
}

/**
 * Platform-appropriate tab control for switching between login and register
 *
 * Design:
 * - iOS-style segmented control look
 * - Large touch targets (48dp minimum)
 * - Clear active/inactive states
 * - Smooth transitions
 */
export function AuthTabControl({ activeMode, onModeChange }: AuthTabControlProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => onModeChange('login')}
        style={[
          styles.tab,
          styles.tabLeft,
          activeMode === 'login' && styles.tabActive,
        ]}
        accessibilityRole="tab"
        accessibilityState={{ selected: activeMode === 'login' }}
        accessibilityLabel="Sign In"
      >
        <Text
          style={[
            styles.tabText,
            activeMode === 'login' && styles.tabTextActive,
          ]}
        >
          Sign In
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onModeChange('register')}
        style={[
          styles.tab,
          styles.tabRight,
          activeMode === 'register' && styles.tabActive,
        ]}
        accessibilityRole="tab"
        accessibilityState={{ selected: activeMode === 'register' }}
        accessibilityLabel="Sign Up"
      >
        <Text
          style={[
            styles.tabText,
            activeMode === 'register' && styles.tabTextActive,
          ]}
        >
          Sign Up
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 3,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    minHeight: 44, // iOS minimum touch target
  },
  tabLeft: {
    marginRight: 2,
  },
  tabRight: {
    marginLeft: 2,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#2D9B87',
  },
});
