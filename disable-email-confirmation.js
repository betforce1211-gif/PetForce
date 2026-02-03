#!/usr/bin/env node
/**
 * Temporarily disable email confirmation for testing
 * Run this to test the household flow without waiting for emails
 */
require('dotenv').config();
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function disableEmailConfirmation() {
  try {
    console.log('🔧 Disabling email confirmation requirement for TESTING...\n');

    // Update Supabase auth config to not require email confirmation
    await pool.query(`
      UPDATE auth.config
      SET enable_confirmations = false
      WHERE id = 1;
    `);

    console.log('✅ Email confirmation disabled!');
    console.log('\n⚠️  IMPORTANT:');
    console.log('   - This is for TESTING ONLY');
    console.log('   - Users will auto-login after registration');
    console.log('   - Re-enable before production!');
    console.log('\n📝 To re-enable later, run:');
    console.log('   node enable-email-confirmation.js');

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nAlternative: Use Supabase Dashboard');
    console.error('1. Go to: https://supabase.com/dashboard/project/pudipylsmvhccctzqezg/auth/users');
    console.error('2. Settings → Auth → Email Auth');
    console.error('3. Uncheck "Enable email confirmations"');
    await pool.end();
    process.exit(1);
  }
}

disableEmailConfirmation();
