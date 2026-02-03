# Platform-Specific Patterns

Deep dive into iOS and Android platform conventions and best practices.

## iOS Patterns

### Navigation Patterns

#### Tab Bar Navigation (iOS Standard)

```typescript
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';

const Tab = createBottomTabNavigator();

export function IOSTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2D9B87',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0.5,
          borderTopColor: '#E5E7EB',
          paddingBottom: Platform.OS === 'ios' ? 20 : 0,
          height: Platform.OS === 'ios' ? 84 : 60,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Households"
        component={HouseholdsStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <HomeIcon color={color} width={size} height={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Activity"
        component={ActivityStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <ActivityIcon color={color} width={size} height={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <ProfileIcon color={color} width={size} height={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
```

#### Large Title Headers

```typescript
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

export function HouseholdsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerLargeTitle: true, // iOS large title
        headerLargeTitleStyle: {
          fontWeight: '700',
          fontSize: 34,
        },
        headerStyle: {
          backgroundColor: '#F9FAFB',
        },
        headerShadowVisible: false,
        headerBlurEffect: 'regular',
      }}
    >
      <Stack.Screen
        name="HouseholdList"
        component={HouseholdListScreen}
        options={{
          title: 'Households',
          headerLargeTitle: true,
          headerSearchBarOptions: {
            placeholder: 'Search households',
          },
        }}
      />
    </Stack.Navigator>
  );
}
```

#### Context Menus (iOS 13+)

```typescript
import { ContextMenuView } from 'react-native-ios-context-menu';

export function HouseholdCard({ household }) {
  return (
    <ContextMenuView
      menuConfig={{
        menuTitle: household.name,
        menuItems: [
          {
            actionKey: 'view',
            actionTitle: 'View Details',
            icon: {
              type: 'SYSTEM',
              imageValue: 'eye',
            },
          },
          {
            actionKey: 'edit',
            actionTitle: 'Edit',
            icon: {
              type: 'SYSTEM',
              imageValue: 'pencil',
            },
          },
          {
            actionKey: 'delete',
            actionTitle: 'Delete',
            icon: {
              type: 'SYSTEM',
              imageValue: 'trash',
            },
            menuAttributes: ['destructive'],
          },
        ],
      }}
      onPressMenuItem={({ nativeEvent }) => {
        switch (nativeEvent.actionKey) {
          case 'view':
            navigation.navigate('HouseholdDetails', { id: household.id });
            break;
          case 'edit':
            navigation.navigate('EditHousehold', { id: household.id });
            break;
          case 'delete':
            handleDelete(household.id);
            break;
        }
      }}
    >
      <View style={styles.card}>
        <Text>{household.name}</Text>
      </View>
    </ContextMenuView>
  );
}
```

### iOS Modal Presentation

```typescript
export function CreateHouseholdModal() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="CreateHousehold"
        component={CreateHouseholdScreen}
        options={{
          presentation: 'modal',
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          ),
        }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  cancelButton: {
    fontSize: 17,
    color: '#2D9B87',
  },
  saveButton: {
    fontSize: 17,
    color: '#2D9B87',
    fontWeight: '600',
  },
});
```

### iOS Haptic Feedback

```typescript
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const options = {
  enableVibrateFallback: false,
  ignoreAndroidSystemSettings: false,
};

// Selection feedback (light tap)
ReactNativeHapticFeedback.trigger('selection', options);

// Impact feedback
ReactNativeHapticFeedback.trigger('impactLight', options); // Light tap
ReactNativeHapticFeedback.trigger('impactMedium', options); // Medium tap
ReactNativeHapticFeedback.trigger('impactHeavy', options); // Heavy tap

// Notification feedback
ReactNativeHapticFeedback.trigger('notificationSuccess', options);
ReactNativeHapticFeedback.trigger('notificationWarning', options);
ReactNativeHapticFeedback.trigger('notificationError', options);

// Usage examples
function DeleteButton({ onPress }) {
  const handlePress = () => {
    ReactNativeHapticFeedback.trigger('notificationWarning');
    Alert.alert(
      'Delete Household',
      'Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            ReactNativeHapticFeedback.trigger('notificationSuccess');
            onPress();
          },
        },
      ]
    );
  };

  return <Button onPress={handlePress}>Delete</Button>;
}
```

