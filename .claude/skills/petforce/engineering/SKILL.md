# Engineering Best Practices for PetForce

## Implementation Quality Checklist

**Use this checklist for every feature implementation to ensure scalability, maintainability, and cross-platform compatibility.**

### Scalability & Architecture
- [ ] Designed for 10x scale from the start
- [ ] SOLID principles applied to code structure
  - Single Responsibility: Each class/module has one job
  - Open/Closed: Open for extension, closed for modification
  - Liskov Substitution: Subtypes must be substitutable
  - Interface Segregation: Many specific interfaces over one fat interface
  - Dependency Inversion: Depend on abstractions, not concretes
- [ ] Dependencies properly abstracted and injectable
- [ ] No tight coupling between components
- [ ] Repository pattern used for data access
- [ ] Service layer contains business logic
- [ ] Clean separation between layers (core, infrastructure, platform, ui)

### Configuration & Flexibility
- [ ] All values configurable (no magic numbers or hard-coded values)
- [ ] Configuration hierarchy implemented (runtime > env > files > defaults)
- [ ] Environment-specific configurations externalized
- [ ] Feature flags considered for gradual rollout
- [ ] Default values sensible and documented
- [ ] Configuration validation schema defined
- [ ] Hot reload support for configuration changes

### Cross-Platform Considerations
- [ ] Code works across all target platforms (mobile, web, desktop)
- [ ] Platform detection and adaptation implemented
- [ ] Platform-specific abstractions used where needed
- [ ] Touch targets meet minimum sizes (44px iOS, 48px Android)
- [ ] Responsive breakpoints defined and tested
- [ ] Offline/poor network scenarios handled gracefully
- [ ] Platform differences documented and tested
- [ ] Graceful degradation for unsupported features

### Code Quality & Maintainability
- [ ] Code is self-documenting with clear naming conventions
  - SCREAMING_SNAKE_CASE for constants
  - PascalCase for classes and interfaces
  - camelCase for functions, methods, variables
  - Boolean variables prefixed with is/has/should/can
  - Event handlers prefixed with handle
- [ ] File organization follows standard pattern (imports, constants, types, helpers, main, exports)
- [ ] Imports properly grouped and ordered (external, internal absolute, relative, types)
- [ ] Architectural decisions documented (ADR created if significant)
- [ ] JSDoc comments for public APIs
- [ ] Error handling implemented with meaningful messages
- [ ] Custom error classes for specific error types
- [ ] Code is testable (pure functions, dependency injection used)
- [ ] Complexity within limits (cyclomatic < 10, cognitive < 15)
- [ ] File and function size within limits (file < 300 lines, function < 50 lines)

### Security & Performance
- [ ] Security considered at every layer
  - Input validation on all user input (server-side)
  - SQL injection prevented (parameterized queries)
  - XSS prevented (output encoding)
  - CSRF tokens implemented
- [ ] Security headers configured (CSP, HSTS, X-Frame-Options, etc.)
- [ ] Sensitive data encrypted at rest
- [ ] TLS 1.3 for data in transit
- [ ] Authentication/authorization properly implemented
- [ ] Secrets in environment/vault (not code)
- [ ] Performance implications assessed
  - Bundle size checked (< 200KB initial)
  - Database queries optimized (indexes, explain plans)
  - N+1 queries eliminated
  - Caching strategy implemented
  - Images optimized (WebP, lazy loading)
- [ ] Resource requirements documented
- [ ] Technical debt acknowledged and documented if created

## Code Organization Standards

### Directory Structure
```
src/
├── core/                    # Core business logic (platform-agnostic)
│   ├── entities/           # Domain models
│   ├── use-cases/          # Business operations
│   ├── interfaces/         # Contracts/abstractions
│   └── utils/              # Pure utility functions
│
├── infrastructure/          # External integrations
│   ├── api/                # API clients
│   ├── database/           # Data persistence
│   ├── cache/              # Caching layer
│   └── events/             # Event/message systems
│
├── config/                  # Configuration management
│   ├── default.ts          # Default configuration
│   ├── schema.ts           # Config validation schema
│   └── index.ts            # Config loader
│
├── platform/               # Platform-specific code
│   ├── web/               # Web-specific
│   ├── mobile/            # Mobile-specific
│   └── desktop/           # Desktop-specific
│
├── ui/                     # User interface
│   ├── components/        # Reusable UI components
│   ├── layouts/           # Page layouts
│   ├── hooks/             # Custom hooks
│   └── styles/            # Styling system
│
└── shared/                 # Shared across all layers
    ├── types/             # TypeScript types/interfaces
    ├── constants/         # Application constants
    └── errors/            # Custom error classes
```

## Configuration Pattern

