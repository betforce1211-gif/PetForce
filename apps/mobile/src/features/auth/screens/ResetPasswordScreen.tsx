// Reset Password Screen - Set new password

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ResetPasswordScreenProps } from '../../../navigation/types';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { PasswordStrengthIndicator } from '../components/PasswordStrengthIndicator';
import { usePasswordReset } from '@petforce/auth';

export function ResetPasswordScreen({ navigation, route }: ResetPasswordScreenProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { resetPassword, isLoading, error, resetComplete } = usePasswordReset();

  const handleSubmit = async () => {
    if (password !== confirmPassword) {
      return;
    }

    await resetPassword(password);
  };

  const passwordsMatch = !confirmPassword || password === confirmPassword;

  if (resetComplete) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Card padding="lg">
            {/* Success icon */}
            <View style={styles.successIcon}>
              <Text style={styles.successEmoji}>✅</Text>
            </View>

            <Text style={styles.successTitle}>Password reset!</Text>
            <Text style={styles.successText}>
              Your password has been successfully updated.
            </Text>

            <Button
              variant="primary"
              size="lg"
              onPress={() => navigation.navigate('Login')}
            >
              Sign in with new password
            </Button>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Reset your password</Text>
              <Text style={styles.subtitle}>Enter your new password below</Text>
            </View>

            <Card padding="lg">
              <View style={styles.form}>
                <View>
                  <Input
                    label="New password"
                    placeholder="••••••••"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    textContentType="newPassword"
                    autoComplete="password-new"
                    containerStyle={{ marginBottom: 0 }}
                  />
                  <PasswordStrengthIndicator password={password} />
                </View>

                <Input
                  label="Confirm new password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  textContentType="newPassword"
                  autoComplete="password-new"
                  error={!passwordsMatch ? "Passwords don't match" : undefined}
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
                  disabled={!password || !confirmPassword || !passwordsMatch}
                >
                  Reset password
                </Button>
              </View>
            </Card>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F9FF',
  },
  keyboardView: {
    flex: 1,
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
});
