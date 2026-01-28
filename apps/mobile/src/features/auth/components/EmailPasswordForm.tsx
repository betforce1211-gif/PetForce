// Email Password Form - Unified form for login and registration

import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { useAuth } from '@petforce/auth';
import type { AuthMode } from './AuthTabControl';

export interface EmailPasswordFormProps {
  mode: AuthMode;
  onSuccess?: () => void;
  onForgotPassword?: () => void;
}

/**
 * Unified email/password form that adapts based on mode
 *
 * Mode: login
 * - Email + Password fields
 * - "Forgot password?" link
 * - "Sign in" button
 *
 * Mode: register
 * - Email + Password + Confirm Password fields
 * - Password strength indicator
 * - "Create account" button
 * - Terms/privacy notice
 */
export function EmailPasswordForm({
  mode,
  onSuccess,
  onForgotPassword,
}: EmailPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { loginWithPassword, registerWithPassword, isLoading, error } = useAuth();

  const handleSubmit = async () => {
    if (mode === 'login') {
      const result = await loginWithPassword({ email, password });
      if (result.success) {
        onSuccess?.();
      }
    } else {
      // Register mode
      if (password !== confirmPassword) {
        return;
      }

      const result = await registerWithPassword({ email, password });
      if (result.success) {
        onSuccess?.();
      }
    }
  };

  const passwordsMatch = !confirmPassword || password === confirmPassword;
  const isFormValid =
    mode === 'login'
      ? email && password
      : email && password && confirmPassword && passwordsMatch;

  return (
    <View style={styles.container}>
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
        containerStyle={styles.input}
      />

      <View style={styles.input}>
        <Input
          label="Password"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          textContentType={mode === 'login' ? 'password' : 'newPassword'}
          autoComplete={mode === 'login' ? 'password' : 'password-new'}
          containerStyle={{ marginBottom: 0 }}
        />

        {mode === 'register' && password && (
          <PasswordStrengthIndicator password={password} showRequirements={false} />
        )}
      </View>

      {mode === 'login' && (
        <TouchableOpacity
          onPress={onForgotPassword}
          style={styles.forgotPassword}
        >
          <Text style={styles.forgotPasswordText}>Forgot password?</Text>
        </TouchableOpacity>
      )}

      {mode === 'register' && (
        <Input
          label="Confirm password"
          placeholder="••••••••"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showPassword}
          textContentType="newPassword"
          autoComplete="password-new"
          error={!passwordsMatch ? "Passwords don't match" : undefined}
          containerStyle={styles.input}
        />
      )}

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
        disabled={!isFormValid}
        style={styles.submitButton}
      >
        {mode === 'login' ? 'Sign in' : 'Create account'}
      </Button>

      {mode === 'register' && (
        <Text style={styles.terms}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  input: {
    marginBottom: 0,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -4,
    marginBottom: 4,
    minHeight: 44, // Touch target
    justifyContent: 'center',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#2D9B87',
    fontWeight: '600',
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
  submitButton: {
    marginTop: 4,
  },
  terms: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
  },
});
