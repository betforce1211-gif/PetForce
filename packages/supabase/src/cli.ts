#!/usr/bin/env node

import { config } from 'dotenv';
import { resolve } from 'path';
import { Command } from 'commander';
import chalk from 'chalk';
import { DatabaseManager } from './database-manager';
import { MigrationRunner } from './migration-runner';
import { TypeGenerator } from './type-generator';

// Load .env from project root
config({ path: resolve(process.cwd(), '.env') });

const program = new Command();

program
  .name('supabase-cli')
  .description('Database management CLI for PetForce')
  .version('0.1.0');

/**
 * Get database connection string from environment
 */
function getConnectionString(): string {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error(chalk.red('Error: DATABASE_URL environment variable is not set'));
    console.error(chalk.yellow('Please set DATABASE_URL in your .env file'));
    process.exit(1);
  }

  return connectionString;
}

/**
 * Migrate command - run pending migrations
 */
program
  .command('migrate')
  .description('Run all pending migrations')
  .option('--dry-run', 'Preview migrations without executing')
  .action(async (options) => {
    console.log(chalk.blue('Running migrations...'));

    const connectionString = getConnectionString();
    const db = new DatabaseManager(connectionString, { dryRun: options.dryRun });
    const runner = new MigrationRunner(db, {
      migrationsDir: './supabase/migrations',
      dryRun: options.dryRun,
    });

    try {
      const results = await runner.runPending();

      if (results.length === 0) {
        console.log(chalk.green('✓ No pending migrations'));
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (const result of results) {
        if (result.success) {
          successCount++;
          console.log(
            chalk.green(`✓ ${result.migration.version}_${result.migration.name} (${result.executionTime}ms)`)
          );
        } else {
          failCount++;
          console.log(
            chalk.red(`✗ ${result.migration.version}_${result.migration.name} - ${result.error?.message}`)
          );
        }
      }

      console.log();
      console.log(
        chalk.blue(`Migrations complete: ${successCount} applied, ${failCount} failed`)
      );

      await db.close();
      process.exit(failCount > 0 ? 1 : 0);
    } catch (error) {
      console.error(chalk.red('Migration failed:'), error);
      await db.close();
      process.exit(1);
    }
  });

/**
 * Migrate:new command - create new migration
 */
program
  .command('migrate:new <name>')
  .description('Create a new migration file')
  .action(async (name) => {
    console.log(chalk.blue(`Creating migration: ${name}`));

    const connectionString = getConnectionString();
    const db = new DatabaseManager(connectionString);
    const runner = new MigrationRunner(db, {
      migrationsDir: './supabase/migrations',
    });

    try {
      const filepath = await runner.generateMigration(name);
      console.log(chalk.green(`✓ Created migration: ${filepath}`));
      await db.close();
    } catch (error) {
      console.error(chalk.red('Failed to create migration:'), error);
      await db.close();
      process.exit(1);
    }
  });

/**
 * Migrate:status command - show migration history
 */
program
  .command('migrate:status')
  .description('Show migration status')
  .action(async () => {
    console.log(chalk.blue('Migration history:'));

    const connectionString = getConnectionString();
    const db = new DatabaseManager(connectionString);
    const runner = new MigrationRunner(db, {
      migrationsDir: './supabase/migrations',
    });

    try {
      const history = await runner.getHistory();

      if (history.length === 0) {
        console.log(chalk.yellow('No migrations have been applied'));
        await db.close();
        return;
      }

      console.log();
      for (const entry of history) {
        console.log(
          chalk.green(`✓ ${entry.version}_${entry.name}`) +
          chalk.gray(` - ${entry.appliedAt.toISOString()} (${entry.executionTime}ms)`)
        );
      }

      console.log();
      console.log(chalk.blue(`Total: ${history.length} migrations applied`));
      await db.close();
    } catch (error) {
      console.error(chalk.red('Failed to get migration status:'), error);
      await db.close();
      process.exit(1);
    }
  });

/**
 * Rollback command - rollback migrations
 */
program
  .command('rollback')
  .description('Rollback the last migration(s)')
  .option('-n, --steps <number>', 'Number of migrations to rollback', '1')
  .option('--force', 'Force rollback without confirmation')
  .action(async (options) => {
    const steps = parseInt(options.steps, 10);

    if (!options.force) {
      console.log(chalk.yellow(`Warning: This will rollback the last ${steps} migration(s)`));
      console.log(chalk.yellow('Use --force to confirm'));
      process.exit(1);
    }

    console.log(chalk.blue(`Rolling back last ${steps} migration(s)...`));

    const connectionString = getConnectionString();
    const db = new DatabaseManager(connectionString);
    const runner = new MigrationRunner(db, {
      migrationsDir: './supabase/migrations',
    });

    try {
      const results = await runner.rollback(steps);

      let successCount = 0;
      let failCount = 0;

      for (const result of results) {
        if (result.success) {
          successCount++;
          console.log(
            chalk.green(`✓ Rolled back ${result.migration.version}_${result.migration.name}`)
          );
        } else {
          failCount++;
          console.log(
            chalk.red(`✗ Failed to rollback ${result.migration.version}_${result.migration.name} - ${result.error?.message}`)
          );
        }
      }

      console.log();
      console.log(
        chalk.blue(`Rollback complete: ${successCount} rolled back, ${failCount} failed`)
      );

      await db.close();
      process.exit(failCount > 0 ? 1 : 0);
    } catch (error) {
      console.error(chalk.red('Rollback failed:'), error);
      await db.close();
      process.exit(1);
    }
  });

/**
 * Types command - generate TypeScript types
 */
program
  .command('types')
  .description('Generate TypeScript types from database schema')
  .option('-o, --output <path>', 'Output file path', './src/types/database.ts')
  .action(async (options) => {
    console.log(chalk.blue('Generating TypeScript types...'));

    const connectionString = getConnectionString();
    const db = new DatabaseManager(connectionString);
    const generator = new TypeGenerator(db);

    try {
      await generator.generateTypes(options.output);
      console.log(chalk.green(`✓ Types generated: ${options.output}`));
      await db.close();
    } catch (error) {
      console.error(chalk.red('Failed to generate types:'), error);
      await db.close();
      process.exit(1);
    }
  });

program.parse();