### iOS Action Sheet

```typescript
import { ActionSheetIOS } from 'react-native';

function HouseholdOptions({ household }) {
  const showOptions = () => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['View Details', 'Edit', 'Share', 'Delete', 'Cancel'],
        destructiveButtonIndex: 3,
        cancelButtonIndex: 4,
        userInterfaceStyle: 'automatic', // Supports dark mode
      },
      (buttonIndex) => {
        switch (buttonIndex) {
          case 0:
            navigation.navigate('HouseholdDetails', { id: household.id });
            break;
          case 1:
            navigation.navigate('EditHousehold', { id: household.id });
            break;
          case 2:
            handleShare(household);
            break;
          case 3:
            handleDelete(household.id);
            break;
        }
      }
    );
  };

  return (
    <TouchableOpacity onPress={showOptions}>
      <MoreIcon />
    </TouchableOpacity>
  );
}
```

### iOS Share Sheet

```typescript
import { Share } from "react-native";

async function shareHousehold(household: Household) {
  try {
    const result = await Share.share({
      message: `Join my household "${household.name}" on PetForce!`,
      url: `https://petforce.app/join/${household.inviteCode}`,
      title: "Join My Household",
    });

    if (result.action === Share.sharedAction) {
      if (result.activityType) {
        console.log("Shared via:", result.activityType);
      } else {
        console.log("Shared successfully");
      }
    } else if (result.action === Share.dismissedAction) {
      console.log("Share dismissed");
    }
  } catch (error) {
    console.error("Error sharing:", error);
  }
}
```

---

## Android Patterns

### Material Design 3 Components

#### Navigation Drawer

```typescript
import { createDrawerNavigator } from '@react-navigation/drawer';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';

const Drawer = createDrawerNavigator();

function CustomDrawerContent(props) {
  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.drawerHeader}>
        <Avatar source={{ uri: user.avatar }} />
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
      </View>
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}

export function AndroidDrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerActiveTintColor: '#2D9B87',
        drawerInactiveTintColor: '#6B7280',
        drawerLabelStyle: {
          fontSize: 14,
          fontWeight: '500',
        },
        drawerStyle: {
          backgroundColor: '#FFFFFF',
          width: 280,
        },
      }}
    >
      <Drawer.Screen
        name="Households"
        component={HouseholdsScreen}
        options={{
          drawerIcon: ({ color, size }) => <HomeIcon color={color} size={size} />,
        }}
      />
      <Drawer.Screen
        name="Activity"
        component={ActivityScreen}
        options={{
          drawerIcon: ({ color, size }) => <ActivityIcon color={color} size={size} />,
        }}
      />
    </Drawer.Navigator>
  );
}
```

#### Floating Action Button (FAB)

```typescript
import { FAB } from 'react-native-paper';

export function HouseholdsScreen() {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.container}>
      <HouseholdList />

      {/* Single FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('CreateHousehold')}
        color="#FFFFFF"
        theme={{ colors: { accent: '#2D9B87' } }}
      />

      {/* FAB Group (expandable) */}
      <FAB.Group
        open={open}
        icon={open ? 'close' : 'plus'}
        actions={[
          {
            icon: 'home-plus',
            label: 'Create Household',
            onPress: () => navigation.navigate('CreateHousehold'),
          },
          {
            icon: 'qrcode-scan',
            label: 'Scan QR Code',
            onPress: () => navigation.navigate('ScanQR'),
          },
          {
            icon: 'account-plus',
            label: 'Join with Code',
            onPress: () => navigation.navigate('JoinWithCode'),
          },
        ]}
        onStateChange={({ open }) => setOpen(open)}
        style={styles.fabGroup}
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
  fabGroup: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
```

#### Bottom Navigation

```typescript
import { BottomNavigation } from 'react-native-paper';

