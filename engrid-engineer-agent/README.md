# 👩‍💻 Engrid: The Engineering Agent

> *Build it once, build it right, build it to last.*

Engrid is a comprehensive software engineering system powered by Claude Code. She builds scalable, configurable, cross-platform solutions that adapt to customer needs and work beautifully on any device.

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Scalability First** | Designs for 10x growth from day one |
| **Configuration Driven** | Everything is configurable - no magic numbers |
| **Cross-Platform** | iPhone, Android, iPad, Mac, PC, Web - all covered |
| **Clean Code** | SOLID principles, testable patterns, clear naming |
| **Performance Optimized** | Bundle budgets, caching strategies, lazy loading |
| **Security Built-In** | Validation, sanitization, secure defaults |

## 📁 Package Contents

```
engrid-engineer-agent/
├── ENGRID.md                    # Full engineering documentation
├── CLAUDE.md                    # Claude Code agent configuration
├── QUICKSTART.md                # 10-minute setup guide
├── .engrid.yml                  # Engrid configuration file
└── templates/
    ├── component/               # UI component templates
    │   └── Component.tsx.template
    ├── service/                 # Service layer templates
    │   └── Service.ts.template
    ├── api/                     # API endpoint templates
    │   └── ApiRouter.ts.template
    └── config/                  # Configuration templates
        └── config.ts.template
```

## 🚀 Quick Start

### 1. Copy files to your repository

```bash
cp -r engrid-engineer-agent/templates your-repo/
cp engrid-engineer-agent/.engrid.yml your-repo/
cp engrid-engineer-agent/CLAUDE.md your-repo/
```

### 2. Configure for your project

```yaml
# .engrid.yml
version: 1

platforms:
  web:
    enabled: true
    framework: 'react'
  mobile:
    enabled: true
    framework: 'react-native'

quality:
  typescript:
    strict: true
```

### 3. Start building

```bash
engrid generate component "UserProfile"
```

**[📖 Full Setup Guide →](./QUICKSTART.md)**

## 🏗️ Architecture Principles

### Code Organization

```
src/
├── core/              # Platform-agnostic business logic
├── infrastructure/    # External integrations (API, DB, cache)
├── platform/          # Platform-specific code (web, mobile, desktop)
├── ui/                # User interface components
├── config/            # Configuration management
└── shared/            # Shared utilities and types
```

### SOLID Principles

| Principle | Application |
|-----------|-------------|
| **S**ingle Responsibility | One class, one job |
| **O**pen/Closed | Extend, don't modify |
| **L**iskov Substitution | Subtypes are interchangeable |
| **I**nterface Segregation | Small, focused interfaces |
| **D**ependency Inversion | Depend on abstractions |

## ⚙️ Configuration Philosophy

### Everything Is Configurable

```typescript
// ❌ Never do this
const TIMEOUT = 5000;

// ✅ Always do this
const timeout = config.get('api.timeoutMs', 5000);
```

### Configuration Hierarchy

```
1. Runtime Overrides (highest priority)
2. Environment Variables
3. Config Files
4. Feature Flags
5. Default Values (lowest priority)
```

### What Should Be Configurable?

| Always | Sometimes | Rarely |
|--------|-----------|--------|
| API endpoints | Algorithm params | Core business rules |
| Timeouts/limits | UI copy | Security policies |
| Feature flags | Color themes | Data models |
| Cache durations | Animation speeds | Auth flow |

## 📱 Cross-Platform Design

### Platform Detection

```typescript
const platform = Platform.detect();
// { type: 'ios', isMobile: true, isTouch: true, ... }
```

### Responsive Breakpoints

| Breakpoint | Size | Use Case |
|------------|------|----------|
| xs | 0-575px | Small phones |
| sm | 576-767px | Large phones |
| md | 768-991px | Tablets |
| lg | 992-1199px | Small desktops |
| xl | 1200-1399px | Desktops |
| xxl | 1400px+ | Large desktops |

### Touch Targets

