/**
 * PostgreSQL column types
 */
export type PostgreSQLType =
  | 'uuid'
  | 'varchar'
  | 'text'
  | 'integer'
  | 'bigint'
  | 'smallint'
  | 'boolean'
  | 'timestamp'
  | 'timestamptz'
  | 'date'
  | 'time'
  | 'json'
  | 'jsonb'
  | 'decimal'
  | 'numeric'
  | 'real'
  | 'double precision'
  | 'serial'
  | 'bigserial';

/**
 * Column definition for table schema
 */
export interface ColumnDef {
  type: PostgreSQLType;
  length?: number;
  precision?: number;
  scale?: number;
  notNull?: boolean;
  unique?: boolean;
  primaryKey?: boolean;
  default?: string;
  references?: string; // Format: "table(column)"
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  check?: string; // CHECK constraint SQL
}

/**
 * Table schema definition
 */
export interface TableSchema {
  [columnName: string]: ColumnDef;
}

/**
 * Index options
 */
export interface IndexOptions {
  name?: string;
  unique?: boolean;
  concurrent?: boolean;
  where?: string; // Partial index condition
  using?: 'btree' | 'hash' | 'gist' | 'gin' | 'brin';
}

/**
 * Table creation options
 */
export interface CreateTableOptions {
  ifNotExists?: boolean;
  temporary?: boolean;
}

/**
 * Drop table options
 */
export interface DropTableOptions {
  cascade?: boolean;
  ifExists?: boolean;
  force?: boolean; // Required for safety
}

/**
 * Table metadata from information_schema
 */
export interface TableInfo {
  tableName: string;
  schemaName: string;
  tableType: 'BASE TABLE' | 'VIEW' | 'FOREIGN TABLE';
}

/**
 * Column metadata from information_schema
 */
export interface ColumnInfo {
  columnName: string;
  dataType: string;
  isNullable: boolean;
  columnDefault: string | null;
  characterMaximumLength: number | null;
  numericPrecision: number | null;
  numericScale: number | null;
}
