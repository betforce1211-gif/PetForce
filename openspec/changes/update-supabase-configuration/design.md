# Design: Update Supabase Configuration & Database Management

## Overview

This document details the technical design for migrating to Supabase's new key system and implementing a database management API for programmatic schema management.

## Architecture Principles

- **Backward Compatible**: Support legacy keys during transition
- **Fail-Safe**: Transactions and rollback for all destructive operations
- **Type-Safe**: Generate TypeScript types from schema
- **Simple**: Hide complexity, expose clean API

## Part 1: Key System Migration

### Current vs New Key System

```
┌─────────────────────────────────────────────────────────────┐
│                    LEGACY SYSTEM                             │
├─────────────────────────────────────────────────────────────┤
│  anon key           → Client-side (public)                   │
│  service_role key   → Server-side (private)                  │
│                                                              │
│  Issues:                                                     │
│  - Long, hard-to-distinguish keys                          │
│  - No instant revocation                                    │
│  - Single service_role key (no rotation)                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     NEW SYSTEM                               │
├─────────────────────────────────────────────────────────────┤
│  sb_publishable_... → Client-side (public)                   │
│  sb_secret_...      → Server-side (private)                  │
│                                                              │
│  Benefits:                                                   │
│  - Clear naming (publishable vs secret)                     │
│  - Instant revocation                                       │
│  - Multiple secret keys (rotation)                          │
│  - Browser enforcement (secrets fail with 401)              │
└─────────────────────────────────────────────────────────────┘
```

### Key Detection Logic

```typescript
interface SupabaseKeys {
  publishableKey?: string;  // New: sb_publishable_...
  secretKey?: string;        // New: sb_secret_...
  anonKey?: string;          // Legacy: eyJh...
  serviceRoleKey?: string;   // Legacy: eyJh...
}

function getClientKey(keys: SupabaseKeys): string {
  // 1. Try new publishable key
  if (keys.publishableKey?.startsWith('sb_publishable_')) {
    return keys.publishableKey;
  }

  // 2. Fallback to legacy anon key
  if (keys.anonKey) {
    console.warn('⚠️  Using legacy anon key. Migrate to publishable key by 2026.');
    return keys.anonKey;
  }

  throw new Error('No valid client key found');
}

function getServerKey(keys: SupabaseKeys): string {
  // 1. Try new secret key
  if (keys.secretKey?.startsWith('sb_secret_')) {
    return keys.secretKey;
  }

  // 2. Fallback to legacy service_role key
  if (keys.serviceRoleKey) {
    console.warn('⚠️  Using legacy service_role key. Migrate to secret key by 2026.');
    return keys.serviceRoleKey;
  }

  throw new Error('No valid server key found');
}
```

### Updated Supabase Client

```typescript
// packages/auth/src/api/supabase-client.ts

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let clientInstance: SupabaseClient | null = null;
let adminInstance: SupabaseClient | null = null;

/**
 * Create public client (for browser/mobile)
 * Uses publishable key (or legacy anon key as fallback)
 */
export function createSupabaseClient(
  supabaseUrl: string,
  publishableKey: string,  // New parameter name
  legacyAnonKey?: string    // Optional fallback
): SupabaseClient {
  if (!clientInstance) {
    const key = getClientKey({ publishableKey, anonKey: legacyAnonKey });

    clientInstance = createClient(supabaseUrl, key, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }

  return clientInstance;
}

/**
 * Create admin client (for server-side only)
 * Uses secret key (or legacy service_role key as fallback)
 *
 * ⚠️  WARNING: Never use in browser! Will fail with 401.
 */
export function createSupabaseAdminClient(
  supabaseUrl: string,
  secretKey: string,          // New parameter name
  legacyServiceRoleKey?: string // Optional fallback
): SupabaseClient {
  // Prevent browser usage
  if (typeof window !== 'undefined') {
    throw new Error('Admin client cannot be used in browser. Use createSupabaseClient instead.');
  }

  if (!adminInstance) {
    const key = getServerKey({ secretKey, serviceRoleKey: legacyServiceRoleKey });

    adminInstance = createClient(supabaseUrl, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminInstance;
}

export function getSupabaseClient(): SupabaseClient {
  if (!clientInstance) {
    throw new Error('Supabase client not initialized');
  }
  return clientInstance;
}

export function getSupabaseAdminClient(): SupabaseClient {
  if (!adminInstance) {
    throw new Error('Supabase admin client not initialized');
  }
  return adminInstance;
}
```

