// OAuth Callback Screen - Handle OAuth redirects from Google/Apple

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../../navigation/types';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { handleOAuthCallback } from '@petforce/auth';

type OAuthCallbackScreenProps = NativeStackScreenProps<AuthStackParamList, 'OAuthCallback'>;

export function OAuthCallbackScreen({ navigation, route }: OAuthCallbackScreenProps) {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Handle the OAuth callback - Supabase handles token extraction automatically
        const result = await handleOAuthCallback();

        if (result.success) {
          // Navigation will happen automatically via auth state change
        } else {
          setError(result.error?.message || 'Failed to complete sign in. Please try again.');
          setIsProcessing(false);
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError('An unexpected error occurred. Please try again.');
        setIsProcessing(false);
      }
    };

    processCallback();
  }, []);

  if (isProcessing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Card padding="lg">
            <ActivityIndicator size="large" color="#2D9B87" />
            <Text style={styles.processingTitle}>Completing sign in...</Text>
            <Text style={styles.processingText}>Please wait while we set up your account</Text>
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
              <Text style={styles.iconText}>✕</Text>
            </View>
          </View>

          <Text style={styles.errorTitle}>Sign in failed</Text>
          <Text style={styles.errorText}>{error}</Text>

          <Button
            variant="primary"
            size="lg"
            onPress={() => navigation.navigate('Welcome')}
            style={styles.button}
          >
            Try again
          </Button>

          <Button
            variant="ghost"
            size="lg"
            onPress={() => navigation.navigate('Login')}
          >
            Back to sign in
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
  processingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  processingText: {
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
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 40,
    color: '#DC2626',
    fontWeight: '700',
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
