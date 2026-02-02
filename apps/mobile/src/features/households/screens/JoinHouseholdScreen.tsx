/**
 * Join Household Screen
 *
 * Form for joining an existing household using an invite code.
 * User sends a join request that must be approved by the household leader.
 *
 * Features:
 * - Invite code input with auto-formatting (XXXXX-XXXXX)
 * - Auto-uppercase as user types
 * - "Scan QR Code" button (launches QRCodeScanner)
 * - Loading state during request submission
 * - Success screen showing "request pending approval"
 * - Error handling with alerts
 * - KeyboardAvoidingView for iOS
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useHouseholdStore } from '@petforce/auth';
import { useAuthStore } from '@petforce/auth';

type JoinHouseholdScreenProps = NativeStackScreenProps<any, 'JoinHousehold'>;

export function JoinHouseholdScreen({ navigation }: JoinHouseholdScreenProps) {
  const { user } = useAuthStore();
  const { joinHousehold, loading, error, clearError } = useHouseholdStore();

  const [inviteCode, setInviteCode] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const INVITE_CODE_FORMAT = /^[A-Z0-9]{5}-[A-Z0-9]{5}$/;

  /**
   * Format invite code as user types: XXXXX-XXXXX
   */
  const formatInviteCode = (value: string): string => {
    // Remove all non-alphanumeric characters and convert to uppercase
    const cleaned = value.replace(/[^A-Z0-9]/gi, '').toUpperCase();

    // Add hyphen after 5th character
    if (cleaned.length <= 5) {
      return cleaned;
    }

    return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 10)}`;
  };

  const handleInviteCodeChange = (value: string) => {
    const formatted = formatInviteCode(value);
    setInviteCode(formatted);
    setValidationError(null);
    clearError();
  };

  const handleScanQR = () => {
    // TODO: Navigate to QR scanner (Task 5.8)
    Alert.alert('Coming Soon', 'QR code scanning will be available soon!');
  };

  const handleJoin = async () => {
    setValidationError(null);
    clearError();

    // Validation
    if (!inviteCode.trim()) {
      setValidationError('Invite code is required');
      return;
    }

    if (!INVITE_CODE_FORMAT.test(inviteCode)) {
      setValidationError('Invalid invite code format. Expected: XXXXX-XXXXX');
      return;
    }

    if (!user?.id) {
      setValidationError('You must be logged in to join a household');
      return;
    }

    // Send join request
    await joinHousehold(user.id, inviteCode);

    // Check if request was successful
    const currentError = useHouseholdStore.getState().error;
    if (!currentError) {
      setShowSuccess(true);
    } else {
      Alert.alert('Error', currentError.message);
    }
  };

  const handleContinue = () => {
    navigation.navigate('Dashboard');
  };

  // Success State
  if (showSuccess) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Success Icon */}
          <View style={styles.successIcon}>
            <Text style={styles.successEmoji}>✓</Text>
          </View>

          {/* Success Message */}
          <Text style={styles.successTitle}>Request Sent! 🎉</Text>
          <Text style={styles.successSubtitle}>
            Your request to join the household has been sent to the household leader for approval.
          </Text>

          {/* Info Box */}
          <Card padding="lg" style={styles.infoBox}>
            <Text style={styles.infoTitle}>What happens next?</Text>
            <View style={styles.infoList}>
              <View style={styles.infoItem}>
                <Text style={styles.infoCheck}>•</Text>
                <Text style={styles.infoText}>
                  The household leader will review your request
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoCheck}>•</Text>
                <Text style={styles.infoText}>
                  You'll be notified when they approve or reject it
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoCheck}>•</Text>
                <Text style={styles.infoText}>
                  Once approved, you can start tracking pet care with your family
                </Text>
              </View>
            </View>
          </Card>

          {/* Continue Button */}
          <Button
            variant="primary"
            size="lg"
            onPress={handleContinue}
            style={styles.continueButton}
            testID="continue-button"
          >
            Go to Dashboard
          </Button>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Form State
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.headerIcon}>
            <Text style={styles.headerEmoji}>👥</Text>
          </View>

          <Text style={styles.title}>Join a Household</Text>
          <Text style={styles.subtitle}>
            Enter the invite code provided by your household leader to send a join request.
          </Text>

          {/* Form */}
          <Card padding="lg" style={styles.formCard}>
            {/* Invite Code Input */}
            <Input
              label="Invite Code"
              value={inviteCode}
              onChangeText={handleInviteCodeChange}
              placeholder="XXXXX-XXXXX"
              maxLength={11} // 5 + hyphen + 5
              autoCapitalize="characters"
              autoCorrect={false}
              error={validationError}
              editable={!loading}
              style={styles.inviteCodeInput}
              required
              testID="invite-code-input"
            />
            <Text style={styles.helperText}>
              Ask your household leader for the invite code
            </Text>

            {/* QR Scanner Button */}
            <Button
              variant="outline"
              size="md"
              onPress={handleScanQR}
              disabled={loading}
              style={styles.qrButton}
              testID="scan-qr-button"
            >
              📷 Scan QR Code
            </Button>

            {/* Info Box */}
            <View style={styles.formInfoBox}>
              <Text style={styles.formInfoTitle}>About joining households</Text>
              <View style={styles.formInfoList}>
                <View style={styles.formInfoItem}>
                  <Text style={styles.formInfoCheck}>•</Text>
                  <Text style={styles.formInfoText}>
                    Invite codes are valid for 7 days by default
                  </Text>
                </View>
                <View style={styles.formInfoItem}>
                  <Text style={styles.formInfoCheck}>•</Text>
                  <Text style={styles.formInfoText}>
                    The household leader must approve your request
                  </Text>
                </View>
                <View style={styles.formInfoItem}>
                  <Text style={styles.formInfoCheck}>•</Text>
                  <Text style={styles.formInfoText}>
                    You can only be part of one household at a time
                  </Text>
                </View>
                <View style={styles.formInfoItem}>
                  <Text style={styles.formInfoCheck}>•</Text>
                  <Text style={styles.formInfoText}>
                    You can leave a household at any time
                  </Text>
                </View>
              </View>
            </View>

            {/* Join Button */}
            <Button
              variant="primary"
              size="lg"
              onPress={handleJoin}
              isLoading={loading}
              disabled={loading || !inviteCode.trim()}
              style={styles.joinButton}
              testID="join-button"
            >
              {loading ? 'Sending Request...' : 'Send Join Request'}
            </Button>

            {/* Cancel Button */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.cancelButton}
              disabled={loading}
              testID="cancel-button"
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  headerIcon: {
    width: 64,
    height: 64,
    backgroundColor: '#FF9F40',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerEmoji: {
    fontSize: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  formCard: {
    marginBottom: 24,
  },
  inviteCodeInput: {
    textAlign: 'center',
    fontSize: 20,
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  helperText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: -12,
    marginBottom: 16,
  },
  qrButton: {
    marginBottom: 20,
    minHeight: 48,
  },
  formInfoBox: {
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  formInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 8,
  },
  formInfoList: {
    gap: 6,
  },
  formInfoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  formInfoCheck: {
    fontSize: 14,
    color: '#059669',
    marginRight: 8,
  },
  formInfoText: {
    fontSize: 13,
    color: '#047857',
    flex: 1,
    lineHeight: 18,
  },
  joinButton: {
    minHeight: 48,
    marginBottom: 12,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 44,
  },
  cancelText: {
    fontSize: 15,
    color: '#6B7280',
    textDecorationLine: 'underline',
  },
  // Success State Styles
  successIcon: {
    width: 80,
    height: 80,
    backgroundColor: '#10B981',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  successEmoji: {
    fontSize: 40,
    color: '#FFFFFF',
  },
  successTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  infoBox: {
    backgroundColor: '#DBEAFE',
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 12,
  },
  infoList: {
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoCheck: {
    fontSize: 16,
    color: '#1E40AF',
    marginRight: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1E40AF',
    flex: 1,
    lineHeight: 20,
  },
  continueButton: {
    minHeight: 48,
  },
});
