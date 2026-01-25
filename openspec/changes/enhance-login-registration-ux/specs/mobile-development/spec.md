# Capability: Mobile Development (Modifications)

## ADDED Requirements

### Requirement: Setup React Native Infrastructure

PetForce mobile apps (iOS and Android) MUST be built with React Native to maximize code sharing with the web app.

#### Scenario: Initialize React Native app with Expo

**Given** Maya is setting up the mobile app
**When** they create the project
**Then** they use Expo to initialize a new React Native app
**And** the project is configured with TypeScript
**And** the project is added to the monorepo workspace
**And** the project can access shared packages (`@petforce/auth`, `@petforce/ui`)
**And** the app runs on iOS simulator without errors
**And** the app runs on Android emulator without errors

#### Scenario: Configure deep linking for mobile app

**Given** Maya is setting up deep linking
**When** they configure the app
**Then** the app registers a custom URL scheme: `petforce://`
**And** the app is configured with universal links (iOS) and app links (Android)
**And** the app can handle deep links for auth callbacks: `petforce://auth/callback`
**And** the app can handle deep links for email verification: `petforce://auth/verify`
**And** the app can handle deep links for password reset: `petforce://auth/reset`
**And** clicking a deep link in an email opens the app (not the browser)

### Requirement: Implement Biometric Authentication

Mobile apps MUST support platform-specific biometric authentication for convenience and security.

#### Scenario: Check biometric availability on device

**Given** a user opens the app on their mobile device
**When** the app checks for biometric support
**Then** the app detects if Face ID is available (iOS with Face ID)
**Or** the app detects if Touch ID is available (iOS with Touch ID, macOS)
**Or** the app detects if fingerprint is available (Android)
**And** the app gracefully handles devices without biometric support
**And** the app handles cases where biometric is available but not enrolled

#### Scenario: Enroll user in biometric authentication

**Given** a user has just logged in successfully for the first time
**And** their device supports biometric authentication
**And** they have not previously enrolled or declined
**When** the biometric enrollment prompt is shown
**And** they tap "Enable [Face ID/Touch ID/Fingerprint]"
**Then** the app requests biometric permissions (if needed)
**And** the app generates and stores a biometric key pair
**And** the public key is sent to the backend (for verification)
**And** the user's encrypted credentials are stored in the device's secure storage
**And** a success message is shown: "Biometric authentication enabled"
**And** on the next app open, the biometric prompt is shown automatically

#### Scenario: Authenticate user with biometrics

**Given** a user has enrolled biometric authentication
**And** they open the app
**When** the app detects they are logged out
**Then** the biometric prompt is shown automatically
**And** the prompt message is: "Authenticate to access PetForce"
**And** a "Use password instead" button is available
**When** they successfully authenticate with biometrics
**Then** the app retrieves their encrypted credentials from secure storage
**And** the app authenticates with the backend using those credentials
**And** they are logged in and redirected to the dashboard
**And** the login event is tracked with method="biometric"

#### Scenario: Handle biometric authentication failure

**Given** a user is attempting to authenticate with biometrics
**When** the biometric authentication fails (wrong face/finger, cancelled, etc.)
**Then** the app shows the login form with email/password fields
**And** a message is shown: "Biometric authentication failed. Please sign in with your password."
**And** their email is pre-filled (if available)
**And** they can login with their password as a fallback

### Requirement: Integrate OAuth Providers on Mobile

Mobile apps MUST support Google and Apple SSO with native SDKs for the best user experience.

#### Scenario: Implement Google Sign-In on mobile

**Given** Maya is implementing Google SSO
**When** they integrate the Google Sign-In SDK
**Then** they use `@react-native-google-signin/google-signin` package
**And** they configure the Google OAuth client IDs for iOS and Android
**And** the "Sign in with Google" button follows Google's branding guidelines
**When** a user taps the Google button
**Then** the native Google Sign-In sheet is shown
**And** the user authenticates with their Google account
**And** the app receives the OAuth tokens
**And** the app sends the tokens to the backend for verification
**And** the user is logged in and redirected to the dashboard

#### Scenario: Implement Apple Sign-In on mobile

