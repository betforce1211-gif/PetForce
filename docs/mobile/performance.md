# Mobile Performance Optimization

Complete guide to building blazing-fast React Native apps.

## Performance Targets

**User Experience Goals:**

- **60 FPS** - Smooth animations and scrolling
- **< 2s** - Time to interactive
- **< 1s** - Navigation transitions
- **< 500ms** - User interaction response
- **99.9%** - Crash-free rate
- **< 50 MB** - App size (initial download)

---

## JavaScript Performance

### 1. Avoid Re-Renders

**Problem:** Unnecessary re-renders waste CPU cycles

**Solution:** Use React.memo, useMemo, and useCallback

```typescript
// ❌ Bad - Re-renders on every parent update
export function HouseholdCard({ household, onPress }) {
  return (
    <TouchableOpacity onPress={onPress}>
      <Text>{household.name}</Text>
    </TouchableOpacity>
  );
}

// ✅ Good - Only re-renders when household changes
export const HouseholdCard = React.memo(
  ({ household, onPress }) => {
    return (
      <TouchableOpacity onPress={onPress}>
        <Text>{household.name}</Text>
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison
    return prevProps.household.id === nextProps.household.id;
  }
);

// ✅ Good - Memoize expensive calculations
function HouseholdStats({ members }) {
  const stats = useMemo(() => {
    return {
      active: members.filter((m) => m.status === 'active').length,
      pending: members.filter((m) => m.status === 'pending').length,
      total: members.length,
    };
  }, [members]);

  return (
    <View>
      <Text>Active: {stats.active}</Text>
      <Text>Pending: {stats.pending}</Text>
    </View>
  );
}

// ✅ Good - Memoize callbacks
function HouseholdList({ households }) {
  const handlePress = useCallback((id: string) => {
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
}
```

### 2. Optimize List Rendering

**FlatList Optimization:**

```typescript
import { FlatList } from 'react-native';

export function HouseholdList({ households }) {
  const keyExtractor = useCallback((item) => item.id, []);

  const renderItem = useCallback(
    ({ item }) => <HouseholdCard household={item} />,
    []
  );

  const getItemLayout = useCallback(
    (data, index) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  return (
    <FlatList
      data={households}
      renderItem={renderItem}
      keyExtractor={keyExtractor}

      // Performance optimizations
      removeClippedSubviews={true} // Unmount off-screen items
      maxToRenderPerBatch={10} // Render 10 items per batch
      updateCellsBatchingPeriod={50} // Update every 50ms
      windowSize={10} // Render 10 screens worth of content
      initialNumToRender={10} // Render 10 items initially

      // Optional: if all items same height
      getItemLayout={getItemLayout}

      // Avoid inline functions
      ItemSeparatorComponent={ItemSeparator}
      ListEmptyComponent={EmptyState}
      ListFooterComponent={Footer}
    />
  );
}

// Separate component to avoid re-creating
const ItemSeparator = () => <View style={styles.separator} />;
```

**VirtualizedList for Complex Lists:**

```typescript
import { VirtualizedList } from 'react-native';

export function ComplexList({ data }) {
  const getItem = (data, index) => data[index];
  const getItemCount = (data) => data.length;

  return (
    <VirtualizedList
      data={data}
      getItem={getItem}
      getItemCount={getItemCount}
      renderItem={({ item }) => <ComplexCard item={item} />}
      keyExtractor={(item) => item.id}
    />
  );
}
```

### 3. Avoid Inline Functions and Objects

```typescript
// ❌ Bad - Creates new function on every render
<Button onPress={() => navigation.navigate('Details')} />

// ✅ Good - Stable reference
const handlePress = useCallback(() => {
  navigation.navigate('Details');
}, [navigation]);
<Button onPress={handlePress} />

// ❌ Bad - Creates new object on every render
<View style={{ padding: 16, backgroundColor: '#FFF' }} />

// ✅ Good - Static styles
const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFF',
  },
});
<View style={styles.container} />

// ❌ Bad - Creates new array on every render
<FlatList data={households.filter(h => h.active)} />

// ✅ Good - Memoize filtered data
const activeHouseholds = useMemo(
  () => households.filter(h => h.active),
  [households]
);
<FlatList data={activeHouseholds} />
```

### 4. Use Hermes Engine

**Enable Hermes (Android):**

