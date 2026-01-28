# PetForce Data Retention Policy

**Purpose**: Define data retention, deletion, and archival policies for GDPR/CCPA compliance and privacy-first data governance.

**Last Updated**: 2026-01-25
**Owner**: Data Engineering Team (Buck)
**Compliance**: GDPR Article 5(1)(e), CCPA Section 1798.105, SOC 2 Type II

---

## Table of Contents

1. [Overview](#overview)
2. [Guiding Principles](#guiding-principles)
3. [Data Classification](#data-classification)
4. [Retention Schedules](#retention-schedules)
5. [Deletion Procedures](#deletion-procedures)
6. [Archival Strategy](#archival-strategy)
7. [User Rights](#user-rights)
8. [Compliance Requirements](#compliance-requirements)
9. [Implementation](#implementation)
10. [Monitoring & Auditing](#monitoring--auditing)

---

## Overview

PetForce handles sensitive pet family data including health records, location data, and personal identifiable information (PII). This retention policy ensures we:

- **Minimize data storage** - Keep only what's necessary for product functionality
- **Respect user privacy** - Delete data when no longer needed
- **Enable compliance** - Meet GDPR, CCPA, and regional privacy regulations
- **Protect pet families** - Secure sensitive data throughout its lifecycle

### Policy Scope

This policy covers all data collected, processed, and stored by PetForce:

- User authentication data (emails, passwords, sessions)
- Pet profiles (names, breeds, health records)
- Usage analytics and logs
- Transactional data (subscriptions, payments)
- Support tickets and communications
- Third-party integrations

---

## Guiding Principles

### 1. Privacy-First Data Architecture

> "Pet health records, family info, and location data must be encrypted, masked, and access-controlled. Never compromise."

**In Practice**:
- Collect minimum data required for functionality
- Delete data as soon as legally and operationally permissible
- Encrypt sensitive data at rest and in transit
- Implement row-level security (RLS) for all tables

### 2. Data Minimization

Per GDPR Article 5(1)(c), we collect only data that is:
- **Adequate** - Sufficient for the intended purpose
- **Relevant** - Directly related to product functionality
- **Limited** - No more than necessary

### 3. Storage Limitation

Per GDPR Article 5(1)(e), we retain data only:
- **As long as necessary** - For the purpose collected
- **With user consent** - Active users = consent to store
- **Unless legally required** - Compliance overrides deletion

### 4. Transparency

Users have the right to know:
- What data we collect
- How long we keep it
- How to request deletion
- Where their data is stored

---

## Data Classification

All PetForce data is classified by sensitivity and retention requirements:

### Tier 1: Critical PII (High Sensitivity)

**Definition**: Data that identifies individuals or poses privacy risk if exposed.

**Examples**:
- Email addresses
- Full names (first + last)
- Physical addresses
- Payment information (credit cards, bank accounts)
- IP addresses
- Location data (GPS coordinates, geocoded addresses)
- Biometric data (Face ID, Touch ID keys)

**Protection Requirements**:
- Encrypted at rest (AES-256)
- Encrypted in transit (TLS 1.2+)
- Hashed in logs (SHA-256)
- Row-level security (RLS) enforced
- Access logged and audited

**Retention**: Delete within 30 days of account deletion or 90 days of inactivity (whichever comes first).

### Tier 2: Pet Health Data (Medium-High Sensitivity)

**Definition**: Medical records, health history, and veterinary information for pets.

**Examples**:
- Vaccination records
- Medication schedules
- Vet visit notes
- Weight/vitals tracking
- Allergy information
- Health conditions

**Protection Requirements**:
- Encrypted at rest (AES-256)
- RLS policies limiting access to pet owner
- Not shared with third parties without consent
- Audit trail for all access

**Retention**:
- Active pets: Retained indefinitely (health history is valuable)
- Deceased pets: Retained for 90 days, then soft-deleted
- Account deletion: Deleted within 30 days

### Tier 3: Operational Data (Medium Sensitivity)

**Definition**: Data needed for product functionality but less sensitive.

**Examples**:
- Pet profiles (name, breed, birthdate)
- User preferences (notification settings, theme)
- App usage metrics (feature usage, session duration)
- Support tickets (anonymized after resolution)

**Protection Requirements**:
- RLS policies enforced
- Access logged for audit
- Anonymized for analytics

**Retention**:
- Active users: Retained while account is active
- Inactive users: Soft-deleted after 2 years of inactivity
- Account deletion: Deleted within 30 days

### Tier 4: Aggregated Analytics (Low Sensitivity)

**Definition**: De-identified, anonymized data used for product insights.

**Examples**:
- Dashboard usage counts (no user IDs)
- Feature adoption rates (aggregated)
- Performance metrics (p95 latency, error rates)
- A/B test results (anonymized cohorts)

**Protection Requirements**:
- No PII included
- Cannot be re-identified
- Aggregated to prevent fingerprinting

**Retention**:
- Retained for 3 years (historical trends)
- No deletion required (anonymized)

### Tier 5: System Logs (Low-Medium Sensitivity)

**Definition**: Application, database, and infrastructure logs.

**Examples**:
- Application logs (errors, warnings, info)
- Database query logs
- Server access logs
- Security audit logs

**Protection Requirements**:
- PII hashed (email SHA-256, no names/addresses)
- Access restricted to engineering/security teams
- Stored in secure logging service (Datadog/Sentry)

**Retention**:
- Application logs: 90 days
- Security audit logs: 7 years (compliance requirement)
- Error logs: 1 year (for debugging historical issues)

---

## Retention Schedules

### User Authentication Data

| Data Type | Retention Period | Deletion Trigger |
|-----------|------------------|------------------|
| Email (active user) | While account active | Account deletion + 30 days |
| Email (inactive user) | 2 years from last login | Automatic soft-delete |
| Hashed password | While account active | Password change (old hash deleted immediately) |
| Password reset tokens | 1 hour | Expiration or use (whichever comes first) |
| Email verification tokens | 1 hour | Verification or expiration |
| Magic link tokens | 15 minutes | Use or expiration |
| Session tokens (refresh) | 30 days | Logout, expiration, or password change |
| Session metadata (IP, user agent) | 90 days | Automatic deletion |
| Failed login attempts | 15 minutes | Automatic reset |
| Biometric device keys | While account active | Device removal or account deletion |

**Rationale**:
- Short-lived tokens minimize attack window
- Session data kept for security monitoring
- Password hashes deleted on change (no old passwords retained)

### Pet Data

| Data Type | Retention Period | Deletion Trigger |
|-----------|------------------|------------------|
| Pet profile (active) | While account active | User deletes pet or account |
| Pet health records (active pet) | Indefinitely | User deletes pet or account |
| Pet health records (deceased pet) | 90 days after death date | Automatic soft-delete |
| Pet photos/videos | While account active | User deletes or account deletion |
| Vaccination reminders | Until date + 30 days | Automatic deletion |
| Medication schedules | Until end date + 90 days | Automatic deletion |
| Vet appointment history | 3 years | Automatic deletion (HIPAA-like retention) |

**Rationale**:
- Health history is valuable for ongoing care (retained while pet is active)
- Deceased pet records kept 90 days for grieving period, then deleted
- Vet records kept 3 years (aligns with veterinary record standards)

### Usage Analytics & Logs

| Data Type | Retention Period | Deletion Trigger |
|-----------|------------------|------------------|
| Application logs (non-error) | 90 days | Automatic deletion |
| Error logs | 1 year | Automatic deletion |
| Security audit logs | 7 years | Compliance requirement |
| User event analytics (hashed IDs) | 2 years | Automatic deletion |
| Aggregated metrics | 3 years | Automatic deletion |
| A/B test data | 1 year after test ends | Manual deletion |
| Feature flags usage | 90 days after flag removed | Manual deletion |

**Rationale**:
- 90 days for debugging recent issues
- 1 year for error pattern analysis
- 7 years for security compliance (SOC 2, PCI-DSS if payment processing)

### Transactional Data

| Data Type | Retention Period | Deletion Trigger |
|-----------|------------------|------------------|
| Subscription records (active) | While subscription active | Cancellation + 7 years |
| Payment records (invoices) | 7 years | Tax/audit compliance |
| Payment methods (card last 4) | While subscription active | Cancellation + 30 days |
| Refund records | 7 years | Tax/audit compliance |
| Billing address | While subscription active | Cancellation + 30 days |

**Rationale**:
- 7 years for tax and audit compliance (IRS, GDPR Article 6(1)(c))
- Payment methods deleted after cancellation (unless disputes pending)

### Support & Communications

| Data Type | Retention Period | Deletion Trigger |
|-----------|------------------|------------------|
| Support tickets (resolved) | 1 year | Automatic anonymization |
| Support tickets (open) | While open + 1 year | Closure + 1 year |
| Email communications | 3 years | Automatic deletion |
| In-app chat logs | 1 year | Automatic anonymization |
| User feedback/surveys | 2 years | Automatic anonymization |

**Rationale**:
- Tickets anonymized (PII removed, content kept for product insights)
- Email records retained for legal compliance
- Feedback anonymized for product development

---

## Deletion Procedures

### User-Requested Deletion (GDPR Article 17, CCPA 1798.105)

When a user requests account deletion:

1. **Immediate Actions** (within 24 hours):
   - Invalidate all sessions (logout everywhere)
   - Mark account as `deleted_at = NOW()`
   - Soft-delete user email: `email = 'deleted_YYYYMMDD@deleted.local'`
   - Prevent login (check `deleted_at` on auth)

2. **30-Day Grace Period**:
   - User can still recover account (contact support)
   - Data remains in database (soft-deleted)
   - No new data collected

3. **Hard Deletion** (after 30 days):
   - Permanently delete from database:
     - User authentication records
     - Pet profiles and health data
     - Photos/videos (S3/R2 storage)
     - Session history
     - Preferences
   - Retain in anonymized form:
     - Aggregated analytics (no user ID)
     - Support tickets (PII removed, ticket content kept)
   - Retain for compliance:
     - Transaction records (7 years)
     - Security audit logs (7 years)

**SQL Implementation**:

```sql
-- Step 1: Soft delete (immediate)
UPDATE users
SET
  deleted_at = NOW(),
  email = 'deleted_' || TO_CHAR(NOW(), 'YYYYMMDD') || '@deleted.local',
  first_name = NULL,
  last_name = NULL,
  profile_photo_url = NULL
WHERE id = <user_id>;

-- Step 2: Hard delete (after 30 days)
-- Run via scheduled job
DELETE FROM users WHERE deleted_at < NOW() - INTERVAL '30 days';
-- Cascade deletes: pets, sessions, email_verifications, etc.
```

### Automated Deletion (Inactivity)

**Inactive User Definition**: No login for 2 years.

**Process**:
1. **Email Warning** (after 18 months inactivity):
   - "Your PetForce account has been inactive. Login within 6 months to keep your data."
   - Provide easy login link

2. **Final Warning** (after 23 months):
   - "Your account will be deleted in 30 days due to inactivity."
   - Provide login link

3. **Soft Delete** (after 24 months):
   - Mark as deleted (same as user-requested)
   - 30-day grace period for recovery

4. **Hard Delete** (after 25 months):
   - Permanent deletion

**SQL Implementation**:

```sql
-- Identify inactive users (no login for 2 years)
SELECT id, email, last_login_at
FROM users
WHERE last_login_at < NOW() - INTERVAL '2 years'
  AND deleted_at IS NULL;

-- Soft delete inactive users
UPDATE users
SET deleted_at = NOW()
WHERE last_login_at < NOW() - INTERVAL '2 years'
  AND deleted_at IS NULL;
```

### Deceased Pet Deletion

When a user marks a pet as deceased:

1. **90-Day Retention**:
   - Pet record soft-deleted (marked as deceased)
   - Health records remain accessible (grieving period)
   - User can still view/download records

2. **After 90 Days**:
   - Hard delete pet record
   - Delete health records
   - Delete photos/videos
   - Retain anonymized data (e.g., "1 dog aged 12 died" for lifespan analytics)

**SQL Implementation**:

```sql
-- Soft delete (mark as deceased)
UPDATE pets
SET
  deceased_at = NOW(),
  status = 'deceased'
WHERE id = <pet_id>;

-- Hard delete (after 90 days)
DELETE FROM pets WHERE deceased_at < NOW() - INTERVAL '90 days';
```

### Token & Session Cleanup

Automated cleanup of expired tokens (runs daily):

```sql
-- Delete expired email verification tokens
DELETE FROM email_verifications WHERE expires_at < NOW();

-- Delete expired password reset tokens
DELETE FROM password_resets WHERE expires_at < NOW();

-- Delete expired magic links
DELETE FROM magic_links WHERE expires_at < NOW();

-- Delete expired sessions
DELETE FROM sessions WHERE refresh_token_expires_at < NOW();

-- Delete old session metadata (>90 days)
UPDATE sessions
SET
  ip_address = NULL,
  user_agent = NULL,
  device_os = NULL,
  device_browser = NULL
WHERE last_activity_at < NOW() - INTERVAL '90 days';
```

### Log Rotation

Logs rotated automatically by retention period:

```bash
# Application logs: 90 days
find /var/log/petforce/app -mtime +90 -delete

# Error logs: 1 year
find /var/log/petforce/errors -mtime +365 -delete

# Security logs: 7 years (archived to cold storage)
find /var/log/petforce/security -mtime +2555 -delete
```

---

## Archival Strategy

Data that must be retained for compliance but is rarely accessed should be archived to cold storage for cost optimization.

### Archival Candidates

| Data Type | Archive After | Storage Tier | Retrieval Time |
|-----------|---------------|--------------|----------------|
| Transaction records (>1 year old) | 1 year | Cold storage (S3 Glacier) | 12 hours |
| Security audit logs (>1 year old) | 1 year | Cold storage (S3 Glacier) | 12 hours |
| Anonymized support tickets (>2 years old) | 2 years | Cold storage | 12 hours |
| Deleted account data (compliance retention) | 30 days | Cold storage | 24 hours |

### Archival Process

1. **Weekly Archive Job**:
   - Identify records older than retention threshold
   - Export to compressed JSON (gzip)
   - Upload to cold storage (S3 Glacier, Cloudflare R2 Infrequent Access)
   - Verify upload integrity (checksum)
   - Delete from primary database

2. **Retrieval Process**:
   - User submits request via support
   - Compliance officer approves (legal requirement verification)
   - Archive retrieved from cold storage (12-24 hour SLA)
   - Data provided to user in secure download link (expires in 7 days)

**Cost Optimization**:
- Primary DB (PostgreSQL): $0.10/GB/month
- Cold storage (S3 Glacier): $0.004/GB/month
- **Savings**: 96% reduction in storage costs for archived data

**Example Archive Schema**:

```json
{
  "archive_id": "arch_2026_01_25_12345",
  "archive_date": "2026-01-25T10:00:00Z",
  "data_type": "transaction_records",
  "record_count": 15000,
  "date_range": {
    "start": "2023-01-01",
    "end": "2023-12-31"
  },
  "storage_location": "s3://petforce-archives/transactions/2023.json.gz",
  "checksum": "sha256:abc123...",
  "encryption": "AES-256",
  "retention_until": "2030-12-31"
}
```

---

## User Rights

PetForce respects user data rights under GDPR and CCPA:

### Right to Access (GDPR Article 15, CCPA 1798.100)

**What**: Users can request a copy of all data we hold about them.

**Process**:
1. User submits request via support or in-app form
2. Identity verified (login + email confirmation)
3. Data export generated (JSON format)
4. Delivered via secure download link (expires in 7 days)

**Response Time**: 30 days maximum (GDPR requirement)

**Data Export Contents**:
- User profile (email, name)
- Pet profiles (all pets)
- Health records (vaccination, medication, vet visits)
- Transaction history (subscriptions, payments)
- Support tickets (user's communications)

### Right to Deletion (GDPR Article 17, CCPA 1798.105)

**What**: Users can request deletion of their data.

**Process**: See [Deletion Procedures](#user-requested-deletion-gdpr-article-17-ccpa-1798105).

**Exceptions** (data we CANNOT delete):
- Transaction records (7-year tax/audit requirement)
- Security audit logs (7-year compliance requirement)
- Anonymized analytics (no PII, cannot re-identify)

**Response Time**: 30 days maximum (GDPR requirement)

### Right to Rectification (GDPR Article 16)

**What**: Users can correct inaccurate data.

**Process**:
1. User updates data via app (pet profile, email, name)
2. Changes logged in audit trail
3. Old data overwritten (not retained)

**Response Time**: Immediate (user self-service)

### Right to Portability (GDPR Article 20)

**What**: Users can export their data in a machine-readable format.

**Process**: Same as Right to Access (JSON export).

**Format**: JSON (industry standard, machine-readable)

### Right to Object (GDPR Article 21)

**What**: Users can opt out of data processing for marketing/analytics.

**Process**:
1. User toggles "Analytics opt-out" in settings
2. User ID added to exclusion list
3. No analytics events tracked (only critical product events)
4. No marketing emails sent

**Response Time**: Immediate (user self-service)

---

## Compliance Requirements

### GDPR (General Data Protection Regulation)

**Applies to**: All users in European Union (EU) and European Economic Area (EEA).

**Key Requirements**:
- **Lawful basis for processing** (Article 6): User consent
- **Data minimization** (Article 5(1)(c)): Collect only what's needed
- **Storage limitation** (Article 5(1)(e)): Delete when no longer needed
- **Right to erasure** (Article 17): 30-day deletion
- **Data portability** (Article 20): JSON export
- **Breach notification** (Article 33): 72 hours to regulator, immediate to users

**PetForce Compliance**:
- Consent obtained at registration
- Data retention limits enforced (see [Retention Schedules](#retention-schedules))
- Deletion procedures documented (see [Deletion Procedures](#deletion-procedures))
- Data export available (see [User Rights](#right-to-access-gdpr-article-15-ccpa-1798100))

### CCPA (California Consumer Privacy Act)

**Applies to**: All users in California, USA.

**Key Requirements**:
- **Right to know** (Section 1798.100): What data we collect
- **Right to delete** (Section 1798.105): 45-day deletion
- **Right to opt out** (Section 1798.120): Marketing/analytics opt-out
- **Do Not Sell** (Section 1798.115): We do NOT sell user data

**PetForce Compliance**:
- Privacy policy discloses data collection
- Deletion available (30-day SLA, exceeds CCPA 45-day requirement)
- Analytics opt-out available in settings
- No data sales (explicitly stated in privacy policy)

### SOC 2 Type II

**Purpose**: Third-party audit of security controls.

**Key Controls**:
- **Access control**: Role-based access (RBAC), least privilege
- **Audit logging**: 7-year retention for security logs
- **Data encryption**: At rest (AES-256), in transit (TLS 1.2+)
- **Incident response**: Documented procedures

**PetForce Compliance**:
- RLS policies enforce access control
- Security logs retained 7 years
- Encryption enforced (see [Data Classification](#data-classification))
- Incident response plan documented (see `/docs/auth/SECURITY.md`)

### HIPAA (Future Consideration)

**Note**: PetForce does NOT currently handle human health data, so HIPAA does not apply. If we integrate with veterinary clinics that also treat service animals with human patient records, HIPAA compliance may be required.

**Preparation**:
- Pet health records use HIPAA-like retention (3 years for vet visits)
- Encryption standards align with HIPAA (AES-256)
- Audit logging meets HIPAA requirements (7 years)

---

## Implementation

### Database Schema Changes

Add retention metadata to all tables:

```sql
-- Add retention tracking columns
ALTER TABLE users ADD COLUMN data_retention_reviewed_at TIMESTAMPTZ;
ALTER TABLE pets ADD COLUMN data_retention_reviewed_at TIMESTAMPTZ;

-- Add deletion reason for audit
ALTER TABLE users ADD COLUMN deletion_reason VARCHAR(255);
-- Values: 'user_requested', 'inactivity', 'compliance', 'test_account'

-- Add deceased date for pets
ALTER TABLE pets ADD COLUMN deceased_at TIMESTAMPTZ;
```

### Automated Cleanup Jobs

Create cron jobs (or Supabase scheduled functions) for automated deletion:

**Daily Cleanup** (runs at 2 AM UTC):
```sql
-- Delete expired tokens
DELETE FROM email_verifications WHERE expires_at < NOW();
DELETE FROM password_resets WHERE expires_at < NOW();
DELETE FROM magic_links WHERE expires_at < NOW();
DELETE FROM sessions WHERE refresh_token_expires_at < NOW();
```

**Weekly Cleanup** (runs Sunday 3 AM UTC):
```sql
-- Hard delete users past 30-day grace period
DELETE FROM users WHERE deleted_at < NOW() - INTERVAL '30 days';

-- Delete deceased pets after 90 days
DELETE FROM pets WHERE deceased_at < NOW() - INTERVAL '90 days';
```

**Monthly Cleanup** (runs 1st of month, 4 AM UTC):
```sql
-- Soft delete inactive users (2 years no login)
UPDATE users
SET deleted_at = NOW(), deletion_reason = 'inactivity'
WHERE last_login_at < NOW() - INTERVAL '2 years'
  AND deleted_at IS NULL;

-- Archive old transactions to cold storage
-- (Export to S3 Glacier, then delete from DB)
SELECT * FROM transactions
WHERE created_at < NOW() - INTERVAL '1 year'
  AND archived_at IS NULL;
```

**Annual Audit** (runs January 1st):
```sql
-- Generate retention compliance report
SELECT
  table_name,
  COUNT(*) as total_records,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record,
  COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '2 years') as records_over_2_years
FROM (
  SELECT 'users' as table_name, created_at FROM users
  UNION ALL
  SELECT 'pets' as table_name, created_at FROM pets
  UNION ALL
  SELECT 'sessions' as table_name, created_at FROM sessions
) combined
GROUP BY table_name;
```

### Monitoring Dashboard

Create Datadog/Grafana dashboard to track retention compliance:

**Metrics**:
- Records deleted per day (by table)
- Records approaching deletion threshold (warning 30 days before)
- Inactive users count (>18 months, >23 months)
- Deceased pets awaiting deletion (>60 days, warning before 90-day threshold)
- Archive job success/failure rate
- Data export requests (volume, response time)

**Alerts**:
- Deletion job failure (critical)
- Archive job failure (high)
- Records exceeding retention policy (warning)
- Unusual deletion volume (possible data breach)

---

## Monitoring & Auditing

### Audit Log Events

All retention-related actions must be logged:

```json
{
  "event": "data_retention_action",
  "timestamp": "2026-01-25T10:00:00Z",
  "action": "user_deleted",
  "user_id": "sha256:abc123...",
  "deletion_reason": "user_requested",
  "records_deleted": {
    "users": 1,
    "pets": 3,
    "sessions": 5,
    "email_verifications": 2
  },
  "performed_by": "automated_job",
  "request_id": "req_123abc"
}
```

### Quarterly Compliance Review

**Checklist**:
- [ ] Review retention schedules (any new data types?)
- [ ] Audit deletion job success rate (>99.9% expected)
- [ ] Verify archive integrity (checksum validation)
- [ ] Test data export process (sample user request)
- [ ] Review user deletion requests (average response time <30 days?)
- [ ] Check for orphaned data (records that should have been deleted)
- [ ] Update privacy policy (if retention policies changed)
- [ ] Train support team on user rights (GDPR/CCPA)

### Incident Response

If retention policy is violated (e.g., data not deleted on time):

1. **Identify**: How many records affected? How long overdue?
2. **Contain**: Stop deletion jobs if causing issues
3. **Remediate**: Manually delete overdue records
4. **Notify**: If >72 hours overdue AND contains PII, notify affected users (GDPR breach)
5. **Document**: Incident report, root cause analysis
6. **Prevent**: Update automation, add monitoring

---

## Future Enhancements

### Phase 1: Data Retention Dashboard (Q2 2026)

Build self-service dashboard for users to:
- View what data we hold
- Download data export (instant, no support request)
- Request deletion (instant, no support request)
- Manage analytics opt-out

### Phase 2: Granular Retention Controls (Q3 2026)

Allow users to configure retention per data type:
- "Delete my location data after 30 days"
- "Keep pet health records for 5 years"
- "Delete support tickets after 90 days"

### Phase 3: Right to Forget Extensions (Q4 2026)

Extend deletion to third-party integrations:
- Notify analytics services (Mixpanel, Amplitude) to delete user
- Request deletion from email provider (SendGrid, Mailgun)
- Delete from backup systems (restore from backup, delete user, re-backup)

---

## References

- [GDPR Full Text](https://gdpr.eu/)
- [CCPA Full Text](https://oag.ca.gov/privacy/ccpa)
- [SOC 2 Compliance Guide](https://www.aicpa.org/soc)
- [NIST Data Retention Best Practices](https://csrc.nist.gov/publications/detail/sp/800-88/rev-1/final)
- [Supabase Data Management](https://supabase.com/docs/guides/database/managing-data)

---

## Approval & Review

| Role | Name | Approval Date | Signature |
|------|------|---------------|-----------|
| Data Engineering (Buck) | Buck | 2026-01-25 | ✓ Initial draft |
| Security (Samantha) | Samantha | TBD | Pending review |
| Legal Counsel | TBD | TBD | Pending review |
| Product Management (Peter) | Peter | TBD | Pending review |

**Next Review Date**: 2026-04-25 (Quarterly)

**Change Log**:
- 2026-01-25: Initial policy created (Buck)

---

**Document Version**: 1.0
**Status**: DRAFT - Pending approval from Security, Legal, and Product teams
