# Engrid Engineering Agent - Quick Start Guide

Get Engrid up and running in your project in 10 minutes.

## Prerequisites

- Node.js 18+ or appropriate runtime
- TypeScript configured
- Package manager (npm, yarn, pnpm)

---

## Step 1: Add Configuration Files

### Copy these files to your repository:

```
your-repo/
├── .engrid.yml                  # Engrid configuration
├── CLAUDE.md                    # Claude Code agent config
└── templates/                   # Code generation templates
    ├── component/
    ├── service/
    ├── api/
    └── config/
```

### Quick copy commands:

```bash
# Copy from this package
cp engrid-engineer-agent/.engrid.yml your-repo/
cp engrid-engineer-agent/CLAUDE.md your-repo/
cp -r engrid-engineer-agent/templates your-repo/
```

---

## Step 2: Configure for Your Project

### Update `.engrid.yml`

```yaml
# .engrid.yml - Minimum required changes

version: 1

# Set your project type
project:
  name: 'your-app-name'
  type: 'fullstack'           # fullstack | frontend | backend | library
  language: 'typescript'

# Enable your target platforms
platforms:
  web:
    enabled: true
    framework: 'react'        # react | vue | angular | svelte
  mobile:
    enabled: true             # Set false if web-only
    framework: 'react-native'
  desktop:
    enabled: false

# Set your quality standards
quality:
  typescript:
    strict: true
  complexity:
    maxCyclomaticComplexity: 10
    maxFileLines: 300

# Set your performance budgets
performance:
  bundleSize:
    maxInitialKB: 200
  webVitals:
    LCP: 2500
    FID: 100
```

---

## Step 3: Set Up Project Structure

### Create Engrid's recommended structure:

```bash
mkdir -p src/{core,infrastructure,platform,ui,config,shared}
mkdir -p src/core/{entities,use-cases,interfaces}
mkdir -p src/infrastructure/{api,database,cache,events}
mkdir -p src/platform/{web,mobile}
mkdir -p src/ui/{components,layouts,hooks,styles}
mkdir -p src/shared/{types,constants,errors,utils}
```

### Directory purposes:

| Directory | Purpose | Dependencies |
|-----------|---------|--------------|
| `core/` | Business logic | None (pure) |
| `infrastructure/` | External services | core |
| `platform/` | Platform-specific | core, infrastructure |
| `ui/` | User interface | core, shared |
| `config/` | Configuration | None |
| `shared/` | Utilities | None |

---

## Step 4: Set Up Configuration System

### Create the configuration module:

```bash
# Copy the config template
cp templates/config/config.ts.template src/config/index.ts
```

### Create environment-specific configs:

```bash
mkdir -p src/config/environments
```

```typescript
// src/config/environments/development.ts
export default {
  env: 'development',
  debug: true,
  api: {
    baseUrl: 'http://localhost:3001/api',
  },
};

// src/config/environments/production.ts
export default {
  env: 'production',
  debug: false,
  api: {
    baseUrl: 'https://api.yourapp.com',
  },
};
```

### Use configuration everywhere:

```typescript
import { config } from '@/config';

// Get values with type safety
const timeout = config.get('api.timeoutMs', 5000);
const features = config.getSection('features');

// Check feature flags
if (config.isFeatureEnabled('enableNewDashboard')) {
  // Show new dashboard
}
```

---

## Step 5: Set Up Platform Detection

### Create platform service:

```typescript
// src/platform/index.ts
export const Platform = {
  isWeb: typeof window !== 'undefined',
  isMobile: false, // Set based on your mobile framework
  isIOS: false,
  isAndroid: false,
  
  select<T>(options: { web?: T; mobile?: T; ios?: T; android?: T; default: T }): T {
    if (this.isIOS && options.ios) return options.ios;
    if (this.isAndroid && options.android) return options.android;
    if (this.isMobile && options.mobile) return options.mobile;
    if (this.isWeb && options.web) return options.web;
    return options.default;
  },
  
  supports(feature: string): boolean {
    const features: Record<string, boolean> = {
      haptics: this.isIOS || this.isAndroid,
      hover: this.isWeb && !('ontouchstart' in window),
      // Add more feature detection
    };
    return features[feature] ?? false;
  },
};
```

---

## Step 6: Create Your First Component

### Generate a component:

```bash
# Using the template
cp templates/component/Component.tsx.template src/ui/components/Button/Button.tsx
```

### Or create manually following the pattern:

```typescript
// src/ui/components/Button/Button.tsx
import React, { memo, useCallback } from 'react';
import { Platform } from '@/platform';
import { config } from '@/config';

interface ButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

const buttonConfig = {
  minTouchTarget: Platform.select({
    ios: 44,
    android: 48,
    default: 44,
  }),
};

export const Button = memo<ButtonProps>(function Button({
  label,
  onPress,
  disabled = false,
}) {
  const handlePress = useCallback(() => {
    if (disabled) return;
    
    if (Platform.supports('haptics')) {
      // Trigger haptic feedback
    }
    
    onPress();
  }, [disabled, onPress]);

  return (
    <button
      onClick={handlePress}
      disabled={disabled}
      style={{
        minHeight: buttonConfig.minTouchTarget,
        minWidth: buttonConfig.minTouchTarget,
      }}
    >
      {label}
    </button>
  );
});
```

