# Implementation Tasks: Update Supabase Configuration

## Overview

This document outlines tasks for migrating to Supabase's new key system and implementing a database management API.

## Task Organization

- **Part 1**: Key Migration (backward compatible)
- **Part 2**: Database Management API
- **Part 3**: Testing & Documentation

---

## Part 1: Key System Migration

### 1.1 Update Environment Configuration
- [ ] Update root `.env.example` with new key names
- [ ] Update `apps/web/.env.example` with new key names
- [ ] Add deprecation warnings for legacy keys
- [ ] Document key migration process
- [ ] Create migration guide for developers

### 1.2 Update Supabase Client (packages/auth)
- [ ] Add key detection logic (`getClientKey`, `getServerKey`)
- [ ] Update `createSupabaseClient` to accept `publishableKey` parameter
- [ ] Add backward compatibility for `anonKey` (with warning)
- [ ] Create `createSupabaseAdminClient` for server-side operations
- [ ] Add browser prevention check for secret keys
- [ ] Update exports in `packages/auth/src/index.ts`
- [ ] Write unit tests for key detection logic

### 1.3 Update Web App Configuration
- [ ] Update `apps/web/src/App.tsx` to use new env var names
- [ ] Add fallback to legacy keys
- [ ] Test with new publishable key
- [ ] Test with legacy anon key (backward compatibility)
- [ ] Verify browser console shows deprecation warning for legacy keys

### 1.4 Update Documentation
- [ ] Update `README.md` with new key setup instructions
- [ ] Update `GETTING-STARTED.md` with new key configuration
- [ ] Update `PROJECT-STATUS.md` to reflect key system update
- [ ] Add migration guide (`MIGRATING-TO-NEW-KEYS.md`)
- [ ] Update all code examples to use publishable/secret keys

---

## Part 2: Database Management API

### 2.1 Create @petforce/supabase Package
- [ ] Create `packages/supabase/` directory structure
- [ ] Create `package.json` with dependencies (pg, commander, etc.)
- [ ] Create `tsconfig.json` for package
- [ ] Set up exports in `src/index.ts`

### 2.2 Implement Schema Types
- [ ] Create `src/types/schema.ts` (TableSchema, ColumnDef, etc.)
- [ ] Create `src/types/migration.ts` (Migration, MigrationResult)
- [ ] Create `src/types/database.ts` (TableInfo, ColumnInfo)
- [ ] Add JSDoc documentation for all types

### 2.3 Implement DatabaseManager Class
- [ ] Create `src/database-manager.ts`
- [ ] Implement constructor with secret key validation
- [ ] Implement `createTable(name, schema)` method
- [ ] Implement `dropTable(name, options)` method with --force protection
- [ ] Implement `addColumn(table, column, definition)` method
- [ ] Implement `dropColumn(table, column)` method
- [ ] Implement `modifyColumn(table, column, definition)` method
- [ ] Implement `createIndex(table, columns, options)` method
- [ ] Implement `dropIndex(name)` method
- [ ] Implement `applyMigration(filePath)` method
- [ ] Implement `getTables()` method
- [ ] Implement `getTableSchema(name)` method
- [ ] Implement `getColumns(table)` method
- [ ] Add SQL generation helpers (buildCreateTableSQL, etc.)
- [ ] Add transaction support for all operations
- [ ] Add dry-run mode
- [ ] Write unit tests for SQL generation
- [ ] Write integration tests for database operations

### 2.4 Implement MigrationRunner Class
- [ ] Create `src/migration-runner.ts`
- [ ] Implement constructor with migrations directory path
- [ ] Implement `runPending()` method
- [ ] Implement `rollback(steps)` method
- [ ] Implement `getHistory()` method
- [ ] Implement `generateMigration(name)` method
- [ ] Implement `getPendingMigrations()` private method
- [ ] Implement `getAllMigrations()` private method
- [ ] Implement `getAppliedMigrations()` private method
- [ ] Create migration template file (`templates/migration.sql.template`)
- [ ] Create migrations tracking table schema
- [ ] Write unit tests for migration logic
- [ ] Write integration tests for migration runs

### 2.5 Implement TypeGenerator Class
- [ ] Create `src/type-generator.ts`
- [ ] Implement constructor
- [ ] Implement `generateTypes(outputPath)` method
- [ ] Implement `postgresTypeToTS(pgType)` conversion map
- [ ] Generate Database interface structure
- [ ] Generate Row types for each table
- [ ] Generate Insert types (omit auto-generated fields)
- [ ] Generate Update types (all optional)
- [ ] Add formatting with prettier
- [ ] Write unit tests for type conversion
- [ ] Write integration tests for type generation

