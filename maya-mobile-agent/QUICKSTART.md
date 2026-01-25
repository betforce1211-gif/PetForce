# Maya Mobile Agent - Quick Start Guide

Get a mobile app running in 15 minutes.

## Choose Your Path

- [React Native](#react-native) (JavaScript/TypeScript teams)
- [Flutter](#flutter) (Dart, custom UI focus)
- [Native iOS](#native-ios) (Swift/SwiftUI)
- [Native Android](#native-android) (Kotlin/Compose)

---

## React Native

### Prerequisites
- Node.js 18+
- Xcode (for iOS)
- Android Studio (for Android)

### Step 1: Create Project

```bash
npx react-native@latest init MyApp
cd MyApp
```

### Step 2: Install Core Dependencies

```bash
# Navigation
npm install @react-navigation/native @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context

# State Management
npm install zustand

# Async Storage
npm install @react-native-async-storage/async-storage

# Fast Image
npm install react-native-fast-image

# Haptics
npm install react-native-haptic-feedback

# For iOS
cd ios && pod install && cd ..
```

### Step 3: Project Structure

```bash
mkdir -p src/{features,components,hooks,services,theme,types,utils}
mkdir -p src/features/{home,profile,settings}
```

```
src/
├── features/
│   ├── home/
│   │   ├── HomeScreen.tsx
│   │   └── useHome.ts
│   └── profile/
├── components/
│   ├── Button.tsx
│   └── Card.tsx
├── hooks/
│   └── useApi.ts
├── services/
│   └── api.ts
├── theme/
│   ├── colors.ts
│   └── spacing.ts
└── types/
    └── index.ts
```

### Step 4: Create Theme

```typescript
// src/theme/colors.ts
export const colors = {
  primary: '#6366F1',
  secondary: '#8B5CF6',
  background: '#FFFFFF',
  surface: '#F9FAFB',
  text: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  error: '#EF4444',
  success: '#10B981',
};

// src/theme/spacing.ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
```

### Step 5: Create First Screen

```typescript
// src/features/home/HomeScreen.tsx
import React from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHome } from './useHome';
import { colors, spacing } from '../../theme';

export const HomeScreen: React.FC = () => {
  const { items, isLoading, refresh } = useHome();

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.title}>{item.title}</Text>
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} />
        }
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.md,
  },
  item: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 16,
    color: colors.text,
  },
});
```

### Step 6: Run

```bash
# iOS
npm run ios

# Android
npm run android
```

---

## Flutter

### Prerequisites
- Flutter SDK 3.16+
- Xcode (for iOS)
- Android Studio (for Android)

### Step 1: Create Project

```bash
flutter create my_app
cd my_app
```

### Step 2: Add Dependencies

```yaml
# pubspec.yaml
dependencies:
  flutter:
    sdk: flutter
  flutter_riverpod: ^2.4.0
  go_router: ^12.0.0
  dio: ^5.3.0
  flutter_secure_storage: ^9.0.0
  cached_network_image: ^3.3.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0
```

```bash
flutter pub get
```

### Step 3: Project Structure

```
lib/
├── main.dart
├── app/
│   ├── app.dart
│   └── routes.dart
├── features/
│   └── home/
│       ├── home_screen.dart
│       └── home_controller.dart
├── shared/
│   ├── widgets/
│   └── theme/
└── core/
    ├── network/
    └── storage/
```

### Step 4: Create App

```dart
// lib/main.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app/app.dart';

void main() {
  runApp(
    const ProviderScope(
      child: MyApp(),
    ),
  );
}

// lib/app/app.dart
import 'package:flutter/material.dart';
import 'routes.dart';

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'My App',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF6366F1)),
        useMaterial3: true,
      ),
      routerConfig: router,
    );
  }
}
```

### Step 5: Run

```bash
# iOS
flutter run -d ios

# Android  
flutter run -d android
```

---

## Native iOS

### Prerequisites
- Xcode 15+
- macOS

### Step 1: Create Project
1. Open Xcode
2. File → New → Project
3. Choose "App"
4. Select SwiftUI for Interface
5. Select Swift for Language

### Step 2: Project Structure

```
MyApp/
├── App/
│   └── MyAppApp.swift
├── Features/
│   └── Home/
│       ├── HomeView.swift
│       └── HomeViewModel.swift
├── Core/
│   └── Network/
│       └── APIClient.swift
└── UI/
    └── Components/
        └── PrimaryButton.swift
```

### Step 3: Create First View

```swift
// Features/Home/HomeView.swift
import SwiftUI

struct HomeView: View {
    @StateObject private var viewModel = HomeViewModel()
    
    var body: some View {
        NavigationStack {
            List(viewModel.items) { item in
                Text(item.title)
            }
            .navigationTitle("Home")
            .refreshable {
                await viewModel.refresh()
            }
            .task {
                await viewModel.loadItems()
            }
        }
    }
}

// Features/Home/HomeViewModel.swift
import Foundation

@MainActor
class HomeViewModel: ObservableObject {
    @Published private(set) var items: [Item] = []
    @Published private(set) var isLoading = false
    
    func loadItems() async {
        isLoading = true
        // Fetch items
        isLoading = false
    }
    
    func refresh() async {
        await loadItems()
    }
}
```

### Step 4: Run
- Press Cmd+R or click the Play button

---

## Native Android

### Prerequisites
- Android Studio (latest)
- JDK 17

### Step 1: Create Project
1. Open Android Studio
2. New Project
3. Choose "Empty Activity" (Compose)
4. Select Kotlin

### Step 2: Add Dependencies

```kotlin
// build.gradle.kts (app)
dependencies {
    // Compose BOM
    implementation(platform("androidx.compose:compose-bom:2024.01.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    
    // Navigation
    implementation("androidx.navigation:navigation-compose:2.7.6")
    
    // ViewModel
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")
    
    // Hilt
    implementation("com.google.dagger:hilt-android:2.48")
    kapt("com.google.dagger:hilt-compiler:2.48")
    
    // Retrofit
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    
    // Coil for images
    implementation("io.coil-kt:coil-compose:2.5.0")
}
```

### Step 3: Create First Screen

```kotlin
// features/home/HomeScreen.kt
@Composable
fun HomeScreen(
    viewModel: HomeViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    
    Scaffold(
        topBar = {
            TopAppBar(title = { Text("Home") })
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentPadding = PaddingValues(16.dp)
        ) {
            items(uiState.items) { item ->
                ItemCard(item = item)
            }
        }
    }
}

// features/home/HomeViewModel.kt
@HiltViewModel
class HomeViewModel @Inject constructor(
    private val repository: ItemRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()
    
    init {
        loadItems()
    }
    
    private fun loadItems() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            val items = repository.getItems()
            _uiState.update { it.copy(items = items, isLoading = false) }
        }
    }
}
```

### Step 4: Run
- Press Shift+F10 or click the Run button

---

## Mobile Development Checklist

### Before Development
- [ ] Define target platforms (iOS/Android/both)
- [ ] Choose framework (Native/RN/Flutter)
- [ ] Set up development environment
- [ ] Design app architecture

### During Development
- [ ] Follow platform guidelines
- [ ] Implement offline support
- [ ] Handle all loading/error states
- [ ] Test on real devices
- [ ] Profile performance regularly

### Before Release
- [ ] Test on multiple device sizes
- [ ] Test offline behavior
- [ ] Verify push notifications
- [ ] Check accessibility
- [ ] Prepare store assets
- [ ] Write release notes

---

## Next Steps

1. 📖 Read the full [MAYA.md](./MAYA.md) documentation
2. 🎨 Coordinate with Dexter on design
3. 🔌 Work with Engrid on API design
4. 🧪 Plan testing strategy with Tucker
5. 🚀 Set up CI/CD with Chuck

---

*Maya: Mobile first isn't just a strategy. It's where your users live.* 📱