### Environment Variables Update

```bash
# .env.example (NEW)

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co

# Client Key (safe for public exposure)
SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here

# Server Key (private, server-side only)
SUPABASE_SECRET_KEY=sb_secret_your_key_here

# Legacy Keys (deprecated, for backward compatibility)
# Remove these after migrating to new keys
# SUPABASE_ANON_KEY=eyJh...
# SUPABASE_SERVICE_ROLE_KEY=eyJh...

# Database (for direct connections)
DATABASE_URL=postgresql://postgres:password@localhost:54322/postgres
```

## Part 2: Database Management API

### Package Structure

```
packages/supabase/
├── src/
│   ├── index.ts                    # Main exports
│   ├── database-manager.ts         # DatabaseManager class
│   ├── migration-runner.ts         # MigrationRunner class
│   ├── schema-builder.ts           # SQL generation
│   ├── type-generator.ts           # TypeScript type generation
│   ├── cli.ts                      # CLI commands
│   └── types/
│       ├── schema.ts               # Schema definition types
│       ├── migration.ts            # Migration types
│       └── database.ts             # Database info types
├── templates/
│   └── migration.sql.template      # Migration template
├── package.json
└── tsconfig.json
```

### DatabaseManager Class

```typescript
// packages/supabase/src/database-manager.ts

import { SupabaseClient } from '@supabase/supabase-js';
import type { TableSchema, ColumnDef, TableChanges, IndexOptions } from './types/schema';

export class DatabaseManager {
  private supabase: SupabaseClient;
  private dryRun: boolean;

  constructor(supabaseUrl: string, secretKey: string, options?: {
    dryRun?: boolean;
  }) {
    // Must use secret key for admin operations
    this.supabase = createClient(supabaseUrl, secretKey);
    this.dryRun = options?.dryRun || false;
  }

  /**
   * Create a new table
   * Runs in transaction, auto-rollback on error
   */
  async createTable(name: string, schema: TableSchema): Promise<void> {
    const sql = this.buildCreateTableSQL(name, schema);

    if (this.dryRun) {
      console.log('[DRY RUN]', sql);
      return;
    }

    const { error } = await this.supabase.rpc('exec_sql', { sql });
    if (error) throw new Error(`Failed to create table: ${error.message}`);
  }

  /**
   * Drop a table
   * Requires --force flag in production
   */
  async dropTable(name: string, options?: {
    cascade?: boolean;
    force?: boolean;
  }): Promise<void> {
    if (!options?.force && process.env.NODE_ENV === 'production') {
      throw new Error('Cannot drop table in production without --force flag');
    }

    const cascade = options?.cascade ? ' CASCADE' : '';
    const sql = `DROP TABLE IF EXISTS ${name}${cascade};`;

    if (this.dryRun) {
      console.log('[DRY RUN]', sql);
      return;
    }

    const { error } = await this.supabase.rpc('exec_sql', { sql });
    if (error) throw new Error(`Failed to drop table: ${error.message}`);
  }

  /**
   * Add a column to existing table
   */
  async addColumn(
    table: string,
    column: string,
    definition: ColumnDef
  ): Promise<void> {
    const sql = this.buildAddColumnSQL(table, column, definition);

    if (this.dryRun) {
      console.log('[DRY RUN]', sql);
      return;
    }

    const { error } = await this.supabase.rpc('exec_sql', { sql });
    if (error) throw new Error(`Failed to add column: ${error.message}`);
  }

  /**
   * Apply SQL migration file
   */
  async applyMigration(filePath: string): Promise<void> {
    const sql = await fs.readFile(filePath, 'utf-8');

    if (this.dryRun) {
      console.log('[DRY RUN] Applying migration:', filePath);
      console.log(sql);
      return;
    }

    // Run in transaction
    const { error } = await this.supabase.rpc('exec_sql', { sql });
    if (error) throw new Error(`Migration failed: ${error.message}`);

    // Record migration
    await this.recordMigration(filePath);
  }

  /**
   * Get all tables
   */
  async getTables(): Promise<TableInfo[]> {
    const { data, error } = await this.supabase
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_schema', 'public');

    if (error) throw new Error(`Failed to get tables: ${error.message}`);
    return data;
  }

  /**
   * Get table schema
   */
  async getTableSchema(name: string): Promise<TableSchema> {
    const { data, error } = await this.supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', name)
      .eq('table_schema', 'public');

    if (error) throw new Error(`Failed to get schema: ${error.message}`);
    return this.parseSchemaInfo(data);
  }

  // Private helper methods
  private buildCreateTableSQL(name: string, schema: TableSchema): string {
    // Generate CREATE TABLE SQL from schema object
    // Include columns, constraints, indexes
    // ...
  }

  private buildAddColumnSQL(
    table: string,
    column: string,
    definition: ColumnDef
  ): string {
    // Generate ALTER TABLE ADD COLUMN SQL
    // ...
  }

  private async recordMigration(filePath: string): Promise<void> {
    // Record in migrations table
    // ...
  }

  private parseSchemaInfo(columns: any[]): TableSchema {
    // Convert database schema to TableSchema type
    // ...
  }
}
```

