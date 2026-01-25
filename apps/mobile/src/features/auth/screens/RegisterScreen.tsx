// Register Screen - Create account with email/password

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RegisterScreenProps } from '../../../navigation/types';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { SSOButtons } from '../components/SSOButtons';
import { PasswordStrengthIndicator } from '../components/PasswordStrengthIndicator';
import { useAuth } from '@petforce/auth';

export function RegisterScreen({ navigation }: RegisterScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { registerWithPassword, isLoading, error } = useAuth();

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      return;
    }

    const result = await registerWithPassword({ email, password });
    if (result.success) {
      navigation.navigate('VerifyEmail');
    }
  };

  const passwordsMatch = !confirmPassword || password === confirmPassword;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
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
              <Text style={styles.title}>Join the PetForce Family</Text>
              <Text style={styles.subtitle}>Create your account to get started</Text>
            </View>

            <Card padding="lg">
              {/* SSO Options */}
              <SSOButtons />

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Or sign up with email</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Registration Form */}
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

                <View>
                  <Input
                    label="Password"
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
                  label="Confirm password"
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
                  onPress={handleRegister}
                  isLoading={isLoading}
                  disabled={!email || !password || !confirmPassword || !passwordsMatch}
                >
                  Create account
                </Button>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>Already have an account? </Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.footerLink}>Sign in</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Terms */}
              <Text style={styles.terms}>
                By signing up, you agree to our Terms of Service and Privacy Policy
              </Text>
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#9CA3AF',
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
  terms: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 16,
  },
});