| Platform | Minimum Size |
|----------|-------------|
| iOS | 44pt (Apple HIG) |
| Android | 48dp (Material) |
| Web | 44px (WCAG) |

## 📊 Performance Budgets

| Metric | Budget | Critical |
|--------|--------|----------|
| First Contentful Paint | < 1.8s | < 1.0s |
| Largest Contentful Paint | < 2.5s | < 1.5s |
| Time to Interactive | < 3.8s | < 2.5s |
| Bundle Size (gzip) | < 200KB | < 100KB |
| API Response (p95) | < 500ms | < 200ms |

## 🔒 Security Standards

### Input Validation
- All input validated on server
- Use schema validation (Zod)
- Sanitize before use

### Authentication
- Short-lived access tokens (15 min)
- Secure refresh tokens (7 days)
- Platform-specific secure storage

### Data Protection
- Encryption at rest
- TLS 1.3 in transit
- No secrets in code

## 🤖 Using with Claude Code

Once configured, Claude Code becomes Engrid:

```
You: Build a user profile component for web and mobile

Engrid: 🏗️ Feature Analysis: User Profile

I'll design a scalable, cross-platform solution.

📐 Architecture:
• Shared core logic (platform-agnostic)
• Platform-specific UI (web + mobile)
• Configurable display options

⚙️ Configuration Points:
• Avatar sizes
• Field visibility
• Edit permissions
• Cache duration

📱 Platform Considerations:
• Web: Hover states, keyboard navigation
• iOS: Safe area insets, haptic feedback
• Android: Material ripples, back handling

📁 Files to create:
src/core/user/userProfile.ts
src/ui/components/UserProfile/
├── index.ts
├── UserProfile.tsx (shared logic)
├── UserProfile.web.tsx
├── UserProfile.native.tsx
└── styles.ts

Ready to generate?
```

## 📋 Engrid's Commands

### Code Generation
```bash
engrid generate component "Name"   # Generate component
engrid generate service "Name"     # Generate service
engrid generate api "resource"     # Generate API endpoint
```

### Architecture
```bash
engrid analyze complexity          # Code complexity
engrid analyze dependencies        # Dependency graph
engrid analyze performance         # Performance audit
```

### Quality
```bash
engrid lint                        # Run linters
engrid typecheck                   # TypeScript check
engrid security-scan               # Security audit
```

### Platform
```bash
engrid build --platform all        # Build all platforms
engrid build --platform web        # Web only
engrid build --platform mobile     # Mobile only
```

## 🤝 Integration with Other Agents

| Agent | Integration |
|-------|-------------|
| **Peter** | Receives requirements, asks clarifying questions |
| **Tucker** | Writes testable code, provides test guidance |
| **Thomas** | OpenAPI annotations, code comments for docs |
| **Chuck** | CI/CD configuration, build optimization |

### Workflow

```
Peter (requirements) → Engrid (implementation) → Tucker (testing) → Chuck (deploy)
                              ↓
                        Thomas (documentation)
```

## 🔧 Configuration

Engrid uses `.engrid.yml` for configuration:

```yaml
version: 1

platforms:
  web:
    enabled: true
    framework: 'react'
  mobile:
    enabled: true
    framework: 'react-native'

quality:
  typescript:
    strict: true
  complexity:
    maxCyclomaticComplexity: 10

performance:
  bundleSize:
    maxInitialKB: 200

security:
  dependencyScanning:
    enabled: true
```

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [ENGRID.md](./ENGRID.md) | Complete engineering documentation |
| [CLAUDE.md](./CLAUDE.md) | Claude Code configuration |
| [QUICKSTART.md](./QUICKSTART.md) | 10-minute setup guide |

## 📋 Templates

| Template | Use For |
|----------|---------|
| `component/` | UI components with platform handling |
| `service/` | Business logic services |
| `api/` | API endpoints with validation |
| `config/` | Configuration management |

---

<p align="center">
  <strong>Engrid: Your Engineering Partner</strong><br>
  <em>Scalable. Configurable. Cross-platform.</em>
</p>

---

*Build it once, build it right, build it to last.* 👩‍💻
