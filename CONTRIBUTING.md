# Contributing to PetForce

Thank you for your interest in contributing to PetForce! This guide will help you get started with our development process.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Chuck's CI/CD Best Practices](#chucks-cicd-best-practices)
- [Branch Strategy](#branch-strategy)
- [Commit Messages](#commit-messages)
- [Pull Requests](#pull-requests)
- [Testing](#testing)
- [OpenSpec Workflow](#openspec-workflow)
- [Agent Checklists](#agent-checklists)

---

## Getting Started

### Prerequisites

- **Node.js**: 20.19.0+ (use nvm: `nvm use`)
- **npm**: 10.8.2+
- **Git**: Latest version
- **Supabase CLI**: For database migrations

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/petforce.git
   cd petforce
   ```

2. **Install Node.js (with nvm)**
   ```bash
   nvm use  # Uses version from .nvmrc
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

5. **Run tests to verify setup**
   ```bash
   cd packages/auth
   npm test
   ```

6. **Start development server**
   ```bash
   cd apps/web
   npm run dev
   ```

---

## Development Workflow

### 1. Create a Branch

Always create a feature branch from `develop`:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

**Branch Naming Conventions**:
- `feature/description` - New features
- `fix/description` - Bug fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation updates
- `test/description` - Test additions/updates
- `chore/description` - Build, CI/CD, or tooling changes

### 2. Make Changes

- Write clean, maintainable code
- Follow existing code style and conventions
- Add tests for new functionality
- Update documentation as needed
- Run linters and type checkers locally

### 3. Test Your Changes

```bash
# Run unit tests
cd packages/auth
npm test

# Run type checking
npm run typecheck

# Run linting
npm run lint
```

### 4. Commit Your Changes

Follow our [commit message conventions](#commit-messages):

```bash
git add .
git commit -m "feat(auth): add email verification auto-detection

- Polls every 10 seconds to check verification status
- Auto-redirects to success page when verified
- Addresses issue #123

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

---

## Chuck's CI/CD Best Practices

### ✅ Required Checks (Must Pass Before Merge)

1. **Linting**: Code must pass ESLint checks
2. **Type Checking**: TypeScript must compile without errors
3. **Unit Tests**: All tests must pass
4. **Build**: Application must build successfully
5. **OpenSpec Validation**: Specs must be valid (if applicable)
6. **Security Audit**: No high/critical vulnerabilities

### 🚀 Deployment Pipeline

```
develop → Staging (auto-deploy) → main → Production (manual approval)
```

**Staging Deployment**:
- Triggered on push to `develop`
- Runs smoke tests automatically
- Accessible at `https://staging.petforce.app`

**Production Deployment**:
- Triggered on push to `main` or version tags
- Requires manual approval via GitHub Environments
- Runs full test suite before deployment
- Creates Sentry release for error tracking
- Performs post-deployment health checks

### 📊 Metrics and Monitoring

After deployment, check:
- **Auth Metrics Dashboard**: `/admin/auth-metrics`
- **Sentry**: Error rates and user feedback
- **Logs**: CloudWatch or structured logs
- **Alerts**: Slack notifications for issues

---

## Branch Strategy

We follow **Git Flow**:

```
main (production)
  ↑
develop (staging)
  ↑
feature/* (development)
```

### Branch Protection Rules

**`main` branch**:
- ✅ Require pull request reviews (2 approvals)
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Require conversation resolution
- ❌ No direct pushes allowed
- ✅ Require linear history

**`develop` branch**:
- ✅ Require pull request reviews (1 approval)
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ❌ No direct pushes allowed

### Merging Strategy

- **Feature → Develop**: Squash and merge
- **Develop → Main**: Merge commit (preserves history)

---

## Commit Messages

Follow **Conventional Commits** specification:

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process, CI/CD, dependencies
- `perf`: Performance improvements
- `revert`: Reverting previous changes

### Examples

**Good**:
```
feat(auth): add email verification pending page

- Created EmailVerificationPendingPage component
- Auto-detects verification with 10s polling
- Includes resend button with 5min cooldown

Closes #456
```

**Good**:
```
fix(auth): reject login for unconfirmed users

Previously, unconfirmed users could sometimes login before
verifying their email. This adds explicit check for
email_confirmed_at field and returns EMAIL_NOT_CONFIRMED error.

Fixes #123
```

**Bad**:
```
updated stuff
```

**Bad**:
```
WIP
```

### Co-Authoring with AI

When working with Claude or other AI assistants:

```
fix(auth): improve error logging

Added request ID tracking and structured logging.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## Pull Requests

### PR Checklist

Before submitting a PR, ensure:

- [ ] Code follows project style guidelines
- [ ] All tests pass locally
- [ ] New tests added for new functionality
- [ ] Documentation updated (if applicable)
- [ ] OpenSpec proposal created (if needed)
- [ ] Agent checklists reviewed
- [ ] No console.log or debugging code
- [ ] Environment variables documented in `.env.example`
- [ ] Breaking changes documented

### PR Template

We provide a PR template that includes:
- Description of changes
- Type of change
- Agent checklists
- Testing performed
- Deployment notes

**Fill out the template completely!** This helps reviewers understand your changes.

### Review Process

1. **Automated Checks**: CI must pass (linting, tests, build)
2. **Code Review**: At least 1-2 approvals required
3. **Agent Review**: Verify relevant agent checklists
4. **OpenSpec Review**: If specs changed
5. **Final Approval**: Maintainer approval for merge

---

## Testing

### Test Pyramid

```
        E2E
       /   \
      /     \
  Integration
    /       \
   /         \
  Unit Tests
```

### Running Tests

```bash
# All tests
npm test

# Specific package
cd packages/auth
npm test

# Watch mode
npm test -- --watch

# Coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

### Writing Tests

**Unit Tests** (Required):
```typescript
describe('register()', () => {
  it('should detect unconfirmed user state', async () => {
    // Test implementation
  });
});
```

**Integration Tests** (Recommended):
```typescript
describe('Registration Flow', () => {
  it('should create user and send verification email', async () => {
    // Test full flow
  });
});
```

**E2E Tests** (For critical flows):
```typescript
test('User can register and verify email', async ({ page }) => {
  // Playwright test
});
```

### Test Coverage Goals

- **Packages**: ≥80% coverage
- **Critical Paths**: 100% coverage (auth, payments)
- **New Code**: Must have tests

---

## OpenSpec Workflow

For features requiring planning:

### 1. Create Proposal

```bash
openspec proposal "Feature description"
```

This creates:
- `openspec/changes/<change-id>/proposal.md`
- `openspec/changes/<change-id>/tasks.md`
- `openspec/changes/<change-id>/specs/*/spec.md`

### 2. Fill Out Agent Research

Use the multi-agent research process:
- Peter: Requirements and competitor research
- Tucker: Test requirements
- Larry: Logging requirements
- Dexter: UX requirements
- Samantha: Security requirements

### 3. Validate

```bash
openspec validate <change-id> --strict
```

### 4. Get Approval

- Create PR with proposal
- Team reviews and approves
- Agent checklists verified

### 5. Implement

Follow the Ralph Method:
- Implement iteratively
- Verify against each agent's checklist
- Update tests and docs
- Validate continuously

### 6. Archive

```bash
openspec archive <change-id>
```

---

## Agent Checklists

Each agent has specific responsibilities. Verify these before submitting PR:

### Peter (Product Management)
- [ ] Requirements clearly defined
- [ ] Acceptance criteria specified
- [ ] Competitor research completed
- [ ] User stories documented

### Engrid (Engineering)
- [ ] Code follows best practices
- [ ] Defensive programming applied
- [ ] Error handling comprehensive
- [ ] State validation implemented

### Tucker (QA/Testing)
- [ ] Unit tests written
- [ ] Integration tests added
- [ ] Edge cases tested
- [ ] Database state validated

### Larry (Logging/Observability)
- [ ] Request ID tracking added
- [ ] Auth events logged
- [ ] Metrics emitted
- [ ] Error logging comprehensive

### Dexter (UX/Design)
- [ ] User flow designed
- [ ] Error messages clear
- [ ] Accessibility considered
- [ ] Mobile responsive

### Samantha (Security)
- [ ] Authentication secure
- [ ] Authorization implemented
- [ ] Data validation added
- [ ] Security implications reviewed

### Chuck (CI/CD)
- [ ] CI checks pass
- [ ] Build succeeds
- [ ] Deployment tested
- [ ] Environment vars documented

---

## Code Style

### TypeScript

- Use TypeScript for all new code
- Avoid `any` types (use `unknown` if needed)
- Export types and interfaces
- Use strict mode

### React

- Use functional components with hooks
- Extract complex logic into custom hooks
- Keep components small and focused
- Use proper TypeScript types for props

### Naming Conventions

- **Files**: `kebab-case.ts`
- **Components**: `PascalCase.tsx`
- **Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Types/Interfaces**: `PascalCase`

### File Organization

```
src/
├── api/          # API functions
├── components/   # React components
├── hooks/        # Custom hooks
├── pages/        # Page components
├── types/        # TypeScript types
├── utils/        # Utility functions
└── __tests__/    # Test files
```

---

## Environment Variables

### Never Commit Secrets!

- Add secrets to `.env` (gitignored)
- Document in `.env.example` (committed)
- Use GitHub Secrets for CI/CD

### Required Variables

See `.env.example` for the full list of required environment variables.

---

## Getting Help

- **Issues**: Check existing issues or create a new one
- **Discussions**: Use GitHub Discussions for questions
- **Slack**: Join our Slack workspace (if applicable)
- **Documentation**: Check `/docs` folder

---

## License

By contributing to PetForce, you agree that your contributions will be licensed under the project's license.

---

## Thank You! 🎉

Your contributions make PetForce better for everyone. We appreciate your time and effort!
