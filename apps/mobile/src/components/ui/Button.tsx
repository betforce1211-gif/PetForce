// Button Component - Reusable button with variants for React Native

import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { ReactNode } from 'react';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  children: ReactNode;
  style?: ViewStyle;
  testID?: string;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  onPress,
  children,
  style,
  testID,
}: ButtonProps) {
  const containerStyle = [
    styles.base,
    styles[`${variant}Container`],
    styles[`${size}Container`],
    disabled && styles.disabled,
    style,
  ];

  const textStyle: TextStyle[] = [
    styles[`${variant}Text`],
    styles[`${size}Text`],
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
      testID={testID}
      accessible={true}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || isLoading, busy: isLoading }}
      accessibilityLabel={typeof children === 'string' ? children : undefined}
    >
      {isLoading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'secondary' ? '#FFFFFF' : '#2D9B87'}
          size={size === 'lg' ? 20 : 18}
          accessibilityLabel="Loading"
        />
      ) : (
        <Text style={textStyle}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  // Variant styles - Container
  primaryContainer: {
    backgroundColor: '#2D9B87',
  },
  secondaryContainer: {
    backgroundColor: '#FF9F40',
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#2D9B87',
  },
  ghostContainer: {
    backgroundColor: 'transparent',
  },

  // Variant styles - Text
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  secondaryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  outlineText: {
    color: '#2D9B87',
    fontWeight: '600',
  },
  ghostText: {
    color: '#2D9B87',
    fontWeight: '600',
  },

  // Size styles - Container
  smContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
  },
  mdContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  lgContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    minHeight: 52,
  },

  // Size styles - Text
  smText: {
    fontSize: 14,
  },
  mdText: {
    fontSize: 16,
  },
  lgText: {
    fontSize: 18,
  },

  // States
  disabled: {
    opacity: 0.5,
  },
});
