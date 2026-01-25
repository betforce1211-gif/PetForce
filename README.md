# PetForce 🐾

The simplest way to care for your family's pets.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)](./TESTING.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

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
- Git

### Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/yourusername/petforce.git
cd petforce

# Install dependencies
npm install

# Set up environment variables
cp apps/web/.env.example apps/web/.env
cp apps/mobile/.env.example apps/mobile/.env
# Edit .env files with your Supabase credentials
\`\`\`

### Running the Applications

#### Web App

\`\`\`bash
# Development mode
npm run dev --workspace @petforce/web

# Production build
npm run build --workspace @petforce/web
\`\`\`

Visit http://localhost:3000

#### Mobile App

\`\`\`bash
# Start Expo development server
npm start --workspace @petforce/mobile

# Run on iOS simulator
npm run ios --workspace @petforce/mobile
\`\`\`

## Tech Stack

- **React** 18.2 + **TypeScript** 5.3
- **React Router** (web) + **React Navigation** (mobile)
- **Tailwind CSS** (web styling)
- **Supabase** (authentication, database)
- **Zustand** (state management)
- **Vitest** + **Testing Library** (testing)

## Documentation

- [Testing Guide](./TESTING.md)
- [Mobile App README](./apps/mobile/README.md)
- See `docs/` folder for more

## Development

\`\`\`bash
# Run all tests
npm test --workspaces

# Lint code
npm run lint --workspaces

# Type check
npm run typecheck --workspaces
\`\`\`

## License

MIT License - see LICENSE file for details

---

**Made with 🐾 by the PetForce Team**
