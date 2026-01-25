# Tucker QA Guardian - Quick Start Guide

Get Tucker up and running in your repository in 10 minutes.

## Prerequisites

- Node.js 18+ (or your runtime)
- Existing test framework (Jest, Mocha, etc.) or willingness to add one
- GitHub repository

---

## Step 1: Add Configuration Files

### Copy these files to your repository:

```
your-repo/
├── .github/
│   └── workflows/
│       └── tucker-tests.yml     # QA pipeline
├── .tucker.yml                   # Tucker configuration
├── CLAUDE.md                     # Claude Code agent config
└── tests/
    └── templates/               # Test templates
        ├── unit.test.template.js
        ├── e2e.spec.template.ts
        └── api.test.template.ts
```

### Quick copy commands:

```bash
# Create directories
mkdir -p .github/workflows
mkdir -p tests/templates

# Copy from this package
cp tucker-qa-agent/.github/workflows/*.yml .github/workflows/
cp tucker-qa-agent/.tucker.yml .
cp tucker-qa-agent/CLAUDE.md .
cp tucker-qa-agent/tests/templates/* tests/templates/
```

---

## Step 2: Configure for Your Project

### Update `.tucker.yml`

```yaml
# .tucker.yml - Minimum required changes

version: 1

testing:
  # Match your test framework
  frameworks:
    unit: 'jest'        # or 'mocha', 'vitest'
    e2e: 'playwright'   # or 'cypress'

  # Match your test file locations
  paths:
    unit: 'tests/**/*.test.{js,ts}'
    e2e: 'tests/e2e/**/*.spec.{js,ts}'

coverage:
  global:
    lines: 80           # Adjust to your starting point
    branches: 75
    functions: 85
```

### Update `package.json` scripts

Ensure these scripts exist (Tucker's workflow calls them):

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "playwright test",
    "test:coverage": "jest --coverage",
    "test:smoke": "jest --testPathPattern=smoke"
  }
}
```

---

## Step 3: Set Up Test Structure

Create the recommended test structure:

```bash
mkdir -p tests/{unit,integration,e2e,api,smoke}
mkdir -p tests/fixtures
mkdir -p tests/helpers
```

### Create a smoke test:

```javascript
// tests/smoke/app.smoke.test.js
describe('Smoke Tests', () => {
  it('should start the application', () => {
    // Basic sanity check
    expect(true).toBe(true);
  });

  it('should have required environment variables', () => {
    // Check critical env vars
    expect(process.env.NODE_ENV).toBeDefined();
  });
});
```

---

## Step 4: Install Dependencies

### Jest (if not already installed):

```bash
npm install --save-dev jest @types/jest ts-jest
```

### Playwright (for E2E):

```bash
npm install --save-dev @playwright/test
npx playwright install
```

### Coverage tools:

```bash
npm install --save-dev @jest/coverage-reporter
```

---

## Step 5: Commit and Push

```bash
# Create a properly named branch (if using Chuck)
git checkout -b feat/setup-tucker-qa

# Add files
git add .github/workflows/ .tucker.yml CLAUDE.md tests/

# Commit
git commit -m "test: add Tucker QA guardian"

# Push
git push -u origin feat/setup-tucker-qa
```

---

## Step 6: Verify Setup

After pushing, verify:

1. ✅ GitHub Actions workflow runs
2. ✅ Smoke tests pass
3. ✅ Coverage report generated
4. ✅ Tucker's Verdict comment appears on PRs

---

## Using Tucker with Claude Code

Once configured, Claude Code becomes Tucker:

```
You: I need tests for the UserService

Tucker: I'll help you create comprehensive tests for UserService.
Let me analyze the service and generate tests.

📝 Created: tests/unit/user-service.test.js

Tests include:
  ✅ Initialization tests (2)
  ✅ Happy path tests (5)
  ✅ Error handling tests (8)
  ✅ Edge cases (12)
    - Empty inputs
    - Max length strings
    - Unicode handling
    - Concurrent operations
  ✅ Security tests (4)

Coverage estimate: ~90%

Want me to run these tests?
```

```
You: Run the full test suite

Tucker: 🧪 Running Full Test Suite...

Test Results:
  ✅ Unit Tests:        234/234 passed (8.2s)
  ✅ Integration Tests:   45/45 passed (23.1s)
  ✅ E2E Tests:           12/12 passed (1m 15s)
  ✅ API Tests:           67/67 passed (12.4s)

Coverage: 87.3%
  Lines:     87.3% ✅
  Branches:  82.1% ✅
  Functions: 91.2% ✅

No edge cases escaped Tucker today! 🎉
```

---

## Tucker Commands

### Running Tests

```bash
tucker test all          # Run everything
tucker test unit         # Unit tests only
tucker test integration  # Integration tests
tucker test e2e          # End-to-end tests
tucker test smoke        # Quick validation
tucker test regression   # Full regression suite
```

### Coverage Analysis

```bash
tucker coverage analyze  # View coverage report
tucker coverage gaps     # Find untested code
```

### Creating Tests

```bash
tucker create unit "ServiceName"       # Generate unit test file
tucker create e2e "UserJourney"        # Generate E2E test file
tucker create api "Endpoint"           # Generate API test file
tucker generate edge-cases "function"  # Generate edge case tests
```

### Security & Quality

```bash
tucker scan security     # Run security scans
tucker analyze flaky     # Find flaky tests
```

---

## Test Coverage Goals

Start with achievable targets and increase over time:

| Phase | Lines | Branches | Functions |
|-------|-------|----------|-----------|
| Week 1 | 50% | 40% | 50% |
| Month 1 | 70% | 60% | 75% |
| Month 3 | 80% | 75% | 85% |
| Long-term | 90%+ | 85%+ | 95%+ |

---

## Edge Cases Tucker Always Tests

Tucker automatically suggests tests for:

**Strings:**
- Empty, whitespace, max length
- Unicode, emoji, special characters
- XSS and SQL injection payloads

**Numbers:**
- Zero, negative, MAX_INT
- Floating point precision
- NaN, Infinity

**Collections:**
- Empty, single element, at/over limits
- Duplicates, null elements

**Async:**
- Timeouts, race conditions
- Concurrent access, partial failures

---

## Troubleshooting

### Tests not running?

Check `package.json` has the expected scripts:
```json
{
  "scripts": {
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration"
  }
}
```

### Coverage too low?

1. Start with critical paths first
2. Use `tucker coverage gaps` to find priorities
3. Focus on business logic, not boilerplate

### Flaky tests?

```bash
tucker analyze flaky
```
Then either fix the root cause or quarantine while investigating.

### GitHub Actions failing?

- Check Node version matches your local
- Ensure all dependencies in `package.json`
- Verify test commands work locally first

---

## Integration with Chuck and Thomas

| Agent | Role | Integration |
|-------|------|-------------|
| **Chuck** | CI/CD, code quality | Tucker runs in Chuck's pipeline |
| **Thomas** | Documentation | Thomas documents test strategies |
| **Tucker** | Quality assurance | Tests must pass before merge |

---

## Next Steps

1. 📖 Read the full [TUCKER.md](./TUCKER.md) documentation
2. 🎯 Identify critical paths for your first tests
3. 🔄 Set up your first smoke tests
4. 📈 Gradually increase coverage targets

---

*Tucker: If I didn't break it, I didn't try hard enough.* 🔨
