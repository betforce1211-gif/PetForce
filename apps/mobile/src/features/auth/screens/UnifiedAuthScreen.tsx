// Unified Auth Screen - Single-screen authentication with tabs

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { UnifiedAuthScreenProps } from '../../../navigation/types';
import { Card } from '../../../components/ui/Card';
import { SSOButtons } from '../components/SSOButtons';
import { AuthTabControl, type AuthMode } from '../components/AuthTabControl';
import { EmailPasswordForm } from '../components/EmailPasswordForm';

/**
 * Unified authentication screen
 *
 * Replaces the previous multi-screen flow (Welcome → Login/Register) with
 * a single screen featuring a native tab control:
 *
 * Benefits:
 * - Zero navigation required for login (majority use case)
 * - No duplicate SSO buttons (shown once per tab)
 * - Compact spacing - form fits without scrolling on most devices
 * - Clear tab pattern (iOS segmented control style)
 * - Login is default state
 * - Smooth mode switching with minimal re-renders
 *
 * Mobile-specific optimizations:
 * - KeyboardAvoidingView for iOS/Android
 * - Minimum 44pt touch targets
 * - Compact spacing throughout
 * - Proper keyboard types
 * - Auto-scroll to focused input
 */
export function UnifiedAuthScreen({ navigation }: UnifiedAuthScreenProps) {
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  const handleAuthSuccess = () => {
    // Auth state change will trigger navigation automatically
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoEmoji}>🐾</Text>
            </View>
          </View>

          {/* Compact Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {authMode === 'login' ? 'Welcome Back' : 'Join the Family'}
            </Text>
            <Text style={styles.subtitle}>
              {authMode === 'login'
                ? 'Sign in to care for your pets'
                : 'The simplest way to care for your pets'}
            </Text>
          </View>

          {/* Auth Card */}
          <Card padding="md" style={styles.card}>
            {/* Tab Control */}
            <AuthTabControl activeMode={authMode} onModeChange={setAuthMode} />

            {/* SSO Buttons (shown once per mode) */}
            <SSOButtons onSuccess={handleAuthSuccess} />

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>
                {authMode === 'login' ? 'Or sign in with email' : 'Or sign up with email'}
              </Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Email/Password Form */}
            <EmailPasswordForm
              mode={authMode}
              onSuccess={handleAuthSuccess}
              onForgotPassword={authMode === 'login' ? handleForgotPassword : undefined}
            />
          </Card>
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
    paddingTop: 16, // Reduced from 32
    paddingBottom: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16, // Reduced from 24
  },
  logo: {
    width: 64, // Reduced from 80
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2D9B87',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: {
    fontSize: 32, // Reduced from 40
  },
  header: {
    marginBottom: 20, // Reduced from 32
  },
  title: {
    fontSize: 28, // Reduced from 32
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 6, // Reduced from 8
  },
  subtitle: {
    fontSize: 15, // Reduced from 16
    color: '#6B7280',
    textAlign: 'center',
  },
  card: {
    marginBottom: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16, // Reduced from 24
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 12, // Reduced from 16
    fontSize: 13, // Reduced from 14
    color: '#9CA3AF',
  },
});
