# Contributing to PetForce

Thank you for your interest in contributing to PetForce! We're excited to have you join our community of contributors who are passionate about making pet care easier for families everywhere.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [Documentation](#documentation)
- [Community](#community)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of:

- Experience level
- Gender identity and expression
- Sexual orientation
- Disability
- Personal appearance
- Body size
- Race or ethnicity
- Age
- Religion or lack thereof
- Nationality

### Our Standards

**Positive behaviors include:**

- Being respectful and considerate
- Accepting constructive criticism gracefully
- Focusing on what's best for the community
- Showing empathy toward other contributors
- Celebrating successes together

**Unacceptable behaviors include:**

- Harassment or discriminatory language
- Personal attacks or trolling
- Publishing others' private information
- Any conduct inappropriate in a professional setting

### Enforcement

Violations of the Code of Conduct can be reported to the project maintainers. All reports will be reviewed confidentially and appropriate action will be taken.

---

## Getting Started

### Prerequisites

Before you begin, ensure you have:

- **Node.js** 20.19.0 or higher
- **npm** 10.2.4 or higher
- **Git** 2.30 or higher
- A **GitHub account**
- **Supabase account** (for authentication testing)

### Environment Setup

1. **Fork the repository**

   ```bash
   # Go to https://github.com/betforce1211-gif/PetForce
   # Click "Fork" button
   ```

2. **Clone your fork**

   ```bash
   git clone https://github.com/YOUR_USERNAME/PetForce.git
   cd PetForce
   ```

3. **Add upstream remote**

   ```bash
   git remote add upstream https://github.com/betforce1211-gif/PetForce.git
   ```

4. **Install dependencies**

   ```bash
   npm install
   ```

5. **Set up environment variables**

   ```bash
   # Web app
   cp apps/web/.env.example apps/web/.env
   # Edit apps/web/.env with your Supabase credentials

   # Mobile app
   cp apps/mobile/.env.example apps/mobile/.env
   # Edit apps/mobile/.env with your Supabase credentials
   ```

6. **Verify setup**
   ```bash
   ./scripts/verify-git-setup
   npm test
   ```

### Understanding the Codebase

Take time to familiarize yourself with:

- [Architecture Documentation](./docs/ARCHITECTURE.md)
- [Git Workflow Guide](./docs/GIT_WORKFLOW.md)
- [Testing Guide](./TESTING.md)
- [Code Structure](#project-structure)

---

## Development Workflow

### 1. Choose an Issue

- Browse [open issues](https://github.com/betforce1211-gif/PetForce/issues)
- Look for issues labeled `good first issue` or `help wanted`
- Comment on the issue to express interest
- Wait for assignment or approval from maintainers

### 2. Create a Feature Branch

Use Chuck CLI for proper branch naming:

```bash
# For new features
./scripts/chuck create-branch feature PET-123 "add medication reminders"
# Creates: feature/PET-123-add-medication-reminders

# For bug fixes
./scripts/chuck create-branch bugfix PET-124 "fix login redirect"
# Creates: bugfix/PET-124-fix-login-redirect

# For hotfixes
./scripts/chuck create-branch hotfix PET-125 "critical auth vulnerability"
# Creates: hotfix/PET-125-critical-auth-vulnerability
```

**Branch Naming Conventions:**

- `feature/` - New features
- `bugfix/` - Bug fixes
- `hotfix/` - Critical production fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test improvements
- `chore/` - Build/tooling updates

### 3. Make Your Changes

- Write clean, readable code
- Follow our [Coding Standards](#coding-standards)
- Write or update tests
- Update documentation
- Keep commits atomic and focused

### 4. Test Your Changes

```bash
# Run all tests
npm test

# Run linting
npm run lint

# Run type checking
npm run typecheck

# Run all checks
npm run check:all
```

### 5. Commit Your Changes

We use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format: <type>(<scope>): <subject>

git commit -m "feat(auth): add email verification reminder"
git commit -m "fix(households): correct invite code validation"
git commit -m "docs(api): update household endpoints"
```

**Commit Types:**

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Code style (formatting, no logic change)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Build process, dependencies, etc.
- `perf` - Performance improvement

### 6. Push and Create Pull Request

```bash
# Push to your fork
git push origin feature/PET-123-add-medication-reminders

# Create PR using GitHub CLI
gh pr create --fill

# Or manually create PR on GitHub
```

---

## Coding Standards

### TypeScript

- Use **TypeScript** for all new code
- Avoid `any` types - use specific types or `unknown`
- Define interfaces for complex objects
- Use type inference where appropriate

**Example:**

```typescript
// ✅ Good
interface CreateHouseholdInput {
  name: string;
  description?: string;
}

async function createHousehold(
  input: CreateHouseholdInput,
): Promise<Household> {
  // Implementation
}

// ❌ Bad
async function createHousehold(input: any): Promise<any> {
  // Implementation
}
```

### React

- Use **functional components** with hooks
- Use **custom hooks** for reusable logic
- Keep components small and focused
- Use proper prop types

**Example:**

```typescript
// ✅ Good
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export function Button({ label, onClick, variant = 'primary', disabled = false }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {label}
    </button>
  );
}

// ❌ Bad
export function Button(props: any) {
  return <button onClick={props.onClick}>{props.label}</button>;
}
```

### Code Style

- Use **2 spaces** for indentation
- Use **single quotes** for strings (except JSX attributes)
- Use **semicolons**
- Max line length: **100 characters**
- Use **Prettier** for formatting (runs automatically on commit)

### Naming Conventions

- **Components**: PascalCase (`HouseholdCard.tsx`)
- **Functions**: camelCase (`createHousehold()`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_HOUSEHOLD_SIZE`)
- **Interfaces**: PascalCase with `I` prefix optional (`HouseholdInput` or `IHouseholdInput`)
- **Types**: PascalCase (`HouseholdRole`)

### File Organization

```typescript
// Component file structure
import React from 'react';
import { externalDependencies } from 'external-package';
import { internalDependencies } from '@petforce/auth';
import { localDependencies } from '../utils';

// Types/Interfaces
interface ComponentProps {
  // ...
}

// Component
export function Component({ props }: ComponentProps) {
  // Hooks
  const [state, setState] = useState();

  // Effects
  useEffect(() => {
    // ...
  }, []);

  // Event handlers
  const handleClick = () => {
    // ...
  };

  // Render
  return (
    <div>
      {/* ... */}
    </div>
  );
}
```

### Comments

- Write **self-documenting code** first
- Use comments for **why**, not **what**
- Use JSDoc for public APIs

```typescript
// ❌ Bad comment (obvious)
// Increment counter by 1
counter++;

// ✅ Good comment (explains why)
// Use exponential backoff to avoid overwhelming the API
await retry(apiCall, { maxAttempts: 3, backoff: "exponential" });

// ✅ JSDoc for public API
/**
 * Creates a new household for the user
 *
 * @param input - Household creation data
 * @param userId - ID of the user creating the household
 * @returns Created household with generated invite code
 * @throws {ValidationError} If household name is invalid
 * @throws {DatabaseError} If database operation fails
 */
export async function createHousehold(
  input: CreateHouseholdInput,
  userId: string,
): Promise<Household> {
  // Implementation
}
```

---

## Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Examples:**

```
feat(auth): add email verification reminder

Users who haven't verified their email within 24 hours will now receive
a reminder notification. This improves the email verification rate.

Closes #123
```

```
fix(households): correct invite code expiration check

Previously, expired invite codes were still accepted due to incorrect
date comparison. This fix ensures expired codes are properly rejected.

Fixes #456
```

### Commit Types

| Type       | Description      | Example                                    |
| ---------- | ---------------- | ------------------------------------------ |
| `feat`     | New feature      | `feat(pets): add medication tracking`      |
| `fix`      | Bug fix          | `fix(auth): resolve logout redirect issue` |
| `docs`     | Documentation    | `docs(api): update household endpoints`    |
| `style`    | Code style       | `style(ui): format button components`      |
| `refactor` | Code refactoring | `refactor(db): extract connection logic`   |
| `test`     | Tests            | `test(auth): add email verification tests` |
| `chore`    | Build/tools      | `chore(deps): upgrade React to 18.3`       |
| `perf`     | Performance      | `perf(api): cache household queries`       |

### Commit Scope

Common scopes:

- `auth` - Authentication
- `households` - Household management
- `pets` - Pet profiles
- `api` - API layer
- `ui` - UI components
- `mobile` - Mobile app
- `web` - Web app
- `docs` - Documentation
- `ci` - CI/CD

### Commit Best Practices

- **One logical change per commit**
- **Write in imperative mood** ("add" not "added")
- **Keep subject under 72 characters**
- **Separate subject from body** with blank line
- **Explain what and why**, not how
- **Reference issues** in footer

---

## Pull Request Process

### Before Creating PR

1. **Sync with upstream**

   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run all checks**

   ```bash
   npm run check:all
   ```

3. **Validate PR readiness**
   ```bash
   ./scripts/chuck pr validate
   ```

### Creating the PR

1. **Use the PR template** (auto-populated)
2. **Write a clear title** (use conventional commit format)
3. **Fill out all sections** of the template
4. **Link related issues** (`Closes #123`)
5. **Add screenshots** for UI changes
6. **Request reviewers** (auto-assigned by CODEOWNERS)

### PR Template Sections

- **Description**: What does this PR do?
- **Motivation**: Why is this change needed?
- **Changes**: List of specific changes
- **Testing**: How was this tested?
- **Screenshots**: For visual changes
- **Checklist**: Pre-submission checklist

### Review Process

1. **Wait for CI checks** to pass
2. **Address reviewer feedback** promptly
3. **Push updates** to your branch
4. **Request re-review** after changes
5. **Celebrate** when approved! 🎉

### After Merge

1. **Delete your branch** (GitHub does this automatically)
2. **Sync your fork**
   ```bash
   git checkout main
   git fetch upstream
   git merge upstream/main
   git push origin main
   ```

---

## Testing Requirements

### Coverage Requirements

- **Unit tests**: Required for all new features
- **Integration tests**: Required for API endpoints
- **E2E tests**: Required for critical user flows
- **Coverage target**: 80%+ for new code

### Writing Tests

```typescript
// Example unit test
describe("createHousehold", () => {
  it("should create household with valid input", async () => {
    const input = { name: "Test Household" };
    const result = await createHousehold(input, "user-123");

    expect(result).toHaveProperty("id");
    expect(result.name).toBe("Test Household");
    expect(result.leaderId).toBe("user-123");
  });

  it("should reject invalid household name", async () => {
    const input = { name: "" };

    await expect(createHousehold(input, "user-123")).rejects.toThrow(
      ValidationError,
    );
  });
});
```

### Test Organization

```
src/
├── features/
│   └── households/
│       ├── HouseholdCard.tsx
│       └── __tests__/
│           └── HouseholdCard.test.tsx
└── api/
    ├── households.ts
    └── __tests__/
        └── households.test.ts
```

See [Testing Guide](./TESTING.md) for comprehensive testing documentation.

---

## Documentation

### When to Update Documentation

Update docs when you:

- Add new features
- Change existing behavior
- Add or modify APIs
- Update configuration
- Change deployment process
- Fix bugs that affect documented behavior

### Documentation Types

1. **Code Comments** - Inline documentation
2. **JSDoc** - API documentation
3. **README files** - Package/feature documentation
4. **Guides** - How-to documentation in `/docs`
5. **Architecture docs** - System design in `/docs`

### Documentation Standards

- **Be clear and concise**
- **Use examples**
- **Keep it up-to-date**
- **Include code snippets**
- **Add diagrams** for complex flows (use Mermaid)

---

## Community

### Getting Help

- **GitHub Discussions**: [Ask questions](https://github.com/betforce1211-gif/PetForce/discussions)
- **GitHub Issues**: [Report bugs](https://github.com/betforce1211-gif/PetForce/issues)
- **Documentation**: Check `/docs` folder

### Recognition

Contributors are recognized in:

- [CONTRIBUTORS.md](./CONTRIBUTORS.md) file
- Release notes for significant contributions
- Special shout-outs in our community channels

### Types of Contributions

We appreciate all contributions:

- 🐛 **Bug reports**
- ✨ **Feature requests**
- 💻 **Code contributions**
- 📝 **Documentation improvements**
- 🧪 **Test improvements**
- 🎨 **UI/UX enhancements**
- 🌍 **Translations**
- 💬 **Community support**

---

## Quick Reference

### Common Commands

```bash
# Setup
npm install
./scripts/verify-git-setup

# Development
npm run dev --workspace @petforce/web
npm start --workspace @petforce/mobile

# Testing
npm test
npm run test:coverage
npm run test:watch

# Code Quality
npm run lint
npm run typecheck
npm run format
npm run check:all

# Git Workflow
./scripts/chuck create-branch feature PET-123 "description"
git add .
git commit -m "feat(scope): description"
./scripts/chuck pr validate
git push origin branch-name
gh pr create --fill

# Chuck CLI
./scripts/chuck help
./scripts/chuck validate-branch
./scripts/chuck check commits
./scripts/chuck check all
```

### Checklist Before PR

- [ ] Tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] Branch name follows convention
- [ ] Changes are atomic and focused
- [ ] Code is self-documenting
- [ ] No console.log statements
- [ ] No commented-out code
- [ ] PR template filled out completely

---

## Thank You!

Your contributions help make pet care easier for families everywhere. We're grateful for your time and effort! 🐾

**Questions?** Open a [discussion](https://github.com/betforce1211-gif/PetForce/discussions) or check our [documentation](./docs/).

---

**Made with 🐾 by the PetForce Community**

_Every contribution matters. Every pet deserves the best care._
