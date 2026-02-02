/**
 * Household Settings Screen
 *
 * Leader-only screen for managing household configuration:
 * - View/regenerate invite code
 * - Leave household (with successor designation)
 *
 * Features:
 * - Leader-only access (auto-redirect if not leader)
 * - Regenerate code with expiration picker
 * - Leave household with confirmation
 * - Danger zone styling
 */

import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Clipboard from '@react-native-clipboard/clipboard';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import {
  useHouseholdStore,
  selectIsLeader,
  selectCanManageMembers,
} from '@petforce/auth';
import { useAuthStore } from '@petforce/auth';

type HouseholdSettingsScreenProps = NativeStackScreenProps<any, 'HouseholdSettings'>;

export function HouseholdSettingsScreen({ navigation }: HouseholdSettingsScreenProps) {
  const { user } = useAuthStore();
  const {
    household,
    loading,
    error,
    fetchHousehold,
    regenerateInviteCode,
    leaveHousehold,
  } = useHouseholdStore();

  const isLeader = useHouseholdStore(selectIsLeader);
  const [copiedCode, setCopiedCode] = useState(false);

  // Fetch household on mount
  useEffect(() => {
    if (user?.id) {
      fetchHousehold(user.id);
    }
  }, [user?.id, fetchHousehold]);

  // Redirect non-leaders
  useEffect(() => {
    if (!loading && !isLeader) {
      Alert.alert('Access Denied', 'Only household leaders can access settings');
      navigation.goBack();
    }
  }, [loading, isLeader, navigation]);

  const handleCopyCode = () => {
    if (household?.inviteCode) {
      Clipboard.setString(household.inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      Alert.alert('Copied!', 'Invite code copied to clipboard');
    }
  };

  const handleRegenerateCode = () => {
    const options = [
      '7 days',
      '30 days',
      '90 days',
      'Never',
      'Cancel',
    ];

    const expirationDays = [7, 30, 90, -1]; // -1 for never

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 4,
          title: 'Invite Code Expiration',
          message: 'How long should the new invite code be valid?',
        },
        async (buttonIndex) => {
          if (buttonIndex < 4 && household?.id && user?.id) {
            const days = expirationDays[buttonIndex];
            await regenerateInviteCode(household.id, user.id, days);

            const currentError = useHouseholdStore.getState().error;
            if (!currentError) {
              Alert.alert('Success', 'New invite code generated!');
            }
          }
        }
      );
    } else {
      // Android - use Alert with buttons
      Alert.alert(
        'Invite Code Expiration',
        'How long should the new invite code be valid?',
        [
          {
            text: '7 days',
            onPress: async () => {
              if (household?.id && user?.id) {
                await regenerateInviteCode(household.id, user.id, 7);
                const currentError = useHouseholdStore.getState().error;
                if (!currentError) {
                  Alert.alert('Success', 'New invite code generated!');
                }
              }
            },
          },
          {
            text: '30 days',
            onPress: async () => {
              if (household?.id && user?.id) {
                await regenerateInviteCode(household.id, user.id, 30);
                const currentError = useHouseholdStore.getState().error;
                if (!currentError) {
                  Alert.alert('Success', 'New invite code generated!');
                }
              }
            },
          },
          {
            text: '90 days',
            onPress: async () => {
              if (household?.id && user?.id) {
                await regenerateInviteCode(household.id, user.id, 90);
                const currentError = useHouseholdStore.getState().error;
                if (!currentError) {
                  Alert.alert('Success', 'New invite code generated!');
                }
              }
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const handleLeaveHousehold = () => {
    Alert.alert(
      'Leave Household?',
      'As the household leader, you cannot leave without designating a successor. This feature is coming soon.',
      [{ text: 'OK' }]
    );
  };

  if (!household || !isLeader) {
    return null; // Will redirect
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Household Settings</Text>
          <Text style={styles.headerSubtitle}>{household.name}</Text>
        </View>

        {/* Error Display */}
        {error && (
          <Card padding="md" style={styles.errorCard}>
            <View style={styles.errorContent}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{error.message}</Text>
            </View>
          </Card>
        )}

        {/* Invite Code Management */}
        <Card padding="lg" style={styles.section}>
          <Text style={styles.sectionTitle}>Invite Code Management</Text>
          <Text style={styles.sectionDescription}>
            Share this code with family members to invite them to your household.
          </Text>

          {household.inviteCode && (
            <View style={styles.inviteCodeBox}>
              <Text style={styles.inviteCodeLabel}>Current Invite Code</Text>
              <Text style={styles.inviteCode}>{household.inviteCode}</Text>
              {household.inviteCodeExpiresAt && (
                <Text style={styles.inviteExpiry}>
                  Expires: {new Date(household.inviteCodeExpiresAt).toLocaleDateString()}
                </Text>
              )}

              <View style={styles.codeActions}>
                <Button
                  variant="outline"
                  size="md"
                  onPress={handleCopyCode}
                  disabled={loading}
                  style={styles.codeButton}
                  testID="copy-code-button"
                >
                  {copiedCode ? 'Copied!' : 'Copy Code'}
                </Button>
              </View>
            </View>
          )}

          {/* Regenerate Warning */}
          <View style={styles.warningBox}>
            <View style={styles.warningHeader}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.warningTitle}>Need a new invite code?</Text>
            </View>
            <Text style={styles.warningText}>
              Regenerating the code will invalidate the current one. Anyone with the old code
              won't be able to join.
            </Text>
            <Button
              variant="outline"
              size="md"
              onPress={handleRegenerateCode}
              isLoading={loading}
              disabled={loading}
              style={styles.regenerateButton}
              testID="regenerate-button"
            >
              Regenerate Invite Code
            </Button>
          </View>
        </Card>

        {/* Email Invites (Future) */}
        <Card padding="lg" style={styles.section}>
          <Text style={styles.sectionTitle}>Email Invites</Text>
          <Text style={styles.sectionDescription}>
            Send personalized email invitations directly to family members.
          </Text>

          <View style={styles.comingSoonBox}>
            <Text style={styles.comingSoonEmoji}>✉️</Text>
            <Text style={styles.comingSoonTitle}>Email invites coming soon</Text>
            <Text style={styles.comingSoonText}>
              This feature is currently in development
            </Text>
          </View>
        </Card>

        {/* Danger Zone */}
        <Card padding="lg" style={styles.dangerSection}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>

          <View style={styles.dangerItem}>
            <View style={styles.dangerItemText}>
              <Text style={styles.dangerItemTitle}>Leave Household</Text>
              <Text style={styles.dangerItemDescription}>
                As the household leader, leaving will require selecting a new leader from existing
                members.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.dangerButton}
              onPress={handleLeaveHousehold}
              disabled={loading}
              testID="leave-button"
            >
              <Text style={styles.dangerButtonText}>Leave</Text>
            </TouchableOpacity>
          </View>
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
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorCard: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginBottom: 16,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#991B1B',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 16,
  },
  inviteCodeBox: {
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  inviteCodeLabel: {
    fontSize: 13,
    color: '#065F46',
    marginBottom: 8,
  },
  inviteCode: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#047857',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 4,
  },
  inviteExpiry: {
    fontSize: 13,
    color: '#059669',
    marginBottom: 16,
  },
  codeActions: {
    width: '100%',
  },
  codeButton: {
    width: '100%',
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  warningIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#92400E',
  },
  warningText: {
    fontSize: 14,
    color: '#B45309',
    lineHeight: 20,
    marginBottom: 12,
  },
  regenerateButton: {
    minHeight: 44,
  },
  comingSoonBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  comingSoonEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  comingSoonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 4,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  dangerSection: {
    borderWidth: 2,
    borderColor: '#FCA5A5',
    marginBottom: 24,
  },
  dangerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#991B1B',
    marginBottom: 16,
  },
  dangerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  dangerItemText: {
    flex: 1,
    marginRight: 12,
  },
  dangerItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  dangerItemDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  dangerButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 8,
    minHeight: 44,
    minWidth: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dangerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
});
