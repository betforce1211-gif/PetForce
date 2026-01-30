# Data Retention Quick Reference Card

**Print this card for quick reference on data retention policies**

---

## Retention Periods at a Glance

| Data Type | Keep For | Why |
|-----------|----------|-----|
| **Active user accounts** | While active | Product functionality |
| **Inactive user accounts** | 2 years | Automatic soft-delete after warnings |
| **Deleted accounts (soft)** | 30 days | Grace period for recovery |
| **Deleted accounts (hard)** | Permanent | After 30-day grace period |
| **Pet profiles (active)** | Indefinitely | Ongoing care history |
| **Pet profiles (deceased)** | 90 days | Grieving period retention |
| **Pet health records** | Same as pet | Valuable medical history |
| **Session tokens** | 30 days | Auto-expire and refresh |
| **Password reset tokens** | 1 hour | Security: minimize attack window |
| **Email verification tokens** | 1 hour | Security: minimize attack window |
| **Application logs** | 90 days | Recent debugging |
| **Error logs** | 1 year | Pattern analysis |
| **Security audit logs** | 7 years | Compliance (SOC 2) |
| **Transaction records** | 7 years | Tax/audit compliance |
| **Support tickets** | 1 year | Product insights (anonymized) |
| **Analytics (aggregated)** | 3 years | Historical trends |

---

## User Rights Response Times

| Right | Law | SLA | How |
|-------|-----|-----|-----|
| **Access (data export)** | GDPR Art. 15, CCPA 1798.100 | 30 days | Support request or in-app (future) |
| **Deletion** | GDPR Art. 17, CCPA 1798.105 | 30 days | Support request or in-app (future) |
| **Rectification** | GDPR Art. 16 | Immediate | Self-service in app |
| **Portability** | GDPR Art. 20 | 30 days | JSON export via support |
| **Opt-out** | GDPR Art. 21, CCPA 1798.120 | Immediate | Self-service in settings |

---

## Data Classification Tiers

| Tier | Sensitivity | Examples | Protection |
|------|-------------|----------|------------|
| **Tier 1** | Critical PII | Email, name, address, payment info, IP, location, biometrics | AES-256 encryption, SHA-256 hashing in logs, RLS |
| **Tier 2** | Pet Health | Vaccination records, medications, vet visits, weight, allergies | AES-256 encryption, RLS, owner-only access |
| **Tier 3** | Operational | Pet names, user preferences, app usage, support tickets | RLS, anonymized for analytics |
| **Tier 4** | Aggregated | Feature adoption, dashboard usage, A/B tests (no user IDs) | No PII, cannot re-identify |
| **Tier 5** | System Logs | App logs, DB logs, server logs | PII hashed, restricted access |

---

## Deletion Checklist (User Requests Account Deletion)

**Within 24 hours**:
- [ ] Invalidate all sessions (logout everywhere)
- [ ] Soft delete: Set `deleted_at = NOW()`
- [ ] Mask email: `email = 'deleted_YYYYMMDD@deleted.local'`
- [ ] Prevent login (check `deleted_at`)
- [ ] Send confirmation email to user

**Within 30 days (grace period)**:
- User can recover account via support
- Data remains in database (soft-deleted)
- No new data collected

**After 30 days (hard delete)**:
- [ ] Delete user authentication records
- [ ] Delete pet profiles and health data
- [ ] Delete photos/videos (S3/R2 storage)
- [ ] Delete session history
- [ ] Delete preferences
- [ ] Keep: Transaction records (7 years), security audit logs (7 years)
- [ ] Keep: Aggregated analytics (anonymized, no user ID)
- [ ] Send deletion confirmation email (if opted in)

---

## Compliance Quick Check

### Before Collecting New Data

- [ ] What sensitivity tier? (Tier 1-5)
- [ ] What's the retention period?
- [ ] Is it documented in privacy policy?
- [ ] Do we need encryption? (Tier 1-2)
- [ ] Is it in data export process?
- [ ] Is deletion procedure defined?
- [ ] Are monitoring/alerts set up?

### Before Launching New Features

- [ ] Review data collected
- [ ] Apply data minimization (collect only what's needed)
- [ ] Implement RLS policies
- [ ] Add PII hashing to logs
- [ ] Document in data lineage
- [ ] Add data quality tests
- [ ] Train support team on user rights

---

## Automated Cleanup Jobs

| Job | Schedule | What It Does |
|-----|----------|--------------|
| **Daily Cleanup** | 2 AM UTC | Delete expired tokens, expired sessions |
| **Weekly Cleanup** | Sunday 3 AM UTC | Hard delete soft-deleted users (>30 days), deceased pets (>90 days) |
| **Monthly Cleanup** | 1st of month, 4 AM UTC | Soft delete inactive users (>2 years), archive old transactions |
| **Annual Audit** | Jan 1st | Generate retention compliance report |

---

## SQL Quick Commands

### Check for accounts pending deletion
```sql
SELECT id, email, deleted_at
FROM users
WHERE deleted_at IS NOT NULL
  AND deleted_at > NOW() - INTERVAL '30 days';
```

### Check for inactive users (>18 months, warning threshold)
```sql
SELECT id, email, last_login_at
FROM users
WHERE last_login_at < NOW() - INTERVAL '18 months'
  AND deleted_at IS NULL;
```

### Check for deceased pets awaiting deletion
```sql
SELECT id, name, deceased_at
FROM pets
WHERE deceased_at IS NOT NULL
  AND deceased_at < NOW() - INTERVAL '60 days';
```

### Manual cleanup (use with caution!)
```sql
-- Delete expired email verification tokens
DELETE FROM email_verifications WHERE expires_at < NOW();

-- Delete expired password reset tokens
DELETE FROM password_resets WHERE expires_at < NOW();

-- Delete expired sessions
DELETE FROM sessions WHERE refresh_token_expires_at < NOW();
```

---

## Contacts

| Role | Name | Email | For |
|------|------|-------|-----|
| **Data Governance Lead** | Buck | buck@petforce.app | Retention policy questions |
| **Security Officer** | Samantha | samantha@petforce.app | Compliance, PII protection |
| **Privacy Counsel** | TBD | legal@petforce.app | GDPR/CCPA legal questions |
| **Support Team** | Casey | support@petforce.app | User deletion requests |

---

## Key Compliance Laws

### GDPR (EU/EEA Users)
- Storage limitation: Article 5(1)(e)
- Right to access: Article 15
- Right to rectification: Article 16
- Right to erasure: Article 17
- Right to data portability: Article 20
- Right to object: Article 21
- Breach notification: Article 33 (72 hours)

### CCPA (California Users)
- Right to know: Section 1798.100
- Right to delete: Section 1798.105
- Do not sell: Section 1798.115 (we don't sell data)
- Right to opt out: Section 1798.120

### SOC 2 Type II (Security Audit)
- Access control: RBAC, least privilege
- Audit logging: 7-year retention
- Encryption: At rest (AES-256), in transit (TLS 1.2+)

---

## Emergency Contacts

**Data Breach**: security@petforce.app (immediate notification)
**Retention Policy Violation**: buck@petforce.app (within 24 hours)
**GDPR/CCPA Complaint**: legal@petforce.app (within 72 hours)

---

**Print Date**: 2026-01-25
**Policy Version**: 1.0
**Next Review**: 2026-04-25 (Quarterly)

**Full Policy**: `/Users/danielzeddr/PetForce/docs/data-governance/DATA-RETENTION-POLICY.md`
