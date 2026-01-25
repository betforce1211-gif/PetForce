# Capability Spec: Infrastructure

**Status**: MODIFIED
**Change**: update-supabase-configuration
**Owner**: Isabel (Infrastructure)

## MODIFIED Requirements

### Requirement: Supabase client SHALL support new publishable and secret keys

**Priority**: Must Have
**Complexity**: Medium
**Agent**: Isabel (Infrastructure), Engrid (Software Engineering)

The system SHALL support Supabase's new key system (publishable/secret keys) while maintaining backward compatibility with legacy anon/service_role keys during the transition period until late 2026.

#### Scenario: Initialize client with new publishable key
- **WHEN** `createSupabaseClient()` is called with publishable key starting with `sb_publishable_`
- **THEN** client SHALL be created using new key
- **AND** no deprecation warning SHALL be shown
- **AND** client SHALL have appropriate RLS-enabled permissions

#### Scenario: Initialize client with legacy anon key
- **WHEN** `createSupabaseClient()` is called with legacy key starting with `eyJh`
- **AND** no publishable key is provided
- **THEN** client SHALL be created using legacy key
- **AND** deprecation warning SHALL be logged to console
- **AND** warning SHALL indicate migration to publishable key

#### Scenario: Initialize admin client with new secret key
- **WHEN** `createSupabaseAdminClient()` is called with secret key starting with `sb_secret_`
- **THEN** client SHALL be created with admin privileges
- **AND** client SHALL bypass Row Level Security
- **AND** no deprecation warning SHALL be shown

#### Scenario: Initialize admin client with legacy service role key
- **WHEN** `createSupabaseAdminClient()` is called with legacy service_role key
- **AND** no secret key is provided
- **THEN** client SHALL be created using legacy key
- **AND** deprecation warning SHALL be logged
- **AND** warning SHALL indicate migration deadline (late 2026)

#### Scenario: Prevent secret key usage in browser
- **WHEN** `createSupabaseAdminClient()` is called in browser environment
- **AND** secret key is provided
- **THEN** function SHALL throw security error
- **AND** error message SHALL indicate critical security violation
- **AND** client SHALL not be created

#### Scenario: Missing keys error handling
- **WHEN** `createSupabaseClient()` is called without valid keys
- **THEN** error SHALL be thrown
- **AND** error message SHALL indicate no valid key found
- **AND** error SHALL suggest checking environment variables

---

### Requirement: Environment variables SHALL use new key naming convention

**Priority**: Must Have
**Complexity**: Low
**Agent**: Isabel (Infrastructure)

Environment configuration files SHALL include new Supabase key variable names with legacy keys commented out as optional fallback.

#### Scenario: Configure new keys for client-side
- **WHEN** developer sets up web app environment
- **THEN** `VITE_SUPABASE_PUBLISHABLE_KEY` SHALL be primary variable
- **AND** `VITE_SUPABASE_ANON_KEY` MAY be included as fallback
- **AND** legacy key SHALL be commented in examples

#### Scenario: Configure new keys for server-side
- **WHEN** developer sets up server environment
- **THEN** `SUPABASE_SECRET_KEY` SHALL be primary variable
- **AND** `SUPABASE_SERVICE_ROLE_KEY` MAY be included as fallback
- **AND** secret key SHALL never be prefixed with `VITE_`

#### Scenario: Local development with Supabase CLI
- **WHEN** developer runs `supabase start`
- **THEN** both new and legacy keys SHALL be displayed in output
- **AND** developer SHALL use new keys for configuration
- **AND** legacy keys SHALL be available for backward compatibility testing

---

### Requirement: Key detection SHALL prefer new keys over legacy

**Priority**: Must Have
**Complexity**: Low
**Agent**: Engrid (Software Engineering)

The key detection logic SHALL prioritize new publishable/secret keys and only fall back to legacy keys when new keys are not available.

