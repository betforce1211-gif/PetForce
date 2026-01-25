/**
 * Migration metadata
 */
export interface Migration {
  id: string;
  name: string;
  version: string; // Timestamp-based version (e.g., "20260121000001")
  appliedAt: Date | null;
  sql?: string;
}

/**
 * Migration execution result
 */
export interface MigrationResult {
  migration: Migration;
  success: boolean;
  error?: Error;
  executionTime: number; // milliseconds
}

/**
 * Migration history entry
 */
export interface MigrationHistory {
  version: string;
  name: string;
  appliedAt: Date;
  executionTime: number;
}

/**
 * Migration runner options
 */
export interface MigrationRunnerOptions {
  migrationsDir: string;
  tableName?: string; // Default: "migrations"
  dryRun?: boolean;
}
