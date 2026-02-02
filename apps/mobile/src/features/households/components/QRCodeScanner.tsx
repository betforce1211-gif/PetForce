/**
 * QR Code Scanner Component
 *
 * Full-screen QR code scanner for scanning household invite codes.
 *
 * PLACEHOLDER IMPLEMENTATION
 * This component requires camera permissions and react-native-camera or expo-camera.
 * Install dependencies:
 * - npm install react-native-camera
 * OR for Expo:
 * - npx expo install expo-camera
 *
 * TODO:
 * - Implement camera view
 * - Add scanning overlay with corner guides
 * - Request camera permissions
 * - Handle QR code detection
 * - Parse JSON format from QR code
 * - Add flash/torch toggle
 * - Add close button
 */

import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export interface QRCodeScannerProps {
  onCodeScanned: (code: string) => void;
  onClose: () => void;
}

/**
 * QR Code Scanner Component (Placeholder)
 *
 * @example
 * ```tsx
 * <QRCodeScanner
 *   onCodeScanned={(code) => setInviteCode(code)}
 *   onClose={() => navigation.goBack()}
 * />
 * ```
 */
export function QRCodeScanner({ onCodeScanned, onClose }: QRCodeScannerProps) {
  const handleManualEntry = () => {
    Alert.prompt(
      'Enter Invite Code',
      'Manually enter the household invite code:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: (code) => {
            if (code) {
              onCodeScanned(code.toUpperCase());
              onClose();
            }
          },
        },
      ],
      'plain-text'
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Close Button */}
      <TouchableOpacity style={styles.closeButton} onPress={onClose} testID="close-button">
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>

      {/* Placeholder Content */}
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📷</Text>
        </View>
        <Text style={styles.title}>QR Scanner Coming Soon</Text>
        <Text style={styles.description}>
          QR code scanning will be available in a future update. For now, you can manually enter
          the invite code.
        </Text>

        <TouchableOpacity style={styles.manualButton} onPress={handleManualEntry}>
          <Text style={styles.manualButtonText}>Enter Code Manually</Text>
        </TouchableOpacity>
      </View>

      {/* Implementation Notes */}
      <View style={styles.notes}>
        <Text style={styles.notesTitle}>Implementation Requirements:</Text>
        <Text style={styles.notesText}>• Camera permission (iOS/Android)</Text>
        <Text style={styles.notesText}>• react-native-camera or expo-camera</Text>
        <Text style={styles.notesText}>• Barcode detection</Text>
        <Text style={styles.notesText}>• JSON parsing for QR data</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#D1D5DB',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  manualButton: {
    backgroundColor: '#2D9B87',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    minHeight: 48,
  },
  manualButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  notes: {
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
});
