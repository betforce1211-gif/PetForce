// Verify Email Screen - Email verification success celebration

import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { VerifyEmailScreenProps } from '../../../navigation/types';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

export function VerifyEmailScreen({ navigation }: VerifyEmailScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Card padding="lg">
          {/* Success icon with animation */}
          <View style={styles.iconContainer}>
            <View style={styles.icon}>
              <Text style={styles.iconEmoji}>✓</Text>
            </View>
          </View>

          <Text style={styles.title}>Welcome to the PetForce Family! 🎉</Text>
          <Text style={styles.subtitle}>
            Your email has been verified. You're all set to start caring for your pets!
          </Text>

          <Button
            variant="primary"
            size="lg"
            onPress={() => {
              // Navigation will be handled by auth state
            }}
            style={styles.button}
          >
            Let's get started
          </Button>

          <Text style={styles.helperText}>
            Need help getting started? Check out our quick start guide
          </Text>
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F9FF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  icon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 48,
    color: '#2D9B87',
    fontWeight: '700',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    marginBottom: 16,
  },
  helperText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