### Migration Runner

```typescript
// packages/supabase/src/migration-runner.ts

import { DatabaseManager } from './database-manager';
import type { MigrationResult, Migration } from './types/migration';

export class MigrationRunner {
  constructor(
    private db: DatabaseManager,
    private migrationsDir: string = './supabase/migrations'
  ) {}

  /**
   * Run all pending migrations
   */
  async runPending(): Promise<MigrationResult[]> {
    const pending = await this.getPendingMigrations();
    const results: MigrationResult[] = [];

    for (const migration of pending) {
      console.log(`Running migration: ${migration.name}`);
      try {
        await this.db.applyMigration(migration.path);
        results.push({
          name: migration.name,
          status: 'success',
          timestamp: new Date(),
        });
      } catch (error) {
        results.push({
          name: migration.name,
          status: 'failed',
          error: error.message,
          timestamp: new Date(),
        });
        // Stop on first failure
        break;
      }
    }

    return results;
  }

  /**
   * Rollback last N migrations
   */
  async rollback(steps: number = 1): Promise<void> {
    const applied = await this.getAppliedMigrations();
    const toRollback = applied.slice(-steps);

    for (const migration of toRollback.reverse()) {
      console.log(`Rolling back: ${migration.name}`);
      await this.db.applyMigration(migration.downPath);
    }
  }

  /**
   * Get migration history
   */
  async getHistory(): Promise<Migration[]> {
    return this.getAppliedMigrations();
  }

  /**
   * Generate new migration file
   */
  async generateMigration(name: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
    const fileName = `${timestamp}_${name}.sql`;
    const filePath = path.join(this.migrationsDir, fileName);

    const template = await this.getMigrationTemplate();
    await fs.writeFile(filePath, template);

    return filePath;
  }

  private async getPendingMigrations(): Promise<Migration[]> {
    const all = await this.getAllMigrations();
    const applied = await this.getAppliedMigrations();
    const appliedNames = new Set(applied.map(m => m.name));

    return all.filter(m => !appliedNames.has(m.name));
  }

  private async getAllMigrations(): Promise<Migration[]> {
    // Read migration files from directory
    // ...
  }

  private async getAppliedMigrations(): Promise<Migration[]> {
    // Query migrations table
    // ...
  }

  private async getMigrationTemplate(): Promise<string> {
    // Load template file
    // ...
  }
}
```

### Type Generator