### 2.6 Implement CLI Tool
- [ ] Create `src/cli.ts` with commander setup
- [ ] Implement `migrate` command (run pending migrations)
- [ ] Implement `migrate:new <name>` command (create migration file)
- [ ] Implement `rollback` command with -n flag
- [ ] Implement `migrate:status` command (show history)
- [ ] Implement `types` command with -o flag
- [ ] Add --dry-run flag to migrate command
- [ ] Add --force flag to rollback command
- [ ] Add colored output with chalk
- [ ] Add progress indicators
- [ ] Make CLI executable (`chmod +x`)
- [ ] Test all CLI commands

### 2.7 Add Package Scripts
- [ ] Add `db:migrate` script to root `package.json`
- [ ] Add `db:migrate:new` script
- [ ] Add `db:migrate:rollback` script
- [ ] Add `db:migrate:status` script
- [ ] Add `db:types` script
- [ ] Test all scripts work from root directory

### 2.8 Create Helper Functions
- [ ] Create `src/schema-builder.ts` for SQL generation
- [ ] Create column definition builder
- [ ] Create constraint builder (PRIMARY KEY, FOREIGN KEY, etc.)
- [ ] Create index builder
- [ ] Add SQL escaping/sanitization
- [ ] Write unit tests for SQL builders

---

## Part 3: Testing & Documentation

### 3.1 Testing
- [ ] Write unit tests for key detection (packages/auth)
- [ ] Write unit tests for DatabaseManager SQL generation
- [ ] Write unit tests for MigrationRunner logic
- [ ] Write unit tests for TypeGenerator
- [ ] Write integration tests for database operations (create, modify, drop)
- [ ] Write integration tests for migration runs
- [ ] Write integration tests for type generation
- [ ] Write E2E test for full migration workflow
- [ ] Test backward compatibility with legacy keys
- [ ] Test secret key browser prevention
- [ ] Test destructive operation protection (--force required)
- [ ] Achieve 90%+ test coverage

### 3.2 Security Testing
- [ ] Verify secret keys fail in browser
- [ ] Verify SQL injection prevention
- [ ] Verify transaction rollback on error
- [ ] Test --force flag protection in production
- [ ] Security review by Samantha

### 3.3 Documentation
- [ ] Create `packages/supabase/README.md` with API docs
- [ ] Document DatabaseManager API with examples
- [ ] Document MigrationRunner API with examples
- [ ] Document CLI commands with examples
- [ ] Create migration guide (`docs/MIGRATIONS.md`)
- [ ] Create key migration guide (`docs/MIGRATING-TO-NEW-KEYS.md`)
- [ ] Update main README with database management section
- [ ] Update GETTING-STARTED with database setup
- [ ] Add troubleshooting guide
- [ ] Add example migration files
- [ ] Add example seed scripts

### 3.4 Example Implementations
- [ ] Create example migration (`examples/migrations/add_pets_table.sql`)
- [ ] Create example seed script (`examples/seed.ts`)
- [ ] Create example DatabaseManager usage
- [ ] Create example type generation workflow
- [ ] Test all examples work

---

## Dependencies

**Sequential**:
- Part 1 must complete before Part 2 (keys needed for database API)
- 2.1-2.2 must complete before 2.3-2.5 (types needed for classes)
- 2.3-2.5 must complete before 2.6 (CLI uses classes)
- Implementation must complete before testing (Part 3)

**Parallel Opportunities**:
- Key migration (1.x) and package setup (2.1-2.2) can run in parallel
- DatabaseManager, MigrationRunner, TypeGenerator (2.3-2.5) can be developed in parallel after types are done
- Documentation can be written as features complete

**External Dependencies**:
- New Supabase keys (must be generated in Supabase Dashboard)
- PostgreSQL client library (pg)
- Commander for CLI
- Supabase Management API access

---

## Validation Criteria

Each task is complete when:
- Code written and linted
- Unit tests written and passing
- Integration tests passing (where applicable)
- Documentation updated
- Security review passed (for sensitive operations)
- Manual testing verified

---

## Success Metrics

**Key Migration Complete When**:
- All code uses new publishable/secret key parameters
- Legacy keys still work (backward compatible)
- Deprecation warnings shown for legacy keys
- Documentation updated
- No breaking changes for existing users

**Database API Complete When**:
- Can create tables via TypeScript API
- Can apply SQL migrations programmatically
- Can generate TypeScript types from schema
- CLI commands work for common operations
- All tests passing (90%+ coverage)
- Secret key protection working
- Documentation complete with examples

---

**Tasks Owner**: Engrid (Software Engineering) coordinates, Isabel (Infrastructure) assists
**Total Tasks**: ~100 tasks across 3 parts
**Critical Path**: Part 1 → Part 2 (types) → Part 2 (classes) → Part 2 (CLI) → Part 3
