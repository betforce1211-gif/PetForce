# Mobile Development Skill for PetForce

This skill provides mobile implementation checklists, iOS/Android patterns, mobile best practices, and platform-specific guidelines for the Maya mobile agent.

## Mobile Implementation Quality Checklist

**Version**: 1.0

### Offline-First & Network Handling
- Offline-first architecture implemented (network unreliability assumed)
- Graceful degradation when network unavailable
- Data sync strategy defined and implemented
- Loading, error, and offline states handled

### Platform Conventions
- iOS Human Interface Guidelines respected
- Android Material Design guidelines followed
- Platform-native navigation patterns used
- Safe areas respected (notch, home indicator)

### Touch & Interaction
- Touch targets meet minimum size (44pt iOS, 48dp Android)
- Touch feedback provided (haptics on iOS, ripple on Android)
- Gestures follow platform conventions
- Keyboard handling implemented correctly

### Performance & Optimization
- Renders at 60fps without jank
- App startup time meets targets (< 2s cold start)
- Memory usage optimized (< 100MB baseline)
- Battery impact minimized (background tasks limited)

### Permissions & States
- All permission states handled (granted, denied, not determined)
- Permission requests justified with clear messaging
- Dark mode supported
- Screen rotation handled appropriately

### Testing & Device Coverage
- Tested on real devices (not just simulators)
- Small, standard, and large screen sizes tested
- iOS and Android platforms tested
- Edge cases tested (interruptions, low memory, background/foreground)

## Platform-Specific Guidelines

### iOS (Human Interface Guidelines)

**Navigation:**
- Tab bar for main navigation (max 5 items)
- Navigation controller for hierarchical
- Modal for focused tasks

**Components:**
- Use SF Symbols for icons
- Native controls (UIKit/SwiftUI)
- Action sheets for choices
- Alerts for confirmations

**Touch:**
- Minimum 44x44pt touch targets
- Support haptic feedback
- Respect safe areas

### Android (Material Design)

**Navigation:**
- Bottom navigation (3-5 items)
- Navigation drawer for more
- Top app bar with actions

**Components:**
- Material 3 components
- FAB for primary action
- Snackbars for feedback
- Bottom sheets for details

**Touch:**
- Minimum 48x48dp touch targets
- Ripple effects for feedback
- Edge-to-edge content

### Cross-Platform Differences

```
                    iOS              Android
─────────────────────────────────────────────────
Back navigation     Swipe/button     System back
Tab position        Bottom           Bottom
Primary action      Top right        FAB
Pull to refresh     Native           Custom impl
Share              Activity View     Share sheet
Typography         SF Pro            Roboto
```

## Architecture Patterns

### Recommended Architecture
```
UI Layer
   │
   ▼
 ViewModel/Controller (State Management)
   │
   ▼
Repository (Data abstraction)
   │
   ├──────────────┐
   ▼              ▼
Remote API     Local Storage
(Network)      (Cache/DB)
```

### State Management
- **iOS**: @Observable, Combine
- **Android**: ViewModel, StateFlow
- **React Native**: Zustand, Redux Toolkit
- **Flutter**: Riverpod, BLoC

## Performance Targets

### Startup Time
- Cold start: < 2 seconds
- Warm start: < 1 second
- Hot start: < 0.5 seconds

### Rendering
- Frame rate: 60fps (16ms per frame)
- Input latency: < 100ms
- Animation: 60fps, no jank

### Network
- API timeout: 30 seconds
- Retry logic: Exponential backoff
- Cache: Aggressive, offline-first
- Payload: < 100KB per request

### App Size
- iOS: < 50MB (ideally < 30MB)
- Android: < 30MB (ideally < 20MB)

## Testing Checklist

### Functional
- All user flows work
- Offline mode works
- Push notifications received
- Deep links handled
- Permissions gracefully handled

### Device Coverage

**iOS:**
- iPhone SE (small)
- iPhone 15 (standard)
- iPhone 15 Pro Max (large)
- iPad (if supported)