```javascript
// android/app/build.gradle
project.ext.react = [
  enableHermes: true,  // ← Enable Hermes
]
```

**Benefits:**

- Smaller app size
- Faster startup time
- Lower memory usage
- Better performance on low-end devices

---

## Image Optimization

### 1. Use FastImage

```typescript
import FastImage from 'react-native-fast-image';

// ✅ Good - Optimized image loading
<FastImage
  source={{
    uri: household.avatar,
    priority: FastImage.priority.normal,
    cache: FastImage.cacheControl.immutable,
  }}
  style={styles.avatar}
  resizeMode={FastImage.resizeMode.cover}
/>

// Preload images
useEffect(() => {
  FastImage.preload([
    { uri: 'https://example.com/image1.jpg' },
    { uri: 'https://example.com/image2.jpg' },
  ]);
}, []);

// Clear cache if needed
FastImage.clearDiskCache();
FastImage.clearMemoryCache();
```

### 2. Optimize Image Sizes

```typescript
// ❌ Bad - Loading full-size image for thumbnail
<Image
  source={{ uri: 'https://example.com/full-size-4k.jpg' }}
  style={{ width: 60, height: 60 }}
/>

// ✅ Good - Load appropriately sized image
<FastImage
  source={{ uri: 'https://example.com/thumbnail-60x60.jpg' }}
  style={{ width: 60, height: 60 }}
/>

// Use image CDN with size parameters
const getOptimizedImageUrl = (url: string, width: number, height: number) => {
  return `${url}?w=${width}&h=${height}&fit=cover`;
};

<FastImage
  source={{
    uri: getOptimizedImageUrl(household.avatar, 120, 120),
  }}
  style={{ width: 60, height: 60 }} // Display size
/>
```

### 3. Lazy Load Images

```typescript
import { useState, useEffect } from 'react';
import { useInView } from 'react-native-intersection-observer';

export function LazyImage({ uri, style }) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && !shouldLoad) {
      setShouldLoad(true);
    }
  }, [inView, shouldLoad]);

  return (
    <View ref={ref} style={style}>
      {shouldLoad ? (
        <FastImage source={{ uri }} style={style} />
      ) : (
        <View style={[style, styles.placeholder]} />
      )}
    </View>
  );
}
```

### 4. Image Caching Strategy

```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";
import RNFS from "react-native-fs";

class ImageCache {
  private cacheDir = `${RNFS.DocumentDirectoryPath}/images`;

  async getCachedImage(url: string): Promise<string | null> {
    const filename = this.hashUrl(url);
    const filepath = `${this.cacheDir}/${filename}`;

    const exists = await RNFS.exists(filepath);
    if (exists) {
      return `file://${filepath}`;
    }

    return null;
  }

  async cacheImage(url: string): Promise<string> {
    const filename = this.hashUrl(url);
    const filepath = `${this.cacheDir}/${filename}`;

    await RNFS.downloadFile({
      fromUrl: url,
      toFile: filepath,
    }).promise;

    return `file://${filepath}`;
  }

  private hashUrl(url: string): string {
    // Simple hash function
    return url
      .split("")
      .reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0)
      .toString();
  }
}

export const imageCache = new ImageCache();
```

---

## Navigation Performance

### 1. Use Native Stack Navigator

```typescript
// ✅ Good - Native navigation (faster)
import { createNativeStackNavigator } from "@react-navigation/native-stack";
const Stack = createNativeStackNavigator();

// ❌ Avoid - JS-based navigation (slower)
import { createStackNavigator } from "@react-navigation/stack";
const Stack = createStackNavigator();
```

### 2. Lazy Load Screens

```typescript
import { lazy, Suspense } from 'react';

// Lazy load heavy screens
const HouseholdDetails = lazy(() => import('./screens/HouseholdDetails'));
const CreateHousehold = lazy(() => import('./screens/CreateHousehold'));

function AppNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="HouseholdDetails">
        {(props) => (
          <Suspense fallback={<LoadingScreen />}>
            <HouseholdDetails {...props} />
          </Suspense>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
```

### 3. Defer Heavy Operations

```typescript
import { InteractionManager } from 'react-native';

export function HouseholdDetailsScreen({ route }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait for screen transition to complete
    const task = InteractionManager.runAfterInteractions(() => {
      // Load heavy data
      loadHouseholdDetails(route.params.id);
      setIsReady(true);
    });

    return () => task.cancel();
  }, [route.params.id]);

  if (!isReady) {
    return <SkeletonLoader />;
  }

  return <HouseholdDetails />;
}
```

---

## Animation Performance

### 1. Use Native Driver

```typescript
import { Animated } from "react-native";

