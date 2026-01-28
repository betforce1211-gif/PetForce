# Constants & Window Adapter Reference

Quick reference guide for using constants and window adapter in PetForce codebase.

---

## Auth Package Constants

Import from `@petforce/auth`:

```typescript
import {
  TOKEN_EXPIRY_SECONDS,
  PASSWORD_MIN_LENGTH,
  EMAIL_MAX_LENGTH,
  AUTH_ERROR_CODES,
  REDIRECT_PATHS,
  // ... etc
} from '@petforce/auth';
```

### Available Constants

#### Token Configuration
```typescript
TOKEN_EXPIRY_SECONDS          // 900 (15 minutes)
REFRESH_TOKEN_EXPIRY_DAYS     // 7 days
```

#### Password Rules
```typescript
PASSWORD_MIN_LENGTH           // 8
PASSWORD_MAX_LENGTH           // 100
PASSWORD_STRONG_MIN_LENGTH    // 12
```

#### Email Rules
```typescript
EMAIL_MAX_LENGTH              // 255
```

#### Password Strength
```typescript
PASSWORD_STRENGTH_THRESHOLD_WEAK    // 2
PASSWORD_STRENGTH_THRESHOLD_MEDIUM  // 4
PASSWORD_STRENGTH_MAX_SCORE         // 4
PASSWORD_STRENGTH_COLORS            // { WEAK, FAIR, GOOD, STRONG }
```

#### Redirect Paths
```typescript
REDIRECT_PATHS = {
  AUTH_CALLBACK: '/auth/callback',
  AUTH_VERIFY: '/auth/verify',
  PASSWORD_RESET: '/auth/reset-password',
  NATIVE_CALLBACK: 'petforce://auth/callback',
}
```

#### Error Codes
```typescript
AUTH_ERROR_CODES = {
  UNEXPECTED_ERROR,
  REGISTRATION_ERROR,
  LOGIN_ERROR,
  LOGOUT_ERROR,
  MAGIC_LINK_ERROR,
  VERIFICATION_ERROR,
  RESEND_ERROR,
  PASSWORD_RESET_ERROR,
  GET_USER_ERROR,
  REFRESH_ERROR,
  OAUTH_ERROR,
  OAUTH_CALLBACK_ERROR,
  EMAIL_NOT_CONFIRMED,
  BIOMETRIC_CHECK_ERROR,
  BIOMETRIC_AUTH_FAILED,
  BIOMETRIC_AUTH_ERROR,
  BIOMETRIC_ENROLL_ERROR,
  BIOMETRIC_DISABLE_ERROR,
  NOT_AVAILABLE,
  NOT_IMPLEMENTED,
}
```

#### OAuth Config
```typescript
OAUTH_CONFIG = {
  GOOGLE_SCOPES: 'email profile',
}
```

#### Biometric Config
```typescript
BIOMETRIC_CONFIG = {
  DEFAULT_PROMPT_MESSAGE: 'Authenticate to access PetForce',
  FALLBACK_LABEL: 'Use passcode',
  DISABLE_DEVICE_FALLBACK: false,
}
```

---

## Web App UI Constants

Import from `@/config/ui-constants`:

```typescript
import {
  ANIMATION_TIMINGS,
  UI_COUNTS,
  CONFETTI_COLORS,
  // ... etc
} from '@/config/ui-constants';
```

### Available Constants

#### Animation Timings (ms)
```typescript
ANIMATION_TIMINGS = {
  CONFETTI_DELAY: 500,
  CONFETTI_MIN_DURATION: 2000,
  CONFETTI_MAX_DURATION: 4000,
  CONFETTI_RANDOM_DELAY: 500,
}
```

#### UI Element Counts
```typescript
UI_COUNTS = {
  CONFETTI_PARTICLES: 50,
  COLOR_PALETTE_SIZE: 4,
}
```

#### Animation Values
```typescript
ANIMATION_VALUES = {
  CONFETTI_FALL_DISTANCE: 100,
  CONFETTI_MAX_ROTATION: 360,
  WINDOW_HEIGHT_FALLBACK: 600,
}
```

