/**
 * Invite Code Display Component
 *
 * Component for displaying household invite codes with QR generation.
 *
 * Features:
 * - QR code generation with branding
 * - Copy to clipboard
 * - Share via system share sheet
 * - Save QR code to photos
 * - Deep link encoding
 * - Expand/collapse QR code view
 *
 * Dependencies:
 * - react-native-qrcode-svg (QR generation)
 * - react-native-svg (SVG support)
 * - expo-sharing (Share functionality)
 * - expo-media-library (Save to photos)
 */

import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  Share as RNShare,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import QRCode from 'react-native-qrcode-svg';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

export interface InviteCodeDisplayProps {
  inviteCode: string;
  householdName: string;
  expiresAt?: string;
}

/**
 * Invite Code Display with QR Code Generation
 *
 * @example
 * ```tsx
 * <InviteCodeDisplay
 *   inviteCode="ZEDER-ALPHA-KILO"
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
  const [saving, setSaving] = useState(false);
  const qrRef = useRef<any>(null);

  // Generate deep link URL for QR code
  const deepLinkURL = `petforce://household/join?code=${inviteCode}&name=${encodeURIComponent(householdName)}`;

  const handleCopy = () => {
    Clipboard.setString(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      const message = `Join ${householdName} on PetForce!\n\nInvite Code: ${inviteCode}\n\nOr scan the QR code to join instantly.`;

      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        await RNShare.share({
          message,
          title: `Join ${householdName}`,
        });
      } else {
        Alert.alert('Share', message);
      }
    } catch (error) {
      console.error('Failed to share', error);
      Alert.alert('Error', 'Failed to share invite code');
    }
  };

  const handleDownload = async () => {
    if (!qrRef.current) {
      Alert.alert('Error', 'QR code not ready. Please try again.');
      return;
    }

    setSaving(true);

    try {
      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant photo library permission to save QR codes.'
        );
        setSaving(false);
        return;
      }

      // Generate QR code as data URL
      qrRef.current.toDataURL(async (dataURL: string) => {
        try {
          // Save to temporary file
          const filename = `${householdName.replace(/\s+/g, '-')}-invite-qr.png`;
          const fileUri = `${FileSystem.cacheDirectory}${filename}`;

          await FileSystem.writeAsStringAsync(fileUri, dataURL, {
            encoding: FileSystem.EncodingType.Base64,
          });

          // Save to media library
          const asset = await MediaLibrary.createAssetAsync(fileUri);
          await MediaLibrary.createAlbumAsync('PetForce', asset, false);

          Alert.alert('Success', 'QR code saved to your photos!');
        } catch (err) {
          console.error('Failed to save QR code', err);
          Alert.alert('Error', 'Failed to save QR code to photos');
        } finally {
          setSaving(false);
        }
      });
    } catch (error) {
      console.error('Failed to download QR code', error);
      Alert.alert('Error', 'Failed to save QR code');
      setSaving(false);
    }
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
          <Text style={styles.actionButtonText}>{copied ? '✓ Copied!' : 'Copy Code'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleToggleQR}
          testID="qr-button"
        >
          <Text style={styles.actionButtonText}>
            {showQR ? 'Hide QR' : 'Show QR'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* QR Code */}
      {showQR && (
        <View style={styles.qrContainer}>
          {/* QR Code with PetForce Branding */}
          <View style={styles.qrWrapper}>
            <View style={styles.qrCodeContainer}>
              <QRCode
                value={deepLinkURL}
                size={200}
                color="#047857"
                backgroundColor="#FFFFFF"
                logo={require('../../../../assets/icon.png')}
                logoSize={40}
                logoBackgroundColor="#FFFFFF"
                logoMargin={2}
                logoBorderRadius={8}
                getRef={(ref) => (qrRef.current = ref)}
              />
            </View>
            <Text style={styles.qrHouseholdName}>{householdName}</Text>
            <Text style={styles.qrInstructions}>
              Scan this QR code with your camera or PetForce app to join
            </Text>
          </View>

          {/* QR Actions */}
          <View style={styles.qrActions}>
            <TouchableOpacity
              style={styles.qrActionButton}
              onPress={handleShare}
              testID="share-button"
            >
              <Text style={styles.qrActionIcon}>📤</Text>
              <Text style={styles.qrActionButtonText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.qrActionButton}
              onPress={handleDownload}
              disabled={saving}
              testID="download-button"
            >
              <Text style={styles.qrActionIcon}>💾</Text>
              <Text style={styles.qrActionButtonText}>
                {saving ? 'Saving...' : 'Save to Photos'}
              </Text>
            </TouchableOpacity>
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
    fontWeight: '600',
    color: '#065F46',
    textAlign: 'center',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  code: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#047857',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: 2,
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
  qrWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  qrCodeContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  qrHouseholdName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  qrInstructions: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  qrActions: {
    flexDirection: 'row',
    gap: 8,
  },
  qrActionButton: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 44,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  qrActionIcon: {
    fontSize: 16,
  },
  qrActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
