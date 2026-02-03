#!/usr/bin/env node
/**
 * Verify Household Tables Exist
 */
require('dotenv').config();
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function verify() {
  try {
    // Check households table
    const householdsResult = await pool.query(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'households'
      ORDER BY ordinal_position;
    `);

    // Check household_members table
    const membersResult = await pool.query(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'household_members'
      ORDER BY ordinal_position;
    `);

    // Check household_join_requests table
    const requestsResult = await pool.query(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'household_join_requests'
      ORDER BY ordinal_position;
    `);

    console.log('📊 HOUSEHOLD TABLES VERIFICATION\n');

    if (householdsResult.rows.length === 0) {
      console.log('❌ households table: NOT FOUND');
    } else {
      console.log(`✅ households table: EXISTS (${householdsResult.rows.length} columns)`);
    }

    if (membersResult.rows.length === 0) {
      console.log('❌ household_members table: NOT FOUND');
    } else {
      console.log(`✅ household_members table: EXISTS (${membersResult.rows.length} columns)`);
    }

    if (requestsResult.rows.length === 0) {
      console.log('❌ household_join_requests table: NOT FOUND');
    } else {
      console.log(`✅ household_join_requests table: EXISTS (${requestsResult.rows.length} columns)`);
    }

    console.log('\n📋 All columns in households:');
    householdsResult.rows.forEach(row => {
      console.log(`   - ${row.column_name} (${row.data_type})`);
    });

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

verify();