#### Colors
```typescript
UI_COLORS = {
  PRIMARY: '#2D9B87',
  SECONDARY: '#FF9F40',
  SUCCESS: '#4CAF50',
  INFO: '#2196F3',
  WARNING: '#FFC107',
  DANGER: '#EF4444',
}

CONFETTI_COLORS = [
  UI_COLORS.PRIMARY,
  UI_COLORS.SECONDARY,
  UI_COLORS.SUCCESS,
  UI_COLORS.INFO,
]
```

#### Icon Sizes (px)
```typescript
ICON_SIZES = {
  SUCCESS_ICON_CONTAINER: 24,
  SUCCESS_ICON: 12,
  CONFETTI_PARTICLE: 2,
}
```

---

## Window Adapter

Import from `@petforce/auth`:

```typescript
import {
  getOrigin,
  getHref,
  getHash,
  navigateToUrl,
  getInnerHeight,
  isWebAuthnSupported,
  setWindowAdapter,      // For testing
  resetWindowAdapter,    // For testing
} from '@petforce/auth';
```

### Usage Examples

#### Get Window Origin
```typescript
// Safe - returns fallback if window unavailable
const origin = getOrigin('http://localhost:3000');
const redirectUrl = `${origin}${REDIRECT_PATHS.AUTH_CALLBACK}`;
```

#### Navigate to URL
```typescript
// Safe - handles errors gracefully
navigateToUrl('https://google.com');
```

#### Get Window Hash
```typescript
// Safe - returns empty string if window unavailable
const hash = getHash();
const params = new URLSearchParams(hash.substring(1));
```

#### Get Window Height
```typescript
// Safe - returns fallback if window unavailable
const height = getInnerHeight(600); // fallback: 600px
const fallDistance = height + ANIMATION_VALUES.CONFETTI_FALL_DISTANCE;
```

#### Check WebAuthn Support
```typescript
// Safe - returns false if window unavailable
if (isWebAuthnSupported()) {
  // Use WebAuthn
} else {
  // Fallback authentication
}
```

### Testing with Window Adapter

```typescript
import { setWindowAdapter, resetWindowAdapter } from '@petforce/auth';

// Setup
beforeEach(() => {
  setWindowAdapter({
    location: {
      origin: 'http://test.com',
      href: 'http://test.com/page',
      hash: '#token=abc',
      assign: jest.fn(),
    },
    innerHeight: 768,
    PublicKeyCredential: MockWebAuthn,
  });
});

// Cleanup
afterEach(() => {
  resetWindowAdapter();
});

// Test
test('builds redirect URL correctly', () => {
  const url = `${getOrigin()}/callback`;
  expect(url).toBe('http://test.com/callback');
});
```

---

## Rules for Developers

### DO

1. **Always use constants** - Never hardcode numbers
2. **Always use window adapter** - Never use `window` directly
3. **Add JSDoc comments** - Explain what constant represents
4. **Group related constants** - Keep organized
5. **Use descriptive names** - Make code self-documenting

### DON'T

1. **Don't use magic numbers** - Create a constant instead
2. **Don't access window directly** - Use window adapter
3. **Don't mix auth and UI constants** - Keep separate
4. **Don't mutate constants** - They should be readonly
5. **Don't skip fallbacks** - Always provide safe defaults

---

## Quick Examples

### Before (BAD)
```typescript
// Magic numbers everywhere
if (password.length < 8) return 'weak';
const url = `${window.location.origin}/auth/callback`;
setTimeout(() => show(), 500);
expiresIn: session.expires_in || 900

// Breaks in tests, SSR, React Native
// Hard to understand what values mean
// Not configurable
```

### After (GOOD)
```typescript
// Named constants
if (password.length < PASSWORD_MIN_LENGTH) return 'weak';
const url = `${getOrigin()}${REDIRECT_PATHS.AUTH_CALLBACK}`;
setTimeout(() => show(), ANIMATION_TIMINGS.CONFETTI_DELAY);
expiresIn: session.expires_in || TOKEN_EXPIRY_SECONDS

// Works everywhere
// Self-documenting
// Easy to configure
```

---

## File Locations

- **Auth Constants**: `/packages/auth/src/config/constants.ts`
- **UI Constants**: `/apps/web/src/config/ui-constants.ts`
- **Window Adapter**: `/packages/auth/src/utils/window-adapter.ts`
- **Full Documentation**: `/docs/CODE_QUALITY_IMPROVEMENTS.md`

---

**Quick Tip**: When in doubt, create a constant. Future you will thank you!
