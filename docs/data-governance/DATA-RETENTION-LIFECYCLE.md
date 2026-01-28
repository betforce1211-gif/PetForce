# Data Retention Lifecycle Diagrams

**Visual guide to data retention flows at PetForce**

---

## User Account Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER REGISTRATION                           │
│  - Email + password                                             │
│  - Email verification required                                  │
│  - Profile data (name, preferences)                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ACTIVE USER                                │
│  - Data retained indefinitely while account active              │
│  - Session tokens: 30 days auto-expire                          │
│  - Pet profiles: Retained with account                          │
│  - Health records: Retained indefinitely                        │
│  - Logs: 90 days (application), 7 years (security)              │
└───────────┬──────────────────────────────────┬──────────────────┘
            │                                  │
            │ (No login for 18 months)         │ (User requests deletion)
            ▼                                  ▼
┌───────────────────────────┐      ┌─────────────────────────────┐
│   INACTIVITY WARNING #1   │      │    SOFT DELETE (Day 0)      │
│  - Email: "Login soon!"   │      │  - deleted_at = NOW()       │
│  - 18 months no login     │      │  - Email masked             │
│  - 6 months to act        │      │  - Sessions invalidated     │
└────────────┬──────────────┘      │  - 30-day grace period      │
             │                     └──────────┬──────────────────┘
             │ (No login for 23 months)       │
             ▼                                │ (30 days pass)
┌───────────────────────────┐                 ▼
│   INACTIVITY WARNING #2   │      ┌─────────────────────────────┐
│  - Email: "30 days left!" │      │    HARD DELETE (Day 30)     │
│  - Final warning          │      │  - User record deleted      │
└────────────┬──────────────┘      │  - Pets deleted             │
             │                     │  - Health records deleted   │
             │ (No login for 24 months)       │  - Photos deleted           │
             ▼                                │  - KEEP: Transactions (7y)  │
┌───────────────────────────┐                 │  - KEEP: Audit logs (7y)    │
│   SOFT DELETE (Inactivity)│                 │  - KEEP: Aggregated data    │
│  - 30-day grace period    │                 └─────────────────────────────┘
│  - User can still recover │
└────────────┬──────────────┘
             │ (30 days pass)
             ▼
┌───────────────────────────┐
│      HARD DELETE          │
│  - Permanent deletion     │
└───────────────────────────┘
```

---

## Pet Profile Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                     PET REGISTRATION                            │
│  - Owner adds pet profile                                       │
│  - Name, species, breed, birthdate                              │
│  - Initial health records (vaccinations, vet info)              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ACTIVE PET                                 │
│  - Profile retained indefinitely                                │
│  - Health records continuously added:                           │
│    • Vaccinations (reminders: until date + 30 days)             │
│    • Medications (schedules: until end date + 90 days)          │
│    • Vet visits (history: 3 years)                              │
│    • Weight/vitals tracking (indefinitely)                      │
│  - Photos/videos (while account active)                         │
└────────────┬──────────────────────────────────┬─────────────────┘
             │                                  │
             │ (Pet passes away)                │ (User deletes pet)
             ▼                                  ▼
┌───────────────────────────┐      ┌──────────────────────────────┐
│    PET MARKED DECEASED    │      │    PET PROFILE DELETED       │
│  - deceased_at = NOW()    │      │  - Immediate soft delete     │
│  - 90-day retention       │      │  - 30-day grace period       │
│  - "Grieving period"      │      │  - Can recover via support   │
│  - Records still viewable │      └──────────┬───────────────────┘
│  - User can download      │                 │ (30 days pass)
└────────────┬──────────────┘                 ▼
             │                     ┌──────────────────────────────┐
             │ (90 days pass)      │    HARD DELETE               │
             ▼                     │  - Pet record deleted        │
┌───────────────────────────┐      │  - Health records deleted    │
│      HARD DELETE          │      │  - Photos deleted            │
│  - Pet record deleted     │      │  - Anonymized stats kept:    │
│  - Health records deleted │      │    "1 dog aged X died"       │
│  - Photos deleted         │      └──────────────────────────────┘
│  - Anonymized stats kept: │
│    "1 dog aged 12 died"   │
└───────────────────────────┘
```

---

## Session & Token Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER LOGIN                              │
│  - Email + password verified                                    │
│  - Email confirmation checked                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     TOKENS ISSUED                               │
│  - Access token: 15 minutes                                     │
│  - Refresh token: 30 days                                       │
│  - Session metadata: IP, user agent, device                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ACTIVE SESSION                             │
│  - Access token in memory (web) or SecureStore (mobile)         │
│  - Refresh token in localStorage (web) or SecureStore (mobile)  │
│  - Auto-refresh when access token expires (15 min)              │
└───────┬────────────┬────────────┬──────────────┬────────────────┘
        │            │            │              │
        │ (15 min)   │ (30 days)  │ (Logout)     │ (Password change)
        ▼            ▼            ▼              ▼
