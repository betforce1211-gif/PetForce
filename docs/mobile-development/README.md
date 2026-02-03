# PetForce Mobile Development Guide

Comprehensive guide to building production-quality mobile applications for PetForce using React Native and Expo.

## Maya's Mobile Development Philosophy

**Core Principles:**

1. **Offline-First** - Apps should work without internet; sync when available
2. **Platform Conventions** - Respect iOS and Android design patterns
3. **Performance Matters** - 60fps or users notice; every frame counts
4. **Small Screens, Big Impact** - Mobile is 60-80% of traffic; design accordingly
5. **Touch-Optimized** - 44pt minimum touch targets; gestures feel natural
6. **Battery Conscious** - Optimize background tasks; users notice battery drain
7. **Network Aware** - Adapt to connection quality; don't assume fast wifi

---

## Quick Start

### Creating a New Screen

```tsx
// apps/mobile/src/screens/PetProfileScreen.tsx
import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface PetProfileScreenProps {
  route: {
    params: {
      petId: string;
    };
  };
  navigation: any;
}

export function PetProfileScreen({ route, navigation }: PetProfileScreenProps) {
  const { petId } = route.params;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Pet Profile</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text>Pet ID: {petId}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#111827",
  },
  content: {
    padding: 16,
  },
});
```

---

## Documentation Structure

### Core Guidelines

