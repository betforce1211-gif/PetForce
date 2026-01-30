// Forgot Password Screen - Request password reset

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ForgotPasswordScreenProps } from '../../../navigation/types';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { usePasswordReset } from '@petforce/auth';

export function ForgotPasswordScreen({ navigation }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState('');
  const { sendResetEmail, isLoading, error, emailSent } = usePasswordReset();

  const handleSubmit = async () => {
    await sendResetEmail(email);
  };

  if (emailSent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Card padding="lg">
            {/* Success icon */}
            <View style={styles.successIcon}>
              <Text style={styles.successEmoji}>✅</Text>
            </View>

            <Text style={styles.successTitle}>Check your email</Text>
            <Text style={styles.successText}>
              If an account exists with <Text style={styles.email}>{email}</Text>, we've sent you a password reset link.
            </Text>

            <Button
              variant="primary"
              size="lg"
              onPress={() => navigation.navigate('Login')}
              style={styles.button}
            >
              Back to sign in
            </Button>

            <TouchableOpacity onPress={handleSubmit} style={styles.resendButton}>
              <Text style={styles.resendText}>Didn't receive the email? </Text>
              <Text style={styles.resendLink}>Try again</Text>
            </TouchableOpacity>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Back button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Forgot password?</Text>
            <Text style={styles.subtitle}>No worries! Enter your email and we'll send you a reset link.</Text>
          </View>

          <Card padding="lg">
            <View style={styles.form}>
              <Input
                label="Email address"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
              />

              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error.message}</Text>
                </View>
              )}

              <Button
                variant="primary"
                size="lg"
                onPress={handleSubmit}
                isLoading={isLoading}
                disabled={!email}
              >
                Send reset link
              </Button>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Remember your password? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.footerLink}>Sign in</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F9FF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  backButton: {
    marginBottom: 24,
  },
  backButtonText: {
    fontSize: 16,
    color: '#2D9B87',
    fontWeight: '600',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  form: {
    gap: 16,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    color: '#991B1B',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  footerLink: {
    fontSize: 14,
    color: '#2D9B87',
    fontWeight: '600',
  },
  successIcon: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  successEmoji: {
    fontSize: 64,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  successText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  email: {
    fontWeight: '600',
    color: '#111827',
  },
  button: {
    marginBottom: 16,
  },
  resendButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: '#6B7280',
  },
  resendLink: {
    fontSize: 14,
    color: '#2D9B87',
    fontWeight: '600',
  },
});
