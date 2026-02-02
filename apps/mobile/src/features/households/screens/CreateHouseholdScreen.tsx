/**
 * Create Household Screen
 *
 * Form for creating a new household with name and optional description.
 * User becomes the household leader upon creation.
 *
 * Features:
 * - Name input (required, max 100 chars)
 * - Description input (optional, max 500 chars, multiline)
 * - Character count display
 * - Loading state during creation
 * - Success screen showing invite code
 * - Copy code and QR code generation options
 * - Error handling with alerts
 * - KeyboardAvoidingView for iOS keyboard
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
import Clipboard from '@react-native-clipboard/clipboard';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useHouseholdStore } from '@petforce/auth';
import { useAuthStore } from '@petforce/auth';

type CreateHouseholdScreenProps = NativeStackScreenProps<any, 'CreateHousehold'>;

export function CreateHouseholdScreen({ navigation }: CreateHouseholdScreenProps) {
  const { user } = useAuthStore();
  const { household, createHousehold, loading, error, clearError } = useHouseholdStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const MAX_NAME_LENGTH = 100;
  const MAX_DESCRIPTION_LENGTH = 500;

  const handleCreate = async () => {
    setValidationError(null);
    clearError();

    // Validation
    if (!name.trim()) {
      setValidationError('Household name is required');
      return;
    }

    if (name.length > MAX_NAME_LENGTH) {
      setValidationError(`Household name must be ${MAX_NAME_LENGTH} characters or less`);
      return;
    }

    if (description.length > MAX_DESCRIPTION_LENGTH) {
      setValidationError(`Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`);
      return;
    }

    if (!user?.id) {
      setValidationError('You must be logged in to create a household');
      return;
    }

    // Create household
    await createHousehold(user.id, name.trim(), description.trim() || undefined);

    // Check if creation was successful
    const currentError = useHouseholdStore.getState().error;
    if (!currentError) {
      setShowSuccess(true);
    } else {
      Alert.alert('Error', currentError.message);
    }
  };

  const handleCopyCode = () => {
    if (household?.inviteCode) {
      Clipboard.setString(household.inviteCode);
      Alert.alert('Copied!', 'Invite code copied to clipboard');
    }
  };

  const handleContinue = () => {
    navigation.navigate('HouseholdDashboard');
  };

  // Success State
  if (showSuccess && household) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Success Icon */}
          <View style={styles.successIcon}>
            <Text style={styles.successEmoji}>✓</Text>
          </View>

          {/* Success Message */}
          <Text style={styles.successTitle}>Household Created! 🎉</Text>
          <Text style={styles.successSubtitle}>
            Your household "{household.name}" has been created successfully
          </Text>

          {/* Invite Code Display */}
          {household.inviteCode && (
            <Card padding="lg" style={styles.inviteCodeCard}>
              <Text style={styles.inviteCodeLabel}>Your Invite Code</Text>
              <Text style={styles.inviteCode}>{household.inviteCode}</Text>
              {household.inviteCodeExpiresAt && (
                <Text style={styles.inviteCodeExpiry}>
                  Expires: {new Date(household.inviteCodeExpiresAt).toLocaleDateString()}
                </Text>
              )}

              <View style={styles.codeActions}>
                <Button
                  variant="outline"
                  size="md"
                  onPress={handleCopyCode}
                  style={styles.codeButton}
                  testID="copy-code-button"
                >
                  Copy Code
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onPress={() => Alert.alert('Coming Soon', 'QR code generation coming soon!')}
                  style={styles.codeButton}
                  testID="qr-code-button"
                >
                  Show QR Code
                </Button>
              </View>
            </Card>
          )}

          {/* Info Box */}
          <Card padding="lg" style={styles.infoBox}>
            <Text style={styles.infoTitle}>What's Next?</Text>
            <View style={styles.infoList}>
              <View style={styles.infoItem}>
                <Text style={styles.infoCheck}>•</Text>
                <Text style={styles.infoText}>You're now the household leader</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoCheck}>•</Text>
                <Text style={styles.infoText}>
                  Share the invite code with family members
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoCheck}>•</Text>
                <Text style={styles.infoText}>Approve join requests from your dashboard</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoCheck}>•</Text>
                <Text style={styles.infoText}>Start adding pets and tracking care tasks</Text>
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
            Continue to Dashboard
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
            <Text style={styles.headerEmoji}>🏠</Text>
          </View>

          <Text style={styles.title}>Create Your Household</Text>
          <Text style={styles.subtitle}>
            Give your household a name and description. You'll become the household leader.
          </Text>

          {/* Form */}
          <Card padding="lg" style={styles.formCard}>
            {/* Name Input */}
            <Input
              label="Household Name"
              value={name}
              onChangeText={setName}
              placeholder="e.g., The Zeder House, Smith Family Pets"
              maxLength={MAX_NAME_LENGTH}
              error={validationError}
              editable={!loading}
              required
              testID="name-input"
            />
            <View style={styles.charCount}>
              <Text style={styles.charCountText}>
                {name.length}/{MAX_NAME_LENGTH}
              </Text>
            </View>

            {/* Description Input */}
            <Input
              label="Description (Optional)"
              value={description}
              onChangeText={setDescription}
              placeholder="e.g., Our family home with 2 dogs, 3 cats, and 1 bird"
              maxLength={MAX_DESCRIPTION_LENGTH}
              multiline
              numberOfLines={4}
              style={styles.descriptionInput}
              editable={!loading}
              testID="description-input"
            />
            <View style={styles.charCount}>
              <Text style={styles.charCountText}>
                {description.length}/{MAX_DESCRIPTION_LENGTH}
              </Text>
            </View>

            {/* Info Box */}
            <View style={styles.formInfoBox}>
              <Text style={styles.formInfoText}>
                <Text style={styles.formInfoBold}>What happens next?</Text>
                {'\n'}You'll become the household leader and can invite family members using an
                invite code. Everyone can track pet care tasks together.
              </Text>
            </View>

            {/* Create Button */}
            <Button
              variant="primary"
              size="lg"
              onPress={handleCreate}
              isLoading={loading}
              disabled={loading || !name.trim()}
              style={styles.createButton}
              testID="create-button"
            >
              {loading ? 'Creating...' : 'Create Household'}
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
    backgroundColor: '#2D9B87',
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
  charCount: {
    alignItems: 'flex-end',
    marginTop: -12,
    marginBottom: 16,
  },
  charCountText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  descriptionInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  formInfoBox: {
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  formInfoText: {
    fontSize: 14,
    color: '#047857',
    lineHeight: 20,
  },
  formInfoBold: {
    fontWeight: '600',
    color: '#065F46',
  },
  createButton: {
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
  inviteCodeCard: {
    marginBottom: 16,
    alignItems: 'center',
  },
  inviteCodeLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  inviteCode: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2D9B87',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 4,
  },
  inviteCodeExpiry: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  codeActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  codeButton: {
    flex: 1,
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