---

## Step 7: Create Your First Service

### Generate a service:

```bash
cp templates/service/Service.ts.template src/core/services/user/UserService.ts
```

### Key patterns to follow:

```typescript
// src/core/services/user/UserService.ts
export class UserService {
  // Dependency injection for testability
  constructor(
    private readonly userRepo: UserRepository,
    private readonly cache: CacheService,
    private readonly events: EventEmitter,
  ) {}

  // Configuration from config system
  private readonly config = {
    cacheTTL: config.get('services.user.cacheTTLSeconds', 300),
  };

  // Pure business logic
  async findById(id: string): Promise<User | null> {
    // Check cache first
    const cached = await this.cache.get(`user:${id}`);
    if (cached) return cached;

    // Fetch from repository
    const user = await this.userRepo.findById(id);
    
    // Cache the result
    if (user) {
      await this.cache.set(`user:${id}`, user, this.config.cacheTTL);
    }

    return user;
  }
}
```

---

## Step 8: Set Up Quality Tools

### Install linting and formatting:

```bash
npm install -D eslint prettier typescript @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

### Create ESLint config:

```javascript
// .eslintrc.js
module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    // Engrid's recommended rules
    'no-magic-numbers': ['warn', { ignore: [0, 1] }],
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-unused-vars': 'error',
  },
};
```

### Create Prettier config:

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

### Add scripts to package.json:

```json
{
  "scripts": {
    "lint": "eslint src --ext .ts,.tsx",
    "format": "prettier --write src",
    "typecheck": "tsc --noEmit"
  }
}
```

---

## Step 9: Activate Engrid in Claude Code

Copy `CLAUDE.md` to your project root to activate Engrid as your Claude Code agent.

Then you can interact with Engrid:

```
You: I need a service to handle user authentication

Engrid: 🏗️ Feature Analysis: Authentication Service

I'll design a scalable, secure, cross-platform solution.

📐 Architecture:
• AuthService in core/ (platform-agnostic logic)
• Token storage in platform/ (secure per-platform)
• API client in infrastructure/

⚙️ Configuration Points:
• Token expiry times
• Max login attempts
• Lockout duration
• MFA enabled/disabled

🔒 Security Considerations:
• Bcrypt for password hashing
• Short-lived access tokens (15 min)
• Secure refresh token rotation
• Platform-specific secure storage

📱 Platform Handling:
• Web: HttpOnly cookies or secure localStorage
• iOS: Keychain
• Android: EncryptedSharedPreferences

Want me to generate the implementation?
```

---

## Engrid's Code Quality Checklist

Before committing code, ensure:

### Configuration
- [ ] No magic numbers (all values configurable)
- [ ] Sensible defaults provided
- [ ] Environment-specific overrides supported

### Platform
- [ ] Works on all target platforms
- [ ] Touch targets meet minimums (44-48px)
- [ ] Graceful degradation for missing features

### Quality
- [ ] TypeScript strict mode passes
- [ ] No lint errors
- [ ] Complexity under thresholds
- [ ] Functions under 50 lines

### Performance
- [ ] No N+1 queries
- [ ] Caching implemented where appropriate
- [ ] Bundle size within budget
- [ ] Lazy loading for large components

### Security
- [ ] Input validated on server
- [ ] No secrets in code
- [ ] Errors don't leak internals

### Testing
- [ ] Dependencies injectable (for mocking)
- [ ] Pure functions extractable
- [ ] Edge cases considered

---

## Common Patterns

### Making Values Configurable

```typescript
// ❌ Bad
const TIMEOUT = 5000;
const MAX_RETRIES = 3;

// ✅ Good
const timeout = config.get('api.timeoutMs', 5000);
const maxRetries = config.get('api.maxRetries', 3);
```

### Platform-Specific Code

```typescript
// ❌ Bad - assumes web
localStorage.setItem('token', token);

// ✅ Good - platform agnostic
await storage.setItem('token', token); // Implemented per-platform
```

### Error Handling

```typescript
// ❌ Bad
throw new Error('Failed');

// ✅ Good
throw new UserNotFoundError(userId);
// With message: "User with id abc123 not found"
```

---

## Next Steps

1. 📖 Read the full [ENGRID.md](./ENGRID.md) documentation
2. 🏗️ Set up your project structure
3. ⚙️ Configure your platforms and quality settings
4. 🚀 Start building scalable, configurable features
5. 🧪 Coordinate with Tucker for testing

---

*Engrid: Build it once, build it right, build it to last.* 👩‍💻
