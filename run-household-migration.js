#!/usr/bin/env node
/**
 * Emergency Script: Run Household Migration
 *
 * This script runs the household system migration against the Supabase database.
 * Critical oversight: The migration file existed but was never executed.
 */

const fs = require('fs');
const https = require('https');
const { URL } = require('url');

// Load environment variables
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env');
  process.exit(1);
}

// Parse connection string
const dbUrl = new URL(DATABASE_URL);
const host = dbUrl.hostname;
const database = dbUrl.pathname.slice(1);
const username = dbUrl.username;
const password = dbUrl.password;
const port = dbUrl.port || '5432';

console.log('🚀 Running Household System Migration');
console.log(`📊 Database: ${database}@${host}`);
console.log('');

// Read migration file
const migrationPath = './packages/auth/migrations/002_households_system.sql';
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

console.log('📄 Migration file loaded');
console.log(`   Path: ${migrationPath}`);
console.log(`   Size: ${(migrationSQL.length / 1024).toFixed(2)} KB`);
console.log('');

// Use Supabase's SQL API
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

// Use pg library directly (most reliable)
try {
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: DATABASE_URL });

  console.log('⏳ Executing migration via PostgreSQL...\n');

  pool.query(migrationSQL)
    .then((result) => {
      console.log('✅ Migration completed successfully!\n');
      console.log('📋 Tables created:');
      console.log('   - households');
      console.log('   - household_members');
      console.log('   - household_join_requests');
      console.log('\n📋 Indexes created: 12');
      console.log('📋 RLS Policies created: 13');
      console.log('\n🎉 Household system is now ready!');
      pool.end();
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error.message);
      console.error('\nError details:', error);
      pool.end();
      process.exit(1);
    });
} catch (pgError) {
  console.error('❌ pg library not available');
  console.error('   Install with: npm install pg');
  console.error('   Or use Supabase dashboard to run migration manually');
  console.error('\n📋 Copy this SQL and run it in Supabase SQL Editor:');
  console.error('   Dashboard → SQL Editor → New Query → Paste → Run');
  process.exit(1);
}
