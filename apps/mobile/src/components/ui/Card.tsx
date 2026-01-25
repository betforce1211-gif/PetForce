// Card Component - Container with shadow and rounded corners

import { View, StyleSheet, ViewStyle } from 'react-native';
import { ReactNode } from 'react';

export interface CardProps {
  children: ReactNode;
  padding?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export function Card({ children, padding = 'md', style }: CardProps) {
  return (
    <View style={[styles.card, styles[`padding${padding.charAt(0).toUpperCase() + padding.slice(1)}`], style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  paddingSm: {
    padding: 12,
  },
  paddingMd: {
    padding: 16,
  },
  paddingLg: {
    padding: 24,
  },
});
