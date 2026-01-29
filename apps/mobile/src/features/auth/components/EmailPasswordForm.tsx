// Email Password Form - Unified form for login and registration

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Keyboard, AccessibilityInfo } from 'react-native';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { useAuth } from '@petforce/auth';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import { HapticFeedback } from '../../../utils/haptics';
import type { AuthMode } from './AuthTabControl';

export interface EmailPasswordFormProps {
  mode: AuthMode;
  onSuccess?: () => void;
  onForgotPassword?: () => void;
  onNavigateToVerify?: (email: string) => void;
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
  onNavigateToVerify,
}: EmailPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const { loginWithPassword, registerWithPassword, isLoading, error } = useAuth();
  const { isConnected } = useNetworkStatus();

  const isOffline = !isConnected;

  // P0: Announce status changes to screen readers
  useEffect(() => {
    if (statusMessage) {
      AccessibilityInfo.announceForAccessibility(statusMessage);
    }
  }, [statusMessage]);

  const handleSubmit = async () => {
    // P0: Check offline status before attempting submission
    if (isOffline) {
      setStatusMessage("You're offline. Registration requires an internet connection.");
      await HapticFeedback.error();
      return;
    }

    // P0: Dismiss keyboard immediately
    Keyboard.dismiss();

    // P0: Haptic feedback on submit
    await HapticFeedback.medium();

    if (mode === 'login') {
      setStatusMessage('Signing in...');
      const result = await loginWithPassword({ email, password });
      if (result.success) {
        setStatusMessage('Sign in successful!');
        await HapticFeedback.success();
        onSuccess?.();
      } else {
        setStatusMessage(`Sign in failed: ${result.error?.message || 'Unknown error'}`);
        await HapticFeedback.error();
      }
    } else {
      // Register mode
      if (password !== confirmPassword) {
        setStatusMessage("Passwords don't match");
        await HapticFeedback.error();
        return;
      }

      setStatusMessage('Creating account...');
      const result = await registerWithPassword({ email, password });
      if (result.success) {
        setStatusMessage('Account created! Redirecting to verification...');
        await HapticFeedback.success();
        // P0: Navigate to verification page with email
        onNavigateToVerify?.(email);
      } else {
        setStatusMessage(`Registration failed: ${error?.message || 'Unknown error'}`);
        await HapticFeedback.error();
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
      {/* P0: Offline banner */}
      {isOffline && (
        <View
          style={styles.offlineBanner}
          accessible={true}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          <Text style={styles.offlineBannerText}>
            You're offline. {mode === 'register' ? 'Registration' : 'Sign in'} requires an internet connection.
          </Text>
        </View>
      )}

      {/* P0: Hidden status message for screen readers */}
      {statusMessage && (
        <View
          accessible={true}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={styles.srOnly}
        >
          <Text>{statusMessage}</Text>
        </View>
      )}

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
        editable={!isLoading}
        accessible={true}
        accessibilityLabel="Email address"
        accessibilityHint="Enter your email address"
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
          editable={!isLoading}
          accessible={true}
          accessibilityLabel="Password"
          accessibilityHint={mode === 'login' ? 'Enter your password' : 'Create a password'}
        />

        {mode === 'register' && password && (
          <PasswordStrengthIndicator password={password} showRequirements={false} />
        )}
      </View>

      {mode === 'login' && (
        <TouchableOpacity
          onPress={onForgotPassword}
          style={styles.forgotPassword}
          disabled={isLoading}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Forgot password"
          accessibilityHint="Reset your password"
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
          editable={!isLoading}
          accessible={true}
          accessibilityLabel="Confirm password"
          accessibilityHint="Re-enter your password to confirm"
        />
      )}

      {error && (
        <View
          style={styles.errorContainer}
          accessible={true}
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
        >
          <Text style={styles.errorText}>{error.message}</Text>
        </View>
      )}

      <Button
        variant="primary"
        size="lg"
        onPress={handleSubmit}
        isLoading={isLoading}
        disabled={!isFormValid || isOffline}
        style={styles.submitButton}
        testID={`${mode}-submit-button`}
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
  offlineBanner: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
    marginBottom: 12,
  },
  offlineBannerText: {
    color: '#92400E',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  srOnly: {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
  },
});