// ✅ Good - Runs on native thread (60 FPS)
Animated.timing(fadeAnim, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true, // ← Enable native driver
}).start();

// ❌ Bad - Runs on JS thread (may drop frames)
Animated.timing(fadeAnim, {
  toValue: 1,
  duration: 300,
  useNativeDriver: false,
}).start();
```

### 2. Use Reanimated for Complex Animations

```typescript
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

export function AnimatedCard() {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      <TouchableWithoutFeedback
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View>
          <Text>Card Content</Text>
        </View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
}
```

### 3. Optimize Gesture Handlers

```typescript
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

export function SwipeableCard() {
  const translateX = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > 100) {
        // Swipe threshold
        translateX.value = withSpring(event.translationX > 0 ? 300 : -300);
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, animatedStyle]}>
        <Text>Swipeable Card</Text>
      </Animated.View>
    </GestureDetector>
  );
}
```

---

## Bundle Size Optimization

### 1. Enable ProGuard (Android)

```groovy
// android/app/build.gradle
android {
  buildTypes {
    release {
      minifyEnabled true
      shrinkResources true
      proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
  }
}
```

### 2. Remove console.log in Production

```typescript
if (!__DEV__) {
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
}
```

### 3. Tree Shaking

```typescript
// ❌ Bad - Imports entire library
import _ from "lodash";

// ✅ Good - Imports only what you need
import debounce from "lodash/debounce";
import throttle from "lodash/throttle";

// Or use lodash-es for better tree shaking
import { debounce, throttle } from "lodash-es";
```

### 4. Analyze Bundle Size

```bash
# iOS
npx react-native bundle \
  --platform ios \
  --dev false \
  --entry-file index.js \
  --bundle-output ios-bundle.js

# Check size
du -h ios-bundle.js

# Analyze with source-map-explorer
npm install -g source-map-explorer
npx react-native bundle \
  --platform ios \
  --dev false \
  --entry-file index.js \
  --bundle-output bundle.js \
  --sourcemap-output bundle.map

source-map-explorer bundle.js bundle.map
```

---

## Memory Management

### 1. Clean Up Subscriptions

```typescript
// ❌ Bad - Memory leak
useEffect(() => {
  const subscription = eventEmitter.on("update", handleUpdate);
  // No cleanup!
}, []);

// ✅ Good - Properly cleaned up
useEffect(() => {
  const subscription = eventEmitter.on("update", handleUpdate);

  return () => {
    subscription.remove();
  };
}, []);

// ✅ Good - Clean up timers
useEffect(() => {
  const interval = setInterval(() => {
    checkForUpdates();
  }, 5000);

  return () => {
    clearInterval(interval);
  };
}, []);
```

### 2. Avoid Memory Leaks with setState

```typescript
// ❌ Bad - setState after unmount
useEffect(() => {
  fetchData().then((data) => {
    setState(data); // May be called after unmount!
  });
}, []);

// ✅ Good - Cancel on unmount
useEffect(() => {
  let cancelled = false;

  fetchData().then((data) => {
    if (!cancelled) {
      setState(data);
    }
  });

  return () => {
    cancelled = true;
  };
}, []);

// ✅ Better - Use AbortController
useEffect(() => {
  const controller = new AbortController();

  fetch(url, { signal: controller.signal })
    .then((response) => response.json())
    .then((data) => setState(data))
    .catch((err) => {
      if (err.name !== "AbortError") {
        console.error(err);
      }
    });

  return () => {
    controller.abort();
  };
}, [url]);
```

### 3. Monitor Memory Usage

```typescript
import { PerformanceObserver } from "react-native-performance";

const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    if (entry.entryType === "memory") {
      console.log("Memory usage:", entry.usedJSHeapSize);
    }
  });
});

observer.observe({ entryTypes: ["memory"] });
```

---

## Network Optimization

### 1. Request Batching

```typescript
class RequestBatcher {
  private queue: Array<{ key: string; resolve: Function }> = [];
  private timeout: NodeJS.Timeout | null = null;

