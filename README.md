# PetForce 🐾

The simplest way to care for your family's pets.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)](./TESTING.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-Chuck%20Guardian-brightgreen.svg)](./docs/GIT_WORKFLOW.md)

## Overview

PetForce is a comprehensive pet care platform that helps families manage their pets' health, track medical records, set reminders, and connect with veterinarians. Built with modern web and mobile technologies, it provides a seamless experience across all devices.

## Features

### 🔐 Authentication (Currently Implemented)

- **Email/Password** - Traditional authentication with password strength validation
- **Magic Links** - Passwordless authentication via email
- **Social Sign-On** - Sign in with Google or Apple
- **Biometric Auth** - Face ID, Touch ID, and Fingerprint support on mobile
- **Secure Sessions** - Token-based authentication with automatic refresh
- **Password Reset** - Secure password recovery flow

### 🚀 Coming Soon

- **Pet Profiles** - Manage multiple pets with photos and details
- **Health Records** - Track vaccinations, medications, and vet visits
- **Care Reminders** - Never miss feeding, walks, or medication times
- **Vet Connection** - Share records with your veterinarian
- **Family Sharing** - Collaborative pet care with family members
- **Health Analytics** - Insights and trends about your pet's health

## Platforms

- ✅ **Web** - Modern responsive web application
- ✅ **iOS** - Native iOS app with React Native
- ✅ **Android** - Native Android app with React Native

## Quick Start

### Prerequisites

- Node.js 20.19.0 or higher
- npm 10.2.4 or higher
- Git 2.30+

### Installation

```bash
# Clone the repository
git clone https://github.com/betforce1211-gif/PetForce.git
cd PetForce

# Install dependencies (includes Git hooks setup)
npm install

# Verify setup
./scripts/verify-git-setup

# Set up environment variables
cp apps/web/.env.example apps/web/.env
cp apps/mobile/.env.example apps/mobile/.env
# Edit .env files with your Supabase credentials
```

### Running the Applications

#### Web App

```bash
# Development mode
npm run dev --workspace @petforce/web

# Production build
npm run build --workspace @petforce/web
```

Visit http://localhost:3000

#### Mobile App

```bash
# Start Expo development server
npm start --workspace @petforce/mobile

# Run on iOS simulator
npm run ios --workspace @petforce/mobile

# Run on Android emulator
npm run android --workspace @petforce/mobile
```

## Tech Stack

- **React** 18.2 + **TypeScript** 5.3
- **React Router** (web) + **React Navigation** (mobile)
- **Tailwind CSS** (web styling)
- **Supabase** (authentication, database)
- **Zustand** (state management)
- **Vitest** + **Testing Library** (testing)
- **Turborepo** (monorepo management)

## Development

### Quick Commands

```bash
# Run all tests
npm test

# Lint code
npm run lint

# Type check
npm run typecheck

# Format code
npm run format

# Run all checks (lint + typecheck + test + build)
npm run check:all
```

### Git Workflow

We use enterprise-grade Git workflows with automated quality gates:

```bash
# Create a new feature branch
./scripts/chuck create-branch feature PET-123 "add medication reminders"

# Make changes and commit
git add .
git commit -m "feat(reminders): add medication reminder feature"

# Validate before PR
./scripts/chuck pr validate

# Push and create PR
git push origin feature/PET-123-add-medication-reminders
gh pr create --fill
```

### Chuck CLI - Your CI/CD Guardian

Chuck helps you maintain code quality and follow best practices:

```bash
# Validate branch name
./scripts/chuck validate-branch

# Check commit messages
./scripts/chuck check commits

# Run all checks
./scripts/chuck check all

# Validate PR readiness
./scripts/chuck pr validate

# Get help
./scripts/chuck help
```

**Quality gates protect pet families. Every deployment matters.**

## Documentation

### Essential Guides

- **[Git Workflow Guide](./docs/GIT_WORKFLOW.md)** - Complete Git workflow and branching strategy
- **[Git Setup Guide](./docs/GIT_SETUP.md)** - Development environment setup
- **[Contributing Guide](./CONTRIBUTING.md)** - How to contribute to PetForce
- **[Testing Guide](./TESTING.md)** - Testing standards and practices

### Additional Documentation

- [API Documentation](./docs/API.md) - API reference
- [Architecture](./docs/ARCHITECTURE.md) - System architecture
- [Branch Protection](./docs/BRANCH_PROTECTION.md) - Branch protection rules
- [Deployment Guide](./docs/DEPLOYMENT.md) - Deployment procedures
- [Git Best Practices Summary](./docs/GIT_BEST_PRACTICES_SUMMARY.md) - Implementation overview
- [Mobile App README](./apps/mobile/README.md) - Mobile-specific docs

