# Capability Spec: Software Engineering

**Status**: MODIFIED
**Change**: update-supabase-configuration
**Owner**: Engrid (Software Engineering)

## ADDED Requirements

### Requirement: Database operations SHALL use programmatic API

**Priority**: Must Have
**Complexity**: Medium
**Agent**: Engrid (Software Engineering)

Developers SHALL use TypeScript-based DatabaseManager API for creating and modifying database tables instead of manually pasting SQL into Supabase Studio.

#### Scenario: Create table with TypeScript API
- **WHEN** developer needs to create new database table
- **THEN** developer SHALL use `DatabaseManager.createTable()` method
- **AND** schema SHALL be defined as TypeScript object
- **AND** operation SHALL be tracked in version control

#### Scenario: Apply migration programmatically
- **WHEN** developer has SQL migration file
- **THEN** developer SHALL use CLI command `npm run db:migrate`
- **AND** migration SHALL be tracked in migrations table
- **AND** duplicate runs SHALL be prevented

#### Scenario: Generate TypeScript types from schema
- **WHEN** database schema changes
- **THEN** developer SHALL run `npm run db:types`
- **AND** type definitions SHALL be auto-generated
- **AND** types SHALL match current database structure

---

### Requirement: Migration workflow SHALL follow structured process

**Priority**: Must Have
**Complexity**: Low
**Agent**: Engrid (Software Engineering)

Database schema changes SHALL follow a standardized migration workflow with version control and rollback capability.

#### Scenario: Create and apply migration
- **WHEN** developer needs to modify database schema
- **THEN** developer SHALL create migration via `npm run db:migrate:new`
- **AND** edit generated migration file
- **AND** apply via `npm run db:migrate`
- **AND** generate types via `npm run db:types`

#### Scenario: Preview migration before applying
- **WHEN** developer wants to verify migration safety
- **THEN** developer SHALL use `--dry-run` flag
- **AND** SQL SHALL be displayed without execution
- **AND** developer SHALL review changes before applying

#### Scenario: Rollback failed migration
- **WHEN** migration causes issues in development
- **THEN** developer SHALL use `npm run db:migrate:rollback`
- **AND** last migration SHALL be reversed
- **AND** database SHALL return to previous state

---

### Requirement: Package structure SHALL include database management tools

**Priority**: Must Have
**Complexity**: Low
**Agent**: Engrid (Software Engineering)

The monorepo SHALL include `@petforce/supabase` package for database management functionality.

#### Scenario: Use DatabaseManager in development
- **WHEN** developer imports from `@petforce/supabase`
- **THEN** DatabaseManager, MigrationRunner, and TypeGenerator SHALL be available
- **AND** all classes SHALL have TypeScript type definitions
- **AND** package SHALL be buildable via Turborepo

#### Scenario: Execute CLI commands from root
- **WHEN** developer runs `npm run db:migrate` from root directory
- **THEN** command SHALL execute using workspace script
- **AND** Supabase credentials SHALL be loaded from environment
- **AND** output SHALL be displayed with colored formatting

---

## MODIFIED Requirements

### Requirement: Development scripts SHALL include database management commands

**Priority**: Must Have
**Complexity**: Low
**Agent**: Engrid (Software Engineering)

The root `package.json` SHALL include scripts for database management operations that are frequently used during development.

#### Scenario: Run database migrations
- **WHEN** developer executes `npm run db:migrate`
- **THEN** all pending migrations SHALL be applied
- **AND** migration status SHALL be displayed
- **AND** errors SHALL halt execution with clear message

#### Scenario: Create new migration
- **WHEN** developer executes `npm run db:migrate:new add_feature`
- **THEN** new migration file SHALL be created with timestamp
- **AND** file path SHALL be displayed
- **AND** file SHALL contain template with up/down sections

#### Scenario: View migration status
- **WHEN** developer executes `npm run db:migrate:status`
- **THEN** all migrations SHALL be listed
- **AND** applied migrations SHALL be clearly marked
- **AND** pending migrations SHALL be indicated

#### Scenario: Rollback migrations
- **WHEN** developer executes `npm run db:migrate:rollback`
- **THEN** last migration SHALL be reversed
- **WHEN** developer executes `npm run db:migrate:rollback -n 3`
- **THEN** last 3 migrations SHALL be reversed in order

#### Scenario: Generate TypeScript types
- **WHEN** developer executes `npm run db:types`
- **THEN** types SHALL be generated from current schema
- **AND** output file SHALL be created at configured path
- **AND** file SHALL be formatted with Prettier
