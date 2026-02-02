/**
 * QRCodeScanner Component
 *
 * Camera-based QR code scanner for joining households via QR code.
 *
 * Features:
 * - Camera permission handling
 * - QR code detection
 * - Deep link parsing
 * - UI overlay with instructions
 * - Error handling
 * - Auto-focus and scanning indicator
 *
 * Dependencies:
 * - expo-camera (v14+)
 *
 * Install: npx expo install expo-camera
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';

export interface QRCodeScannerProps {
  onCodeScanned?: (code: string) => void;
  onClose?: () => void;
}

/**
 * QR code scanner for household invites
 *
 * @example
 * ```tsx
 * <QRCodeScanner
 *   onCodeScanned={(code) => navigation.navigate('JoinHousehold', { code })}
 *   onClose={() => navigation.goBack()}
 * />
 * ```
 */
export function QRCodeScanner({ onCodeScanned, onClose }: QRCodeScannerProps) {
  const navigation = useNavigation();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');

      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Please grant camera permission to scan QR codes.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Camera.requestCameraPermissionsAsync() },
          ]
        );
      }
    } catch (error) {
      console.error('Failed to request camera permission', error);
      setHasPermission(false);
    }
  };

  const handleBarCodeScanned = ({ type, data }: any) => {
    if (scanned || processing) return;

    setScanned(true);
    setProcessing(true);

    try {
      // Parse QR code data
      // Expected formats:
      // - petforce://household/join?code=XXXX-XXXX-XXXX
      // - https://petforce.app/household/join?code=XXXX-XXXX-XXXX
      // - XXXX-XXXX-XXXX (direct code)

      let inviteCode: string | null = null;

      if (data.includes('://')) {
        // Deep link format
        try {
          const url = new URL(data);
          inviteCode = url.searchParams.get('code');
        } catch (err) {
          console.error('Failed to parse deep link', err);
        }
      } else if (data.match(/^[A-Z0-9]{4,6}-[A-Z0-9]{4,6}-[A-Z0-9]{4,6}$/)) {
        // Direct code format
        inviteCode = data;
      }

      if (inviteCode) {
        // Valid invite code found
        onCodeScanned?.(inviteCode);

        Alert.alert(
          'QR Code Scanned',
          `Invite code: ${inviteCode}`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                setScanned(false);
                setProcessing(false);
              },
            },
            {
              text: 'Join Household',
              onPress: () => {
                onClose?.();
                // Code is passed to parent via onCodeScanned
              },
            },
          ]
        );
      } else {
        // Invalid QR code
        Alert.alert(
          'Invalid QR Code',
          'This QR code does not contain a valid household invite code.',
          [
            {
              text: 'Try Again',
              onPress: () => {
                setScanned(false);
                setProcessing(false);
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error processing QR code', error);
      Alert.alert(
        'Error',
        'Failed to process QR code. Please try again.',
        [
          {
            text: 'OK',
            onPress: () => {
              setScanned(false);
              setProcessing(false);
            },
          },
        ]
      );
    }
  };

  // Permission loading state
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2D9B87" />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  // Permission denied
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Camera permission denied</Text>
        <Text style={styles.errorSubtext}>
          Please grant camera permission in your device settings to scan QR codes.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={requestCameraPermission}
        >
          <Text style={styles.buttonText}>Request Permission</Text>
        </TouchableOpacity>
        {onClose && (
          <TouchableOpacity
            style={[styles.button, styles.buttonOutline]}
            onPress={onClose}
          >
            <Text style={[styles.buttonText, styles.buttonTextOutline]}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Camera view
  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        {/* Overlay */}
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerText}>Scan QR Code</Text>
            <Text style={styles.headerSubtext}>
              Point your camera at a household invite QR code
            </Text>
          </View>

          {/* Scanning frame */}
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            {processing && (
              <ActivityIndicator size="small" color="#FFF" style={styles.processingIndicator} />
            )}
            {onClose && (
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                testID="close-button"
              >
                <Text style={styles.closeButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  header: {
    padding: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  headerSubtext: {
    fontSize: 14,
    color: '#E5E7EB',
    textAlign: 'center',
  },
  scanFrame: {
    alignSelf: 'center',
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#2D9B87',
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  footer: {
    padding: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
  },
  processingIndicator: {
    marginBottom: 16,
  },
  closeButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#EF4444',
    borderRadius: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  loadingText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#2D9B87',
    borderRadius: 8,
    marginTop: 8,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2D9B87',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  buttonTextOutline: {
    color: '#2D9B87',
  },
});
