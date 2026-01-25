import { Pool } from 'pg';
import type {
  TableSchema,
  ColumnDef,
  IndexOptions,
  CreateTableOptions,
  DropTableOptions,
  TableInfo,
  ColumnInfo,
  QueryResult,
  DryRunResult,
} from './types';

export class DatabaseManager {
  private pool: Pool;
  private dryRun: boolean = false;

  constructor(connectionString: string, options?: { dryRun?: boolean }) {
    // Prevent usage in browser
    if (typeof window !== 'undefined') {
      throw new Error(
        'CRITICAL SECURITY ERROR: DatabaseManager cannot be used in browser. ' +
        'This class must only be used in server-side code (Node.js).'
      );
    }

    this.pool = new Pool({ connectionString });
    this.dryRun = options?.dryRun || false;
  }

  /**
   * Enable or disable dry-run mode
   */
  setDryRun(enabled: boolean): void {
    this.dryRun = enabled;
  }

  /**
   * Execute SQL with optional dry-run support
   */
  private async execute(
    sql: string,
    params: any[] = []
  ): Promise<QueryResult | DryRunResult> {
    if (this.dryRun) {
      return {
        sql,
        wouldExecute: true,
      };
    }

    const result = await this.pool.query(sql, params);
    return {
      rows: result.rows,
      rowCount: result.rowCount || 0,
      command: result.command,
    };
  }

  /**
   * Create a table with the given schema
   */
  async createTable(
    tableName: string,
    schema: TableSchema,
    options?: CreateTableOptions
  ): Promise<QueryResult | DryRunResult> {
    const sql = this.buildCreateTableSQL(tableName, schema, options);
    return this.execute(sql);
  }

  /**
   * Drop a table
   */
  async dropTable(
    tableName: string,
    options?: DropTableOptions
  ): Promise<QueryResult | DryRunResult> {
    if (!options?.force && !this.dryRun) {
      throw new Error(
        `Dropping table "${tableName}" requires --force flag for safety. ` +
        'Pass { force: true } in options to confirm.'
      );
    }

    let sql = 'DROP TABLE';
    if (options?.ifExists) {
      sql += ' IF EXISTS';
    }
    sql += ` "${tableName}"`;
    if (options?.cascade) {
      sql += ' CASCADE';
    }
    sql += ';';

    return this.execute(sql);
  }

  /**
   * Add a column to an existing table
   */
  async addColumn(
    tableName: string,
    columnName: string,
    definition: ColumnDef
  ): Promise<QueryResult | DryRunResult> {
    const columnDef = this.buildColumnDefinition(columnName, definition);
    const sql = `ALTER TABLE "${tableName}" ADD COLUMN ${columnDef};`;
    return this.execute(sql);
  }

  /**
   * Drop a column from a table
   */
  async dropColumn(
    tableName: string,
    columnName: string
  ): Promise<QueryResult | DryRunResult> {
    const sql = `ALTER TABLE "${tableName}" DROP COLUMN "${columnName}";`;
    return this.execute(sql);
  }

  /**
   * Modify a column definition
   */
  async modifyColumn(
    tableName: string,
    columnName: string,
    definition: ColumnDef
  ): Promise<QueryResult | DryRunResult> {
    const typeStr = this.buildTypeString(definition);
    const sql = `ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" TYPE ${typeStr};`;
    return this.execute(sql);
  }

  /**
   * Create an index
   */
  async createIndex(
    tableName: string,
    columns: string[],
    options?: IndexOptions
  ): Promise<QueryResult | DryRunResult> {
    const indexName =
      options?.name || `idx_${tableName}_${columns.join('_')}`;
    let sql = 'CREATE';
    if (options?.unique) {
      sql += ' UNIQUE';
    }
    sql += ' INDEX';
    if (options?.concurrent) {
      sql += ' CONCURRENTLY';
    }
    sql += ` "${indexName}" ON "${tableName}"`;
    if (options?.using) {
      sql += ` USING ${options.using}`;
    }
    sql += ` (${columns.map(c => `"${c}"`).join(', ')})`;
    if (options?.where) {
      sql += ` WHERE ${options.where}`;
    }
    sql += ';';

    return this.execute(sql);
  }