## Project Structure

```
PetForce/
├── apps/
│   ├── web/              # React web application
│   └── mobile/           # React Native mobile app
├── packages/
│   ├── auth/             # Authentication package
│   ├── supabase/         # Supabase client & utilities
│   └── ui/               # Shared UI components
├── docs/                 # Documentation
├── scripts/              # Helper scripts (Chuck CLI)
├── .github/              # GitHub configuration
│   ├── workflows/        # CI/CD workflows
│   └── ISSUE_TEMPLATE/   # Issue templates
└── .husky/               # Git hooks
```

## CI/CD Pipeline

### Automated Workflows

- **CI** - Runs on every PR: lint, typecheck, test, build
- **Security Scan** - Daily vulnerability scanning
- **Staging Deploy** - Auto-deploy to staging on push to `develop`
- **Production Deploy** - Manual approval for `main` branch
- **Release** - Automated versioning and changelog
- **E2E Tests** - End-to-end testing for critical flows

### Branch Protection

- **`main`** - Requires 2 approvals, all CI checks pass
- **`develop`** - Requires 1 approval, all CI checks pass
- **Git Hooks** - Pre-commit, commit-msg, pre-push validation

See [Branch Protection Rules](./docs/BRANCH_PROTECTION.md) for details.

## Contributing

We welcome contributions! Please follow our Git workflow:

1. Read the [Contributing Guide](./CONTRIBUTING.md)
2. Read the [Git Workflow Guide](./docs/GIT_WORKFLOW.md)
3. Set up your development environment with [Git Setup Guide](./docs/GIT_SETUP.md)
4. Create a feature branch using proper naming conventions
5. Make your changes with conventional commit messages
6. Run `./scripts/chuck pr validate` before creating PR
7. Create PR using the template
8. Wait for reviews and address feedback

### Code of Conduct

- Be respectful and professional
- Follow coding standards and best practices
- Write tests for your code
- Update documentation
- Respond to code review feedback

## Testing

```bash
# Run all tests
npm test --workspaces

# Run tests with coverage
npm run test:coverage --workspaces

# Run specific package tests
cd packages/auth
npm test

# Run E2E tests
npm run test:e2e --if-present
```

See [Testing Guide](./TESTING.md) for comprehensive testing documentation.

## Security

Security is a top priority at PetForce. We scan for vulnerabilities daily and follow security best practices.

### Reporting Security Issues

**Do not create public issues for security vulnerabilities.**

Instead:
1. Go to the **Security** tab
2. Click **Report a vulnerability**
3. Fill out the private security advisory

For security improvements or general security discussions, use the [Security issue template](.github/ISSUE_TEMPLATE/security.md).

### Security Scanning

We use multiple tools to ensure security:
- npm audit (dependency vulnerabilities)
- Snyk (advanced vulnerability scanning)
- CodeQL (static code analysis)
- TruffleHog (secret scanning)
- Trivy (Docker image scanning)

## Deployment

### Environments

- **Development** - Local development
- **Staging** - https://staging.petforce.app (auto-deploy from `develop`)
- **Production** - https://petforce.app (manual approval from `main`)

### Deployment Process

1. Merge to `develop` → Auto-deploy to staging
2. Test on staging
3. Merge to `main` → Manual approval required
4. Deploy to production
5. Monitor health checks and error rates

See [Deployment Guide](./docs/DEPLOYMENT.md) for details.

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Support

- **Issues**: [Create an issue](https://github.com/betforce1211-gif/PetForce/issues/new/choose)
- **Discussions**: [GitHub Discussions](https://github.com/betforce1211-gif/PetForce/discussions)
- **Documentation**: Check the `/docs` folder

---

## Quick Links

- 📖 [Git Workflow](./docs/GIT_WORKFLOW.md)
- 🛠️ [Git Setup](./docs/GIT_SETUP.md)
- 🤝 [Contributing](./CONTRIBUTING.md)
- 🧪 [Testing](./TESTING.md)
- 🚀 [Deployment](./docs/DEPLOYMENT.md)
- 🏗️ [Architecture](./docs/ARCHITECTURE.md)
- 📋 [API Docs](./docs/API.md)
- 🔒 [Security](https://github.com/betforce1211-gif/PetForce/security)

---

**Made with 🐾 by the PetForce Team**

*Quality gates protect pet families. Every deployment matters.* — Chuck, CI/CD Guardian 🛡️