#### Scenario: Both new and legacy keys present
- **WHEN** both `publishableKey` (sb_publishable_) and `anonKey` (eyJh) are provided
- **THEN** publishable key SHALL be used
- **AND** legacy key SHALL be ignored
- **AND** no warning SHALL be shown

#### Scenario: Only legacy key present
- **WHEN** only `anonKey` is provided
- **AND** `publishableKey` is undefined
- **THEN** legacy key SHALL be used
- **AND** deprecation warning SHALL be shown

#### Scenario: Only new key present
- **WHEN** only `publishableKey` is provided
- **THEN** publishable key SHALL be used
- **AND** no fallback SHALL occur
- **AND** no warning SHALL be shown

---

### Requirement: Database management SHALL use secret keys securely

**Priority**: Must Have
**Complexity**: Medium
**Agent**: Engrid (Software Engineering), Isabel (Infrastructure)

Database management operations (DatabaseManager, migrations) SHALL use Supabase secret keys with proper security validation.

#### Scenario: DatabaseManager with secret key
- **WHEN** `DatabaseManager` is instantiated with secret key
- **AND** environment is server-side (Node.js)
- **THEN** instance SHALL be created successfully
- **AND** instance SHALL have admin database access
- **AND** operations SHALL bypass Row Level Security

#### Scenario: DatabaseManager in browser environment
- **WHEN** `DatabaseManager` is instantiated in browser
- **THEN** constructor SHALL throw security error immediately
- **AND** error SHALL prevent any database operations
- **AND** secret key SHALL not be exposed

#### Scenario: CLI reads secret key from environment
- **WHEN** migration CLI command is executed
- **THEN** `SUPABASE_SECRET_KEY` SHALL be read from process.env
- **AND** legacy `SUPABASE_SERVICE_ROLE_KEY` SHALL be fallback
- **AND** error SHALL be thrown if neither is present

---

### Requirement: Migration from legacy to new keys SHALL be seamless

**Priority**: Must Have
**Complexity**: Low
**Agent**: Isabel (Infrastructure)

Projects SHALL be able to migrate from legacy keys to new keys without breaking changes or downtime.

#### Scenario: Add new keys alongside legacy
- **WHEN** developer adds `SUPABASE_PUBLISHABLE_KEY` to environment
- **AND** keeps `SUPABASE_ANON_KEY` present
- **THEN** application SHALL use new key
- **AND** application SHALL continue to function
- **AND** legacy key SHALL be ignored

#### Scenario: Remove legacy keys after migration
- **WHEN** developer removes `SUPABASE_ANON_KEY` from environment
- **AND** `SUPABASE_PUBLISHABLE_KEY` is present
- **THEN** application SHALL continue to function
- **AND** no errors SHALL occur
- **AND** no deprecation warnings SHALL appear

#### Scenario: Generate new keys in Supabase dashboard
- **WHEN** developer opens Supabase project settings
- **THEN** both legacy and new keys SHALL be visible
- **AND** new keys SHALL be clearly marked as recommended
- **AND** developer SHALL be able to copy new keys

---

### Requirement: Documentation SHALL guide key migration

**Priority**: Must Have
**Complexity**: Low
**Agent**: Thomas (Documentation), Isabel (Infrastructure)

All setup and configuration documentation SHALL explain new key system and provide migration guidance.

#### Scenario: New project setup documentation
- **WHEN** developer reads getting started guide
- **THEN** new key variables SHALL be shown as primary option
- **AND** examples SHALL use `SUPABASE_PUBLISHABLE_KEY`
- **AND** legacy keys SHALL be mentioned as optional fallback

#### Scenario: Migration guide for existing projects
- **WHEN** developer reads migration documentation
- **THEN** step-by-step migration process SHALL be provided
- **AND** backward compatibility approach SHALL be explained
- **AND** deadline (late 2026) SHALL be clearly stated

#### Scenario: Security best practices documentation
- **WHEN** developer reads security documentation
- **THEN** secret key protection SHALL be emphasized
- **AND** browser prevention SHALL be explained
- **AND** proper environment variable naming SHALL be shown