┌───────────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────────────┐
│ ACCESS TOKEN  │ │ REFRESH  │ │  USER    │ │  PASSWORD CHANGED   │
│   EXPIRES     │ │  TOKEN   │ │ LOGS OUT │ │  - All sessions     │
│ - Auto-refresh│ │ EXPIRES  │ │ - Token  │ │    invalidated      │
│   using       │ │ - User   │ │   deleted│ │  - User must login  │
│   refresh     │ │   must   │ │ - Session│ │    again            │
│   token       │ │   login  │ │   ended  │ └─────────────────────┘
│ - New tokens  │ │   again  │ └──────────┘
│   issued      │ └──────────┘
└───────────────┘
                         │
                         ▼
                 ┌──────────────────┐
                 │  SESSION DELETED │
                 │  - From database │
                 │  - Metadata kept │
                 │    for 90 days   │
                 │    (audit/debug) │
                 └──────────────────┘
```

---

## Email Verification & Password Reset Token Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│              USER REQUESTS EMAIL VERIFICATION                   │
│              OR PASSWORD RESET                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      TOKEN GENERATED                            │
│  - 256-bit cryptographically secure random token                │
│  - Hashed before storage (SHA-256)                              │
│  - Expiration: 1 hour (email verify) or 1 hour (password reset) │
│  - Rate limit: 3 requests per 15 minutes                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EMAIL SENT                                 │
│  - Token in URL (HTTPS only)                                    │
│  - "Click to verify" or "Reset password"                        │
└───────────┬──────────────────────────────────┬──────────────────┘
            │                                  │
            │ (User clicks link)               │ (1 hour passes)
            ▼                                  ▼
┌───────────────────────────┐      ┌──────────────────────────────┐
│    TOKEN VALIDATED        │      │    TOKEN EXPIRES             │
│  - Hash compared          │      │  - Auto-deleted from DB      │
│  - Expiration checked     │      │  - User must request new one │
│  - Single use (deleted)   │      │  - Rate limit still applies  │
└────────────┬──────────────┘      └──────────────────────────────┘
             │
             ▼
┌───────────────────────────┐
│    ACTION COMPLETED       │
│  - Email verified, OR     │
│  - Password reset         │
│  - Token deleted from DB  │
└───────────────────────────┘
```

---

## Log & Analytics Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                      EVENT OCCURS                               │
│  - User action (login, logout, feature use)                     │
│  - System event (error, warning, info)                          │
│  - Security event (failed login, suspicious activity)           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      LOG CREATED                                │
│  - PII hashed (email SHA-256, no names/addresses)               │
│  - Timestamp, request ID, event type                            │
│  - Metadata (IP, user agent, etc.)                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              PRIMARY STORAGE (Hot Data)                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Application Logs: 90 days                                │   │
│  │ - Debugging recent issues                                │   │
│  │ - $0.10/GB/month                                         │   │
│  └────────────────────┬─────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Error Logs: 1 year                                       │   │
│  │ - Pattern analysis                                       │   │
│  │ - $0.10/GB/month                                         │   │
│  └────────────────────┬─────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Security Audit Logs: 1 year (then archive)              │   │
│  │ - Compliance requirement (7 years total)                │   │
│  │ - $0.10/GB/month (Year 1)                               │   │
│  └────────────────────┬─────────────────────────────────────┘   │
└────────────────────────┼────────────────────────────────────────┘
                         │
                         │ (90 days / 1 year / 1 year)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DELETED OR ARCHIVED                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Application Logs: DELETED after 90 days                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Error Logs: DELETED after 1 year                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Security Audit Logs: ARCHIVED to cold storage           │   │
│  │ - S3 Glacier / R2 Infrequent Access                     │   │
│  │ - $0.004/GB/month (Years 2-7)                           │   │
│  │ - 96% cost reduction                                    │   │
│  │ - Retrieval: 12-24 hours                                │   │
│  └────────────────────┬─────────────────────────────────────┘   │
└────────────────────────┼────────────────────────────────────────┘
                         │
                         │ (7 years total)
                         ▼
                 ┌──────────────────┐
                 │  DELETED         │
                 │  - After 7 years │
                 │  - Compliance    │
                 │    obligation    │
                 │    complete      │
                 └──────────────────┘
