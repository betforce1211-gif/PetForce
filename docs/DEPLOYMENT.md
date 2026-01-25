# PetForce Deployment Guide

Complete guide for deploying PetForce to production.

## Table of Contents

- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Web App Deployment](#web-app-deployment)
- [Mobile App Deployment](#mobile-app-deployment)
- [Environment Configuration](#environment-configuration)
- [CI/CD Setup](#cicd-setup)
- [Monitoring and Analytics](#monitoring-and-analytics)

## Pre-Deployment Checklist

### Code Quality

- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Code coverage meets targets (80%+)
- [ ] No console.log statements
- [ ] No debugging code

### Security

- [ ] Environment variables configured
- [ ] No hardcoded secrets
- [ ] HTTPS enabled
- [ ] OAuth providers configured
- [ ] Rate limiting implemented (backend)
- [ ] Input validation in place

### Performance

- [ ] Bundle size optimized
- [ ] Images optimized
- [ ] Code splitting implemented
- [ ] Lazy loading configured
- [ ] Caching strategy in place

### Documentation

- [ ] README updated
- [ ] API documentation complete
- [ ] Environment variables documented
- [ ] Deployment steps documented

## Web App Deployment

### Option 1: Vercel (Recommended)

Vercel provides the easiest deployment for Vite apps.

#### Setup

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Login to Vercel:**
```bash
vercel login
```

3. **Deploy:**
```bash
cd apps/web
vercel
```

4. **Configure Environment Variables:**
   - Go to Vercel Dashboard
   - Select your project
   - Go to Settings > Environment Variables
   - Add:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_PUBLISHABLE_KEY`
     - `VITE_SUPABASE_ANON_KEY`

5. **Deploy to Production:**
```bash
vercel --prod
```

#### Vercel Configuration

Create `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

#### Custom Domain

1. Go to Vercel Dashboard > Domains
2. Add your domain
3. Configure DNS records
4. Update Supabase redirect URLs

### Option 2: Netlify

#### Setup

1. **Install Netlify CLI:**
```bash
npm i -g netlify-cli
```

2. **Login:**
```bash
netlify login
```

3. **Build:**
```bash
cd apps/web
npm run build
```

4. **Deploy:**
```bash
netlify deploy --prod --dir=dist
```

#### Netlify Configuration

Create `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "20.19.0"
```

#### Environment Variables

1. Go to Netlify Dashboard
2. Site settings > Build & deploy > Environment
3. Add environment variables

### Option 3: AWS S3 + CloudFront

#### Setup

1. **Build the app:**
```bash
cd apps/web
npm run build
```

2. **Create S3 Bucket:**
```bash
aws s3 mb s3://petforce-app
```

3. **Upload files:**
```bash
aws s3 sync dist/ s3://petforce-app
```

4. **Configure CloudFront:**
   - Create distribution
   - Point to S3 bucket
   - Configure SSL certificate
   - Set up custom domain

5. **Enable static website hosting:**
```bash
aws s3 website s3://petforce-app --index-document index.html --error-document index.html
```

## Mobile App Deployment

### Prerequisites

1. **Install EAS CLI:**
```bash
npm install -g eas-cli
```

2. **Login to Expo:**
```bash
eas login
```

3. **Configure EAS:**
```bash
cd apps/mobile
eas build:configure
```

### iOS Deployment

#### Requirements

- Apple Developer Account ($99/year)
- App Store Connect access
- Code signing certificate
- Provisioning profile

#### Build for iOS

1. **Configure `eas.json`:**
```json
{
  "build": {
    "production": {
      "ios": {
        "bundleIdentifier": "com.petforce.app",
        "buildConfiguration": "Release"
      }
    }
  }
}
```

2. **Build:**
```bash
eas build --platform ios --profile production
```

3. **Wait for build** (15-30 minutes)

4. **Download and test** the .ipa file

#### Submit to App Store

1. **Configure submission:**
```bash
eas submit --platform ios
```

2. **Provide App Store Connect credentials**

3. **Fill in App Store listing:**
   - App name: PetForce
   - Description
   - Screenshots (required sizes)
   - Privacy policy URL
   - Support URL
   - Keywords
   - Category: Health & Fitness

4. **Submit for review**

5. **Wait for approval** (1-3 days typically)

#### App Store Screenshots

Required sizes for iPhone:
- 6.7" (1290 x 2796 px)
- 6.5" (1242 x 2688 px)
- 5.5" (1242 x 2208 px)

### Android Deployment

#### Requirements

- Google Play Developer Account ($25 one-time)
- App signing key

#### Build for Android

1. **Configure `eas.json`:**
```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      }
    }
  }
}
```

2. **Build:**
```bash
eas build --platform android --profile production
```

3. **Wait for build** (10-20 minutes)

4. **Download and test** the .apk file

#### Submit to Play Store

1. **Configure submission:**
```bash
eas submit --platform android
```

2. **Create Play Store listing:**
   - App name: PetForce
   - Short description (80 chars)
   - Full description (4000 chars)
   - Screenshots (required)
   - Feature graphic (1024 x 500 px)
   - App icon (512 x 512 px)
   - Privacy policy URL
   - Category: Health & Fitness

3. **Set up pricing** (Free or Paid)

4. **Submit for review**

5. **Wait for approval** (few hours to few days)

#### Play Store Screenshots

Required:
- Minimum 2 screenshots
- PNG or JPEG
- 16:9 or 9:16 aspect ratio
- Min dimension: 320px
- Max dimension: 3840px

### TestFlight / Internal Testing

#### iOS TestFlight

```bash
# Build and automatically submit to TestFlight
eas build --platform ios --profile production --auto-submit
```

Add testers in App Store Connect.

#### Android Internal Testing

```bash
# Build and submit to internal testing track
eas submit --platform android --track internal
```

Add testers in Google Play Console.

## Environment Configuration

### Production Environment Variables

#### Web App

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-production-key
VITE_SUPABASE_ANON_KEY=your-production-key

# Analytics (future)
VITE_ANALYTICS_ID=your-analytics-id

# Sentry (future)
VITE_SENTRY_DSN=your-sentry-dsn
```

#### Mobile App

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-production-key
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-production-key

# App config
EXPO_PUBLIC_APP_VERSION=1.0.0
EXPO_PUBLIC_API_URL=https://api.petforce.app
```

### Supabase Production Setup

1. **Create production project** (separate from development)

2. **Configure authentication:**
   - Enable email provider
   - Set up OAuth providers
   - Configure redirect URLs:
     - Web: `https://petforce.app/auth/callback`
     - Mobile: `petforce://auth/callback`

3. **Set up email templates:**
   - Customize confirmation email
   - Customize magic link email
   - Customize password reset email

4. **Configure security:**
   - Enable RLS (Row Level Security)
   - Set up policies
   - Configure API rate limiting

5. **Back up database** regularly

## CI/CD Setup

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20.19.0'
      - run: npm ci
      - run: npm test --workspaces
      - run: npm run lint --workspaces
      - run: npm run typecheck --workspaces

  deploy-web:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build --workspace @petforce/web
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

  deploy-mobile:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx eas-cli build --platform all --profile production --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

### Environment Secrets

Add to GitHub repository secrets:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `EXPO_TOKEN`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

## Monitoring and Analytics

### Error Tracking (Future)

**Sentry Setup:**

```bash
npm install @sentry/react @sentry/vite-plugin
```

```typescript
// apps/web/src/main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
});
```

### Analytics (Future)

**Mixpanel/Amplitude:**

```typescript
import { init, track } from '@/lib/analytics';

init(import.meta.env.VITE_ANALYTICS_ID);

track('User Signed Up', {
  method: 'email',
  timestamp: new Date(),
});
```

### Performance Monitoring

**Web Vitals:**

```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

## Post-Deployment

### Verification Checklist

- [ ] App loads correctly
- [ ] Authentication works
- [ ] OAuth flows working
- [ ] Mobile deep links work
- [ ] Error tracking active
- [ ] Analytics tracking
- [ ] SSL certificate valid
- [ ] Custom domain configured
- [ ] Email templates working
- [ ] All features functional

### Monitoring

Set up monitoring for:
- Uptime (UptimeRobot, Pingdom)
- Error rate (Sentry)
- Performance (Web Vitals)
- User analytics (Mixpanel)
- Server metrics (Supabase dashboard)

### Rollback Plan

If issues occur:

**Web:**
```bash
# Revert to previous deployment
vercel rollback
```

**Mobile:**
- Can't rollback app stores immediately
- Submit hotfix build
- Use Expo Updates for JS-only fixes

## Support

For deployment issues:
- Check logs in deployment platform
- Verify environment variables
- Test locally first
- Contact support if needed

---

**Last Updated**: January 24, 2026