1. [**React Native Fundamentals**](#react-native-fundamentals) - Components, styling, navigation
2. [**Expo Setup**](#expo-setup) - Configuration and managed workflow
3. [**Platform-Specific Code**](#platform-specific-code) - iOS vs Android differences
4. [**Offline-First Architecture**](#offline-first-architecture) - Local storage and sync
5. [**Performance Optimization**](#performance-optimization) - 60fps rendering
6. [**Touch & Gestures**](#touch-gestures) - Tap, swipe, long-press
7. [**Native Modules**](#native-modules) - Biometrics, camera, push notifications
8. [**Testing**](#testing) - Unit, integration, E2E tests
9. [**App Store Deployment**](#app-store-deployment) - Release process
10. [**Monitoring**](#monitoring) - Crash reporting and analytics

---

## React Native Fundamentals

### Core Components

```tsx
// View - Container (like <div>)
<View style={{ flex: 1, padding: 16 }}>
  {/* Text - All text must be in <Text> */}
  <Text style={{ fontSize: 16, color: "#111827" }}>Hello PetForce</Text>

  {/* Image */}
  <Image
    source={{ uri: "https://example.com/pet.jpg" }}
    style={{ width: 100, height: 100, borderRadius: 8 }}
  />

  {/* ScrollView - Scrollable container */}
  <ScrollView>
    <Text>Long content...</Text>
  </ScrollView>

  {/* TouchableOpacity - Tappable with fade */}
  <TouchableOpacity
    onPress={() => console.log("Tapped!")}
    style={{ padding: 16, backgroundColor: "#2D9B87", borderRadius: 8 }}
  >
    <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>Tap Me</Text>
  </TouchableOpacity>

  {/* FlatList - Performant list */}
  <FlatList
    data={pets}
    keyExtractor={(item) => item.id}
    renderItem={({ item }) => <PetCard pet={item} />}
  />
</View>
```

### StyleSheet

```tsx
// Always use StyleSheet.create for performance
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  card: {
    padding: 16,
    margin: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    // Shadow on iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Elevation on Android
    elevation: 3,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: "#111827",
  },
});
```

---

## Expo Setup

### Configuration (app.json)

```json
{
  "expo": {
    "name": "PetForce",
    "slug": "petforce",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#2D9B87"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.petforce.app",
      "buildNumber": "1.0.0"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#2D9B87"
      },
      "package": "com.petforce.app",
      "versionCode": 1
    },
    "plugins": [
      [
        "expo-local-authentication",
        {
          "faceIDPermission": "Allow PetForce to use Face ID for quick sign-in"
        }
      ]
    ]
  }
}
```

---

## Platform-Specific Code

### Conditional Rendering

```tsx
import { Platform } from "react-native";

// Check platform
if (Platform.OS === "ios") {
  // iOS-specific code
} else if (Platform.OS === "android") {
  // Android-specific code
}

// Platform.select
const styles = StyleSheet.create({
  container: {
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
});

// Platform-specific files
// Button.ios.tsx
// Button.android.tsx
// Import as: import { Button } from './Button';
```

### Platform Conventions

**iOS:**

- Navigation bar at top (44pt height)
- Tab bar at bottom (49pt height)
- Swipe from left edge to go back
- Modal sheets slide up from bottom
- Pull-to-refresh in scroll views
- Haptic feedback on actions

**Android:**

- App bar at top (56dp height)
- Bottom navigation (56dp height)
- Hardware back button
- FAB (Floating Action Button) for primary action
- Material Design ripple effect
- Snackbar for notifications

---

## Offline-First Architecture

### AsyncStorage

```tsx
import AsyncStorage from "@react-native-async-storage/async-storage";

// Save data
await AsyncStorage.setItem("user_id", user.id);

// Save JSON
await AsyncStorage.setItem("user", JSON.stringify(user));

// Get data
const userId = await AsyncStorage.getItem("user_id");

// Get JSON
const userJson = await AsyncStorage.getItem("user");
const user = userJson ? JSON.parse(userJson) : null;

// Remove
await AsyncStorage.removeItem("user_id");

// Clear all
await AsyncStorage.clear();
```

### Offline-First Pattern

```tsx
// 1. Check local cache first
const getCachedPets = async () => {
  try {
    const cached = await AsyncStorage.getItem("pets");
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
};

// 2. Fetch from network in background
const fetchPets = async () => {
  try {
    const response = await fetch("/api/v1/pets");
    const { data } = await response.json();

    // Update cache
    await AsyncStorage.setItem("pets", JSON.stringify(data));

    return data;
  } catch (error) {
    // Network error - return cached data
    return getCachedPets();
  }
};

// 3. Use optimistic updates
const addPet = async (pet: Pet) => {
  // Add to local state immediately
  setPets((prev) => [...prev, { ...pet, id: `temp_${Date.now()}` }]);

  try {
    // Sync to server
    const response = await fetch("/api/v1/pets", {
      method: "POST",
      body: JSON.stringify(pet),
    });
    const { data } = await response.json();

    // Replace temp ID with real ID
    setPets((prev) => prev.map((p) => (p.id.startsWith("temp_") ? data : p)));
  } catch (error) {
    // Queue for retry when online
    await queueForRetry("addPet", pet);
  }
};
```

---

## Performance Optimization

### FlatList Best Practices

```tsx
<FlatList
  data={pets}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <PetCard pet={item} />}
  // Performance optimizations
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  initialNumToRender={10}
  windowSize={5}
  // Avoid inline functions
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

### Memoization

```tsx
import React, { memo, useMemo, useCallback } from "react";

// Memo component (only re-renders if props change)
const PetCard = memo(({ pet, onPress }) => {
  return (
    <TouchableOpacity onPress={() => onPress(pet.id)}>
      <Text>{pet.name}</Text>
    </TouchableOpacity>
  );
});

// useMemo (cache expensive calculations)
const filteredPets = useMemo(() => {
  return pets.filter((p) => p.type === selectedType);
}, [pets, selectedType]);

// useCallback (cache function references)
const handlePress = useCallback(
  (petId: string) => {
    navigation.navigate("PetProfile", { petId });
  },
  [navigation],
);
```

### Image Optimization

```tsx
// Use cached images
import FastImage from 'react-native-fast-image';

<FastImage
  source={{
    uri: pet.photoUrl,
    priority: FastImage.priority.normal,
  }}
  style={{ width: 100, height: 100 }}
  resizeMode={FastImage.resizeMode.cover}
/>

// Placeholder while loading
<FastImage
  source={{ uri: pet.photoUrl }}
  defaultSource={require('./placeholder.png')}
/>
```

---

## Touch & Gestures

### Touch Targets

```tsx
// Minimum 44pt × 44pt touch target
<TouchableOpacity
  style={styles.button}
  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // Extend hit area
>
  <Text>Tap Me</Text>
</TouchableOpacity>;

const styles = StyleSheet.create({
  button: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },
});
```

### Swipe Gestures

```tsx
import {
  PanGestureHandler,
  GestureHandlerRootView,
} from "react-native-gesture-handler";

<GestureHandlerRootView>
  <PanGestureHandler
    onGestureEvent={handleGesture}
    onHandlerStateChange={handleStateChange}
  >
    <View>
      <Text>Swipe me</Text>
    </View>
  </PanGestureHandler>
</GestureHandlerRootView>;
```

---

## Native Modules

### Biometric Authentication

```tsx
import * as LocalAuthentication from "expo-local-authentication";

// Check if biometrics available
const isBiometricAvailable = async () => {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();

  return compatible && enrolled;
};

// Authenticate
const authenticate = async () => {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Sign in to PetForce",
      fallbackLabel: "Use password instead",
    });

    if (result.success) {
      console.log("Authenticated!");
    }
  } catch (error) {
    console.error("Biometric auth failed:", error);
  }
};
```

### Push Notifications

```tsx
import * as Notifications from "expo-notifications";

// Request permission
const requestPermission = async () => {
  const { status } = await Notifications.requestPermissionsAsync();

  if (status !== "granted") {
    console.log("Permission denied");
    return;
  }

  // Get push token
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  console.log("Push token:", token);
};

// Handle notification received
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Listen for notifications
useEffect(() => {
  const subscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log("Notification received:", notification);
    },
  );

  return () => subscription.remove();
}, []);
```

---

## Testing

### Component Tests

```tsx
import { render, fireEvent } from "@testing-library/react-native";
import { PetCard } from "./PetCard";

describe("PetCard", () => {
  it("renders pet name", () => {
    const pet = { id: "1", name: "Fluffy", type: "cat" };
    const { getByText } = render(<PetCard pet={pet} />);

    expect(getByText("Fluffy")).toBeTruthy();
  });

  it("calls onPress when tapped", () => {
    const pet = { id: "1", name: "Fluffy", type: "cat" };
    const onPress = jest.fn();
    const { getByText } = render(<PetCard pet={pet} onPress={onPress} />);

    fireEvent.press(getByText("Fluffy"));

    expect(onPress).toHaveBeenCalledWith("1");
  });
});
```

---

## App Store Deployment

### iOS (TestFlight & App Store)

```bash
# 1. Build for iOS
expo build:ios

# 2. Upload to App Store Connect
# - Use Application Loader or Xcode
# - Submit for TestFlight review
# - Distribute to testers

# 3. Submit for App Store review
# - Provide screenshots (5.5", 6.5")
# - App description
# - Privacy policy
# - Review notes
```

### Android (Google Play)

```bash
# 1. Build for Android
expo build:android

# 2. Upload to Google Play Console
# - Create app listing
# - Upload APK/AAB
# - Set up store listing
# - Screenshots (phone, tablet)

# 3. Submit for review
# - Internal testing track
# - Closed alpha/beta
# - Production release
```

---

## Monitoring

### Crash Reporting

```tsx
import * as Sentry from "@sentry/react-native";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});

// Capture errors
try {
  await fetchPets();
} catch (error) {
  Sentry.captureException(error);
}
```

### Analytics

```tsx
import * as Analytics from "expo-firebase-analytics";

// Log screen view
Analytics.logEvent("screen_view", {
  screen_name: "PetProfile",
  screen_class: "PetProfileScreen",
});

// Log event
Analytics.logEvent("pet_added", {
  pet_type: "cat",
  source: "manual",
});
```

---

## Best Practices Checklist

Before shipping mobile features:

### Design

- [ ] 44pt minimum touch targets
- [ ] Works in portrait and landscape
- [ ] Safe area insets respected (notch, home indicator)
- [ ] Dark mode support
- [ ] Platform-specific conventions followed

### Performance

- [ ] FlatList for long lists (not ScrollView)
- [ ] Images optimized and cached
- [ ] Memoization used for expensive renders
- [ ] 60fps scrolling (use flipper-plugin-react-native-performance)
- [ ] App size < 50MB

### Offline

- [ ] Works without internet
- [ ] Data cached locally
- [ ] Optimistic updates
- [ ] Sync queue for failed requests
- [ ] Network status indicator

### Accessibility

- [ ] Screen reader tested
- [ ] Sufficient color contrast
- [ ] Text scales with accessibility settings
- [ ] Touchable elements have accessible labels

### Testing

- [ ] Unit tests for components
- [ ] Integration tests for flows
- [ ] Tested on real iOS device
- [ ] Tested on real Android device
- [ ] Tested on different screen sizes

---

## Tools & Resources

### Development Tools

- **Expo** - React Native framework
- **React Navigation** - Routing and navigation
- **Expo Dev Client** - Custom native code
- **Flipper** - Debugging (network, layout, performance)

### State Management

- **Zustand** - Simple state management (recommended)
- **Redux** - Complex state (if needed)
- **React Query** - Server state

### UI Libraries

- **React Native Paper** - Material Design
- **React Native Elements** - Cross-platform components
- **NativeBase** - Accessible components

### Testing

- **Jest** - Unit tests
- **React Native Testing Library** - Component tests
- **Detox** - E2E tests

---

## Related Documentation

- [Advanced Mobile Patterns](./advanced-patterns.md) - Production patterns and war stories
- [Design System](../design/README.md) - UI components and styling
- [API Documentation](../API.md) - Backend integration

---

Built with ❤️ by Maya (Mobile Development Agent)

**Mobile users are your majority. Design for the small screen first.**