export function AndroidBottomNav() {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'households', title: 'Households', icon: 'home' },
    { key: 'activity', title: 'Activity', icon: 'bell' },
    { key: 'profile', title: 'Profile', icon: 'account' },
  ]);

  const renderScene = BottomNavigation.SceneMap({
    households: HouseholdsRoute,
    activity: ActivityRoute,
    profile: ProfileRoute,
  });

  return (
    <BottomNavigation
      navigationState={{ index, routes }}
      onIndexChange={setIndex}
      renderScene={renderScene}
      barStyle={{ backgroundColor: '#FFFFFF' }}
      activeColor="#2D9B87"
      inactiveColor="#6B7280"
    />
  );
}
```

#### Snackbar (Android Toast Alternative)

```typescript
import { Snackbar } from 'react-native-paper';

export function HouseholdCreated() {
  const [visible, setVisible] = useState(false);

  const handleCreate = async () => {
    await createHousehold(data);
    setVisible(true);
  };

  return (
    <>
      <Button onPress={handleCreate}>Create</Button>

      <Snackbar
        visible={visible}
        onDismiss={() => setVisible(false)}
        duration={3000}
        action={{
          label: 'View',
          onPress: () => navigation.navigate('HouseholdDetails'),
        }}
      >
        Household created successfully!
      </Snackbar>
    </>
  );
}
```

### Material Design Dialogs

```typescript
import { Dialog, Portal, Button } from 'react-native-paper';

export function DeleteConfirmDialog({ visible, onDismiss, onConfirm }) {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>Delete Household</Dialog.Title>
        <Dialog.Content>
          <Text>
            Are you sure you want to delete this household? This action cannot
            be undone.
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button onPress={onConfirm} mode="text" textColor="#EF4444">
            Delete
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
```

### Android Back Button Handling

```typescript
import { BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

export function FormScreen() {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (hasUnsavedChanges) {
          Alert.alert(
            'Discard changes?',
            'You have unsaved changes. Are you sure you want to leave?',
            [
              { text: "Don't leave", style: 'cancel', onPress: () => {} },
              {
                text: 'Discard',
                style: 'destructive',
                onPress: () => navigation.goBack(),
              },
            ]
          );
          return true; // Prevent default back behavior
        }
        return false; // Allow default back behavior
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => subscription.remove();
    }, [hasUnsavedChanges, navigation])
  );

  return <Form onChange={() => setHasUnsavedChanges(true)} />;
}
```

### Android Permissions

```typescript
import { PermissionsAndroid, Platform } from "react-native";

export async function requestPermissions() {
  if (Platform.OS !== "android") return true;

  try {
    // Request multiple permissions
    const grants = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
    ]);

    const cameraGranted =
      grants[PermissionsAndroid.PERMISSIONS.CAMERA] ===
      PermissionsAndroid.RESULTS.GRANTED;

    const storageGranted =
      grants[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] ===
        PermissionsAndroid.RESULTS.GRANTED &&
      grants[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] ===
        PermissionsAndroid.RESULTS.GRANTED;

    return cameraGranted && storageGranted;
  } catch (err) {
    console.warn("Permission error:", err);
    return false;
  }
}

// Check permission status
export async function hasCameraPermission() {
  if (Platform.OS !== "android") return true;

  const hasPermission = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.CAMERA,
  );

  return hasPermission;
}
```

---

## Cross-Platform Utilities

### Platform-Specific Styling

```typescript
import { Platform, StyleSheet } from "react-native";

