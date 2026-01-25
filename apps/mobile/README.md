# PetForce Mobile App

React Native mobile app for PetForce built with Expo.

## Features

- **Multi-platform Authentication:**
  - Email/Password authentication
  - Magic link (passwordless)
  - Google SSO
  - Apple SSO
  - Biometric authentication (Face ID, Touch ID, Fingerprint)

- **Cross-platform:**
  - iOS (iPhone, iPad)
  - Android (phone, tablet)

- **Beautiful UX:**
  - Pet-loving design theme
  - Smooth animations
  - Responsive layouts
  - Accessibility support

## Prerequisites

- Node.js 20.19.4 or higher
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (macOS) or Android Emulator
- Physical device for testing biometrics

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and add your Supabase credentials
   ```

3. **Configure Supabase:**
   - Create a Supabase project at https://supabase.com
   - Enable OAuth providers (Google, Apple) in Authentication > Providers
   - Add redirect URLs:
     - `petforce://auth/callback` (mobile deep link)
     - `https://yourapp.com/auth/callback` (if using custom domain)

## Running the App

### Development Mode

```bash
# Start the development server
npm start

# Or run on specific platform
npm run ios      # iOS Simulator
npm run android  # Android Emulator
npm run web      # Web browser (for testing)
```

### Running on Physical Device

1. Install the Expo Go app on your iOS or Android device
2. Scan the QR code from the terminal
3. The app will load on your device

**Note:** Biometric authentication requires a physical device and won't work in simulators/emulators.

## Project Structure

```
src/
├── components/
│   └── ui/              # Reusable UI components (Button, Input, Card)
├── features/
│   └── auth/
│       ├── components/  # Auth-specific components
│       └── screens/     # Auth screens (Welcome, Login, Register, etc.)
└── navigation/
    ├── types.ts         # Navigation type definitions
    ├── AuthNavigator.tsx    # Auth flow navigation
    ├── AppNavigator.tsx     # Main app navigation
    └── RootNavigator.tsx    # Root navigation with auth switching
```

## Deep Linking

The app supports deep linking for OAuth callbacks and magic links:

- `petforce://auth/callback` - OAuth callback
- `petforce://auth/magic-link` - Magic link verification

Configure these URLs in:
- `app.json` - Expo configuration
- Supabase dashboard - OAuth redirect URLs

## Building for Production

### iOS

```bash
# Build for iOS
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

### Android

```bash
# Build for Android
eas build --platform android

# Submit to Play Store
eas submit --platform android
```

## Testing Biometric Authentication

1. Enable biometrics on your device:
   - **iOS:** Settings > Face ID & Passcode or Touch ID & Passcode
   - **Android:** Settings > Security > Biometric

2. Run the app on a physical device

3. Navigate to Settings > Enable Biometric Login

4. Follow the prompts to enable biometric authentication

## Troubleshooting

### Metro bundler issues

```bash
# Clear cache and restart
npm start -- --reset-cache
```

### Dependency issues

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### iOS build issues

```bash
# Clean iOS build folder
cd ios && xcodebuild clean && cd ..
```

### Android build issues

```bash
# Clean Android build
cd android && ./gradlew clean && cd ..
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key | Yes |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Legacy support (same as publishable) | No |

## Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Supabase Documentation](https://supabase.com/docs)
- [expo-local-authentication](https://docs.expo.dev/versions/latest/sdk/local-authentication/)

## License

Copyright © 2026 PetForce
