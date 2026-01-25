# Capability Spec: Database Management

**Status**: ADDED
**Change**: update-supabase-configuration
**Owner**: Engrid (Software Engineering), Isabel (Infrastructure)

## ADDED Requirements

### Requirement: Database Manager SHALL provide programmatic table operations

**Priority**: Must Have
**Complexity**: High
**Agent**: Engrid (Software Engineering)

The system SHALL provide a `DatabaseManager` class that enables programmatic creation, modification, and deletion of database tables through a TypeScript API using Supabase secret keys.

#### Scenario: Create table with schema definition
- **WHEN** developer calls `db.createTable('pets', schema)` with valid schema
- **THEN** table SHALL be created with specified columns and constraints
- **AND** operation SHALL complete in a transaction
- **AND** schema SHALL be validated before execution

#### Scenario: Drop table with cascade support
- **WHEN** developer calls `db.dropTable('pets', { cascade: true, force: true })`
- **THEN** table and all dependent objects SHALL be removed
- **AND** `--force` flag MUST be required for destructive operations
- **AND** operation SHALL fail if force flag is missing

#### Scenario: Add column to existing table
- **WHEN** developer calls `db.addColumn('pets', 'breed', columnDef)`
- **THEN** new column SHALL be added to table
- **AND** existing data SHALL remain intact
- **AND** operation SHALL complete in a transaction

#### Scenario: Prevent client-side usage
- **WHEN** DatabaseManager is instantiated in browser environment
- **THEN** constructor SHALL throw error
- **AND** error message SHALL indicate security violation
- **AND** secret key SHALL never be exposed

---

### Requirement: Migration Runner SHALL manage database schema changes

**Priority**: Must Have
**Complexity**: High
**Agent**: Engrid (Software Engineering)

The system SHALL provide a `MigrationRunner` class that tracks and applies database migrations sequentially with rollback support.

#### Scenario: Run all pending migrations
- **WHEN** developer calls `runner.runPending()`
- **THEN** system SHALL identify all unapplied migrations
- **AND** migrations SHALL execute in chronological order
- **AND** each migration SHALL be tracked in migrations table
- **AND** duplicate runs SHALL be prevented

#### Scenario: Rollback migrations
- **WHEN** developer calls `runner.rollback(2)`
- **THEN** last 2 migrations SHALL be reversed
- **AND** rollback operations SHALL execute in reverse order
- **AND** migrations table SHALL be updated

#### Scenario: Migration failure handling
- **WHEN** migration fails during execution
- **THEN** transaction SHALL automatically rollback
- **AND** migrations table SHALL not be updated
- **AND** error SHALL include migration name and SQL details

#### Scenario: Generate new migration file
- **WHEN** developer calls `runner.generateMigration('add_pets')`
- **THEN** new migration file SHALL be created with timestamp
- **AND** file SHALL use template with up/down sections
- **AND** file path SHALL be returned

---

### Requirement: Type Generator SHALL create TypeScript types from schema

**Priority**: Should Have
**Complexity**: Medium
**Agent**: Engrid (Software Engineering)

The system SHALL generate TypeScript type definitions from PostgreSQL database schema.

#### Scenario: Generate types for all tables
- **WHEN** developer calls `typeGen.generateTypes(outputPath)`
- **THEN** Database interface SHALL be created with all tables
- **AND** Row types SHALL match exact database structure
- **AND** Insert types SHALL omit auto-generated fields
- **AND** Update types SHALL have all fields optional

#### Scenario: Map PostgreSQL types to TypeScript
- **WHEN** generating types for uuid column
- **THEN** type SHALL be mapped to `string`
- **WHEN** generating types for varchar column
- **THEN** type SHALL be mapped to `string`
- **WHEN** generating types for integer column
- **THEN** type SHALL be mapped to `number`
- **WHEN** generating types for boolean column
- **THEN** type SHALL be mapped to `boolean`

#### Scenario: Format generated output
- **WHEN** types are generated
- **THEN** output SHALL be formatted with Prettier
- **AND** file SHALL include import statements
- **AND** file SHALL be written to specified path

---

### Requirement: CLI Tool SHALL provide database management commands

**Priority**: Must Have
**Complexity**: Medium
**Agent**: Engrid (Software Engineering)

The system SHALL provide command-line interface for database operations using Commander framework.

#### Scenario: Run migrations via CLI
- **WHEN** user executes `npm run db:migrate`
- **THEN** all pending migrations SHALL be applied
- **AND** progress SHALL be shown with colored output
- **AND** success/failure status SHALL be reported

#### Scenario: Create new migration via CLI
- **WHEN** user executes `npm run db:migrate:new add_pets`
- **THEN** migration file SHALL be created with name and timestamp
- **AND** file path SHALL be printed to console

#### Scenario: View migration status via CLI
- **WHEN** user executes `npm run db:migrate:status`
- **THEN** all migrations SHALL be listed
- **AND** applied migrations SHALL be marked
- **AND** pending migrations SHALL be indicated

#### Scenario: Dry-run migration preview
- **WHEN** user executes `npm run db:migrate --dry-run`
- **THEN** migrations SHALL be parsed
- **AND** SQL SHALL be displayed
- **AND** no changes SHALL be applied to database

---

### Requirement: Schema Builders SHALL generate valid SQL

**Priority**: Should Have
**Complexity**: Low
**Agent**: Engrid (Software Engineering)

The system SHALL provide helper functions for building SQL schema definitions programmatically.

#### Scenario: Build column definition
- **WHEN** developer uses `ColumnBuilder('email').type('varchar', 255).notNull().unique()`
- **THEN** valid SQL column definition SHALL be generated
- **AND** constraints SHALL be properly formatted
- **AND** SQL SHALL be escaped to prevent injection

#### Scenario: Build index definition
- **WHEN** developer uses `IndexBuilder('users').columns(['email']).unique()`
- **THEN** valid CREATE INDEX statement SHALL be generated
- **AND** index name SHALL be auto-generated if not provided
- **AND** options SHALL be properly formatted

#### Scenario: Validate before generation
- **WHEN** invalid schema definition is provided
- **THEN** validation error SHALL be thrown
- **AND** error message SHALL indicate specific issue
- **AND** SQL generation SHALL not proceed
