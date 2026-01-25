# Getting Started with PetForce

Welcome to PetForce! This guide will help you set up your development environment and get started with the project.

## Prerequisites

### Required Software

- **Node.js** 20.19.0 or higher ([Download](https://nodejs.org/))
- **npm** 10.2.4 or higher (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))

### Recommended Tools

- **VS Code** with extensions:
  - ESLint
  - TypeScript
  - Tailwind CSS IntelliSense
  - React Native Tools (for mobile)
- **Expo Go** app on your phone (for mobile testing)

### Accounts Needed

- **Supabase Account** - [Sign up](https://supabase.com) (free tier available)
- **Google Cloud Console** - For Google OAuth (optional)
- **Apple Developer** - For Apple OAuth (optional)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/petforce.git
cd petforce
```

### 2. Install Dependencies

```bash
# Install all dependencies for all workspaces
npm install
```

This will install dependencies for:
- Root workspace
- Web app (`apps/web`)
- Mobile app (`apps/mobile`)
- Auth package (`packages/auth`)
- UI package (`packages/ui`)

### 3. Set Up Supabase

#### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details:
   - Name: `PetForce`
   - Database Password: (choose a strong password)
   - Region: (select closest to you)

#### Configure Authentication

1. Navigate to **Authentication** > **Providers**
2. Enable **Email** provider
3. Configure email templates (optional):
   - Confirmation email
   - Magic link email
   - Password reset email

#### Set Up OAuth (Optional)

**Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add redirect URIs:
   - `https://your-project.supabase.co/auth/v1/callback`
6. Copy Client ID and Secret
7. In Supabase, go to **Authentication** > **Providers** > **Google**
8. Enable and paste Client ID and Secret

**Apple OAuth:**
1. Go to [Apple Developer](https://developer.apple.com)
2. Create a Services ID
3. Configure Sign in with Apple
4. Add redirect URIs
5. Generate a key
6. In Supabase, paste credentials

#### Get Your Supabase Keys

1. Go to **Settings** > **API**
2. Copy the following:
   - Project URL
   - `anon` `public` key (publishable key)

### 4. Configure Environment Variables

#### Web App

```bash
cd apps/web
cp .env.example .env
```

Edit `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

#### Mobile App

```bash
cd apps/mobile
cp .env.example .env
```

Edit `.env`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

## Running the Applications

### Web Application

```bash
# From project root
npm run dev --workspace @petforce/web

# Or from apps/web
cd apps/web
npm run dev
```

Open http://localhost:3000 in your browser.

You should see the PetForce welcome page with authentication options.

### Mobile Application

```bash
# From project root
npm start --workspace @petforce/mobile

# Or from apps/mobile
cd apps/mobile
npm start
```

This will:
1. Start the Expo development server
2. Show a QR code in your terminal
3. Open Expo DevTools in your browser

**To run on your device:**
1. Install **Expo Go** from App Store or Play Store
2. Scan the QR code with your camera (iOS) or Expo Go app (Android)
3. The app will load on your device

**To run on simulator/emulator:**
```bash
# iOS (macOS only)
npm run ios --workspace @petforce/mobile

# Android
npm run android --workspace @petforce/mobile
```

## Verify Installation

### Web App Checklist

- [ ] App loads at http://localhost:3000
- [ ] Welcome page displays correctly
- [ ] Can navigate to Login page
- [ ] Can navigate to Register page
- [ ] No console errors

### Mobile App Checklist

- [ ] Expo server starts successfully
- [ ] QR code is displayed
- [ ] App loads on device/simulator
- [ ] Welcome screen displays
- [ ] Navigation works

### Test Authentication

1. **Create an account:**
   - Go to Register page
   - Enter email and password
   - Submit form
   - Check email for verification link (if enabled)

2. **Sign in:**
   - Go to Login page
   - Enter credentials
   - Submit form
   - Should redirect to Dashboard

3. **Test OAuth (if configured):**
   - Click "Continue with Google" or "Continue with Apple"
   - Complete OAuth flow
   - Should redirect back to app

## Common Issues

### Port Already in Use

**Web App:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill

# Or use a different port
PORT=3001 npm run dev --workspace @petforce/web
```

**Mobile App:**
```bash
# Kill Expo process
pkill -f expo

# Restart
npm start --workspace @petforce/mobile
```

### Module Not Found Errors

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Also clean workspace node_modules
rm -rf apps/*/node_modules packages/*/node_modules
npm install
```

### Environment Variables Not Working

**Web:**
- Ensure variables start with `VITE_`
- Restart dev server after changing `.env`

**Mobile:**
- Ensure variables start with `EXPO_PUBLIC_`
- Clear cache: `npx expo start -c`

### Supabase Connection Issues

1. Verify URL and keys are correct
2. Check Supabase project is not paused
3. Verify network connection
4. Check browser console for CORS errors

### TypeScript Errors

```bash
# Run type checking
npm run typecheck --workspaces

# If errors persist, rebuild
npm run build --workspaces
```

## Next Steps

Now that you have PetForce running:

1. **Explore the code:**
   - Check out `apps/web/src` for web code
   - Check out `apps/mobile/src` for mobile code
   - Review `packages/auth` for authentication logic

2. **Read the documentation:**
   - [Architecture](./ARCHITECTURE.md) - Understand the system design
   - [API Reference](./API.md) - Learn about the APIs
   - [Testing Guide](../TESTING.md) - Write and run tests

3. **Make your first change:**
   - Try modifying a component
   - Add a new feature
   - Write a test

4. **Join the community:**
   - Read [Contributing Guidelines](./CONTRIBUTING.md)
   - Check open issues
   - Join our Discord

## Development Workflow

### Making Changes

1. Create a feature branch
2. Make your changes
3. Run tests: `npm test`
4. Run linter: `npm run lint`
5. Type check: `npm run typecheck`
6. Commit and push

### Running Tests

```bash
# All tests
npm test --workspaces

# Specific workspace
npm test --workspace @petforce/web

# Watch mode
npm test --workspace @petforce/web -- --watch

# With UI
npm run test:ui --workspace @petforce/web
```

### Building for Production

```bash
# Web app
npm run build --workspace @petforce/web

# Verify build
npm run preview --workspace @petforce/web
```

## Getting Help

- **Documentation:** Check the `docs/` folder
- **Issues:** [GitHub Issues](https://github.com/yourusername/petforce/issues)
- **Discord:** [Join our community](https://discord.gg/petforce)
- **Email:** support@petforce.app

## Quick Reference

### Useful Commands

```bash
# Development
npm run dev --workspace @petforce/web       # Start web dev server
npm start --workspace @petforce/mobile      # Start mobile dev server

# Testing
npm test --workspaces                       # Run all tests
npm run test:coverage --workspaces          # Coverage report

# Code Quality
npm run lint --workspaces                   # Lint all code
npm run typecheck --workspaces              # Type check all code

# Building
npm run build --workspaces                  # Build all apps

# Cleaning
rm -rf node_modules package-lock.json       # Clean root
npm install                                 # Reinstall
```

### Project Structure Quick Reference

```
petforce/
├── apps/web/          # Web app (React + Vite)
├── apps/mobile/       # Mobile app (React Native + Expo)
├── packages/auth/     # Authentication package
├── packages/ui/       # Shared UI components
└── docs/             # Documentation
```

---

**Ready to contribute?** Read our [Contributing Guide](./CONTRIBUTING.md)!
