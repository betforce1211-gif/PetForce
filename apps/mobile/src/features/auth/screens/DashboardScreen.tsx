// Dashboard Screen - Main app screen for authenticated users

import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { DashboardScreenProps } from '../../../navigation/types';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useAuthStore } from '@petforce/auth';

export function DashboardScreen({ navigation }: DashboardScreenProps) {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    // Navigation will happen automatically via auth state change
  };

  const features = [
    { emoji: '🐶', title: 'Pet Profiles', description: 'Add and manage your beloved pets\' profiles' },
    { emoji: '📋', title: 'Health Records', description: 'Track vaccinations, medications, and vet visits' },
    { emoji: '⏰', title: 'Care Reminders', description: 'Set up reminders for feeding, walks, and medications' },
    { emoji: '🏥', title: 'Vet Connection', description: 'Connect with your veterinarian for seamless care' },
    { emoji: '📊', title: 'Health Analytics', description: 'View insights and trends about your pet\'s health' },
    { emoji: '📱', title: 'Family Sharing', description: 'Share pet care with your family members' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.logo}>
              <Text style={styles.logoEmoji}>🐾</Text>
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>PetForce Dashboard</Text>
              <Text style={styles.headerSubtitle}>Welcome back, {user?.email?.split('@')[0] || 'Pet Parent'}!</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Success message */}
        <Card padding="lg" style={styles.successCard}>
          <View style={styles.successIcon}>
            <Text style={styles.successEmoji}>✓</Text>
          </View>
          <Text style={styles.successTitle}>Authentication Complete!</Text>
          <Text style={styles.successText}>
            You've successfully signed in to PetForce. Your authentication is working perfectly.
          </Text>
        </Card>

        {/* Feature grid */}
        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <Card key={index} padding="md" style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureEmoji}>{feature.emoji}</Text>
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
              <Button variant="outline" size="sm" style={styles.featureButton}>
                Coming Soon
              </Button>
            </Card>
          ))}
        </View>

        {/* Welcome message */}
        <Card padding="lg" style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Welcome to the PetForce Family! 🎉</Text>
          <Text style={styles.welcomeText}>
            You're all set! We've successfully implemented a comprehensive authentication system with
            email/password, magic links, and SSO. The features above are coming soon as we
            continue building PetForce to help you care for your beloved pets.
          </Text>
        </Card>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2D9B87',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoEmoji: {
    fontSize: 24,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  successCard: {
    marginBottom: 24,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  successEmoji: {
    fontSize: 32,
    color: '#2D9B87',
    fontWeight: '700',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  featureCard: {
    width: '48%',
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureEmoji: {
    fontSize: 24,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  featureButton: {
    width: '100%',
  },
  welcomeCard: {
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