  add(key: string): Promise<any> {
    return new Promise((resolve) => {
      this.queue.push({ key, resolve });

      if (this.timeout) {
        clearTimeout(this.timeout);
      }

      this.timeout = setTimeout(() => {
        this.flush();
      }, 50); // Batch requests within 50ms
    });
  }

  private async flush() {
    if (this.queue.length === 0) return;

    const keys = this.queue.map((item) => item.key);
    const results = await api.fetchMultiple(keys);

    this.queue.forEach((item, index) => {
      item.resolve(results[index]);
    });

    this.queue = [];
  }
}

const batcher = new RequestBatcher();

// Usage
const household1 = await batcher.add("household-1");
const household2 = await batcher.add("household-2");
// Both requests batched into single API call
```

### 2. Request Caching

```typescript
import { QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

// Usage
const { data, isLoading } = useQuery({
  queryKey: ["household", id],
  queryFn: () => fetchHousehold(id),
  staleTime: 5 * 60 * 1000,
});
```

### 3. Prefetching

```typescript
import { useQueryClient } from '@tanstack/react-query';

function HouseholdList({ households }) {
  const queryClient = useQueryClient();

  const prefetchHousehold = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: ['household', id],
      queryFn: () => fetchHousehold(id),
    });
  };

  return (
    <FlatList
      data={households}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPressIn={() => prefetchHousehold(item.id)}
          onPress={() => navigation.navigate('HouseholdDetails', { id: item.id })}
        >
          <HouseholdCard household={item} />
        </TouchableOpacity>
      )}
    />
  );
}
```

---

## Startup Performance

### 1. Reduce Time to Interactive

```typescript
// ❌ Bad - Block startup with heavy operations
import './heavyModule'; // Slows down startup

function App() {
  const data = processHeavyData(); // Blocks rendering
  return <View>{data}</View>;
}

// ✅ Good - Defer heavy operations
import { lazy, Suspense } from 'react';

const HeavyModule = lazy(() => import('./HeavyModule'));

function App() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Defer heavy processing
    InteractionManager.runAfterInteractions(() => {
      const result = processHeavyData();
      setData(result);
    });
  }, []);

  return (
    <Suspense fallback={<LoadingScreen />}>
      <HeavyModule data={data} />
    </Suspense>
  );
}
```

### 2. Lazy Load Dependencies

```typescript
// ❌ Bad - Load everything upfront
import analytics from "./analytics";
import crashReporting from "./crashReporting";
import pushNotifications from "./pushNotifications";

// ✅ Good - Load on demand
const analytics = lazy(() => import("./analytics"));
const crashReporting = lazy(() => import("./crashReporting"));

// Only load when needed
useEffect(() => {
  import("./pushNotifications").then((module) => {
    module.init();
  });
}, []);
```

---

## Performance Monitoring

### 1. Track Render Times

```typescript
import { Profiler } from 'react';

function onRenderCallback(
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number
) {
  console.log(`${id} ${phase}:`, actualDuration);

  // Send to analytics
  analytics.track('component_render', {
    componentId: id,
    phase,
    duration: actualDuration,
  });
}

function App() {
  return (
    <Profiler id="App" onRender={onRenderCallback}>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </Profiler>
  );
}
```

### 2. Track Frame Drops

```typescript
import { PerformanceObserver } from "react-native-performance";

const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    if (entry.duration > 16.67) {
      // Frame took longer than 60 FPS (16.67ms)
      console.warn("Frame drop detected:", entry.duration);

      analytics.track("frame_drop", {
        duration: entry.duration,
        screen: currentScreen,
      });
    }
  });
});

observer.observe({ entryTypes: ["frame"] });
```

### 3. Monitor App Size

```typescript
import { NativeModules } from "react-native";

const appSize = await NativeModules.DeviceInfo.getTotalDiskCapacity();
console.log("App size:", appSize);

// Track in analytics
analytics.track("app_size", {
  sizeInMB: appSize / (1024 * 1024),
  platform: Platform.OS,
});
```

---

## Related Documentation

- [Mobile Development Guide](./README.md)
- [Platform-Specific Patterns](./platform-patterns.md)
- [React Native Performance Guide](https://reactnative.dev/docs/performance)

---

Built with 📱 by Maya (Mobile Development Agent)

**60 FPS is the minimum. Fast apps feel better.**
