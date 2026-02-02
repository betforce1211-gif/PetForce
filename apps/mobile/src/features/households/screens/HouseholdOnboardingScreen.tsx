/**
 * Household Onboarding Screen
 *
 * First step in household setup - user chooses to create or join a household.
 * This screen is shown after successful registration.
 *
 * Features:
 * - Welcome message and explanation
 * - Two primary actions: Create or Join household
 * - Educational content about households
 * - Skip option for later setup
 * - Mobile-optimized with proper touch targets (44x44 minimum)
 * - Safe area handling for iOS notch
 */

import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

// Navigation types will be defined in HouseholdNavigator
type HouseholdOnboardingScreenProps = NativeStackScreenProps<any, 'HouseholdOnboarding'>;

export function HouseholdOnboardingScreen({ navigation }: HouseholdOnboardingScreenProps) {
  const handleCreateHousehold = () => {
    navigation.navigate('CreateHousehold');
  };

  const handleJoinHousehold = () => {
    navigation.navigate('JoinHousehold');
  };

  const handleSkip = () => {
    // Navigate to main dashboard - user can set up household later
    navigation.navigate('Dashboard');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Icon */}
        <View style={styles.headerIcon}>
          <Text style={styles.headerEmoji}>🏠</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>Welcome to PetForce!</Text>
        <Text style={styles.subtitle}>
          Let's set up your household - the foundation for collaborative pet care
        </Text>

        {/* What is a Household? */}
        <Card padding="lg" style={styles.infoCard}>
          <Text style={styles.infoTitle}>What is a Household?</Text>
          <Text style={styles.infoText}>
            A household is your pet care team. Think of it like your physical house - you can
            invite family members, roommates, or temporary pet sitters to help track and manage
            your pets' care together.
          </Text>

          <View style={styles.exampleBox}>
            <View style={styles.exampleItem}>
              <Text style={styles.exampleLabel}>Example:</Text>
              <Text style={styles.exampleValue}>
                "The Zeder House" with 2 dogs, 3 cats, and 1 bird
              </Text>
            </View>
            <View style={styles.exampleItem}>
              <Text style={styles.exampleLabel}>Members:</Text>
              <Text style={styles.exampleValue}>
                You, your wife, kids - all tracking who fed the dogs, gave medicine to the cat,
                cleaned the bird cage
              </Text>
            </View>
            <View style={styles.exampleItem}>
              <Text style={styles.exampleLabel}>Temporary Access:</Text>
              <Text style={styles.exampleValue}>
                Give pet sitters access while you're on vacation
              </Text>
            </View>
          </View>
        </Card>

        {/* Create Household Button */}
        <Card padding="lg" style={styles.optionCard}>
          <View style={styles.optionIcon}>
            <Text style={styles.optionEmoji}>➕</Text>
          </View>
          <Text style={styles.optionTitle}>Create a Household</Text>
          <Text style={styles.optionDescription}>
            Start fresh by creating your own household. You'll be the household leader and can
            invite others to join.
          </Text>

          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureCheck}>✓</Text>
              <Text style={styles.featureText}>You become the household leader</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureCheck}>✓</Text>
              <Text style={styles.featureText}>Add your pets and care tasks</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureCheck}>✓</Text>
              <Text style={styles.featureText}>Invite family and friends</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureCheck}>✓</Text>
              <Text style={styles.featureText}>Manage member permissions</Text>
            </View>
          </View>

          <Button
            variant="primary"
            size="lg"
            onPress={handleCreateHousehold}
            style={styles.primaryButton}
            testID="create-household-button"
          >
            Create Household
          </Button>
        </Card>

        {/* Join Household Button */}
        <Card padding="lg" style={styles.optionCard}>
          <View style={[styles.optionIcon, styles.optionIconSecondary]}>
            <Text style={styles.optionEmoji}>👥</Text>
          </View>
          <Text style={styles.optionTitle}>Join a Household</Text>
          <Text style={styles.optionDescription}>
            Already have an invite code? Join an existing household and start collaborating with
            your family.
          </Text>

          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureCheck}>✓</Text>
              <Text style={styles.featureText}>Enter invite code from leader</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureCheck}>✓</Text>
              <Text style={styles.featureText}>Wait for leader approval</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureCheck}>✓</Text>
              <Text style={styles.featureText}>Start tracking pet care</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureCheck}>✓</Text>
              <Text style={styles.featureText}>See what others have done</Text>
            </View>
          </View>

          <Button
            variant="outline"
            size="lg"
            onPress={handleJoinHousehold}
            style={styles.secondaryButton}
            testID="join-household-button"
          >
            Join Household
          </Button>
        </Card>

        {/* Skip Option */}
        <TouchableOpacity
          onPress={handleSkip}
          style={styles.skipButton}
          testID="skip-button"
        >
          <Text style={styles.skipText}>Skip for now (you can set this up later)</Text>
        </TouchableOpacity>
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
    paddingVertical: 24,
  },
  headerIcon: {
    width: 80,
    height: 80,
    backgroundColor: '#2D9B87',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  infoCard: {
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 16,
  },
  exampleBox: {
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    padding: 16,
  },
  exampleItem: {
    marginBottom: 12,
  },
  exampleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 4,
  },
  exampleValue: {
    fontSize: 13,
    color: '#047857',
    lineHeight: 18,
  },
  optionCard: {
    marginBottom: 16,
  },
  optionIcon: {
    width: 64,
    height: 64,
    backgroundColor: '#D1FAE5',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  optionIconSecondary: {
    backgroundColor: '#FEF3C7',
  },
  optionEmoji: {
    fontSize: 32,
  },
  optionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  featureList: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  featureCheck: {
    fontSize: 16,
    color: '#10B981',
    marginRight: 8,
    marginTop: 2,
  },
  featureText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
    lineHeight: 20,
  },
  primaryButton: {
    minHeight: 48, // 44pt minimum touch target + padding
  },
  secondaryButton: {
    minHeight: 48,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 24,
    minHeight: 44, // iOS minimum touch target
    justifyContent: 'center',
  },
  skipText: {
    fontSize: 14,
    color: '#6B7280',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
});
