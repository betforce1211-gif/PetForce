# 📱 Maya: The Mobile Development Agent

> *Mobile first isn't just a strategy. It's where your users live.*

Maya is a comprehensive Mobile Development agent powered by Claude Code. She builds native and cross-platform mobile experiences that users love. When Maya builds mobile apps, they're fast, intuitive, and feel right at home on any device.

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Native Development** | iOS (Swift/SwiftUI), Android (Kotlin/Compose) |
| **Cross-Platform** | React Native, Flutter expertise |
| **Performance** | 60fps rendering, fast startup, optimized memory |
| **Offline-First** | Works without network, syncs when connected |
| **Platform UX** | iOS & Android design guidelines compliance |
| **App Store** | Submission guidance, ASO, review compliance |

## 📁 Package Contents

```
maya-mobile-agent/
├── MAYA.md                               # Full mobile development documentation
├── CLAUDE.md                             # Claude Code agent configuration
├── README.md                             # This file
├── QUICKSTART.md                         # 10-minute setup guide
├── .maya.yml                             # Mobile project configuration
└── templates/
    ├── rn-screen.tsx.template            # React Native screen template
    └── rn-hook.ts.template               # React Native custom hook template
```

## 🚀 Quick Start

### React Native (Recommended for JS teams)
```bash
npx react-native init MyApp
cd MyApp
# Copy Maya's templates
cp maya-mobile-agent/templates/* src/
```

### Flutter
```bash
flutter create my_app
cd my_app
```

### Native iOS
```bash
# Create project in Xcode with SwiftUI
```

**[📖 Full Setup Guide →](./QUICKSTART.md)**

## 📊 Platform Decision Matrix

| Factor | Native | React Native | Flutter |
|--------|--------|--------------|---------|
| **Performance** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Dev Speed** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Code Sharing** | ⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Native Feel** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Team Fit (JS)** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

**Quick Decision:**
- Team knows JavaScript? → **React Native**
- Need pixel-perfect custom UI? → **Flutter**
- Maximum performance/platform integration? → **Native**

## ⚡ Performance Targets

| Metric | Target | Critical |
|--------|--------|----------|
| Cold Start | < 2s | < 3s |
| Frame Rate | 60fps | 30fps |
| Memory | < 100MB | < 200MB |
| App Size (iOS) | < 50MB | < 100MB |
| App Size (Android) | < 30MB | < 50MB |

## 🎯 Platform Guidelines

### iOS (Human Interface Guidelines)
- Tab bar for main navigation (max 5)
- SF Symbols for icons
- 44pt minimum touch targets
- Respect safe areas

### Android (Material Design)
- Bottom navigation or nav drawer
- FAB for primary action
- 48dp minimum touch targets
- Edge-to-edge content

## 🤖 Using with Claude Code

```
You: Build a product list screen for our e-commerce app

Maya: 📱 Building Product List Screen

Platform: React Native (based on your stack)

Components:
1. ProductListScreen.tsx - Main screen with FlatList
2. useProducts.ts - Data fetching hook
3. ProductCard.tsx - Reusable card component

Features:
✅ Pull-to-refresh
✅ Infinite scroll pagination
✅ Loading/error/empty states
✅ Offline caching
✅ Optimized for 60fps

Let me implement this for you...
```

## 🎯 Maya's Commands

### Development
```bash
maya run ios              # Run on iOS simulator
maya run android          # Run on Android emulator
maya build --release      # Build release version
```

### Testing
```bash
maya test                 # Run all tests
maya test e2e             # Run E2E tests
maya perf profile         # Profile performance
```

### Deployment
```bash
maya deploy testflight    # Deploy to TestFlight
maya deploy internal      # Deploy to Play Internal
maya deploy production    # Deploy to stores
```

## 🤝 Integration with Other Agents

| Agent | Integration |
|-------|-------------|
| **Engrid** | API design for mobile (pagination, offline sync) |
| **Dexter** | Platform-specific design tokens & components |
| **Chuck** | Mobile CI/CD pipelines, code signing |
| **Tucker** | Mobile-specific test coverage |

## 📋 Configuration

Maya uses `.maya.yml`:

```yaml
version: 1

platforms:
  ios:
    minimum_version: "15.0"
  android:
    minimum_sdk: 24

framework:
  type: react-native
  version: "0.73"

performance:
  targets:
    cold_start_ms: 2000
    frame_rate_fps: 60

offline:
  enabled: true
  sync_on_reconnect: true
```

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [MAYA.md](./MAYA.md) | Complete mobile development documentation |
| [CLAUDE.md](./CLAUDE.md) | Claude Code configuration |
| [QUICKSTART.md](./QUICKSTART.md) | 10-minute setup guide |

## 📋 Templates

| Template | Use For |
|----------|---------|
| `rn-screen.tsx.template` | React Native screen with hooks |
| `rn-hook.ts.template` | Custom hook pattern |

---

<p align="center">
  <strong>Maya: Your Mobile Development Partner</strong><br>
  <em>Building apps users love.</em>
</p>

---

*Mobile first isn't just a strategy. It's where your users live.* 📱
