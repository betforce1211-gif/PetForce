# Infrastructure Cost Planning

**Document Owner**: Isabel (Infrastructure)
**Last Updated**: 2026-01-25
**Status**: ACTIVE
**Version**: 1.0

---

## Executive Summary

This document provides infrastructure cost projections at different user scales (1k, 10k, 100k users) to enable budget planning and ensure cost-efficient scaling aligned with our product philosophy: **"Cost optimization funds pet care features"**.

**Key Findings**:
- 1,000 users: $85-165/month (total infrastructure)
- 10,000 users: $285-565/month (total infrastructure)
- 100,000 users: $1,785-3,565/month (total infrastructure)

**Design Principle**: Right-size for today, design for tomorrow. Every dollar saved on infrastructure funds better pet care features.

---

## Table of Contents

1. [Infrastructure Stack Overview](#infrastructure-stack-overview)
2. [Cost Assumptions](#cost-assumptions)
3. [1,000 Users Projection](#1000-users-projection)
4. [10,000 Users Projection](#10000-users-projection)
5. [100,000 Users Projection](#100000-users-projection)
6. [Cost Optimization Strategies](#cost-optimization-strategies)
7. [Scaling Triggers](#scaling-triggers)
8. [Budget Monitoring](#budget-monitoring)
9. [Risk Analysis](#risk-analysis)
10. [Appendix: Detailed Calculations](#appendix-detailed-calculations)

---

## Infrastructure Stack Overview

### Current Architecture

```
┌─────────────────────────────────────────────┐
│           Frontend Layer                    │
├─────────────────────────────────────────────┤
│ Web App (Vercel)      Mobile Apps (EAS)     │
│ - Static hosting      - iOS App Store       │
│ - CDN                 - Google Play Store   │
│ - Auto-scaling        - OTA updates         │
└─────────────┬───────────────────────────────┘
              │
┌─────────────▼───────────────────────────────┐
│           Backend Layer (Supabase)          │
├─────────────────────────────────────────────┤
│ - PostgreSQL Database (managed)             │
│ - Authentication (built-in)                 │
│ - Storage (S3-compatible)                   │
│ - Edge Functions (serverless)               │
│ - Real-time subscriptions                   │
└─────────────┬───────────────────────────────┘
              │
┌─────────────▼───────────────────────────────┐
│     Observability Layer                     │
├─────────────────────────────────────────────┤
│ Better Stack (Logtail)                      │
│ - Log aggregation                           │
│ - Error tracking                            │
│ - Metrics & monitoring                      │
│ - Alerting                                  │
└─────────────────────────────────────────────┘
```

### Service Breakdown

| Service | Purpose | Pricing Model |
|---------|---------|---------------|
| **Vercel** | Web app hosting, CDN, edge network | Per-seat + bandwidth |
| **Expo (EAS)** | Mobile builds, OTA updates | Per-build + bandwidth |
| **Supabase** | Database, auth, storage, edge functions | Database size + bandwidth + compute |
| **Better Stack** | Monitoring, logging, error tracking | Log volume + data retention |
| **GitHub** | Version control, CI/CD | Free for open source, $4/user for private |

---

## Cost Assumptions

### User Behavior Model

**Average Pet Parent Profile**:
- 2-3 pets per family
- 5-10 app opens per week
- 20-30 API requests per session
- 1-5 photos uploaded per month (future)
- 2-3 health records added per month (future)

**Usage Metrics per Active User per Month**:
- API Requests: 400-600
- Database Reads: 800-1,200
- Database Writes: 50-100
- Storage (photos): 10-50 MB (future feature)
- Bandwidth: 50-100 MB

### Pricing Tier Definitions

**Conservative Estimate**: Assumes higher usage and buffer for growth
**Optimistic Estimate**: Assumes typical usage with some optimizations

### Active User Ratio

- **1,000 users**: 70% active monthly (700 MAU)
- **10,000 users**: 60% active monthly (6,000 MAU)
- **100,000 users**: 50% active monthly (50,000 MAU)

**Rationale**: Early adopters are more engaged. As user base grows, engagement typically decreases to industry averages.

---

## 1,000 Users Projection

**Target Timeline**: Launch → Month 6
**Monthly Active Users**: 700
**Total Registered Users**: 1,000

### Service-by-Service Breakdown

#### 1. Vercel (Web Hosting)

| Resource | Usage | Cost |
|----------|-------|------|
| **Plan** | Hobby (free) or Pro | $0 or $20/month |
| **Bandwidth** | ~70 GB/month | Included in Hobby |
| **Build Minutes** | ~100 min/month | Included |
| **Edge Functions** | Minimal usage | Included |

**Estimate**: $0-20/month

**Notes**:
- Hobby plan (free) likely sufficient at this scale
- Upgrade to Pro ($20/month) for:
  - Custom domains
  - Advanced analytics
  - Team collaboration

**Recommendation**: Start with Hobby, upgrade when revenue begins.

---

#### 2. Expo Application Services (EAS)

| Resource | Usage | Cost |
|----------|-------|------|
| **Plan** | Production | $29/month |
| **iOS Builds** | 4-8/month | 30 included |
| **Android Builds** | 4-8/month | 30 included |
| **OTA Updates** | Unlimited | Included |

**Estimate**: $29/month

**Notes**:
- Production plan required for app store deployments
- Includes code signing and distribution
- Unlimited over-the-air updates for bug fixes

**Recommendation**: Production plan from day one for reliability.

---

#### 3. Supabase (Backend Infrastructure)

| Resource | Usage | Cost |
|----------|-------|------|
| **Plan** | Pro | $25/month |
| **Database Size** | 2-5 GB | Included (8 GB) |
| **Bandwidth** | 35-70 GB | Included (250 GB) |
| **Auth Users** | 1,000 | Included (100k MAU) |
| **Storage** | Minimal | Included (100 GB) |
| **Edge Functions** | 50k invocations | Included (2M/month) |

**Estimate**: $25/month

**Notes**:
- Free tier supports up to 500 MB database, insufficient for production
- Pro plan provides production SLA (99.9% uptime)
- Email authentication included
- Automatic daily backups (7-day retention)

**Recommendation**: Pro plan from launch for reliability SLA.

---

#### 4. Better Stack (Monitoring & Logging)

| Resource | Usage | Cost |
|----------|-------|------|
| **Plan** | Free or Starter | $0 or $10/month |
| **Log Volume** | 0.5-1 GB/month | Free: 1 GB |
| **Data Retention** | 3 days (free) or 14 days | Starter: 14 days |
| **Team Members** | 1-2 | Unlimited |

**Estimate**: $0-10/month

**Notes**:
- Free tier likely sufficient for initial launch
- Upgrade to Starter for longer retention (debugging historical issues)
- Real-time alerting included in free tier

**Recommendation**: Start free, upgrade when debugging requires history.

---

#### 5. GitHub (Version Control & CI/CD)

| Resource | Usage | Cost |
|----------|-------|------|
| **Plan** | Free or Team | $0 or $4/user/month |
| **Seats** | 2-3 developers | $8-12/month |
| **Actions Minutes** | 500-1,000/month | Free: 2,000 min |
| **Storage** | Minimal | Free: 500 MB |

**Estimate**: $0-12/month

**Notes**:
- Free tier sufficient for small teams
- Team plan adds branch protection, code owners
- Actions minutes ample for current build pipeline

**Recommendation**: Start free, upgrade when team grows or needs advanced features.

---

#### 6. Domain & DNS

| Resource | Usage | Cost |
|----------|-------|------|
| **Domain Registration** | petforce.app | $12-20/year |
| **DNS Hosting** | Cloudflare (free) | $0/month |
| **SSL Certificates** | Let's Encrypt (free) | $0/month |

**Estimate**: $1-2/month (amortized domain cost)

**Notes**:
- Domain registration is annual cost
- DNS and SSL are free via Cloudflare + Vercel/Supabase
- Email forwarding via Cloudflare Email Routing (free)

**Recommendation**: Register domain early, use free DNS/SSL.

---

#### 7. App Store Fees (One-Time & Annual)

| Item | Frequency | Cost |
|------|-----------|------|
| **Apple Developer** | Annual | $99/year |
| **Google Play Developer** | One-time | $25 (one-time) |

**Amortized Monthly Cost**: $10-12/month

**Notes**:
- Required for app store distribution
- Apple fee is annual, Google is one-time
- Includes TestFlight (iOS) and Internal Testing (Android)

**Recommendation**: Required costs, budget accordingly.

---

### 1,000 Users: Total Monthly Cost

| Service | Conservative | Optimistic | Notes |
|---------|--------------|------------|-------|
| Vercel | $20 | $0 | Hobby free → Pro when revenue starts |
| EAS (Expo) | $29 | $29 | Required for mobile |
| Supabase | $25 | $25 | Pro plan for SLA |
| Better Stack | $10 | $0 | Free tier likely sufficient |
| GitHub | $12 | $0 | Free for small teams |
| Domain/DNS | $2 | $2 | Annual domain amortized |
| App Store Fees | $12 | $12 | Apple + Google amortized |
| **TOTAL** | **$110/month** | **$68/month** | **Avg: $89/month** |

**First Year Total Cost**: $820-1,320

**Cost Per User**: $0.07-0.11/month (based on 1,000 total users)
**Cost Per MAU**: $0.10-0.16/month (based on 700 active users)

---

### 1,000 Users: Optimization Opportunities

1. **Start with free tiers** (Vercel Hobby, Better Stack Free, GitHub Free)
2. **Upgrade only when limits are reached** (revenue-driven)
3. **Monitor Supabase bandwidth** to avoid overages
4. **Use OTA updates** (EAS) instead of frequent app store releases

**Potential Savings**: $42/month if staying on free tiers where possible

---

## 10,000 Users Projection

**Target Timeline**: Month 6 → Month 18
**Monthly Active Users**: 6,000
**Total Registered Users**: 10,000

### Service-by-Service Breakdown

#### 1. Vercel (Web Hosting)

| Resource | Usage | Cost |
|----------|-------|------|
| **Plan** | Pro | $20/month |
| **Bandwidth** | ~600 GB/month | Included (1 TB) |
| **Build Minutes** | ~300 min/month | Included (6,000) |
| **Serverless Functions** | Moderate usage | Included |

**Estimate**: $20/month

**Notes**:
- Pro plan now required for custom domains and team features
- Bandwidth within limits
- May add $20/user/month for additional team members (2-3 total)

**Potential Add-Ons**: +$40 for additional seats (total: $60/month)

---

#### 2. Expo Application Services (EAS)

| Resource | Usage | Cost |
|----------|-------|------|
| **Plan** | Production | $29/month |
| **iOS Builds** | 8-12/month | 30 included |
| **Android Builds** | 8-12/month | 30 included |
| **OTA Updates** | Unlimited | Included |

**Estimate**: $29/month

**Notes**:
- Build frequency increases with feature velocity
- OTA updates reduce need for full builds
- May need Enterprise plan ($799/month) at 100k+ users for priority support

---

#### 3. Supabase (Backend Infrastructure)

| Resource | Usage | Cost |
|----------|-------|------|
| **Plan** | Pro | $25/month |
| **Database Size** | 15-30 GB | Overages: $0.125/GB |
| **Bandwidth** | 350-600 GB | Overages: $0.09/GB |
| **Auth Users** | 10,000 | Included (100k MAU) |
| **Storage** | 50-100 GB | Included (100 GB) |
| **Edge Functions** | 500k invocations | Included (2M/month) |
| **Database Overages** | 7-22 GB over | $1-3/month |
| **Bandwidth Overages** | 100-350 GB over | $9-32/month |

**Estimate**: $35-60/month

**Notes**:
- Database growth from pet records, health data, photos metadata
- Bandwidth increases with mobile app usage and image loading
- May need Team plan ($599/month) at 50k+ users for priority support

**Optimization Opportunities**:
- Implement CDN for static assets (reduce Supabase bandwidth)
- Use database indexes to reduce query load
- Archive old records to reduce database size

---

#### 4. Better Stack (Monitoring & Logging)

| Resource | Usage | Cost |
|----------|-------|------|
| **Plan** | Starter or Professional | $10-30/month |
| **Log Volume** | 5-10 GB/month | Starter: 15 GB |
| **Data Retention** | 14-30 days | Professional: 30 days |
| **Team Members** | 3-5 | Unlimited |

**Estimate**: $10-30/month

**Notes**:
- Increased log volume from 10x user base
- Longer retention needed for debugging production issues
- May need custom alerts and dashboards

**Recommendation**: Professional plan ($30/month) for production maturity.

---

#### 5. GitHub (Version Control & CI/CD)

| Resource | Usage | Cost |
|----------|-------|------|
| **Plan** | Team | $4/user/month |
| **Seats** | 3-5 developers | $12-20/month |
| **Actions Minutes** | 2,000-3,000/month | Included (3,000) |
| **Storage** | 1-2 GB | Included (2 GB) |

**Estimate**: $12-20/month

**Notes**:
- Team plan now required for branch protection and code reviews
- Actions minutes may need upgrade ($0.008/min) if CI/CD is heavy

**Potential Overages**: $8-24/month for additional Actions minutes

---

#### 6. CDN for Static Assets (Cloudflare or Bunny.net)

**New Service at This Scale**

| Resource | Usage | Cost |
|----------|-------|------|
| **CDN** | Cloudflare Pro or Bunny.net | $20 or $10/month |
| **Bandwidth** | 500-1,000 GB | Cloudflare: Unlimited |
| **Image Optimization** | Enabled | Cloudflare: Included |

**Estimate**: $10-20/month

**Notes**:
- Offload static assets from Supabase to reduce bandwidth costs
- Improve performance with global edge caching
- Cloudflare Pro: $20/month (unlimited bandwidth)
- Bunny.net: Pay-as-you-go ($1/TB, ~$10/month)

**Recommendation**: Add CDN at 10k users to optimize costs and performance.

---

#### 7. Email Service (for transactional emails)

**New Service at This Scale**

| Resource | Usage | Cost |
|----------|-------|------|
| **Service** | SendGrid, Postmark, or Resend | $15-30/month |
| **Volume** | 50,000 emails/month | SendGrid: $15 |
| **Deliverability** | High priority | Postmark: $15 |

**Estimate**: $15-30/month

**Notes**:
- Supabase email may be insufficient for custom templates and deliverability
- Transactional emails: registration, password reset, notifications
- 10k users * 5 emails/month = 50k emails

**Recommendation**: Switch to dedicated email service for deliverability.

---

#### 8. Backup & Disaster Recovery

| Resource | Usage | Cost |
|----------|-------|------|
| **Supabase PITR** | Point-in-time recovery | $100/month (add-on) |
| **Off-site Backups** | Daily snapshots to S3 | $5-10/month |

**Estimate**: $5-100/month (depends on RPO/RTO requirements)

**Notes**:
- Supabase Pro includes 7-day backups
- PITR add-on ($100/month) provides recovery to any point in time
- Manual S3 backups ($5-10/month) provide off-site disaster recovery

**Recommendation**: Start with manual S3 backups, upgrade to PITR if revenue supports.

---

### 10,000 Users: Total Monthly Cost

| Service | Conservative | Optimistic | Notes |
|---------|--------------|------------|-------|
| Vercel | $60 | $20 | Pro + team seats |
| EAS (Expo) | $29 | $29 | Production plan |
| Supabase | $60 | $35 | Pro + overages |
| Better Stack | $30 | $10 | Professional vs Starter |
| GitHub | $20 | $12 | Team plan, 5 vs 3 seats |
| CDN | $20 | $10 | Cloudflare vs Bunny.net |
| Email Service | $30 | $15 | Premium vs basic |
| Backup/DR | $100 | $5 | PITR vs manual |
| Domain/DNS | $2 | $2 | Annual amortized |
| App Store Fees | $12 | $12 | Annual amortized |
| **TOTAL** | **$363/month** | **$150/month** | **Avg: $257/month** |

**Annual Cost**: $1,800-4,356

**Cost Per User**: $0.015-0.036/month (based on 10,000 total users)
**Cost Per MAU**: $0.025-0.061/month (based on 6,000 active users)

---

### 10,000 Users: Optimization Opportunities

1. **Use Bunny.net CDN** instead of Cloudflare Pro (save $10/month)
2. **Start with SendGrid free tier** if email volume is lower (save $15/month)
3. **Skip PITR initially**, use manual backups (save $95/month)
4. **Optimize database queries** to reduce Supabase overages (save $10-25/month)
5. **Implement caching** (Redis or in-app) to reduce database reads

**Potential Savings**: $130-145/month with optimizations

---

## 100,000 Users Projection

**Target Timeline**: Month 18+
**Monthly Active Users**: 50,000
**Total Registered Users**: 100,000

### Service-by-Service Breakdown

#### 1. Vercel (Web Hosting)

| Resource | Usage | Cost |
|----------|-------|------|
| **Plan** | Pro or Enterprise | $20 or Custom |
| **Bandwidth** | ~6 TB/month | Overages: $40/TB |
| **Team Seats** | 5-10 members | $100-200/month |
| **Edge Functions** | Heavy usage | Included (100M req) |

**Estimate**: $120-500/month

**Notes**:
- May need Enterprise plan for custom SLA and support
- Bandwidth overages likely (5 TB over limit = $200)
- Team collaboration features critical at this scale

**Recommendation**: Negotiate Enterprise pricing at this scale.

---

#### 2. Expo Application Services (EAS)

| Resource | Usage | Cost |
|----------|-------|------|
| **Plan** | Production or Enterprise | $29 or $799/month |
| **iOS Builds** | 15-30/month | Production: 30 included |
| **Android Builds** | 15-30/month | Production: 30 included |
| **Priority Support** | Required | Enterprise benefit |

**Estimate**: $29-799/month

**Notes**:
- Production plan likely sufficient
- Enterprise plan ($799) provides priority support and custom SLA
- Build concurrency increases with team size

**Recommendation**: Stay on Production unless SLA requires Enterprise.

---

#### 3. Supabase (Backend Infrastructure)

| Resource | Usage | Cost |
|----------|-------|------|
| **Plan** | Team or Enterprise | $599 or Custom |
| **Database Size** | 150-300 GB | Team: 200 GB included |
| **Bandwidth** | 3.5-6 TB | Team: Unlimited |
| **Auth Users** | 100,000 | Included |
| **Storage** | 500-1,000 GB | Overages: $0.021/GB |
| **Edge Functions** | 5M invocations | Included (25M) |
| **Compute** | Dedicated instances | Included in Team |

**Estimate**: $599-1,500/month

**Notes**:
- Team plan ($599) required for unlimited bandwidth and dedicated compute
- Enterprise plan (custom pricing) for multi-region, custom SLA, priority support
- Database size may need optimization (archiving, partitioning)
- Storage overages likely: 500-800 GB * $0.021 = $10-17/month

**Recommendation**: Team plan, upgrade to Enterprise if multi-region needed.

---

#### 4. Better Stack (Monitoring & Logging)

| Resource | Usage | Cost |
|----------|-------|------|
| **Plan** | Business or Enterprise | $80-200/month |
| **Log Volume** | 50-100 GB/month | Business: 100 GB |
| **Data Retention** | 90 days | Configurable |
| **Team Members** | 10-20 | Unlimited |

**Estimate**: $80-200/month

**Notes**:
- Log volume increases significantly with 10x user base
- Advanced features needed: custom dashboards, Slack integration, SLA
- May consider Datadog ($200-400/month) for APM and distributed tracing

**Recommendation**: Better Stack Business, evaluate Datadog if APM needed.

---

#### 5. GitHub (Version Control & CI/CD)

| Resource | Usage | Cost |
|----------|-------|------|
| **Plan** | Team or Enterprise | $4-21/user/month |
| **Seats** | 10-15 developers | $40-315/month |
| **Actions Minutes** | 10,000-20,000/month | Overages: $80-160 |
| **Storage** | 5-10 GB | Included (50 GB on Enterprise) |

**Estimate**: $120-475/month

**Notes**:
- Team plan: $4/user/month (total: $40-60 for 10-15 users)
- Enterprise plan: $21/user/month (total: $210-315) for advanced security, SSO
- Actions minutes may need separate purchase ($0.008/min)

**Recommendation**: Stay on Team unless compliance requires Enterprise.

---

#### 6. CDN for Static Assets

| Resource | Usage | Cost |
|----------|-------|------|
| **CDN** | Cloudflare Business or Bunny.net | $200 or $50/month |
| **Bandwidth** | 5-10 TB | Bunny.net: $5/TB |
| **Image Optimization** | Enabled | Included |

**Estimate**: $50-200/month

**Notes**:
- Cloudflare Business: $200/month (enterprise-grade WAF, DDoS)
- Bunny.net: Pay-as-you-go (~$50/month for 10 TB)
- Critical for offloading Supabase bandwidth

**Recommendation**: Bunny.net for cost efficiency, Cloudflare for security/DDoS.

---

#### 7. Email Service (Transactional)

| Resource | Usage | Cost |
|----------|-------|------|
| **Service** | SendGrid, Postmark, or Resend | $90-200/month |
| **Volume** | 500,000 emails/month | SendGrid: $90 |
| **Deliverability** | High priority | Postmark: $150 |

**Estimate**: $90-200/month

**Notes**:
- 100k users * 5 emails/month = 500k emails
- SendGrid: $90/month (500k emails)
- Postmark: $150/month (500k emails, higher deliverability)
- Resend: $100/month (competitive pricing, good DX)

**Recommendation**: SendGrid for cost, Postmark for deliverability.

---

#### 8. Database Caching (Redis or Upstash)

**New Service at This Scale**

| Resource | Usage | Cost |
|----------|-------|------|
| **Service** | Upstash Redis or AWS ElastiCache | $30-100/month |
| **Memory** | 2-5 GB | Upstash: $30 |
| **Requests** | 10M/month | Included |

**Estimate**: $30-100/month

**Notes**:
- Cache frequently accessed data (user profiles, pet records)
- Reduce Supabase database load and costs
- Upstash: Serverless Redis, pay-per-request ($30/month for 5 GB)
- AWS ElastiCache: $50-100/month (fixed instance pricing)

**Recommendation**: Implement caching at 50k+ MAU to reduce database costs.

---

#### 9. Backup & Disaster Recovery

| Resource | Usage | Cost |
|----------|-------|------|
| **Supabase PITR** | Point-in-time recovery | Included in Team |
| **Multi-Region Replica** | Disaster recovery | $599/month (second region) |
| **Off-site Backups** | Daily snapshots to S3 | $20-50/month |

**Estimate**: $20-649/month

**Notes**:
- Supabase Team includes PITR
- Multi-region replica ($599) provides geographic redundancy
- S3 backups for additional safety net ($20-50/month)

**Recommendation**: PITR included in Team, add multi-region if critical SLA.

---

#### 10. Application Performance Monitoring (APM)

**New Service at This Scale**

| Resource | Usage | Cost |
|----------|-------|------|
| **Service** | Sentry or Datadog | $50-200/month |
| **Error Events** | 100k-500k/month | Sentry: $50 |
| **Performance Traces** | 50k-100k/month | Datadog: $200 |

**Estimate**: $50-200/month

**Notes**:
- Sentry: Error tracking ($50/month for 100k events)
- Datadog: Full APM ($200/month for 50k traces)
- Critical for debugging production issues at scale

**Recommendation**: Sentry for errors, evaluate Datadog if full APM needed.

---

### 100,000 Users: Total Monthly Cost

| Service | Conservative | Optimistic | Notes |
|---------|--------------|------------|-------|
| Vercel | $500 | $120 | Enterprise vs Pro + overages |
| EAS (Expo) | $799 | $29 | Enterprise vs Production |
| Supabase | $1,500 | $599 | Enterprise vs Team |
| Better Stack | $200 | $80 | Enterprise vs Business |
| GitHub | $475 | $120 | Enterprise vs Team (15 users) |
| CDN | $200 | $50 | Cloudflare vs Bunny.net |
| Email Service | $200 | $90 | Premium vs basic |
| Caching (Redis) | $100 | $30 | ElastiCache vs Upstash |
| Backup/DR | $649 | $20 | Multi-region vs S3 only |
| APM (Sentry/Datadog) | $200 | $50 | Datadog vs Sentry |
| Domain/DNS | $2 | $2 | Annual amortized |
| App Store Fees | $12 | $12 | Annual amortized |
| **TOTAL** | **$4,837/month** | **$1,202/month** | **Avg: $3,020/month** |

**Annual Cost**: $14,424-58,044

**Cost Per User**: $0.012-0.048/month (based on 100,000 total users)
**Cost Per MAU**: $0.024-0.097/month (based on 50,000 active users)

---

### 100,000 Users: Optimization Opportunities

1. **Negotiate Enterprise pricing** with Vercel, Supabase (save 20-30%)
2. **Use Bunny.net CDN** instead of Cloudflare Business (save $150/month)
3. **Implement aggressive caching** to reduce Supabase compute (save $100-200/month)
4. **Archive old data** to cheaper storage (S3 Glacier) (save $50-100/month)
5. **Optimize database queries** and implement read replicas (save $100-200/month)
6. **Use SendGrid** instead of Postmark (save $60/month)
7. **Stay on Production EAS** unless SLA requires Enterprise (save $770/month)

**Potential Savings**: $1,230-1,680/month with optimizations

---

## Cost Optimization Strategies

### 1. Database Optimization

**Problem**: Database is the most expensive component at scale.

**Solutions**:
- **Indexing**: Proper indexes reduce query time and compute costs
- **Partitioning**: Split large tables by date (e.g., monthly partitions)
- **Archiving**: Move old data to S3 Glacier (99% cost reduction)
- **Read Replicas**: Distribute read load across replicas (Supabase Team plan)
- **Connection Pooling**: Reduce connection overhead (Supabase built-in)

**Impact**: Reduce database costs by 30-50% at 100k+ users

---

### 2. Bandwidth Optimization

**Problem**: Bandwidth costs increase linearly with users.

**Solutions**:
- **CDN Offloading**: Serve static assets from CDN, not Supabase (save $100-200/month)
- **Image Optimization**: Compress images, use modern formats (WebP, AVIF)
- **Lazy Loading**: Load images on-demand, not upfront
- **Caching**: Cache API responses client-side (reduce repeat requests)
- **GraphQL**: Fetch only needed fields (reduce payload size)

**Impact**: Reduce bandwidth costs by 40-60% at 10k+ users

---

### 3. Compute Optimization

**Problem**: Serverless functions can get expensive with high invocation counts.

**Solutions**:
- **Batch Operations**: Combine multiple operations into one function call
- **Edge Caching**: Use Vercel Edge caching to reduce function invocations
- **Background Jobs**: Move non-critical work to async jobs (cheaper)
- **Database Functions**: Use Postgres functions instead of Edge Functions for data operations

**Impact**: Reduce compute costs by 20-40% at 10k+ users

---

### 4. Monitoring Cost Control

**Problem**: Log volume grows faster than user base (10x users = 20x logs).

**Solutions**:
- **Log Sampling**: Sample 10-20% of successful requests (keep all errors)
- **Structured Logging**: Use structured logs for efficient storage/querying
- **Retention Policies**: Keep 7-day for debugging, 90-day for compliance
- **Alert Deduplication**: Reduce noise from duplicate alerts

**Impact**: Reduce monitoring costs by 50-70% at 10k+ users

---

### 5. Service Consolidation

**Problem**: Multiple services increase overhead and costs.

**Solutions**:
- **Supabase Storage**: Use Supabase Storage instead of separate S3 (included)
- **Supabase Auth**: Use built-in auth instead of Auth0/Firebase (included)
- **Better Stack**: One platform for logs + errors + metrics (vs 3 separate services)

**Impact**: Save $50-150/month by consolidating services

---

### 6. Free Tier Maximization

**Strategy**: Use free tiers as long as possible, upgrade only when necessary.

**Free Tiers to Leverage**:
- **Vercel Hobby**: Free web hosting for non-commercial projects
- **GitHub Free**: Unlimited public repos, 2,000 Actions minutes
- **Better Stack Free**: 1 GB logs, 3-day retention
- **Cloudflare Free**: Unlimited bandwidth, basic DDoS protection
- **Supabase Free**: 500 MB database, 1 GB bandwidth (dev/staging only)

**Impact**: Save $60-120/month in early stages (1-6 months)

---

### 7. Reserved Capacity & Annual Billing

**Strategy**: Commit to annual plans for discounts (10-20% savings).

**Services Offering Discounts**:
- **Supabase**: 20% off annual billing
- **Vercel**: 15% off annual billing
- **Better Stack**: 20% off annual billing

**Impact**: Save $200-600/year at 10k+ users

---

## Scaling Triggers

### When to Upgrade Services

#### Vercel: Hobby → Pro
**Trigger**: Any of:
- Need custom domain
- Team collaboration required
- Analytics and insights needed
- Revenue exceeds $500/month (hobby plan TOS)

**Cost Impact**: +$20/month

---

#### Supabase: Free → Pro
**Trigger**: Any of:
- Database exceeds 500 MB
- Bandwidth exceeds 1 GB
- Need production SLA (99.9% uptime)
- Ready to launch to users

**Cost Impact**: +$25/month

**Action**: Launch directly on Pro (don't risk free tier downtime)

---

#### Supabase: Pro → Team
**Trigger**: Any of:
- Database exceeds 8 GB
- Bandwidth exceeds 250 GB
- Need dedicated compute (consistent performance)
- Need Point-in-Time Recovery (PITR)
- 10,000+ users

**Cost Impact**: +$574/month (Pro $25 → Team $599)

**Action**: Upgrade when bandwidth overages exceed $100/month

---

#### Better Stack: Free → Starter
**Trigger**: Any of:
- Log volume exceeds 1 GB/month
- Need 14-day retention (vs 3-day)
- Need custom alerts
- Need Slack integration

**Cost Impact**: +$10/month

---

#### Better Stack: Starter → Professional
**Trigger**: Any of:
- Log volume exceeds 15 GB/month
- Need 30-day retention
- Need custom dashboards
- 10,000+ users

**Cost Impact**: +$20/month (Starter $10 → Professional $30)

---

#### Add CDN Service
**Trigger**: Any of:
- Supabase bandwidth exceeds 100 GB/month
- Page load times exceed 2 seconds
- 5,000+ users

**Cost Impact**: +$10-20/month

**ROI**: Saves $20-50/month in Supabase bandwidth costs

---

#### Add Caching Layer (Redis)
**Trigger**: Any of:
- Database queries exceed 10M/month
- Database response time exceeds 100ms
- 50,000+ users

**Cost Impact**: +$30-100/month

**ROI**: Saves $50-200/month in Supabase compute costs

---

#### Add Email Service
**Trigger**: Any of:
- Email volume exceeds 10,000/month
- Need custom templates
- Deliverability issues with Supabase email
- 5,000+ users

**Cost Impact**: +$15-30/month

---

## Budget Monitoring

### Cost Tracking Dashboard

**Metrics to Monitor**:

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| **Total Monthly Cost** | $89 (1k users) | >$120/month |
| **Cost Per MAU** | $0.13 | >$0.20 |
| **Database Size** | <8 GB (Pro limit) | >7 GB |
| **Bandwidth** | <250 GB (Pro limit) | >200 GB |
| **Log Volume** | <1 GB (free tier) | >0.8 GB |
| **API Requests** | <2M (free tier) | >1.5M |

---

### Monthly Review Checklist

**Week 1 of Month**:
- [ ] Review previous month's costs (all services)
- [ ] Identify cost spikes or anomalies
- [ ] Check usage against limits (approaching overages?)
- [ ] Review cost per MAU trend
- [ ] Update projections if user growth changes

**Actions**:
- Optimize if cost per MAU exceeds target
- Upgrade if nearing service limits (avoid downtime)
- Downgrade if consistently under limits (save money)

---

### Budget Alerts

**Set Up Alerts**:

1. **Supabase**: Alert at 80% of bandwidth limit (200 GB)
2. **Vercel**: Alert at 80% of bandwidth limit (800 GB)
3. **Better Stack**: Alert at 80% of log volume (0.8 GB)
4. **GitHub Actions**: Alert at 80% of minutes (1,600 min)

**Notification Channels**:
- Email: isabel@petforce.app
- Slack: #infrastructure-alerts
- PagerDuty: Critical cost overruns

---

### Cost Attribution

**Tag Resources by**:
- **Environment**: production, staging, development
- **Service**: web, mobile, api, database
- **Feature**: auth, pets, health-records
- **Team**: engineering, product, design

**Benefits**:
- Identify which features cost the most
- Optimize high-cost features
- Justify infrastructure spend to leadership

---

## Risk Analysis

### Risk 1: Unexpected Traffic Spike

**Scenario**: Product Hunt launch, viral post → 10x traffic in 24 hours

**Cost Impact**: +$200-500 for that month (bandwidth, compute)

**Mitigation**:
- Set hard limits on Supabase (max connections, max bandwidth)
- Enable rate limiting (protect against abuse)
- Pre-purchase bandwidth if launch is planned
- Have emergency scaling budget ($500)

**Probability**: Medium (20% chance in first year)
**Severity**: Low (one-time cost, manageable)

---

### Risk 2: Database Growth Faster Than Expected

**Scenario**: Users upload more photos than projected → 3x database growth

**Cost Impact**: +$50-200/month (database overages or early Team plan upgrade)

**Mitigation**:
- Implement storage limits per user (e.g., 100 MB free, $1/mo for 1 GB)
- Compress images aggressively (WebP, 80% quality)
- Archive old data to S3 Glacier
- Monitor database growth weekly

**Probability**: Medium (30% chance if photo features are popular)
**Severity**: Medium (recurring cost, requires optimization)

---

### Risk 3: Third-Party Price Increases

**Scenario**: Supabase, Vercel, or other services raise prices by 20-50%

**Cost Impact**: +$20-100/month depending on scale

**Mitigation**:
- Lock in annual pricing when possible (12-month commitment)
- Build pricing escalation into budget (10% buffer)
- Have migration plan for critical services (e.g., self-hosted Postgres)
- Diversify services (don't lock into single vendor)

**Probability**: Low (10% chance per year)
**Severity**: Medium (recurring cost increase)

---

### Risk 4: Service Outages or Data Loss

**Scenario**: Supabase outage or data loss → need to restore from backups

**Cost Impact**: $0 (covered by SLA) but potential downtime cost

**Mitigation**:
- Use Supabase Pro/Team for 99.9% SLA
- Implement Point-in-Time Recovery (PITR) at 10k+ users
- Maintain off-site backups (S3)
- Test disaster recovery procedures quarterly

**Probability**: Very Low (<5% with Pro/Team plan)
**Severity**: High (downtime impacts pet families)

---

### Risk 5: Underestimating Active User Ratio

**Scenario**: 80% of users are active (vs projected 50-70%)

**Cost Impact**: +30-50% on infrastructure costs

**Mitigation**:
- Monitor Monthly Active Users (MAU) closely
- Adjust projections quarterly based on actual data
- Build engagement assumptions into budget (conservative: 70% MAU)

**Probability**: Medium (30% if product is very engaging)
**Severity**: Medium (higher costs but indicates product-market fit)

---

## Appendix: Detailed Calculations

### Database Size Calculation

**Per User Data Footprint**:
- User profile: 5 KB
- Pet records (2-3 pets): 15 KB
- Health records (12/year): 30 KB (future)
- Photo metadata (12/year): 5 KB (future)
- Total: ~55 KB per user

**Projections**:
- 1,000 users: 55 MB
- 10,000 users: 550 MB
- 100,000 users: 5.5 GB

**Note**: Actual usage may be higher due to indexes, audit logs, sessions.

---

### Bandwidth Calculation

**Per MAU Bandwidth**:
- API requests: 400-600 req/month * 5 KB avg = 2-3 MB
- Image loading: 10-20 images * 200 KB avg = 2-4 MB (future)
- App assets (cached): 5 MB (one-time per device)
- Total: ~10-15 MB per MAU

**Projections**:
- 700 MAU (1k users): 7-10 GB
- 6,000 MAU (10k users): 60-90 GB
- 50,000 MAU (100k users): 500-750 GB

**Note**: CDN reduces Supabase bandwidth by 60-80% at scale.

---

### Log Volume Calculation

**Per MAU Log Volume**:
- API requests: 400 req * 2 KB avg = 800 KB
- Error logs: 5 errors * 10 KB avg = 50 KB
- Metrics: 100 events * 1 KB avg = 100 KB
- Total: ~1 MB per MAU

**Projections**:
- 700 MAU (1k users): 0.7 GB
- 6,000 MAU (10k users): 6 GB
- 50,000 MAU (100k users): 50 GB

**Note**: Log sampling reduces volume by 50-70% for successful requests.

---

### Email Volume Calculation

**Per User Emails per Month**:
- Registration confirmation: 1 (one-time)
- Password reset: 0.1 (10% of users per month)
- Weekly digest: 4 (if enabled)
- Notifications: 1-2 (future)
- Total: 5-7 emails per user per month

**Projections**:
- 1,000 users: 5,000-7,000 emails/month
- 10,000 users: 50,000-70,000 emails/month
- 100,000 users: 500,000-700,000 emails/month

---

### Cost Per User Benchmarks

**Industry Benchmarks (SaaS Apps)**:
- Early Stage (<1k users): $0.10-0.50 per user/month
- Growth Stage (1k-10k users): $0.05-0.20 per user/month
- Scale Stage (10k-100k users): $0.02-0.10 per user/month

**PetForce Projections**:
- 1,000 users: $0.07-0.11 per user/month ✅ (within benchmark)
- 10,000 users: $0.015-0.036 per user/month ✅ (below benchmark)
- 100,000 users: $0.012-0.048 per user/month ✅ (within benchmark)

**Conclusion**: PetForce infrastructure costs are competitive and scalable.

---

## Summary & Recommendations

### Key Takeaways

1. **Infrastructure costs scale efficiently**: Cost per user decreases as user base grows
2. **Early stage is affordable**: $68-110/month for first 1,000 users
3. **Growth stage requires investment**: $150-363/month for 10,000 users
4. **Scale requires optimization**: $1,202-4,837/month for 100,000 users (wide range based on optimization)

### Optimization Priorities

**Phase 1 (1-1,000 users)**:
- Start with free tiers (Vercel Hobby, Better Stack Free, GitHub Free)
- Upgrade to Supabase Pro for launch (reliability non-negotiable)
- Monitor usage to avoid unexpected overages

**Phase 2 (1,000-10,000 users)**:
- Add CDN to reduce bandwidth costs
- Implement caching for frequently accessed data
- Switch to dedicated email service for deliverability
- Optimize database queries and indexes

**Phase 3 (10,000-100,000 users)**:
- Upgrade to Supabase Team for unlimited bandwidth
- Negotiate enterprise pricing with vendors (20-30% savings)
- Implement database archiving and partitioning
- Add Redis caching layer for high-traffic endpoints
- Consider multi-region for disaster recovery

### Budget Recommendations

**Year 1 Budget** (0-1,000 users):
- **Conservative**: $1,320/year ($110/month average)
- **Optimistic**: $816/year ($68/month average)
- **Recommended Budget**: $1,200/year with $500 emergency fund

**Year 2 Budget** (1,000-10,000 users):
- **Conservative**: $4,356/year ($363/month average)
- **Optimistic**: $1,800/year ($150/month average)
- **Recommended Budget**: $3,000/year with $1,000 optimization fund

**Year 3 Budget** (10,000-100,000 users):
- **Conservative**: $58,044/year ($4,837/month average)
- **Optimistic**: $14,424/year ($1,202/month average)
- **Recommended Budget**: $30,000/year with $5,000 optimization fund

---

**Document Maintained By**: Isabel (Infrastructure)
**Next Review**: Quarterly or when user base crosses scaling threshold (1k, 10k, 100k)
**Contact**: isabel@petforce.app

---

**Changelog**:
- **2026-01-25**: Initial version (1.0) - Isabel