  /**
   * Drop an index
   */
  async dropIndex(indexName: string): Promise<QueryResult | DryRunResult> {
    const sql = `DROP INDEX IF EXISTS "${indexName}";`;
    return this.execute(sql);
  }

  /**
   * Apply a SQL migration file
   */
  async applyMigration(sql: string): Promise<QueryResult | DryRunResult> {
    return this.execute(sql);
  }

  /**
   * Get list of tables in the database
   */
  async getTables(): Promise<TableInfo[]> {
    const sql = `
      SELECT
        table_name as "tableName",
        table_schema as "schemaName",
        table_type as "tableType"
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;

    const result = await this.pool.query(sql);
    return result.rows;
  }

  /**
   * Get table schema information
   */
  async getTableSchema(tableName: string): Promise<TableSchema> {
    const columns = await this.getColumns(tableName);
    const schema: TableSchema = {};

    for (const col of columns) {
      schema[col.columnName] = {
        type: col.dataType as any,
        notNull: !col.isNullable,
        default: col.columnDefault || undefined,
        length: col.characterMaximumLength || undefined,
        precision: col.numericPrecision || undefined,
        scale: col.numericScale || undefined,
      };
    }

    return schema;
  }

  /**
   * Get columns for a table
   */
  async getColumns(tableName: string): Promise<ColumnInfo[]> {
    const sql = `
      SELECT
        column_name as "columnName",
        data_type as "dataType",
        is_nullable = 'YES' as "isNullable",
        column_default as "columnDefault",
        character_maximum_length as "characterMaximumLength",
        numeric_precision as "numericPrecision",
        numeric_scale as "numericScale"
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position;
    `;

    const result = await this.pool.query(sql, [tableName]);
    return result.rows;
  }

  /**
   * Build CREATE TABLE SQL
   */
  private buildCreateTableSQL(
    tableName: string,
    schema: TableSchema,
    options?: CreateTableOptions
  ): string {
    let sql = 'CREATE';
    if (options?.temporary) {
      sql += ' TEMPORARY';
    }
    sql += ' TABLE';
    if (options?.ifNotExists) {
      sql += ' IF NOT EXISTS';
    }
    sql += ` "${tableName}" (\n`;

    const columnDefs = Object.entries(schema).map(([name, def]) =>
      this.buildColumnDefinition(name, def)
    );

    sql += '  ' + columnDefs.join(',\n  ');
    sql += '\n);';

    return sql;
  }

  /**
   * Build column definition string
   */
  private buildColumnDefinition(name: string, def: ColumnDef): string {
    let sql = `"${name}" ${this.buildTypeString(def)}`;

    if (def.notNull) {
      sql += ' NOT NULL';
    }

    if (def.unique) {
      sql += ' UNIQUE';
    }

    if (def.primaryKey) {
      sql += ' PRIMARY KEY';
    }

    if (def.default !== undefined) {
      sql += ` DEFAULT ${def.default}`;
    }

    if (def.references) {
      sql += ` REFERENCES ${def.references}`;
      if (def.onDelete) {
        sql += ` ON DELETE ${def.onDelete}`;
      }
      if (def.onUpdate) {
        sql += ` ON UPDATE ${def.onUpdate}`;
      }
    }

    if (def.check) {
      sql += ` CHECK (${def.check})`;
    }

    return sql;
  }

  /**
   * Build type string with length/precision
   */
  private buildTypeString(def: ColumnDef): string {
    let typeStr = def.type.toUpperCase();

    if (def.length) {
      typeStr += `(${def.length})`;
    } else if (def.precision && def.scale !== undefined) {
      typeStr += `(${def.precision},${def.scale})`;
    } else if (def.precision) {
      typeStr += `(${def.precision})`;
    }

    return typeStr;
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}
