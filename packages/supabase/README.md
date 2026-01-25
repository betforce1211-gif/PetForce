# @petforce/supabase

Database management tools and utilities for PetForce. Provides programmatic database operations, migration management, and TypeScript type generation.

## Features

- **Database Manager**: Create, modify, and drop tables via TypeScript API
- **Migration Runner**: Apply and rollback SQL migrations with tracking
- **Type Generator**: Auto-generate TypeScript types from PostgreSQL schema
- **CLI Tools**: Command-line interface for common operations

## Installation

This package is part of the PetForce monorepo. Install dependencies from the root:

```bash
npm install
```

## Quick Start

### Database Manager

```typescript
import { DatabaseManager } from '@petforce/supabase';

const db = new DatabaseManager(process.env.DATABASE_URL!);

// Create a table
await db.createTable('pets', {
  id: { type: 'uuid', primaryKey: true, default: 'uuid_generate_v4()' },
  name: { type: 'varchar', length: 100, notNull: true },
  species: { type: 'varchar', length: 50 },
  owner_id: { type: 'uuid', references: 'users(id)', onDelete: 'CASCADE' },
  created_at: { type: 'timestamptz', default: 'now()' }
});

// Add a column
await db.addColumn('pets', 'breed', {
  type: 'varchar',
  length: 100
});

// Create an index
await db.createIndex('pets', ['owner_id']);

// Close connection
await db.close();
```

### Migration Runner

```typescript
import { DatabaseManager, MigrationRunner } from '@petforce/supabase';

const db = new DatabaseManager(process.env.DATABASE_URL!);
const runner = new MigrationRunner(db, {
  migrationsDir: './supabase/migrations'
});

// Run all pending migrations
const results = await runner.runPending();

// Generate a new migration
const filepath = await runner.generateMigration('add_pets_table');

// Rollback last migration
await runner.rollback(1);

// View history
const history = await runner.getHistory();
```

### Type Generator

```typescript
import { DatabaseManager, TypeGenerator } from '@petforce/supabase';

const db = new DatabaseManager(process.env.DATABASE_URL!);
const generator = new TypeGenerator(db);

// Generate types from current schema
await generator.generateTypes('./src/types/database.ts');
```

## CLI Commands

Run from the root directory:

```bash
# Run all pending migrations
npm run db:migrate

# Create a new migration
npm run db:migrate:new add_pets_table

# View migration status
npm run db:migrate:status

# Rollback last migration (requires --force)
npm run db:migrate:rollback -- --force

# Rollback last 3 migrations
npm run db:migrate:rollback -- -n 3 --force

# Generate TypeScript types
npm run db:types

# Preview migrations without applying (dry-run)
npm run db:migrate -- --dry-run
```

## API Reference

### DatabaseManager

#### Constructor

```typescript
new DatabaseManager(connectionString: string, options?: { dryRun?: boolean })
```

#### Methods

**Table Operations**
- `createTable(name, schema, options?)` - Create a new table
- `dropTable(name, options?)` - Drop a table (requires `force: true`)
- `getTables()` - List all tables
- `getTableSchema(name)` - Get table schema definition
- `getColumns(table)` - Get column information

**Column Operations**
- `addColumn(table, column, definition)` - Add a column
- `dropColumn(table, column)` - Drop a column
- `modifyColumn(table, column, definition)` - Modify column type

**Index Operations**
- `createIndex(table, columns, options?)` - Create an index
- `dropIndex(name)` - Drop an index

**Migration Operations**
- `applyMigration(sql)` - Execute SQL migration

**Utility**
- `setDryRun(enabled)` - Enable/disable dry-run mode
- `close()` - Close database connection

### MigrationRunner

#### Constructor

```typescript
new MigrationRunner(db: DatabaseManager, options: {
  migrationsDir: string;
  tableName?: string;  // Default: "migrations"
  dryRun?: boolean;
})
```

#### Methods

- `runPending()` - Run all pending migrations
- `rollback(steps?)` - Rollback N migrations (default: 1)
- `getHistory()` - Get migration history
- `generateMigration(name)` - Create new migration file

### TypeGenerator

#### Constructor

```typescript
new TypeGenerator(db: DatabaseManager)
```

#### Methods

- `generateTypes(outputPath)` - Generate TypeScript types from schema

## Migration File Format

Migrations use the following format:

```sql
-- Migration: add_pets_table
-- Created: 2026-01-21
-- Version: 20260121133000

-- Up Migration
CREATE TABLE pets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_pets_owner ON pets(owner_id);

-- Down Migration (for rollback)
DROP TABLE pets;
```

## Generated Types Example

```typescript
export interface Database {
  public: {
    Tables: {
      pets: {
        Row: {
          id: string;
          name: string;
          owner_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          owner_id?: string | null;
          created_at?: string;
        };
      };
    };
  };
}

// Usage
import type { Database } from './types/database';

type Pet = Database['public']['Tables']['pets']['Row'];
type PetInsert = Database['public']['Tables']['pets']['Insert'];
```

## Configuration

### Environment Variables

Required environment variables:

```bash
# Database connection string (required for CLI and DatabaseManager)
DATABASE_URL=postgresql://postgres:password@localhost:54322/postgres

# Supabase configuration (optional, for direct Supabase client usage)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
```

### Directory Structure

```
project-root/
├── supabase/
│   └── migrations/          # Migration files go here
│       ├── 20260121000001_create_users.sql
│       └── 20260121000002_add_pets.sql
└── src/
    └── types/
        └── database.ts      # Generated types
```

## Type Mappings

PostgreSQL types are mapped to TypeScript as follows:

| PostgreSQL | TypeScript |
|------------|------------|
| `varchar`, `text`, `char` | `string` |
| `integer`, `bigint`, `smallint` | `number` |
| `decimal`, `numeric`, `real` | `number` |
| `boolean` | `boolean` |
| `uuid` | `string` |
| `timestamp`, `timestamptz`, `date` | `string` |
| `json`, `jsonb` | `Record<string, any>` |

## Safety Features

### Destructive Operation Protection

Dropping tables requires explicit confirmation:

```typescript
// This will throw an error
await db.dropTable('users');

// This will work
await db.dropTable('users', { force: true });
```

### Browser Prevention

DatabaseManager cannot be instantiated in browser environments:

```typescript
// In browser - throws error
const db = new DatabaseManager(connectionString);
// Error: CRITICAL SECURITY ERROR: DatabaseManager cannot be used in browser
```

### Transaction Support

All database operations run in transactions with automatic rollback on error.

### Dry-Run Mode

Preview operations without executing:

```typescript
const db = new DatabaseManager(connectionString, { dryRun: true });

// Returns SQL without executing
const result = await db.createTable('pets', schema);
console.log(result.sql); // Shows generated SQL
```

## Development

### Build

```bash
cd packages/supabase
npm run build
```

### Development Mode

```bash
npm run dev
```

### Type Checking

```bash
npm run typecheck
```

## Troubleshooting

### "DATABASE_URL environment variable is not set"

Set the `DATABASE_URL` in your `.env` file:

```bash
DATABASE_URL=postgresql://postgres:password@localhost:54322/postgres
```

### "Migration file not found"

Ensure migrations directory exists and contains properly named files:
- Format: `{version}_{name}.sql`
- Example: `20260121133000_add_pets.sql`

### "Cannot find module '@petforce/supabase'"

Build the package first:

```bash
npm run build
```

### Migration fails with transaction error

Check your SQL for syntax errors. Migrations run in transactions and will rollback on any error.

## License

MIT
