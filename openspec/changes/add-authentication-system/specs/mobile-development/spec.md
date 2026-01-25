# mobile-development Specification Delta

## ADDED Requirements

### Requirement: Implement Biometric Authentication on iOS/macOS
The system SHALL integrate platform-native biometric authentication (Face ID, Touch ID) for iOS and macOS applications.

#### Scenario: Implement biometric enrollment
- **GIVEN** a user successfully logs in on iOS/macOS
- **WHEN** implementing biometric enrollment
- **THEN** app SHALL check if biometric authentication is available (LAContext.canEvaluatePolicy)
- **AND** app SHALL check biometric type (faceID or touchID)
- **AND** app SHALL show enrollment prompt after first login
- **AND** prompt SHALL use PetForce-branded UI ("Enable Face ID for faster login?")
- **AND** user SHALL be able to opt-in, opt-out, or dismiss with "Don't ask again"
- **AND** enrollment SHALL generate public/private key pair on device
- **AND** app SHALL send public key and device info to backend
- **AND** app SHALL store biometric preference locally (UserDefaults or Keychain)

#### Scenario: Authenticate with biometrics
- **GIVEN** user has enrolled biometric authentication
- **WHEN** user opens app on enrolled device
- **THEN** app SHALL check biometric availability
- **AND** app SHALL show platform-native biometric prompt (LAContext.evaluatePolicy)
- **AND** biometric prompt SHALL use custom reason ("Sign in to PetForce with Face ID")
- **AND** successful biometric verification SHALL sign challenge with private key
- **AND** app SHALL send deviceId and signature to backend
- **AND** backend verification SHALL return access and refresh tokens
- **AND** app SHALL store tokens securely in Keychain
- **AND** failed biometric SHALL show fallback options (password, magic link)

#### Scenario: Handle biometric enrollment edge cases
- **GIVEN** various device states
- **WHEN** handling biometric enrollment
- **THEN** app SHALL gracefully handle biometric not available (no hardware, disabled, no enrolled biometrics)
- **AND** app SHALL handle biometric changed (user re-enrolled biometrics on device)
- **AND** app SHALL handle biometric lockout (too many failed attempts)
- **AND** app SHALL allow user to disable biometrics in settings
- **AND** app SHALL remove device registration when biometrics disabled
- **AND** app SHALL re-prompt for enrollment if biometric becomes available later

### Requirement: Implement Secure Token Storage on Mobile
The system SHALL store authentication tokens securely in platform keychain.

#### Scenario: Store tokens in iOS/macOS Keychain
- **GIVEN** user successfully authenticates
- **WHEN** storing tokens
- **THEN** access token SHALL be stored in Keychain (kSecClassGenericPassword)
- **AND** refresh token SHALL be stored in Keychain
- **AND** Keychain items SHALL use kSecAttrAccessibleAfterFirstUnlock
- **AND** Keychain items SHALL be tied to app identifier (kSecAttrService)
- **AND** tokens SHALL be encrypted at rest by platform
- **AND** tokens SHALL not be accessible when device is locked (if using stricter accessibility)

#### Scenario: Retrieve tokens from Keychain
- **GIVEN** authenticated user opens app
- **WHEN** retrieving tokens
- **THEN** app SHALL retrieve access token from Keychain
- **AND** app SHALL check access token expiration
- **AND** expired access token SHALL trigger refresh flow
- **AND** app SHALL retrieve refresh token for refresh flow
- **AND** Keychain access failures SHALL log user out gracefully

#### Scenario: Handle token lifecycle on mobile
- **GIVEN** user is authenticated
- **WHEN** managing tokens
- **THEN** app SHALL refresh access token automatically before expiration
- **AND** app SHALL handle refresh token expiration (redirect to login)
- **AND** logout SHALL delete all tokens from Keychain
- **AND** password change SHALL delete tokens and re-authenticate
- **AND** app uninstall SHALL clear Keychain items automatically

### Requirement: Implement OAuth Flow for Mobile Apps
The system SHALL implement secure OAuth 2.0 flows for Google and Apple Sign In on mobile.

#### Scenario: Implement Google Sign In on iOS
- **GIVEN** user chooses "Sign in with Google"
- **WHEN** implementing Google OAuth
- **THEN** app SHALL use GoogleSignIn SDK (recommended) or ASWebAuthenticationSession
- **AND** app SHALL implement PKCE (Proof Key for Code Exchange)
- **AND** app SHALL request minimal scopes (email, profile)
- **AND** app SHALL handle OAuth callback via URL scheme or universal link
- **AND** app SHALL exchange authorization code for tokens on backend (not client-side)
- **AND** app SHALL handle OAuth cancellation gracefully
- **AND** app SHALL handle OAuth errors (user denied, network error)

