# 🔨 Tucker: The QA Guardian

> *If I didn't break it, I didn't try hard enough.*

Tucker is a comprehensive quality assurance system powered by Claude Code. He relentlessly tests your code, hunts edge cases, runs full regressions, and ensures every release maintains the highest quality standards.

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Comprehensive Testing** | Unit, integration, E2E, API, performance, and security tests |
| **Edge Case Hunting** | Automatic detection and testing of boundaries, nulls, unicode, and more |
| **Full Regression** | Complete test suite runs on every release |
| **Coverage Enforcement** | Configurable thresholds with trend tracking |
| **Security Scanning** | OWASP Top 10, dependency audits, secret detection |
| **Flaky Test Management** | Detection, quarantine, and retry mechanisms |

## 📁 Package Contents

```
tucker-qa-agent/
├── TUCKER.md                    # Full Tucker documentation & philosophy
├── CLAUDE.md                    # Claude Code agent configuration
├── QUICKSTART.md                # 10-minute setup guide
├── .tucker.yml                  # Tucker configuration file
├── .github/
│   └── workflows/
│       └── tucker-tests.yml     # Complete QA pipeline
└── tests/
    └── templates/
        ├── unit.test.template.js
        ├── e2e.spec.template.ts
        └── api.test.template.ts
```

## 🚀 Quick Start

### 1. Copy files to your repository

```bash
cp -r tucker-qa-agent/.github your-repo/
cp tucker-qa-agent/.tucker.yml your-repo/
cp tucker-qa-agent/CLAUDE.md your-repo/
mkdir -p your-repo/tests/templates
cp tucker-qa-agent/tests/templates/* your-repo/tests/templates/
```

### 2. Configure for your project

```yaml
# .tucker.yml
version: 1

testing:
  frameworks:
    unit: 'jest'
    e2e: 'playwright'

coverage:
  global:
    lines: 80
    branches: 75
    functions: 85
```

### 3. Run your first tests

```bash
tucker test all
```

**[📖 Full Setup Guide →](./QUICKSTART.md)**

## 🧪 Test Types

| Type | Purpose | When Run |
|------|---------|----------|
| **Smoke** | Quick sanity check | Every commit |
| **Unit** | Individual function testing | Every PR |
| **Integration** | Service boundary testing | Every PR |
| **E2E** | Complete user journeys | Every PR |
| **API** | Endpoint validation | Every PR |
| **Performance** | Load and speed testing | Releases |
| **Security** | Vulnerability scanning | Every PR |
| **Accessibility** | WCAG compliance | Releases |

## 🎯 Edge Cases Tucker Hunts

Tucker automatically tests these edge cases:

### Strings
```
"" (empty) | "   " (whitespace) | "a"×256 (max+1)
"测试" (unicode) | "🚀" (emoji) | "<script>" (XSS)
"'; DROP TABLE" (SQL injection)
```

### Numbers
```
0 | -1 | MAX_SAFE_INTEGER | MIN_SAFE_INTEGER
NaN | Infinity | 0.1 + 0.2 (precision)
```

### Collections
```
[] (empty) | [x] (single) | [x]×100 (at limit)
[x]×101 (over limit) | [x,x,x] (duplicates)
```

### Async
```
Timeout | Concurrent access | Race condition
Partial failure | Retry scenarios
```

## 📊 Coverage Requirements

| Metric | Minimum | Target | Tucker's Standard |
|--------|---------|--------|-------------------|
| Lines | 80% | 90% | 95%+ |
| Branches | 75% | 85% | 90%+ |
| Functions | 85% | 95% | 100% |

## 🔒 Security Testing

Tucker scans for:

- ✅ OWASP Top 10 vulnerabilities
- ✅ Dependency vulnerabilities (npm audit)
- ✅ Hardcoded secrets
- ✅ SQL injection vectors
- ✅ XSS attack surfaces
- ✅ Authentication bypasses
- ✅ Authorization failures

## 🤖 Using with Claude Code

Once configured, Claude Code becomes Tucker:

```
You: I need tests for the PaymentService

Tucker: I'll create comprehensive tests for PaymentService.

📝 Created: tests/unit/payment-service.test.js

Tests generated:
  ✅ Happy path (5 tests)
  ✅ Error handling (8 tests)  
  ✅ Edge cases (15 tests)
    - Zero amount
    - Negative amount
    - Max currency value
    - Invalid card numbers
    - Expired cards
    - Concurrent transactions
  ✅ Security (6 tests)
    - SQL injection
    - XSS in description
    - Invalid user access

Estimated coverage: 94%

Run 'tucker test unit --file=payment-service' to execute.
```

## 🔄 Regression Strategy

```
┌─────────────────────────────────────────────┐
│           TUCKER'S TEST PYRAMID             │
├─────────────────────────────────────────────┤
│                                             │
│  EVERY COMMIT:     💨 Smoke Tests (~5 min) │
│  EVERY PR:         🔬 Full Suite (~30 min) │
│  EVERY RELEASE:    📦 Regression (~2 hrs)  │
│  POST-DEPLOY:      ✅ Verification (~15 min)│
│                                             │
└─────────────────────────────────────────────┘
```

## ⚙️ Configuration

Tucker uses `.tucker.yml`:

```yaml
version: 1

testing:
  frameworks:
    unit: 'jest'
    e2e: 'playwright'

coverage:
  global:
    lines: 80
    branches: 75
  critical:
    paths: ['src/auth/**', 'src/payments/**']
    thresholds:
      lines: 95

edge_cases:
  auto_suggest: true
  categories:
    - boundaries
    - null_undefined
    - unicode
    - concurrent_access

security:
  owasp: true
  dependency_audit: true
  secret_detection: true
```

## 📋 Commands

### Test Execution
```bash
tucker test all          # Everything
tucker test unit         # Unit tests
tucker test e2e          # End-to-end
tucker test regression   # Full regression
```

### Coverage
```bash
tucker coverage analyze  # View report
tucker coverage gaps     # Find untested code
```

### Test Generation
```bash
tucker create unit "UserService"
tucker create e2e "CheckoutFlow"
tucker generate edge-cases "calculateTotal"
```

### Security
```bash
tucker scan security     # Full security scan
tucker analyze flaky     # Find flaky tests
```

## 🚦 Quality Gate

No release ships without passing Tucker's gate:

```
╔═══════════════════════════════════════════╗
║          TUCKER'S RELEASE GATE            ║
╠═══════════════════════════════════════════╣
║                                           ║
║  ☐ All unit tests passing                ║
║  ☐ All integration tests passing         ║
║  ☐ E2E critical paths passing            ║
║  ☐ Coverage meets thresholds             ║
║  ☐ No high/critical security issues      ║
║  ☐ Performance within baselines          ║
║  ☐ Full regression complete              ║
║                                           ║
╚═══════════════════════════════════════════╝
```

## 🤝 Working with Chuck and Thomas

| Agent | Responsibility |
|-------|----------------|
| **Chuck** | CI/CD, branch naming, commits |
| **Thomas** | Documentation quality |
| **Tucker** | Test coverage, quality gates |

Tucker's tests run in Chuck's pipeline. Thomas documents Tucker's test strategies.

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [TUCKER.md](./TUCKER.md) | Complete Tucker documentation |
| [CLAUDE.md](./CLAUDE.md) | Claude Code configuration |
| [QUICKSTART.md](./QUICKSTART.md) | 10-minute setup guide |

## 🧪 Test Templates

| Template | Use For |
|----------|---------|
| `unit.test.template.js` | Service/function unit tests |
| `e2e.spec.template.ts` | User journey E2E tests |
| `api.test.template.ts` | API endpoint tests |

Each template includes:
- ✅ Happy path tests
- ✅ Error handling tests
- ✅ Edge case tests
- ✅ Security tests
- ✅ Performance checks

---

<p align="center">
  <strong>Tucker: Your QA Guardian</strong><br>
  <em>Finding bugs so users don't have to.</em>
</p>

---

*If I didn't break it, I didn't try hard enough.* 🔨