**Android:**
- Small phone (5")
- Standard phone (6")
- Large phone (6.7")
- Tablet (if supported)

### Edge Cases
- No network
- Slow network
- Background/foreground
- Low memory
- Interruptions (calls, etc.)
- Screen rotation
- Dark/light mode

## Mobile Best Practices

### Always Do
1. Design for offline-first (network is unreliable)
2. Respect platform conventions (iOS ≠ Android)
3. Optimize for 60fps rendering
4. Use proper touch targets (44pt iOS, 48dp Android)
5. Handle all permission states gracefully
6. Support dark mode
7. Test on real devices
8. Implement proper error states
9. Use platform-native navigation patterns
10. Consider battery and data usage

### Never Do
1. Ignore platform design guidelines
2. Skip offline handling
3. Use tiny touch targets
4. Request unnecessary permissions
5. Block the main thread
6. Ignore safe areas (notch, home indicator)
7. Forget loading and error states
8. Ship without testing on real devices
9. Ignore accessibility
10. Drain battery with background tasks

## App Store Guidelines

### App Store Optimization (ASO)

**App Metadata:**
- App name: Include main keyword (30 chars iOS, 50 Android)
- Subtitle/Short desc: Compelling hook (30/80 chars)
- Keywords: Research & target relevant terms
- Description: Benefits first, features second
- What's New: Highlight improvements

**Visual Assets:**
- Icon: Simple, recognizable, no text
- Screenshots: Show key features, add captions
- Preview video: First 3 seconds crucial
- Feature graphic (Android): 1024x500px

**Ratings & Reviews:**
- Prompt for ratings at right moment
- Respond to all reviews
- Address negative feedback quickly
- Update regularly to maintain visibility

### Common Rejection Reasons

**iOS App Store:**
- Guideline 2.1 - App Completeness: Crashes, bugs, placeholder content
- Guideline 2.3 - Accurate Metadata: Screenshots don't match app
- Guideline 3.1.1 - In-App Purchase: Using external payment for digital content
- Guideline 4.2 - Minimum Functionality: Too simple, just a website wrapper
- Guideline 5.1.1 - Data Collection: Missing privacy policy, unclear data use

**Google Play Store:**
- Policy: Deceptive Behavior - Misleading claims, fake functionality
- Policy: User Data - Missing privacy policy, unclear permissions
- Policy: Monetization - Misleading free claims with required purchases
- Policy: Content Rating - Incorrect rating for content

## Configuration Reference

Maya reads settings from `.maya.yml` in the repository root. Key configuration areas:

### Project
- Name, bundle ID, version, build number

### Platforms
- iOS: minimum version, target devices, capabilities
- Android: minimum/target SDK, permissions

### Framework
- Type: react-native | flutter | native
- Framework-specific settings

### Architecture
- Pattern: MVVM, MVC, Clean, BLoC
- State management per platform
- Navigation strategy

### Networking
- Base URL, timeout, retry logic
- Caching strategy
- Offline support

### Storage
- Secure storage for credentials
- Local database (SQLite, Realm, Hive)
- Cache configuration

### Authentication
- Methods (email, Apple, Google)
- Token storage
- Biometric support

### Push Notifications
- iOS: APNs
- Android: FCM
- Channel configuration

### Performance
- Targets for startup time, frame rate
- Monitoring providers
- Optimization flags

### Testing
- Coverage thresholds
- E2E framework
- Device matrix

### CI/CD
- Provider, signing, distribution
- Environment URLs

### App Store
- Store IDs, metadata
- Screenshot sizes

## Integration with Other Agents

### Maya ↔ Engrid (Engineering)
- API design for mobile consumption
- Pagination, compression
- Offline sync endpoints
- Push notification infrastructure

### Maya ↔ Dexter (Design)
- Platform-specific design tokens
- Touch target requirements
- Safe area considerations
- Motion/animation specs

### Maya ↔ Chuck (CI/CD)
- Mobile build pipelines
- Code signing automation
- App store deployment
- Screenshot automation

### Maya ↔ Tucker (QA)
- Mobile-specific test cases
- Device coverage
- Offline testing
- Performance testing
