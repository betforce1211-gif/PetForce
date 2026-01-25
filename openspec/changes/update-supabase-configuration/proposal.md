# Proposal: Update Supabase Configuration

## Why

Supabase is deprecating the legacy `anon` and `service_role` keys in favor of new **publishable keys** (`sb_publishable_...`) and **secret keys** (`sb_secret_...`). The new system offers better security, instant revocation, and zero-downtime rotation capabilities.

Additionally, the current setup requires developers to manually paste SQL into Supabase Studio to create or modify database tables. This creates friction in development and doesn't align with our "simplicity above all" philosophy.

## What Changes

### 1. Migrate to New Supabase Key System

**Current State:**
- Uses legacy `SUPABASE_ANON_KEY`
- Uses legacy `SUPABASE_SERVICE_ROLE_KEY`
- These will be removed by late 2026

**New State:**
- Use `SUPABASE_PUBLISHABLE_KEY` (format: `sb_publishable_...`) for client-side operations
- Use `SUPABASE_SECRET_KEY` (format: `sb_secret_...`) for backend operations
- Update all code to use new keys
- Support both legacy and new keys during transition

### 2. Add Database Management API

**Current State:**
- Developers must copy SQL from migrations and paste into Supabase Studio
- Manual table creation/modification
- No programmatic database management

**New State:**
- TypeScript API for database management
- Create, modify, drop tables via code
- Apply migrations programmatically
- Inspect database schema
- Seed data for development

**Example Usage:**
```typescript
import { DatabaseManager } from '@petforce/supabase';

const db = new DatabaseManager(supabaseUrl, secretKey);

// Create a table
await db.createTable('pets', {
  id: { type: 'uuid', primaryKey: true, default: 'uuid_generate_v4()' },
  name: { type: 'varchar', length: 100, notNull: true },
  species: { type: 'varchar', length: 50 },
  owner_id: { type: 'uuid', references: 'users(id)' },
  created_at: { type: 'timestamp', default: 'now()' }
});

// Add a column
await db.addColumn('pets', 'breed', { type: 'varchar', length: 100 });

// Apply migration file
await db.applyMigration('./supabase/migrations/20260121_add_pets.sql');
```

## Summary

Update PetForce to use Supabase's new authentication key system and add a database management API for programmatic schema management, eliminating manual SQL pasting and future-proofing against the 2026 key deprecation.

## Problem Statement

1. **Key Deprecation**: Supabase is removing legacy `anon` and `service_role` keys by late 2026
2. **Security Improvements**: New key system offers better security features (instant revocation, rotation)
3. **Development Friction**: Manual SQL pasting slows development and is error-prone
4. **Schema Management**: No programmatic way to manage database schema

## Goals

### Primary Goals
1. **Future-Proof Keys**: Migrate to new `publishable` and `secret` key system
2. **Backward Compatible**: Support legacy keys during transition period
3. **Developer Ergonomics**: Enable database management via TypeScript API
4. **Migration Safety**: Provide tools to apply and rollback migrations programmatically

### Success Metrics
- All code uses new publishable/secret keys
- Zero manual SQL pasting required
- Database schema manageable via API
- Migration system works reliably

## Proposed Solution

### Part 1: Key System Migration

#### Update Environment Variables

**Replace:**
```bash
SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_ROLE_KEY=eyJh...
```

**With:**
```bash
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...

# Optional: Keep legacy keys for backward compatibility
SUPABASE_ANON_KEY=eyJh...          # (deprecated, fallback)
SUPABASE_SERVICE_ROLE_KEY=eyJh...  # (deprecated, fallback)
```

#### Update Supabase Client

**Client-Side (Web/Mobile):**
- Use `SUPABASE_PUBLISHABLE_KEY`
- Safe for public exposure
- For auth, data queries with RLS

**Server-Side (Edge Functions/Backend):**
- Use `SUPABASE_SECRET_KEY`
- Never expose in client code
- For admin operations, bypassing RLS

#### Detection and Fallback

Automatically detect key format:
```typescript
function getSupabaseKey(publishableKey?: string, legacyAnonKey?: string): string {
  // Prefer new publishable key
  if (publishableKey && publishableKey.startsWith('sb_publishable_')) {
    return publishableKey;
  }

  // Fallback to legacy key
  if (legacyAnonKey) {
    console.warn('Using legacy anon key. Please migrate to publishable key.');
    return legacyAnonKey;
  }

  throw new Error('No valid Supabase key found');
}
```

### Part 2: Database Management API

#### DatabaseManager Class

Create `@petforce/supabase` package with:

```typescript
class DatabaseManager {
  constructor(supabaseUrl: string, secretKey: string);

  // Table operations
  createTable(name: string, schema: TableSchema): Promise<void>;
  dropTable(name: string, cascade?: boolean): Promise<void>;
  alterTable(name: string, changes: TableChanges): Promise<void>;

  // Column operations
  addColumn(table: string, column: string, definition: ColumnDef): Promise<void>;
  dropColumn(table: string, column: string): Promise<void>;
  modifyColumn(table: string, column: string, definition: ColumnDef): Promise<void>;

  // Index operations
  createIndex(table: string, columns: string[], options?: IndexOptions): Promise<void>;
  dropIndex(name: string): Promise<void>;

  // Migration operations
  applyMigration(filePath: string): Promise<void>;
  rollbackMigration(version: string): Promise<void>;
  getMigrationHistory(): Promise<Migration[]>;

  // Inspection
  getTables(): Promise<TableInfo[]>;
  getTableSchema(name: string): Promise<TableSchema>;
  getColumns(table: string): Promise<ColumnInfo[]>;
}
```

