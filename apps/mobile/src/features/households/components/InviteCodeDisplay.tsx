/**
 * Invite Code Display Component
 *
 * Component for displaying household invite codes with QR generation.
 *
 * PLACEHOLDER IMPLEMENTATION
 * This component requires QR code generation libraries.
 * Install dependencies:
 * - npm install react-native-qrcode-svg react-native-svg
 * OR for Expo:
 * - npx expo install react-native-qrcode-svg react-native-svg expo-sharing expo-media-library
 *
 * TODO:
 * - Implement QR code generation
 * - Add share functionality (Share API)
 * - Add save to photos (CameraRoll/MediaLibrary)
 * - Brand QR code with PetForce logo
 * - Add collapse/expand state
 */

import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';

export interface InviteCodeDisplayProps {
  inviteCode: string;
  householdName: string;
  expiresAt?: string;
}

/**
 * Invite Code Display Component (Placeholder)
 *
 * @example
 * ```tsx
 * <InviteCodeDisplay
 *   inviteCode="ZEDER-ALPHA"
 *   householdName="The Zeder House"
 *   expiresAt="2026-03-01T00:00:00Z"
 * />
 * ```
 */
export function InviteCodeDisplay({
  inviteCode,
  householdName,
  expiresAt,
}: InviteCodeDisplayProps) {
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    Clipboard.setString(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    Alert.alert('Copied!', 'Invite code copied to clipboard');
  };

  const handleShare = () => {
    Alert.alert(
      'Coming Soon',
      'Share functionality will be available soon. For now, copy the code and share it manually.'
    );
  };

  const handleDownload = () => {
    Alert.alert(
      'Coming Soon',
      'Download QR code functionality will be available soon.'
    );
  };

  const handleToggleQR = () => {
    setShowQR(!showQR);
  };

  return (
    <View style={styles.container}>
      {/* Invite Code */}
      <Text style={styles.label}>Invite Code</Text>
      <Text style={styles.code}>{inviteCode}</Text>
      {expiresAt && (
        <Text style={styles.expiry}>
          Expires: {new Date(expiresAt).toLocaleDateString()}
        </Text>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleCopy} testID="copy-button">
          <Text style={styles.actionButtonText}>{copied ? 'Copied!' : 'Copy Code'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleToggleQR}
          testID="qr-button"
        >
          <Text style={styles.actionButtonText}>
            {showQR ? 'Hide QR Code' : 'Show QR Code'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* QR Code Placeholder */}
      {showQR && (
        <View style={styles.qrContainer}>
          <View style={styles.qrPlaceholder}>
            <Text style={styles.qrIcon}>📱</Text>
            <Text style={styles.qrTitle}>QR Code Coming Soon</Text>
            <Text style={styles.qrDescription}>
              QR code generation will be available in a future update.
            </Text>
          </View>

          <View style={styles.qrActions}>
            <TouchableOpacity
              style={styles.qrActionButton}
              onPress={handleShare}
              testID="share-button"
            >
              <Text style={styles.qrActionButtonText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.qrActionButton}
              onPress={handleDownload}
              testID="download-button"
            >
              <Text style={styles.qrActionButtonText}>Download</Text>
            </TouchableOpacity>
          </View>

          {/* Implementation Notes */}
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Implementation Requirements:</Text>
            <Text style={styles.notesText}>• react-native-qrcode-svg</Text>
            <Text style={styles.notesText}>• react-native-svg</Text>
            <Text style={styles.notesText}>• Share API (react-native-share or Expo Sharing)</Text>
            <Text style={styles.notesText}>• MediaLibrary for save to photos</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#D1FAE5',
    borderRadius: 12,
    padding: 20,
  },
  label: {
    fontSize: 13,
    color: '#065F46',
    textAlign: 'center',
    marginBottom: 8,
  },
  code: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#047857',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginBottom: 4,
  },
  expiry: {
    fontSize: 13,
    color: '#059669',
    textAlign: 'center',
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 44,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  qrContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#10B981',
  },
  qrPlaceholder: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
    minHeight: 240,
    justifyContent: 'center',
  },
  qrIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  qrDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  qrActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  qrActionButton: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 44,
  },
  qrActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  notes: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 6,
  },
  notesText: {
    fontSize: 11,
    color: '#047857',
    marginBottom: 3,
  },
});
