// Welcome Screen - Entry point for authentication

import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { WelcomeScreenProps } from '../../../navigation/types';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { SSOButtons } from '../components/SSOButtons';

export function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Logo/Icon */}
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoEmoji}>🐾</Text>
            </View>
          </View>

          {/* Heading */}
          <View style={styles.header}>
            <Text style={styles.title}>Join the PetForce Family</Text>
            <Text style={styles.subtitle}>The simplest way to care for your family's pets</Text>
          </View>

          <Card padding="lg" style={styles.card}>
            {/* SSO Buttons */}
            <SSOButtons onSuccess={() => navigation.navigate('Dashboard' as any)} />

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Auth method buttons */}
            <View style={styles.authButtons}>
              <Button
                variant="primary"
                size="lg"
                onPress={() => navigation.navigate('Register')}
                style={styles.button}
              >
                Sign up with email
              </Button>

              <Button
                variant="outline"
                size="lg"
                onPress={() => navigation.navigate('Login')}
                style={styles.button}
              >
                Sign in with email
              </Button>
            </View>
          </Card>

          {/* Footer */}
          <Text style={styles.footer}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
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
    paddingVertical: 32,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2D9B87',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: {
    fontSize: 40,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  card: {
    marginBottom: 24,
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
  authButtons: {
    gap: 12,
  },
  button: {
    width: '100%',
  },
  footer: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