const styles = StyleSheet.create({
  button: {
    padding: 16,
    borderRadius: 8,

    // Platform-specific shadows
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

  // Different font families
  text: {
    fontSize: 16,
    fontFamily: Platform.select({
      ios: "SF Pro Text",
      android: "Roboto",
    }),
  },

  // Different spacing
  container: {
    paddingTop: Platform.select({
      ios: 20, // Account for notch
      android: 0,
    }),
  },
});

// Platform-specific components
const HeaderTitle = Platform.select({
  ios: () => require("./HeaderTitle.ios").default,
  android: () => require("./HeaderTitle.android").default,
})();
```

### Platform Version Checks

```typescript
import { Platform } from "react-native";

// Check iOS version
if (Platform.OS === "ios" && parseInt(Platform.Version, 10) >= 13) {
  // iOS 13+ features (Dark Mode, Context Menus, etc.)
  useContextMenu();
}

// Check Android API level
if (Platform.OS === "android" && Platform.Version >= 30) {
  // Android 11+ features (Scoped Storage, etc.)
  useScopedStorage();
}

// Helper function
export function isIOSAtLeast(version: number): boolean {
  return Platform.OS === "ios" && parseInt(Platform.Version, 10) >= version;
}

export function isAndroidAtLeast(apiLevel: number): boolean {
  return Platform.OS === "android" && Platform.Version >= apiLevel;
}
```

### Platform-Specific Navigation

```typescript
// Choose navigation type based on platform
const RootNavigator = Platform.select({
  ios: () => require("./navigation/ios").default,
  android: () => require("./navigation/android").default,
})();

// iOS: Bottom tabs
// Android: Drawer navigation

export default RootNavigator;
```

---

## Dark Mode Support

### Detecting Dark Mode

```typescript
import { useColorScheme } from 'react-native';

export function ThemedComponent() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  return (
    <View
      style={{
        backgroundColor: isDarkMode ? '#111827' : '#FFFFFF',
      }}
    >
      <Text style={{ color: isDarkMode ? '#F9FAFB' : '#111827' }}>
        Hello World
      </Text>
    </View>
  );
}
```

### Theme Provider

```typescript
import { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';

type Theme = {
  colors: {
    background: string;
    text: string;
    primary: string;
    border: string;
  };
};

const lightTheme: Theme = {
  colors: {
    background: '#FFFFFF',
    text: '#111827',
    primary: '#2D9B87',
    border: '#E5E7EB',
  },
};

const darkTheme: Theme = {
  colors: {
    background: '#111827',
    text: '#F9FAFB',
    primary: '#2D9B87',
    border: '#374151',
  },
};

const ThemeContext = createContext<Theme>(lightTheme);

export function ThemeProvider({ children }) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

// Usage
export function ThemedButton() {
  const theme = useTheme();

  return (
    <TouchableOpacity
      style={{
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.border,
      }}
    >
      <Text style={{ color: theme.colors.background }}>Button</Text>
    </TouchableOpacity>
  );
}
```

---

## Accessibility

### Platform-Specific Accessibility

```typescript
import { AccessibilityInfo, Platform } from "react-native";

// Check if screen reader is enabled
useEffect(() => {
  const checkScreenReader = async () => {
    const screenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
    console.log("Screen reader enabled:", screenReaderEnabled);
  };

  checkScreenReader();

  const subscription = AccessibilityInfo.addEventListener(
    "screenReaderChanged",
    (enabled) => {
      console.log("Screen reader changed:", enabled);
    },
  );

  return () => subscription.remove();
}, []);

// Announce to screen reader
AccessibilityInfo.announceForAccessibility("Household created successfully");

// iOS: VoiceOver announcement
// Android: TalkBack announcement
```

### Accessible Components

```typescript
// Proper accessibility labels
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Delete household"
  accessibilityHint="Removes this household permanently"
  accessibilityRole="button"
  onPress={handleDelete}
>
  <TrashIcon />
</TouchableOpacity>

// iOS VoiceOver traits
<View
  accessible={true}
  accessibilityLabel="Household card"
  accessibilityTraits={['button']} // iOS specific
  accessibilityRole="button" // Cross-platform
>
  <HouseholdInfo />
</View>

// Hide decorative elements
<Image
  source={require('./decoration.png')}
  accessibilityElementsHidden={true} // Hide from screen reader
  importantForAccessibility="no" // Android specific
/>
```

---

## Related Documentation

- [Mobile Development Guide](./README.md)
- [Performance Optimization](./performance.md)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios)
- [Material Design 3](https://m3.material.io/)

---

Built with 📱 by Maya (Mobile Development Agent)

**Platform conventions matter. iOS users expect iOS, Android users expect Material Design.**