### Standard Configuration Structure
```typescript
// Always use this pattern for configurable values

// 1. Define the schema with types
interface AppConfig {
  features: {
    enableNewDashboard: boolean;
    maxUploadSizeMB: number;
    supportedFileTypes: string[];
  };

  platform: {
    mobile: {
      enableOfflineMode: boolean;
      syncIntervalMs: number;
    };
    web: {
      enablePWA: boolean;
      cacheStrategy: 'network-first' | 'cache-first';
    };
  };

  limits: {
    maxItemsPerPage: number;
    maxConcurrentRequests: number;
    requestTimeoutMs: number;
    retryAttempts: number;
  };
}

// 2. Provide sensible defaults
const defaultConfig: AppConfig = { /* ... */ };

// 3. Create typed config loader
class ConfigManager {
  private config: AppConfig;

  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key];
  }

  async refresh(): Promise<void> {
    this.config = this.loadConfig();
  }
}
```

### Configuration Checklist
| Category | Always Configurable | Sometimes Configurable | Rarely Configurable |
|----------|---------------------|------------------------|---------------------|
| **Values** | API endpoints, timeouts, limits, feature flags, cache durations, retry policies, file size limits | Algorithm parameters, UI text, color themes, default values, pagination sizes, animation speeds, log levels | Core business rules, security policies, data models, authentication flow, core architecture |

## Cross-Platform Patterns

### Platform Detection
```typescript
interface PlatformInfo {
  type: 'web' | 'ios' | 'android' | 'macos' | 'windows' | 'linux';
  isTouch: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenSize: 'small' | 'medium' | 'large' | 'xlarge';
  supportsHover: boolean;
  isOnline: boolean;
}
```

### Responsive Breakpoints
```typescript
const breakpoints = {
  xs: 0,      // 0-575px: Small phones
  sm: 576,    // 576-767px: Large phones
  md: 768,    // 768-991px: Tablets
  lg: 992,    // 992-1199px: Small desktops/laptops
  xl: 1200,   // 1200-1399px: Desktops
  xxl: 1400,  // 1400px+: Large desktops
};
```

### Platform-Specific Feature Matrix
| Feature | Web | iOS | Android | macOS | Windows |
|---------|-----|-----|---------|-------|---------|
| Push Notifications | ✓ | ✓ | ✓ | ✓ | ✓ |
| Offline Mode | ✓ | ✓ | ✓ | ✓ | ✓ |
| Biometric Auth | ✓* | ✓ | ✓ | ✓ | ✓ |
| Haptic Feedback | ✗ | ✓ | ✓ | ✓* | ✗ |
| Keyboard Shortcuts | ✓ | ✗ | ✗ | ✓ | ✓ |

*Limited support

## Performance Standards

### Performance Budgets
| Metric | Budget | Critical |
|--------|--------|----------|
| First Contentful Paint | < 1.8s | < 1.0s |
| Largest Contentful Paint | < 2.5s | < 1.5s |
| Time to Interactive | < 3.8s | < 2.5s |
| Cumulative Layout Shift | < 0.1 | < 0.05 |
| First Input Delay | < 100ms | < 50ms |
| Total Bundle Size (gzip) | < 200KB | < 100KB |
| API Response Time (p95) | < 500ms | < 200ms |

### Performance Checklist
**Frontend Performance**
- [ ] Bundle size < 200KB (gzipped) for initial load
- [ ] Code splitting by route/feature
- [ ] Tree shaking enabled
- [ ] Images optimized (WebP, lazy loading, srcset)
- [ ] Critical CSS inlined
- [ ] Fonts optimized (subset, preload, swap)
- [ ] Third-party scripts deferred/async
- [ ] Service worker for caching

**Backend Performance**
- [ ] Database queries optimized (indexes, explain plans)
- [ ] N+1 queries eliminated
- [ ] Connection pooling configured
- [ ] Response compression enabled
- [ ] Caching layer implemented
- [ ] Async processing for heavy tasks
- [ ] Rate limiting in place

**API Performance**
- [ ] Pagination implemented
- [ ] Field selection supported
- [ ] Response caching with ETags
- [ ] Gzip/Brotli compression
- [ ] HTTP/2 or HTTP/3

**Mobile Performance**
- [ ] 60fps animations
- [ ] Touch response < 100ms
- [ ] Offline-first architecture
- [ ] Background sync for data
- [ ] Optimized for low-end devices

## Security Standards

### Security Checklist
**Input Validation**
- [ ] All input validated on server (never trust client)
- [ ] Input sanitized before use
- [ ] SQL injection prevented (parameterized queries)
- [ ] XSS prevented (output encoding)
- [ ] CSRF tokens implemented
- [ ] File upload validation (type, size, content)

**Authentication**
- [ ] Passwords hashed with bcrypt/argon2
- [ ] JWT tokens short-lived with refresh (15min access, 7 day refresh)
- [ ] Session management secure
- [ ] MFA supported
- [ ] Brute force protection (rate limiting, lockout)
- [ ] Secure password requirements enforced

**Authorization**
- [ ] RBAC/ABAC implemented
- [ ] Principle of least privilege
- [ ] Authorization checked on every request
- [ ] Resource ownership verified

**Data Protection**
- [ ] Sensitive data encrypted at rest
- [ ] TLS 1.3 for data in transit
- [ ] PII handling compliant
- [ ] Secrets in environment/vault (not code)
- [ ] Audit logging implemented

