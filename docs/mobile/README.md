# PetForce Mobile Development Guide

Comprehensive guide for building world-class mobile experiences on iOS and Android.

## Philosophy

**Maya's Mobile-First Principles:**

1. **Mobile Users Are the Majority** - 60-80% of users are on mobile; optimize accordingly
2. **Offline-First Architecture** - App works seamlessly without connectivity
3. **Platform Conventions Matter** - iOS users expect iOS patterns, Android users expect Material Design
4. **Performance Is UX** - Fast apps feel better; 60fps is the minimum
5. **Touch-Optimized** - Minimum 44pt touch targets, gesture-friendly interactions
6. **Battery Conscious** - Optimize for battery life and data usage
7. **Cross-Platform Efficiency** - Share code where sensible, platform-specific where needed

---

## Quick Start

### For Mobile Developers

**Technology Stack:**

- **Framework:** React Native (0.73+)
- **Language:** TypeScript
- **State Management:** Zustand
- **Navigation:** React Navigation
- **Styling:** StyleSheet + Design Tokens
- **Network:** TanStack Query (React Query)
- **Storage:** AsyncStorage + SQLite
- **Analytics:** @petforce/analytics-mobile

**Setup:**

```bash
# Clone repository
git clone https://github.com/petforce/petforce.git
cd petforce/apps/mobile

# Install dependencies
npm install

# iOS setup
cd ios && pod install && cd ..

# Run iOS
npm run ios

# Run Android
npm run android
```

### For Designers

**Mobile Design Resources:**

- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios)
- [Material Design 3](https://m3.material.io/)
- [PetForce Design System](../design/README.md)
- [Touch Target Guidelines](../design/accessibility.md#touch-targets)

### For Product Managers

**Key Mobile Metrics:**

- Mobile DAU: 60-80% of total DAU
- iOS vs Android split: ~55% iOS, 45% Android (US market)
- Average session: 3.5 minutes (iOS), 3.2 minutes (Android)
- Crash-free rate: Target 99.9%
- App size: Target < 50 MB

---

## Table of Contents

1. [Mobile Architecture](#mobile-architecture)
2. [React Native Best Practices](#react-native-best-practices)
3. [Platform-Specific Guidelines](#platform-specific-guidelines)
4. [Offline-First Architecture](#offline-first-architecture)
5. [Performance Optimization](#performance-optimization)
6. [Mobile UX Patterns](#mobile-ux-patterns)
7. [Navigation](#navigation)
8. [Push Notifications](#push-notifications)
9. [Deep Linking](#deep-linking)
10. [Testing Strategy](#testing-strategy)
11. [App Store Guidelines](#app-store-guidelines)

---

## Mobile Architecture

### App Structure

```
apps/mobile/
├── src/
│   ├── screens/           # Screen components
│   │   ├── auth/          # Authentication screens
│   │   ├── households/    # Household screens
│   │   └── settings/      # Settings screens
│   ├── components/        # Reusable components
│   │   ├── ui/            # UI primitives (Button, Input)
│   │   └── features/      # Feature-specific components
│   ├── navigation/        # Navigation configuration
│   ├── services/          # API clients, analytics
│   ├── stores/            # Zustand state stores
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utilities and helpers
│   ├── config/            # App configuration
│   └── types/             # TypeScript types
├── ios/                   # iOS native code
├── android/               # Android native code
└── __tests__/             # Test files
```

### State Management Philosophy

**Three Layers of State:**

1. **Server State** (TanStack Query)
   - API data
   - Cached responses
   - Optimistic updates
   - Background refetching

2. **Client State** (Zustand)
   - UI state (modals, sheets)
   - User preferences
   - Navigation state
   - Form state

3. **Persistent State** (AsyncStorage + SQLite)
   - Offline queue
   - Cached data
   - User settings
   - Draft content

**Example:**

```typescript
// Server State - TanStack Query
const { data: households, isLoading } = useQuery({
  queryKey: ["households"],
  queryFn: fetchHouseholds,
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// Client State - Zustand
const useUIStore = create((set) => ({
  isCreateModalOpen: false,
  openCreateModal: () => set({ isCreateModalOpen: true }),
  closeCreateModal: () => set({ isCreateModalOpen: false }),
}));

// Persistent State - AsyncStorage
const saveUserPreferences = async (prefs) => {
  await AsyncStorage.setItem("preferences", JSON.stringify(prefs));
};
```

---

## React Native Best Practices

### Component Organization

**Atomic Design Pattern:**

```typescript
// atoms/Button.tsx
export function Button({ children, onPress, variant = 'primary' }) {
  return (
    <TouchableOpacity
      style={[styles.button, styles[variant]]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.text}>{children}</Text>
    </TouchableOpacity>
  );
}

// molecules/HouseholdCard.tsx
export function HouseholdCard({ household, onPress }) {
  return (
    <Card onPress={onPress}>
      <HouseholdAvatar src={household.avatar} />
      <HouseholdInfo household={household} />
      <Button variant="ghost" onPress={onViewPress}>View</Button>
    </Card>
  );
}

// organisms/HouseholdList.tsx
export function HouseholdList({ households }) {
  return (
    <FlatList
      data={households}
      renderItem={({ item }) => <HouseholdCard household={item} />}
      keyExtractor={(item) => item.id}
    />
  );
}

// screens/HouseholdsScreen.tsx
export function HouseholdsScreen() {
  const { data: households } = useHouseholds();

  return (
    <SafeAreaView>
      <HouseholdList households={households} />
    </SafeAreaView>
  );
}
```

### Performance Best Practices

**1. Memoization**

```typescript
// ✅ Good - Memoize expensive components
const HouseholdCard = React.memo(({ household }) => {
  return (
    <View>
      <Text>{household.name}</Text>
    </View>
  );
});

// ✅ Good - Memoize callbacks
const HouseholdList = ({ households }) => {
  const handlePress = useCallback((id) => {
    navigation.navigate('HouseholdDetails', { id });
  }, [navigation]);

  return (
    <FlatList
      data={households}
      renderItem={({ item }) => (
        <HouseholdCard
          household={item}
          onPress={() => handlePress(item.id)}
        />
      )}
    />
  );
};

// ✅ Good - Memoize expensive calculations
const HouseholdStats = ({ members }) => {
  const activeMembers = useMemo(
    () => members.filter((m) => m.status === 'active'),
    [members]
  );

  return <Text>Active: {activeMembers.length}</Text>;
};
```

**2. List Optimization**

```typescript
// ✅ Good - FlatList with optimization
<FlatList
  data={households}
  renderItem={renderHousehold}
  keyExtractor={(item) => item.id}

  // Performance optimizations
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  windowSize={10}

  // Pull to refresh
  refreshControl={
    <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
  }

  // Empty state
  ListEmptyComponent={<EmptyState />}

  // Footer
  ListFooterComponent={isLoadingMore ? <Spinner /> : null}

  // Load more
  onEndReached={loadMore}
  onEndReachedThreshold={0.5}
/>
```

**3. Image Optimization**

```typescript
// ✅ Good - Optimized images
import FastImage from 'react-native-fast-image';

<FastImage
  source={{
    uri: household.avatar,
    priority: FastImage.priority.normal,
  }}
  style={styles.avatar}
  resizeMode={FastImage.resizeMode.cover}
/>

// ✅ Good - Placeholder while loading
<FastImage
  source={{ uri: imageUrl }}
  style={styles.image}
  defaultSource={require('./placeholder.png')}
/>

// ✅ Good - Cache images
FastImage.preload([
  { uri: 'https://example.com/image1.jpg' },
  { uri: 'https://example.com/image2.jpg' },
]);
```

**4. Avoid Inline Functions**

```typescript
// ❌ Bad - Creates new function on every render
<Button onPress={() => navigation.navigate('Details')} />

// ✅ Good - Stable function reference
const handlePress = useCallback(() => {
  navigation.navigate('Details');
}, [navigation]);

<Button onPress={handlePress} />
```

### TypeScript Best Practices

```typescript
// Define prop types
interface HouseholdCardProps {
  household: Household;
  onPress: (id: string) => void;
  variant?: "default" | "compact";
}

export function HouseholdCard({
  household,
  onPress,
  variant = "default",
}: HouseholdCardProps) {
  // Implementation
}

// Use discriminated unions for variants
type ButtonVariant =
  | { variant: "primary"; color?: never }
  | { variant: "secondary"; color?: string };

// Type navigation params
type RootStackParamList = {
  Home: undefined;
  HouseholdDetails: { id: string };
  CreateHousehold: { prefill?: Partial<Household> };
};

// Use with navigation
const navigation = useNavigation<NavigationProp<RootStackParamList>>();
navigation.navigate("HouseholdDetails", { id: "123" });
```

---

## Platform-Specific Guidelines

### iOS Specific

**1. iOS Design Patterns**

```typescript
// iOS uses pull-down action sheets
import ActionSheet from '@react-native-community/actionsheet';

function HouseholdActions({ household }) {
  const actionSheetRef = useRef<ActionSheet>(null);

  const showActions = () => {
    actionSheetRef.current?.show();
  };

  return (
    <>
      <Button onPress={showActions}>Actions</Button>
      <ActionSheet
        ref={actionSheetRef}
        options={['Edit', 'Delete', 'Cancel']}
        cancelButtonIndex={2}
        destructiveButtonIndex={1}
        onPress={(index) => {
          if (index === 0) handleEdit();
          if (index === 1) handleDelete();
        }}
      />
    </>
  );
}
```

**2. iOS Navigation**

```typescript
// iOS uses tab bar at bottom, back button on top-left
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2D9B87',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
        },
      }}
    >
      <Tab.Screen
        name="Households"
        component={HouseholdsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <HomeIcon color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
```

**3. iOS Haptics**

```typescript
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

// Use haptics for important actions
function DeleteButton({ onPress }) {
  const handlePress = () => {
    // Trigger haptic feedback
    ReactNativeHapticFeedback.trigger('notificationWarning');
    onPress();
  };

  return <Button onPress={handlePress}>Delete</Button>;
}

// Haptic types:
// - 'selection' - Light tap for selections
// - 'impactLight' - Light impact
// - 'impactMedium' - Medium impact
// - 'impactHeavy' - Heavy impact
// - 'notificationSuccess' - Success notification
// - 'notificationWarning' - Warning notification
// - 'notificationError' - Error notification
```

**4. iOS Safe Area**

```typescript
import { SafeAreaView } from 'react-native-safe-area-context';

function Screen() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Content */}
    </SafeAreaView>
  );
}

// For specific edges
<SafeAreaView edges={['top']}>
  {/* Only top safe area */}
</SafeAreaView>
```

### Android Specific

**1. Material Design 3**

```typescript
// Android uses Material Design patterns
import { Portal, Modal } from 'react-native-paper';

function CreateHouseholdModal({ visible, onDismiss }) {
  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
      >
        <Text style={styles.title}>Create Household</Text>
        <Input label="Household Name" />
        <Button mode="contained" onPress={handleCreate}>
          Create
        </Button>
      </Modal>
    </Portal>
  );
}
```

**2. Android Navigation**

```typescript
// Android uses drawer navigation and floating action buttons
import { createDrawerNavigator } from '@react-navigation/drawer';

const Drawer = createDrawerNavigator();

function DrawerNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{
        drawerActiveTintColor: '#2D9B87',
        drawerInactiveTintColor: '#6B7280',
      }}
    >
      <Drawer.Screen name="Households" component={HouseholdsScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator>
  );
}

// Floating Action Button
import { FAB } from 'react-native-paper';

function HouseholdsScreen() {
  return (
    <View style={styles.container}>
      <HouseholdList />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleCreate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2D9B87',
  },
});
```

**3. Android Back Button**

```typescript
import { BackHandler } from "react-native";

function Screen() {
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        // Handle back button
        if (canGoBack) {
          navigation.goBack();
          return true; // Prevent default behavior
        }
        return false; // Allow default behavior
      },
    );

    return () => backHandler.remove();
  }, [canGoBack, navigation]);
}
```

**4. Android Permissions**

```typescript
import { PermissionsAndroid, Platform } from "react-native";

async function requestCameraPermission() {
  if (Platform.OS === "android") {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: "Camera Permission",
          message: "PetForce needs access to your camera to scan QR codes",
          buttonPositive: "OK",
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  return true; // iOS handles permissions differently
}
```

### Cross-Platform Utilities

```typescript
// Platform-specific code
import { Platform, StyleSheet } from "react-native";

const styles = StyleSheet.create({
  button: {
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});

// Platform-specific components
const MyComponent = Platform.select({
  ios: () => require("./MyComponent.ios").default,
  android: () => require("./MyComponent.android").default,
})();

// Platform version checks
if (Platform.Version >= 13) {
  // iOS 13+ or Android API 33+
}
```

---

## Offline-First Architecture

### Principle: App Works Without Network

**Strategy:**

1. **Cache all API responses** - Use TanStack Query for automatic caching
2. **Queue mutations offline** - Store failed requests and retry when online
3. **Optimistic updates** - Update UI immediately, sync in background
4. **Local database** - SQLite for offline data storage
5. **Sync strategy** - Background sync when network available

### Implementation

**1. Network Detection**

```typescript
import NetInfo from '@react-native-community/netinfo';

// Subscribe to network state
const useNetworkState = () => {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  return isConnected;
};

// Show offline banner
function OfflineBanner() {
  const isConnected = useNetworkState();

  if (isConnected) return null;

  return (
    <View style={styles.banner}>
      <Text>You're offline. Changes will sync when connected.</Text>
    </View>
  );
}
```

**2. Offline Queue**

```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";

interface QueuedRequest {
  id: string;
  method: "POST" | "PATCH" | "DELETE";
  url: string;
  body: any;
  timestamp: number;
}

class OfflineQueue {
  private queue: QueuedRequest[] = [];

  async add(request: Omit<QueuedRequest, "id" | "timestamp">) {
    const queuedRequest: QueuedRequest = {
      ...request,
      id: Math.random().toString(36),
      timestamp: Date.now(),
    };

    this.queue.push(queuedRequest);
    await this.save();
  }

  async process() {
    const isConnected = await NetInfo.fetch().then(
      (state) => state.isConnected,
    );

    if (!isConnected) return;

    for (const request of this.queue) {
      try {
        await fetch(request.url, {
          method: request.method,
          body: JSON.stringify(request.body),
          headers: { "Content-Type": "application/json" },
        });

        // Remove from queue on success
        this.queue = this.queue.filter((r) => r.id !== request.id);
        await this.save();
      } catch (error) {
        console.error("Failed to process queued request:", error);
        // Keep in queue for retry
      }
    }
  }

  private async save() {
    await AsyncStorage.setItem("offline_queue", JSON.stringify(this.queue));
  }

  async load() {
    const stored = await AsyncStorage.getItem("offline_queue");
    this.queue = stored ? JSON.parse(stored) : [];
  }
}

export const offlineQueue = new OfflineQueue();
```

**3. Optimistic Updates**

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";

function useCreateHousehold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createHousehold,

    // Optimistic update
    onMutate: async (newHousehold) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["households"] });

      // Snapshot previous value
      const previousHouseholds = queryClient.getQueryData(["households"]);

      // Optimistically update to new value
      queryClient.setQueryData(["households"], (old: Household[]) => [
        ...old,
        { ...newHousehold, id: "temp-" + Date.now() },
      ]);

      return { previousHouseholds };
    },

    // Rollback on error
    onError: (err, newHousehold, context) => {
      queryClient.setQueryData(["households"], context?.previousHouseholds);
    },

    // Refetch after success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["households"] });
    },
  });
}
```

**4. SQLite for Offline Storage**

```typescript
import SQLite from "react-native-sqlite-storage";

class Database {
  private db: SQLite.SQLiteDatabase | null = null;

  async init() {
    this.db = await SQLite.openDatabase({
      name: "petforce.db",
      location: "default",
    });

    await this.createTables();
  }

  private async createTables() {
    await this.db?.executeSql(`
      CREATE TABLE IF NOT EXISTS households (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        invite_code TEXT,
        created_at INTEGER,
        synced INTEGER DEFAULT 0
      );
    `);

    await this.db?.executeSql(`
      CREATE TABLE IF NOT EXISTS members (
        id TEXT PRIMARY KEY,
        household_id TEXT,
        user_id TEXT,
        status TEXT,
        created_at INTEGER,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (household_id) REFERENCES households(id)
      );
    `);
  }

  async saveHousehold(household: Household) {
    await this.db?.executeSql(
      `INSERT OR REPLACE INTO households
       (id, name, description, invite_code, created_at, synced)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        household.id,
        household.name,
        household.description,
        household.inviteCode,
        Date.now(),
        0, // Not synced yet
      ],
    );
  }

  async getHouseholds(): Promise<Household[]> {
    const [results] = await this.db?.executeSql(
      "SELECT * FROM households ORDER BY created_at DESC",
    );

    return results.rows.raw();
  }

  async markSynced(householdId: string) {
    await this.db?.executeSql("UPDATE households SET synced = 1 WHERE id = ?", [
      householdId,
    ]);
  }
}

export const database = new Database();
```

---

## Performance Optimization

### 60 FPS Target

**Measuring Performance:**

```typescript
import { InteractionManager } from 'react-native';

// Defer expensive operations until interactions complete
function ExpensiveScreen() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      // Expensive operation (data processing, etc.)
      processData();
      setIsReady(true);
    });

    return () => task.cancel();
  }, []);

  if (!isReady) {
    return <LoadingSpinner />;
  }

  return <ExpensiveContent />;
}
```

**Performance Profiling:**

```typescript
// Enable performance monitoring
import { enableScreens } from "react-native-screens";
enableScreens();

// Measure component render time
import { PerformanceObserver } from "react-native-performance";

const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    console.log(`${entry.name}: ${entry.duration}ms`);
  });
});

observer.observe({ entryTypes: ["measure"] });
```

### Bundle Size Optimization

```typescript
// Use code splitting with lazy loading
import { lazy, Suspense } from 'react';

const HouseholdDetails = lazy(() => import('./HouseholdDetails'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HouseholdDetails />
    </Suspense>
  );
}

// Remove console.logs in production
if (__DEV__) {
  console.log('Development mode');
} else {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
}
```

### Memory Optimization

```typescript
// Clean up subscriptions
useEffect(() => {
  const subscription = eventEmitter.on('update', handleUpdate);

  return () => {
    subscription.remove(); // Always clean up
  };
}, []);

// Avoid memory leaks with images
import { Image } from 'react-native';

function Avatar({ uri }) {
  useEffect(() => {
    // Prefetch image
    const task = Image.prefetch(uri);

    return () => {
      // Cancel prefetch if component unmounts
      task.cancel();
    };
  }, [uri]);

  return <Image source={{ uri }} />;
}
```

---

## Mobile UX Patterns

### Pull to Refresh

```typescript
import { RefreshControl, ScrollView } from 'react-native';

function HouseholdList() {
  const { data: households, refetch, isRefetching } = useHouseholds();

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor="#2D9B87"
          colors={['#2D9B87']}
        />
      }
    >
      {households.map((household) => (
        <HouseholdCard key={household.id} household={household} />
      ))}
    </ScrollView>
  );
}
```

### Swipe Actions

```typescript
import Swipeable from 'react-native-gesture-handler/Swipeable';

function HouseholdCard({ household }) {
  const renderRightActions = () => (
    <View style={styles.rightActions}>
      <TouchableOpacity
        style={[styles.action, styles.edit]}
        onPress={handleEdit}
      >
        <EditIcon />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.action, styles.delete]}
        onPress={handleDelete}
      >
        <DeleteIcon />
      </TouchableOpacity>
    </View>
  );

  return (
    <Swipeable renderRightActions={renderRightActions}>
      <View style={styles.card}>
        <Text>{household.name}</Text>
      </View>
    </Swipeable>
  );
}
```

### Bottom Sheet

```typescript
import { BottomSheetModal } from '@gorhom/bottom-sheet';

function CreateHouseholdSheet() {
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const handleOpen = () => {
    bottomSheetRef.current?.present();
  };

  return (
    <>
      <Button onPress={handleOpen}>Create Household</Button>

      <BottomSheetModal
        ref={bottomSheetRef}
        snapPoints={['50%', '90%']}
        enablePanDownToClose
      >
        <View style={styles.content}>
          <Text style={styles.title}>Create Household</Text>
          <Input label="Household Name" />
          <Button onPress={handleCreate}>Create</Button>
        </View>
      </BottomSheetModal>
    </>
  );
}
```

### Loading States

```typescript
// Skeleton screens
function HouseholdCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton width={60} height={60} circle />
      <View style={styles.info}>
        <Skeleton width="70%" height={20} />
        <Skeleton width="50%" height={16} />
      </View>
    </View>
  );
}

// Show skeletons while loading
function HouseholdList() {
  const { data: households, isLoading } = useHouseholds();

  if (isLoading) {
    return (
      <>
        <HouseholdCardSkeleton />
        <HouseholdCardSkeleton />
        <HouseholdCardSkeleton />
      </>
    );
  }

  return households.map((household) => (
    <HouseholdCard key={household.id} household={household} />
  ));
}
```

---

## Navigation

### Stack Navigation

```typescript
import { createNativeStackNavigator } from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: undefined;
  HouseholdDetails: { householdId: string };
  CreateHousehold: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2D9B87',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Households' }}
      />
      <Stack.Screen
        name="HouseholdDetails"
        component={HouseholdDetailsScreen}
        options={({ route }) => ({
          title: route.params.householdId,
        })}
      />
      <Stack.Screen
        name="CreateHousehold"
        component={CreateHouseholdScreen}
        options={{
          presentation: 'modal',
          headerLeft: () => <CloseButton />,
        }}
      />
    </Stack.Navigator>
  );
}
```

### Deep Linking

```typescript
import { Linking } from 'react-native';

// Configure deep linking
const linking = {
  prefixes: ['petforce://', 'https://petforce.app'],
  config: {
    screens: {
      Home: '',
      HouseholdDetails: 'households/:householdId',
      JoinHousehold: 'join/:inviteCode',
    },
  },
};

function App() {
  return (
    <NavigationContainer linking={linking}>
      <AppNavigator />
    </NavigationContainer>
  );
}

// Handle incoming links
useEffect(() => {
  const handleUrl = ({ url }: { url: string }) => {
    // Parse URL and navigate
    const route = Linking.parse(url);
    if (route.path === 'join') {
      navigation.navigate('JoinHousehold', {
        inviteCode: route.queryParams.code
      });
    }
  };

  const subscription = Linking.addEventListener('url', handleUrl);

  // Handle app opened from URL
  Linking.getInitialURL().then((url) => {
    if (url) handleUrl({ url });
  });

  return () => subscription.remove();
}, []);
```

---

## Push Notifications

### Setup

```typescript
import messaging from "@react-native-firebase/messaging";
import PushNotification from "react-native-push-notification";

// Request permission
async function requestNotificationPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log("Authorization status:", authStatus);
    return true;
  }
  return false;
}

// Get FCM token
async function getFCMToken() {
  const token = await messaging().getToken();
  console.log("FCM Token:", token);

  // Send token to server
  await api.updateUserToken(token);

  return token;
}

// Handle foreground notifications
messaging().onMessage(async (remoteMessage) => {
  console.log("Notification received:", remoteMessage);

  // Show local notification
  PushNotification.localNotification({
    title: remoteMessage.notification?.title,
    message: remoteMessage.notification?.body || "",
    data: remoteMessage.data,
  });
});

// Handle background/quit state notifications
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log("Background notification:", remoteMessage);
});

// Handle notification tap
PushNotification.configure({
  onNotification: (notification) => {
    if (notification.userInteraction) {
      // User tapped notification
      const { type, householdId } = notification.data;

      if (type === "member_approved") {
        navigation.navigate("HouseholdDetails", { householdId });
      }
    }
  },
});
```

### Notification Types

```typescript
// Member approved notification
{
  "notification": {
    "title": "You're in!",
    "body": "You've been approved to join The Smith Household"
  },
  "data": {
    "type": "member_approved",
    "householdId": "hh_abc123"
  }
}

// Member invited notification
{
  "notification": {
    "title": "New household member",
    "body": "John Smith wants to join your household"
  },
  "data": {
    "type": "join_request",
    "householdId": "hh_abc123",
    "userId": "user_xyz789"
  }
}
```

---

## Deep Linking

### Universal Links (iOS) & App Links (Android)

**iOS Configuration (ios/PetForce/PetForce.entitlements):**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.developer.associated-domains</key>
  <array>
    <string>applinks:petforce.app</string>
    <string>applinks:www.petforce.app</string>
  </array>
</dict>
</plist>
```

**Android Configuration (android/app/src/main/AndroidManifest.xml):**

```xml
<activity
  android:name=".MainActivity"
  android:launchMode="singleTask">

  <intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />

    <data
      android:scheme="https"
      android:host="petforce.app" />
    <data
      android:scheme="https"
      android:host="www.petforce.app" />
  </intent-filter>

  <intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />

    <data android:scheme="petforce" />
  </intent-filter>
</activity>
```

**Server Configuration (.well-known/apple-app-site-association):**

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.com.petforce.app",
        "paths": ["/join/*", "/households/*"]
      }
    ]
  }
}
```

---

## Testing Strategy

### Unit Tests

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { HouseholdCard } from './HouseholdCard';

describe('HouseholdCard', () => {
  it('renders household name', () => {
    const household = {
      id: '1',
      name: 'The Smith Household',
      memberCount: 3,
    };

    const { getByText } = render(<HouseholdCard household={household} />);
    expect(getByText('The Smith Household')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const household = { id: '1', name: 'Test' };
    const onPress = jest.fn();

    const { getByTestId } = render(
      <HouseholdCard household={household} onPress={onPress} />
    );

    fireEvent.press(getByTestId('household-card'));
    expect(onPress).toHaveBeenCalledWith('1');
  });
});
```

### Integration Tests

```typescript
import { renderHook, waitFor } from "@testing-library/react-native";
import { useHouseholds } from "./useHouseholds";

describe("useHouseholds", () => {
  it("fetches households", async () => {
    const { result } = renderHook(() => useHouseholds());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toHaveLength(3);
  });

  it("handles errors", async () => {
    // Mock API error
    jest
      .spyOn(api, "fetchHouseholds")
      .mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useHouseholds());

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error.message).toBe("Network error");
  });
});
```

### E2E Tests (Detox)

```typescript
describe("Household Flow", () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it("should create a new household", async () => {
    // Navigate to create screen
    await element(by.id("create-household-button")).tap();

    // Fill in form
    await element(by.id("household-name-input")).typeText("Test Household");
    await element(by.id("household-description-input")).typeText(
      "Test Description",
    );

    // Submit
    await element(by.id("submit-button")).tap();

    // Verify success
    await expect(element(by.text("Household created!"))).toBeVisible();
    await expect(element(by.text("Test Household"))).toBeVisible();
  });

  it("should handle offline mode", async () => {
    // Disable network
    await device.setURLBlacklist(["*"]);

    // Try to create household
    await element(by.id("create-household-button")).tap();
    await element(by.id("household-name-input")).typeText("Offline Test");
    await element(by.id("submit-button")).tap();

    // Verify offline banner
    await expect(element(by.text("You're offline"))).toBeVisible();

    // Re-enable network
    await device.setURLBlacklist([]);

    // Verify sync
    await waitFor(element(by.text("Synced")))
      .toBeVisible()
      .withTimeout(5000);
  });
});
```

---

## App Store Guidelines

### iOS App Store

**Requirements:**

- App Store Connect account
- Valid code signing certificate
- Privacy policy URL
- App icons (all sizes)
- Screenshots (all device sizes)
- App description and keywords

**Review Checklist:**

- [ ] No crashes or bugs
- [ ] All features work as described
- [ ] Privacy policy accessible
- [ ] In-app purchases tested (if applicable)
- [ ] App doesn't access private data without permission
- [ ] No placeholder content
- [ ] App doesn't resemble system apps
- [ ] All third-party content properly attributed

**Build & Submit:**

```bash
# iOS Release Build
cd ios
fastlane ios release

# Or manually
xcodebuild -workspace PetForce.xcworkspace \
  -scheme PetForce \
  -configuration Release \
  -archivePath PetForce.xcarchive \
  archive

xcodebuild -exportArchive \
  -archivePath PetForce.xcarchive \
  -exportPath . \
  -exportOptionsPlist ExportOptions.plist
```

### Google Play Store

**Requirements:**

- Google Play Console account
- Signed APK/AAB
- Privacy policy URL
- Feature graphic (1024x500)
- Screenshots (multiple devices)
- App description

**Review Checklist:**

- [ ] No crashes or ANRs
- [ ] All features work
- [ ] Proper permissions requested
- [ ] Privacy policy linked
- [ ] Content rating completed
- [ ] Target API level meets requirements
- [ ] 64-bit support

**Build & Submit:**

```bash
# Android Release Build
cd android
./gradlew bundleRelease

# Sign the bundle
jarsigner -verbose \
  -sigalg SHA256withRSA \
  -digestalg SHA-256 \
  -keystore petforce.keystore \
  app/build/outputs/bundle/release/app-release.aab \
  petforce-key
```

---

## Related Documentation

- [Design System](../design/README.md) - Design tokens and components
- [Accessibility Guidelines](../design/accessibility.md) - WCAG compliance
- [Analytics](../analytics/README.md) - Event tracking
- [API Documentation](../api/README.md) - Backend API reference

---

Built with 📱 by Maya (Mobile Development Agent)

**Mobile users are the majority. Design for the small screen first.**

**Offline-first, platform-native, performance-optimized.**
