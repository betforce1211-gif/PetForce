# Migration Guide: v1 to v2

## Overview

This guide helps you migrate from Household Management v1 to v2.

**Breaking Changes**: None (fully backward compatible)
**New Features**: QR codes, push notifications, analytics dashboard
**Migration Time**: ~30 minutes
**Downtime Required**: None

---

## What's New in v2

### 1. QR Code Support
Generate and scan QR codes for instant household joining.

**Benefits**:
- Faster onboarding (no manual code typing)
- Better mobile experience
- Works offline (code in QR)

**Migration**: No action needed (optional feature)

### 2. Push Notifications
Real-time notifications for join requests, approvals, and removals.

**Benefits**:
- Instant awareness of household changes
- Better engagement
- Reduces email noise

**Migration**: Update mobile app to register for push tokens

### 3. Analytics Dashboard
Household growth metrics, join funnel analysis, and member activity tracking.

**Benefits**:
- Data-driven decisions
- Understand user behavior
- Identify bottlenecks

**Migration**: No action needed (leader-only feature)

### 4. GDPR Compliance
Data export and hard delete APIs for GDPR compliance.

**Benefits**:
- Legal compliance
- User trust
- Data portability

**Migration**: No action needed (automatic)

---

## API Changes

### New Endpoints

```
POST   /api/households/:id/qr-code          Generate QR code
GET    /api/households/analytics            Get analytics (leader only)
POST   /api/households/gdpr/export          Export user data
DELETE /api/households/gdpr/delete          Delete user data
```

### Deprecated Endpoints

None. All v1 endpoints are still supported.

### Enhanced Endpoints

```
GET /api/households/me
```
**New fields**:
- `qr_code_url` - URL to QR code image
- `analytics_enabled` - Whether analytics are available
- `member_count` - Total active members

**Backward compatible**: Old clients ignore new fields

---

## Database Schema Changes

### New Tables

```sql
-- QR code cache (optional, for performance)
CREATE TABLE household_qr_codes (
  household_id UUID PRIMARY KEY REFERENCES households(id),
  qr_code_data TEXT NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics summary (optional, for dashboard)
CREATE TABLE household_analytics_summary (
  household_id UUID PRIMARY KEY REFERENCES households(id),
  total_members INTEGER DEFAULT 0,
  active_members INTEGER DEFAULT 0,
  pending_requests INTEGER DEFAULT 0,
  join_conversion_rate NUMERIC(5,2),
  last_activity_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Migration Script

```sql
-- Run this to add v2 tables (optional)
-- File: migrations/002-v2-features.sql

BEGIN;

-- QR code cache
CREATE TABLE IF NOT EXISTS household_qr_codes (
  household_id UUID PRIMARY KEY REFERENCES households(id) ON DELETE CASCADE,
  qr_code_data TEXT NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics summary
CREATE TABLE IF NOT EXISTS household_analytics_summary (
  household_id UUID PRIMARY KEY REFERENCES households(id) ON DELETE CASCADE,
  total_members INTEGER DEFAULT 0,
  active_members INTEGER DEFAULT 0,
  pending_requests INTEGER DEFAULT 0,
  join_conversion_rate NUMERIC(5,2),
  last_activity_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_qr_codes_generated
  ON household_qr_codes(generated_at);

CREATE INDEX IF NOT EXISTS idx_analytics_last_activity
  ON household_analytics_summary(last_activity_at);

COMMIT;
```

**To run**:
```bash
psql -h your-db-host -U your-user -d your-db -f migrations/002-v2-features.sql
```

---

## Client Library Updates

### npm/yarn
```bash
# Update to v2
npm install @petforce/household@2.0.0

# Or with yarn
yarn upgrade @petforce/household@2.0.0
```

### API Client Changes

**v1 (still works)**:
```typescript
import { HouseholdClient } from '@petforce/household';

const client = new HouseholdClient(apiKey);
const household = await client.getHousehold();
```

**v2 (recommended)**:
```typescript
import { HouseholdClient } from '@petforce/household';

const client = new HouseholdClient(apiKey, { version: 2 });

// New features
const qrCode = await client.generateQRCode(householdId);
const analytics = await client.getAnalytics(householdId);
```

---

## Mobile App Updates

### React Native

**Update dependencies**:
```bash
npm install @petforce/household@2.0.0 expo-camera expo-barcode-generator
```

**Enable QR scanning**:
```typescript
import { Camera } from 'expo-camera';
import { BarCodeScanner } from 'expo-barcode-scanner';

// Request camera permission
const { status } = await Camera.requestCameraPermissionsAsync();

// Scan QR code
<BarCodeScanner
  onBarCodeScanned={({ data }) => {
    // data = invite code
    joinHousehold(data);
  }}
/>
```

**Enable push notifications**:
```typescript
import * as Notifications from 'expo-notifications';

// Register for push
const token = await Notifications.getExpoPushTokenAsync();
await client.registerPushToken(token);

// Handle notifications
Notifications.addNotificationReceivedListener((notification) => {
  // Handle household notification
});
```

---

## Testing Migration

### 1. Test in Staging

```bash
# Deploy v2 to staging
npm run deploy:staging

# Run smoke tests
npm run test:e2e:staging

# Verify backward compatibility
npm run test:v1-compat
```

### 2. Gradual Rollout

```yaml
# Use feature flags for gradual rollout
feature_flags:
  qr_codes: 25%          # 25% of users
  push_notifications: 50%  # 50% of users
  analytics: 100%          # All leaders
```

### 3. Monitor

- Error rate (should stay <1%)
- P95 latency (should stay <500ms)
- QR code generation success rate
- Push notification delivery rate

---

## Rollback Procedure

If you need to rollback to v1:

### Option 1: Deployment Rollback
```bash
# Rollback deployment
kubectl rollout undo deployment/household-api

# Or with Docker
docker pull petforce/household-api:1.x
docker-compose up -d
```

### Option 2: Feature Flags
```yaml
# Disable v2 features
feature_flags:
  qr_codes: 0%
  push_notifications: 0%
  analytics: 0%
```

### Database Rollback

**No database rollback needed**. v2 tables are optional and don't affect v1 functionality.

If you must remove v2 tables:
```sql
DROP TABLE IF EXISTS household_qr_codes;
DROP TABLE IF EXISTS household_analytics_summary;
```

---

## FAQ

### Q: Do I need to update my client immediately?
**A**: No. v1 clients work with v2 API. Update when convenient.

### Q: Will v1 endpoints be deprecated?
**A**: No plans for deprecation. v1 will be supported indefinitely.

### Q: Are there performance implications?
**A**: v2 is faster (see [Performance Report](../performance/optimization-report.md)). No negative impact.

### Q: Can I use v2 features with v1 client?
**A**: Some features (QR codes, analytics) require v2 client. Push notifications work with v1.

### Q: What if migration fails?
**A**: Rollback is instant (no database changes). v1 continues working.

---

## Support

- **Documentation**: [docs.petforce.app/households](https://docs.petforce.app/households)
- **API Reference**: [api.petforce.app/docs](https://api.petforce.app/docs)
- **Slack**: #household-api
- **Email**: api-support@petforce.app

---

## Changelog

### v2.0.0 (2026-02-02)
- ✅ QR code generation and scanning
- ✅ Push notifications
- ✅ Analytics dashboard
- ✅ GDPR compliance APIs
- ✅ Performance improvements (36% faster)

### v1.0.0 (2026-01-15)
- ✅ Core household management
- ✅ Invite codes
- ✅ Member management
- ✅ Leader/member roles
- ✅ Temporary access