#### Migration Runner

```typescript
class MigrationRunner {
  constructor(db: DatabaseManager);

  // Run all pending migrations
  runPending(): Promise<MigrationResult[]>;

  // Run specific migration
  runMigration(file: string): Promise<MigrationResult>;

  // Rollback last migration
  rollback(steps?: number): Promise<void>;

  // Generate migration from schema changes
  generateMigration(name: string): Promise<string>;
}
```

#### CLI Tool

```bash
# Apply all pending migrations
npm run db:migrate

# Create new migration
npm run db:migrate:new add_pets_table

# Rollback last migration
npm run db:migrate:rollback

# View migration status
npm run db:migrate:status

# Generate TypeScript types from schema
npm run db:types
```

## Scope

### In Scope

**Key Migration:**
- Update environment variable names
- Update Supabase client initialization
- Support both legacy and new keys (transition period)
- Update documentation with new keys
- Detect key format automatically

**Database Management API:**
- `@petforce/supabase` package
- DatabaseManager class
- Migration runner
- CLI commands
- TypeScript types generation
- Development seed data tools

### Out of Scope (Future Enhancements)

- GUI for database management (use Supabase Studio)
- Advanced migration features (branching, squashing)
- Database backup/restore via API
- Multi-database support
- Schema diffing and automatic migration generation

## Impact Assessment

### Capabilities Affected

- **NEW**: `database-management` - New capability spec
- **MODIFIED**: `software-engineering` - Add database management patterns
- **MODIFIED**: `infrastructure` - Update Supabase configuration

### Files to Update

**Environment Variables:**
- `.env.example`
- `apps/web/.env.example`
- `README.md`
- `GETTING-STARTED.md`

**Code:**
- `packages/auth/src/api/supabase-client.ts`
- `apps/web/src/App.tsx`
- Create: `packages/supabase/` (new package)

**Documentation:**
- Update all references to `ANON_KEY` → `PUBLISHABLE_KEY`
- Add database management guide
- Update setup instructions

### Teams Involved

- **Engrid (Software Engineering)**: Database API implementation
- **Isabel (Infrastructure)**: Supabase configuration, key management
- **Tucker (QA)**: Testing database operations
- **Thomas (Documentation)**: Update setup guides
- **Samantha (Security)**: Review secret key handling

### Dependencies

- Supabase CLI (for local key generation)
- Supabase Management API
- PostgreSQL client library (pg)

### Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Legacy keys stop working early | High | Support both key systems during transition |
| Database API has bugs | High | Comprehensive testing, dry-run mode for migrations |
| Secret key exposed | Critical | Clear documentation, validation to prevent client-side use |
| Migration conflicts | Medium | Transaction-based migrations, rollback capability |

## Alternatives Considered

### Alternative 1: Keep Legacy Keys Until 2026
**Pros**: No immediate work needed
**Cons**: Forced migration later, miss security improvements
**Decision**: Rejected - migrate now proactively

### Alternative 2: Use Supabase CLI Only
**Pros**: Official tool, well-tested
**Cons**: Not programmatic, requires manual steps
**Decision**: Rejected - doesn't solve development friction

### Alternative 3: Use Prisma or TypeORM
**Pros**: Mature ORMs with migration support
**Cons**: Adds dependency, abstracts away Supabase features
**Decision**: Rejected - keep Supabase-native approach

### Alternative 4: Manual SQL Forever
**Pros**: Simple, direct control
**Cons**: Error-prone, slow, doesn't scale
**Decision**: Rejected - violates simplicity principle

## Open Questions

1. **Key Transition Period**: How long to support legacy keys?
   - *Recommendation*: Until late 2026 (when Supabase removes them)

2. **Database API Safety**: Require confirmation for destructive operations?
   - *Recommendation*: Yes, add `--force` flag for drop/truncate operations

3. **Migration Format**: SQL files or TypeScript?
   - *Recommendation*: Support both - SQL for simplicity, TypeScript for complex logic

4. **Error Handling**: What if migration fails mid-way?
   - *Recommendation*: Run in transactions, automatic rollback on error

5. **Type Generation**: Auto-generate after every migration?
   - *Recommendation*: Yes, with option to disable for performance

## Success Criteria

### Must Have (Launch Blockers)
- [ ] New publishable/secret keys supported
- [ ] Legacy keys still work (backward compatibility)
- [ ] DatabaseManager can create tables
- [ ] DatabaseManager can apply SQL migrations
- [ ] DatabaseManager can generate types
- [ ] CLI commands for common operations
- [ ] Secret key validation (prevent client-side use)
- [ ] Documentation updated

### Should Have (Post-Launch OK)
- [ ] Migration rollback functionality
- [ ] Schema inspection API
- [ ] Seed data management
- [ ] Migration history tracking
- [ ] Dry-run mode for migrations

### Nice to Have (Future)
- [ ] Visual schema builder
- [ ] Automatic migration generation from diffs
- [ ] Database branching support
- [ ] Performance monitoring

## Alignment with Product Philosophy

This proposal embodies PetForce's core philosophy:

✅ **Simplicity**: Eliminate manual SQL pasting, use TypeScript API
✅ **Reliability**: Transaction-based migrations, rollback on error
✅ **Proactive**: Migrate keys before forced deprecation
✅ **Developer-Friendly**: Programmatic database management

---

**Proposed Change ID**: `update-supabase-configuration`

**Proposal Author**: Engrid (Software Engineering) & Isabel (Infrastructure)

**Date**: 2026-01-21

**Status**: Proposed - Awaiting Approval
