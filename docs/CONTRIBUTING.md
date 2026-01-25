# Contributing to PetForce

Thank you for your interest in contributing to PetForce! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in your interactions.

### Our Standards

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on what is best for the community
- Show empathy towards others

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or inflammatory comments
- Publishing others' private information
- Other conduct deemed inappropriate

## Getting Started

### Prerequisites

Before contributing, ensure you have:

1. Read the [Getting Started Guide](./GETTING_STARTED.md)
2. Set up your development environment
3. Familiarized yourself with the codebase
4. Read this contributing guide

### Finding Work

1. **Check Issues**: Browse [open issues](https://github.com/yourusername/petforce/issues)
2. **Good First Issues**: Look for `good-first-issue` label
3. **Help Wanted**: Check `help-wanted` label
4. **Ask Questions**: Comment on issues before starting work

### Before You Start

1. **Claim the Issue**: Comment on the issue you want to work on
2. **Discuss Approach**: For large changes, discuss your approach first
3. **Fork the Repo**: Create your own fork
4. **Create Branch**: Make a feature branch

## Development Workflow

### 1. Fork and Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/petforce.git
cd petforce

# Add upstream remote
git remote add upstream https://github.com/yourusername/petforce.git
```

### 2. Create a Branch

```bash
# Update your fork
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

### 3. Make Your Changes

```bash
# Install dependencies
npm install

# Start development server
npm run dev --workspace @petforce/web

# Make your changes
# ...

# Run tests
npm test

# Run linter
npm run lint

# Type check
npm run typecheck
```

### 4. Commit Your Changes

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add user profile editing"
```

### 5. Push and Create PR

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create Pull Request on GitHub
```

## Coding Standards

### TypeScript

- Use TypeScript for all code
- Enable strict mode
- Define types for all function parameters and return values
- Avoid `any` type - use `unknown` if necessary
- Use interface for object shapes
- Use type for unions and primitives

**Good:**
```typescript
interface User {
  id: string;
  email: string;
}

function getUser(id: string): Promise<User> {
  // Implementation
}
```

**Bad:**
```typescript
function getUser(id: any): any {
  // Implementation
}
```

### React Components

- Use functional components
- Use hooks for state and effects
- Props should be typed with interface
- Export component as named export
- Keep components small and focused

**Good:**
```typescript
interface ButtonProps {
  onClick: () => void;
  children: ReactNode;
  variant?: 'primary' | 'secondary';
}

export function Button({ onClick, children, variant = 'primary' }: ButtonProps) {
  return (
    <button onClick={onClick} className={variant}>
      {children}
    </button>
  );
}
```

### Naming Conventions

- **Components**: PascalCase (`Button`, `UserProfile`)
- **Functions**: camelCase (`getUserProfile`, `validateEmail`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
- **Files**: Match component name (`Button.tsx`)
- **Test files**: `*.test.tsx` or `*.test.ts`
- **Types**: PascalCase (`User`, `AuthState`)

### File Structure

```typescript
// 1. Imports
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

// 2. Types/Interfaces
interface Props {
  name: string;
}

// 3. Component
export function MyComponent({ name }: Props) {
  // 4. Hooks
  const [count, setCount] = useState(0);

  // 5. Event handlers
  const handleClick = () => {
    setCount(count + 1);
  };

  // 6. Render
  return (
    <div>
      <h1>{name}</h1>
      <Button onClick={handleClick}>{count}</Button>
    </div>
  );
}

// 7. Styled components / constants (if needed)
const styles = {
  container: '...',
};
```

### CSS/Styling

**Web (Tailwind):**
- Use Tailwind utility classes
- Create reusable components for repeated patterns
- Use design tokens from theme
- Keep classNames readable (max 5-6 utilities per element)

**Mobile (StyleSheet):**
- Use StyleSheet.create
- Extract common styles to theme
- Use flexbox for layouts
- Avoid inline styles

### Comments

- Write self-documenting code
- Comment "why" not "what"
- Use JSDoc for public APIs
- Keep comments up to date

**Good:**
```typescript
// Retry failed requests to handle temporary network issues
const maxRetries = 3;

/**
 * Validates user email address format
 * @param email - Email address to validate
 * @returns true if valid, false otherwise
 */
export function validateEmail(email: string): boolean {
  // Implementation
}
```

**Bad:**
```typescript
// Set max retries to 3
const maxRetries = 3;

// This function validates email
function validateEmail(email: string) {
  // Check if email is valid
  const isValid = /.../.test(email);
  return isValid;
}
```

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/).

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic changes)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

### Scope

Optional scope specifying what part is affected:
- `auth`: Authentication
- `ui`: UI components
- `mobile`: Mobile app
- `web`: Web app
- `api`: API changes

### Examples

```bash
feat(auth): add biometric authentication
fix(ui): button disabled state not working
docs: update contributing guidelines
style(web): format code with prettier
refactor(auth): simplify token refresh logic
test(auth): add validation utility tests
chore: update dependencies
```

### Rules

- Use present tense ("add feature" not "added feature")
- Use imperative mood ("move cursor to..." not "moves cursor to...")
- First line max 72 characters
- Reference issues in footer (`Fixes #123`)
- Breaking changes should include `BREAKING CHANGE:` in footer

## Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] No console.log or debugging code
- [ ] TypeScript types are correct
- [ ] Commit messages follow guidelines

### PR Title

Follow commit message format:

```
feat(auth): add password reset flow
fix(mobile): biometric prompt not showing
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- List of changes
- Another change

## Testing
Describe how you tested the changes

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No breaking changes (or documented)

## Related Issues
Fixes #123
Related to #456
```

### Review Process

1. **Automated Checks**: CI/CD runs tests and linting
2. **Code Review**: Maintainers review your code
3. **Feedback**: Address any requested changes
4. **Approval**: Get approval from maintainers
5. **Merge**: Maintainer merges your PR

### After Merging

- Delete your feature branch
- Pull latest changes from upstream
- Close related issues

## Testing Requirements

### Required Tests

All changes must include tests:

- **New Features**: Unit tests + integration test
- **Bug Fixes**: Test that reproduces the bug + fix
- **Refactoring**: Existing tests must still pass
- **UI Components**: Render tests + interaction tests

### Test Guidelines

```typescript
// Good test structure
describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click</Button>);
    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific workspace tests
npm test --workspace @petforce/web

# Run tests in watch mode
npm test -- --watch

# Run with coverage
npm run test:coverage
```

### Coverage Requirements

- Minimum 80% coverage for new code
- 100% coverage for utility functions
- Integration tests for critical paths

## Documentation

### When to Update Docs

- Adding new features
- Changing existing features
- Fixing bugs that affect usage
- Adding new APIs

### What to Document

- **Code**: JSDoc comments for public APIs
- **README**: High-level overview and setup
- **Guides**: Step-by-step tutorials
- **API**: Complete API reference
- **Architecture**: Design decisions

### Documentation Style

- Use clear, concise language
- Include code examples
- Add screenshots for UI
- Keep it up to date

## Questions or Problems?

- **Issues**: [GitHub Issues](https://github.com/yourusername/petforce/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/petforce/discussions)
- **Discord**: [Join our Discord](https://discord.gg/petforce)
- **Email**: contribute@petforce.app

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Thanked in our community

Thank you for contributing to PetForce! 🐾

---

**Last Updated**: January 24, 2026