```typescript
// packages/supabase/src/type-generator.ts

export class TypeGenerator {
  constructor(private db: DatabaseManager) {}

  /**
   * Generate TypeScript types from database schema
   */
  async generateTypes(outputPath: string = './src/types/database.ts'): Promise<void> {
    const tables = await this.db.getTables();
    const types: string[] = [];

    // Generate Database interface
    types.push('export interface Database {');
    types.push('  public: {');
    types.push('    Tables: {');

    for (const table of tables) {
      const schema = await this.db.getTableSchema(table.name);
      types.push(`      ${table.name}: {`);
      types.push('        Row: {');

      for (const [column, def] of Object.entries(schema)) {
        const tsType = this.postgresTypeToTS(def.type);
        const optional = def.notNull ? '' : '?';
        types.push(`          ${column}${optional}: ${tsType};`);
      }

      types.push('        };');
      types.push('        Insert: {');
      // Generate Insert type (omit auto-generated fields)
      types.push('        };');
      types.push('        Update: {');
      // Generate Update type (all optional)
      types.push('        };');
      types.push('      };');
    }

    types.push('    };');
    types.push('  };');
    types.push('}');

    await fs.writeFile(outputPath, types.join('\n'));
    console.log(`✅ Types generated: ${outputPath}`);
  }

  private postgresTypeToTS(pgType: string): string {
    const typeMap: Record<string, string> = {
      'uuid': 'string',
      'varchar': 'string',
      'text': 'string',
      'integer': 'number',
      'bigint': 'number',
      'boolean': 'boolean',
      'timestamp': 'string',
      'timestamptz': 'string',
      'date': 'string',
      'json': 'any',
      'jsonb': 'any',
    };

    return typeMap[pgType] || 'unknown';
  }
}
```

### CLI Commands

```typescript
// packages/supabase/src/cli.ts

#!/usr/bin/env node

import { Command } from 'commander';
import { DatabaseManager } from './database-manager';
import { MigrationRunner } from './migration-runner';
import { TypeGenerator } from './type-generator';

const program = new Command();

program
  .name('petforce-db')
  .description('PetForce database management CLI')
  .version('0.1.0');

// Migrate command
program
  .command('migrate')
  .description('Run pending migrations')
  .option('--dry-run', 'Preview without applying')
  .action(async (options) => {
    const db = new DatabaseManager(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!,
      { dryRun: options.dryRun }
    );
    const runner = new MigrationRunner(db);
    const results = await runner.runPending();
    console.table(results);
  });

// Rollback command
program
  .command('rollback')
  .description('Rollback last migration')
  .option('-n, --steps <number>', 'Number of migrations to rollback', '1')
  .action(async (options) => {
    const db = new DatabaseManager(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );
    const runner = new MigrationRunner(db);
    await runner.rollback(parseInt(options.steps));
  });

// Generate migration
program
  .command('migrate:new <name>')
  .description('Create new migration file')
  .action(async (name) => {
    const db = new DatabaseManager(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );
    const runner = new MigrationRunner(db);
    const path = await runner.generateMigration(name);
    console.log(`✅ Created migration: ${path}`);
  });

// Generate types
program
  .command('types')
  .description('Generate TypeScript types from schema')
  .option('-o, --output <path>', 'Output file path')
  .action(async (options) => {
    const db = new DatabaseManager(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );
    const generator = new TypeGenerator(db);
    await generator.generateTypes(options.output);
  });

// Status command
program
  .command('migrate:status')
  .description('View migration history')
  .action(async () => {
    const db = new DatabaseManager(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );
    const runner = new MigrationRunner(db);
    const history = await runner.getHistory();
    console.table(history);
  });

program.parse();
```

### Package.json Scripts

```json
{
  "scripts": {
    "db:migrate": "petforce-db migrate",
    "db:migrate:new": "petforce-db migrate:new",
    "db:migrate:rollback": "petforce-db rollback",
    "db:migrate:status": "petforce-db migrate:status",
    "db:types": "petforce-db types",
    "db:seed": "tsx scripts/seed.ts"
  }
}
```

## Security Considerations

### Secret Key Protection

```typescript
// Validate secret key is not used in browser
if (typeof window !== 'undefined' && key.startsWith('sb_secret_')) {
  throw new Error(
    '🚨 SECURITY: Secret keys cannot be used in browser! ' +
    'Use publishable key instead.'
  );
}
```

### Migration Safety

```typescript
// Require confirmation for destructive operations in production
if (process.env.NODE_ENV === 'production' && !options.force) {
  throw new Error('Destructive operation requires --force in production');
}

// Run migrations in transactions
await this.supabase.rpc('begin_transaction');
try {
  await this.supabase.rpc('exec_sql', { sql });
  await this.supabase.rpc('commit_transaction');
} catch (error) {
  await this.supabase.rpc('rollback_transaction');
  throw error;
}
```

## Testing Strategy

### Unit Tests
- Key detection logic
- SQL generation from schema objects
- Type conversion (PostgreSQL → TypeScript)
- Migration file parsing

### Integration Tests
- Table creation/modification
- Migration application
- Rollback functionality
- Type generation accuracy

### Security Tests
- Secret key browser prevention
- Key validation
- SQL injection prevention

---

**Design Author**: Engrid (Software Engineering) & Isabel (Infrastructure)

**Date**: 2026-01-21

**Status**: Proposed