#### Scenario: Implement Apple Sign In on iOS
- **GIVEN** user chooses "Sign in with Apple"
- **WHEN** implementing Apple OAuth
- **THEN** app SHALL use AuthenticationServices framework (ASAuthorizationController)
- **AND** app SHALL request email and full name scopes
- **AND** app SHALL support "Hide My Email" feature
- **AND** app SHALL handle authorization callback
- **AND** app SHALL send identity token to backend for verification
- **AND** app SHALL handle Apple Sign In errors
- **AND** app SHALL follow Apple's UI guidelines for Sign in with Apple button

### Requirement: Implement Deep Linking for Email Verification and Password Reset
The system SHALL handle email verification and password reset links that open the mobile app.

#### Scenario: Handle deep links for email verification
- **GIVEN** user clicks email verification link on mobile device
- **WHEN** implementing deep link handling
- **THEN** link SHALL use universal link (iOS) or app link (Android)
- **AND** link SHALL fall back to opening in browser if app not installed
- **AND** app SHALL parse verification token from URL
- **AND** app SHALL call verification API with token
- **AND** successful verification SHALL navigate to onboarding or dashboard
- **AND** failed verification SHALL show error with option to resend
- **AND** app SHALL handle case where user is already logged in

#### Scenario: Handle deep links for password reset
- **GIVEN** user clicks password reset link on mobile device
- **WHEN** implementing deep link handling
- **THEN** link SHALL open password reset screen in app
- **AND** app SHALL parse reset token from URL
- **AND** app SHALL show new password form
- **AND** successful reset SHALL log user in automatically
- **AND** failed/expired token SHALL show error with option to request new reset

### Requirement: Optimize Mobile Authentication UX
The system SHALL provide smooth, native-feeling authentication experience on mobile.

#### Scenario: Implement autofill for email and password
- **GIVEN** user is on login/registration screen
- **WHEN** implementing autofill
- **THEN** email field SHALL use textContentType = .emailAddress
- **AND** password field SHALL use textContentType = .password (login) or .newPassword (registration)
- **AND** fields SHALL integrate with iCloud Keychain password autofill
- **AND** app SHALL configure associated domains for password autofill
- **AND** registration SHALL trigger password save prompt

#### Scenario: Handle keyboard and form navigation
- **GIVEN** user is filling authentication form
- **WHEN** implementing keyboard handling
- **THEN** keyboard SHALL show appropriate type (email keyboard, password keyboard)
- **AND** "Next" button SHALL move between fields logically
- **AND** "Done" on last field SHALL submit form
- **AND** keyboard SHALL not cover submit button (adjust scroll view)
- **AND** tapping outside SHALL dismiss keyboard

#### Scenario: Implement loading and error states
- **GIVEN** authentication requests are in progress
- **WHEN** implementing loading states
- **THEN** buttons SHALL show loading spinner during API calls
- **AND** form SHALL be disabled during loading
- **AND** network errors SHALL show retry button
- **AND** validation errors SHALL appear inline near fields
- **AND** success states SHALL animate smoothly to next screen

### Requirement: Support Offline Authentication Scenarios
The system SHALL handle offline scenarios gracefully.

#### Scenario: Handle offline login attempt
- **GIVEN** device has no internet connection
- **WHEN** user tries to log in
- **THEN** app SHALL detect no network connectivity
- **AND** app SHALL show clear offline message ("No internet connection")
- **AND** app SHALL offer to retry when connection restored
- **AND** app SHALL not allow login without connectivity (security)

#### Scenario: Cache user data for offline access
- **GIVEN** user successfully logged in before
- **WHEN** app opens offline
- **THEN** app SHALL check if valid access token exists
- **AND** app SHALL allow access with cached token (if not expired)
- **AND** app SHALL show offline indicator in UI
- **AND** app SHALL queue token refresh for when connection returns
- **AND** expired token SHALL require online login

## MODIFIED Requirements

### Requirement: Implement platform-specific features
The system SHALL implement mobile platform-specific features for optimal authentication experience on iOS and macOS.

#### Scenario: Integrate platform-specific authentication features
- **GIVEN** mobile apps need native authentication capabilities
- **WHEN** implementing platform features
- **THEN** the app SHALL integrate biometric authentication (Face ID, Touch ID)
- **AND** the app SHALL use Keychain for secure token storage
- **AND** the app SHALL support deep linking for email verification and password reset
- **AND** the app SHALL implement universal links for seamless app opening
- **AND** the app SHALL integrate password autofill (AutoFill framework)
- **AND** the app SHALL use platform OAuth libraries (Google Sign In SDK, AuthenticationServices)
- **AND** all platform features SHALL gracefully degrade if unavailable