**Infrastructure**
- [ ] Dependencies regularly updated
- [ ] Security headers configured
- [ ] CORS properly configured
- [ ] Content Security Policy defined
- [ ] Regular security scanning

### Required Security Headers
```typescript
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; ...",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
};
```

## Testing Standards

### Test Pyramid (Engrid writes unit/integration tests)
- **Unit Tests (80%)** - Pure functions, business logic, utilities
- **Integration Tests (15%)** - API endpoints, database operations, service interactions
- **E2E Tests (5%)** - Critical user flows, happy paths

### Testable Code Patterns
```typescript
// 1. Dependency Injection (makes mocking easy)
class OrderService {
  constructor(
    private orderRepo: OrderRepository,
    private paymentGateway: PaymentGateway,
    private emailService: EmailService
  ) {}
}

// 2. Pure Functions (easy to test)
function calculateTotal(items: CartItem[], discount: number): number {
  // Implementation
}

// 3. Command Query Separation
class UserService {
  async getUser(id: string): Promise<User> { /* ... */ }  // Query
  async updateUser(id: string, data: UpdateUserDTO): Promise<void> { /* ... */ }  // Command
}
```

## Error Handling Standards

### Custom Error Classes
```typescript
class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

class ValidationError extends AppError { /* ... */ }
class NotFoundError extends AppError { /* ... */ }
class UnauthorizedError extends AppError { /* ... */ }
```

### Error Handling Checklist
- [ ] Custom error classes for specific error types
- [ ] Meaningful error messages
- [ ] Error context included
- [ ] Global error handler implemented
- [ ] Operational vs programming errors distinguished
- [ ] Errors logged with appropriate context
- [ ] Sensitive information not leaked in error messages

## Documentation Standards

### Code Documentation
```typescript
/**
 * Processes a payment for an order.
 *
 * @param orderId - The unique identifier of the order
 * @param paymentMethod - The payment method to use
 * @param options - Additional processing options
 *
 * @returns The completed payment record
 *
 * @throws {OrderNotFoundError} When the order doesn't exist
 * @throws {PaymentDeclinedError} When the payment is declined
 *
 * @example
 * ```typescript
 * const payment = await processPayment('order_123', {
 *   type: 'card',
 *   cardId: 'card_456'
 * });
 * ```
 *
 * @since 2.0.0
 */
```

### Documentation Checklist
- [ ] JSDoc for all public APIs
- [ ] OpenAPI/Swagger for REST APIs
- [ ] Architecture Decision Records (ADRs) for significant decisions
- [ ] README updated for new features
- [ ] Migration guides for breaking changes
- [ ] Code examples provided
- [ ] Edge cases documented

## Naming Conventions

### Constants
```typescript
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_TIMEOUT_MS = 5000;
```

### Classes & Interfaces
```typescript
class UserService {}
interface UserRepository {}
interface CreateUserDTO {}
```

### Functions & Methods
```typescript
function calculateTotal() {}
async function fetchUserData() {}
function handleClick() {}
```

### Variables
```typescript
const userCount = 10;
const isAuthenticated = true;
const hasPermission = true;
```

### File Organization
```typescript
// 1. Imports (grouped and ordered)
import React from 'react';           // External
import { config } from '@/config';   // Internal absolute
import { Button } from './Button';   // Relative
import type { User } from '@/types'; // Types

// 2. Constants
const DEFAULT_PAGE_SIZE = 20;

// 3. Types/Interfaces
interface ComponentProps { /* ... */ }

// 4. Helper functions
function formatUserName(user: User): string { /* ... */ }

// 5. Main component/class/function
export function UserProfile({ userId }: ComponentProps) { /* ... */ }
```

## Scalability Patterns

### Repository Pattern
```typescript
interface UserRepository {
  findById(id: string): Promise<User | null>;
  create(data: CreateUserDTO): Promise<User>;
  update(id: string, data: UpdateUserDTO): Promise<User>;
  delete(id: string): Promise<void>;
}
```

### Service Layer
```typescript
class OrderService {
  constructor(
    private orderRepo: OrderRepository,
    private paymentGateway: PaymentGateway,
    private config: OrderConfig
  ) {}

  async createOrder(dto: CreateOrderDTO): Promise<Order> {
    // Business logic here
  }
}
```

### Caching Strategy
```typescript
enum CacheStrategy {
  CACHE_FIRST = 'cache-first',
  NETWORK_FIRST = 'network-first',
  STALE_WHILE_REVALIDATE = 'swr',
  CACHE_ONLY = 'cache-only',
  NETWORK_ONLY = 'network-only',
}
```

## Summary

This skill provides the engineering standards and best practices for PetForce development. Use these guidelines to ensure all code is:
- **Scalable** - Built for 10x growth
- **Configurable** - No hard-coded values
- **Cross-platform** - Works everywhere
- **Maintainable** - Clean and testable
- **Secure** - Protected at every layer
- **Performant** - Fast and efficient
