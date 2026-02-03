# Household Features - Mobile Implementation

## Overview

Complete mobile implementation of household management features for React Native/Expo.

**Maya's Mobile-First Philosophy:**
- Touch-first UX with 44pt minimum touch targets
- Offline-first with AsyncStorage caching
- Deep link support for seamless joining
- Push notifications for real-time updates
- QR code scanning and generation
- Platform-specific optimizations (iOS/Android)

---

## Features Implemented

### ✅ 1. QR Code Scanner (`QRCodeScanner.tsx`)

**Status**: Complete

Camera-based QR code scanner for joining households via QR code.

**Features:**
- Camera permission handling with native prompts
- QR code detection using expo-camera
- Deep link parsing (petforce:// and https://)
- Direct invite code parsing (XXXX-XXXX-XXXX format)
- Visual scanning frame with corner indicators
- Processing state and error handling
- Cancel button for easy exit

**Dependencies:**
```bash
npx expo install expo-camera
```

**Usage:**
```tsx
<QRCodeScanner
  onCodeScanned={(code) => navigation.navigate('JoinHousehold', { code })}
  onClose={() => navigation.goBack()}
/>
```

**Supported QR Formats:**
- `petforce://household/join?code=XXXX-XXXX-XXXX&name=Household+Name`
- `https://petforce.app/household/join?code=XXXX-XXXX-XXXX`
- `XXXX-XXXX-XXXX` (direct code)

---

### ✅ 2. QR Code Display (`InviteCodeDisplay.tsx`)

**Status**: Complete

Component for displaying and sharing household invite codes with QR generation.

**Features:**
- QR code generation with PetForce branding
- Deep link encoding for seamless scanning
- Copy to clipboard
- Native share sheet integration
- Save QR code to photo library
- Expand/collapse QR view
- Permission handling for photos

**Dependencies:**
```bash
npx expo install react-native-qrcode-svg react-native-svg expo-sharing expo-media-library expo-file-system
```

**Usage:**
```tsx
<InviteCodeDisplay
  inviteCode="ZEDER-ALPHA-KILO"
  householdName="The Zeder House"
  expiresAt="2026-03-01T00:00:00Z"
/>
```

**Features:**
- PetForce logo embedded in QR code center
- Household name displayed below QR
- Expiration date warning
- Share via SMS, email, messaging apps
- Save to "PetForce" album in photos

---

### ✅ 3. Deep Link Handling (`utils/deepLinks.ts`)

**Status**: Complete

Comprehensive deep link handling for household invites and navigation.

**Supported URL Schemes:**
- Custom: `petforce://`
- Universal Links: `https://petforce.app/`
- App Links: `https://app.petforce.com/`

**Deep Link Types:**
```typescript
// Join household
petforce://household/join?code=XXXX-XXXX-XXXX&name=Household+Name

// Create household
petforce://household/create

// Auth callbacks
petforce://auth?action=oauth_callback&provider=google
petforce://auth?action=magic_link&token=xxx
```

**Setup:**
```tsx
import { setupDeepLinkListener } from './utils/deepLinks';

// In App.tsx or RootNavigator
useEffect(() => {
  const cleanup = setupDeepLinkListener(navigationRef);
  return cleanup;
}, []);
```

**Manual Handling:**
```tsx
import { handleDeepLink } from './utils/deepLinks';

Linking.getInitialURL().then((url) => {
  if (url) {
    handleDeepLink(url, navigationRef);
  }
});
```

**Configuration:**

`app.json`:
```json
{
  "expo": {
    "scheme": "petforce",
    "ios": {
      "associatedDomains": [
        "applinks:petforce.app",
        "applinks:app.petforce.com"
      ]
    },
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "https",
              "host": "petforce.app"
            },
            {
              "scheme": "https",
              "host": "app.petforce.com"
            }
          ]
        }
      ]
    }
  }
}
```

---

### ✅ 4. Push Notifications (`utils/pushNotifications.ts`)

**Status**: Complete

Push notification system for household events.

**Notification Types:**
- `household_join_request` - New join request (leader)
- `household_join_approved` - Request approved (requester)
- `household_join_rejected` - Request rejected (requester)
- `household_member_added` - New member joined (all)
- `household_member_removed` - Member removed (all)
- `household_leadership_transferred` - Leadership changed (all)

**Features:**
- Expo push token registration
- Permission handling (iOS/Android)
- Foreground notification display
- Tap-to-navigate functionality
- Android notification channels
- Local notification testing

**Dependencies:**
```bash
npx expo install expo-notifications expo-device
```

**Setup:**
```tsx
import {
  registerForPushNotifications,
  setupNotificationListeners
} from './utils/pushNotifications';

// Register on app launch
useEffect(() => {
  registerForPushNotifications().then((token) => {
    if (token) {
      // Send token to backend
      console.log('Push token:', token);
    }
  });

  const cleanup = setupNotificationListeners(navigationRef);
  return cleanup;
}, []);
```

**Testing:**
```tsx
import { scheduleLocalNotification } from './utils/pushNotifications';

// Test notification
scheduleLocalNotification(
  'New Join Request',
  'John Doe wants to join your household',
  {
    type: 'household_join_request',
    householdId: 'household-123',
    requestId: 'request-456',
  }
);
```

**Backend Integration:**

Send notifications from backend using Expo Push API:
```typescript
// Node.js example
const { Expo } = require('expo-server-sdk');
const expo = new Expo();

const messages = [{
  to: pushToken,
  sound: 'default',
  title: 'New Join Request',
  body: 'John Doe wants to join your household',
  data: {
    type: 'household_join_request',
    householdId: 'household-123',
    requestId: 'request-456',
  },
  channelId: 'household',
  priority: 'high',
}];

const chunks = expo.chunkPushNotifications(messages);
const tickets = await expo.sendPushNotificationsAsync(chunks[0]);
```

---

### ✅ 5. Offline Support (`utils/offlineStorage.ts`)

**Status**: Complete

Offline-first caching for household data using AsyncStorage.

**Cached Data:**
- Household information
- Member list
- Pending join requests
- User role
- Last sync timestamp

**Features:**
- 5-minute cache duration
- Automatic cache invalidation
- Offline-first data access
- Cache validity checking
- Cache statistics

**Dependencies:**
```bash
npx expo install @react-native-async-storage/async-storage
```

**Usage:**
```tsx
import {
  cacheHousehold,
  getCachedHousehold,
  cacheMembers,
  getCachedMembers,
} from './utils/offlineStorage';

// Cache data after API fetch
const fetchHousehold = async () => {
  try {
    // Try to fetch from API
    const response = await getHouseholdAPI(householdId);

    if (response.success) {
      // Cache fresh data
      await cacheHousehold(response.household);
      await cacheMembers(response.members);
      return response;
    }
  } catch (error) {
    // Fall back to cache when offline
    const cachedHousehold = await getCachedHousehold(false);
    const cachedMembers = await getCachedMembers(false);

    if (cachedHousehold) {
      return {
        success: true,
        household: cachedHousehold,
        members: cachedMembers,
        fromCache: true,
      };
    }

    throw error;
  }
};
```

**Cache Strategy:**
1. Always try to fetch fresh data from API when online
2. Cache successful API responses
3. Fall back to cache when offline or API fails
4. Display cache age to user
5. Auto-refresh on app foreground

**Cache Management:**
```tsx
import {
  clearHouseholdCache,
  getCacheStats,
  getLastSyncTime,
} from './utils/offlineStorage';

// Clear cache on logout
await clearHouseholdCache();

// Show cache stats
const stats = await getCacheStats();
console.log('Cache stats:', stats);
// {
//   hasHousehold: true,
//   memberCount: 5,
//   pendingRequestCount: 2,
//   lastSync: 1706802345678,
//   isValid: true,
// }
```

---

## Installation

### 1. Install Dependencies

```bash
# Core dependencies
npx expo install expo-camera expo-notifications expo-device

# QR and sharing
npx expo install react-native-qrcode-svg react-native-svg expo-sharing expo-media-library expo-file-system

# Storage
npx expo install @react-native-async-storage/async-storage

# Clipboard
npm install @react-native-clipboard/clipboard
```

### 2. Configure app.json

```json
{
  "expo": {
    "name": "PetForce",
    "slug": "petforce",
    "scheme": "petforce",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "plugins": [
      [
        "expo-camera",
        {
          "cameraPermission": "Allow PetForce to scan QR codes to join households"
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#2D9B87",
          "sounds": ["./assets/notification.wav"]
        }
      ],
      [
        "expo-media-library",
        {
          "photosPermission": "Allow PetForce to save QR codes to your photos",
          "savePhotosPermission": "Allow PetForce to save QR codes to your photos"
        }
      ]
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.petforce.app",
      "associatedDomains": [
        "applinks:petforce.app",
        "applinks:app.petforce.com"
      ],
      "infoPlist": {
        "NSCameraUsageDescription": "PetForce needs camera access to scan QR codes for joining households",
        "NSPhotoLibraryUsageDescription": "PetForce needs photo library access to save QR codes",
        "NSPhotoLibraryAddUsageDescription": "PetForce needs permission to save QR codes to your photos"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#2D9B87"
      },
      "package": "com.petforce.app",
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ],
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

### 3. Set up Deep Links and Notifications

**App.tsx or RootNavigator.tsx:**
```tsx
import { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { setupDeepLinkListener } from './utils/deepLinks';
import {
  registerForPushNotifications,
  setupNotificationListeners
} from './utils/pushNotifications';

export default function App() {
  const navigationRef = useRef(null);

  useEffect(() => {
    // Register for push notifications
    registerForPushNotifications().then((token) => {
      if (token) {
        // TODO: Send token to backend
        console.log('Push token:', token);
      }
    });

    // Set up deep link handling
    const cleanupDeepLinks = setupDeepLinkListener(navigationRef.current);

    // Set up push notification handling
    const cleanupNotifications = setupNotificationListeners(navigationRef.current);

    return () => {
      cleanupDeepLinks();
      cleanupNotifications();
    };
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      {/* Your navigation */}
    </NavigationContainer>
  );
}
```

---

## Testing

### QR Code Scanning

1. Generate a test QR code at https://qrcode.tec-it.com/en
2. Use value: `petforce://household/join?code=TEST-CODE-HERE&name=Test+Household`
3. Open scanner in app
4. Scan QR code
5. Verify navigation to JoinHousehold screen with pre-filled code

### Deep Links

```bash
# iOS Simulator
xcrun simctl openurl booted "petforce://household/join?code=TEST-CODE&name=Test"

# Android Emulator
adb shell am start -W -a android.intent.action.VIEW -d "petforce://household/join?code=TEST-CODE&name=Test" com.petforce.app
```

### Push Notifications

```tsx
// In your app
import { scheduleLocalNotification } from './utils/pushNotifications';

scheduleLocalNotification(
  'Test Notification',
  'This is a test',
  { type: 'household_join_request', householdId: 'test-123' }
);
```

---

## Performance Optimizations

### FlatList Virtualization

For rendering member lists and pending requests:

```tsx
<FlatList
  data={members}
  renderItem={({ item }) => <MemberCard member={item} />}
  keyExtractor={(item) => item.id}
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={5}
  removeClippedSubviews={true}
  getItemLayout={(data, index) => ({
    length: 80, // Height of MemberCard
    offset: 80 * index,
    index,
  })}
/>
```

### Image Caching

Use expo-image for QR codes and avatars:
```tsx
import { Image } from 'expo-image';

<Image
  source={{ uri: qrCodeDataUrl }}
  cachePolicy="memory-disk"
  placeholder={blurhash}
  contentFit="contain"
  transition={200}
/>
```

### Network Optimization

Batch API calls and cache aggressively:
```tsx
// Use React Query or SWR for caching
import { useQuery } from '@tanstack/react-query';

const { data, isLoading } = useQuery({
  queryKey: ['household', householdId],
  queryFn: () => getHousehold(householdId),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  retry: 3,
});
```

---

## Future Enhancements

- [ ] Biometric authentication for household actions
- [ ] Animated QR code scanning indicator
- [ ] Haptic feedback on scan success
- [ ] Dark mode support for all components
- [ ] Widget support (iOS 14+, Android 12+)
- [ ] Apple Watch companion app
- [ ] Android Wear support
- [ ] NFC tag support for pet profiles
- [ ] Voice commands (Siri/Google Assistant)
- [ ] Augmented Reality pet care tracking

---

## Troubleshooting

### Camera Permission Denied

**iOS:**
- Go to Settings > Privacy > Camera > PetForce > Enable
- Restart app

**Android:**
- Go to Settings > Apps > PetForce > Permissions > Camera > Allow
- Restart app

### Deep Links Not Working

**iOS:**
- Verify Associated Domains in Xcode
- Check apple-app-site-association file on server
- Test with `xcrun simctl openurl booted "petforce://..."`

**Android:**
- Verify intent filters in AndroidManifest.xml
- Check Digital Asset Links file on server
- Test with `adb shell am start...`

### Push Notifications Not Received

- Verify Expo push token is sent to backend
- Check notification permissions in device settings
- Ensure app is not in battery optimization mode (Android)
- Verify backend is using correct Expo push API
- Test with local notifications first

### Offline Cache Not Working

- Check AsyncStorage permissions
- Verify cache keys are correct
- Clear cache and retry: `await clearHouseholdCache()`
- Check storage quota (AsyncStorage has 6MB limit on iOS)

---

## Platform-Specific Notes

### iOS

- Requires iOS 12+ for QR scanning
- Push notifications require Apple Developer account
- Associated Domains require paid developer account
- Test on physical device for push notifications

### Android

- Requires Android 5.0+ (API 21+)
- QR scanning works in emulator with webcam
- App Links require domain verification
- Notification channels required for Android 8.0+

---

## Resources

- [Expo Camera Documentation](https://docs.expo.dev/versions/latest/sdk/camera/)
- [Expo Notifications Guide](https://docs.expo.dev/push-notifications/overview/)
- [React Navigation Deep Linking](https://reactnavigation.org/docs/deep-linking/)
- [AsyncStorage Best Practices](https://react-native-async-storage.github.io/async-storage/docs/usage)
- [QR Code Best Practices](https://www.qr-code-generator.com/qr-code-marketing/qr-codes-basics/)

---

**Built with ❤️ by Maya (Mobile Development Agent)**

*Mobile-first thinking for mobile-first users. 60-80% of PetForce users are on mobile - we build for them first.*