**Given** Maya is implementing Apple SSO
**When** they integrate Sign in with Apple
**Then** they use `@invertase/react-native-apple-authentication` package
**And** they configure the Apple Sign In capability in Xcode
**And** the "Sign in with Apple" button follows Apple's branding guidelines
**When** a user taps the Apple button
**Then** the native Apple Sign-In sheet is shown
**And** the user authenticates with Face ID, Touch ID, or password
**And** the user can choose to hide their email (relay email)
**And** the app receives the OAuth tokens
**And** the app sends the tokens to the backend for verification
**And** the user is logged in and redirected to the dashboard

### Requirement: Optimize Mobile UI/UX

Mobile apps MUST feel native and follow platform-specific design guidelines while maintaining brand consistency.

#### Scenario: Use platform-appropriate navigation

**Given** Maya is implementing navigation
**When** they set up React Navigation
**Then** they use stack navigation for auth flows (back button in header)
**And** they use tab navigation for the main app (bottom tabs on iOS, bottom tabs or drawer on Android)
**And** transitions feel native (slide from right on iOS, fade/slide on Android)
**And** navigation follows platform conventions (back button placement, header styles)

#### Scenario: Handle keyboard interactions gracefully

**Given** a user is filling out a form on mobile
**When** they tap an input field
**Then** the keyboard slides up smoothly
**And** the input field scrolls into view (not hidden by keyboard)
**And** the form content adjusts to the keyboard height (KeyboardAvoidingView)
**When** they submit the form or tap outside
**Then** the keyboard dismisses smoothly
**And** the content returns to normal layout

#### Scenario: Add platform-specific polish

**Given** Maya is polishing the mobile experience
**When** they add interactions
**Then** buttons have native press feedback (scale animation on iOS, ripple on Android)
**And** haptic feedback is used on key actions (button press, success, error)
**And** loading spinners use platform-specific styles (ActivityIndicator)
**And** alerts and modals use platform-appropriate components (Alert on iOS, Modal/Portal on Android)

### Requirement: Implement Secure Storage on Mobile

Sensitive data like auth tokens and biometric credentials MUST be stored securely on mobile devices.

#### Scenario: Store authentication tokens securely

**Given** a user successfully logs in on mobile
**When** the app receives auth tokens
**Then** the tokens are encrypted before storage
**And** the tokens are stored in the device's secure storage:
  - iOS: Keychain Services
  - Android: EncryptedSharedPreferences or Android Keystore
**And** the tokens persist across app restarts
**And** the tokens are cleared on logout
**And** the tokens are never logged or exposed in plain text

#### Scenario: Handle biometric key storage

**Given** a user enrolls in biometric authentication
**When** biometric keys are generated
**Then** the public key is sent to the backend
**And** the private key never leaves the device
**And** the private key is stored in the Secure Enclave (iOS) or Keystore (Android)
**And** the private key can only be accessed with biometric authentication

## Quality Checklist

When implementing or modifying this capability, ensure:

- [ ] React Native app runs on iOS and Android without errors
- [ ] Deep linking works for all auth flows (OAuth callback, email verification, password reset)
- [ ] Biometric authentication works on iOS (Face ID, Touch ID) and Android (fingerprint)
- [ ] Biometric enrollment prompt shows at appropriate time
- [ ] Biometric failure falls back to password login gracefully
- [ ] Google SSO works with native SDK and follows branding guidelines
- [ ] Apple SSO works with native SDK and follows branding guidelines
- [ ] Navigation follows platform conventions
- [ ] Keyboard handling is smooth and doesn't hide inputs
- [ ] Buttons have native press feedback
- [ ] Haptic feedback is used appropriately
- [ ] Loading spinners and alerts use platform-appropriate styles
- [ ] Auth tokens are stored securely (Keychain on iOS, Keystore on Android)
- [ ] Biometric keys are stored in Secure Enclave/Keystore
- [ ] No sensitive data is logged or exposed
- [ ] App passes App Store review (iOS) and Play Store review (Android)
- [ ] App icon and splash screen are implemented
- [ ] App works offline (shows appropriate error messages)

## Notes

This modification adds React Native infrastructure and mobile-specific authentication features to the Mobile Development capability. The focus is on:
1. Maximum code sharing with web app
2. Native feel with platform-appropriate patterns
3. Security (secure storage, biometric authentication)
4. Polish (animations, haptics, keyboard handling)
