import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { join, basename } from 'path';
import { existsSync } from 'fs';
import { DatabaseManager } from './database-manager';
import type { Migration, MigrationResult, MigrationHistory, MigrationRunnerOptions } from './types';

export class MigrationRunner {
  private db: DatabaseManager;
  private migrationsDir: string;
  private tableName: string;
  private dryRun: boolean;

  constructor(db: DatabaseManager, options: MigrationRunnerOptions) {
    this.db = db;
    this.migrationsDir = options.migrationsDir;
    this.tableName = options.tableName || 'migrations';
    this.dryRun = options.dryRun || false;
  }

  /**
   * Ensure migrations table exists
   */
  private async ensureMigrationsTable(): Promise<void> {
    await this.db.applyMigration(`
      CREATE TABLE IF NOT EXISTS "${this.tableName}" (
        version VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT NOW(),
        execution_time INTEGER NOT NULL
      );
    `);
  }

  /**
   * Run all pending migrations
   */
  async runPending(): Promise<MigrationResult[]> {
    await this.ensureMigrationsTable();

    const pending = await this.getPendingMigrations();
    const results: MigrationResult[] = [];

    for (const migration of pending) {
      const startTime = Date.now();

      try {
        if (!this.dryRun) {
          // Apply migration
          await this.db.applyMigration(migration.sql!);

          // Record in migrations table
          const executionTime = Date.now() - startTime;
          await this.db.applyMigration(`
            INSERT INTO "${this.tableName}" (version, name, execution_time)
            VALUES ('${migration.version}', '${migration.name}', ${executionTime});
          `);

          migration.appliedAt = new Date();
        }

        results.push({
          migration,
          success: true,
          executionTime: Date.now() - startTime,
        });
      } catch (error) {
        results.push({
          migration,
          success: false,
          error: error as Error,
          executionTime: Date.now() - startTime,
        });

        // Stop on first error
        break;
      }
    }

    return results;
  }

  /**
   * Rollback last N migrations
   */
  async rollback(steps: number = 1): Promise<MigrationResult[]> {
    await this.ensureMigrationsTable();

    const applied = await this.getAppliedMigrations();
    const toRollback = applied.slice(-steps).reverse();
    const results: MigrationResult[] = [];

    for (const history of toRollback) {
      const startTime = Date.now();

      try {
        // Find migration file to get down migration
        const migrationPath = join(this.migrationsDir, `${history.version}_${history.name}.sql`);
        const content = await readFile(migrationPath, 'utf-8');
        const downSQL = this.extractDownMigration(content);

        if (!downSQL) {
          throw new Error(`No down migration found in ${basename(migrationPath)}`);
        }

        if (!this.dryRun) {
          // Apply down migration
          await this.db.applyMigration(downSQL);

          // Remove from migrations table
          await this.db.applyMigration(`
            DELETE FROM "${this.tableName}" WHERE version = '${history.version}';
          `);
        }

        results.push({
          migration: {
            id: history.version,
            name: history.name,
            version: history.version,
            appliedAt: null,
          },
          success: true,
          executionTime: Date.now() - startTime,
        });
      } catch (error) {
        results.push({
          migration: {
            id: history.version,
            name: history.name,
            version: history.version,
            appliedAt: history.appliedAt,
          },
          success: false,
          error: error as Error,
          executionTime: Date.now() - startTime,
        });

        // Stop on first error
        break;
      }
    }

    return results;
  }

  /**
   * Get migration history
   */
  async getHistory(): Promise<MigrationHistory[]> {
    await this.ensureMigrationsTable();
    return this.getAppliedMigrations();
  }

  /**
   * Generate a new migration file
   */
  async generateMigration(name: string): Promise<string> {
    // Ensure migrations directory exists
    if (!existsSync(this.migrationsDir)) {
      await mkdir(this.migrationsDir, { recursive: true });
    }

    // Generate version (timestamp)
    const version = this.generateVersion();
    const filename = `${version}_${name}.sql`;
    const filepath = join(this.migrationsDir, filename);

    // Read template
    const template = await this.getTemplate();
    const content = template
      .replace('{{name}}', name)
      .replace('{{version}}', version)
      .replace('{{date}}', new Date().toISOString().split('T')[0]);

    // Write file
    await writeFile(filepath, content, 'utf-8');

    return filepath;
  }

  /**
   * Get pending migrations
   */
  private async getPendingMigrations(): Promise<Migration[]> {
    const all = await this.getAllMigrations();
    const applied = await this.getAppliedMigrations();
    const appliedVersions = new Set(applied.map(m => m.version));

    return all.filter(m => !appliedVersions.has(m.version));
  }

  /**
   * Get all migration files
   */
  private async getAllMigrations(): Promise<Migration[]> {
    if (!existsSync(this.migrationsDir)) {
      return [];
    }

    const files = await readdir(this.migrationsDir);
    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();
    const migrations: Migration[] = [];

    for (const file of sqlFiles) {
      const match = file.match(/^(\d+)_(.+)\.sql$/);
      if (!match) continue;

      const [, version, name] = match;
      const filepath = join(this.migrationsDir, file);
      const sql = await readFile(filepath, 'utf-8');
      const upSQL = this.extractUpMigration(sql);

      migrations.push({
        id: version,
        name,
        version,
        appliedAt: null,
        sql: upSQL,
      });
    }

    return migrations;
  }

  /**
   * Get applied migrations from database
   */
  private async getAppliedMigrations(): Promise<MigrationHistory[]> {
    const result = await this.db['pool'].query(`
      SELECT version, name, applied_at as "appliedAt", execution_time as "executionTime"
      FROM "${this.tableName}"
      ORDER BY version ASC;
    `);

    return result.rows;
  }

  /**
   * Extract up migration from file content
   */
  private extractUpMigration(content: string): string {
    const upMatch = content.match(/-- Up Migration\s+([\s\S]*?)(?:-- Down Migration|$)/);
    return upMatch ? upMatch[1].trim() : content;
  }

  /**
   * Extract down migration from file content
   */
  private extractDownMigration(content: string): string | null {
    const downMatch = content.match(/-- Down Migration\s+([\s\S]*?)$/);
    return downMatch ? downMatch[1].trim() : null;
  }

  /**
   * Generate version string (timestamp)
   */
  private generateVersion(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hour}${minute}${second}`;
  }

  /**
   * Get migration template
   */
  private async getTemplate(): Promise<string> {
    return `-- Migration: {{name}}
-- Created: {{date}}
-- Version: {{version}}

-- Up Migration
-- Add your up migration SQL here


-- Down Migration (for rollback)
-- Add your down migration SQL here

`;
  }
}
