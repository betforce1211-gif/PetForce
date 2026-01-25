/**
 * Database connection options
 */
export interface DatabaseConfig {
  supabaseUrl: string;
  supabaseSecretKey: string;
  connectionString?: string;
}

/**
 * Query result with row data
 */
export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
  command: string;
}

/**
 * Transaction options
 */
export interface TransactionOptions {
  isolationLevel?: 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';
}

/**
 * Dry-run result
 */
export interface DryRunResult {
  sql: string;
  wouldExecute: boolean;
  estimatedAffectedRows?: number;
}
