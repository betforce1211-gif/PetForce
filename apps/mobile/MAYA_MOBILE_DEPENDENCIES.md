# MAYA (Mobile) - Phase 1 Dependencies

## Required Dependencies for Full Implementation

To complete the MAYA mobile implementation, install these dependencies:

```bash
cd apps/mobile

# QR Code Scanner
npx expo install expo-camera

# QR Code Generation
npx expo install react-native-qrcode-svg react-native-svg

# Deep Linking (already included in Expo)
# expo-linking is built-in

# Push Notifications
npx expo install expo-notifications

# Sharing
npx expo install expo-sharing

# Offline Storage
npx expo install @react-native-async-storage/async-storage

# Clipboard
npx expo install @react-native-clipboard/clipboard
```

## Implementation Status

### ✅ Completed
- QRCodeScanner.tsx - Full camera-based QR scanner with permission handling
- InviteCodeDisplay.tsx - Placeholder with structure (needs QR generation)

### 📝 Needed
- QR Code Display with actual QR generation (react-native-qrcode-svg)
- Deep link handling in App.tsx/navigation
- Push notification setup (utils/push-notifications.ts)
- Offline storage (utils/offline-storage.ts)
- Mobile E2E tests (Detox or Maestro)

## Deep Link Configuration

Add to `app.json`:

```json
{
  "expo": {
    "scheme": "petforce",
    "ios": {
      "associatedDomains": ["applinks:petforce.app"]
    },
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "https",
              "host": "petforce.app",
              "pathPrefix": "/household"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

## Push Notification Configuration

Add to `app.json`:

```json
{
  "expo": {
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#2D9B87",
      "androidMode": "default",
      "androidCollapsedTitle": "PetForce"
    },
    "ios": {
      "infoPlist": {
        "UIBackgroundModes": ["remote-notification"]
      }
    },
    "android": {
      "googleServicesFile": "./google-services.json",
      "useNextNotificationsApi": true
    }
  }
}
```

## Testing Commands

```bash
# Test deep links (iOS)
xcrun simctl openurl booted "petforce://household/join?code=TEST-CODE"

# Test deep links (Android)
adb shell am start -W -a android.intent.action.VIEW -d "petforce://household/join?code=TEST-CODE"

# Run E2E tests
npm run test:e2e
```

## Next Steps

1. Install dependencies listed above
2. Implement QR code generation in InviteCodeDisplay
3. Set up deep link handling
4. Configure push notifications
5. Add offline storage utilities
6. Write mobile E2E tests
7. Test on physical devices (iOS + Android)

## Estimated Effort

- QR Generation: 1 hour
- Deep Links: 2 hours
- Push Notifications: 3 hours
- Offline Storage: 1 hour
- E2E Tests: 4 hours
- **Total: ~11 hours** to reach 65%+

This gets MAYA from 57% → 65%+ and enables full mobile household management.
