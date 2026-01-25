// Magic Link Callback Screen - Handle magic link verification

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../../navigation/types';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { verifyMagicLink } from '@petforce/auth';

type MagicLinkCallbackScreenProps = NativeStackScreenProps<AuthStackParamList, 'MagicLinkCallback'>;

export function MagicLinkCallbackScreen({ navigation, route }: MagicLinkCallbackScreenProps) {
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyLink = async () => {
      try {
        const { token, type = 'magiclink' } = route.params || {};

        if (!token) {
          setError('Invalid magic link. Please request a new one.');
          setIsVerifying(false);
          return;
        }

        const result = await verifyMagicLink(token, type);

        if (result.success) {
          // Navigation will happen automatically via auth state change
        } else {
          setError(
            result.error?.message ||
              'This magic link has expired or is invalid. Please request a new one.'
          );
          setIsVerifying(false);
        }
      } catch (err) {
        console.error('Magic link verification error:', err);
        setError('An unexpected error occurred. Please try again.');
        setIsVerifying(false);
      }
    };

    verifyLink();
  }, [route.params]);

  if (isVerifying) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Card padding="lg">
            <ActivityIndicator size="large" color="#2D9B87" />
            <Text style={styles.verifyingTitle}>Verifying magic link...</Text>
            <Text style={styles.verifyingText}>Please wait while we sign you in</Text>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Card padding="lg">
          {/* Error icon */}
          <View style={styles.iconContainer}>
            <View style={styles.errorIcon}>
              <Text style={styles.iconText}>⚠</Text>
            </View>
          </View>

          <Text style={styles.errorTitle}>Link expired</Text>
          <Text style={styles.errorText}>{error}</Text>

          <Button
            variant="primary"
            size="lg"
            onPress={() => navigation.navigate('Login')}
            style={styles.button}
          >
            Request new link
          </Button>

          <Button
            variant="ghost"
            size="lg"
            onPress={() => navigation.navigate('Welcome')}
          >
            Back to welcome
          </Button>
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
  verifyingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  verifyingText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  iconContainer: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 40,
    color: '#D97706',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    marginBottom: 12,
  },
});