```

---

## Transaction Data Lifecycle (7-Year Compliance)

```
┌─────────────────────────────────────────────────────────────────┐
│                  TRANSACTION OCCURS                             │
│  - Subscription payment                                         │
│  - Invoice generated                                            │
│  - Refund processed                                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                PRIMARY DATABASE (Year 1)                        │
│  - All transaction details                                      │
│  - Payment method (last 4 digits only)                          │
│  - Billing address                                              │
│  - Amount, currency, tax                                        │
│  - Invoice PDF (encrypted)                                      │
│  - Cost: $0.10/GB/month                                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ (After 1 year)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                COLD STORAGE (Years 2-7)                         │
│  - Exported to S3 Glacier / R2 Infrequent Access                │
│  - Compressed JSON (gzip)                                       │
│  - Encrypted (AES-256)                                          │
│  - Checksum validated                                           │
│  - Cost: $0.004/GB/month (96% savings)                          │
│  - Retrieval: 12-24 hours (if requested)                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ (After 7 years total)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DELETED                                    │
│  - Tax/audit obligation complete (7 years)                      │
│  - Permanent deletion from cold storage                         │
│  - Anonymized stats retained:                                   │
│    "1 subscription for $X in 2023" (no user ID)                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Export Request Lifecycle (GDPR/CCPA)

```
┌─────────────────────────────────────────────────────────────────┐
│              USER REQUESTS DATA EXPORT                          │
│  - Via support ticket or in-app form (future)                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  IDENTITY VERIFICATION                          │
│  - User must be logged in, OR                                   │
│  - Email confirmation link sent                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  DATA EXPORT GENERATED                          │
│  - User profile (email, name, preferences)                      │
│  - Pet profiles (all pets, health records)                      │
│  - Transaction history (subscriptions, payments)                │
│  - Support tickets (user's communications)                      │
│  - Format: JSON (machine-readable)                              │
│  - Encrypted archive (AES-256)                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              SECURE DOWNLOAD LINK SENT                          │
│  - Email with download link                                     │
│  - Link expires in 7 days                                       │
│  - Password-protected ZIP                                       │
│  - SLA: 30 days maximum (GDPR/CCPA)                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
                 ┌──────────────────┐
                 │  USER DOWNLOADS  │
                 │  - Data received │
                 │  - Link expires  │
                 │    after 7 days  │
                 │  - Archive       │
                 │    deleted       │
                 └──────────────────┘
```

---

## Automated Cleanup Jobs Schedule

```
┌─────────────────────────────────────────────────────────────────┐
│                      DAILY CLEANUP                              │
│  Schedule: 2 AM UTC                                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ • Delete expired email verification tokens              │   │
│  │ • Delete expired password reset tokens                  │   │
│  │ • Delete expired magic link tokens                      │   │
│  │ • Delete expired sessions                               │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      WEEKLY CLEANUP                             │
│  Schedule: Sunday, 3 AM UTC                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ • Hard delete soft-deleted users (>30 days)             │   │
│  │ • Delete deceased pets (>90 days)                       │   │
│  │ • Delete old session metadata (>90 days)                │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      MONTHLY CLEANUP                            │
│  Schedule: 1st of month, 4 AM UTC                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ • Soft delete inactive users (>2 years no login)        │   │
│  │ • Archive old transactions to cold storage (>1 year)    │   │
│  │ • Delete old error logs (>1 year)                       │   │
│  │ • Archive security audit logs (>1 year)                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      ANNUAL AUDIT                               │
│  Schedule: January 1st, 12 PM UTC                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ • Generate retention compliance report                  │   │
│  │ • Review retention schedules (any new data types?)      │   │
│  │ • Audit deletion job success rate (>99.9% expected)     │   │
│  │ • Verify archive integrity (checksum validation)        │   │
│  │ • Check for orphaned data                               │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cost Optimization: Primary vs. Cold Storage

```
┌────────────────────────────────────────────────────────────────┐
│                   PRIMARY DATABASE                             │
│  PostgreSQL (Supabase)                                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Active data (<1 year old)                               │  │
│  │ • Fast queries (<100ms)                                 │  │
│  │ • Full CRUD operations                                  │  │
│  │ • Cost: $0.10/GB/month                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────┬────────────────────────────────────┘
                            │
                            │ (After 1 year)
                            ▼
┌────────────────────────────────────────────────────────────────┐
│                      COLD STORAGE                              │
│  S3 Glacier / Cloudflare R2 Infrequent Access                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Archived data (1-7 years old)                           │  │
│  │ • Slow retrieval (12-24 hours)                          │  │
│  │ • Read-only access                                      │  │
│  │ • Cost: $0.004/GB/month                                 │  │
│  │ • Savings: 96% vs. primary DB                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘

Example: 100 GB of 6-year-old transaction data
• Primary DB cost: $0.10/GB/mo × 100 GB = $10/month ($120/year)
• Cold storage cost: $0.004/GB/mo × 100 GB = $0.40/month ($4.80/year)
• Annual savings: $115.20 per 100 GB (96% reduction)
```

---

**Created**: 2026-01-25
**Version**: 1.0
**Next Review**: 2026-04-25 (Quarterly)

**See Also**:
- [Data Retention Policy (Full)](./DATA-RETENTION-POLICY.md)
- [Quick Reference Card](./QUICK-REFERENCE-CARD.md)
- [Data Governance README](./README.md)
